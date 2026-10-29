import { count, dist, groupBy, rate, tally } from '../stats.ts';
import type { Dist, Rate, Tally } from '../stats.ts';
import { teamOf } from './derive.ts';
import { rallyErrors } from './contacts.ts';
import type { Contact, RallyFact } from './contacts.ts';
import { positioning } from './position.ts';
import type { Positioning } from './position.ts';
import type { Bounce, Id, Report } from './types';

export const DEEP_M = 1.5;
// Net top height at the posts. A contact lower than this below the net top is below the ground.
export const NET_HEIGHT_M = 0.914;

type Landing = Pick<Bounce, 'x_m' | 'y_m' | 'zone' | 'in_bounds'>;
type LabeledDist = Dist & { label: string };

export type PlayerReport = {
  player_id: Id;
  team_id: Id;
  points_won: number;
  shots: { total: number; forehand: number; backhand: number; by_gesture: Tally };
  serve: { count: number; faults: number; in: Rate; deep: Rate; depth_m: Dist; speed_mps: Dist };
  return: { count: number; missed: number; in: Rate; deep: Rate; depth_m: Dist; speed_mps: Dist };
  third_shot: { count: number; drops: number; drives: number; drop_in_kitchen: Rate; by_gesture: Tally };
  dinks: { count: number; errors: number; in_kitchen: Rate };
  attacks: { won: Rate; by_type: { label: string; won: Rate }[] };
  errors: { total: number; unforced: number; forced: number; per_shot: Rate; by_type: Tally; by_gesture: Tally; by_phase: Tally };
  ball_speed_mps: { all: Dist; by_gesture: LabeledDist[] };
  reaction_sec: { all: Dist; by_stimulus: LabeledDist[] };
  contact: { height_m: Dist; above_net: Rate };
  movement: { speed_mps: Dist };
  positioning: Positioning;
  placement: { in: Rate; kitchen: Rate; by_zone: Tally; by_lane: Tally };
  targeted: Rate;
};

const PHASES = ['serve', 'return', 'third_shot', 'fourth_shot'];
const phase = (shot: number) => (shot === 0 ? 'no_contact' : (PHASES[shot - 1] ?? 'fifth_shot_or_later'));

function distBy<T>(items: T[], label: (item: T) => string, value: (item: T) => number | null): LabeledDist[] {
  return groupBy(
    items.filter((i) => value(i) !== null),
    label,
  ).map(([key, group]) => ({ label: key, ...dist(group.map((i) => value(i) as number)) }));
}

