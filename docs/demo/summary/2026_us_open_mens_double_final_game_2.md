# Game 2 — Men's Doubles Gold, 2026 US Open Pickleball

**File:** `2026_us_open_mens_double_final_game_2.json`  
**Schema:** 2.0 · `sample: false`

**Teams:** Team 1 (far) player_id 1–2 · Team 2 (near) player_id 3–4. No names in JSON.

**Window:** absolute ~960.000 (scoreboard 0–0, match games 1–0 LM) through game end ~2565–2570 (final **7–11**, Team 2 wins). Game 3 0–0 by ~2630–2650 is excluded.

## Counts

| Metric | Value |
|--------|------:|
| Scored points | 18 |
| Rallies (all) | 58 |
| Scoring rallies | 18 |
| Non-scoring / side-outs | 40 |
| Sampled contacts (sum shot_count) | 768 |
| Match ball_ground_hits | 768 |

## Score path (TV overlay, LM top / DK bottom)

| t_sec | LM | DK |
|------:|---:|---:|
| 960 | 0 | 0 |
| 1080 | 0 | 0 |
| 1140 | 2 | 0 |
| 1200 | 3 | 0 |
| 1260 | 3 | 1 |
| 1320 | 3 | 3 |
| 1440 | 4 | 3 |
| 1560 | 4 | 5 |
| 1860 | 5 | 5 |
| 2040 | 5 | 7 |
| 2220 | 5 | 8 |
| 2340 | 5 | 10 |
| 2430 | 6 | 10 |
| 2490 | 7 | 10 |
| 2550 | 7 | 10 |
| 2570 | 7 | 11 |

## Points

| # | start | end | server | winner_player | winner_team | after (LM-DK) |
|--:|------:|----:|-------:|--------------:|------------:|--------------:|
| 1 | 1105.5 | 1117.5 | 2 | 1 | 1 | 1-0 |
| 2 | 1132.5 | 1139.5 | 2 | 2 | 1 | 2-0 |
| 3 | 1199.5 | 1206.0 | 1 | 2 | 1 | 3-0 |
| 4 | 1252.5 | 1259.5 | 4 | 3 | 2 | 3-1 |
| 5 | 1282.0 | 1289.5 | 4 | 4 | 2 | 3-2 |
| 6 | 1308.0 | 1322.0 | 4 | 3 | 2 | 3-3 |
| 7 | 1426.0 | 1432.0 | 1 | 2 | 1 | 4-3 |
| 8 | 1511.0 | 1515.5 | 3 | 3 | 2 | 4-4 |
| 9 | 1533.0 | 1539.0 | 3 | 4 | 2 | 4-5 |
| 10 | 1848.5 | 1855.5 | 2 | 2 | 1 | 5-5 |
| 11 | 2010.0 | 2015.5 | 4 | 4 | 2 | 5-6 |
| 12 | 2028.5 | 2032.0 | 4 | 4 | 2 | 5-7 |
| 13 | 2213.0 | 2216.5 | 4 | 3 | 2 | 5-8 |
| 14 | 2294.0 | 2297.5 | 3 | 3 | 2 | 5-9 |
| 15 | 2305.0 | 2313.0 | 3 | 4 | 2 | 5-10 |
| 16 | 2377.0 | 2380.0 | 1 | 2 | 1 | 6-10 |
| 17 | 2476.0 | 2496.5 | 1 | 2 | 1 | 7-10 |
| 18 | 2564.0 | 2579.5 | 3 | 3 | 2 | 7-11 |

## Method / uncertainties

- Score progression from broadcast scorebug crops (`/workspace/pickleball/score_crops`, dense bugs).
- Rally windows from court-region frame-difference motion on 10 fps chunk videos (0.5 s step); gaps ≤2.5 s merged.
- Scoring rallies aligned into score-change windows; remaining long motion stretches kept as non-scoring side-outs.
- Contact-level gestures, ball/movement speeds (m/s), reactions, and bounce coords are **visual estimates**; long dink exchanges are **sampled** (~0.55–0.85 s), not every paddle touch.
- Player lock: far-left/right = 1/2 (team 1), near-left/right = 3/4 (team 2); IDs follow the person when visible.
- `server_player_id` / which partner finished a point can be approximate when the camera cuts to close-ups.
- Court `x_m`/`y_m` and speeds are estimated from the picture (court conventions in JSON).
