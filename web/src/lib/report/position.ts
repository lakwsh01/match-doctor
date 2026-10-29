import { count, dist, rate } from '../stats.ts';
import type { Dist, Rate } from '../stats.ts';
import type { RallyFact } from './contacts.ts';
import type { CourtSpec, Id, TrackSample } from './types';

export const KITCHEN_REACH_M = 0.75;
const HEAT_CELL_M = 0.5;
export const DISTANCE_STEP_SEC = 0.5;
const MARGIN_M = 1;

type End = 'far' | 'near';

// Cell layout for every `heat` list: row-major counts of 10 Hz track samples, from (x0_m, y0_m).
export type HeatGrid = { cell_m: number; x0_m: number; y0_m: number; cols: number; rows: number };

export type Positioning = {
  samples: number;
  kitchen_time: Rate;
  net_distance_m: Dist;
  distance_m: number;
  kitchen_arrival: Rate;
  kitchen_arrival_sec: Dist;
  heat: number[];
};

export type TeamPositioning = { both_at_kitchen: Rate; partner_spacing_m: Dist };

// Non-empty cells of a heat list, in meters, with a 0-1 level. The square root keeps rare cells visible.
export function heatCells(grid: HeatGrid, counts: number[]) {
  const most = Math.max(1, ...counts);
  return counts.flatMap((n, i) =>
    n
      ? [
          {
            x: grid.x0_m + (i % grid.cols) * grid.cell_m,
            y: grid.y0_m + Math.floor(i / grid.cols) * grid.cell_m,
            w: grid.cell_m,
            h: grid.cell_m,
            level: Math.sqrt(n / most),
          },
        ]
      : [],
  );
}

export function heatGrid(court: CourtSpec): HeatGrid {
  return {
    cell_m: HEAT_CELL_M,
    x0_m: -MARGIN_M,
    y0_m: -MARGIN_M,
    cols: Math.ceil((court.width_m + MARGIN_M * 2) / HEAT_CELL_M),
    rows: Math.ceil((court.length_m + MARGIN_M * 2) / HEAT_CELL_M),
  };
}

// True when y is at the player's own kitchen line: inside the kitchen or just behind it.
function atKitchenLine(court: CourtSpec, end: End) {
  const { net_y_m: net, kitchen_depth_m: kitchen } = court;
  return (y: number) =>
    end === 'far' ? y >= net - kitchen - KITCHEN_REACH_M && y <= net : y >= net && y <= net + kitchen + KITCHEN_REACH_M;
}

// Path length using one sample every DISTANCE_STEP_SEC, so frame-to-frame tracking jitter does not add up.
function travelled(samples: TrackSample[]) {
  let total = 0;
  let last = samples[0];
  for (const s of samples) {
    if (s.time_sec - last.time_sec < DISTANCE_STEP_SEC) continue;
    total += Math.hypot(s.x_m - last.x_m, s.y_m - last.y_m);
    last = s;
  }
  return total;
}

const trackOf = (f: RallyFact, playerId: Id) => f.tracks.find((t) => t.player_id === playerId)?.samples ?? [];

export function positioning(facts: RallyFact[], playerId: Id, court: CourtSpec, end: End): Positioning {
  const grid = heatGrid(court);
  const atLine = atKitchenLine(court, end);
  const rallies = facts.map((f) => ({ f, samples: trackOf(f, playerId) })).filter((r) => r.samples.length);
  const samples = rallies.flatMap((r) => r.samples);
  const arrivals = rallies.flatMap(({ f, samples: track }) => {
    const first = track.find((s) => atLine(s.y_m));
    return first ? [first.time_sec - (f.serve?.time_sec ?? f.rally.start_sec)] : [];
  });

  const heat: number[] = new Array(grid.cols * grid.rows).fill(0);
  for (const s of samples) {
    const col = Math.floor((s.x_m - grid.x0_m) / grid.cell_m);
    const row = Math.floor((s.y_m - grid.y0_m) / grid.cell_m);
    if (col >= 0 && col < grid.cols && row >= 0 && row < grid.rows) heat[row * grid.cols + col] += 1;
  }

  return {
    samples: samples.length,
    kitchen_time: rate(count(samples, (s) => atLine(s.y_m)), samples.length),
    net_distance_m: dist(samples.map((s) => Math.abs(s.y_m - court.net_y_m))),
    distance_m: rallies.reduce((sum, r) => sum + travelled(r.samples), 0),
    kitchen_arrival: rate(arrivals.length, rallies.length),
    kitchen_arrival_sec: dist(arrivals),
    heat,
  };
}

// Pairs the two partners' samples taken at the same tenth of a second.
export function teamPositioning(facts: RallyFact[], playerIds: Id[], court: CourtSpec, end: End): TeamPositioning {
  const atLine = atKitchenLine(court, end);
  const pairs = facts.flatMap((f) => {
    const [mine, partner] = playerIds.map((id) => new Map(trackOf(f, id).map((s) => [Math.round(s.time_sec * 10), s])));
    return [...mine].flatMap(([tick, s]) => {
      const other = partner?.get(tick);
      return other ? [[s, other] as const] : [];
    });
  });
  return {
    both_at_kitchen: rate(count(pairs, ([a, b]) => atLine(a.y_m) && atLine(b.y_m)), pairs.length),
    partner_spacing_m: dist(pairs.map(([a, b]) => Math.hypot(a.x_m - b.x_m, a.y_m - b.y_m))),
  };
}
