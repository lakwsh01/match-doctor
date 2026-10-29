import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGameReport } from '../src/lib/report/analysis.ts';
import type { MatchBounce, PlayerEvents, Point, Rally, RallyOutcome, Report, Serve } from '../src/lib/report/types';

// Samples rallies from one schema 2.0 log and writes synthetic games.
// Default: 500 files in docs/demo/generated/. The report builder does not read that folder.
//
//   npm run demo
//   node scripts/generate-demo.ts --count 500 --seed 1 --source <raw.json> --out <dir>

const DIVISIONS = ["Men's Doubles", "Women's Doubles", 'Mixed Doubles'];
const LEVELS = ['Gold', 'Silver', 'Bronze', 'Pro', 'Open'];
const CITIES = [
  'Austin', 'Miami', 'Phoenix', 'Dallas', 'Denver', 'Seattle', 'Boston', 'Atlanta', 'Chicago', 'Tampa', 'Orlando',
  'Sacramento', 'Portland', 'Nashville', 'Charlotte', 'Columbus', 'Indianapolis', 'Detroit', 'Minneapolis', 'Cleveland',
  'Pittsburgh', 'Baltimore', 'Raleigh', 'Omaha', 'Tulsa', 'Boise', 'Madison', 'Richmond', 'Honolulu', 'Anchorage', 'Reno',
  'Tucson', 'Albuquerque', 'Fresno', 'Mesa', 'Spokane',
];
const TIME_KEYS = new Set(['time_sec', 'start_sec', 'end_sec', 'stimulus_sec', 'contact_sec']);
const SCORING_CHECKS = ['serve_record', 'side_out_scoring', 'point_server', 'score_call', 'outcome_vs_point'];

type Kind = 'score' | 'sideout';
type Side = { teamId: string; players: [string, string] };
type RallySlice = {
  kind: Kind;
  serverId: string;
  rally: Rally;
  serve: Serve;
  outcome: RallyOutcome;
  point: Point | null;
  bounces: MatchBounce[];
  players: Record<string, PlayerEvents>;
};
type Pools = Map<string, Record<Kind, RallySlice[]>>;

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const defaultSource = join(repoRoot, 'docs/demo/raw/2026_us_open_mens_double_final_game_1_v2.json');
const defaultOut = join(repoRoot, 'docs/demo/generated');

function option(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith('--')) throw new Error(`${flag} needs a value`);
  return value;
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new Error('empty list');
  return item;
}

function rel(path: string) {
  return path.startsWith(repoRoot) ? path.slice(repoRoot.length) : basename(path);
}

function titleFor(index: number) {
  const division = DIVISIONS[index % DIVISIONS.length] ?? DIVISIONS[0];
  const level = LEVELS[Math.floor(index / DIVISIONS.length) % LEVELS.length] ?? LEVELS[0];
  const city = CITIES[Math.floor(index / (DIVISIONS.length * LEVELS.length)) % CITIES.length] ?? CITIES[0];
  const year = 2022 + (index % 5);
  const game = (index % 3) + 1;
  return `${division} ${level}, ${year} ${city} Open Pickleball — Game ${game}`;
}

function fileName(n: number, count: number) {
  return `demo_${String(n).padStart(Math.max(3, String(count).length), '0')}.json`;
}

function blankPlayer(template: PlayerEvents): PlayerEvents {
  const errors = {} as PlayerEvents['errors'];
  for (const key of Object.keys(template.errors) as (keyof PlayerEvents['errors'])[]) errors[key] = [];
  return {
    errors,
    attacks: { successful: [], unsuccessful: [] },
    movement_speeds: [],
    ball_speeds: [],
    reaction_times: [],
    hitting_gestures: [],
    ball_ground_hits: [],
    position_track: [],
  };
}

function appendPlayer(dst: PlayerEvents, src: PlayerEvents) {
  for (const key of Object.keys(dst.errors) as (keyof PlayerEvents['errors'])[]) dst.errors[key].push(...src.errors[key]);
  dst.attacks.successful.push(...src.attacks.successful);
  dst.attacks.unsuccessful.push(...src.attacks.unsuccessful);
  dst.movement_speeds.push(...src.movement_speeds);
  dst.ball_speeds.push(...src.ball_speeds);
  dst.reaction_times.push(...src.reaction_times);
  dst.hitting_gestures.push(...src.hitting_gestures);
  dst.ball_ground_hits.push(...src.ball_ground_hits);
  dst.position_track.push(...src.position_track);
}

