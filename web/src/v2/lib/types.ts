// Shape of a v2 report: docs/demo/reports/v2/<id>.json. Language-neutral: ids, keys, and numbers only.
// Field ids (`ST-01`) are the ids of the field dictionary at https://matchdoctor.fields.lksp.dev/.
export type Id = string;
export type FieldId = string;
export type Score = Record<Id, number>;

// measured: read from the logs. derived: a rule over measured figures. demo: a seeded stand-in.
export type Source = 'measured' | 'derived' | 'demo';

export type Priority = 'must' | 'should' | 'could';

export type Unit = 'pct' | 'count' | 'avg' | 'sec' | 'kmh' | 'm' | 'shots';

// A rate carries made/of; any other figure has only a value.
export type Figure = { value: number | null; made?: number; of?: number };

export type MetricKey =
  | 'serve_in'
  | 'serve_deep'
  | 'serve_points_won'
  | 'aces'
  | 'return_in'
  | 'return_deep'
  | 'side_out'
  | 'third_drop'
  | 'first_to_kitchen'
  | 'kitchen_arrival'
  | 'transition_losses'
  | 'dinks_per_rally'
  | 'dink_in_kitchen'
  | 'pop_up'
  | 'speedups'
  | 'speedup_won'
  | 'counter'
  | 'reset'
  | 'lob_won'
  | 'unforced'
  | 'forced'
  | 'winners';

export type Metric = {
  field: FieldId;
  key: MetricKey;
  unit: Unit;
  better: 'higher' | 'lower' | 'neither';
  // For rates: the range a 3.5–4.0 team usually reaches.
  target: [number, number] | null;
  teams: Record<Id, Figure>;
  source: Source;
};

export type Part = { label: string; value: number };

export type SplitKey = 'serve_depth' | 'serve_target' | 'return_depth' | 'third_mix' | 'error_types' | 'won_by' | 'lost_by';

export type Split = { field: FieldId; key: SplitKey; teams: Record<Id, Part[]>; source: Source };

export type PhaseId = 'serve' | 'return' | 'third' | 'transition' | 'kitchen' | 'finish';

export type Phase = { id: PhaseId; metrics: Metric[]; splits: Split[] };

export type Takeaway = {
  field: FieldId;
  key: MetricKey;
  unit: Unit;
  us: Figure;
  them: Figure;
  // Points the gap is worth: (our rate - their rate) x our attempts x what one success is worth, sign flipped when lower is better.
  impact: number;
  rally: ClipRef | null;
  source: Source;
};

export type ClipRef = { game: number; rally_number: number };

export type TeamSummary = {
  verdict: { won: boolean; strength: MetricKey | null; leak: MetricKey | null }; // MI-08
  // Up to five, best first, one per phase of the rally: the first three are MI-09 and MI-10, all five TD-01 and TD-02.
  strengths: Takeaway[];
  leaks: Takeaway[];
  deciding: Takeaway | null; // MI-11
  focus: { player_id: Id; key: MetricKey; now: number; target: number } | null; // MI-12
  must_watch: (ClipRef & { kind: 'highlight' | 'leak' })[]; // MI-13
};

export type ClipTag = 'highlight' | 'error' | 'attack' | 'erne' | 'atp' | 'longest';

export type Clip = ClipRef & {
  score_call: string | null;
  server_id: Id | null;
  start_sec: number;
  end_sec: number;
  shots: number;
  winner_team_id: Id | null;
  scoring: boolean;
  ended: { kind: 'error' | 'winner' | 'unknown'; player_id: Id | null; error_type: string | null; cause: string | null };
  score_after: Score;
  tags: ClipTag[];
};

export type WormPoint = { game: number; rally_number: number; diff: number; score: Score; team_id: Id };

export type Streak = ClipRef & { team_id: Id; length: number; from: Score; to: Score };

export type Momentum = {
  worm: WormPoint[];
  runs: Streak[]; // MO-06
  droughts: Streak[]; // MO-07
  clutch: Record<Id, { converted: Figure; saved: Figure }>; // MO-08
  turns: (Streak & { kind: 'run' | 'drought' })[]; // MO-09, one per game
};

export type RadarAxis = 'serve' | 'return' | 'third' | 'dink' | 'hands' | 'defense';

export type Height = 'below' | 'level' | 'above';
export type CauseTag = 'rushed' | 'balance' | 'shot_choice' | 'position' | 'execution';

