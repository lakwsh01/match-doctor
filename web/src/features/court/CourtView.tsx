import { useState, type ReactNode } from 'react';
import { Court } from '../../components/Court';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useT } from '../../components/useT';
import { VideoPlayer } from '../../components/VideoPlayer';
import type { GameReport, RallyReport } from '../../lib/report/analysis';
import type { PlayerReport } from '../../lib/report/player';
import { heatCells } from '../../lib/report/position';
import type { Id } from '../../lib/report/types';
import { MATCH_VIDEO } from '../../lib/report/video';
import { describeOutcome, formatClock, playerLabel, teamTone } from '../../lib/format';
import styles from './CourtView.module.css';

type Layer = 'bounces' | 'contacts' | 'positions';

// Tracks are 10 Hz; drawing every fifth sample (2 Hz) keeps frame jitter from scribbling over the court.
const TRACK_STEP = 5;

type Hit = { t: number; x: number; y: number };

// Contacts up to `clock`, plus the ball's place on the way to the next player.
function ballTrail(hits: Hit[], clock: number) {
  const sorted = [...hits].sort((a, b) => a.t - b.t);
  const trail: Hit[] = [];
  let i = 0;
  for (; i < sorted.length && sorted[i].t <= clock; i++) trail.push(sorted[i]);
  const next = sorted[i];
  const prev = trail[trail.length - 1];
  if (prev && next && next.t > prev.t) {
    const u = (clock - prev.t) / (next.t - prev.t);
    trail.push({ t: clock, x: prev.x + (next.x - prev.x) * u, y: prev.y + (next.y - prev.y) * u });
  }
  return trail;
}

function playedClock(rally: { start_sec: number; end_sec: number }, time: number | null) {
  if (time !== null && time >= rally.start_sec && time <= rally.end_sec + 0.4) return Math.min(time, rally.end_sec);
  return rally.start_sec;
}

function walked(points: [number, number, number][], clock: number) {
  const been: [number, number, number][] = [];
  let upcoming: [number, number, number] | null = null;
  for (const point of points) {
    if (point[0] <= clock) been.push(point);
    else {
      upcoming = point;
      break;
    }
  }
  const last = been[been.length - 1];
  const head =
    last && upcoming && upcoming[0] > last[0]
      ? {
          x: last[1] + ((upcoming[1] - last[1]) * (clock - last[0])) / (upcoming[0] - last[0]),
          y: last[2] + ((upcoming[2] - last[2]) * (clock - last[0])) / (upcoming[0] - last[0]),
        }
      : last
        ? { x: last[1], y: last[2] }
        : null;
  const trail = been.filter((_, i) => i % TRACK_STEP === 0);
  if (last && trail[trail.length - 1] !== last) trail.push(last);
  if (head) trail.push([clock, head.x, head.y]);
  return { head, points: trail.map(([, x, y]) => ({ x, y })) };
}

type CourtViewProps = {
  court: GameReport['court'];
  players: PlayerReport[];
  rallies: RallyReport[];
  scope: 'game' | 'match';
  rally: number | null;
  player: Id | null;
  onClearRally: () => void;
  onClearPlayer: () => void;
  children?: ReactNode;
};

const LAYERS: Layer[] = ['bounces', 'contacts', 'positions'];

