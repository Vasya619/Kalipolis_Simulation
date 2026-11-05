# Kalipolis simulation results

**Status: illustrative and uncalibrated. These are conditional model results, not evidence that a government is objectively best.**

Run ID: `e45bc079bc-4b97188209`. Seed: 41023. Shared setting: Land-scarce trading city; 10,000 initial residents; 18 annual steps beginning 2026; fixed present-day technology. Currency values are synthetic constant benchmark units.

Search evaluated **5,888 distinct candidates**, with 12 shared screening worlds each. 256 finalists were evaluated on 96 new validation worlds and 128 separate audit worlds. The categorical catalog contains 819,200 possible combinations, before continuous decisions. Search was sampled and evolutionary, not exhaustive; no global-optimum claim is made.

Validation-feasible finalists: 253/256. Audit-feasible finalists: 253/256. Feasible sampled Pareto front: 75 validation candidates, 74 audit candidates.

## How to read the rankings

Candidates are selected on validation results; the audit does not retune or replace them. Feasibility is ordered first, followed by the explicitly weighted, risk-adjusted score. All government categories receive equal search budgets. Government labels contribute no direct score; their editable institutional profiles affect mechanisms.

The balanced score is the weighted sum of normalized outcomes, minus riskAversion × (mean minus 10th percentile), minus failurePenalty × failure frequency. Happiness is divided by 10; the other objective values already lie in [0,1]. Lower-tail happiness averages the least happy 20% of represented residents each year. Metrics average all simulated years except terminal debt, cash, population, GDP per capita and final reserves. Service coverage is adequate education, health and investment delivery, averaged. Defense is a capability proxy against a standardized threat, not a probability of defeating an actual country.

Weights: happiness 32.0%; lowerTail 16.0%; safety 14.0%; defense 12.0%; resilience 12.0%; autonomy 8.0%; sustainability 6.0%. Risk aversion 0.3; failure penalty 0.2.

Eligibility thresholds: failure frequency ≤ 20.0%; mean food coverage ≥ 95.0%; mean services ≥ 55.0%; mean terminal debt/GDP ≤ 80.0%. These are configurable outcome criteria, not restrictions on political categories.

**10th–90th percentile ranges are scenario spreads, not confidence intervals or real-world forecast probabilities.** Worlds mix assumed coefficient uncertainty with exogenous shocks. Street victimization and state harm rates are synthetic expected incident rates per 1,000 resident-years. Reported crime is a separate observation measure and is never used to reward censorship.

## Validation-selected candidates by government

| Government | Candidate | Validation score | Audit score | Audit happiness /10 | Audit lower tail /10 | Audit failures | Eligible: validation / audit |
|---|---|---:|---:|---:|---:|---:|---|
| Representative democracy | city-3c1af96c236390bc | 0.6829 | 0.6771 | 6.71 | 6.39 | 5.5% | yes / yes |
| Direct democracy | city-af91d112638d4242 | 0.6912 | 0.6837 | 6.65 | 6.29 | 6.3% | yes / yes |
| Constitutional monarchy | city-5ef3192a3763737a | 0.6814 | 0.6706 | 6.63 | 6.25 | 7.8% | yes / yes |
| Absolute monarchy | city-6acb8c5bc93cb3ab | 0.6404 | 0.6360 | 6.37 | 5.96 | 4.7% | yes / yes |
| Aristocracy | city-5179b175a5afade5 | 0.6472 | 0.6371 | 6.34 | 6.01 | 7.8% | yes / yes |
| Oligarchy | city-5ec891bd8dbda7cd | 0.6497 | 0.6431 | 6.30 | 5.92 | 6.3% | yes / yes |
| Meritocratic technocracy | city-53d1b069ea633f79 | 0.6602 | 0.6536 | 6.46 | 6.10 | 6.3% | yes / yes |
| Personalist autocracy / tyranny | city-7a1724d8fc06e9a8 | 0.6326 | 0.6289 | 6.46 | 6.08 | 3.1% | yes / yes |

## Highest-ranked validation candidate

Highest-ranked eligible candidate: **city-af91d112638d4242**, Direct democracy. Audit eligibility: **passes**. This is a provisional model result under the current weights and assumptions.

| Assignment section | Selected option |
|---|---|
| government | Direct democracy |
| education | Centralized prescribed curriculum |
| reproduction | Voluntary family incentives |
| censorship | Minimal censorship |
| class_system | No legally enforced classes |
| defense | Small professional force |
| economy | Social market economy |
| religion | Multiple recognized religions |
| food | Import-led food supply |

Numerical decisions:

| Decision | Value |
|---|---:|
| taxRate | 40.8% |
| educationGdp | 4.0% |
| healthGdp | 7.0% |
| policingGdp | 2.5% |
| investmentGdp | 4.6% |
| defenseEffort | 1.4601 |
| oversight | 0.5388 |
| reserveMonths | 3.6494 |

