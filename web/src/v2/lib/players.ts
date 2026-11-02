import { rate } from '../../lib/stats.ts';
import type { PlayerReport } from '../../lib/report/player.ts';
import type { Id } from '../../lib/report/types';
import type { Context } from './context.ts';
import { fromRate, popUps, speedupsWon } from './phases.ts';
import { band, cell, cells, family, height, isSpeedup, ref } from './rallies.ts';
import type { Shot } from './rallies.ts';
import { between, pick, shares, whole } from './seed.ts';
import type { CauseTag, ErrorLink, Part, PlayerV2, RadarAxis, Source } from './types';

const MIX = ['dink', 'drive', 'drop', 'volley', 'speedup', 'overhead', 'serve', 'return'];
const KMH = 3.6;
const PATTERN_MIN = 3;
// A shot's family when it has a name in the mix, else "other".
const kind = (gesture: string) => (MIX.includes(family(gesture)) ? family(gesture) : 'other');

// 0-100 against the top of the usual 3.5–4.0 range, so a typical player sits near 70–90.
const score = (values: (number | null)[], top: number) => {
  const known = values.filter((v): v is number => v !== null);
  return known.length ? Math.round(Math.min(1, known.reduce((s, v) => s + v, 0) / known.length / top) * 100) : 0;
};

function mix(p: PlayerReport): Part[] {
  const total = p.shots.total || 1;
  const counts = new Map<string, number>();
  for (const g of p.shots.by_gesture) {
    counts.set(kind(g.label), (counts.get(kind(g.label)) ?? 0) + g.value);
  }
  // The four most-used shots by name, the rest together, so the mix stays readable.
  const parts = [...counts].map(([label, n]) => ({ label, value: n / total })).sort((a, b) => b.value - a.value);
  const named = parts.filter((x) => x.label !== 'other').slice(0, 4);
  const rest = 1 - named.reduce((sum, x) => sum + x.value, 0);
  return rest > 0.0005 ? [...named, { label: 'other', value: rest }] : named;
}

const speed = (shots: Shot[]) => {
  const v = shots.flatMap((s) => (s.speed_mps ? [s.speed_mps * KMH] : []));
  return { avg: v.length ? v.reduce((s, x) => s + x, 0) / v.length : null, max: v.length ? Math.max(...v) : null, n: v.length };
};

// A plausible cause for an error, picked from the ones its measured context allows.
function cause(seed: string, link: Omit<ErrorLink, 'cause' | 'spin'>): CauseTag {
  const options: CauseTag[] =
    link.height === 'below' && (family(link.gesture) === 'drive' || link.gesture === 'speedup')
      ? ['shot_choice', 'rushed']
      : link.zone === 'transition'
        ? ['position', 'balance']
        : link.incoming === 'fast'
          ? ['rushed', 'balance']
          : ['execution', 'shot_choice'];
  return pick(seed, options);
}

function chain(ctx: Context, id: Id): ErrorLink[] {
  return ctx.rallies.flatMap((r) =>
    r.shots.flatMap((s, i) => {
      if (!s.error || s.player_id !== id) return [];
      // The ball that came before: the last shot by the other team.
      const prev = r.shots.slice(0, i).findLast((x) => ctx.teamOf(x.player_id) !== ctx.teamOf(id));
      const kmh = prev?.speed_mps ? prev.speed_mps * KMH : null;
      const base = {
        ...ref(r),
        gesture: s.gesture,
        incoming_kmh: kmh,
        incoming: kmh === null ? null : kmh < 30 ? ('slow' as const) : kmh < 55 ? ('medium' as const) : ('fast' as const),
        height: height(s.at.height_above_net_m),
        zone: band(ctx.court, s.at.y_m),
        from_player: prev?.player_id ?? null,
        from_dir: prev ? (Math.abs(prev.at.x_m - s.at.x_m) > ctx.court.width_m / 3 ? ('cross' as const) : ('straight' as const)) : null,
        error_type: s.error.type,
      };
      const seed = `${ctx.id}:${r.game}:${s.shot_id}`;
      return [{ ...base, cause: cause(seed, base), spin: pick(`${seed}:spin`, ['topspin', 'slice', 'flat'] as const) }];
    }),
  );
}

