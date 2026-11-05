# Completed verification

All three full studies were executed in this workspace using the VS Code-bundled Node runtime, version 24.22.1. No external packages were installed. The dashboard is not part of this implementation.

## Software tests

`test.cmd`: **16 tests passed, 0 failed**.

Tests cover deterministic random streams, distribution statistics, constrained allocation, Pareto filtering, a hand-calculated fiscal example, debt/arrears limits, demographic conservation, annual finite outcomes and resource caps across all eight governments, label-invariant physics, separation of crime reporting from real safety, food-system failure in an isolated zero-production setting, alliance availability, reproducible evaluations, paired scenario alignment, configuration validation, candidate identity, option coverage and equal search budgets.

## Executed studies

| Study | Designs screened | Finalists | Validation worlds / candidate | Audit worlds / candidate | Validation eligible | Audit eligible |
|---|---:|---:|---:|---:|---:|---:|
| Shared benchmark | 5,888 | 256 | 96 | 128 | 253 | 253 |
| Trade/security stress | 5,888 | 256 | 96 | 128 | 248 | 242 |
| Land-scarce city | 5,888 | 256 | 96 | 128 | 253 | 253 |

Each study also used 12 shared screening worlds per design, with 18 annual steps per world. All eight governments received exactly 736 screening evaluations and 32 finalists. Each study exported 57,344 finalist/world objective rows. Search was not exhaustive.

## Export and reproduction checks

For each completed study:

- Verified that the stored overall selection matches the validation ordering.
- Re-simulated every audit world for the validation-selected overall candidate from the saved input snapshots and exact saved worlds.
- Compared all metric means, medians and 10th/90th percentiles against the stored audit results with absolute tolerance 1e-9; all matched.
- Checked each source file SHA-256 against the recorded manifest; all matched.
- Independently checked that every reported validation Pareto candidate was eligible and was not dominated by another eligible finalist.
- Checked the trial CSV's row count against finalists × (validation worlds + audit worlds).

Maximum absolute conservation residuals across finalist evaluations:

| Study | Fiscal cash/debt units | Annual food baskets | Residents |
|---|---:|---:|---:|
| Shared benchmark | 5.96e-8 | 6.00e-12 | 7.10e-11 |
| Trade/security stress | 5.96e-8 | 5.76e-12 | 6.92e-11 |
| Land-scarce city | 5.96e-8 | 5.49e-12 | 6.74e-11 |

These residuals reflect floating-point rounding at the scale of the simulated budgets and populations.

This verifies execution, reproducibility and internal consistency. It does **not** establish that the model's assumed policy coefficients or political rankings are empirically correct. See [MODEL.md](MODEL.md).
