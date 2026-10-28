import { Court } from '../../components/Court';
import { bouncesFor, rallyRows, teamIds, teamOf } from '../../lib/report/derive';
import type { Id, Report } from '../../lib/report/types';
import { formatClock, formatScore, playerLabel, teamLabel, teamTone } from '../../lib/format';
import styles from './CourtView.module.css';

type CourtViewProps = {
  report: Report;
  rally: number | null;
  player: Id | null;
  onClearRally: () => void;
  onClearPlayer: () => void;
};

export function CourtView({ report, rally, player, onClearRally, onClearPlayer }: CourtViewProps) {
  const court = report.conventions.court;
  const bounces = bouncesFor(report, rally, player);
  const row = rallyRows(report).find((r) => r.number === rally);
  const whose = player ? `${playerLabel(player)}’s` : 'All';
  const where = row ? `in rally ${row.number}` : 'this game';

  return (
    <figure className={styles.view}>
      <figcaption className={styles.caption}>
        <p className={styles.heading}>
          {whose} {bounces.length} bounces {where}
        </p>
        {row && (
          <p className={styles.detail}>
            {row.shots} shots over {row.duration.toFixed(1)} s, starting at {formatClock(row.start)} in the video.{' '}
            {row.winnerTeam && row.score
              ? `Point to ${teamLabel(row.winnerTeam)}, ${formatScore(row.score, teamIds(report))}.`
              : 'No point scored.'}
          </p>
        )}
        {(row || player) && (
          <p className={styles.actions}>
            {row && (
              <button type="button" className={styles.reset} onClick={onClearRally}>
                Show all rallies
              </button>
            )}
            {player && (
              <button type="button" className={styles.reset} onClick={onClearPlayer}>
                Show all players
              </button>
            )}
          </p>
        )}
      </figcaption>
      <Court
        label={`Court with ${bounces.length} ball bounces`}
        width={court.width_m}
        length={court.length_m}
        net={court.net_y_m}
        kitchen={court.kitchen_depth_m}
        trace={row !== undefined}
        marks={bounces.map((b, i) => ({
          id: `${b.shot_id ?? 'miss'}-${i}`,
          x: b.x_m,
          y: b.y_m,
          tone: teamTone(teamOf(report, b.hitter_player_id)),
          inBounds: b.in_bounds,
        }))}
      />
      <div className={styles.ends}>
        <span>Far end</span>
        <span>Hollow marks landed out</span>
        <span>Near end</span>
      </div>
    </figure>
  );
}