export function CourtView({ court, players, rallies, scope, rally, player, onClearRally, onClearPlayer, children }: CourtViewProps) {
  const t = useT();
  const layers = rallies.length ? LAYERS : LAYERS.filter((l) => l === 'positions');
  const [picked, setLayer] = useState<Layer>('bounces');
  const [time, setTime] = useState<number | null>(null);
  const layer = layers.includes(picked) ? picked : layers[0];
  const onVideoTime = (sec: number) => {
    const next = Math.round(sec * 20) / 20;
    setTime((prev) => (prev === next ? prev : next));
  };

  const teamOf = new Map(players.map((p) => [p.player_id, p.team_id]));
  const tone = (id: Id) => teamTone(teamOf.get(id) ?? null);
  const mine = <T extends { player_id: Id }>(items: T[]) => items.filter((i) => player === null || i.player_id === player);
  const row = rallies.find((r) => r.rally_number === rally);
  const frame = row ? playedClock(row, time) : time;
  const live = row ?? (frame === null ? undefined : rallies.find((r) => frame >= r.start_sec && frame <= r.end_sec));
  const shots = mine((live ? [live] : rallies).flatMap((r) => r.shots));
  const shown = live && frame !== null ? shots.filter((s) => s.time_sec <= frame) : shots;
  const order = players.map((p) => p.team_id).filter((id, i, all) => all.indexOf(id) === i);
  const ball = live && frame !== null ? ballTrail(live.shots.map((s) => ({ t: s.time_sec, x: s.at.x_m, y: s.at.y_m })), frame) : [];
  const walkedTracks = live && frame !== null && layer === 'positions' ? mine(live.tracks).map((track) => ({ track, walk: walked(track.points, frame) })) : [];

  const marks =
    layer === 'bounces'
      ? shown.flatMap((s) => (s.bounce ? [{ id: s.shot_id, x: s.bounce.x_m, y: s.bounce.y_m, tone: tone(s.player_id), hollow: !s.bounce.in_bounds }] : []))
      : layer === 'contacts'
        ? shown.map((s) => ({ id: s.shot_id, x: s.at.x_m, y: s.at.y_m, tone: tone(s.player_id), hollow: false }))
        : walkedTracks.flatMap(({ track, walk }) => (walk.head ? [{ id: track.player_id, x: walk.head.x, y: walk.head.y, tone: tone(track.player_id), hollow: false }] : []));
  const paths = walkedTracks.map(({ track, walk }) => ({ id: track.player_id, tone: tone(track.player_id), points: walk.points }));

  const counts = mine(players)
    .map((p) => p.positioning.heat)
    .reduce((sum, heat) => sum.map((n, i) => n + heat[i]), new Array<number>(court.heat.cols * court.heat.rows).fill(0));
  const heat = layer === 'positions' && !live ? heatCells(court.heat, counts) : [];

  const focus = row ?? live;
  const where = focus ? t('court.where_rally', { n: focus.rally_number }) : t(`court.where_${scope}`);
  const who = player ? playerLabel(player) : t('court.who_players');
  const whose = player ? t('court.who_player', { player: playerLabel(player) }) : t('court.who_all');
  const heading =
    layer === 'positions'
      ? focus
        ? t('court.heading_moves', { who, n: focus.rally_number })
        : t('court.heading_positions', { who, where })
      : t(`court.heading_${layer}`, {
          who: whose,
          n: focus ? (layer === 'bounces' ? shots.filter((s) => s.bounce).length : shots.length) : marks.length,
          where,
        });

  const recording = row
    ? t('video.label_rally', { n: row.rally_number, clock: formatClock(row.start_sec) })
    : t('video.label');

  return (
    <div className={styles.board}>
      <div className={styles.film}>
        <VideoPlayer
          src={MATCH_VIDEO}
          label={recording}
          missing={t('video.missing')}
          start={row?.start_sec ?? null}
          end={row?.end_sec ?? null}
          onTime={onVideoTime}
        />
        {children}
      </div>
      <figure className={styles.view}>
        <div className={styles.diagram}>
          <span className={styles.far}>{t('court.far_end')}</span>
          <Court
            label={heading}
            width={court.width_m}
            length={court.length_m}
            net={court.net_y_m}
            kitchen={court.kitchen_depth_m}
            heat={heat}
            heatTone={player ? tone(player) : 'var(--line)'}
            paths={paths}
            marks={marks}
            ball={ball}
            trace={false}
          />
          <span className={styles.near}>{t('court.near_end')}</span>
        </div>
        <figcaption className={styles.caption}>
          <p className={styles.heading}>{heading}</p>
          {layers.length > 1 && (
            <SegmentedControl
              label={t('court.layer_label')}
              options={layers.map((value) => ({ value, label: t(`court.layer_${value}`) }))}
              value={layer}
              onChange={(v) => setLayer(v as Layer)}
            />
          )}
          <p className={styles.legend}>{row && layer === 'positions' ? t('court.legend_tracks') : t(`court.legend_${layer}`)}</p>
          {row?.serve && (
            <p className={styles.detail}>
              {t('court.detail', {
                call: row.serve.score_call,
                server: playerLabel(row.serve.server_player_id),
                side: t.term('side', row.serve.serving_side),
                contacts: row.shot_count,
                seconds: row.duration_sec.toFixed(1),
                clock: formatClock(row.start_sec),
                outcome: describeOutcome(t, row, order),
              })}
            </p>
          )}
          {(row || player) && (
            <p className={styles.actions}>
              {row && (
                <button type="button" className={styles.reset} onClick={onClearRally}>
                  {t('court.show_rallies')}
                </button>
              )}
              {player && (
                <button type="button" className={styles.reset} onClick={onClearPlayer}>
                  {t('court.show_players')}
                </button>
              )}
            </p>
          )}
        </figcaption>
      </figure>
    </div>
  );
}
