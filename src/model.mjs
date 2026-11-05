import { clamp, mean, weightedGini, lowerTailMean, allocate } from './math.mjs';
import { CATEGORIES } from './config.mjs';

export function resolvePolicies(candidate, catalog) {
  const policies = {};
  for (const category of CATEGORIES) {
    policies[category] = catalog[category].find(p => p.id === candidate.policies[category]);
    if (!policies[category]) throw new Error(`Unknown ${category}: ${candidate.policies[category]}`);
  }
  return policies;
}

export function structuralProblems(candidate, config, catalog) {
  const policies = resolvePolicies(candidate, catalog);
  const problems = [];
  if (policies.defense.alliance && !config.city.allianceAvailable) problems.push('No external defense agreement is available in this setting');
  for (const key of Object.keys(candidate.policies)) if (!CATEGORIES.includes(key)) problems.push(`Unknown policy category ${key}`);
  for (const key of Object.keys(candidate.settings)) if (!Object.hasOwn(config.decisionBounds, key)) problems.push(`Unknown setting ${key}`);
  for (const [key, bounds] of Object.entries(config.decisionBounds)) {
    const value = candidate.settings[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < bounds[0] - 1e-9 || value > bounds[1] + 1e-9) problems.push(`${key} is outside its decision bounds`);
  }
  return problems;
}

export function initialCohorts(population, assumptions) {
  const p = assumptions.population;
  const cohorts = [];
  let start = 0;
  for (let band = 0; band < p.ageBandEnds.length; band++) {
    const end = p.ageBandEnds[band];
    for (let age = start; age <= end; age++) cohorts.push(population * p.initialAgeBandWeights[band] / (end - start + 1));
    start = end + 1;
  }
  return cohorts;
}

export function advancePopulation(cohorts, fertility, health, assumptions) {
  const p = assumptions.population;
  const fertileWomen = cohorts.slice(p.fertileAgeStart, p.fertileAgeEnd + 1).reduce((a, b) => a + b, 0) * p.femaleShare;
  const births = fertileWomen * fertility / (p.fertileAgeEnd - p.fertileAgeStart + 1);
  const next = new Array(cohorts.length).fill(0);
  next[0] = births;
  let deaths = 0;
  let band = 0;
  for (let age = 0; age < cohorts.length; age++) {
    while (age > p.ageBandEnds[band]) band++;
    const mortality = clamp(p.ageBandMortality[band] * (1.5 - 0.7 * health));
    const survivors = cohorts[age] * (1 - mortality);
    deaths += cohorts[age] - survivors;
    // Terminal cohort is open-ended (99+); survivors are not silently discarded.
    next[Math.min(age + 1, next.length - 1)] += survivors;
  }
  return { cohorts: next, births, deaths };
}

// Public cash/debt accounting. Services are rationed proportionally after interest.
// Unpaid interest becomes explicit arrears/debt, never disappears.
export function finance(gdp, revenue, openingDebt, openingCash, requests, assumptions) {
  const e = assumptions.economy;
  const requested = Object.values(requests).reduce((a, b) => a + b, 0);
  const interest = openingDebt * (e.debtInterestRate + e.debtRiskPremium * Math.max(0, openingDebt / gdp - 0.5));
  const need = Math.max(0, requested + interest - revenue - openingCash);
  const borrowing = Math.min(need, e.annualBorrowingGdp * gdp, Math.max(0, e.debtLimitGdp * gdp - openingDebt));
  const resources = openingCash + revenue + borrowing;
  const paidInterest = Math.min(interest, resources);
  const arrears = interest - paidInterest;
  const serviceResources = resources - paidInterest;
  const coverage = requested ? Math.min(1, serviceResources / requested) : 1;
  const actual = Object.fromEntries(Object.entries(requests).map(([key, value]) => [key, value * coverage]));
  const spent = Object.values(actual).reduce((a, b) => a + b, 0);
  const repayment = Math.min(openingDebt + borrowing + arrears, Math.max(0, serviceResources - spent));
  const closingCash = Math.max(0, serviceResources - spent - repayment);
  const closingDebt = openingDebt + borrowing + arrears - repayment;
  const cashResidual = openingCash + revenue + borrowing - paidInterest - spent - repayment - closingCash;
  const debtResidual = openingDebt + borrowing + arrears - repayment - closingDebt;
  return { requested, interest, paidInterest, arrears, borrowing, repayment, closingCash, closingDebt, coverage, actual, spent, cashResidual, debtResidual };
}

