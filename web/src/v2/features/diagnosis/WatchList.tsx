import { Block } from '../../components/Block';
import { useT } from '../../components/useT';
import { clock, rallyRef, teamTone } from '../../lib/format';
import type { ClipRef, ReportV2, TeamSummary } from '../../lib/types';
import styles from './WatchList.module.css';

type WatchListProps = {
  report: ReportV2;
  items: TeamSummary['must_watch'];
  onWatch: (clip: ClipRef) => void;
};

// Two or three rallies to learn from (MI-13): the best one and the ones that show the leak.
export function WatchList({ report, items, onWatch }: WatchListProps) {
  const t = useT();
  const match = report.kind === 'match';
  const rows = items.flatMap((item) => {
    const clip = report.clips.find((c) => c.game === item.game && c.rally_number === item.rally_number);
    return clip ? [{ item, clip }] : [];
  });
  return (
    <Block title={t('dx.watch')} level={2}>
      <ul className={styles.list}>
        {rows.map(({ item, clip }) => (
          <li key={`${item.kind}-${clip.game}-${clip.rally_number}`}>
            <button type="button" className={styles.row} onClick={() => onWatch(item)} aria-label={t('watch.rally', { game: clip.game, n: clip.rally_number })}>
              <span className={styles.play} aria-hidden="true" />
              <span className={styles.text}>
                <span className={styles.kind}>{t(item.kind === 'highlight' ? 'dx.watch_highlight' : 'dx.watch_leak')}</span>
                <span className={styles.meta}>
                  <span>{rallyRef(t, clip, match)}</span>
                  <span>{t('unit.shots', { n: clip.shots })}</span>
                </span>
              </span>
              <span className={styles.time}>
                <span className={styles.dot} style={{ background: teamTone(clip.winner_team_id) }} />
                {clock(clip.start_sec)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Block>
  );
}
