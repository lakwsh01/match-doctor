# Match Doctor — Design

Visual system for the match analytics app in `web/`. A light, chalk-white page with three loud colors used as fills, and one dark court stage so the data marks keep their contrast.

`web/src/styles/tokens.css` is the source of truth for values. This file is the reference for what each color is for. Change a value in `tokens.css`, then update this file in the same commit. `AGENTS.md` styling rules still apply: no raw hex in module CSS, every color is a token.

**Scope: light theme only for the MVP.** There is no dark mode and no theme switch. `color-scheme` is `light`.

## 1. Principles

1. **Neon is a fill, never ink.** The three theme colors are for areas: buttons, bars, dots, selected states. On the light page they are never text and never thin lines, because they fail contrast there (section 5). Text is always `--ink`.
2. **Neon is rare.** Most of a screen is chalk and white surface with dark text. A neon element is a signal, so one screen region gets one.
3. **Data first.** Color encodes team, ball, and status. Decoration never uses a team color.
4. **Color is never the only signal.** Every colored mark also carries a label, a shape, or a position (section 8).
5. **Neon on light gets an outline.** Every neon fill on the page carries a 1 px `--edge` ring, so its shape is readable at 3:1 and above (section 6).

## 2. Colors

### Theme colors

Three colors. Green is the primary.

| Name | Token | Hex | RGB | HSL | OKLCH | Role |
| --- | --- | --- | --- | --- | --- | --- |
| Neon Green / Lime | `--green` | `#39FF14` | 57 255 20 | 111 100% 54% | 87.1% 0.286 142 | **Primary.** Action fill, selected, Team 1 |
| Optic Yellow / Neon Yellow | `--yellow` | `#E1FF00` | 225 255 0 | 67 100% 50% | 94.5% 0.220 118 | Ball, text highlight |
| Vibrant Orange | `--orange` | `#FF9D23` | 255 157 35 | 33 100% 57% | 78.0% 0.167 65 | Team 2 fill |

One derived shade is added because orange text must be readable on light:

| Token | Hex | HSL | Use |
| --- | --- | --- | --- |
| `--orange-deep` | `#9C4A00` | 28 100% 31% | Error text and error borders (6.2:1 on white) |

Why these roles:

- **Green is primary** because it is the strongest fill on a light page (14.3:1 against its dark text) and has the widest hue gap from orange, which makes it the best pairing for a two-team match.
- **Yellow is the ball.** Optic yellow is the real ball color and the lightest neon, so it is kept for the smallest, most important mark on the court. On the light page it is only used as a text highlight behind dark text.
- **Orange is the second voice.** It is the only theme color far enough from green to be Team 2. Warnings and errors use its deep shade as text, so they never share a color with a team mark.

### Neutrals

White is not a theme color. It is the card surface and the chalk line on the court. The page and its grays are tinted toward green (hue ~84–108°) so they belong to the palette instead of sitting beside it as cold gray.

| Token | Hex | HSL | Use |
| --- | --- | --- | --- |
| `--white` | `#FFFFFF` | 0 0% 100% | Cards, inputs, court lines |
| `--chalk` | `#F6F8F3` | 84 26% 96% | Page background |
| `--chalk-1` | `#EEF2E8` | 84 28% 93% | Hover, bar tracks, segmented group |
| `--chalk-2` | `#D9E0D2` | 90 18% 85% | Hairlines and dividers |
| `--stone` | `#55634F` | 102 11% 35% | Secondary text, input borders |
| `--sage` | `#9AA894` | 102 10% 62% | "No team" marks; never text |
| `--night` | `#0B0F0A` | 108 20% 5% | Text, text on neon fills, court surround |

### Court stage

| Token | Hex | Use |
| --- | --- | --- |
| `--court` | `#182016` | Playing surface |
| `--kitchen` | `#222B20` | Non-volley zone |
| `--surround` | `--night` | Outside the court |

The court is the one dark surface in the app (section 9).