export type ErrorLink = ClipRef & {
  gesture: string; // IA-07
  incoming_kmh: number | null; // IA-08
  incoming: 'slow' | 'medium' | 'fast' | null;
  height: Height | null; // IA-09
  spin: 'topspin' | 'slice' | 'flat'; // IA-10, demo
  zone: 'kitchen' | 'transition' | 'baseline'; // IA-11
  from_player: Id | null; // IA-12
  from_dir: 'cross' | 'straight' | null;
  cause: CauseTag; // IA-06, demo
  error_type: string | null;
};

export type PlayerV2 = {
  player_id: Id;
  team_id: Id;
  hand: 'right' | 'left'; // MI-03, demo
  shots: number;
  radar: { axis: RadarAxis; value: number; source: Source }[]; // ST-36
  mix: Part[]; // ST-31
  touch: number[]; // ST-34: 9 cells of own half, net row first, left to right
  landing: number[]; // ST-35: 9 cells of the other half, net row first
  speed: { key: 'serve' | 'drive' | 'speedup'; avg: number | null; max: number | null; n: number }[]; // ST-28
  errors: { unforced: number; forced: number; per100: number | null; types: Part[] }; // ST-22/23/25
  speedups: { count: number; per10dinks: number | null }; // ST-17
  targeted: Figure; // TD-09
  poach: Figure; // TD-07, demo
  under_attack: {
    // IA-01..05, demo
    from: number[];
    targets: Part[];
    behind_line_m: number;
    off_ideal_m: number;
    over_1m: number;
    holes: Part[];
  };
  error_chain: ErrorLink[];
  patterns: { gesture: string; height: Height; count: number; of: number }[]; // IA-13
  conditional: { gesture: string; below: Figure; above: Figure }[]; // IA-14
};

export type Partnership = {
  team_id: Id;
  middle: { forehand: number; other: number; both: number; neither: number }; // TD-03, demo
  middle_lost: Figure; // TD-04, demo
  together: Figure; // TD-05, measured
  split_count: number; // TD-05, demo
  spacing_m: number | null; // TD-06, measured
  gap: number; // TD-06, demo
  crowd: number;
  stacking: { share: number; won: Figure; not: Figure; switch_errors: number }; // TD-08, demo
  summary: { strength: MetricKey | null; leak: MetricKey | null; target_player: Id | null }; // TD-10
};

export type DrillId =
  | 'serve_targets'
  | 'deep_returns'
  | 'drop_ladder'
  | 'kitchen_race'
  | 'reset_wall'
  | 'dink_targets'
  | 'speedup_choice'
  | 'counter_blocks'
  | 'patience_dinks'
  | 'middle_calls';

export type Focus = {
  key: MetricKey;
  field: FieldId;
  unit: Unit;
  now: number;
  them: number | null;
  target: number;
  min_attempts: number; // TR-04
  drill: DrillId; // TR-02
  rallies: ClipRef[];
  source: Source;
};

export type PlayerPlan = {
  player_id: Id;
  focus: Focus[]; // TR-01..04
  keep: { key: MetricKey; value: number; unit: Unit } | null; // TR-06
};

export type ReportV2 = {
  version: 'v2-trial';
  id: string;
  kind: 'game' | 'match';
  number: number | null;
  title: string;
  info: {
    format: { play: 'doubles'; scoring: 'side_out'; to: number; best_of: number }; // MI-01
    event: { date: string; venue: string }; // MI-02, demo
    games: { number: number; score: Score; winner_team_id: Id }[]; // MI-04
    winner_team_id: Id;
    duration_sec: number; // MI-05
    play_sec: number;
    rallies: number; // MI-06
    served: Record<Id, number>;
    tracked: Figure; // MI-07
    estimates: FieldId[];
    checks: { warnings: number; of: number };
  };
  teams: { team_id: Id; end: 'far' | 'near'; player_ids: Id[] }[];
  summary: Record<Id, TeamSummary>;
  phases: Phase[];
  shape: {
    avg_shots: number; // ST-26
    longest: ClipRef & { shots: number }; // ST-27
    longest_run: Score; // ST-29
    longest_dinks: ClipRef & { dinks: number }; // ST-30
    lengths: { label: string; rallies: number; won: Record<Id, Figure> }[]; // ST-32
  };
  momentum: Momentum;
  clips: Clip[]; // MO-01..05
  players: PlayerV2[];
  partnership: Partnership[];
  plan: { players: PlayerPlan[]; teams: Record<Id, Focus[]> }; // TR-01..06
  coverage: { field: FieldId; priority: Priority; source: Source | 'not_applicable' }[];
};