export function player(ctx: Context, p: PlayerReport): PlayerV2 {
  const id = p.player_id;
  const mine = (s: Shot) => s.player_id === id;
  const shots = ctx.rallies.flatMap((r) => r.shots.filter(mine));
  const seed = `${ctx.id}:player:${id}`;
  const errors = chain(ctx, id);
  const dinks = shots.filter((s) => family(s.gesture) === 'dink').length;
  const speedups = shots.filter(isSpeedup).length;
  const popUp = popUps(ctx.rallies, mine);
  const reset = between(`${seed}:reset`, 0.3, 0.6);
  const radar: { axis: RadarAxis; value: number; source: Source }[] = [
    { axis: 'serve', value: score([p.serve.in.pct, p.serve.deep.pct], 0.75), source: 'derived' },
    { axis: 'return', value: score([p.return.in.pct, p.return.deep.pct], 0.75), source: 'derived' },
    { axis: 'third', value: score([p.third_shot.drop_in_kitchen.pct], 0.7), source: 'derived' },
    { axis: 'dink', value: score([p.dinks.in_kitchen.pct, popUp.pct === null ? null : 1 - popUp.pct], 0.85), source: 'derived' },
    { axis: 'hands', value: score([speedupsWon(ctx.rallies, mine, () => p.team_id).pct], 0.6), source: 'derived' },
    { axis: 'defense', value: score([reset], 0.55), source: 'demo' },
  ];
  const groups = [...new Set(shots.map((s) => kind(s.gesture)))];
  const conditional = groups.flatMap((g) => {
    const of = shots.filter((s) => kind(s.gesture) === g);
    const below = of.filter((s) => height(s.at.height_above_net_m) === 'below');
    const above = of.filter((s) => ['level', 'above'].includes(height(s.at.height_above_net_m) ?? ''));
    const failed = (list: Shot[]) => list.filter((s) => s.error).length;
    return below.length + above.length >= 10 && failed(of)
      ? [{ gesture: g, below: fromRate(rate(failed(below), below.length)), above: fromRate(rate(failed(above), above.length)) }]
      : [];
  });
  const patterns = [...new Set(errors.map((e) => kind(e.gesture)))].flatMap((g) => {
    const same = errors.filter((e) => kind(e.gesture) === g);
    return (['below', 'level', 'above'] as const).flatMap((h) => {
      const count = same.filter((e) => e.height === h).length;
      return count >= PATTERN_MIN && count / same.length >= 0.4 ? [{ gesture: g, height: h, count, of: same.length }] : [];
    });
  });

  return {
    player_id: id,
    team_id: p.team_id,
    hand: pick(`${seed}:hand`, ['right', 'right', 'right', 'left'] as const),
    shots: p.shots.total,
    radar,
    mix: mix(p),
    touch: cells(shots.map((s) => cell(ctx.court, Math.max(0, s.at.x_m), s.at.y_m))),
    landing: cells(shots.flatMap((s) => (s.bounce?.in_bounds && (s.bounce.y_m > ctx.court.net_y_m) !== (s.at.y_m > ctx.court.net_y_m) ? [cell(ctx.court, s.bounce.x_m, s.bounce.y_m)] : []))),
    speed: [
      { key: 'serve', ...speed(shots.filter((s) => s.gesture === 'serve')) },
      { key: 'drive', ...speed(shots.filter((s) => family(s.gesture) === 'drive')) },
      { key: 'speedup', ...speed(shots.filter(isSpeedup)) },
    ],
    errors: {
      unforced: p.errors.unforced,
      forced: p.errors.forced,
      per100: p.shots.total ? (p.errors.total / p.shots.total) * 100 : null,
      types: p.errors.by_type.map((x) => ({ label: x.label, value: x.value })),
    },
    speedups: { count: speedups, per10dinks: dinks ? (speedups / dinks) * 10 : null },
    targeted: fromRate(p.targeted),
    poach: (() => {
      const of = whole(`${seed}:poach`, 2, 7);
      return fromRate(rate(whole(`${seed}:poach:won`, 1, of), of));
    })(),
    under_attack: {
      from: shares(`${seed}:from`, 9, 0.02),
      targets: ['middle', 'feet', 'backhand_hip', 'forehand', 'high'].map((label, i) => ({ label, value: shares(`${seed}:targets`, 5, 0.1)[i] })),
      behind_line_m: between(`${seed}:behind`, 0.4, 1.8),
      off_ideal_m: between(`${seed}:off`, 0.5, 1.5),
      over_1m: between(`${seed}:over`, 0.15, 0.55),
      holes: ['middle_gap', 'left_sideline', 'right_sideline', 'over_head'].map((label) => ({ label, value: whole(`${seed}:hole:${label}`, 0, 6) })),
    },
    error_chain: errors,
    patterns: patterns.sort((a, b) => b.count - a.count).slice(0, 3),
    conditional,
  };
}