## 3. Primary: green

Green is a fill. It marks the thing the user can act on or the thing that is selected.

| Use | Treatment |
| --- | --- |
| Primary button | Fill `--primary`, text `--on-primary` (`--night`, 14.3:1). One per view. |
| Selected segment | Fill `--primary`, text `--on-primary` |
| Selected table row | `--select` fill (green at 16%, 17.9:1 with ink text) |
| Team 1 data marks | `--team-1` fill with an `--edge` ring (section 8) |

Not green: text, links, borders, focus rings, icons, hairlines. Green on white is 1.4:1.

- **Focus ring** is 2 px `--focus` (`--night`), 2 px offset, on every focusable element. A green ring would be invisible on white.
- **Links** are `--ink`, underlined.
- **Secondary actions** are ink outline or ink ghost buttons. Never orange: orange means attention.

## 4. Yellow and orange

**Yellow** (`--ball`, `--highlight`)
- The ball path on the court.
- Text selection: yellow fill, `--ink` text.
- Never a button, a link, a team, a status, or text. It is the lightest neon (1.1:1 on white) and the least separable from green (section 8).

**Orange** (`--team-2`, `--error`)
- Team 2 marks: `--orange` fill with an `--edge` ring.
- Error and warning text and field borders: `--orange-deep`, always with words. On white it is 6.2:1; on `--chalk` 5.8:1; on `--chalk-1` 5.5:1.
- Raw `--orange` is never text and never a 1 px border on the page (2.1:1).

## 5. Contrast

WCAG 2.x relative luminance, computed from the hex values. AA needs 4.5:1 for text under 24 px (or 18.66 px bold), 3:1 for large text and for UI component boundaries.

### Text on the page

| Foreground | `--white` | `--chalk` | `--chalk-1` | `--chalk-2` |
| --- | --- | --- | --- | --- |
| Ink (`--night`) | 19.3 | 18.1 | 17.0 | 14.3 |
| Stone (muted) | 6.4 | 6.0 | 5.6 | 4.7 |
| Orange-deep (error) | 6.2 | 5.8 | 5.5 | — |

All pass AA. Stone passes AA on every surface it sits on; it does not go on anything darker than `--chalk-2`.

### Text on neon fills

| Text | On green | On yellow | On orange |
| --- | --- | --- | --- |
| `--night` | 14.3 | 17.0 | 9.3 |
| White | **1.4 fail** | **1.1 fail** | **2.1 fail** |

Rule: **text on a neon fill is always `--night`.** White on neon never.

### Neon on the light page

| Neon as text or line on | `--white` | `--chalk` | `--chalk-1` |
| --- | --- | --- | --- |
| Green | 1.4 | 1.3 | 1.2 |
| Yellow | 1.1 | 1.1 | 1.0 |
| Orange | 2.1 | 1.9 | 1.8 |

All fail 3:1. So neon is only ever a fill that carries a ring or a dark label, and the number it encodes is printed beside it.

### Rings and hairlines

| Mark | Value | Ratio |
| --- | --- | --- |
| `--edge` ring (ink at 50%) on white | `#858785` | 3.6 |
| `--edge` ring on `--chalk-1` | | 3.2 |
| Input border `--stone` on white | `#55634F` | 6.4 |
| `--chalk-2` hairline on `--chalk` | | 1.3 (decorative divider only) |

### Marks on the court

| Foreground | `--court` | `--kitchen` |
| --- | --- | --- |
| White lines | 16.7 | 14.6 |
| Yellow ball | 14.7 | 12.9 |
| Green | 12.3 | 10.8 |
| Orange | 8.0 | 7.0 |
| Sage | 6.7 | 5.9 |

### Neon next to neon

Neon colors have almost no contrast against each other. Adjacent neon fills are separated by the `--edge` ring or a gap of page color.

| Pair | Ratio |
| --- | --- |
| Green / Orange | 1.5 |
| Green / Yellow | 1.2 |
| Yellow / Orange | 1.8 |

