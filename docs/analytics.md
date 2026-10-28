# Analytics coverage

This file lists the analytics a professional doubles player or coach reviews after a match, whether the raw reports in `docs/demo/raw/` support them, and what data is still missing.

Generated reports live in `docs/demo/reports/`: one per game and one per match (`*_match.json`). Run `npm run reports` from `web/` to rebuild them. Each figure carries its sample size: a `Rate` has `made`, `of`, and `pct`, and a `Dist` has `n`, `avg`, `min`, and `max`.

Status:

- **Yes**: in the report, and the raw data passes its checks.
- **Caution**: in the report, but a data-quality check fails for at least one game (see below).
- **No**: not possible with the current raw data.

## Coverage

### Score and momentum

| Analytic | Status | Report field |
| --- | --- | --- |
| Game result and score | Yes | `result.score`, `result.winner_team_id` |
| Match result, games won, total points | Yes | match `result` |
| Point-by-point score | Yes | `score_progression[]` |
| Game-point and close-out moments | Yes | Filter `score_progression[].score` |
| Scoring runs (longest, average) | Yes | `teams[].scoring_runs` |
| Rallies won | Caution | `teams[].rallies_won` |
| Points won on serve | Caution | `teams[].serve_points_won` |
| Side-outs on receive | Caution | `teams[].side_outs` |
| Win rate by rally length | Caution | `teams[].rally_length[]` |
| Rally duration, pace between rallies | Yes | `rallies[].duration_sec`, `start_sec`, `end_sec` |
| First or second server, score call (e.g. 4-2-1) | No | |

### Serve and return

| Analytic | Status | Report field |
| --- | --- | --- |
| Serves in, faults | Yes | `players[].serve.in`, `.faults` |
| Serve depth, deep serves | Yes | `players[].serve.depth_m`, `.deep` |
| Serve speed | Yes | `players[].serve.speed_mps` |
| Serve target lane | Yes | `rallies[].shots[0].bounce.x_m` |
| Serve type (power, spin, lob) | No | |
| Returns in, missed returns | Yes | `players[].return.in`, `.missed` |
| Return depth, speed | Yes | `players[].return.depth_m`, `.deep`, `.speed_mps` |
| Returner reaches the kitchen line | Caution | `players[].movement.kitchen_arrival` |
| Time to reach the kitchen line | No | |

### Third shot and transition

| Analytic | Status | Report field |
| --- | --- | --- |
| Third-shot choice (drop or drive) | Yes | `players[].third_shot.drops`, `.drives`, `.by_gesture` |
| Third-shot drops landing in the kitchen | Caution | `players[].third_shot.drop_in_kitchen` |
| Drop quality (attackable or not) | No | |
| Resets from the transition zone (count) | Yes | `players[].shots.by_gesture` (`reset`) |
| Reset quality | No | |
| Serving team at the net by shot 5 | No | |

### Kitchen and dinks

| Analytic | Status | Report field |
| --- | --- | --- |
| Dinks, dink errors | Caution | `players[].dinks.count`, `.errors` |
| Dinks landing in the kitchen | Caution | `players[].dinks.in_kitchen` |
| Dinks before the first attack | Yes | Count `rallies[].shots` up to `rallies[].first_attack` |
| Cross-court or straight dinks | No | |
| Erne and around-the-post shots | Yes | `players[].shots.by_gesture`, `.attacks.by_type` |

### Attack and defence

| Analytic | Status | Report field |
| --- | --- | --- |
| Attacks won, by type | Yes | `players[].attacks.won`, `.by_type[]` |
| Who attacks first, and their win rate | Yes | `teams[].first_attack.taken`, `.won`; `rallies[].first_attack` |
| How each rally ended (error or winner, by whom) | Caution | `rallies[].ended_by` |
| Points finished by each player | Caution | `players[].points_won` |
| Speed-ups on attackable balls only | No | |
| Hand battles won | No | |

### Errors

| Analytic | Status | Report field |
| --- | --- | --- |
| Errors, unforced and forced | Caution | `players[].errors.total`, `.unforced`, `.forced`; `teams[].errors` |
| Errors by type | Caution | `players[].errors.by_type` |
| Errors by shot | Caution | `players[].errors.by_gesture` |
| Errors by rally phase (serve, return, third shot...) | Caution | `players[].errors.by_phase` |
| Errors per shot | Caution | `players[].errors.per_shot` |