function groupsFor(city, assumptions) {
  const groups = [];
  for (let income = 0; income < 3; income++) {
    for (const majority of [true, false]) {
      const beliefShare = majority ? city.majorityReligionShare : 1 - city.majorityReligionShare;
      if (beliefShare <= 0) continue;
      groups.push({ id: `${['lower_income', 'middle_income', 'higher_income'][income]}_${majority ? 'majority' : 'minority'}`, income, majority, share: assumptions.population.incomeShares[income] * beliefShare });
    }
  }
  return groups;
}

export function simulate(candidate, config, catalog, assumptions, world, { trace = false } = {}) {
  const p = resolvePolicies(candidate, catalog);
  const g = p.government;
  const s = candidate.settings;
  const c = config.city;
  const a = assumptions;
  const u = world.parameters;
  const groups = groupsFor(c, a);
  const weights = groups.map(group => group.share);
  let cohorts = initialCohorts(c.population, a);
  let population = c.population;
  let health = c.initialHealth;
  let infrastructure = c.initialInfrastructure;
  let trust = c.initialTrust;
  let skills = groups.map(() => c.initialSkill);
  let debt = c.initialDebtToGdp * c.population * c.gdpPerCapita;
  let cash = 0;
  let stock = c.population * c.initialFoodReserveMonths / 12;
  let fertility = c.initialTotalFertility;
  let leader = world.initialLeader;
  let shortageYears = 0;
  let failed = false;
  const failureReasons = new Set();
  const annual = [];
  const groupLifeTotals = groups.map(() => 0);
  let maxAccountingResidual = 0;
  let maxFoodResidual = 0;
  let maxPopulationResidual = 0;
  const initialWorkingShare = cohorts.slice(a.population.workingAgeStart, a.population.workingAgeEnd + 1).reduce((x, y) => x + y, 0) / population;
  const accountability = clamp(g.accountability + s.oversight * (1 - g.accountability) * 0.45 - p.censorship.coercion * 0.10);
  const openness = p.censorship.openness;
  const policyCoercion = (p.reproduction.coercion + p.censorship.coercion + p.religion.coercion + p.class_system.rigidity) / 4;
  const autonomy = clamp((0.35 * accountability + 0.25 * g.participation + 0.40 * openness) * (1 - 0.55 * policyCoercion));
  const incomeBase = a.population.incomeMultipliers.map(v => v ** p.economy.inequality);
  incomeBase[0] *= 1 - p.class_system.eliteCapture;
  incomeBase[1] *= 1 - p.class_system.eliteCapture * 0.4;
  incomeBase[2] *= 1 + p.class_system.eliteCapture;
  const incomeNormalizer = incomeBase.reduce((sum, value, i) => sum + value * a.population.incomeShares[i], 0);
  const incomeMultipliers = incomeBase.map(v => v / incomeNormalizer);

  for (let year = 0; year < c.years; year++) {
    const shock = world.years[year];
    const succession = shock.successionDraw < g.successionProbability;
    if (succession) leader = shock.nextLeader;
    const competence = clamp(leader + g.selectionSkill);
    const administration = clamp((0.6 * g.administration + 0.4 * competence) * u.institution);
    const capture = clamp((a.economy.captureBase + a.economy.capturePower * g.concentration * (1 - accountability)) * u.institution * (1 - a.economy.oversightCaptureReduction * s.oversight), 0, 0.5);
    const workers = cohorts.slice(a.population.workingAgeStart, a.population.workingAgeEnd + 1).reduce((x, y) => x + y, 0) * a.population.participationRate;
    const workerRatio = workers / population / (initialWorkingShare * a.population.participationRate);
    const avgSkill = skills.reduce((sum, value, i) => sum + value * weights[i], 0);
    const taxDrag = Math.exp(-a.economy.taxDistortion * u.taxDistortion * p.economy.taxSensitivity * s.taxRate ** 2);
    const informationFactor = 1 - a.economy.informationProductivityLoss * (1 - openness) * u.institution;
    const allocationFactor = 1 - a.economy.classMisallocationLoss * p.class_system.rigidity;
    const successionLoss = succession ? g.successionContest * shock.successionSeverity * (1 - accountability * 0.5) : 0;
    const cycle = 1 - a.security.recessionOutputLoss * shock.recession - a.security.disasterOutputLoss * shock.disaster * (1 - infrastructure * 0.5) - a.security.successionOutputLoss * successionLoss;
    // Contemporary technology is fixed; skills, health, infrastructure and population evolve.
    const gdp = Math.max(1, population * c.gdpPerCapita * workerRatio * avgSkill ** a.economy.skillOutputElasticity * (a.economy.healthOutputFloor + (1 - a.economy.healthOutputFloor) * health) * p.economy.productivity * taxDrag * informationFactor * allocationFactor * (1 + a.economy.coordinationOutput * g.coordination) * cycle * shock.noise * (1 - p.defense.civilianBurden * s.defenseEffort));
    const collection = clamp(a.economy.collectionBase + a.economy.collectionAdministration * administration + a.economy.collectionTrust * trust);
    const grossTaxes = gdp * s.taxRate * collection;
    const diverted = grossTaxes * capture;
    const revenue = grossTaxes - diverted;
    const reserveExpansion = Math.max(0, population * s.reserveMonths / 12 - stock) * a.economy.foodBasketAnnualCost * a.food.reserveExpansionAnnualFraction;
    const requests = {
      administration: gdp * (a.services.administrationGdp + g.administrationCost + a.services.oversightCostGdp * s.oversight + p.economy.publicCostGdp),
      education: gdp * s.educationGdp * p.education.cost,
      health: gdp * s.healthGdp,
      policing: gdp * s.policingGdp,
      defense: gdp * p.defense.costGdp * s.defenseEffort,
      investment: gdp * s.investmentGdp,
      transfers: gdp * p.economy.transferGdp,
      policyAdministration: gdp * (p.reproduction.costGdp + p.censorship.costGdp + p.class_system.costGdp + p.religion.costGdp),
      foodSystem: gdp * (p.food.publicCostGdp + a.food.reserveMaintenanceGdpPerMonth * s.reserveMonths) + reserveExpansion
    };
    const fiscal = finance(gdp, revenue, debt, cash, requests, a);
    debt = fiscal.closingDebt;
    cash = fiscal.closingCash;
    maxAccountingResidual = Math.max(maxAccountingResidual, Math.abs(fiscal.cashResidual), Math.abs(fiscal.debtResidual));
    const actual = fiscal.actual;
    const publicWorkerDemand = (actual.education * 0.70 + actual.health * 0.65 + actual.policing * 0.75 + actual.defense * p.defense.laborShare + actual.administration * 0.65 + actual.investment * 0.30 + actual.policyAdministration * 0.60) / a.economy.publicWorkerAnnualCost;
    const laborCoverage = publicWorkerDemand > 0 ? Math.min(1, workers / publicWorkerDemand) : 1;
    const publicWorkers = publicWorkerDemand * laborCoverage;
    const delivery = (0.65 + 0.35 * administration) * laborCoverage;
    const educationCoverage = clamp(actual.education / (gdp * a.services.educationAdequateGdp * p.education.cost)) * delivery;
    const healthCoverage = clamp(actual.health / (gdp * a.services.healthAdequateGdp)) * delivery;
    const investmentCoverage = clamp(actual.investment / (gdp * a.services.investmentAdequateGdp)) * delivery;
    const serviceCoverage = (educationCoverage + healthCoverage + investmentCoverage) / 3;
    const grid = clamp(c.gridReliability * (0.65 + 0.35 * infrastructure) - shock.energy * (0.22 + 0.20 * p.food.energyIntensity));

    const domesticDiversion = diverted * a.economy.captureDomesticShare;
    const transferWeights = groups.map(group => group.share * [2.1, 0.8, 0.15][group.income]);
    const transferDenominator = transferWeights.reduce((x, y) => x + y, 0);
    const incomes = groups.map((group, i) => {
      const privateIncome = (gdp - grossTaxes) / population * incomeMultipliers[group.income];
      const transfer = actual.transfers * transferWeights[i] / transferDenominator / (population * group.share);
      const eliteDiversion = group.income === 2 ? domesticDiversion / (population * a.population.incomeShares[2]) : 0;
      const tuition = c.gdpPerCapita * p.education.privateTuition * (group.income === 0 ? 0.6 : 1);
      return Math.max(0, privateIncome + transfer + eliteDiversion - tuition);
    });
    const gini = weightedGini(incomes, weights);
    const foodPrice = a.economy.foodBasketAnnualCost * p.food.costMultiplier * (1 + shock.trade * 0.25 + shock.energy * p.food.energyIntensity * 0.20);
    const essentialCost = a.economy.nonFoodEssentialCost + foodPrice;
    const needs = incomes.map(income => clamp(income / essentialCost));
    const poverty = groups.reduce((sum, group, i) => sum + group.share * (incomes[i] < essentialCost * a.economy.povertyNeedsRatio ? 1 : 0), 0);

    // Food units: one full annual food basket for one resident = one ration.
    const openingStock = stock;
    const spoilage = stock * a.food.initialReserveSpoilage;
    stock -= spoilage;
    const desiredLocal = population * p.food.localShare;
    const landCapacity = c.agriculturalLandHectares * p.food.yieldMultiplier / a.food.hectaresPerAnnualRation;
    const agriculturalWorkersAvailable = Math.min(workers * a.food.agriculturalLaborMaximumShare, Math.max(0, workers - publicWorkers));
    const laborCapacity = agriculturalWorkersAvailable / p.food.laborPerRation;
    const plantedRations = Math.max(0, Math.min(desiredLocal, landCapacity, laborCapacity));
    const local = plantedRations * (1 - a.food.disasterYieldLoss * shock.disaster) * (1 - p.food.energyIntensity * (1 - grid)) * (0.75 + 0.25 * fiscal.coverage);
    const agriculturalWorkers = plantedRations * p.food.laborPerRation;
    const actualLand = plantedRations * a.food.hectaresPerAnnualRation / p.food.yieldMultiplier;
    const targetStock = Math.max(openingStock, population * s.reserveMonths / 12);
    const reservePurchaseRations = Math.max(0, actual.foodSystem - gdp * p.food.publicCostGdp * fiscal.coverage) / foodPrice;
    const desiredImports = Math.max(0, population - local + Math.min(Math.max(0, targetStock - stock), reservePurchaseRations));
    const tradeAvailability = clamp(c.tradeAccess * (1 - a.food.importDisruptionLoss * shock.trade * u.trade));
    const exportReceipts = gdp * c.exportShare * tradeAvailability;
    const foreignFoodBudget = Math.max(0, exportReceipts - gdp * c.essentialNonFoodImportsGdp * (1 + shock.energy * 0.5));
    const householdFoodBudget = incomes.reduce((sum, income, i) => sum + income * population * weights[i] * a.economy.foodHouseholdBudgetShare, 0);
    const imports = Math.min(desiredImports * tradeAvailability, foreignFoodBudget / foodPrice, householdFoodBudget / foodPrice + reservePurchaseRations);
    const freshSupply = local + imports;
    const withdrawn = Math.min(stock, Math.max(0, population - freshSupply));
    stock -= withdrawn;
    const available = freshSupply + withdrawn;
    const priorities = groups.map((group, i) => Math.max(0.01, incomes[i] / essentialCost) ** a.food.distributionIncomeElasticity * (group.income === 0 ? p.class_system.lowAccess : 1));
    const affordability = incomes.map(income => clamp(income * a.economy.foodHouseholdBudgetShare / foodPrice));
    const groupDemands = groups.map((group, i) => population * group.share * affordability[i]);
    const allocation = allocate(available, groupDemands, priorities);
    const consumed = allocation.reduce((x, y) => x + y, 0);
    const leftoverFresh = Math.max(0, available - consumed);
    const stored = Math.min(leftoverFresh, Math.max(0, targetStock - stock));
    stock += stored;
    const waste = leftoverFresh - stored;
    const foodResidual = openingStock + local + imports - consumed - stock - spoilage - waste;
    maxFoodResidual = Math.max(maxFoodResidual, Math.abs(foodResidual));
    const foodCoverage = consumed / population;
    const groupFood = groups.map((group, i) => clamp(allocation[i] / (population * group.share)));

    const allied = p.defense.alliance && shock.allianceDraw < c.allianceReliability;
    const defenseCapability = actual.defense / gdp / a.security.defenseReferenceGdp * p.defense.effectiveness * (0.6 + 0.4 * competence) * (0.7 + 0.3 * infrastructure) * laborCoverage + (allied ? c.allianceReliability * 1.1 : 0);
    // Capability is evaluated against a standardized threat even in peaceful years.
    const defense = defenseCapability / (defenseCapability + a.security.threatCapability);
    const attackDamage = shock.attack * (1 - defense);
    const policing = actual.policing / gdp / a.services.policingReferenceGdp * delivery * u.policing;
    const victimization = a.security.baseVictimizationsPer1000 * Math.max(0.05, (1 + a.security.povertyCrimeMultiplier * poverty + a.security.inequalityCrimeMultiplier * gini) * (1 - a.security.trustCrimeReduction * trust)) / (1 + a.security.policingEffect * policing) * (1 + attackDamage + successionLoss * 0.3);
    const stateHarm = a.security.stateHarmPer1000 * policyCoercion * (1 - accountability) * (1 + poverty + successionLoss);
    const reporting = clamp(p.censorship.reporting * (0.65 + 0.35 * trust));
    const reportedCrime = victimization * reporting;
    const safety = 1 / (1 + (victimization + stateHarm) / a.security.safetyNormalizationRate);
    const energyBurden = p.food.energyIntensity * (1 - grid);
    const landPressure = c.agriculturalLandHectares > 0 ? actualLand / c.agriculturalLandHectares : 0;
    const sustainability = clamp(0.55 * infrastructure + 0.25 * grid + 0.20 * (1 - energyBurden) - 0.10 * landPressure - 0.05 * imports / population);
    const resilience = clamp(0.35 * foodCoverage + 0.25 * serviceCoverage + 0.20 * grid + 0.20 * defense - 0.15 * Math.max(0, debt / gdp - 0.5));
    const groupHappiness = groups.map((group, i) => {
      const exclusion = group.majority ? 0 : p.religion.exclusion;
      const affinity = group.majority ? p.religion.establishment * a.wellbeing.majorityAffinityBonus : 0;
      const classExclusion = group.income === 0 ? p.class_system.rigidity : group.income === 1 ? p.class_system.rigidity * 0.3 : 0;
      const life = a.wellbeing.intercept + a.wellbeing.incomeLogCoefficient * Math.log(Math.max(0.05, incomes[i] / essentialCost)) + a.wellbeing.healthCoefficient * health + a.wellbeing.trustCoefficient * trust + a.wellbeing.autonomyCoefficient * autonomy * u.wellbeing + a.wellbeing.safetyCoefficient * safety - a.wellbeing.foodShortagePenalty * (1 - groupFood[i]) - a.wellbeing.unmetNeedsPenalty * (1 - needs[i]) - a.wellbeing.classExclusionPenalty * classExclusion - a.wellbeing.religiousExclusionPenalty * exclusion * u.religion + affinity * u.religion - a.wellbeing.coercionPenalty * policyCoercion * u.wellbeing - attackDamage * 0.5;
      const result = clamp(life, 0, 10);
      groupLifeTotals[i] += result;
      return result;
    });
    const happiness = groupHappiness.reduce((sum, value, i) => sum + value * weights[i], 0);
    const lowerTail = lowerTailMean(groupHappiness, weights, a.wellbeing.lowerTailPopulationShare);

    const healthTarget = clamp(0.35 + 0.60 * healthCoverage + p.reproduction.healthSupport * fiscal.coverage - 0.35 * (1 - foodCoverage) - 0.10 * stateHarm / a.security.stateHarmPer1000);
    health = clamp(health + a.services.healthAdjustment * (healthTarget - health));
    infrastructure = clamp(infrastructure + a.services.infrastructureAdjustment * (investmentCoverage - infrastructure) - a.services.infrastructureDisasterLoss * shock.disaster * (1 - investmentCoverage) - a.security.attackOutputLoss * attackDamage);
    const trustTarget = clamp(0.25 * accountability + 0.30 * serviceCoverage + 0.20 * foodCoverage + 0.15 * openness + 0.10 * (1 - capture) - 0.15 * policyCoercion);
    trust = clamp(trust + a.services.trustAdjustment * (trustTarget - trust));
    skills = skills.map((value, i) => {
      const access = groups[i].income === 0 ? p.education.lowIncomeAccess * p.class_system.lowAccess : 1;
      const target = 0.75 + a.services.educationSkillGain * educationCoverage * p.education.skill * access * u.education * (0.85 + 0.15 * p.education.criticalThinking * openness);
      return clamp(value + a.services.graduateSkillAdjustment * (target - value), 0.3, 2.5);
    });
    fertility += a.population.familyAdjustment * (Math.max(0.2, c.initialTotalFertility + p.reproduction.fertilityShift * fiscal.coverage) - fertility);
    const previousPopulation = population;
    const populationUpdate = advancePopulation(cohorts, fertility, health, a);
    cohorts = populationUpdate.cohorts;
    population = cohorts.reduce((x, y) => x + y, 0);
    const populationResidual = previousPopulation + populationUpdate.births - populationUpdate.deaths - population;
    maxPopulationResidual = Math.max(maxPopulationResidual, Math.abs(populationResidual));
    shortageYears = foodCoverage < a.food.minimumFoodFailureCoverage ? shortageYears + 1 : 0;
    if (shortageYears >= a.food.shortageYearsForFailure) failureReasons.add('sustained_food_shortage');
    if (fiscal.arrears > gdp * 1e-8 || debt / gdp > a.economy.debtLimitGdp + 1e-8) failureReasons.add('fiscal_distress');
    if (laborCoverage < 0.9) failureReasons.add('public_labor_shortage');
    failed = failureReasons.size > 0;
    annual.push({
      year: c.startYear + year, population: previousPopulation, closingPopulation: population,
      gdp, gdpPerCapita: gdp / previousPopulation,
      happiness, lowerTail, safety, defense, resilience, autonomy, sustainability,
      victimizationPer1000: victimization, stateHarmPer1000: stateHarm, reportedCrimePer1000: reportedCrime,
      foodCoverage, services: serviceCoverage, debtToGdp: debt / gdp, cashToGdp: cash / gdp,
      gini, poverty, capture, health, trust, infrastructure,
      actualLocalShare: local / previousPopulation, reserveMonths: stock / previousPopulation * 12,
      publicLaborShare: workers > 0 ? publicWorkers / workers : 0,
      ...(trace ? { fiscal: { ...fiscal, revenue, grossTaxes, diverted, openingDebt: debt - fiscal.borrowing - fiscal.arrears + fiscal.repayment, requests }, food: { openingStock, local, imports, consumed, closingStock: stock, spoilage, waste, residual: foodResidual, landUsedHectares: actualLand, agriculturalWorkers, workers, publicWorkers }, groups: groups.map((group, i) => ({ id: group.id, share: group.share, income: incomes[i], happiness: groupHappiness[i], foodCoverage: groupFood[i] })), births: populationUpdate.births, deaths: populationUpdate.deaths, populationResidual } : {})
    });
  }
  const average = key => mean(annual.map(row => row[key]));
  const metrics = {};
  for (const key of ['happiness', 'lowerTail', 'safety', 'defense', 'resilience', 'autonomy', 'sustainability', 'victimizationPer1000', 'stateHarmPer1000', 'reportedCrimePer1000', 'foodCoverage', 'services', 'gini', 'poverty', 'capture', 'actualLocalShare']) metrics[key] = average(key);
  metrics.debtToGdp = annual.at(-1).debtToGdp;
  metrics.cashToGdp = annual.at(-1).cashToGdp;
  metrics.gdpPerCapita = annual.at(-1).gdpPerCapita;
  metrics.population = population;
  metrics.minimumFoodCoverage = Math.min(...annual.map(row => row.foodCoverage));
  metrics.finalReserveMonths = annual.at(-1).reserveMonths;
  return { metrics, failed, failureReasons: [...failureReasons].sort(), diagnostics: { maxAccountingResidual, maxFoodResidual, maxPopulationResidual }, groupMeans: groups.map((group, i) => ({ id: group.id, share: group.share, happiness: groupLifeTotals[i] / c.years })), ...(trace ? { annual } : {}) };
}