## 6. Neon on light: the outline rule

Every neon fill that sits on the page gets `box-shadow: inset 0 0 0 1px var(--edge)`, or a solid `--ink` ring for round dots. This is already how `Dot`, `SplitBar`, `RallyStrip`, and `Meter` draw.

- The ring is dark, so the shape reads at 3.2–3.6:1 even where the fill itself is 1.2–2.1:1.
- The ring separates adjacent neon bars from each other.
- A selected mark gets a heavier ring (2 px `--ink`, outside the fill), and the others dim to 30%.

## 7. Semantic tokens

Components use these names, never raw hex.

| Token | Points to | Use |
| --- | --- | --- |
| `--paper` | `--chalk` | Page background |
| `--surface` | `--white` | Cards, inputs |
| `--hover` | `--chalk-1` | Hover, bar tracks, segmented group ground |
| `--select` | `--green-wash` | Selected row |
| `--rule` | `--chalk-2` | Hairlines, dividers |
| `--edge` | `rgb(11 15 10 / 0.5)` | Ring around neon fills |
| `--ink` | `--night` | Text, strong rings |
| `--muted` | `--stone` | Secondary text, input borders |
| `--scrim` | `rgb(11 15 10 / 0.8)` | Overlay behind text on video |
| `--primary` | `--green` | Action and selected fill |
| `--on-primary` | `--night` | Text on `--primary` |
| `--focus` | `--night` | Focus ring |
| `--highlight` | `--yellow` | Text selection |
| `--error` | `--orange-deep` | Error text and borders |
| `--team-1` | `--green` | Team 1 marks |
| `--team-2` | `--orange` | Team 2 marks |
| `--neutral` | `--sage` | Unattributed marks |
| `--ball` | `--yellow` | Ball path |
| `--court`, `--kitchen`, `--surround`, `--line` | see section 2 | Court |

`teamTone(id)` in `web/src/lib/format.ts` resolves `var(--team-${id})`, so team colors need no TypeScript change.

## 8. Data color

### Teams

Team 1 is green, Team 2 is orange, no team is sage. Players are shown by id (`P1`–`P4`), never by name. Team colors appear only inside data: scoreboard, bars, dots, court marks. They are fills with an outline, never text.

Green and orange are the pair people confuse most under red-green color blindness, so team color is **never alone**:

| Simulated view | Green vs orange ΔE (OKLab ×100) |
| --- | --- |
| Normal vision | 31.1 |
| Deuteranopia | 8.4 |
| Protanopia | 19.9 |
| Tritanopia | 32.4 |

Under deuteranopia the hue gap collapses, so every team mark carries one more cue:

- A text label: team name, `T1` / `T2`, or player id `P1`–`P4`.
- A fixed position: Team 1 left or top, Team 2 right or bottom, in every split bar and compare view.
- On the court: the player id sits beside the mark.

Partners on one team share the hue and are told apart by id. Marker shape is already taken on the court (filled with an `--ink` ring means in, hollow means out), so shape never encodes team or player.

### Ball

Yellow and green are almost the same color under protanopia (ΔE 2.5) and close under deuteranopia (7.0). The ball is therefore always drawn as a path with its trail, never as a lone dot, and it never shares a fill with a Team 1 mark. Where the ball path crosses a green mark, only the path shape separates them.

| Pair (ΔE, OKLab ×100) | Normal | Deut. | Prot. | Trit. |
| --- | --- | --- | --- | --- |
| Green / Yellow | 14.2 | 7.0 | 2.5 | 17.0 |
| Green / Orange | 31.1 | 8.4 | 19.9 | 32.4 |
| Yellow / Orange | 24.5 | 15.1 | 22.1 | 24.4 |

### Single series and scales

