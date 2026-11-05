import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { ROOT, CATEGORIES, OBJECTIVES } from './config.mjs';
import { paretoFront, stableStringify, mean } from './math.mjs';
import { rankEvaluations, pairedComparison, WEIGHT_PROFILES } from './evaluate.mjs';
import { simulate } from './model.mjs';
import { sensitivityAnalysis } from './sensitivity.mjs';

const fmt = (value, digits = 2) => value.toFixed(digits);
const pct = value => `${fmt(value * 100, 1)}%`;
const stripTrials = row => { const { trials, ...rest } = row; return rest; };
const csv = rows => rows.map(row => row.map(value => {
  const text = typeof value === 'number' ? String(Number(value.toFixed(8))) : String(value ?? '');
  const safe = /^[=+@\-]/.test(text) && typeof value !== 'number' ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}).join(',')).join('\r\n') + '\r\n';

export function selectWinners(validation, catalog) {
  return catalog.government.map(government => {
    const rows = validation.filter(row => row.candidate.policies.government === government.id);
    if (!rows.length) return null;
    const balanced = rankEvaluations(rows)[0];
    return {
      government: government.id, label: government.label,
      balanced: balanced.id,
      validationFeasible: balanced.feasible,
      byProfile: Object.fromEntries(['balanced', ...Object.keys(WEIGHT_PROFILES)].map(profile => [profile, rankEvaluations(rows, profile)[0].id]))
    };
  }).filter(Boolean);
}

function frontier(rows) {
  return paretoFront(rows.filter(row => row.feasible), row => row.objectives, OBJECTIVES).map(row => row.id).sort();
}

function rankingCsv(validation, audit, catalog) {
  const auditMap = new Map(audit.map(row => [row.id, row]));
  const columns = ['validation_rank', 'candidate', 'government', 'validation_feasible', 'audit_feasible', 'validation_score', 'audit_score', 'audit_score_p10', 'audit_score_p90', 'audit_failure_frequency', 'audit_happiness', 'audit_lower_tail_happiness', 'audit_victimizations_per_1000', 'audit_state_harm_per_1000', 'audit_reported_crime_per_1000', 'audit_food_coverage', 'audit_services', 'audit_terminal_debt_gdp', 'audit_defense', 'audit_autonomy', ...CATEGORIES.slice(1), ...Object.keys(validation[0].candidate.settings)];
  const rows = rankEvaluations(validation).map((row, index) => {
    const a = auditMap.get(row.id);
    return [index + 1, row.id, catalog.government.find(g => g.id === row.candidate.policies.government).label, row.feasible, a.feasible, row.profiles.balanced.riskAdjusted, a.profiles.balanced.riskAdjusted, a.profiles.balanced.p10, a.profiles.balanced.p90, a.failureFrequency, a.metrics.happiness.mean, a.metrics.lowerTail.mean, a.metrics.victimizationPer1000.mean, a.metrics.stateHarmPer1000.mean, a.metrics.reportedCrimePer1000.mean, a.metrics.foodCoverage.mean, a.metrics.services.mean, a.metrics.debtToGdp.mean, a.metrics.defense.mean, a.metrics.autonomy.mean, ...CATEGORIES.slice(1).map(category => row.candidate.policies[category]), ...Object.keys(row.candidate.settings).map(key => row.candidate.settings[key])];
  });
  return csv([columns, ...rows]);
}

