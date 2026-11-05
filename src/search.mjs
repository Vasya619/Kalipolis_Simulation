import { CATEGORIES, OBJECTIVES } from './config.mjs';
import { hash, stableStringify, rng, clamp, round, paretoFront, crowdingSelect } from './math.mjs';
import { evaluate, rankEvaluations } from './evaluate.mjs';
import { structuralProblems } from './model.mjs';

export function makeCandidate(policies, settings) {
  const candidate = { policies: { ...policies }, settings: Object.fromEntries(Object.entries(settings).map(([key, value]) => [key, round(value, 4)])) };
  const canonical = stableStringify(candidate);
  candidate.id = `city-${hash(canonical)}${hash(`kalipolis:${canonical}`)}`;
  return candidate;
}

function allowedOptions(category, inputs) {
  return inputs.catalog[category].filter(option => category !== 'defense' || inputs.config.city.allianceAvailable || !option.alliance);
}

export function randomCandidate(government, inputs, random, index = null) {
  const policies = { government };
  for (const category of CATEGORIES.slice(1)) {
    const options = allowedOptions(category, inputs);
    // Systematic initial coverage prevents rare options from being omitted.
    const pick = index !== null && index < options.length ? index : Math.floor(random() * options.length);
    policies[category] = options[pick].id;
  }
  const settings = {};
  for (const [key, [lo, hi]] of Object.entries(inputs.config.decisionBounds)) settings[key] = lo + random() * (hi - lo);
  return makeCandidate(policies, settings);
}

function mutate(parent, other, inputs, random) {
  const policies = { ...parent.policies };
  for (const category of CATEGORIES.slice(1)) {
    if (random() < 0.35) policies[category] = other.policies[category];
    if (random() < 0.20) {
      const options = allowedOptions(category, inputs);
      policies[category] = options[Math.floor(random() * options.length)].id;
    }
  }
  const settings = {};
  for (const [key, [lo, hi]] of Object.entries(inputs.config.decisionBounds)) {
    let value = random() < 0.5 ? parent.settings[key] : other.settings[key];
    if (random() < 0.65) value += (random() + random() + random() - 1.5) * (hi - lo) * 0.35;
    if (random() < 0.08) value = lo + random() * (hi - lo);
    settings[key] = clamp(value, lo, hi);
  }
  return makeCandidate(policies, settings);
}

// Preserves several explicit preferences plus a diverse sampled Pareto front.
export function selectDiverse(rows, limit) {
  const selected = new Map();
  const profiles = Object.keys(rows[0].profiles);
  const perProfile = Math.max(1, Math.floor(limit / (profiles.length + 2)));
  for (const profile of profiles) for (const row of rankEvaluations(rows, profile).slice(0, perProfile)) selected.set(row.id, row);
  const eligible = rows.filter(row => row.feasible);
  const pool = eligible.length ? eligible : rows;
  const front = paretoFront(pool, row => row.objectives, OBJECTIVES);
  const space = Math.max(0, limit - selected.size);
  for (const row of crowdingSelect(front.filter(row => !selected.has(row.id)), space, row => row.objectives, OBJECTIVES)) selected.set(row.id, row);
  for (const row of rankEvaluations(rows)) {
    if (selected.size >= limit) break;
    selected.set(row.id, row);
  }
  return [...selected.values()].slice(0, limit);
}

export function search(inputs, worlds, progress = () => {}) {
  const { config, catalog } = inputs;
  const finalists = [];
  const archive = [];
  const coverage = Object.fromEntries(CATEGORIES.map(category => [category, Object.fromEntries(catalog[category].map(option => [option.id, 0]))]));
  let completed = 0;
  const requested = catalog.government.length * (config.search.initialPerGovernment + config.search.generations * config.search.offspringPerGeneration);
  for (let governmentIndex = 0; governmentIndex < catalog.government.length; governmentIndex++) {
    const government = catalog.government[governmentIndex];
    // Separate RNG streams give every government the same initial draws and
    // mutation schedule. Its own elites determine subsequent policy choices.
    const random = rng(config.search.seed);
    const evaluated = new Map();
    const accept = candidate => {
      const previous = evaluated.get(candidate.id);
      if (previous) {
        if (stableStringify(previous.candidate) !== stableStringify(candidate)) throw new Error(`Candidate ID collision: ${candidate.id}`);
        return false;
      }
      if (structuralProblems(candidate, config, catalog).length) return false;
      const row = evaluate(candidate, inputs, worlds, { keepTrials: false });
      evaluated.set(candidate.id, row);
      for (const category of CATEGORIES) coverage[category][candidate.policies[category]]++;
      completed++;
      return true;
    };
    for (let i = 0; i < config.search.initialPerGovernment; i++) accept(randomCandidate(government.id, inputs, random, i));
    progress({ phase: 'search', government: government.label, generation: 0, completed, requested });
    for (let generation = 1; generation <= config.search.generations; generation++) {
      const elites = selectDiverse([...evaluated.values()], config.search.eliteCount);
      let added = 0;
      let attempts = 0;
      while (added < config.search.offspringPerGeneration) {
        if (++attempts > config.search.offspringPerGeneration * 100) throw new Error('Could not generate enough distinct candidates; widen decision bounds');
        const parent = elites[Math.floor(random() * elites.length)].candidate;
        const other = elites[Math.floor(random() * elites.length)].candidate;
        const candidate = random() < 0.12 ? randomCandidate(government.id, inputs, random) : mutate(parent, other, inputs, random);
        if (accept(candidate)) added++;
      }
      progress({ phase: 'search', government: government.label, generation, completed, requested });
    }
    const rows = [...evaluated.values()];
    finalists.push(...selectDiverse(rows, config.search.finalistsPerGovernment).map(row => row.candidate));
    archive.push(...rows);
  }
  return { finalists, archive, coverage, evaluations: completed, possibleCategoricalCombinations: CATEGORIES.reduce((product, category) => product * allowedOptions(category, inputs).length, 1) };
}
