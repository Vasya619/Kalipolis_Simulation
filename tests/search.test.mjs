import test from 'node:test';
import assert from 'node:assert/strict';
import { loadInputs, CATEGORIES } from '../src/config.mjs';
import { makeWorlds } from '../src/worlds.mjs';
import { search, makeCandidate } from '../src/search.mjs';
import { selectWinners } from '../src/report.mjs';
import { evaluate } from '../src/evaluate.mjs';

test('candidate IDs ignore object insertion order', () => {
  const a = makeCandidate({ government: 'democracy', food: 'local' }, { taxRate: 0.3, oversight: 0.2 });
  const b = makeCandidate({ food: 'local', government: 'democracy' }, { oversight: 0.2, taxRate: 0.3 });
  assert.equal(a.id, b.id);
});

test('search covers all categories with equal per-government budgets and distinct final scenarios', async () => {
  const inputs = await loadInputs();
  Object.assign(inputs.config.search, { initialPerGovernment: 12, generations: 1, offspringPerGeneration: 4, eliteCount: 8, finalistsPerGovernment: 8, screenWorlds: 2, validationWorlds: 2, auditWorlds: 2 });
  inputs.config.city.years = 3;
  const screen = makeWorlds(inputs.config, inputs.assumptions, 2, 1, 'screen');
  const validation = makeWorlds(inputs.config, inputs.assumptions, 2, 2, 'validation');
  const audit = makeWorlds(inputs.config, inputs.assumptions, 2, 3, 'audit');
  const first = search(inputs, screen);
  const repeated = search(inputs, screen);
  assert.deepEqual(first.finalists, repeated.finalists);
  assert.equal(first.evaluations, 8 * 16);
  assert.equal(first.finalists.length, 8 * 8);
  assert.equal(first.possibleCategoricalCombinations, 819200);
  for (const government of inputs.catalog.government) {
    assert.equal(first.archive.filter(row => row.candidate.policies.government === government.id).length, 16);
    assert.equal(first.finalists.filter(row => row.policies.government === government.id).length, 8);
  }
  for (const category of CATEGORIES) for (const count of Object.values(first.coverage[category])) assert.ok(count > 0);
  assert.ok(validation.every(world => !screen.some(other => other.id === world.id)));
  assert.ok(audit.every(world => !validation.some(other => other.id === world.id)));
  const rows = first.finalists.map(candidate => evaluate(candidate, inputs, validation));
  const selections = selectWinners(rows, inputs.catalog);
  const fixed = structuredClone(selections);
  // The report selection API takes validation only; audit cannot alter it.
  first.finalists.forEach(candidate => evaluate(candidate, inputs, audit));
  assert.deepEqual(selectWinners(rows, inputs.catalog), fixed);
  assert.equal(selections.length, 8);
});
