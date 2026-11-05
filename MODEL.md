# Model specification and interpretation

Version 1.0.0. Numerical calibration status: **ILLUSTRATIVE_UNCALIBRATED**.

## Purpose and boundaries

Search the design space of a fictional, present-day city-state. Compare whole policy combinations overall and within eight government archetypes. The model computes consequences of explicit structural assumptions; it cannot independently discover causal political laws or establish a universally best society.

All nine assignment sections are varied. The original draft is not a constraint. Default population, location-independent resources and institutions are synthetic benchmark inputs. There is no automatic oil income, future automation, free alliance, future technology improvement or migration.

The default horizon is 18 annual steps starting in 2026. It is a counterfactual experiment holding the technological menu fixed, not a forecast of technological change over those years. Infrastructure, human skills, health, cohorts and public finances evolve endogenously.

## Inputs and evidence

`data/policies.json` defines categorical policies and institutional profiles. `data/assumptions.json` defines resource coefficients, behavioral hypotheses and uniform uncertainty ranges. `config/default.json` defines the common setting, continuous choices and preferences. Fixed mixing/normalization constants also appear explicitly in `src/model.mjs`; they are likewise assumptions, not empirical estimates.

Conceptual sources justify the distinction between life evaluation, broader well-being and institutional characteristics. No country-level dataset has been downloaded, no coefficient has been statistically fitted, and no calibration is implied by a source link. Cross-country correlations would not in themselves justify causal policy effects in a small city-state.

The uniform ranges and event probabilities define an experiment. The frequency of a model failure is conditional on that experiment, not an estimate of actual political failure probability. Narrow ranges cannot capture all structural uncertainty.

## State and households

State: population cohorts ages 0–98 and an open-ended 99+ cohort; skill stock by household group; health; infrastructure; trust; public debt/cash; stored annual food baskets; fertility; current leader competence.

Households: three income groups (35%, 50%, 15% by default), each crossed with majority and minority religious affiliation. Religious and income statuses are independent in the starting representation. Group shares remain fixed. There is no individual behavioral simulation, within-group inequality, social-mobility transition matrix, or intergenerational wealth accumulation.

Income-group multipliers are normalized to preserve aggregate pretax income after economy/class adjustments. Transfers favor lower-income groups. Captured tax revenue is partly allocated to affluent residents; the remainder is modeled as capital flight. Tuition reduces household disposable resources. Public service costs do not constitute a full national-accounts reconciliation; see limitations.

## Annual sequence

1. Shared shocks occur; leadership may change according to the institutional profile. The same competence draws are available to all candidates. Merit selection has an explicit, editable assumed skill increment.
2. Institutional delivery/capture, working-age labor, output and tax receipts are calculated.
3. Requested services compete for revenue, cash and limited borrowing. Interest has priority. Actual spending determines service capacity and labor demands.
4. Household disposable resources, poverty and inequality are estimated.
5. Local food production, imports, spoilage, consumption and reserves are resolved under land, labor, energy, trade and affordability limits.
6. Defense capacity, attack damage, victimization, reported crime, state harm, sustainability, resilience and group life satisfaction are calculated.
7. Health, infrastructure, trust and skills adjust. Cohorts age; expected births/deaths update population. Failure flags are recorded and retained.

### Institutions

Effective accountability = clamp(profile accountability + 0.45 × oversight × (1 − profile accountability) − 0.10 × censorship coercion).

Capture depends on concentrated power, effective accountability, oversight and an uncertain institutional multiplier. Delivery depends on administration and the current leader. Coordination can improve output; weak information, rigid class rules, succession disputes and coercion can impose costs. These are hypotheses encoded in the profile/mechanism inputs, not intrinsic government rankings.

Archetypes overlap in reality. Constitutional monarchy has parliamentary accountability in this catalog. Aristocracy means hereditary leadership selection, separately from society-wide class law. A meritocracy does not imply perfect recruitment or immunity to capture.

### Output and fiscal accounting

