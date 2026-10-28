# Game 1 Raw Event Report — Men's Doubles Gold, 2026 US Open Pickleball

## Output
- JSON: `/workspace/pickleball/out/2026_us_open_mens_double_final_game_1.json`
- Summary: `/workspace/pickleball/out/2026_us_open_mens_double_final_game_1.md`

## Window
- Absolute video time: **0.000 – 896.5** (Game 1 hard stop when Team 1 reaches 11)
- Scoreboard: **11–5** confirmed by ~910; Game 2 **0–0** by ~960 (not included)
- Intro dead time before first serve: 0–~153s; first live play ~153s
- Reused: `/workspace/pickleball/compressed/report_0-10min.json` (0–600)
- Extended with stills from `chunk_600_1200.mp4` + `/workspace/pickleball/score_crops/` + `score_dense_crops/`

## Final score (Game 1)
- **Team 1 (far, players 1–2): 11**
- **Team 2 (near, players 3–4): 5**
- Last scored rally ends **896.5s**

## Counts
- **Rallies:** 35
- **Scored points:** 16
- **match.ball_ground_hits:** 332

### Per-player event counts
- Player 1: gestures=92, errors=4, attacks=5, ball_speeds=92, movements=42, bgh=88
- Player 2: gestures=91, errors=7, attacks=17, ball_speeds=91, movements=40, bgh=78
- Player 3: gestures=95, errors=12, attacks=6, ball_speeds=95, movements=42, bgh=83
- Player 4: gestures=92, errors=11, attacks=10, ball_speeds=92, movements=44, bgh=83

## Player lock (person, not court spot)
| ID | Team | End | Description |
|----|------|-----|-------------|
| 1 | 1 | far | Far-left, white/light top + dark shorts |
| 2 | 1 | far | Far-right, black kit |
| 3 | 2 | near | Near-left, white + hat |
| 4 | 2 | near | Near-right, white + hat |

No player names in the JSON.

## Score path (scored points)
- p1 @167.5s → 1-0 (winner player 2, server 4, team 1)
- p2 @191.0s → 2-0 (winner player 2, server 4, team 1)
- p3 @224.0s → 2-1 (winner player 4, server 4, team 2)
- p4 @251.5s → 2-2 (winner player 3, server 4, team 2)
- p5 @368.5s → 3-2 (winner player 2, server 1, team 1)
- p6 @485.0s → 4-2 (winner player 2, server 1, team 1)
- p7 @534.0s → 5-2 (winner player 2, server 2, team 1)
- p8 @626.0s → 5-3 (winner player 3, server 3, team 2)
- p9 @668.5s → 6-3 (winner player 2, server 1, team 1)
- p10 @683.0s → 7-3 (winner player 1, server 1, team 1)
- p11 @698.5s → 8-3 (winner player 2, server 1, team 1)
- p12 @784.0s → 9-3 (winner player 2, server 2, team 1)
- p13 @796.5s → 10-3 (winner player 1, server 2, team 1)
- p14 @829.5s → 10-4 (winner player 4, server 4, team 2)
- p15 @868.0s → 10-5 (winner player 3, server 3, team 2)
- p16 @896.5s → 11-5 (winner player 2, server 1, team 1)

## Method / uncertainties
- Native **10 fps** stills via ffmpeg/OpenCV; no continuous video playback tool in this environment.
- Dense dink exchanges **sampled ~0.55–0.9s**; `shot_count` is a lower bound vs every paddle touch.
- Speeds (m/s) and (x_m, y_m) are **visual estimates** on the skeleton court frame.
- Rally **19** was truncated at 600.0 in the partial; extended to **603.2** (non-scoring side-out).
- Timeout / bench break ~**710–748** — no rallies logged there.
- Mid-game server/winner **player** IDs are best-effort from serve box + error attribution; **team** winners follow the scoreboard.
- Some score-crop frames were graphics/crowd-only (unreadable); timeline anchored on readable bugs (600:5-2, 620:5-3, 680:6-3, 700:8-3, 770:9-3, 790:10-3, 830:10-4, 870:10-5, 910:11-5).

## Validation
- JSON parses (`schema_version` 2.0, `sample` false)
- No event times outside 0–955
- Player `shot_id`s consistent with `hitting_gestures`
- `match.ball_ground_hits` mirrors players' `ball_ground_hits` (with `hitter_player_id` only on match list)