function buildSummary(inputs, run, validation, audit, winners, fronts, comparisons, provenance) {
  const { config, catalog } = inputs;
  const best = rankEvaluations(validation)[0];
  const auditMap = new Map(audit.map(row => [row.id, row]));
  const label = (category, id) => catalog[category].find(option => option.id === id).label;
  const aBest = auditMap.get(best.id);
  const lines = [
    '# Kalipolis simulation results', '',
    '**Status: illustrative and uncalibrated. These are conditional model results, not evidence that a government is objectively best.**', '',
    `Run ID: \`${provenance.runId}\`. Seed: ${config.search.seed}. Shared setting: ${config.city.name}; ${config.city.population.toLocaleString('en-US')} initial residents; ${config.city.years} annual steps beginning ${config.city.startYear}; fixed present-day technology. Currency values are synthetic constant benchmark units.`, '',
    `Search evaluated **${run.evaluations.toLocaleString('en-US')} distinct candidates**, with ${config.search.screenWorlds} shared screening worlds each. ${validation.length} finalists were evaluated on ${config.search.validationWorlds} new validation worlds and ${config.search.auditWorlds} separate audit worlds. The categorical catalog contains ${run.possibleCategoricalCombinations.toLocaleString('en-US')} possible combinations, before continuous decisions. Search was sampled and evolutionary, not exhaustive; no global-optimum claim is made.`, '',
    `Validation-feasible finalists: ${validation.filter(row => row.feasible).length}/${validation.length}. Audit-feasible finalists: ${audit.filter(row => row.feasible).length}/${audit.length}. Feasible sampled Pareto front: ${fronts.validation.length} validation candidates, ${fronts.audit.length} audit candidates.`, '',
    '## How to read the rankings', '',
    'Candidates are selected on validation results; the audit does not retune or replace them. Feasibility is ordered first, followed by the explicitly weighted, risk-adjusted score. All government categories receive equal search budgets. Government labels contribute no direct score; their editable institutional profiles affect mechanisms.', '',
    'The balanced score is the weighted sum of normalized outcomes, minus riskAversion × (mean minus 10th percentile), minus failurePenalty × failure frequency. Happiness is divided by 10; the other objective values already lie in [0,1]. Lower-tail happiness averages the least happy 20% of represented residents each year. Metrics average all simulated years except terminal debt, cash, population, GDP per capita and final reserves. Service coverage is adequate education, health and investment delivery, averaged. Defense is a capability proxy against a standardized threat, not a probability of defeating an actual country.', '',
    `Weights: ${Object.entries(config.ranking.weights).map(([key, value]) => `${key} ${pct(value)}`).join('; ')}. Risk aversion ${config.ranking.riskAversion}; failure penalty ${config.ranking.failurePenalty}.`, '',
    `Eligibility thresholds: failure frequency ≤ ${pct(config.constraints.maxFailureFrequency)}; mean food coverage ≥ ${pct(config.constraints.minimumMeanFoodCoverage)}; mean services ≥ ${pct(config.constraints.minimumMeanServices)}; mean terminal debt/GDP ≤ ${pct(config.constraints.maximumMeanDebtToGdp)}. These are configurable outcome criteria, not restrictions on political categories.`, '',
    '**10th–90th percentile ranges are scenario spreads, not confidence intervals or real-world forecast probabilities.** Worlds mix assumed coefficient uncertainty with exogenous shocks. Street victimization and state harm rates are synthetic expected incident rates per 1,000 resident-years. Reported crime is a separate observation measure and is never used to reward censorship.', '',
    '## Validation-selected candidates by government', '',
    '| Government | Candidate | Validation score | Audit score | Audit happiness /10 | Audit lower tail /10 | Audit failures | Eligible: validation / audit |',
    '|---|---|---:|---:|---:|---:|---:|---|'
  ];
  for (const winner of winners) {
    const v = validation.find(row => row.id === winner.balanced);
    const a = auditMap.get(winner.balanced);
    lines.push(`| ${winner.label} | ${winner.balanced} | ${fmt(v.profiles.balanced.riskAdjusted, 4)} | ${fmt(a.profiles.balanced.riskAdjusted, 4)} | ${fmt(a.metrics.happiness.mean)} | ${fmt(a.metrics.lowerTail.mean)} | ${pct(a.failureFrequency)} | ${v.feasible ? 'yes' : 'no'} / ${a.feasible ? 'yes' : 'no'} |`);
  }
  lines.push('', '## Highest-ranked validation candidate', '',
    `${best.feasible ? 'Highest-ranked eligible candidate' : 'No finalist meets all validation thresholds; this is the highest-ranked attempted candidate'}: **${best.id}**, ${label('government', best.candidate.policies.government)}. Audit eligibility: **${aBest.feasible ? 'passes' : 'fails'}**. This is a provisional model result under the current weights and assumptions.`, '',
    '| Assignment section | Selected option |', '|---|---|');
  for (const category of CATEGORIES) lines.push(`| ${category} | ${label(category, best.candidate.policies[category])} |`);
  lines.push('', 'Numerical decisions:', '', '| Decision | Value |', '|---|---:|');
  for (const [key, value] of Object.entries(best.candidate.settings)) lines.push(`| ${key} | ${['defenseEffort', 'oversight', 'reserveMonths'].includes(key) ? fmt(value, 4) : pct(value)} |`);
  lines.push('', 'Independent audit outcomes:', '', '| Outcome | Mean | 10th–90th percentile |', '|---|---:|---|');
  const displayMetrics = ['happiness', 'lowerTail', 'victimizationPer1000', 'stateHarmPer1000', 'reportedCrimePer1000', 'foodCoverage', 'services', 'debtToGdp', 'gdpPerCapita', 'population', 'defense', 'autonomy', 'sustainability'];
  for (const key of displayMetrics) {
    const m = aBest.metrics[key];
    lines.push(`| ${key} | ${fmt(m.mean, 3)} | ${fmt(m.p10, 3)} – ${fmt(m.p90, 3)} |`);
  }
  lines.push('', '## Pairwise audit check', '',
    'These compare the validation-selected overall candidate with the validation-selected candidate for each government using identical audit worlds. A positive difference favors the overall candidate. The frequency is an ensemble frequency, not a probability of political superiority. Base scores exclude the aggregate risk penalty and feasibility ordering.', '',
    '| Other candidate | Mean paired score difference | 10th–90th percentile | First candidate higher |', '|---|---:|---|---:|');
  for (const comparison of comparisons) lines.push(`| ${comparison.second} | ${fmt(comparison.scoreDifference.mean, 4)} | ${fmt(comparison.scoreDifference.p10, 4)} – ${fmt(comparison.scoreDifference.p90, 4)} | ${pct(comparison.firstHigherFrequency)} |`);
  lines.push('', '## Assumptions and practical limits', '',
    '- No empirical calibration dataset has been imported. All numerical starting conditions, policy effects, institutional profiles, coefficient ranges and shock frequencies are author assumptions. Source links support measurement concepts only.',
    '- Results can change with priorities, coefficient ranges, geography, starting wealth, threat intensity, trade access, or alliance availability. Audit tests generalization within the same assumed scenario-generating model; it does not validate that model against reality.',
    '- Three income groups crossed with majority/minority religious status represent residents. Within-group variation, detailed political behavior, migration, epidemics and actual strategic military conflict are not modeled. Cohort demographics use expected values, not individual births or deaths.',
    '- Education changes the workforce skill stock slowly. Religion, class, censorship and reproductive controls have explicit assumed access/autonomy/enforcement effects; reproductive restrictions never receive a genetic-improvement benefit.',
    '- Output, crime and happiness equations are simplified structural hypotheses. Safety, autonomy and income also influence happiness, so adding separate weights deliberately values them beyond their contribution to happiness; users can instead select the happiness-only profile.',
    '- The model checks fiscal cash/debt, population, and physical food conservation. Labor and land constrain delivery and domestic food. It is not a full national-accounts or general-equilibrium model; housing and nonfood essentials are represented as a benchmark household cost, not a construction market.',
    '- Profiles are broad overlapping archetypes. Altering the catalog changes their institutional assumptions. Neither government type nor any original draft policy is imposed as a mandatory choice.', '',
    '## Files', '',
    '- `results.json`: all finalist configurations, validation/audit distributions, frontiers, selections and comparisons.',
    '- `rankings.csv`: validation ordering with audit outcomes and all choices/settings.',
    '- `screening.csv`: every screened candidate and its score, eligibility and policy choices.',
    '- `trial_objectives.csv`: paired normalized objective vectors for every finalist/world; allows recalculating weights.',
    '- `trajectories.json`: audit mean annual trajectories and example detailed world for the selected candidates.',
    '- `sensitivity.json`: associations of uncertain assumptions and shocks with paired score differences; conditional ranking reversals.',
    '- `worlds.json`: exact screening, validation and audit scenarios used.',
    '- `inputs/`: immutable run copies of config, assumptions, catalog, and conceptual sources.',
    '- `manifest.json`: input/code hashes, seed, counts, and diagnostics.', '',
    '## Conceptual sources', ''
  );
  for (const source of inputs.sources.sources) lines.push(`- [${source.title}](${source.url}): ${source.use}`);
  return lines.join('\n') + '\n';
}