Output = population × benchmark output per capita × working-age ratio × skill factor × health factor × economic organization factor × tax incentive factor × information factor × allocation factor × coordination factor × shocks × defense opportunity-cost factor.

Technology is fixed. The exponential tax incentive hypothesis, productivity assumptions and service effects are editable; none is fitted to observations. Attack damage reduces life satisfaction immediately and infrastructure thereafter. This is not a strategic conflict or full capital-stock model.

Gross taxes = GDP × chosen tax rate × collection efficiency.

Net public revenue = gross taxes − diverted taxes. Household pretax resources subtract gross taxes, not only the successfully retained public revenue.

Requested spending includes administration, education, healthcare, policing, defense, infrastructure, transfers, policy enforcement and the food system/reserves. Shares are of annual GDP. Education's cost multiplier scales its resource requirement; defense effort multiplies the selected defense system's cost. Policy-specific enforcement costs are funded along with other requests.

Borrowing is capped both annually and against the debt limit. Available funding after interest scales requested services proportionally. Surpluses repay debt and then accumulate cash. Unpaid interest is recorded as arrears and added to debt.

Conservation checks:

```text
opening cash + revenue + borrowing
  = paid interest + actual service spending + repayment + closing cash

opening debt + borrowing + unpaid interest − repayment = closing debt
```

Public labor is limited by the working-age labor pool. If staffing demand exceeds available workers, real service delivery falls; nominal spending does not magically create workers. Agricultural labor uses the remaining pool and is separately capped as a share of workers. The remainder represents other economic activity. There is no detailed sector-by-sector labor market clearing.

### Food

Unit: one full annual food basket for one resident is one ration. The basket stands in for nutritional adequacy; crop composition, micronutrients, irrigation and livestock are not modeled separately.

Potential planted rations = minimum of desired domestic output, fixed land capacity and available agricultural labor capacity. Labor/land use refers to planted capacity before yield losses. Harvest is reduced by disasters, energy shortfalls and inadequate food-system funding. Controlled environments represent contemporary protected cultivation, with higher assumed capital/energy cost; they are not future technology.

Imports are capped by logistics/trade access, export receipts after essential nonfood imports, and aggregate household/reserve buying capacity. The stylized external account does not allow unlimited foreign borrowing to pay for food. Reserves have maintenance/expansion costs and spoilage. Affordability and class access affect distribution; capped weighted allocation redistributes otherwise unused supply.

```text
opening food stock + local harvest + imports
  = household consumption + closing stock + spoilage + waste
```

All candidates receive the same initial reserve, independent of their desired reserve target. Larger desired reserves must be accumulated through the model. Policies are not given their desired stock for free.

### Population and education

Expected births = women in the configured fertile ages × current total fertility / fertile age span. Fertility adjusts gradually toward the policy-dependent target. Voluntary incentives or restrictions change the target only through assumed demographic effects; no genetic improvement is assigned to any option.

Expected deaths use an illustrative age-specific mortality schedule modified by aggregate health. Survivors age one year; the terminal cohort retains surviving older residents. Population conservation is checked every year. This version does not estimate deaths from specific crimes, war, starvation, or reproductive enforcement individually; aggregate health and failure outcomes only partly represent those harms.

Education affects a slowly adjusting workforce skill stock. Access, curriculum, class restrictions, funding and uncertainty change its target. This approximates delayed workforce replacement; it is not a full model of individual students graduating.

### Crime, defense and harm

Victimization is a synthetic expected event rate per 1,000 resident-years based on poverty, inequality, trust, policing capacity and disruption. It is not a calibrated homicide rate or a count of unique victims. State-inflicted harm is a separate synthetic event rate linked to coercion and weak accountability. Safety transforms their sum onto [0,1].

Reported crime = estimated nonstate victimization × reporting factor. Reporting alone never influences true safety or happiness. A separate test verifies this property.

