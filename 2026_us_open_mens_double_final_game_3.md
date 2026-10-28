# Game 3 raw event log — Men's Doubles Gold, 2026 US Open

## Outputs
- `/workspace/pickleball/out/2026_us_open_mens_double_final_game_3.json`
- `/workspace/pickleball/out/2026_us_open_mens_double_final_game_3.md` (this file)
- Also copied to `D:\\projects\\pickleball_coaching\\2026_us_open_mens_double_final_game_3.json`

## Window
- Absolute video time ~2695–3918 s (Game 3 0-0 start through final point; ceremony after excluded).
- Final scoreboard: LM 11 – DK 6 at ~3920.

## Score ladder (from scoreboard crops)
| t_vis | LM | DK |
|------:|---:|---:|
| 2650 | 0 | 0 |
| 2820 | 1 | 0 |
| 2880 | 2 | 0 |
| 2920 | 2 | 1 |
| 2940 | 2 | 2 |
| 3030 | 3 | 2 |
| 3100 | 4 | 2 |
| 3300 | 4 | 3 |
| 3360 | 5 | 3 |
| 3510 | 5 | 4 |
| 3600 | 5 | 5 |
| 3660 | 5 | 6 |
| 3720 | 6 | 6 |
| 3750 | 7 | 6 |
| 3780 | 8 | 6 |
| 3840 | 9 | 6 |
| 3870 | 10 | 6 |
| 3920 | 11 | 6 |

## Counts
- Rallies: **44**
- Scoring points: **17**
- Match ball_ground_hits: **390**
- P1: gestures=113 errs=10 att=11
- P2: gestures=101 errs=7 att=8
- P3: gestures=101 errs=9 att=4
- P4: gestures=111 errs=10 att=8

## Player lock (person, not court spot)
- 1 / 2 = team_id 1 (LM); 3 / 4 = team_id 2 (DK)
- IDs follow persons from first-match lock even after end swaps in Game 3.

## Method
- Score progression from `/workspace/pickleball/score_g3_big/` and `score_crops` Reads.
- Rally windows from court-ROI motion activity on chunks 2400–4118.
- Shot contacts **sampled ~0.8 s** (lower bound vs native 10 fps paddle touches).
- Speeds / x_m / y_m are visual estimates.

## Uncertainties
1. Exact serve-indicator / which partner served on some points — inferred from side-out model + early Game 3 serve observation.
2. Score steps 2-1 (between 2-0 and 2-2) inferred; board not cleanly read at that instant.
3. Long NVZ exchanges sampled; shot_count is a lower bound.
4. Some activity segments may include replay packages or camera moves; merged when <4s apart.
5. Ending error types for each point are best-effort from pattern + score winner (not every bounce frame inspected).
6. Game 3 end-swap: LM often near-side in early Game 3 frames; IDs still track persons.

## Validation
- JSON written and parseable
- times_ok=True
- shot_id problems=0 []
- bounce mirror mismatches=0
- final score from points: LM=11 DK=6
