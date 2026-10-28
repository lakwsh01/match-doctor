import { mean } from '../stats.ts';
import { rallyErrors } from './contacts.ts';
import type { RallyFact } from './contacts.ts';
import type { Gesture, Report } from './types';

export type QualityCheck = { id: string; status: 'ok' | 'warning'; count: number; of: number; detail: string };

const REACTION_SPREAD_MIN_SEC = 0.05;

const isVolley = (g: Gesture) => g.endsWith('_volley') || g === 'overhead';

const check = (id: string, count: number, of: number, detail: string): QualityCheck => ({
  id,
  status: count ? 'warning' : 'ok',
  count,
  of,
  detail,
});

// Checks the raw log against the rules of the game. A warning names the figures that rest on it.
export function qualityChecks(raw: Report, facts: RallyFact[]): QualityCheck[] {
  const scored = facts.filter((f) => f.point);
  const pairs = facts.flatMap((f) => f.contacts.slice(1).map((c, i) => [f.contacts[i], c] as const));
  const volleys = pairs.filter(([, next]) => isVolley(next.gesture));
  const errors = facts.flatMap((f) => (f.winnerTeam ? rallyErrors(f).map((e) => e.team_id === f.winnerTeam) : []));
  const { net_y_m } = raw.conventions.court;
  const ends = new Map(raw.match.teams.flatMap((t) => t.player_ids.map((id) => [id, t.end] as const)));
  const moves = facts.flatMap((f) => f.moves);
  const onOtherHalf = moves.filter((m) => ((m.from.y_m + m.to.y_m) / 2 < net_y_m ? 'far' : 'near') !== ends.get(m.player_id));
  const reactions = Object.values(raw.players).flatMap((p) => p.reaction_times);
  const times = reactions.map((r) => r.reaction_sec);
  const spread = times.length ? Math.sqrt(mean(times.map((t) => (t - mean(times)) ** 2))) : 0;

  return [
    check(
      'serve_first',
      facts.filter((f) => !f.server).length,
      facts.length,
      'Rallies whose first logged contact is not a serve. Their server and rally winner are unknown.',
    ),
    check(
      'side_out_scoring',
      scored.filter((f) => f.servingTeam && f.servingTeam !== f.point?.winner_team_id).length,
      scored.length,
      'Points won by the receiving team. Only the serving team scores, so the server or the winner is wrong. Serve and side-out rates use the logged serve.',
    ),
    check(
      'point_server',
      scored.filter((f) => f.server && f.server !== f.point?.server_player_id).length,
      scored.length,
      'Points whose server_player_id is not the player who hit the serve.',
    ),
    check(
      'volley_after_bounce',
      volleys.filter(([shot]) => shot.bounce).length,
      volleys.length,
      'Volleys and overheads hit after the previous shot bounced. A volley is hit before the bounce, so placement or shot type is wrong.',
    ),
    check(
      'alternating_teams',
      pairs.filter(([a, b]) => a.team_id === b.team_id).length,
      pairs.length,
      'Back-to-back contacts by one team. The ball crosses the net between contacts, so contacts are missing. Shot counts are a lower bound.',
    ),
    check(
      'error_by_rally_winner',
      errors.filter(Boolean).length,
      errors.length,
      'Errors credited to the team that won the rally. An error ends the rally for the team that makes it.',
    ),
    check(
      'own_half',
      onOtherHalf.length,
      moves.length,
      "Player moves centred on the opponents' half. Either the team end or the position is wrong, which skews kitchen arrival.",
    ),
    check(
      'reaction_formula',
      reactions.filter((r) => Math.abs(r.contact_sec - r.stimulus_sec - r.reaction_sec) > 0.01).length,
      reactions.length,
      'Reaction times that do not equal contact_sec minus stimulus_sec.',
    ),
    check(
      'reaction_spread',
      spread < REACTION_SPREAD_MIN_SEC ? reactions.length : 0,
      reactions.length,
      `Reaction times have a standard deviation of ${spread.toFixed(3)} s. Below ${REACTION_SPREAD_MIN_SEC} s they look filled in rather than measured.`,
    ),
  ];
}