export function playerReport(raw: Report, facts: RallyFact[], playerId: Id): PlayerReport {
  const court = raw.conventions.court;
  const { width_m, length_m, net_y_m } = court;
  const teamId = teamOf(raw, playerId);
  const end = raw.match.teams.find((t) => t.team_id === teamId)?.end ?? 'far';
  const p = raw.players[playerId];

  const own = facts.flatMap((f) => f.contacts.filter((c) => c.player_id === playerId));
  const errors = facts.flatMap((f) => rallyErrors(f).filter((e) => e.player_id === playerId));
  const attacks = own.flatMap((c) => (c.attack ? [c.attack] : []));

  const landed = (cs: Contact[]) => cs.flatMap((c) => (c.bounce?.in_bounds ? [c.bounce] : []));
  const toBaseline = (b: Landing) => (b.y_m > net_y_m ? length_m - b.y_m : b.y_m);
  const inKitchen = (b: Landing | null) => Boolean(b?.in_bounds && b.zone.endsWith('_kitchen'));
  const lane = (b: Landing) => (b.x_m < width_m / 3 ? 'left' : b.x_m < (width_m * 2) / 3 ? 'middle' : 'right');

  const opening = (cs: Contact[]) => {
    const depths = landed(cs).map(toBaseline);
    return {
      count: cs.length,
      in: rate(count(cs, (c) => Boolean(c.bounce?.in_bounds) && c.error === null), cs.length),
      deep: rate(count(depths, (d) => d <= DEEP_M), depths.length),
      depth_m: dist(depths),
      speed_mps: dist(cs.flatMap((c) => (c.speed_mps === null ? [] : [c.speed_mps]))),
    };
  };

  const serves = own.filter((c) => c.gesture === 'serve');
  const thirds = own.filter((c) => c.shot_number === 3);
  const drops = thirds.filter((c) => c.gesture.endsWith('_drop'));
  const dinks = own.filter((c) => c.gesture.endsWith('_dink'));
  const bounces = own.flatMap((c) => (c.bounce ? [c.bounce] : []));
  const replies = facts.flatMap((f) =>
    f.contacts.slice(1).filter((c, i) => c.team_id === teamId && f.contacts[i].team_id !== teamId),
  );
  const heights = own.map((c) => c.at.height_above_net_m).filter((h) => h >= -NET_HEIGHT_M);

  return {
    player_id: playerId,
    team_id: teamId,
    points_won: count(raw.match.points, (pt) => pt.winner_player_id === playerId),
    shots: {
      total: own.length,
      forehand: count(own, (c) => c.gesture.startsWith('forehand_')),
      backhand: count(own, (c) => c.gesture.startsWith('backhand_')),
      by_gesture: tally(own.map((c) => c.gesture)),
    },
    serve: { ...opening(serves), faults: p.errors.serve_fault.length },
    return: { ...opening(own.filter((c) => c.shot_number === 2)), missed: p.errors.missed_return.length },
    third_shot: {
      count: thirds.length,
      drops: drops.length,
      drives: count(thirds, (c) => c.gesture.endsWith('_drive')),
      drop_in_kitchen: rate(count(drops, (c) => inKitchen(c.bounce)), drops.length),
      by_gesture: tally(thirds.map((c) => c.gesture)),
    },
    dinks: {
      count: dinks.length,
      errors: count(dinks, (c) => c.error !== null),
      in_kitchen: rate(count(dinks, (c) => inKitchen(c.bounce)), dinks.length),
    },
    attacks: {
      won: rate(count(attacks, (a) => a.won), attacks.length),
      by_type: groupBy(attacks, (a) => a.type).map(([label, group]) => ({
        label,
        won: rate(count(group, (a) => a.won), group.length),
      })),
    },
    errors: {
      total: errors.length,
      unforced: count(errors, (e) => e.cause === 'unforced'),
      forced: count(errors, (e) => e.cause === 'forced'),
      per_shot: rate(errors.length, own.length + count(errors, (e) => e.shot_number === 0)),
      by_type: tally(errors.map((e) => e.type)),
      by_gesture: tally(errors.map((e) => e.gesture)),
      by_phase: tally(errors.map((e) => phase(e.shot_number))),
    },
    ball_speed_mps: {
      all: dist(own.flatMap((c) => (c.speed_mps === null ? [] : [c.speed_mps]))),
      by_gesture: distBy(own, (c) => c.gesture, (c) => c.speed_mps),
    },
    reaction_sec: {
      all: dist(own.flatMap((c) => (c.reaction_sec === null ? [] : [c.reaction_sec]))),
      by_stimulus: distBy(own, (c) => c.stimulus ?? '', (c) => c.reaction_sec),
    },
    contact: { height_m: dist(heights), above_net: rate(count(heights, (h) => h > 0), heights.length) },
    movement: { speed_mps: dist(p.movement_speeds.map((m) => m.speed_mps)) },
    positioning: positioning(facts, playerId, court, end),
    placement: {
      in: rate(count(bounces, (b) => b.in_bounds), bounces.length),
      kitchen: rate(count(bounces, inKitchen), count(bounces, (b) => b.in_bounds)),
      by_zone: tally(bounces.map((b) => b.zone)),
      by_lane: tally(bounces.filter((b) => b.in_bounds).map(lane)),
    },
    targeted: rate(count(replies, (c) => c.player_id === playerId), replies.length),
  };
}
