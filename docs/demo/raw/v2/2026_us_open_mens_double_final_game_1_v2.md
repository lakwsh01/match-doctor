# Game 1 v2 Raw Event Report — Men's Doubles Gold, 2026 US Open Pickleball

## Output
- Box JSON: `/workspace/pickleball/out/v2/2026_us_open_mens_double_final_game_1_v2.json`
- Box MD: `/workspace/pickleball/out/v2/2026_us_open_mens_double_final_game_1_v2.md`
- Schema notes: `/workspace/pickleball/out/v2/v2_schema_notes.md`
- User: `D:\projects\pickleball_coaching\docs\demo\raw\v2\` (same filenames)

## Source
- Path: `D:\projects\pickleball_coaching\Men's Doubles GOLD at 2026 US OPEN PICKLEBALL_ Munro_Livornese vs. Deheart_Koszuta.mp4`
- Probed: **1920×1080, 29.97 fps**, ~4117s (user-labeled "60fps version"; file is 29.97)
- Analysis proxy clips: 960×540 @ 29.97 fps (timestamps = source)
- Game 1 window: play ~153s → hard stop **896.5s** when Team 1 hits 11; Game 2 0-0 by ~960 excluded

## Final score
- **Team 1 (far, players 1–2): 11**
- **Team 2 (near, players 3–4): 5**

## Counts (v2 vs v1)
| Metric | v2 | v1 (sampled) |
|--------|----|--------------|
| Rallies | 35 | 35 |
| Points | 16 | 16 |
| Serves | 35 | — |
| Rally outcomes | 35 | — |
| Paddle contacts (gestures) | **1091** | 370 |
| Ball ground hits | 417 | 332 |
| Position track samples | 10027 @ **10 Hz** | — |
| Contact sampling | **none** | ~0.55–0.9s dink sample |

## STRICT rules status
1. Every detector-visible paddle contact at native 29.97 fps; **no dink downsampling**. Occluded/unseen contacts **omitted** (never invented).
2. `match.serves[]` one per rally: server_player_id, server_number, score_call, serving_side (deuce|ad from server's view).
3. `match.rally_outcomes[]` one per rally: point_winner | error (+ side_out); error_type + forced|unforced when error.
4. Bounces only when bounce detector fires; `line_call_confidence` 0–1 on all bgh.
5. Each hitting_gesture has `x_m`, `y_m`, `height_above_net_m`.
6. `players[id].position_track` ≥10 Hz during each rally (median Δt ≈ 0.1s).
7. `contact_sec` / `stimulus_sec` from frame timestamps; `reaction_sec = contact − stimulus`.

## Player lock (ids only in JSON)
| ID | Team | End | Description |
|----|------|-----|-------------|
| 1 | 1 | far | Far-left, light/white top + dark shorts |
| 2 | 1 | far | Far-right, black kit |
| 3 | 2 | near | Near-left, white + hat |
| 4 | 2 | near | Near-right, white + hat |

### Per-player (v2)
- P1: gestures=255, tracks=3398, bgh≈ share of 417
- P2: gestures=580, tracks=3287
- P3: gestures=161, tracks=2407
- P4: gestures=95, tracks=935

## Gaps / caveats
- **Hitter ID bias:** far-right black kit (P2) over-assigned vs near-right white (P4) when blob nearest-to-ball fails; times remain frame-measured.
- **P4 tracks sparse** on several rallies (white-on-white / occlusion); P1–P2 denser.
- Speeds and `height_above_net_m` are visual estimates; bounce/contact detectors miss some net-mesh / glare frames (omitted).
- Timeout / dead air ~710–748s: no rallies (same as v1).
- `analysis.incomplete`: **false** (0 sparse rallies under density gate); still not human-perfect every-contact truth.

## Validation
- JSON parses; schema_version 2.0; sample false
- 35 serves + 35 outcomes; shot_ids unique; gesture xyz+height present
- Event times inside Game 1 window; track median 10 Hz
