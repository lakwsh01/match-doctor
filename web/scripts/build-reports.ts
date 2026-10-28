import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildGameReport, buildMatchReport } from '../src/lib/report/analysis.ts';
import type { GameReport } from '../src/lib/report/analysis.ts';
import type { Report } from '../src/lib/report/types';

// Reads docs/demo/raw/*.json and writes one report per game plus one per match to docs/demo/reports/.
const docs = fileURLToPath(new URL('../../docs/demo/', import.meta.url));
const rawDir = `${docs}raw/`;
const outDir = `${docs}reports/`;

const round = (_key: string, value: unknown) =>
  typeof value === 'number' && !Number.isInteger(value) ? Math.round(value * 1000) / 1000 : value;
const write = (name: string, data: object) => {
  writeFileSync(`${outDir}${name}.json`, `${JSON.stringify(data, round, 2)}\n`);
  console.log(`wrote docs/demo/reports/${name}.json`);
};

const games = readdirSync(rawDir)
  .filter((file) => file.endsWith('.json'))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((file) => {
    const raw = JSON.parse(readFileSync(`${rawDir}${file}`, 'utf8')) as Report;
    return buildGameReport(file.replace(/\.json$/, ''), `docs/demo/raw/${file}`, raw);
  });

mkdirSync(outDir, { recursive: true });
games.forEach((game) => write(game.id, game));

const matches = new Map<string, GameReport[]>();
for (const game of games) {
  const id = game.id.replace(/_game_\d+$/, '');
  if (id !== game.id) matches.set(id, [...(matches.get(id) ?? []), game]);
}
matches.forEach((group, id) => write(`${id}_match`, buildMatchReport(id, group)));