- **One metric, one team:** that team's hue as a fill with its ring, on a `--hover` track.
- **Sequential (heat, density):** from `--hover` to the team hue, `color-mix(in oklab, var(--team-1) 25%, var(--hover))` through 100% in steps of 25. Fills only; print the value in `--ink`.
- **Diverging (who has the advantage):** `--team-2` on one side, `--hover` at zero, `--team-1` on the other.
- **More than two series:** green, orange, sage. Past three, switch to small multiples. Do not invent more colors.

### Status

| State | Mark | Required cue |
| --- | --- | --- |
| Error | `--error` text or border | The message text next to the field |
| Neutral / not run | `--muted` | Label |

A figure built on a failing data check is still shown, with its warning text beside it. The Data checks list draws its meters in `--ink`; it does not use team colors, so green and orange never carry two meanings in the same region.

## 9. Court

Report convention: `x_m` 0–6.096 left to right, `y_m` 0–13.4112 far to near, net at 6.7056.

The court is a dark stage inside the light page. It is the one exception to "light only", and it is a content surface, not a theme.

| Part | Token | Hex |
| --- | --- | --- |
| Outside the court | `--surround` | `#0B0F0A` |
| Playing surface | `--court` | `#182016` |
| Kitchen | `--kitchen` | `#222B20` |
| Lines | `--line` | `#FFFFFF`, stroke 0.05 m |
| Net | `--line` | `#FFFFFF`, stroke 0.09 m, round caps |
| Ball path | `--ball` | `#E1FF00`, stroke 0.03 m, 0.75 opacity |
| Team marks | `--team-1`, `--team-2` | green, orange; landed shots filled with an `--ink` ring, out shots hollow |

Why dark: team marks, hollow out-rings, movement paths, and the ball path are thin neon strokes. On the dark court they are 7.0–14.7:1. On a light court, yellow would be 1.1:1 and hollow green rings 1.4:1, and every mark would need a dark casing drawn under it. If a light court is wanted later, that is component work in `Court.tsx`, plus new values for the three court tokens.

## 10. Type

One variable family, **Archivo**, loaded from Google Fonts with the width axis (`wdth` 62–125, `wght` 100–900). The width axis carries the character.

| Token | Value | Use |
| --- | --- | --- |
| `--font` | `'Archivo', system-ui, sans-serif` | All text |
| `--wdth-condensed` | 62 | Wordmark, score, code digits |
| `--wdth-narrow` | 82 | Titles, controls |
| `--step--1` | 0.8125 rem | Labels, captions, table data |
| `--step-0` | 1 rem | Body |
| `--step-1` | 1.25 rem | Wordmark, card titles |
| `--step-2` | 1.5625 rem | Section titles |
| `--step-3` | 2.25 rem | Page titles |
| `--step-score` | 6 rem | The score |

| Role | Weight | Width | Notes |
| --- | --- | --- | --- |
| Score, wordmark | 800–900 | condensed | `tabular-nums`, tracking −0.02em |
| Titles | 800–900 | narrow | Tracking −0.01em |
| Controls, labels | 600 | narrow | |
| Numbers in tables and bars | 600–700 | normal | `font-variant-numeric: tabular-nums` |
| Body | 400 | normal | Line height 1.5, measure `--measure` (68ch) |

## 11. Space, shape, layout, motion

| Token | Value |
| --- | --- |
| `--space-1` … `--space-6` | 0.25, 0.5, 1, 1.5, 2.5, 4 rem |
| `--radius-s` | 3 px, options inside controls |
| `--radius-m` | 8 px, cards, inputs, the court |
| `--page` | 1240 px max width |
| `--column` | 26 rem, auth and narrow column |
| `--measure` | 68ch |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |

- **Elevation is a hairline, not a shadow.** A card is `--surface` (white) on `--paper` (chalk), separated by `--rule`. No drop shadows, no glows. The one overlay is `--scrim`.
- **Layout:** design at desktop width, then hold down to 375 px with no horizontal scroll. Breakpoints in use: 900 px (auth split, game grid) and 600 px (scoreboard, court view, report list).
- **Motion:** 120 ms for hover, 200 ms for state change, `--ease-out`. Under `prefers-reduced-motion: reduce` every animation and transition collapses to ~0 ms (already set in `global.css`) and the sign-in clip shows its still poster.

