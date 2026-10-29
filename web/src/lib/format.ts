import type { Translator } from './i18n/translate';
import type { RallyReport } from './report/analysis.ts';
import type { Rate } from './stats.ts';
import type { Id } from './report/types';

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

// 75 -> "1:15", 3918 -> "1:05:18"
export function formatClock(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(sec % 60)}` : `${m}:${pad(sec % 60)}`;
}

export const formatFixed = (digits: number) => (n: number | null) =>
  n !== null && Number.isFinite(n) ? n.toFixed(digits) : '–';

export const formatPct = (n: number | null) => (n === null ? '–' : `${Math.round(n * 100)}%`);
export const formatRate = (r: Rate) => formatPct(r.pct);

export const isMatchId = (id: string) => id.endsWith('_match');

// "..._game_2" -> "Game 2", "..._match" -> "Match"; any other report id is shown as is.
export function reportName(t: Translator, id: string) {
  if (isMatchId(id)) return t('report.match');
  const game = id.match(/game_(\d+)$/)?.[1];
  return game ? t('report.game', { n: game }) : id;
}

export const playerLabel = (id: Id) => `P${id}`;
export const teamLabel = (t: Translator, id: Id) => t('team', { id });
export const teamTone = (id: Id | null) => (id ? `var(--team-${id})` : 'var(--neutral)');

export const formatScore = (score: Record<Id, number>, order: Id[]) => order.map((id) => score[id]).join('–');

// "P4 into net (unforced). Side-out." or "Winner by P2. Point to Team 1, 4–2."
export function describeOutcome(t: Translator, r: RallyReport, order: Id[]) {
  const e = r.ended_by;
  const player = e.player_id ? playerLabel(e.player_id) : '';
  const type = t.term('error', e.error_type ?? 'error').toLowerCase();
  const how =
    e.kind === 'error' && e.player_id
      ? e.cause
        ? t('outcome.error_cause', { player, type, cause: t.term('cause', e.cause) })
        : t('outcome.error', { player, type })
      : e.player_id
        ? t('outcome.winner', { player })
        : '';
  const result =
    r.scoring && r.winner_team_id
      ? t('outcome.point', { team: teamLabel(t, r.winner_team_id), score: formatScore(r.score_after, order) })
      : t('outcome.side_out');
  return t('outcome.join', { how, result }).trim();
}
