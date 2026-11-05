import test from 'node:test';
import assert from 'node:assert/strict';
import { rng, mean, quantile, allocate, lowerTailMean, weightedGini, paretoFront, crowdingSelect } from '../src/math.mjs';

test('random streams are reproducible, bounded, and seed-dependent', () => {
  const a = rng(17), b = rng(17), c = rng(18);
  const x = Array.from({ length: 1000 }, () => a());
  assert.deepEqual(x, Array.from({ length: 1000 }, () => b()));
  assert.notDeepEqual(x, Array.from({ length: 1000 }, () => c()));
  assert.ok(x.every(value => value >= 0 && value < 1));
});

test('statistics and weighted distribution measures agree with hand examples', () => {
  assert.equal(mean([1, 2, 3]), 2);
  assert.equal(quantile([4, 1, 3, 2], 0.5), 2.5);
  assert.equal(lowerTailMean([2, 8], [0.1, 0.9], 0.2), 5);
  assert.equal(weightedGini([1, 1], [0.5, 0.5]), 0);
  assert.ok(Math.abs(weightedGini([0, 2], [0.5, 0.5]) - 0.5) < 1e-12);
});

test('capped resource allocation conserves supply and redistributes surplus', () => {
  const result = allocate(100, [10, 100, 40], [1000, 1, 1]);
  assert.ok(Math.abs(result.reduce((sum, value) => sum + value, 0) - 100) < 1e-9);
  assert.equal(result[0], 10);
  assert.ok(result.every((value, i) => value >= 0 && value <= [10, 100, 40][i]));
  assert.deepEqual(allocate(1000, [1, 2], [1, 1]), [1, 2]);
  assert.deepEqual(allocate(0, [1, 2], [1, 1]), [0, 0]);
});

test('Pareto filtering retains tradeoffs and removes dominated points', () => {
  const points = [{ id: 'a', x: 1, y: 0 }, { id: 'b', x: 0, y: 1 }, { id: 'c', x: 0, y: 0 }, { id: 'd', x: 0.5, y: 0.5 }];
  assert.deepEqual(paretoFront(points, p => p, ['x', 'y']).map(p => p.id).sort(), ['a', 'b', 'd']);
  assert.deepEqual(crowdingSelect(points.filter(p => p.id !== 'c'), 2, p => p, ['x', 'y']).map(p => p.id).sort(), ['a', 'b']);
});
