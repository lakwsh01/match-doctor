import { count, mean } from '../stats.ts';
import { rallyErrors } from './contacts.ts';
import type { RallyFact } from './contacts.ts';
import { NET_HEIGHT_M } from './player.ts';
import type { Gesture, Report } from './types';

export type CheckId =
  | 'serve_record'
  | 'side_out_scoring'
  | 'point_server'
  | 'score_call'
  | 'outcome_vs_point'
  | 'alternating_teams'
  | 'volley_after_bounce'
  | 'error_by_rally_winner'
  | 'contact_height_range'
  | 'ball_speed_ceiling'
  | 'movement_speed_ceiling'
  | 'reaction_floor'
  | 'reaction_formula'
  | 'reaction_spread'
  | 'own_half'
  | 'bounce_side'
  | 'contact_side';

// The words for a check live in the message files (`check.<id>.title` and `.detail`). `params` are the
// numbers its detail quotes.
export type QualityCheck = {
  id: CheckId;
  status: 'ok' | 'warning';
  count: number;
  of: number;
  params: Record<string, number>;
};

const REACTION_FLOOR_SEC = 0.1;
const REACTION_SPREAD_MIN_SEC = 0.05;
const CEILING_SHARE = 0.05;

const isVolley = (g: Gesture) => g.endsWith('_volley') || g === 'overhead';

const check = (id: CheckId, hits: number, of: number, params: QualityCheck['params'] = {}): QualityCheck => ({
  id,
  status: hits ? 'warning' : 'ok',
  count: hits,
  of,
  params,
});

// Values stuck at the top of their range: the largest value repeats in 5% or more of the samples.
function pinned(values: number[]) {
  const top = Math.max(...values);
  const atTop = count(values, (v) => v === top);
  return { top, atTop: atTop / values.length >= CEILING_SHARE ? atTop : 0 };
}

// Checks the raw log against the rules of the game and of physics. A warning names the figures that rest on it.
export function qualityChecks(raw: Report, facts: RallyFact[]): QualityCheck[] {
  const players = Object.values(raw.players);
  const scored = facts.filter((f) => f.point);
  const pairs = facts.flatMap((f) => f.contacts.slice(1).map((c, i) => [f.contacts[i], c] as const));
  const volleys = pairs.filter(([, next]) => isVolley(next.gesture));
  const errors = facts.flatMap((f) => (f.winnerTeam ? rallyErrors(f).map((e) => e.team_id === f.winnerTeam) : []));
  const contacts = facts.flatMap((f) => f.contacts);
  const heights = contacts.map((c) => c.at.height_above_net_m);
  const landed = contacts.filter((c) => c.bounce?.in_bounds);
  const ball = pinned(players.flatMap((p) => p.ball_speeds.map((b) => b.speed_mps)));
  const move = pinned(players.flatMap((p) => p.movement_speeds.map((m) => m.speed_mps)));
  const reactions = players.flatMap((p) => p.reaction_times);
  const times = reactions.map((r) => r.reaction_sec);
  const spread = times.length ? Math.sqrt(mean(times.map((t) => (t - mean(times)) ** 2))) : 0;
  const { net_y_m } = raw.conventions.court;
  const ends = new Map(raw.match.teams.flatMap((t) => t.player_ids.map((id) => [id, t.end] as const)));
  const samples = facts.flatMap((f) => f.tracks.flatMap((t) => t.samples.map((s) => ({ ...s, player_id: t.player_id }))));
  const calls = facts.filter((f) => f.serve && f.servingTeam);
  const wrongCalls = calls.filter((f) => {
    const before = { ...f.score };
    if (f.point) before[f.point.winner_team_id] -= 1;
    const serving = f.servingTeam as string;
    const receiving = Object.keys(before).find((t) => t !== serving) ?? '';
    return f.serve?.score_call !== `${before[serving]}-${before[receiving]}-${f.serve?.server_number}`;
  });

  return [
    check(
      'serve_record',
      count(facts, (f) => f.contacts[0]?.gesture !== 'serve' || f.contacts[0].player_id !== f.serve?.server_player_id),
      facts.length,
    ),
    check(
      'side_out_scoring',
      count(scored, (f) => f.servingTeam !== f.point?.winner_team_id),
      scored.length,
    ),
    check(
      'point_server',
      count(scored, (f) => f.serve?.server_player_id !== f.point?.server_player_id),
      scored.length,
    ),
    check('score_call', wrongCalls.length, calls.length),
    check(
      'outcome_vs_point',
      count(scored, (f) => f.outcome?.winner_team_id !== f.point?.winner_team_id),
      scored.length,
    ),
    check(
      'alternating_teams',
      count(pairs, ([a, b]) => a.team_id === b.team_id),
      pairs.length,
    ),
    check(
      'volley_after_bounce',
      count(volleys, ([shot]) => shot.bounce !== null),
      volleys.length,
    ),
    check('error_by_rally_winner', count(errors, Boolean), errors.length),
    check(
      'contact_height_range',
      count(heights, (h) => h < -NET_HEIGHT_M),
      heights.length,
      { net: NET_HEIGHT_M },
    ),
    check(
      'ball_speed_ceiling',
      ball.atTop,
      players.reduce((sum, p) => sum + p.ball_speeds.length, 0),
      { top: ball.top },
    ),
    check(
      'movement_speed_ceiling',
      move.atTop,
      players.reduce((sum, p) => sum + p.movement_speeds.length, 0),
      { top: move.top },
    ),
    check(
      'reaction_floor',
      count(times, (t) => t < REACTION_FLOOR_SEC),
      times.length,
      { floor: REACTION_FLOOR_SEC },
    ),
    check(
      'reaction_formula',
      count(reactions, (r) => Math.abs(r.contact_sec - r.stimulus_sec - r.reaction_sec) > 0.01),
      reactions.length,
    ),
    check('reaction_spread', spread < REACTION_SPREAD_MIN_SEC ? reactions.length : 0, reactions.length, {
      spread: Math.round(spread * 1000) / 1000,
      min: REACTION_SPREAD_MIN_SEC,
    }),
    check(
      'own_half',
      count(samples, (s) => (s.y_m < net_y_m ? 'far' : 'near') !== ends.get(s.player_id)),
      samples.length,
    ),
    check(
      'bounce_side',
      count(landed, (c) => (c.bounce && c.bounce.y_m < net_y_m ? 'far' : 'near') === ends.get(c.player_id)),
      landed.length,
    ),
    check(
      'contact_side',
      count(contacts, (c) => (c.at.y_m < net_y_m ? 'far' : 'near') !== ends.get(c.player_id)),
      contacts.length,
    ),
  ];
}
