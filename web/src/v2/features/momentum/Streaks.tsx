import { Block } from '../../components/Block';
import { useT } from '../../components/useT';
import { rallyRef, score, teamTone } from '../../lib/format';
import type { ClipRef, Id, ReportV2, Streak } from '../../lib/types';
import styles from './Streaks.module.css';

type StreaksProps = {
  title: string;
  streaks: Streak[];
  kind: 'run' | 'drought';
  order: Id[];
  report: ReportV2;
  onWatch: (clip: ClipRef) => void;
};

// Scoring runs (MO-06) or side-out droughts (MO-07) of three or more, in match order.
export function Streaks({ title, streaks, kind, order, report, onWatch }: StreaksProps) {
  const t = useT();
  const sorted = [...streaks].sort((a, b) => a.game - b.game || a.rally_number - b.rally_number);
  return (
    <Block title={title} level={3}>
      {sorted.length ? (
        <ol className={styles.list}>
          {sorted.map((s) => (
            <li key={`${s.team_id}-${s.game}-${s.rally_number}`} className={styles.item}>
              <span className={styles.length} style={{ background: teamTone(s.team_id) }}>
                {s.length}
              </span>
              <span className={styles.text}>
                {t(kind === 'run' ? 'mo.run' : 'mo.drought', {
                  team: t('team', { id: s.team_id }),
                  n: s.length,
                  from: score(s.from, order),
                  to: score(s.to, order),
                })}
                <button type="button" className={styles.watch} onClick={() => onWatch(s)}>
                  {t('watch')} <span className={styles.ref}>{rallyRef(t, s, report.kind === 'match')}</span>
                </button>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.none}>{t('mo.none')}</p>
      )}
    </Block>
  );
}
