import test from 'node:test';
import assert from 'node:assert/strict';
import { loadInputs, mergeKnown, validateConfig } from '../src/config.mjs';
import { initialCohorts, advancePopulation, finance, simulate, structuralProblems } from '../src/model.mjs';
import { makeWorlds } from '../src/worlds.mjs';
import { makeCandidate, randomCandidate } from '../src/search.mjs';
import { evaluate, pairedComparison } from '../src/evaluate.mjs';
import { rng } from '../src/math.mjs';

const inputs = await loadInputs();
function candidate() {
  const policies = Object.fromEntries(['government', 'education', 'reproduction', 'censorship', 'class_system', 'defense', 'economy', 'religion', 'food'].map(category => [category, inputs.catalog[category][0].id]));
  policies.economy = 'mixed'; policies.food = 'diversified';
  return makeCandidate(policies, { taxRate: 0.36, educationGdp: 0.05, healthGdp: 0.06, policingGdp: 0.015, investmentGdp: 0.035, defenseEffort: 1, oversight: 0.65, reserveMonths: 4 });
}

test('public accounting matches a hand-calculated surplus budget', () => {
  const result = finance(1000, 200, 100, 10, { services: 120 }, inputs.assumptions);
  assert.equal(result.borrowing, 0);
  assert.ok(Math.abs(result.paidInterest - 3.5) < 1e-12);
  assert.equal(result.spent, 120);
  assert.equal(result.repayment, 86.5);
  assert.equal(result.closingDebt, 13.5);
  assert.equal(result.closingCash, 0);
  assert.equal(result.cashResidual, 0);
});

test('unfunded requests cannot create resources or unlimited borrowing', () => {
  const result = finance(1000, 0, 1000, 0, { services: 1000 }, inputs.assumptions);
  assert.equal(result.borrowing, 0);
  assert.equal(result.spent, 0);
  assert.ok(result.arrears > 0);
  assert.equal(result.closingDebt, 1000 + result.arrears);
  assert.equal(result.cashResidual, 0);
  assert.equal(result.debtResidual, 0);
});

test('cohort accounting includes terminal survivors and conserves population', () => {
  const cohorts = initialCohorts(10000, inputs.assumptions);
  assert.ok(Math.abs(cohorts.reduce((a, b) => a + b, 0) - 10000) < 1e-8);
  const update = advancePopulation(cohorts, 1.8, 0.8, inputs.assumptions);
  const total = update.cohorts.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - (10000 + update.births - update.deaths)) < 1e-8);
  const terminal = new Array(100).fill(0); terminal[99] = 100;
  const old = advancePopulation(terminal, 0, 0.8, inputs.assumptions);
  assert.ok(old.cohorts[99] > 0);
});

test('all government trajectories are finite and conserve budgets, food, land and labor', () => {
  const worlds = makeWorlds(inputs.config, inputs.assumptions, 3, 451, 'test');
  const random = rng(55);
  for (const government of inputs.catalog.government) {
    for (let i = 0; i < 4; i++) {
      const design = randomCandidate(government.id, inputs, random, i);
      const result = simulate(design, inputs.config, inputs.catalog, inputs.assumptions, worlds[i % worlds.length], { trace: true });
      assert.ok(Object.values(result.metrics).every(Number.isFinite));
      assert.ok(result.diagnostics.maxAccountingResidual < 1e-5);
      assert.ok(result.diagnostics.maxFoodResidual < 1e-7);
      assert.ok(result.diagnostics.maxPopulationResidual < 1e-7);
      for (const year of result.annual) {
        assert.ok(year.population > 0 && year.closingPopulation > 0);
        assert.ok(year.foodCoverage >= 0 && year.foodCoverage <= 1 + 1e-9);
        assert.ok(year.food.landUsedHectares <= inputs.config.city.agriculturalLandHectares + 1e-8);
        assert.ok(year.food.agriculturalWorkers + year.food.publicWorkers <= year.food.workers + 1e-8);
        assert.ok(year.fiscal.coverage >= 0 && year.fiscal.coverage <= 1);
        assert.ok(year.fiscal.actual.defense <= year.fiscal.requests.defense + 1e-8);
      }
    }
  }
});

test('government labels do not directly affect outcomes', () => {
  const design = candidate();
  const catalog = structuredClone(inputs.catalog);
  const renamed = catalog.government.find(g => g.id === design.policies.government);
  renamed.id = 'renamed_regime'; renamed.label = 'Whatever label';
  const altered = makeCandidate({ ...design.policies, government: renamed.id }, design.settings);
  const world = makeWorlds(inputs.config, inputs.assumptions, 1, 66, 'test')[0];
  assert.deepEqual(simulate(design, inputs.config, inputs.catalog, inputs.assumptions, world).metrics, simulate(altered, inputs.config, catalog, inputs.assumptions, world).metrics);
});

test('changing reporting alone lowers recorded crime, not actual safety or happiness', () => {
  const design = candidate();
  const world = makeWorlds(inputs.config, inputs.assumptions, 1, 77, 'test')[0];
  const catalog = structuredClone(inputs.catalog);
  catalog.censorship.find(p => p.id === design.policies.censorship).reporting *= 0.1;
  const first = simulate(design, inputs.config, inputs.catalog, inputs.assumptions, world);
  const second = simulate(design, inputs.config, catalog, inputs.assumptions, world);
  assert.equal(first.metrics.victimizationPer1000, second.metrics.victimizationPer1000);
  assert.equal(first.metrics.safety, second.metrics.safety);
  assert.equal(first.metrics.happiness, second.metrics.happiness);
  assert.ok(second.metrics.reportedCrimePer1000 < first.metrics.reportedCrimePer1000);
});

test('a city with no food production or trade cannot be sustained by finite reserves', () => {
  const config = structuredClone(inputs.config);
  Object.assign(config.city, { agriculturalLandHectares: 0, exportShare: 0, tradeAccess: 0 });
  const world = makeWorlds(config, inputs.assumptions, 1, 99, 'test')[0];
  const result = simulate(candidate(), config, inputs.catalog, inputs.assumptions, world);
  assert.equal(result.failed, true);
  assert.ok(result.failureReasons.includes('sustained_food_shortage'));
  assert.ok(result.metrics.foodCoverage < 0.1);
});

test('alliance availability is a genuine contextual constraint', () => {
  const design = candidate(); design.policies.defense = 'alliance';
  const config = structuredClone(inputs.config); config.city.allianceAvailable = false;
  assert.match(structuralProblems(design, config, inputs.catalog).join(' '), /No external defense/);
});

test('evaluation is reproducible and pairing rejects unrelated scenarios', () => {
  const worlds = makeWorlds(inputs.config, inputs.assumptions, 3, 122, 'audit');
  const first = evaluate(candidate(), inputs, worlds);
  const second = evaluate(candidate(), inputs, worlds);
  assert.deepEqual(first, second);
  assert.equal(pairedComparison(first, second, inputs.config).scoreDifference.mean, 0);
  const wrong = structuredClone(second); wrong.trials[0].world = 'other';
  assert.throws(() => pairedComparison(first, wrong, inputs.config), /identical world IDs/);
});

test('configuration overrides reject typos, reversed bounds and invalid weights', () => {
  assert.throws(() => mergeKnown(inputs.config, { citiz: {} }), /Unknown setting/);
  const config = structuredClone(inputs.config); config.ranking.weights.happiness = 0.99;
  assert.throws(() => validateConfig(config), /sum to 1/);
  const reversed = structuredClone(inputs.config); reversed.decisionBounds.taxRate = [0.4, 0.2];
  assert.throws(() => validateConfig(reversed), /Reversed/);
});
