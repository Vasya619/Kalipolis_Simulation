import { simulate, structuralProblems } from './model.mjs';
import { mean, summarize } from './math.mjs';
import { OBJECTIVES } from './config.mjs';

export const WEIGHT_PROFILES = {
  happiness: { happiness: 1 },
  disadvantaged: { happiness: 0.20, lowerTail: 0.55, safety: 0.10, resilience: 0.15 },
  security: { happiness: 0.15, safety: 0.35, defense: 0.35, resilience: 0.15 },
  liberty: { happiness: 0.25, lowerTail: 0.10, autonomy: 0.55, resilience: 0.10 },
  sustainable: { happiness: 0.20, resilience: 0.30, sustainability: 0.50 }
};

export function objectiveVector(metrics) {
  return Object.fromEntries(OBJECTIVES.map(key => [key, metrics[key] / (key === 'happiness' || key === 'lowerTail' ? 10 : 1)]));
}

export function weightedScore(vector, weights) {
  return Object.entries(weights).reduce((sum, [key, weight]) => sum + vector[key] * weight, 0);
}

export function scoreTrials(trials, config, weights = config.ranking.weights) {
  const scores = trials.map(trial => weightedScore(trial.objectives, weights));
  const stats = summarize(scores);
  const failureFrequency = mean(trials.map(trial => Number(trial.failed)));
  return {
    ...stats,
    riskAdjusted: stats.mean - config.ranking.riskAversion * Math.max(0, stats.mean - stats.p10) - config.ranking.failurePenalty * failureFrequency
  };
}

export function evaluate(candidate, inputs, worlds, { keepTrials = true } = {}) {
  const { config, catalog, assumptions } = inputs;
  const problems = structuralProblems(candidate, config, catalog);
  if (problems.length) throw new Error(`Invalid candidate ${candidate.id}: ${problems.join('; ')}`);
  const trials = worlds.map(world => {
    const result = simulate(candidate, config, catalog, assumptions, world);
    return { world: world.id, objectives: objectiveVector(result.metrics), ...result };
  });
  const metrics = {};
  for (const key of Object.keys(trials[0].metrics)) metrics[key] = summarize(trials.map(trial => trial.metrics[key]));
  const objectives = Object.fromEntries(OBJECTIVES.map(key => [key, mean(trials.map(trial => trial.objectives[key]))]));
  const failureFrequency = mean(trials.map(trial => Number(trial.failed)));
  const reasons = {};
  for (const trial of trials) for (const reason of trial.failureReasons) reasons[reason] = (reasons[reason] || 0) + 1 / trials.length;
  const feasibilityReasons = [];
  if (failureFrequency > config.constraints.maxFailureFrequency + 1e-10) feasibilityReasons.push('failure_frequency');
  if (metrics.foodCoverage.mean < config.constraints.minimumMeanFoodCoverage - 1e-10) feasibilityReasons.push('mean_food_coverage');
  if (metrics.services.mean < config.constraints.minimumMeanServices - 1e-10) feasibilityReasons.push('mean_services');
  if (metrics.debtToGdp.mean > config.constraints.maximumMeanDebtToGdp + 1e-10) feasibilityReasons.push('terminal_debt');
  const profiles = { balanced: scoreTrials(trials, config) };
  for (const [name, weights] of Object.entries(WEIGHT_PROFILES)) profiles[name] = scoreTrials(trials, config, weights);
  const groupMeans = trials[0].groupMeans.map((group, index) => ({ ...group, happiness: summarize(trials.map(trial => trial.groupMeans[index].happiness)) }));
  return {
    id: candidate.id,
    candidate,
    feasible: !feasibilityReasons.length,
    feasibilityReasons,
    failureFrequency,
    failureReasons: reasons,
    objectives,
    metrics,
    profiles,
    groupMeans,
    diagnostics: {
      maxAccountingResidual: Math.max(...trials.map(trial => trial.diagnostics.maxAccountingResidual)),
      maxFoodResidual: Math.max(...trials.map(trial => trial.diagnostics.maxFoodResidual)),
      maxPopulationResidual: Math.max(...trials.map(trial => trial.diagnostics.maxPopulationResidual))
    },
    ...(keepTrials ? { trials } : {})
  };
}

export function rankEvaluations(rows, profile = 'balanced') {
  return [...rows].sort((a, b) => Number(b.feasible) - Number(a.feasible) || b.profiles[profile].riskAdjusted - a.profiles[profile].riskAdjusted || a.id.localeCompare(b.id));
}

// Paired frequencies are conditional on the assumed scenario ensemble, not a
// probability that one political system is objectively superior in the world.
export function pairedComparison(first, second, config) {
  if (first.trials.length !== second.trials.length || first.trials.some((trial, i) => trial.world !== second.trials[i].world)) throw new Error('Paired comparison requires identical world IDs');
  const differences = first.trials.map((trial, i) => weightedScore(trial.objectives, config.ranking.weights) - weightedScore(second.trials[i].objectives, config.ranking.weights));
  return {
    first: first.id, second: second.id,
    scoreDifference: summarize(differences),
    firstHigherFrequency: mean(differences.map(value => value > 1e-10 ? 1 : 0)),
    tieFrequency: mean(differences.map(value => Math.abs(value) <= 1e-10 ? 1 : 0)),
    interpretation: 'Paired base-score differences on audit worlds; excludes aggregate risk adjustment and feasibility ordering.'
  };
}
