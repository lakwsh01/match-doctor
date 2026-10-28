# Game 3 v2 Raw Event Report — Men's Doubles Gold, 2026 US Open Pickleball
## Output
- JSON: `/workspace/pickleball/out/v2/2026_us_open_mens_double_final_game_3_v2.json`
- Schema notes: `/workspace/pickleball/out/v2/v2_schema_notes.md`
- User path: `D:\\projects\\pickleball_coaching\\docs\\demo\\raw\\v2\\`

## Source
- 1920x1080 **29.97 fps** (user path labeled 60fps; probed file is 29.97)
- Analysis proxy: 960x540 same timestamps
- Contact sampling: **none** (no dink downsampling); occluded contacts omitted
- Absolute window ~2650–3918s; ceremony after game end excluded

## Final score
- **Team 1 11 – Team 2 6**

## Counts
- Rallies: 44
- Points: 17
- Serves: 44
- Rally outcomes: 44
- Hitting gestures (contacts): **909**
- Ball ground hits: 331
- Position track samples: 12169 (@10 Hz)
- Sparse rallies (density<0.35/s): 0
- analysis.incomplete: False

### Per-player gestures
- P1: gestures=255, tracks=3309, bgh=50
- P2: gestures=226, tracks=2993, bgh=45
- P3: gestures=224, tracks=3014, bgh=116
- P4: gestures=204, tracks=2853, bgh=120

## Player lock (confirmed in Game 3 footage; ends did not swap mid-game)
| ID | Team | End | Kit |
|----|------|-----|-----|
| 1 | 1 | far | light/white + dark shorts |
| 2 | 1 | far | black kit |
| 3 | 2 | near | white + hat |
| 4 | 2 | near | white + hat |

No player names in JSON.

## Serves / outcomes
- Opening score_call `0-0-2` Team2 (P4) — matches scoreboard ~2721
- 44 serve records (server_player_id, server_number, score_call, serving_side)
- 44 rally_outcomes (point_winner or error+forced/unforced; side_out on non-scoring)

## Gaps
- Ball detector can miss contacts behind net mesh / in glare / close-up camera cuts; those are **omitted**, not filled.
- R11 (2.0s) only 2 detector contacts — short rally / camera cut; not invented.
- height_above_net_m / speed_mps visual estimates; contact_sec/stimulus_sec from frame timestamps only.
- P3/P4 white+hat can swap under occlusion; team-by-net-side hitter assign used.
- Point numbers 15/16 in v1 are out of chronological order (R41=P16 then R42=P15); preserved from v1 skeleton; score still ends 11–6.
- Serving_side and some mid-game server_number values are inferred; scoring-point servers taken from v1 points.
