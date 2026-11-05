# Kalipolis simulation results

**Status: illustrative and uncalibrated. These are conditional model results, not evidence that a government is objectively best.**

Run ID: `536b398555-4b97188209`. Seed: 41023. Shared setting: Shared present-day benchmark; 10,000 initial residents; 18 annual steps beginning 2026; fixed present-day technology. Currency values are synthetic constant benchmark units.

Search evaluated **5,888 distinct candidates**, with 12 shared screening worlds each. 256 finalists were evaluated on 96 new validation worlds and 128 separate audit worlds. The categorical catalog contains 819,200 possible combinations, before continuous decisions. Search was sampled and evolutionary, not exhaustive; no global-optimum claim is made.

Validation-feasible finalists: 253/256. Audit-feasible finalists: 253/256. Feasible sampled Pareto front: 97 validation candidates, 99 audit candidates.

## How to read the rankings

Candidates are selected on validation results; the audit does not retune or replace them. Feasibility is ordered first, followed by the explicitly weighted, risk-adjusted score. All government categories receive equal search budgets. Government labels contribute no direct score; their editable institutional profiles affect mechanisms.

The balanced score is the weighted sum of normalized outcomes, minus riskAversion × (mean minus 10th percentile), minus failurePenalty × failure frequency. Happiness is divided by 10; the other objective values already lie in [0,1]. Lower-tail happiness averages the least happy 20% of represented residents each year. Metrics average all simulated years except terminal debt, cash, population, GDP per capita and final reserves. Service coverage is adequate education, health and investment delivery, averaged. Defense is a capability proxy against a standardized threat, not a probability of defeating an actual country.

Weights: happiness 32.0%; lowerTail 16.0%; safety 14.0%; defense 12.0%; resilience 12.0%; autonomy 8.0%; sustainability 6.0%. Risk aversion 0.3; failure penalty 0.2.

Eligibility thresholds: failure frequency ≤ 20.0%; mean food coverage ≥ 95.0%; mean services ≥ 55.0%; mean terminal debt/GDP ≤ 80.0%. These are configurable outcome criteria, not restrictions on political categories.

**10th–90th percentile ranges are scenario spreads, not confidence intervals or real-world forecast probabilities.** Worlds mix assumed coefficient uncertainty with exogenous shocks. Street victimization and state harm rates are synthetic expected incident rates per 1,000 resident-years. Reported crime is a separate observation measure and is never used to reward censorship.

## Validation-selected candidates by government

| Government | Candidate | Validation score | Audit score | Audit happiness /10 | Audit lower tail /10 | Audit failures | Eligible: validation / audit |
|---|---|---:|---:|---:|---:|---:|---|
| Representative democracy | city-30656d1a46b9cb4a | 0.6946 | 0.6919 | 6.83 | 6.41 | 0.0% | yes / yes |
| Direct democracy | city-d419e9951df33705 | 0.7038 | 0.7007 | 6.81 | 6.44 | 0.0% | yes / yes |
| Constitutional monarchy | city-58c8a5c677eeb636 | 0.6882 | 0.6853 | 6.67 | 6.29 | 0.0% | yes / yes |
| Absolute monarchy | city-0752cdf75cdf08e7 | 0.6550 | 0.6531 | 6.38 | 6.05 | 0.0% | yes / yes |
| Aristocracy | city-07438070197941a0 | 0.6531 | 0.6512 | 6.30 | 5.97 | 0.0% | yes / yes |
| Oligarchy | city-7325b77ae93ba5ea | 0.6534 | 0.6535 | 6.50 | 6.16 | 0.0% | yes / yes |
| Meritocratic technocracy | city-43d92d7edf70e36e | 0.6843 | 0.6818 | 6.51 | 6.12 | 0.0% | yes / yes |
| Personalist autocracy / tyranny | city-58bf9b6252bc50b2 | 0.6360 | 0.6343 | 6.19 | 5.70 | 0.0% | yes / yes |

## Highest-ranked validation candidate

Highest-ranked eligible candidate: **city-d419e9951df33705**, Direct democracy. Audit eligibility: **passes**. This is a provisional model result under the current weights and assumptions.

| Assignment section | Selected option |
|---|---|
| government | Direct democracy |
| education | Vocational emphasis |
| reproduction | Voluntary family planning |
| censorship | Minimal censorship |
| class_system | No legally enforced classes |
| defense | Small professional force |
| economy | Social market economy |
| religion | Multiple recognized religions |
| food | Local conventional agriculture |

Numerical decisions:

| Decision | Value |
|---|---:|
| taxRate | 33.1% |
| educationGdp | 5.8% |
| healthGdp | 5.2% |
| policingGdp | 2.5% |
| investmentGdp | 5.3% |
| defenseEffort | 1.4822 |
| oversight | 0.5188 |
| reserveMonths | 3.1737 |

Independent audit outcomes:

| Outcome | Mean | 10th–90th percentile |
|---|---:|---|
| happiness | 6.811 | 6.586 – 7.036 |
| lowerTail | 6.436 | 6.210 – 6.668 |
| victimizationPer1000 | 18.993 | 15.485 – 22.476 |
| stateHarmPer1000 | 0.011 | 0.011 – 0.011 |
| reportedCrimePer1000 | 16.696 | 13.629 – 19.690 |
| foodCoverage | 0.997 | 0.989 – 1.000 |
| services | 0.822 | 0.772 – 0.883 |
| debtToGdp | 0.524 | 0.495 – 0.553 |
| gdpPerCapita | 30961.447 | 28974.154 – 33211.560 |
| population | 10213.415 | 10188.703 – 10246.667 |
| defense | 0.554 | 0.531 – 0.579 |
| autonomy | 0.936 | 0.936 – 0.936 |
| sustainability | 0.730 | 0.708 – 0.759 |

## Pairwise audit check

These compare the validation-selected overall candidate with the validation-selected candidate for each government using identical audit worlds. A positive difference favors the overall candidate. The frequency is an ensemble frequency, not a probability of political superiority. Base scores exclude the aggregate risk penalty and feasibility ordering.

| Other candidate | Mean paired score difference | 10th–90th percentile | First candidate higher |
|---|---:|---|---:|
| city-30656d1a46b9cb4a | 0.0090 | 0.0074 – 0.0104 | 100.0% |
| city-58c8a5c677eeb636 | 0.0158 | 0.0128 – 0.0194 | 100.0% |
| city-0752cdf75cdf08e7 | 0.0480 | 0.0399 – 0.0577 | 100.0% |
| city-07438070197941a0 | 0.0502 | 0.0436 – 0.0566 | 100.0% |
| city-7325b77ae93ba5ea | 0.0480 | 0.0417 – 0.0552 | 100.0% |
| city-43d92d7edf70e36e | 0.0199 | 0.0154 – 0.0244 | 100.0% |
| city-58bf9b6252bc50b2 | 0.0672 | 0.0593 – 0.0758 | 100.0% |

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
