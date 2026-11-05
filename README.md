# Kalipolis simulation

A dependency-free program that searches combinations across all nine city-state assignment sections. It compares eight government archetypes without imposing any original draft choice. The frontend is intentionally reserved for a later run.

**This is an illustrative, uncalibrated structural simulation. It produces reproducible conditional experiments, not scientific proof of a perfect city or the superiority of a political system. All numerical policy effects and initial conditions are explicit assumptions. No empirical dataset has been imported.**

## Run on this Windows computer

From a terminal in this project:

```powershell
.\run.cmd
```

The launcher uses Node.js if installed, otherwise the Node runtime bundled with your local VS Code installation. No package installation, administrator privileges, or execution-policy change is required. The `.cmd` launcher also works where PowerShell scripts are disabled. `.ps1` launchers are supplied for environments that permit scripts.

```powershell
.\test.cmd
.\run.cmd --quick
.\run.cmd --seed 41024 --output results-another-seed
.\run.cmd --config config/scenarios/trade-stress.json --output results-trade-stress
.\run.cmd --config config/scenarios/land-scarce.json --output results-land-scarce
```

On any platform with Node.js 20 or newer:

```sh
node src/cli.mjs
node --test tests/*.test.mjs
node src/cli.mjs --help
```

`npm run simulate` and `npm test` are also available; there are no dependencies to install.

The full default run screens 5,888 distinct city designs (736 per government), then evaluates 256 finalists on 96 new validation worlds and 128 independent audit worlds. Each world spans 18 years under fixed present-day technology. The categorical space contains 819,200 combinations before eight continuous decisions; this is a sampled evolutionary search, not exhaustive enumeration.

The quick mode is a smoke study with fewer candidates and worlds. It writes to `results-quick/` so it does not overwrite the full results. An explicit output directory replaces the named report files in that directory on rerun; unrelated files are not deleted.

## Read the results

Start with [results/SUMMARY.md](results/SUMMARY.md) after a full run.

The completed studies in this workspace are:

- [Shared benchmark](results/SUMMARY.md): the default common setting.
- [Trade and security stress](results-trade-stress/SUMMARY.md): more trade disruption, greater external threat and no available alliance.
- [Land-scarce city](results-land-scarce/SUMMARY.md): substantially less agricultural land and relatively reliable trade.

Each study has its own complete results, input snapshots and exact scenarios. These comparisons show conditional sensitivity to context; they do not establish empirical political rankings. [Verification evidence](VERIFICATION.md) records the checks performed on the completed runs.

| File | Contents |
|---|---|
| `SUMMARY.md` | Human-readable comparison, selected policies/settings, audit outcomes, assumptions |
| `results.json` | All 256 finalist designs and full validation/audit metric summaries; overall and per-government selections; Pareto fronts |
| `rankings.csv` | Validation order, independent audit outcomes, every option and setting |
| `screening.csv` | Every design evaluated during search |
| `trial_objectives.csv` | One normalized objective vector per finalist and world, with stage/world IDs and failure flag |
| `sensitivity.json` | Exploratory assumption/shock associations and conditional ranking reversals |
| `trajectories.json` | Audit mean annual outcomes and one detailed example world for each selected government design |
| `worlds.json` | Exact scenario draws, including uncertain coefficients |
| `inputs/` | Run-specific copies of the complete configuration, catalog, assumptions and sources |
| `manifest.json` | Input/code SHA-256 hashes, reproducible run ID, seed, option coverage and conservation diagnostics |

Results include all candidates, not only a single winner. `governmentSelections[].byProfile` contains separate selections for balanced, happiness-only, disadvantaged residents, security, liberty and sustainability priorities. `paretoFronts` contains feasible nondominated candidates across all governments and within each category.

**Selections use validation only.** Audit outcomes check those fixed choices without replacing them. If a selected candidate fails audit thresholds, the reports say so. If no candidate is validation-feasible, the highest-ranked attempt is explicitly labeled as such.

## Model scope

The policy catalog includes:

- Representative and direct democracy, constitutional and absolute monarchy, aristocracy, oligarchy, meritocratic technocracy, and personalist autocracy/tyranny.
- Five education systems, four reproductive policies, four censorship policies, four class systems, four defense strategies, five economic systems, four religion policies, and four food systems.
- Adjustable tax rate, education/health/policing/investment spending, defense effort, oversight effort and food reserves.

All candidates share the same initial city. Government names are reporting labels; only their editable institutional characteristics affect mechanisms. Leader draws are shared across candidates. No regime gets a hardcoded happiness bonus. Competence, institutional performance, policy effects and shocks are uncertain.

The simulation tracks cohort demographics, a slowly changing skill stock, household resources for three income groups crossed with religious majority/minority status, public budgets and debt, food production/imports/storage, land, agricultural/public labor, service delivery, crime and state harm, defense capacity, autonomy and well-being. Crime reporting is separate from estimated actual victimization.

See [MODEL.md](MODEL.md) for equations, units, interpretation and limitations.

## Change assumptions and priorities

Edit these files and rerun:

| File | What to change |
|---|---|
| [config/default.json](config/default.json) | Shared setting, decision bounds, search budget, outcome thresholds, objective weights and risk preference |
| [data/policies.json](data/policies.json) | Policy alternatives, government institutional profiles, assumed policy effects |
| [data/assumptions.json](data/assumptions.json) | Behavioral/resource coefficients and uncertainty ranges |
| [data/sources.json](data/sources.json) | Conceptual sources and calibration status |

You can use `--config` with a partial JSON override instead of editing the defaults. Unknown settings, invalid ranges and weights that do not sum to one are rejected. For example:

```json
{
  "city": { "population": 5000 },
  "search": { "seed": 41024 },
  "ranking": {
    "weights": {
      "happiness": 0.5,
      "lowerTail": 0.2,
      "safety": 0.1,
      "defense": 0.1,
      "resilience": 0.1,
      "autonomy": 0,
      "sustainability": 0
    }
  }
}
```

Changing weights reruns the search, not merely the final ordering. No political or reproductive policy is excluded through hidden eligibility rules. An alliance is excluded only if the shared setting says no agreement is available. Other eligibility criteria concern simulated food, services, debt and failure frequency, and can be changed explicitly.

## Reproducibility and validation

The seed determines all draws. Identical code and inputs reproduce candidate IDs, metrics and rankings. `generatedAt` is the only intentionally time-varying result metadata. Stage-specific streams separate screening, validation and audit. Matching world IDs allow paired candidate comparisons. Source hashes and input snapshots identify the model that produced a run.

Tests cover hand-calculated budgets, bounded debt, cash/food/population conservation, land and labor caps, finite outcomes across every government, absence of label-based scoring, underreporting that cannot improve true safety, starvation when both production and trade are unavailable, contextual alliance eligibility, deterministic search, equal per-government budgets and option coverage.

These are software and model-consistency checks. They do not establish empirical validity. For real-world use, numerical assumptions would need local data, estimation, independent validation and much stronger treatment of political and behavioral uncertainty.

Conceptual references: [World Happiness Report](https://www.worldhappiness.report/faq/), [OECD well-being framework](https://www.oecd.org/en/publications/how-s-life_23089679.html), [V-Dem methodology](https://www.v-dem.net/about/v-dem-project/methodology/). None supplies this model's numerical coefficients.