Independent audit outcomes:

| Outcome | Mean | 10th–90th percentile |
|---|---:|---|
| happiness | 6.648 | 6.413 – 6.865 |
| lowerTail | 6.292 | 6.059 – 6.504 |
| victimizationPer1000 | 18.039 | 14.912 – 21.647 |
| stateHarmPer1000 | 0.010 | 0.010 – 0.011 |
| reportedCrimePer1000 | 15.854 | 13.126 – 18.979 |
| foodCoverage | 0.982 | 0.956 – 1.000 |
| services | 0.829 | 0.782 – 0.870 |
| debtToGdp | 0.000 | 0.000 – 0.000 |
| gdpPerCapita | 28297.566 | 25999.586 – 30564.999 |
| population | 10604.764 | 10583.617 – 10626.241 |
| defense | 0.568 | 0.548 – 0.586 |
| autonomy | 0.936 | 0.936 – 0.936 |
| sustainability | 0.730 | 0.710 – 0.751 |

## Pairwise audit check

These compare the validation-selected overall candidate with the validation-selected candidate for each government using identical audit worlds. A positive difference favors the overall candidate. The frequency is an ensemble frequency, not a probability of political superiority. Base scores exclude the aggregate risk penalty and feasibility ordering.

| Other candidate | Mean paired score difference | 10th–90th percentile | First candidate higher |
|---|---:|---|---:|
| city-3c1af96c236390bc | 0.0084 | 0.0068 – 0.0101 | 100.0% |
| city-5ef3192a3763737a | 0.0104 | 0.0084 – 0.0120 | 100.0% |
| city-6acb8c5bc93cb3ab | 0.0513 | 0.0434 – 0.0582 | 100.0% |
| city-5179b175a5afade5 | 0.0436 | 0.0373 – 0.0503 | 100.0% |
| city-5ec891bd8dbda7cd | 0.0412 | 0.0367 – 0.0461 | 100.0% |
| city-53d1b069ea633f79 | 0.0306 | 0.0258 – 0.0365 | 100.0% |
| city-7a1724d8fc06e9a8 | 0.0616 | 0.0523 – 0.0696 | 100.0% |

## Assumptions and practical limits

- No empirical calibration dataset has been imported. All numerical starting conditions, policy effects, institutional profiles, coefficient ranges and shock frequencies are author assumptions. Source links support measurement concepts only.
- Results can change with priorities, coefficient ranges, geography, starting wealth, threat intensity, trade access, or alliance availability. Audit tests generalization within the same assumed scenario-generating model; it does not validate that model against reality.
- Three income groups crossed with majority/minority religious status represent residents. Within-group variation, detailed political behavior, migration, epidemics and actual strategic military conflict are not modeled. Cohort demographics use expected values, not individual births or deaths.
- Education changes the workforce skill stock slowly. Religion, class, censorship and reproductive controls have explicit assumed access/autonomy/enforcement effects; reproductive restrictions never receive a genetic-improvement benefit.
- Output, crime and happiness equations are simplified structural hypotheses. Safety, autonomy and income also influence happiness, so adding separate weights deliberately values them beyond their contribution to happiness; users can instead select the happiness-only profile.
- The model checks fiscal cash/debt, population, and physical food conservation. Labor and land constrain delivery and domestic food. It is not a full national-accounts or general-equilibrium model; housing and nonfood essentials are represented as a benchmark household cost, not a construction market.
- Profiles are broad overlapping archetypes. Altering the catalog changes their institutional assumptions. Neither government type nor any original draft policy is imposed as a mandatory choice.

## Files

- `results.json`: all finalist configurations, validation/audit distributions, frontiers, selections and comparisons.
- `rankings.csv`: validation ordering with audit outcomes and all choices/settings.
- `screening.csv`: every screened candidate and its score, eligibility and policy choices.
- `trial_objectives.csv`: paired normalized objective vectors for every finalist/world; allows recalculating weights.
- `trajectories.json`: audit mean annual trajectories and example detailed world for the selected candidates.
- `sensitivity.json`: associations of uncertain assumptions and shocks with paired score differences; conditional ranking reversals.
- `worlds.json`: exact screening, validation and audit scenarios used.
- `inputs/`: immutable run copies of config, assumptions, catalog, and conceptual sources.
- `manifest.json`: input/code hashes, seed, counts, and diagnostics.

## Conceptual sources

- [World Happiness Report: methodology FAQ](https://www.worldhappiness.report/faq/): Life evaluation as a subjective outcome on a 0–10 scale. This model does not use or reproduce fitted WHR coefficients.
- [OECD How's Life?](https://www.oecd.org/en/publications/how-s-life_23089679.html): Multidimensional well-being and distributional outcomes, not numerical calibration.
- [V-Dem methodology](https://www.v-dem.net/about/v-dem-project/methodology/): Institutional characteristics and measurement uncertainty. No V-Dem dataset has been imported.
