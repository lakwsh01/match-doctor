# Game 1 v2 schema notes (schema_version 2.0 + extensions)

## Source
- Video: Men's Doubles GOLD at 2026 US OPEN PICKLEBALL_ Munro_Livornese vs. Deheart_Koszuta.mp4
- Native: 1920x1080, **29.97 fps** (NOT 60 fps; user-labeled "60fps version" is this file)
- Game 1 window: ~153–896.5 s absolute video time; final 11–5 Team 1

## Player ids (never names in JSON)
- 1 far-left light/white top dark shorts (team1)
- 2 far-right black kit (team1)
- 3 near-left white+hat (team2)
- 4 near-right white+hat (team2)

## Strict rules applied
1. Every paddle contact logged from native ~30 fps frames; **no dink downsampling**. Unseen contacts omitted (never invented).
2. `match.serves[]` — one per rally: server_player_id, server_number (1|2), score_call, serving_side
3. `match.rally_outcomes[]` — one per rally: outcome, who, error_type/cause when error; lets/faults/timeouts as events
4. `ball_ground_hits` only on real bounces (not volleys); `line_call_confidence` 0–1
5. Each `hitting_gestures[]` entry includes `x_m`, `y_m`, `height_above_net_m`
6. `players[id].position_track[]` at ≥10 Hz during each rally (`time_sec`, `x_m`, `y_m`)
7. `contact_sec` / `stimulus_sec` from frame timestamps; `reaction_sec = contact_sec - stimulus_sec`

## Serving_side convention
- `serving_side`: **"deuce"** | **"ad"** from the **server's own perspective** facing the net
  - deuce = server's right (right-handed deuce court)
  - ad = server's left
- Doubles: server_number 1 = first server of the side-out, 2 = partner; opening rally of game uses server_number 2 by rule (score_call ends in -2).

## Score_call convention
- String `"receiving-serving-server#"` as called, e.g. `"0-0-2"`, `"5-3-1"`. Team scores are opponent then server when server's team is serving (standard pickleball call order: server score first in some broadcasts — we use **server_score - receiver_score - server_number** matching the on-screen call when readable).

## Top-level analysis block
```json
"analysis": {
  "source_fps": 29.97,
  "contact_sampling": "none",
  "source_path": "...",
  "video_resolution": "1920x1080",
  "track_hz": 10,
  "incomplete": false
}
```

## Extensions vs sample
- match.serves, match.rally_outcomes
- players[id].position_track
- hitting_gestures: +x_m, +y_m, +height_above_net_m
- ball_ground_hits: +line_call_confidence
- analysis object

Heights and some speeds remain visual estimates from frames; times are frame-measured.
