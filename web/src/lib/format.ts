import type { Id } from './report/types';

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

// 75 -> "1:15", 3918 -> "1:05:18"
export function formatClock(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(sec % 60)}` : `${m}:${pad(sec % 60)}`;
}

export const formatFixed = (digits: number) => (n: number) => (Number.isFinite(n) ? n.toFixed(digits) : '–');

// "around_the_post" -> "Around the post"
export const humanize = (key: string) => key.charAt(0).toUpperCase() + key.slice(1).replaceAll('_', ' ');

// "..._game_2" -> "Game 2"; any other report id is shown as is.
export function gameLabel(id: string) {
  const game = id.match(/game_(\d+)$/)?.[1];
  return game ? `Game ${game}` : id;
}

export const playerLabel = (id: Id) => `P${id}`;
export const teamLabel = (id: Id) => `Team ${id}`;
export const teamTone = (id: Id | null) => (id ? `var(--team-${id})` : 'var(--neutral)');

export const formatScore = (score: Record<Id, number>, order: Id[]) => order.map((id) => score[id]).join('–');