## 12. Components

| Component | Rest | Hover | Selected / active | Focus | Disabled |
| --- | --- | --- | --- | --- | --- |
| Primary button | `--primary` fill, `--on-primary` text | Opacity 0.88 | — | 2 px `--focus` ring | Opacity 0.55 |
| Text field | `--surface` fill, 1 px `--muted` border, `--ink` text | — | — | 2 px `--focus` ring | — |
| Field error | Border and message in `--error` | — | — | — | — |
| Code field cell | `--surface` fill, 1 px `--rule` border | — | Next cell: `--focus` border, outline, and caret | Same | Opacity 0.6 while busy |
| Segmented control | Group on `--hover`, options `--ink` | Option on `--paper` | Option `--primary` fill, `--on-primary` text | 2 px `--focus` ring | — |
| Table row | Transparent | `--hover` | `--select` | 2 px `--focus` ring | — |
| Bar / split bar / meter | Track `--hover`, fill team hue with `--edge` ring | — | — | — | Fill `--neutral` |
| Rally strip cell | Team hue with `--edge` ring | `--hover` ground behind the bar | 2 px `--ink` ring outside the fill, other bars dim to 30% | 2 px `--focus` ring | — |
| Link | `--ink`, underlined | Underline thickens | — | 2 px `--focus` ring | — |

Inputs and buttons should be at least 44 px tall on touch widths.

## 13. Token block

`web/src/styles/tokens.css` as shipped. Type, space, and shape values are the same as before the palette change.

```css
:root {
  color-scheme: light;

  /* Theme colors: neon fills, never text or thin lines on light */
  --green: #39ff14;
  --yellow: #e1ff00;
  --orange: #ff9d23;
  /* The orange that passes on light, for text and borders */
  --orange-deep: #9c4a00;

  /* Neutrals: green-tinted chalk for the page, stone and sage for muted text and marks */
  --white: #ffffff;
  --chalk: #f6f8f3;
  --chalk-1: #eef2e8;
  --chalk-2: #d9e0d2;
  --stone: #55634f;
  --sage: #9aa894;

  /* Night: text, the court stage, and text on neon fills */
  --night: #0b0f0a;

  /* Wash */
  --green-wash: rgb(57 255 20 / 0.16);

  /* Surface and text */
  --paper: var(--chalk);
  --surface: var(--white);
  --hover: var(--chalk-1);
  --select: var(--green-wash);
  --rule: var(--chalk-2);
  --edge: rgb(11 15 10 / 0.5);
  --ink: var(--night);
  --muted: var(--stone);
  --scrim: rgb(11 15 10 / 0.8);

  /* Action and state */
  --primary: var(--green);
  --on-primary: var(--night);
  --focus: var(--night);
  --highlight: var(--yellow);
  --error: var(--orange-deep);

  /* Court: a dark stage inside the light page, so the neon marks keep their contrast */
  --court: #182016;
  --kitchen: #222b20;
  --surround: var(--night);
  --line: var(--white);
  --ball: var(--yellow);

  /* Teams */
  --team-1: var(--green);
  --team-2: var(--orange);
  --neutral: var(--sage);

  /* Type: one variable family, width axis carries the scoreboard */
  --font: 'Archivo', system-ui, sans-serif;
  --wdth-condensed: 62;
  --wdth-narrow: 82;
  --step--1: 0.8125rem;
  --step-0: 1rem;
  --step-1: 1.25rem;
  --step-2: 1.5625rem;
  --step-3: 2.25rem;
  --step-score: 6rem;

  /* Space and shape */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 1rem;
  --space-4: 1.5rem;
  --space-5: 2.5rem;
  --space-6: 4rem;
  --radius-s: 3px;
  --radius-m: 8px;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --page: 1240px;
  --column: 26rem;
  --measure: 68ch;
}
```

