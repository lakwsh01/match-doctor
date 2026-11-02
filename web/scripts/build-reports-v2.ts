import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { GameReport, MatchReport } from '../src/lib/report/analysis.ts';
import { buildV2 } from '../src/v2/lib/build.ts';

// Reads the final reports in docs/demo/reports/ and writes the v2 trial reports to docs/demo/reports/v2/.
const dir = fileURLToPath(new URL('../../docs/demo/reports/', import.meta.url));
const outDir = `${dir}v2/`;

const round = (_key: string, value: unknown) =>
  typeof value === 'number' && !Number.isInteger(value) ? Math.round(value * 1000) / 1000 : value;
const read = <T>(file: string) => JSON.parse(readFileSync(`${dir}${file}`, 'utf8')) as T;

const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
const matches = files.filter((f) => f.endsWith('_match.json')).map((f) => read<MatchReport>(f));
const games = new Map(files.filter((f) => !f.endsWith('_match.json')).map((f) => [f.slice(0, -'.json'.length), read<GameReport>(f)]));
const bestOf = (id: string) => matches.find((m) => m.games.some((g) => g.id === id))?.games.length ?? 1;

mkdirSync(outDir, { recursive: true });
const write = (id: string, data: object) => {
  writeFileSync(`${outDir}${id}.json`, `${JSON.stringify(data, round)}\n`);
  console.log(`wrote docs/demo/reports/v2/${id}.json`);
};

for (const [id, game] of games) {
  write(id, buildV2({ id, kind: 'game', games: [game], teams: game.teams, players: game.players, bestOf: bestOf(id) }));
}
for (const match of matches) {
  const parts = match.games.flatMap((g) => games.get(g.id) ?? []);
  write(match.id + '_match', buildV2({ id: `${match.id}_match`, kind: 'match', games: parts, teams: match.teams, players: match.players, bestOf: parts.length }));
}
