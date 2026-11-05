import { rng } from './math.mjs';

// A world contains both uncertain coefficients and exogenous annual shocks.
// Candidates share exactly the same worlds, including all random draws.
export function makeWorlds(config, assumptions, count, seed, stage) {
  const random = rng(seed);
  const uniform = range => range[0] + random() * (range[1] - range[0]);
  const c = config.city;
  return Array.from({ length: count }, (_, index) => {
    const parameters = {};
    for (const [key, range] of Object.entries(assumptions.uncertainty)) {
      if (!['leaderCompetenceRange', 'annualNoiseRange'].includes(key)) parameters[key.replace(/Range$/, '')] = uniform(range);
    }
    return {
      id: `${stage}-${index}`,
      parameters,
      initialLeader: uniform(assumptions.uncertainty.leaderCompetenceRange),
      years: Array.from({ length: c.years }, () => ({
        successionDraw: random(),
        successionSeverity: random(),
        nextLeader: uniform(assumptions.uncertainty.leaderCompetenceRange),
        attack: random() < c.externalThreatProbability ? 0.4 + 0.6 * random() : 0,
        disaster: random() < c.disasterProbability ? 0.4 + 0.6 * random() : 0,
        trade: random() < c.tradeDisruptionProbability ? 0.4 + 0.6 * random() : 0,
        recession: random() < c.recessionProbability ? 0.4 + 0.6 * random() : 0,
        energy: random() < c.tradeDisruptionProbability ? 0.4 + 0.6 * random() : 0,
        allianceDraw: random(),
        noise: uniform(assumptions.uncertainty.annualNoiseRange)
      }))
    };
  });
}

export function ensembleDescription(worlds) {
  const events = { attack: 0, disaster: 0, trade: 0, recession: 0, energy: 0 };
  for (const world of worlds) for (const year of world.years) for (const key of Object.keys(events)) if (year[key]) events[key]++;
  return { worlds: worlds.length, worldYears: worlds.reduce((sum, world) => sum + world.years.length, 0), events };
}