`web/index.html` carries `<meta name="theme-color" content="#f6f8f3">`.

## 14. Change from the previous palette

The names stay; most files needed no edit. `--ink` is still the text color and `--paper` still the page.

| Token | Was | Now |
| --- | --- | --- |
| `--paper` | `#f3f5f7` | `--chalk` `#f6f8f3` |
| `--ink` | `#11243a` | `--night` `#0b0f0a` |
| `--muted` | `#5e6e7f` | `--stone` `#55634f` |
| `--rule` | `#d5dce3` | `--chalk-2` `#d9e0d2` |
| `--hover` | `#e9edf1` | `--chalk-1` `#eef2e8` |
| `--select` | `#dde5ed` | green at 16% |
| `--edge` | ink at 18% | ink at 50% |
| `--surface` | `#ffffff` | `--white` |
| `--error` | `#b3254c` | `--orange-deep` `#9c4a00` |
| `--scrim` | ink at 80% | night at 80% |
| `--court` | `#2e64a0` | `#182016` |
| `--kitchen` | `#285a92` | `#222b20` |
| `--surround` | `#3c7a5e` | `--night` |
| `--team-1` | `#f4c430` | `--green` |
| `--team-2` | `#e0527a` | `--orange` |
| `--neutral` | `#a3afbb` | `--sage` |
| `--focus` | `#2e64a0` | `--night` |

Added: `--green`, `--yellow`, `--orange`, `--orange-deep`, `--white`, `--chalk`, `--chalk-1`, `--chalk-2`, `--stone`, `--sage`, `--night`, `--green-wash`, `--primary`, `--on-primary`, `--highlight`, `--ball`.

CSS that changed with the palette:

| File | Change |
| --- | --- |
| `components/SegmentedControl.module.css` | Active option: `--primary` fill, `--on-primary` text (was `--ink` fill) |
| `features/auth/AuthStep.module.css` | Submit button: `--primary` fill, `--on-primary` text |
| `features/rallies/RallyStrip.module.css` | Selected ring: 2 px `--ink` outside the fill (was inset) |
| `components/Court.module.css` | Ball path stroke: `--ball` (was `--line`) |
| `components/Meter.module.css` | Fill gets the `--edge` ring |
| `components/CodeField.module.css` | Next-cell border, outline, and caret use `--focus` |
| `styles/global.css` | `::selection`: `--highlight` fill, `--ink` text |

## 15. Do and don't

| Do | Don't |
| --- | --- |
| Put `--night` text on every neon fill | Put white text on a neon fill |
| Use neon only as a fill with an `--edge` ring | Set text, links, focus rings, or 1 px lines in neon on the page |
| Use `--orange-deep` for error text | Use `--orange` for text |
| Pair every team color with a label or position | Tell the teams apart by hue alone |
| Keep one green primary action per view | Fill several large areas with green |
| Draw the ball as a path with its trail | Draw the ball as a lone yellow dot beside a green mark |
| Separate a card from the page with `--rule` | Add drop shadows or glows |
| Use `color-mix` with tokens for ramps | Add a fourth hue for a fourth series |

## 16. Checks before a change ships

- No raw hex in any `*.module.css`; every color is a token from `tokens.css`.
- Every text pair is at least 4.5:1 (3:1 for 24 px and up). Use the tables in section 5.
- No neon text, neon link, or neon 1 px line on the light page.
- Every neon fill on the page has its ring.
- Remove all color and re-read the view: team, status, and ball are still identifiable.
- Tab through the view: the focus ring is visible on every stop, including on the sign-in clip.
- Resize to 375 px: no horizontal scroll.
- Toggle `prefers-reduced-motion`: nothing animates.

Numbers in sections 5 and 8 were computed from the hex values: contrast by WCAG 2.x relative luminance; ΔE as OKLab distance ×100; color-blind views by Machado et al. (2009) simulation matrices at full severity, applied in linear RGB.
