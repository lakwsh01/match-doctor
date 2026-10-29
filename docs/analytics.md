# Analytics coverage

This file lists the analytics a professional doubles player or coach reviews after a match, whether the v2 raw logs in `docs/demo/raw/v2/` support them, and what data is still missing.

The generated reports live in `docs/demo/reports/`: one per game and one per match (`*_match.json`). To rebuild them, run `npm run reports` from `web/`. The frontend reads only these reports. Each figure carries its sample size: a `Rate` has `made`, `of`, and `pct`, and a `Dist` has `n`, `avg`, `min`, and `max`.

Status:

- **Yes**: in the report, and the raw data passes its checks.
- **Caution**: in the report, but a data-quality check fails for at least one game (see below).
- **No**: not possible with the current raw data, or not built yet.

## Coverage

### Score and momentum

| Analytic | Status | Report field |
| --- | --- | --- |
| Game result and score | Yes | `result.score`, `result.winner_team_id` |
| Match result, games won, total points | Yes | match `result` |
| Point-by-point score | Yes | `score_progression[]` |
| Scoring runs | Yes | `teams[].scoring_runs` |
| Rallies won | Yes | `teams[].rallies_won` |
| How each rally ended (winner, error, side-out) | Yes | `rallies[].ended_by` |
| How each scored point was won | Caution | `teams[].point_sources` (ace, attack, winner, opponent error; v2 logs very few attacks) |
| Score call, server number, serving side per rally | Caution | `rallies[].serve` |
| Points won on serve | Caution | `teams[].serve_points_won` |
| Scoring by first and second server | Caution | `teams[].serve_points_by_server[]` |
| Scoring from the deuce and ad sides | Caution | `teams[].serve_points_by_side[]` |
| Side-outs on receive | Caution | `teams[].side_outs` |
| Win rate by rally length | Caution | `teams[].rally_length[]` |
| Rally duration | Yes | `rallies[].duration_sec` |

### Serve and return

| Analytic | Status | Report field |
| --- | --- | --- |
| Serves in, faults | Caution | `players[].serve.in`, `.faults` |
| Serve and return depth | Caution | `players[].serve.depth_m`, `.deep`; `players[].return.*` |
| Serve and return speed | Caution | `players[].serve.speed_mps`, `players[].return.speed_mps` |
| Returner reaches the kitchen line | Yes | `players[].positioning.kitchen_arrival` |
| Seconds from the serve to the kitchen line | Yes | `players[].positioning.kitchen_arrival_sec` |
| Serve type (power, spin, lob) | No | |

### Third shot, kitchen, and attack

| Analytic | Status | Report field |
| --- | --- | --- |
| Third-shot choice (drop or drive) | Caution | `players[].third_shot` |
| Third-shot drops and dinks landing in the kitchen | Caution | `players[].third_shot.drop_in_kitchen`, `players[].dinks.in_kitchen` |
| Contacts above the net | Caution | `players[].contact.above_net`, `.height_m` |
| Attacks won by type, first attack | Caution | `players[].attacks`, `teams[].first_attack` (v2 logs very few attacks) |
| Drop quality (was the next ball attackable) | No | Possible from contact height once it passes its check |
| Hand battles won | No | |

### Errors

| Analytic | Status | Report field |
| --- | --- | --- |
| Errors, unforced and forced, by type, shot, and phase | Caution | `players[].errors`, `teams[].errors` |
| Points finished by each player | Yes | `players[].points_won` |

### Shot quality and placement

| Analytic | Status | Report field |
| --- | --- | --- |
| Shot mix, forehand and backhand split | Caution | `players[].shots` |
| Ball speed | Caution | `players[].ball_speed_mps` |
| Contact map | Yes | `rallies[].shots[].at` |
| Bounce map, zones, lanes | Caution | `rallies[].shots[].bounce`; `players[].placement` |
| Line-call confidence | Yes | `rallies[].shots[].bounce.line_call_confidence` |
| Who opponents hit to | Caution | `players[].targeted` |
| Net clearance, spin | No | |

### Movement and positioning

| Analytic | Status | Report field |
| --- | --- | --- |
| Movement paths per rally | Yes | `rallies[].tracks[]` as `[time_sec, x_m, y_m]` |
| Position heatmap | Yes | `players[].positioning.heat` on the `court.heat` grid |
| Time at the kitchen line | Yes | `players[].positioning.kitchen_time` |
| Both partners at the kitchen line | Yes | `teams[].positioning.both_at_kitchen` |
| Partner spacing | Yes | `teams[].positioning.partner_spacing_m` |
| Distance from the net | Yes | `players[].positioning.net_distance_m` |
| Movement speed, distance covered | Caution | `players[].movement.speed_mps`, `players[].positioning.distance_m` |
| Reaction time | Caution | `players[].reaction_sec` |
| Split-step timing, heart rate | No | |