Defense capacity depends on actual spending, labor, competence, infrastructure and an assumed effectiveness factor. An alliance contributes only when available and when its shared reliability draw succeeds. Capability against a standardized threat is transformed into a defense index; actual attack shocks cause residual damage. The model cannot assess whether a tiny city can independently defeat a particular modern state.

### Happiness and other objectives

For each represented household group:

```text
life evaluation = clamp(
  intercept + income coefficient × log(disposable income / essential needs cost)
  + health contribution + trust contribution + autonomy contribution
  + safety contribution − food-shortage penalty − unmet-needs penalty
  − class-exclusion penalty − religious-exclusion penalty
  + majority religious-affinity term − coercion penalty − attack harm,
  0, 10
)
```

All terms are illustrative. This equation is not the World Happiness Report regression. The majority-affinity term is small but explicitly uncertain; religious minorities' exclusion is represented separately.

Happiness is population weighted. Lower-tail happiness is the weighted mean among the least happy 20% of represented residents, with fractional groups at the boundary. It is computed each year and then averaged, not the happiness of one arbitrarily chosen group.

Other objectives are safety, defense, resilience, autonomy and sustainability on [0,1]. Resilience combines service/food/energy continuity, defense and debt exposure. Sustainability is a proxy combining infrastructure, grid reliability, energy burden, land pressure and import dependence; there is no calibrated carbon inventory. Income, health and safety contribute to happiness; separately weighting them is an explicit preference, not an assertion of statistical independence.

## Failure and eligibility

A trial is flagged if any year produces fiscal distress, an excessive public labor shortfall, or at least two consecutive years with food coverage below 80%. The flag is retained even if the city subsequently recovers. A trial continues after failure to show consequences; failure is not a simulation crash.

Across worlds, a candidate must meet configured thresholds for failure frequency, average food, average service delivery and mean terminal debt/GDP to be eligible. No democracy, religion, class or reproductive-policy requirement is hidden in eligibility.

Failure and eligibility are different: a candidate can have some failed trials but pass aggregate thresholds. Software errors stop the run rather than being counted as policy failure.

## Search and decision rule

The initial sample covers every option and then uses independent categorical draws and uniform continuous settings. Every government receives the same initial draw stream and exact evaluation budget. Each generation retains candidates across explicit preference profiles and crowding-selected nondominated outcomes. Crossover, mutation and occasional fresh random candidates explore their neighborhoods.

Screening worlds guide this search. Finalists per government are re-evaluated on new validation worlds. Eligible candidates rank before ineligible ones. Within each class:

```text
base score(world) = sum(weight × normalized objective)
ranking score = mean(base score)
  − risk aversion × max(0, mean(base score) − p10(base score))
  − failure penalty × failure frequency
```

Weights and penalties are public configuration. Happiness and lower-tail scores are divided by 10. Other objectives already lie in [0,1]. Alternative profile winners are also saved. Feasible nondominated sets are saved overall and per government, not claimed to be the entire mathematical frontier.

The independent audit receives no influence over search or validation selections. It evaluates all finalists for comparison and provides an audit frontier, but does not replace the fixed validation winners. Reinterpreting that audit to choose a new winner would require a further untouched evaluation for an honest new holdout.

Paired differences compare candidates under identical world draws. The 10th–90th percentile range is a scenario distribution, not a confidence interval. Sensitivity output reports correlations and low/high quartile conditional means of paired differences against uncertain coefficients and exposures. This is exploratory association, not causal sensitivity or a significance test.

## Software checks versus real-world validation

Tests establish reproducibility, consistent allocation and conservation, equal search budgets, correct reporting separation and expected behavior in selected extreme cases. Source/input hashes and scenario snapshots support reproduction. They do not calibrate or validate the behavioral model.

Before making real-world recommendations: define an actual city/context; acquire local price, demographic, fiscal, public-service and survey data; fit or bound mechanisms using credible research designs; check held-out empirical outcomes; add omitted mechanisms that alter decisions; test alternative structural models; and report where evidence cannot distinguish options. Present results as conditional hypotheses until that work is done.