async function sourceProvenance(inputs) {
  const files = (await readdir(resolve(ROOT, 'src'))).filter(name => name.endsWith('.mjs')).sort();
  const codeHashes = {};
  for (const name of files) codeHashes[`src/${name}`] = createHash('sha256').update(await readFile(resolve(ROOT, 'src', name))).digest('hex');
  const inputHash = createHash('sha256').update(stableStringify(inputs)).digest('hex');
  const codeHash = createHash('sha256').update(stableStringify(codeHashes)).digest('hex');
  return { runId: `${inputHash.slice(0, 10)}-${codeHash.slice(0, 10)}`, inputHash, codeHash, codeHashes };
}

export async function writeReports(output, inputs, run, ensembles, validation, audit) {
  const target = resolve(output);
  const rel = relative(ROOT, target);
  if (!rel || rel.startsWith(`..${sep}`) || rel === '..' || /^[A-Za-z]:/.test(rel)) throw new Error('Output must be a subdirectory of this project');
  await mkdir(resolve(target, 'inputs'), { recursive: true });
  const winners = selectWinners(validation, inputs.catalog);
  const best = rankEvaluations(validation)[0];
  const auditMap = new Map(audit.map(row => [row.id, row]));
  const fronts = { validation: frontier(validation), audit: frontier(audit), byGovernment: {} };
  for (const government of inputs.catalog.government) fronts.byGovernment[government.id] = {
    validation: frontier(validation.filter(row => row.candidate.policies.government === government.id)),
    audit: frontier(audit.filter(row => row.candidate.policies.government === government.id))
  };
  const comparisons = winners.filter(winner => winner.balanced !== best.id).map(winner => pairedComparison(auditMap.get(best.id), auditMap.get(winner.balanced), inputs.config));
  const sensitivity = sensitivityAnalysis(auditMap.get(best.id), winners.map(winner => auditMap.get(winner.balanced)), ensembles.audit, inputs.config);
  const provenance = await sourceProvenance(inputs);
  const diagnostics = Object.fromEntries(['maxAccountingResidual', 'maxFoodResidual', 'maxPopulationResidual'].map(key => [key, Math.max(...validation.map(row => row.diagnostics[key]), ...audit.map(row => row.diagnostics[key]))]));
  const metadata = {
    ...provenance, generatedAt: new Date().toISOString(), status: inputs.assumptions.status,
    seed: inputs.config.search.seed, modelVersion: inputs.config.modelVersion,
    screenedCandidates: run.evaluations, finalists: validation.length,
    categoricalCombinations: run.possibleCategoricalCombinations,
    evaluationMethod: 'Equal-budget per-government evolutionary search; validation selection; untouched independent audit; common random worlds.',
    searchCoverage: run.coverage, diagnostics
  };
  const result = {
    metadata, config: inputs.config,
    overallSelection: best.id, governmentSelections: winners,
    paretoFronts: fronts, pairedAuditComparisons: comparisons,
    validation: validation.map(stripTrials), audit: audit.map(stripTrials)
  };
  await writeFile(resolve(target, 'results.json'), JSON.stringify(result, null, 2) + '\n');
  await writeFile(resolve(target, 'manifest.json'), JSON.stringify(metadata, null, 2) + '\n');
  await writeFile(resolve(target, 'sensitivity.json'), JSON.stringify(sensitivity, null, 2) + '\n');
  for (const [name, value] of Object.entries(inputs)) await writeFile(resolve(target, 'inputs', `${name}.json`), JSON.stringify(value, null, 2) + '\n');
  await writeFile(resolve(target, 'worlds.json'), JSON.stringify(ensembles, null, 2) + '\n');
  await writeFile(resolve(target, 'rankings.csv'), rankingCsv(validation, audit, inputs.catalog));
  const screeningHeader = ['candidate', 'government', 'feasible', 'balanced_score', 'happiness', 'lower_tail', 'food', 'services', 'failures', ...CATEGORIES.slice(1), ...Object.keys(inputs.config.decisionBounds)];
  await writeFile(resolve(target, 'screening.csv'), csv([screeningHeader, ...run.archive.map(row => [row.id, row.candidate.policies.government, row.feasible, row.profiles.balanced.riskAdjusted, row.metrics.happiness.mean, row.metrics.lowerTail.mean, row.metrics.foodCoverage.mean, row.metrics.services.mean, row.failureFrequency, ...CATEGORIES.slice(1).map(category => row.candidate.policies[category]), ...Object.keys(inputs.config.decisionBounds).map(key => row.candidate.settings[key])])]));
  const trialRows = [['candidate', 'stage', 'world', 'failed', ...OBJECTIVES]];
  for (const [stage, rows] of [['validation', validation], ['audit', audit]]) for (const row of rows) for (const trial of row.trials) trialRows.push([row.id, stage, trial.world, trial.failed, ...OBJECTIVES.map(key => trial.objectives[key])]);
  await writeFile(resolve(target, 'trial_objectives.csv'), csv(trialRows));

  const trajectoryIds = new Set([best.id, ...winners.map(winner => winner.balanced)]);
  const trajectories = [];
  for (const id of trajectoryIds) {
    const candidate = auditMap.get(id).candidate;
    const traces = ensembles.audit.map(world => simulate(candidate, inputs.config, inputs.catalog, inputs.assumptions, world, { trace: true }));
    const annualMeans = traces[0].annual.map((row, index) => Object.fromEntries(Object.entries(row).filter(([, value]) => typeof value === 'number').map(([key]) => [key, mean(traces.map(trace => trace.annual[index][key]))])));
    trajectories.push({ candidate: id, annualMeans, exampleWorld: ensembles.audit[0].id, exampleTrace: traces[0].annual });
  }
  await writeFile(resolve(target, 'trajectories.json'), JSON.stringify(trajectories, null, 2) + '\n');
  await writeFile(resolve(target, 'SUMMARY.md'), buildSummary(inputs, run, validation, audit, winners, fronts, comparisons, provenance));
  return result;
}
