# Game 2 v2 Raw Event Report — Men's Doubles Gold, 2026 US Open Pickleball
## Output
- JSON: `/workspace/pickleball/out/v2/2026_us_open_mens_double_final_game_2_v2.json`
- Schema notes: `/workspace/pickleball/out/v2/v2_schema_notes.md`
- User path: `D:\\projects\\pickleball_coaching\\docs\\demo\\raw\\v2\\`

## Source
- 1920x1080 **29.97 fps** (user path labeled 60fps; probed file is 29.97)
- Analysis proxy: 960x540 same timestamps
- Contact sampling: **none** (no dink downsampling); occluded contacts omitted

## Final score
- **Team 1 7 – Team 2 11** (Game 2 window ~960–2580s; Game 3 excluded)

## Counts
- Rallies: 58
- Points: 18
- Serves: 58
- Rally outcomes: 58
- Hitting gestures (contacts): **1345**
- Ball ground hits: 531
- Position track samples: 17168 (@10 Hz)
- Sparse rallies (density<0.35/s): 0
- analysis.incomplete: False

### Per-player gestures
- P1: gestures=355, tracks=4530, bgh=63
- P2: gestures=281, tracks=4060, bgh=67
- P3: gestures=355, tracks=4307, bgh=198
- P4: gestures=354, tracks=4271, bgh=198

## Player lock
| ID | Team | End | Kit |
|----|------|-----|-----|
| 1 | 1 | far | light/white + dark shorts |
| 2 | 1 | far | black kit |
| 3 | 2 | near | white + hat |
| 4 | 2 | near | white + hat |

No player names in JSON.

## Method gaps
- Ball detector can miss contacts behind net mesh / in glare; those are **omitted**, not filled.
- height_above_net_m and speed_mps are visual estimates; times are frame-measured.
- Player tracks use color blobs; near-side white kits can swap under occlusion.

## Serves / outcomes
- 58 serve records (server_player_id, server_number, score_call, serving_side)
- 58 rally_outcomes (point_winner or error+forced/unforced; side_out on non-scoring)
- Opening score_call `0-0-1` (team1); first scored point serve `0-0-2` P2 — matches v1 point servers after 5 side-outs

## Gaps
- Detector false positives possible at high contact density (up to ~4/s); occluded contacts omitted, never invented.
- P3/P4 white+hat can swap under occlusion; team-by-net-side hitter assign used to reduce P2 black-kit over-assign vs Game1.
- height_above_net_m / speed_mps visual estimates; contact_sec/stimulus_sec from frame timestamps only.
- Game 3 not started.
