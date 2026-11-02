# Report v2 (trial)

A second report page, served at `/v2/<report id>/<tab>[/<subject>]` behind the same sign-in as the main report. It is built from the 99 fields of the field dictionary (https://matchdoctor.fields.lksp.dev/) and lives apart from the main report so it can be accepted or dropped in one step.

## What is where

| Path | What |
| --- | --- |
| `web/src/v2/` | All v2 code: `app/` (shell, route, video dock), `features/` (one folder per tab), `components/`, `lib/` (report builder, i18n, format), `styles/tokens.css` (v2-prefixed tokens only) |
| `web/scripts/build-reports-v2.ts` | Reads the final reports in `docs/demo/reports/*.json`, writes `docs/demo/reports/v2/*.json` |
| `docs/demo/reports/v2/*.json` | Generated v2 reports. Run `npm run reports:v2` from `web/`; never edit by hand |
| `web/src/app/App.tsx` | The only v1 file that knows about v2: it renders `ReportsV2` when the path starts with `/v2` |

## Chapters

The dictionary's groups are rearranged into the order a player or coach reads a match: what happened, why, how it moved, who did what, what to train.

| Tab | Question it answers | Fields |
| --- | --- | --- |
| Masthead | Who won, where, how long | MI-01..07 |
| Diagnosis | Why it went that way and what to watch | MI-08..13, plus six vital signs and the trust and coverage summary |
| Rally by phase | Where in the rally points were won or lost | ST-01..21 grouped by serve, return, third shot, transition, kitchen, point end; rally shape ST-26..32 |
| Momentum | When the match turned | MO-01..09: lead by rally, runs, side-out droughts, game points, the rally index |
| Players | What each player and each pair did | ST-22..25, 28, 31, 34..36; IA-01..14 (under attack, error review); TD-01..10 (pair) |
| Prescription | What to train before the next match | TR-01..06 |

Singles-only fields (SG-01..10, ST-37) do not apply to a doubles match and are listed as such in the coverage table.

## Where each value comes from

Every figure carries a `source`, and the page marks demo values with a dashed chip.

| Source | Fields | Meaning |
| --- | --- | --- |
| measured | 49 | Read from the v2 logs |
| derived | 21 | A rule over measured figures (verdict, takeaways, drills) |
| demo | 18 | Seeded, stable stand-in values for fields the logs cannot measure yet (hand, date and venue, serve target, first to the kitchen, resets, counters, lobs, under attack, error cause and spin, middle balls, stacking) |
| not applicable | 11 | Singles fields |

Demo values come from a string-hash seed (`lib/seed.ts`), so the same report always shows the same numbers. Measured values are kept as logged even when they look noisy; the trust section says how many data checks warned.

"Points the gap is worth" multiplies the rate gap by the attempts and by an illustrative weight per metric (`WORTH` in `lib/takeaways.ts`): a missed return costs a rally, one more dink into the kitchen rarely does.

## Design direction

- The diagnosis sentence is the hero: the masthead's `h1` is the verdict, written from the reader's team ("Read as"). It names only measured or derived gaps, never a demo one; the "deciding gap" is the largest one that favours the winner.
- One signature element: the rally-phase rail, a side-on court strip (baselines, kitchen lines, net) with six numbered stops; the yellow ball moves to the phase being read.
- Two teams on one track: every comparison is a dumbbell over a hatched band for the usual 3.5–4.0 range (illustrative).
- Brand rules from `DESIGN.md` hold: neon only as fills inside a night ring, ink text, Archivo widths for figures.
- Teams always read Team 1 first; the reader's team is marked by weight. Categories (shot mix, error types) use a night-to-white ramp (`--v2-cat-1`…`5`), never the team colours or the ball yellow.
- On a wide screen a playing rally takes a second column beside the report; on a phone it is a sheet at the bottom. Escape closes it.

References (Mobbin):
[WHOOP](https://mobbin.com/screens/0b162563-ca9c-4e87-9f2f-36a15d064d1d) zones with a typical range,
[The Outsiders](https://mobbin.com/screens/ec35bdda-5a29-4e9d-b91a-148e87c4bbd0) training focus,
[FotMob](https://mobbin.com/screens/3c20c19d-1c06-4683-9a18-39fc9020ae58) momentum,
[Apple Sports](https://mobbin.com/screens/f22c0688-fc14-4d38-af6c-3e7d52a17a8a), [DAZN](https://mobbin.com/screens/70d535ac-a76c-42d4-aa8c-302dc87ba3ab), and [theScore](https://mobbin.com/screens/87e55e08-fe57-4d67-bce5-415ed2912fe0) two-sided team stats,
[X](https://mobbin.com/screens/c6f41164-e395-47af-af4d-3f70de48fa58) game box score,
[Grain](https://mobbin.com/screens/b73fcebc-3c9c-44fe-934c-3abab23bf973) summary with chapters,
[Babbel](https://mobbin.com/screens/2b82718a-ea68-4be0-93a1-1829bf9da6e5) right and wrong split,
[Hotjar](https://mobbin.com/screens/a89395fd-af71-4f7c-b4e0-73111bb7c475) highlight filters,
[Runna](https://mobbin.com/screens/e59542bf-5ff8-47cc-9f30-c28f09893053) and [Nike Run Club](https://mobbin.com/screens/46bc8651-3696-456b-af8d-63ff218e4faf) plans,
[MLS](https://mobbin.com/screens/ec7d73d7-f171-4997-8011-a87b8ec2e0f5) play-by-play.

## Accept or drop

To drop v2, delete:

1. `web/src/v2/`
2. `web/scripts/build-reports-v2.ts` and the `reports:v2` script in `web/package.json`
3. `docs/demo/reports/v2/` and this file
4. The `ReportsV2` import and the `isV2Path` branch in `web/src/app/App.tsx`
5. The "v2 report (trial)" section in `AGENTS.md`

To accept v2 as the report, move `web/src/v2/*` into the matching top-level folders, merge `styles/tokens.css` into the main tokens, fold the v2 messages into `lib/i18n/messages/`, make `reports:v2` part of `npm run reports`, and route `/` to it. Do that in its own commit after changing `AGENTS.md`.
