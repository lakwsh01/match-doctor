// Mirrors report schema 2.0 (see README.md). Ids are strings, as in the JSON.
export type Id = string;

export type ErrorType =
  | 'into_net'
  | 'out_wide'
  | 'out_long'
  | 'serve_fault'
  | 'foot_fault'
  | 'kitchen_violation'
  | 'missed_return';

export type AttackType = 'drive' | 'speedup' | 'overhead' | 'erne' | 'around_the_post' | 'lob' | 'putaway';

export type Gesture =
  | 'serve'
  | 'return'
  | 'forehand_dink'
  | 'backhand_dink'
  | 'forehand_drive'
  | 'backhand_drive'
  | 'forehand_drop'
  | 'backhand_drop'
  | 'forehand_volley'
  | 'backhand_volley'
  | 'forehand_roll'
  | 'backhand_roll'
  | 'overhead'
  | 'lob'
  | 'speedup'
  | 'reset'
  | 'erne'
  | 'around_the_post';

export type Zone =
  | 'far_kitchen'
  | 'far_transition'
  | 'far_baseline'
  | 'near_kitchen'
  | 'near_transition'
  | 'near_baseline'
  | 'out_left'
  | 'out_right'
  | 'out_far'
  | 'out_near'
  | 'net';

export type CourtSpec = {
  unit: 'meter';
  width_m: number;
  length_m: number;
  net_y_m: number;
  kitchen_depth_m: number;
  x_m: string;
  y_m: string;
  zones: Zone[];
};

type InRally = { point_number: number | null; rally_number: number };
type Spot = { x_m: number; y_m: number };

export type Bounce = InRally & Spot & { shot_id: string | null; time_sec: number; zone: Zone; in_bounds: boolean };
export type MatchBounce = Bounce & { hitter_player_id: Id };
export type PlayError = InRally & { shot_id: string | null; time_sec: number; cause: 'unforced' | 'forced' };
export type Attack = InRally & { shot_id: string | null; time_sec: number; attack_type: AttackType };
export type Movement = InRally & { start_sec: number; end_sec: number; speed_mps: number; from: Spot; to: Spot };
export type BallSpeed = InRally & { shot_id: string; time_sec: number; speed_mps: number };
export type Reaction = InRally & {
  shot_id: string;
  stimulus: 'opponent_contact' | 'ball_bounce';
  stimulus_sec: number;
  contact_sec: number;
  reaction_sec: number;
};
export type Stroke = InRally & { shot_id: string; time_sec: number; gesture: Gesture };

export type Point = {
  point_number: number;
  start_sec: number;
  end_sec: number;
  server_player_id: Id;
  winner_player_id: Id;
  winner_team_id: Id;
};

export type Rally = {
  rally_number: number;
  point_number: number | null;
  scoring: boolean;
  start_sec: number;
  end_sec: number;
  duration_sec: number;
  shot_count: number;
};

export type PlayerEvents = {
  errors: Record<ErrorType, PlayError[]>;
  attacks: { successful: Attack[]; unsuccessful: Attack[] };
  movement_speeds: Movement[];
  ball_speeds: BallSpeed[];
  reaction_times: Reaction[];
  hitting_gestures: Stroke[];
  ball_ground_hits: Bounce[];
};

export type Report = {
  schema_version: '2.0';
  sample: boolean;
  sample_note: string;
  conventions: {
    time_sec: string;
    speed_mps: string;
    reaction_sec: string;
    court: CourtSpec;
    rally_number: string;
    shot_count: string;
    shot_id: string;
    error_types: ErrorType[];
    attack_types: AttackType[];
    attack_result: { successful: string; unsuccessful: string };
    gestures: Gesture[];
    error_cause: ('unforced' | 'forced')[];
  };
  match: {
    title: string;
    format: 'doubles';
    video: { path: string };
    teams: { team_id: Id; end: 'far' | 'near'; player_ids: Id[] }[];
    players: { player_id: Id; team_id: Id }[];
    points: Point[];
    rallies: Rally[];
    ball_ground_hits: MatchBounce[];
  };
  players: Record<Id, PlayerEvents>;
};
