# Kalipolis simulation results

**Status: illustrative and uncalibrated. These are conditional model results, not evidence that a government is objectively best.**

Run ID: `353c0f10e4-4b97188209`. Seed: 41023. Shared setting: Trade disruption and constrained alliances; 10,000 initial residents; 18 annual steps beginning 2026; fixed present-day technology. Currency values are synthetic constant benchmark units.

Search evaluated **5,888 distinct candidates**, with 12 shared screening worlds each. 256 finalists were evaluated on 96 new validation worlds and 128 separate audit worlds. The categorical catalog contains 614,400 possible combinations, before continuous decisions. Search was sampled and evolutionary, not exhaustive; no global-optimum claim is made.

Validation-feasible finalists: 248/256. Audit-feasible finalists: 242/256. Feasible sampled Pareto front: 95 validation candidates, 94 audit candidates.

## How to read the rankings

Candidates are selected on validation results; the audit does not retune or replace them. Feasibility is ordered first, followed by the explicitly weighted, risk-adjusted score. All government categories receive equal search budgets. Government labels contribute no direct score; their editable institutional profiles affect mechanisms.

The balanced score is the weighted sum of normalized outcomes, minus riskAversion × (mean minus 10th percentile), minus failurePenalty × failure frequency. Happiness is divided by 10; the other objective values already lie in [0,1]. Lower-tail happiness averages the least happy 20% of represented residents each year. Metrics average all simulated years except terminal debt, cash, population, GDP per capita and final reserves. Service coverage is adequate education, health and investment delivery, averaged. Defense is a capability proxy against a standardized threat, not a probability of defeating an actual country.

Weights: happiness 32.0%; lowerTail 16.0%; safety 14.0%; defense 12.0%; resilience 12.0%; autonomy 8.0%; sustainability 6.0%. Risk aversion 0.3; failure penalty 0.2.

Eligibility thresholds: failure frequency ≤ 20.0%; mean food coverage ≥ 95.0%; mean services ≥ 55.0%; mean terminal debt/GDP ≤ 80.0%. These are configurable outcome criteria, not restrictions on political categories.

**10th–90th percentile ranges are scenario spreads, not confidence intervals or real-world forecast probabilities.** Worlds mix assumed coefficient uncertainty with exogenous shocks. Street victimization and state harm rates are synthetic expected incident rates per 1,000 resident-years. Reported crime is a separate observation measure and is never used to reward censorship.

## Validation-selected candidates by government

| Government | Candidate | Validation score | Audit score | Audit happiness /10 | Audit lower tail /10 | Audit failures | Eligible: validation / audit |
|---|---|---:|---:|---:|---:|---:|---|
| Representative democracy | city-8f295ddf2276d3af | 0.6794 | 0.6785 | 6.48 | 6.11 | 0.0% | yes / yes |
| Direct democracy | city-797b6a44c53d52b4 | 0.6750 | 0.6747 | 6.52 | 5.94 | 0.0% | yes / yes |
| Constitutional monarchy | city-2bdbfc61c1cd1691 | 0.6635 | 0.6625 | 6.26 | 5.79 | 0.0% | yes / yes |
| Absolute monarchy | city-72d0d311df3387c1 | 0.6373 | 0.6376 | 6.32 | 5.81 | 0.0% | yes / yes |
| Aristocracy | city-4d7ff18991616dd9 | 0.6440 | 0.6440 | 6.16 | 5.80 | 0.0% | yes / yes |
| Oligarchy | city-59df02739f583a03 | 0.6440 | 0.6410 | 6.20 | 5.66 | 1.6% | yes / yes |
| Meritocratic technocracy | city-fa889c5a4300a6aa | 0.6572 | 0.6534 | 6.36 | 5.94 | 1.6% | yes / yes |
| Personalist autocracy / tyranny | city-7061650d27cde81d | 0.6319 | 0.6282 | 6.08 | 5.70 | 1.6% | yes / yes |

## Highest-ranked validation candidate

Highest-ranked eligible candidate: **city-8f295ddf2276d3af**, Representative democracy. Audit eligibility: **passes**. This is a provisional model result under the current weights and assumptions.

| Assignment section | Selected option |
|---|---|
| government | Representative democracy |
| education | Public comprehensive |
| reproduction | Voluntary family incentives |
| censorship | Minimal censorship |
| class_system | No legally enforced classes |
| defense | Small professional force |
| economy | Social market economy |
| religion | Multiple recognized religions |
| food | Local conventional agriculture |

Numerical decisions:

| Decision | Value |
|---|---:|
| taxRate | 43.1% |
| educationGdp | 6.3% |
| healthGdp | 7.1% |
| policingGdp | 1.5% |
| investmentGdp | 5.3% |
| defenseEffort | 1.6000 |
| oversight | 0.8504 |
| reserveMonths | 4.6714 |

Independent audit outcomes:

| Outcome | Mean | 10th–90th percentile |
|---|---:|---|
| happiness | 6.480 | 6.248 – 6.728 |
| lowerTail | 6.112 | 5.883 – 6.358 |
| victimizationPer1000 | 23.790 | 20.722 – 27.061 |
| stateHarmPer1000 | 0.011 | 0.011 – 0.011 |
| reportedCrimePer1000 | 20.969 | 18.264 – 23.953 |
| foodCoverage | 0.980 | 0.962 – 0.997 |
| services | 0.880 | 0.824 – 0.932 |
| debtToGdp | 0.001 | 0.000 – 0.000 |
| gdpPerCapita | 29010.893 | 27046.406 – 31259.294 |
| population | 10612.943 | 10587.035 – 10635.986 |
| defense | 0.593 | 0.574 – 0.609 |
| autonomy | 0.883 | 0.883 – 0.883 |
| sustainability | 0.720 | 0.691 – 0.745 |

## Pairwise audit check

These compare the validation-selected overall candidate with the validation-selected candidate for each government using identical audit worlds. A positive difference favors the overall candidate. The frequency is an ensemble frequency, not a probability of political superiority. Base scores exclude the aggregate risk penalty and feasibility ordering.

| Other candidate | Mean paired score difference | 10th–90th percentile | First candidate higher |
|---|---:|---|---:|
| city-797b6a44c53d52b4 | 0.0034 | 0.0006 – 0.0063 | 93.0% |
| city-2bdbfc61c1cd1691 | 0.0160 | 0.0136 – 0.0184 | 100.0% |
| city-72d0d311df3387c1 | 0.0411 | 0.0333 – 0.0489 | 100.0% |
| city-4d7ff18991616dd9 | 0.0350 | 0.0297 – 0.0403 | 100.0% |
| city-59df02739f583a03 | 0.0349 | 0.0296 – 0.0396 | 100.0% |
| city-fa889c5a4300a6aa | 0.0222 | 0.0184 – 0.0255 | 100.0% |
| city-7061650d27cde81d | 0.0478 | 0.0418 – 0.0536 | 100.0% |

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