function slicePlayer(events: PlayerEvents, rallyNumber: number, start: number, end: number): PlayerEvents {
  const inRally = <T extends { rally_number: number }>(items: T[]) => items.filter((item) => item.rally_number === rallyNumber);
  const errors = {} as PlayerEvents['errors'];
  for (const key of Object.keys(events.errors) as (keyof PlayerEvents['errors'])[]) errors[key] = inRally(events.errors[key]);
  return {
    errors,
    attacks: { successful: inRally(events.attacks.successful), unsuccessful: inRally(events.attacks.unsuccessful) },
    movement_speeds: inRally(events.movement_speeds),
    ball_speeds: inRally(events.ball_speeds),
    reaction_times: inRally(events.reaction_times),
    hitting_gestures: inRally(events.hitting_gestures),
    ball_ground_hits: inRally(events.ball_ground_hits),
    position_track: events.position_track.filter((sample) => sample.time_sec >= start && sample.time_sec <= end),
  };
}

function teamOf(raw: Report, playerId: string) {
  const player = raw.match.players.find((item) => item.player_id === playerId);
  if (!player) throw new Error(`unknown player ${playerId}`);
  return player.team_id;
}

function sidesOf(raw: Report): [Side, Side] {
  const sides = raw.match.teams.map((team) => {
    const [first, second, extra] = team.player_ids;
    if (!first || !second || extra) throw new Error(`team ${team.team_id} needs two players`);
    return { teamId: team.team_id, players: [first, second] as [string, string] };
  });
  const [a, b] = sides;
  if (!a || !b || sides.length !== 2) throw new Error('source must be one doubles match');
  return [a, b];
}

function indexRallies(raw: Report): Pools {
  const pools: Pools = new Map(raw.match.players.map((player) => [player.player_id, { score: [], sideout: [] }]));
  for (const rally of raw.match.rallies) {
    const serve = raw.match.serves.find((item) => item.rally_number === rally.rally_number);
    const outcome = raw.match.rally_outcomes.find((item) => item.rally_number === rally.rally_number);
    if (!serve || !outcome) continue;
    const servingTeam = teamOf(raw, serve.server_player_id);
    const point = rally.point_number === null ? null : (raw.match.points.find((item) => item.point_number === rally.point_number) ?? null);
    const players: Record<string, PlayerEvents> = {};
    for (const [id, events] of Object.entries(raw.players)) players[id] = slicePlayer(events, rally.rally_number, rally.start_sec, rally.end_sec);
    const serveShot = Object.entries(players).flatMap(([id, events]) =>
      events.hitting_gestures.filter((gesture) => gesture.shot_id === `r${rally.rally_number}s1`).map((gesture) => ({ id, gesture: gesture.gesture })),
    );
    if (serveShot.length !== 1 || serveShot[0]?.gesture !== 'serve' || serveShot[0].id !== serve.server_player_id) continue;
    const scored = rally.scoring && point !== null && point.winner_team_id === servingTeam && outcome.winner_team_id === servingTeam;
    const sidedOut = !rally.scoring && point === null && outcome.winner_team_id !== servingTeam;
    if (!scored && !sidedOut) continue;
    const pool = pools.get(serve.server_player_id);
    if (!pool) throw new Error(`no pool for server ${serve.server_player_id}`);
    pool[scored ? 'score' : 'sideout'].push({
      kind: scored ? 'score' : 'sideout',
      serverId: serve.server_player_id,
      rally,
      serve,
      outcome,
      point,
      bounces: raw.match.ball_ground_hits.filter((hit) => hit.rally_number === rally.rally_number),
      players,
    });
  }
  for (const [id, pool] of pools) {
    if (pool.score.length === 0 || pool.sideout.length === 0) throw new Error(`server ${id} needs a scoring rally and a side-out rally`);
  }
  return pools;
}

