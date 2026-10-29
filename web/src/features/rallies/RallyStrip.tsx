import { useT } from '../../components/useT';
import type { RallyReport } from '../../lib/report/analysis';
import type { Id } from '../../lib/report/types';
import { describeOutcome, playerLabel, teamTone } from '../../lib/format';
import styles from './RallyStrip.module.css';

type RallyStripProps = {
  rallies: RallyReport[];
  order: Id[];
  selected: number | null;
  onSelect: (rally: number | null) => void;
};

export function RallyStrip({ rallies, order, selected, onSelect }: RallyStripProps) {
  const t = useT();
  const most = Math.max(...rallies.map((r) => r.shot_count));

  return (
    <div className={styles.strip}>
      <p className={styles.note}>{t('rallies.note')}</p>
      <div className={styles.bars} role="group" aria-label={t('rallies.label')} data-active={selected !== null}>
        {rallies.map((r) => {
          const call = r.serve
            ? t('rallies.serving', { call: r.serve.score_call, player: playerLabel(r.serve.server_player_id) })
            : t('rallies.no_serve');
          const text = t('rallies.bar', {
            rally: t('rallies.name', { n: r.rally_number }),
            call,
            contacts: r.shot_count,
            outcome: describeOutcome(t, r, order),
          });
          return (
            <button
              key={r.rally_number}
              type="button"
              className={styles.bar}
              aria-pressed={selected === r.rally_number}
              aria-label={text}
              title={text}
              onClick={() => onSelect(selected === r.rally_number ? null : r.rally_number)}
            >
              <span
                className={styles.fill}
                style={{
                  height: `${(r.shot_count / most) * 100}%`,
                  background: teamTone(r.scoring ? r.winner_team_id : null),
                }}
              />
            </button>
          );
        })}
      </div>
      <div className={styles.axis}>
        <span>{t('rallies.name', { n: 1 })}</span>
        <span>{t('rallies.name', { n: rallies.length })}</span>
      </div>
    </div>
  );
}