### Shot quality and placement

| Analytic | Status | Report field |
| --- | --- | --- |
| Shot mix, forehand and backhand split | Yes | `players[].shots` |
| Ball speed, overall and by shot | Yes | `players[].ball_speed_mps.all`, `.by_gesture[]` |
| Bounce map, zones, lanes, in-bounds rate | Caution | `rallies[].shots[].bounce`; `players[].placement` |
| Who opponents hit to | Yes | `players[].targeted` |
| Net clearance, ball height at contact | No | |
| Spin, trajectory | No | |

### Movement and physical

| Analytic | Status | Report field |
| --- | --- | --- |
| Movement speed | Caution | `players[].movement.speed_mps` |
| Distance covered | Caution | `players[].movement.distance_m` (move endpoints only, so a lower bound) |
| Movement paths per rally | Caution | `rallies[].moves[]` |
| Reaction time, by stimulus | Caution | `players[].reaction_sec.all`, `.by_stimulus[]` |
| Position heatmap, time at the kitchen line | No | |
| Partner spacing, stacking, court coverage | No | |
| Split-step timing | No | |
| Heart rate, workload | No | |

## Data-quality checks

Every game report has a `data_quality[]` list. The match report repeats it per game. On the current data:

| Check | Game 1 | Game 2 | Game 3 | What it affects |
| --- | --- | --- | --- | --- |
| `serve_first`: first contact is not a serve | 1 / 35 | 0 / 58 | 0 / 44 | Server and winner of that rally |
| `side_out_scoring`: receiving team scored | 2 / 16 | 0 / 18 | 7 / 17 | Serve points, side-outs, rallies won |
| `point_server`: `server_player_id` is not the server | 0 / 16 | 2 / 18 | 0 / 17 | Who served the point |
| `volley_after_bounce`: volley follows a bounce | 42 / 56 | 236 / 236 | 54 / 61 | Bounce map, kitchen landings |
| `alternating_teams`: same team hits twice in a row | 20 / 335 | 0 / 710 | 19 / 382 | Shot and dink counts (lower bound) |
| `error_by_rally_winner`: error by the team that won | 3 / 33 | 21 / 45 | 0 / 36 | Errors, rally endings |
| `own_half`: move centred on the opponents' half | 0 / 168 | 163 / 317 | 0 / 233 | Kitchen arrival, movement |
| `reaction_formula`: reaction ≠ contact − stimulus | 0 / 335 | 526 / 710 | 0 / 382 | Reaction time |
| `reaction_spread`: reactions look filled in | ok | 0.021 s spread | ok | Reaction time |

Game 2 fails five checks. Treat its placement, error, movement, and reaction figures as unreliable until it is re-logged.

## Data to acquire

In priority order. Each item names the analytics it unlocks or repairs.

1. **Every paddle contact at native frame rate** (60 fps or more, no sampling in dink exchanges). Repairs shot counts, dink counts, rally length, and the `alternating_teams` check.
2. **Serve record per rally**: server id, first or second server, score call, and serving side. Repairs serve points won, side-outs, and rallies won (`side_out_scoring`, `point_server`), and adds server-number analytics.
3. **Rally end record per rally**, ideally from the referee or official stats: who ended it, winner or error, forced or unforced, plus lets, faults, and timeouts. Repairs `ended_by`, `points_won`, and the error figures.
4. **Bounce only when the ball bounces**, with a line-call confidence. Repairs the bounce map and kitchen landings (`volley_after_bounce`).
5. **Contact point per shot**: player x/y at contact and contact height relative to the net. Unlocks attackable-ball analysis, drop and reset quality, speed-up selection, and dink direction.
6. **Continuous player tracking**: x/y for all four players at 10 Hz or more. Unlocks true distance covered, time to the kitchen line, position heatmaps, partner spacing, stacking, and repairs `own_half`.
7. **Measured timing**: stimulus and contact timestamps taken from frames, not filled in. Repairs reaction time (`reaction_formula`, `reaction_spread`).
8. **3D ball tracking**: trajectory, net clearance, apex, and spin. Unlocks shot quality and serve type.
9. **Player metadata**: handedness and preferred side (names stay out of the report). Gives forehand and backhand figures their meaning.
10. **Court calibration** (homography, or a second camera) so positions and speeds become measurements, not visual estimates.
11. **Wearables** (optional): heart rate and acceleration for workload.