## Data-quality checks

Every game report has a `data_quality[]` list. Each check carries its `id`, `status`, a count out of a sample size (`count`, `of`), and `params`, the numbers its explanation quotes. The title and the explanation of what the failure affects are not in the report: they come from the message files in `web/src/lib/i18n/messages/` under `check.<id>.title` and `check.<id>.detail`, one per language. The match report sums each check across games and lists the report ids of the games that failed it in `games`. Results on the v2 logs:

| Check | Game 1 | Game 2 | Game 3 |
| --- | --- | --- | --- |
| `serve_record`: serve record differs from shot 1 | ok | ok | ok |
| `side_out_scoring`: receiving team scored | 2 / 16 | ok | 7 / 17 |
| `point_server`: point server differs from serve record | ok | ok | ok |
| `score_call`: score call off the running score | 4 / 35 | 4 / 58 | ok |
| `outcome_vs_point`: outcome winner differs from point | ok | ok | ok |
| `alternating_teams`: same team hits twice in a row | 862 / 1056 | 961 / 1287 | 638 / 865 |
| `volley_after_bounce`: volley after a bounce | 9 / 63 | 33 / 184 | 19 / 125 |
| `error_by_rally_winner`: error by the rally winner | 10 / 23 | 21 / 53 | 14 / 37 |
| `contact_height_range`: contact height below the ground | 601 / 1091 | 724 / 1345 | 450 / 909 |
| `ball_speed_ceiling`: ball speed stuck at 28 m/s | 132 / 1091 | 626 / 1345 | 397 / 909 |
| `movement_speed_ceiling`: movement speed stuck at 7 m/s | 1980 / 4378 | 7012 / 14866 | 4949 / 10614 |
| `reaction_floor`: reaction under 0.1 s | 47 / 1056 | 71 / 1287 | 51 / 865 |
| `reaction_formula`: reaction arithmetic | ok | ok | ok |
| `reaction_spread`: reactions too uniform | ok | ok | ok |
| `own_half`: player on the opponents' half | ok | ok | ok |
| `bounce_side`: shot landed on the hitter's own half | 150 / 322 | 286 / 341 | 193 / 233 |
| `contact_side`: contact on the opponents' half | 1 / 1091 | 6 / 1345 | 2 / 909 |

v2 fixed the serve record, rally outcomes, timing arithmetic, and position tracks. The contact detector is now the weak point. Most contacts are repeats by the same team, about half the contact heights are impossible, and most bounces are credited to the wrong side of the net. Shot mix, placement, and per-player error figures inherit those problems.

## Data to acquire

In priority order. Each item names the checks it fixes and the analytics it unlocks.

1. **One contact per paddle touch, credited to the right player.** Merge repeat detections and fix the hitter bias the v2 notes describe (P2 over-assigned). Fixes `alternating_teams` and `reaction_floor`, which repairs shot counts, shot mix, rally length, and targeting.
2. **Bounces credited to the shot that produced them.** Fixes `bounce_side` and `volley_after_bounce`, which repairs serve and return depth, kitchen landings, and the bounce map.
3. **Calibrated contact height.** Fixes `contact_height_range` and unlocks drop and reset quality and attackable-ball analysis.
4. **Speeds without a cap**, from court calibration (homography) and a smoothed track. Fixes `ball_speed_ceiling` and `movement_speed_ceiling`, which repairs ball speed, movement speed, and distance covered.
5. **Attack labels on every contact.** v2 logs almost none, so attack and first-attack figures are close to empty.
6. **Serve records checked against the scoreboard** for Games 1 and 3. Game 3 copied its scoring servers from v1. Fixes `side_out_scoring` and `score_call`.
7. **Player errors that match the rally outcomes.** Fixes `error_by_rally_winner`.
8. **60 fps source footage.** The v2 file probes at 29.97 fps, so contacts closer than 33 ms apart merge.
9. **3D ball tracking** for net clearance and spin, and a serve-type label.
10. **Player metadata**: handedness and preferred side (names stay out of the report).
11. **Wearables** (optional): heart rate and acceleration.
