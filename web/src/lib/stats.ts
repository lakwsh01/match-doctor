// Figures that carry their own sample size, so two of them can be merged without loss.
export type Rate = { made: number; of: number; pct: number | null };
export type Dist = { n: number; avg: number | null; min: number | null; max: number | null };
export type Tally = { label: string; value: number }[];

export const rate = (made: number, of: number): Rate => ({ made, of, pct: of ? made / of : null });

export const count = <T>(items: T[], test: (item: T) => boolean) => items.filter(test).length;

export const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

export function dist(values: number[]): Dist {
  if (!values.length) return { n: 0, avg: null, min: null, max: null };
  return { n: values.length, avg: mean(values), min: Math.min(...values), max: Math.max(...values) };
}

export function tally(labels: string[]): Tally {
  const counts = new Map<string, number>();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function groupBy<T>(items: T[], key: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const group = groups.get(key(item));
    if (group) group.push(item);
    else groups.set(key(item), [item]);
  }
  return [...groups];
}

type Mergeable = number | string | boolean | null | Mergeable[] | { [key: string]: Mergeable };
type Fields = { [key: string]: Mergeable };

const isRecord = (v: Mergeable): v is Fields => typeof v === 'object' && v !== null && !Array.isArray(v);
const has = (v: Fields, ...keys: string[]) => keys.every((k) => k in v);
const pick = (f: (a: number, b: number) => number, a: Mergeable, b: Mergeable) =>
  typeof a === 'number' && typeof b === 'number' ? f(a, b) : (a ?? b);

// Combines two figures of the same shape: counts add, rates and distributions re-weight,
// lists of `{ label }` rows merge row by row, number lists add element-wise, and labels or ids
// keep the first value.
export function merge<T>(a: T, b: T): T {
  return mergeValue(a as Mergeable, b as Mergeable) as T;
}

function mergeValue(a: Mergeable, b: Mergeable): Mergeable {
  if (typeof a === 'number' && typeof b === 'number') return a + b;
  if (Array.isArray(a) && Array.isArray(b)) return mergeRows(a, b);
  if (!isRecord(a) || !isRecord(b)) return a ?? b;
  if (has(a, 'made', 'of', 'pct')) return rate(Number(a.made) + Number(b.made), Number(a.of) + Number(b.of));
  if (has(a, 'n', 'avg', 'min', 'max')) {
    const n = Number(a.n) + Number(b.n);
    const total = Number(a.avg ?? 0) * Number(a.n) + Number(b.avg ?? 0) * Number(b.n);
    return { n, avg: n ? total / n : null, min: pick(Math.min, a.min, b.min), max: pick(Math.max, a.max, b.max) };
  }
  return Object.fromEntries(Object.keys({ ...a, ...b }).map((k) => [k, mergeValue(a[k] ?? null, b[k] ?? null)]));
}

function mergeRows(a: Mergeable[], b: Mergeable[]): Mergeable[] {
  if (a.length === b.length && [...a, ...b].every((v) => typeof v === 'number')) {
    return a.map((v, i) => Number(v) + Number(b[i]));
  }
  if (![...a, ...b].every((row) => isRecord(row) && typeof row.label === 'string')) return a;
  const rows = new Map<Mergeable, Mergeable>();
  for (const row of [...a, ...b] as Fields[]) {
    const seen = rows.get(row.label);
    rows.set(row.label, seen ? mergeValue(seen, row) : row);
  }
  const merged = [...rows.values()] as Fields[];
  return merged.every((row) => typeof row.value === 'number')
    ? merged.sort((x, y) => Number(y.value) - Number(x.value))
    : merged;
}
