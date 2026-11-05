import { mean, quantile } from './math.mjs';
import { weightedScore } from './evaluate.mjs';

function correlation(x, y) {
  const mx = mean(x), my = mean(y);
  let xx = 0, yy = 0, xy = 0;
  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    xx += dx * dx; yy += dy * dy; xy += dx * dy;
  }
  return xx * yy > 1e-20 ? xy / Math.sqrt(xx * yy) : 0;
}

export function sensitivityAnalysis(first, competitors, worlds, config) {
  const drivers = Object.fromEntries(Object.keys(worlds[0].parameters).map(key => [key, worlds.map(world => world.parameters[key])]));
  for (const key of ['attack', 'trade', 'disaster', 'recession', 'energy']) drivers[`${key}Exposure`] = worlds.map(world => world.years.reduce((sum, year) => sum + year[key], 0));
  const rows = [];
  for (const competitor of competitors) {
    if (competitor.id === first.id) continue;
    if (first.trials.some((trial, i) => trial.world !== competitor.trials[i].world || trial.world !== worlds[i].id)) throw new Error('Sensitivity requires aligned audit worlds');
    const differences = first.trials.map((trial, i) => weightedScore(trial.objectives, config.ranking.weights) - weightedScore(competitor.trials[i].objectives, config.ranking.weights));
    for (const [driver, values] of Object.entries(drivers)) {
      const low = quantile(values, 0.25), high = quantile(values, 0.75);
      const lower = differences.filter((_, i) => values[i] <= low);
      const upper = differences.filter((_, i) => values[i] >= high);
      const lowDifference = mean(lower), highDifference = mean(upper);
      rows.push({
        first: first.id, second: competitor.id, driver,
        correlationWithPairedScoreDifference: correlation(values, differences),
        lowerQuartileMeanDifference: lowDifference,
        upperQuartileMeanDifference: highDifference,
        lowerWorldCount: lower.length, upperWorldCount: upper.length,
        conditionalMeanRankingReverses: lowDifference * highDifference < 0
      });
    }
  }
  return {
    interpretation: 'Exploratory association within the assumed audit ensemble, not causal sensitivity estimates or significance tests. Compares paired base scores; does not apply feasibility ordering or aggregate risk penalties. No search or selection uses this output.',
    rows: rows.sort((a, b) => Math.abs(b.correlationWithPairedScoreDifference) - Math.abs(a.correlationWithPairedScoreDifference))
  };
}