// Shift a copied rally onto the new clock and rewrite ids. reaction_sec stays put:
// contact_sec and stimulus_sec move by the same delta, so their difference holds.
function remap(value: unknown, rally: number, point: number | null, delta: number, rng: () => number) {
  if (Array.isArray(value)) {
    for (const item of value) remap(item, rally, point, delta, rng);
    return;
  }
  if (value === null || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const child = record[key];
    if (key === 'rally_number') record[key] = rally;
    else if (key === 'point_number') record[key] = point;
    else if (key === 'shot_id' && typeof child === 'string') record[key] = child.replace(/^r\d+/, `r${rally}`);
    else if (typeof child === 'number' && TIME_KEYS.has(key)) record[key] = child + delta;
    else if (key === 'speed_mps' && typeof child === 'number') record[key] = Math.round(child * (0.85 + rng() * 0.3) * 10) / 10;
    else remap(child, rally, point, delta, rng);
  }
}

function leading(score: Record<string, number>, sides: [Side, Side]) {
  const a = score[sides[0].teamId] ?? 0;
  const b = score[sides[1].teamId] ?? 0;
  return { hi: Math.max(a, b), lead: Math.abs(a - b), line: `${a}-${b}` };
}

function buildGame(raw: Report, pools: Pools, rng: () => number, index: number, count: number, seed: number, sourceLabel: string) {
  const sides = sidesOf(raw);
  const score: Record<string, number> = { [sides[0].teamId]: 0, [sides[1].teamId]: 0 };
  let serving = rng() < 0.5 ? sides[0] : sides[1];
  let serverNumber: 1 | 2 = 2;
  let serverId = serving.players[1];
  let opening = true;
  const hold = 0.4 + rng() * 0.25;
  let clock = 20 + rng() * 40;
  let rallyNumber = 0;
  let pointNumber = 0;
  const rallies: Rally[] = [];
  const serves: Serve[] = [];
  const outcomes: RallyOutcome[] = [];
  const points: Point[] = [];
  const bounces: MatchBounce[] = [];
  const players: Record<string, PlayerEvents> = {};
  for (const player of raw.match.players) {
    const template = raw.players[player.player_id];
    if (!template) throw new Error(`missing events for ${player.player_id}`);
    players[player.player_id] = blankPlayer(template);
  }

  const sideOut = () => {
    if (opening || serverNumber === 2) {
      opening = false;
      serving = serving.teamId === sides[0].teamId ? sides[1] : sides[0];
      serverNumber = 1;
      serverId = serving.players[0];
      return;
    }
    serverNumber = 2;
    serverId = serving.players[1];
  };

  while (rallyNumber < 200) {
    const pool = pools.get(serverId);
    if (!pool) throw new Error(`no rallies for server ${serverId}`);
    const slice = structuredClone(pick(rng, rng() < hold ? pool.score : pool.sideout));
    rallyNumber += 1;
    const scoring = slice.kind === 'score';
    const point = scoring ? ++pointNumber : null;
    remap(slice, rallyNumber, point, clock - slice.rally.start_sec, rng);
    const receiving = serving.teamId === sides[0].teamId ? sides[1] : sides[0];
    slice.serve.server_player_id = serverId;
    slice.serve.server_number = serverNumber;
    slice.serve.serving_side = (score[serving.teamId] ?? 0) % 2 === 0 ? 'deuce' : 'ad';
    slice.serve.score_call = `${score[serving.teamId]}-${score[receiving.teamId]}-${serverNumber}`;
    slice.rally.scoring = scoring;
    if (scoring) {
      if (!slice.point || slice.outcome.winner_team_id !== serving.teamId) throw new Error(`rally ${rallyNumber} scored for the receiving team`);
      slice.point.server_player_id = serverId;
      slice.point.winner_team_id = serving.teamId;
      points.push(slice.point);
      score[serving.teamId] = (score[serving.teamId] ?? 0) + 1;
    } else sideOut();
    rallies.push(slice.rally);
    serves.push(slice.serve);
    outcomes.push(slice.outcome);
    bounces.push(...slice.bounces);
    for (const [id, events] of Object.entries(slice.players)) {
      const dst = players[id];
      if (!dst) throw new Error(`unexpected player ${id}`);
      appendPlayer(dst, events);
    }
    clock = slice.rally.end_sec + 1.2 + rng() * 3.5;
    if (leading(score, sides).hi >= 11 && leading(score, sides).lead >= 2) break;
  }

  const done = leading(score, sides).hi >= 11 && leading(score, sides).lead >= 2;
  const id = fileName(index + 1, count).replace(/\.json$/, '');
  const report: Report = {
    schema_version: '2.0',
    sample: true,
    sample_note: `Synthetic demo sampled from ${sourceLabel}. Each rally is copied from that log onto a new score. No averages, rates, totals, or coaching notes.`,
    analysis: {
      ...raw.analysis,
      source_path: sourceLabel,
      incomplete: !done,
      sparse_rally_count: 0,
      notes: `Synthetic ${id}, seed ${seed}. ${raw.analysis.notes}`,
    },
    conventions: raw.conventions,
    match: {
      title: titleFor(index),
      format: 'doubles',
      video: { path: `demo/${id}.mp4` },
      teams: raw.match.teams,
      players: raw.match.players,
      points,
      rallies,
      serves,
      rally_outcomes: outcomes,
      ball_ground_hits: bounces,
    },
    players,
  };
  return { report, id, line: leading(score, sides).line, rallies: rallyNumber, done };
}

