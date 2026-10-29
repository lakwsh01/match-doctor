import { teamIds, teamOf } from './derive.ts';
import type { Score } from './derive.ts';
import type { AttackType, Bounce, ErrorType, Gesture, Id, Point, Rally, RallyOutcome, Report, Serve, Stroke, TrackSample } from './types';

type Cause = 'unforced' | 'forced';

// One paddle contact with every event the raw report logs against its shot_id.
export type Contact = {
  shot_id: string;
  shot_number: number;
  rally_number: number;
  player_id: Id;
  team_id: Id;
  gesture: Gesture;
  time_sec: number;
  at: Pick<Stroke, 'x_m' | 'y_m' | 'height_above_net_m'>;
  speed_mps: number | null;
  reaction_sec: number | null;
  stimulus: 'opponent_contact' | 'ball_bounce' | null;
  attack: { type: AttackType; won: boolean } | null;
  error: { type: ErrorType; cause: Cause } | null;
  bounce: Pick<Bounce, 'x_m' | 'y_m' | 'zone' | 'in_bounds' | 'line_call_confidence'> | null;
};

// An error with no contact: the player missed the ball.
type Miss = { player_id: Id; team_id: Id; rally_number: number; time_sec: number; type: ErrorType; cause: Cause };

export type RallyFact = {
  rally: Rally;
  point: Point | null;
  serve: Serve | null;
  outcome: RallyOutcome | null;
  contacts: Contact[];
  misses: Miss[];
  tracks: { player_id: Id; samples: TrackSample[] }[];
  servingTeam: Id | null;
  winnerTeam: Id | null;
  score: Score;
};

const shotNumber = (shotId: string) => Number(shotId.slice(shotId.indexOf('s') + 1));

function byShot<T extends { shot_id: string | null }>(items: T[]) {
  return new Map(items.map((item) => [item.shot_id, item]));
}

function contacts(raw: Report): Contact[] {
  return Object.entries(raw.players)
    .flatMap(([player_id, p]) => {
      const speeds = byShot(p.ball_speeds);
      const reactions = byShot(p.reaction_times);
      const bounces = byShot(p.ball_ground_hits);
      const attacks = new Map<string | null, Contact['attack']>([
        ...p.attacks.successful.map((a) => [a.shot_id, { type: a.attack_type, won: true }] as const),
        ...p.attacks.unsuccessful.map((a) => [a.shot_id, { type: a.attack_type, won: false }] as const),
      ]);
      const errors = new Map(
        Object.entries(p.errors).flatMap(([type, list]) =>
          list.map((e) => [e.shot_id, { type: type as ErrorType, cause: e.cause }] as const),
        ),
      );
      const team_id = teamOf(raw, player_id);
      return p.hitting_gestures.map((g): Contact => {
        const bounce = bounces.get(g.shot_id);
        const reaction = reactions.get(g.shot_id);
        return {
          shot_id: g.shot_id,
          shot_number: shotNumber(g.shot_id),
          rally_number: g.rally_number,
          player_id,
          team_id,
          gesture: g.gesture,
          time_sec: g.time_sec,
          at: { x_m: g.x_m, y_m: g.y_m, height_above_net_m: g.height_above_net_m },
          speed_mps: speeds.get(g.shot_id)?.speed_mps ?? null,
          reaction_sec: reaction?.reaction_sec ?? null,
          stimulus: reaction?.stimulus ?? null,
          attack: attacks.get(g.shot_id) ?? null,
          error: errors.get(g.shot_id) ?? null,
          bounce: bounce
            ? {
                x_m: bounce.x_m,
                y_m: bounce.y_m,
                zone: bounce.zone,
                in_bounds: bounce.in_bounds,
                line_call_confidence: bounce.line_call_confidence,
              }
            : null,
        };
      });
    })
    .sort((a, b) => a.rally_number - b.rally_number || a.shot_number - b.shot_number);
}

function misses(raw: Report): Miss[] {
  return Object.entries(raw.players).flatMap(([player_id, p]) =>
    Object.entries(p.errors).flatMap(([type, list]) =>
      list
        .filter((e) => e.shot_id === null)
        .map((e) => ({
          player_id,
          team_id: teamOf(raw, player_id),
          rally_number: e.rally_number,
          time_sec: e.time_sec,
          type: type as ErrorType,
          cause: e.cause,
        })),
    ),
  );
}

// Joins every event to its rally. The serve record names the server and the rally
// outcome names the winner; position tracks are cut to the rally's time window.
export function rallyFacts(raw: Report): RallyFact[] {
  const all = contacts(raw);
  const missed = misses(raw);
  const points = new Map(raw.match.points.map((p) => [p.point_number, p]));
  const serves = new Map(raw.match.serves.map((s) => [s.rally_number, s]));
  const outcomes = new Map(raw.match.rally_outcomes.map((o) => [o.rally_number, o]));
  const running = Object.fromEntries(teamIds(raw).map((t) => [t, 0]));

  return raw.match.rallies.map((rally) => {
    const inRally = <T extends { rally_number: number }>(items: T[]) =>
      items.filter((item) => item.rally_number === rally.rally_number);
    const point = (rally.point_number !== null && points.get(rally.point_number)) || null;
    const serve = serves.get(rally.rally_number) ?? null;
    const outcome = outcomes.get(rally.rally_number) ?? null;
    if (point) running[point.winner_team_id] += 1;
    return {
      rally,
      point,
      serve,
      outcome,
      contacts: inRally(all),
      misses: inRally(missed),
      tracks: Object.entries(raw.players).map(([player_id, p]) => ({
        player_id,
        samples: p.position_track.filter((s) => s.time_sec >= rally.start_sec && s.time_sec <= rally.end_sec),
      })),
      servingTeam: serve ? teamOf(raw, serve.server_player_id) : null,
      winnerTeam: outcome?.winner_team_id ?? point?.winner_team_id ?? null,
      score: { ...running },
    };
  });
}

// Every error in the rally, with or without a contact.
export function rallyErrors(fact: RallyFact) {
  return [
    ...fact.contacts.flatMap((c) =>
      c.error
        ? [{ player_id: c.player_id, team_id: c.team_id, gesture: c.gesture as string, shot_number: c.shot_number, ...c.error }]
        : [],
    ),
    ...fact.misses.map((m) => ({ ...m, gesture: 'no_contact', shot_number: 0 })),
  ];
}
