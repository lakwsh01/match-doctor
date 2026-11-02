// Seeded stand-ins for fields the logs cannot measure yet. Stateless: the same seed always gives
// the same value, so `npm run reports:v2` rewrites identical files.
function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

export const between = (seed: string, lo: number, hi: number) => lo + (hi - lo) * hash(seed);

export const whole = (seed: string, lo: number, hi: number) => Math.floor(between(seed, lo, hi + 1));

export const pick = <T>(seed: string, items: readonly T[]): T => items[Math.floor(hash(seed) * items.length)];

// `n` shares that add up to 1, each at least `floor`.
export function shares(seed: string, n: number, floor = 0.05): number[] {
  const raw = Array.from({ length: n }, (_, i) => floor + hash(`${seed}:${i}`));
  const total = raw.reduce((sum, v) => sum + v, 0);
  return raw.map((v) => v / total);
}