function assertScoring(path: string) {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Report;
  const id = basename(path, '.json');
  const built = buildGameReport(id, rel(path), raw);
  const bad = built.data_quality.filter((check) => SCORING_CHECKS.includes(check.id) && check.count > 0);
  if (bad.length) throw new Error(`${id} failed ${bad.map((check) => `${check.id} ${check.count}/${check.of}`).join(', ')}`);
}

if (process.argv.includes('--help')) {
  console.log('node scripts/generate-demo.ts [--count 500] [--seed 1] [--source <raw.json>] [--out <dir>]');
  process.exit(0);
}

const count = Number(option('--count') ?? '500');
const seed = Number(option('--seed') ?? '1');
const sourcePath = option('--source') ?? defaultSource;
const outDir = option('--out') ?? defaultOut;
if (!Number.isInteger(count) || count < 1 || count > 10000) throw new Error('--count must be an integer from 1 to 10000');
if (!Number.isFinite(seed)) throw new Error('--seed must be a number');

const sourceLabel = rel(sourcePath);
const raw = JSON.parse(readFileSync(sourcePath, 'utf8')) as Report;
const pools = indexRallies(raw);
const rng = mulberry32(seed);
const seen = new Set<string>();
mkdirSync(outDir, { recursive: true });
for (const file of readdirSync(outDir)) if (/^demo_\d+\.json$/.test(file)) rmSync(join(outDir, file));

let bytes = 0;
let open = 0;
const examples: string[] = [];
for (let index = 0; index < count; index += 1) {
  const game = buildGame(raw, pools, rng, index, count, seed, sourceLabel);
  if (!game.done) open += 1;
  if (seen.has(game.report.match.title)) throw new Error(`duplicate title ${game.report.match.title}`);
  seen.add(game.report.match.title);
  const name = fileName(index + 1, count);
  const text = `${JSON.stringify(game.report)}\n`;
  writeFileSync(join(outDir, name), text);
  bytes += Buffer.byteLength(text);
  if (index === 0 || index === Math.floor(count / 2) || index === count - 1) {
    examples.push(`${name}  ${game.line}  ${game.rallies} rallies  ${game.done ? 'final' : 'incomplete'}  ${game.report.match.title}`);
  }
  if ((index + 1) % 50 === 0 || index + 1 === count) console.log(`wrote ${index + 1}/${count}`);
}

for (const n of new Set([1, Math.ceil(count / 2), count])) assertScoring(join(outDir, fileName(n, count)));
console.log(`wrote ${count} games to ${rel(outDir)} (${(bytes / 1_048_576).toFixed(1)} MB, ${open} incomplete)`);
for (const line of examples) console.log(line);
