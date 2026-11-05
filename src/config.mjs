import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const CATEGORIES = ['government', 'education', 'reproduction', 'censorship', 'class_system', 'defense', 'economy', 'religion', 'food'];
export const OBJECTIVES = ['happiness', 'lowerTail', 'safety', 'defense', 'resilience', 'autonomy', 'sustainability'];

export async function readJson(path) {
  return JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
}

export function mergeKnown(base, patch, path = 'config') {
  if (!patch || Array.isArray(patch) || typeof patch !== 'object') throw new Error(`${path} must be an object`);
  const result = structuredClone(base);
  for (const [key, value] of Object.entries(patch)) {
    if (!Object.hasOwn(base, key)) throw new Error(`Unknown setting: ${path}.${key}`);
    if (base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) result[key] = mergeKnown(base[key], value, `${path}.${key}`);
    else result[key] = value;
  }
  return result;
}

function number(value, path, min, max, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new Error(`${path} must be ${integer ? 'an integer' : 'a finite number'} in [${min}, ${max}]`);
  }
}

export function validateConfig(config) {
  const c = config.city;
  if (typeof c.name !== 'string' || !c.name.trim()) throw new Error('city.name must be nonempty');
  number(c.startYear, 'city.startYear', 2000, 2100, true);
  number(c.population, 'city.population', 100, 10000000, true);
  number(c.years, 'city.years', 2, 60, true);
  number(c.gdpPerCapita, 'city.gdpPerCapita', 1000, 200000);
  number(c.agriculturalLandHectares, 'city.agriculturalLandHectares', 0, 100000000);
  number(c.initialSkill, 'city.initialSkill', 0.1, 3);
  number(c.initialTotalFertility, 'city.initialTotalFertility', 0.1, 8);
  number(c.initialDebtToGdp, 'city.initialDebtToGdp', 0, 2);
  number(c.initialFoodReserveMonths, 'city.initialFoodReserveMonths', 0, 12);
  for (const key of ['initialHealth', 'initialInfrastructure', 'initialTrust', 'majorityReligionShare', 'exportShare', 'essentialNonFoodImportsGdp', 'tradeAccess', 'allianceReliability', 'gridReliability', 'externalThreatProbability', 'disasterProbability', 'tradeDisruptionProbability', 'recessionProbability']) number(c[key], `city.${key}`, 0, 1);
  if (typeof c.allianceAvailable !== 'boolean') throw new Error('city.allianceAvailable must be boolean');
  for (const [key, value] of Object.entries(config.search)) number(value, `search.${key}`, key === 'generations' || key === 'seed' ? 0 : 1, key === 'seed' ? 4294967295 : 100000, true);
  if (config.search.initialPerGovernment < 8) throw new Error('Use at least 8 initial candidates per government');
  if (config.search.screenWorlds < 2 || config.search.validationWorlds < 2 || config.search.auditWorlds < 2) throw new Error('Each scenario ensemble needs at least two worlds');
  if (config.search.eliteCount < 8 || config.search.finalistsPerGovernment < 8) throw new Error('Use at least 8 elites and finalists for objective coverage');
  for (const [key, value] of Object.entries(config.constraints)) number(value, `constraints.${key}`, 0, 2);
  number(config.ranking.riskAversion, 'ranking.riskAversion', 0, 2);
  number(config.ranking.failurePenalty, 'ranking.failurePenalty', 0, 2);
  let weight = 0;
  for (const key of OBJECTIVES) { number(config.ranking.weights[key], `ranking.weights.${key}`, 0, 1); weight += config.ranking.weights[key]; }
  if (Math.abs(weight - 1) > 1e-9) throw new Error('Ranking weights must sum to 1');
  const limits = { taxRate: [0.01, 0.70], educationGdp: [0, 0.2], healthGdp: [0, 0.2], policingGdp: [0, 0.1], investmentGdp: [0, 0.2], defenseEffort: [0.1, 3], oversight: [0, 1], reserveMonths: [0, 12] };
  for (const [key, range] of Object.entries(config.decisionBounds)) {
    if (!limits[key] || !Array.isArray(range) || range.length !== 2) throw new Error(`Invalid decision bound: ${key}`);
    number(range[0], `${key}.minimum`, ...limits[key]);
    number(range[1], `${key}.maximum`, ...limits[key]);
    if (range[0] > range[1]) throw new Error(`Reversed decision bounds: ${key}`);
  }
  return config;
}

export function validateCatalog(catalog) {
  for (const category of CATEGORIES) {
    if (!Array.isArray(catalog[category]) || !catalog[category].length) throw new Error(`Missing policy category ${category}`);
    const seen = new Set();
    for (const option of catalog[category]) {
      if (typeof option.id !== 'string' || !/^[a-z_]+$/.test(option.id) || seen.has(option.id)) throw new Error(`Invalid/duplicate option in ${category}`);
      seen.add(option.id);
      if (!option.label || !option.description) throw new Error(`Missing label/description for ${option.id}`);
      for (const [key, value] of Object.entries(option)) if (typeof value === 'number' && (!Number.isFinite(value) || value < 0 && !['fertilityShift', 'healthSupport'].includes(key))) throw new Error(`Invalid policy coefficient: ${option.id}.${key}`);
    }
  }
}

export async function loadInputs(configPath, quick = false) {
  let config = await readJson(resolve(ROOT, 'config/default.json'));
  if (configPath) config = mergeKnown(config, await readJson(resolve(configPath)));
  if (quick) config.search = { ...config.search, initialPerGovernment: 32, generations: 2, offspringPerGeneration: 16, eliteCount: 16, screenWorlds: 4, finalistsPerGovernment: 8, validationWorlds: 12, auditWorlds: 16 };
  validateConfig(config);
  const catalog = await readJson(resolve(ROOT, 'data/policies.json'));
  validateCatalog(catalog);
  const assumptions = await readJson(resolve(ROOT, 'data/assumptions.json'));
  const sources = await readJson(resolve(ROOT, 'data/sources.json'));
  return { config, catalog, assumptions, sources };
}
