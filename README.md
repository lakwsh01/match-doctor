# Pickleball coaching

Raw event logs from a recorded doubles match. An agent watches the video and writes one JSON report. Each list is an observed event: an error, an attack, a move, a hit, a bounce, a point, or a rally.

Players are numbered `1`–`4`. Reports do not use player names.

`report_sample.json` is the shape to copy. The numbers in that file are fake. Real reports set `"sample": false` and replace every array with events from the video.

## Source

Match: Men's Doubles Gold, 2026 US Open Pickleball.

| File | Role |
| --- | --- |
| `Men's Doubles GOLD at 2026 US OPEN PICKLEBALL_ Munro_Livornese vs. Deheart_Koszuta.mp4` | Full recording at the project root |
| `compressed/Men's Doubles Gold At 2026 Us Open Pickleball  Munro Livornese Vs. Deheart Koszuta.mp4` | Compressed copy used for review |
| `compressed/clip_0-10min.mp4` | First 10 minutes |
| `compressed/chunks/` | Later slices of the compressed video (`chunk_600_1200.mp4` through `chunk_3600_4118.mp4`) |

`time_sec` is seconds from the start of the video file.

[Good-Pickleball](https://github.com/yo-WASSUP/Good-Pickleball) was the reference for what a recorded game can yield (court size, ball bounces, player positions). This report is the event log above, filled by watching the video. It does not follow that project's `detections.jsonl` layout.

## Players

Lock the four people on the first frame where all of them are visible. Keep the same id for the whole report when they swap sides.

| ID | Team | Where they start |
| --- | --- | --- |
| `1` | `1` | Far end, viewer's left |
| `2` | `1` | Far end, viewer's right |
| `3` | `2` | Near end, viewer's left |
| `4` | `2` | Near end, viewer's right |

Track the person, not the court spot. Team `1` starts on the far end. Team `2` starts on the near end.

## What a report contains

Schema version `2.0`. Court positions are visual estimates in meters.

- `x_m`: `0` at the left sideline in the picture, `6.096` at the right sideline.
- `y_m`: `0` at the far baseline, `13.4112` at the near baseline. The net is `y = 6.7056`. The kitchen is `2.1336` m on each side of the net.
- Speeds are meters per second.
- `reaction_sec` is `contact_sec` minus `stimulus_sec`. The stimulus is `opponent_contact` or `ball_bounce`.
- `shot_id` (`r{rally}s{contact}`) ties one contact across gesture, ball speed, reaction, attack, error, and the bounce that shot produced. It is `null` only when the player missed the ball and never touched it.
- `rally_number` is the 1-based order of rallies inside that report. `shot_count` is how many contacts that rally has. A let that does not score has `"scoring": false` and `"point_number": null`.

**Each player**

1. `errors`, split by type: `into_net`, `out_wide`, `out_long`, `serve_fault`, `foot_fault`, `kitchen_violation`, `missed_return`. `cause` is `unforced` or `forced`.
2. `attacks.successful` and `attacks.unsuccessful`. Types: `drive`, `speedup`, `overhead`, `erne`, `around_the_post`, `lob`, `putaway`. A successful attack won the point or the opponent missed the next ball. An unsuccessful attack stayed in the rally, or the attack itself missed.
3. `movement_speeds` for each purposeful move in a rally, with `from` and `to`.
4. `ball_speeds` for each ball that player hits.
5. `reaction_times` for each contact.
6. `hitting_gestures`: `serve`, `return`, `forehand_dink`, `backhand_dink`, `forehand_drive`, `backhand_drive`, `forehand_drop`, `backhand_drop`, `forehand_volley`, `backhand_volley`, `forehand_roll`, `backhand_roll`, `overhead`, `lob`, `speedup`, `reset`, `erne`, `around_the_post`.
7. `ball_ground_hits` for where that player's shot bounced.

**Match**

1. `points`: start and end of each scored point, plus server, winner, and winning team.
2. `rallies`: rally number, shot count, start, end, and duration.
3. `ball_ground_hits`: every bounce in the window, with `hitter_player_id`. The same bounce is also listed under that player.

Leave an array empty when that player has no events of that kind. Keep every error-type key. Do not add averages, rates, totals, or coaching notes.

## Reports in this folder

| File | Window |
| --- | --- |
| `report_sample.json` | Shape sample only |
| `report_0-10min.json` and `compressed/report_0-10min.json` | First 10 minutes (`0`–`600` seconds). Rally and point numbers restart at 1 inside that window |
| `2026_us_open_mens_double_final_game_1.json` | Game 1, from the start of the file through `896.5` seconds, when team 1 reaches 11 |
| `2026_us_open_mens_double_final_game_1.md` | Short notes for that Game 1 JSON |

The 10-minute file was the test pass. Game 1 reuses that window and continues from the later chunks.
