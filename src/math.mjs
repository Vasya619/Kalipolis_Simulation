export const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
export const round = (x, digits = 6) => Number(x.toFixed(digits));

// Mulberry32: reproducible integer arithmetic, independent of Math.random().
export function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

export function quantile(values, q) {
  const a = [...values].sort((x, y) => x - y);
  const pos = (a.length - 1) * q;
  const lo = Math.floor(pos);
  return a[lo] + (a[Math.ceil(pos)] - a[lo]) * (pos - lo);
}

export function summarize(values) {
  return { mean: mean(values), p10: quantile(values, 0.10), median: quantile(values, 0.5), p90: quantile(values, 0.90) };
}

export function weightedGini(values, weights) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const avg = values.reduce((a, v, i) => a + v * weights[i], 0) / totalWeight;
  if (avg <= 0) return 0;
  let differences = 0;
  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < values.length; j++) differences += weights[i] * weights[j] * Math.abs(values[i] - values[j]);
  }
  return differences / (2 * totalWeight * totalWeight * avg);
}

export function lowerTailMean(values, weights, fraction) {
  const sorted = values.map((value, i) => ({ value, weight: weights[i] })).sort((a, b) => a.value - b.value);
  let remaining = weights.reduce((a, b) => a + b, 0) * fraction;
  const mass = remaining;
  let sum = 0;
  for (const item of sorted) {
    const take = Math.min(remaining, item.weight);
    sum += take * item.value;
    remaining -= take;
    if (remaining < 1e-12) break;
  }
  return sum / mass;
}

// Weighted allocation with caps; redistributes surplus rather than losing it.
export function allocate(total, demands, priorities) {
  const assigned = demands.map(() => 0);
  let remaining = Math.min(total, demands.reduce((a, b) => a + b, 0));
  for (let pass = 0; pass <= demands.length && remaining > 1e-9; pass++) {
    const active = demands.map((d, i) => Math.max(0, d - assigned[i]) * priorities[i]);
    const denom = active.reduce((a, b) => a + b, 0);
    if (!denom) break;
    const available = remaining;
    for (let i = 0; i < demands.length; i++) {
      const amount = Math.min(demands[i] - assigned[i], available * active[i] / denom);
      assigned[i] += amount;
      remaining -= amount;
    }
  }
  return assigned;
}

export function dominates(a, b, keys, epsilon = 1e-10) {
  return keys.every(k => a[k] >= b[k] - epsilon) && keys.some(k => a[k] > b[k] + epsilon);
}

export function paretoFront(items, vector, keys) {
  const front = [];
  for (const item of items) {
    const v = vector(item);
    if (front.some(other => dominates(vector(other), v, keys))) continue;
    for (let j = front.length - 1; j >= 0; j--) {
      if (dominates(v, vector(front[j]), keys)) front.splice(j, 1);
    }
    front.push(item);
  }
  return front;
}

export function crowdingSelect(items, limit, vector, keys) {
  if (items.length <= limit) return [...items];
  const distance = new Map(items.map(item => [item.id, 0]));
  for (const key of keys) {
    const sorted = [...items].sort((a, b) => vector(a)[key] - vector(b)[key] || a.id.localeCompare(b.id));
    const range = vector(sorted.at(-1))[key] - vector(sorted[0])[key];
    if (range < 1e-12) continue;
    distance.set(sorted[0].id, Infinity);
    distance.set(sorted.at(-1).id, Infinity);
    for (let i = 1; i < sorted.length - 1; i++) {
      const gap = (vector(sorted[i + 1])[key] - vector(sorted[i - 1])[key]) / range;
      distance.set(sorted[i].id, distance.get(sorted[i].id) + gap);
    }
  }
  return [...items].sort((a, b) => distance.get(b.id) - distance.get(a.id) || a.id.localeCompare(b.id)).slice(0, limit);
}
