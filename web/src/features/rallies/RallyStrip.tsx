import { rallyRows, teamIds } from '../../lib/report/derive';
import type { Report } from '../../lib/report/types';
import { formatScore, teamLabel, teamTone } from '../../lib/format';
import styles from './RallyStrip.module.css';

type RallyStripProps = {
  report: Report;
  selected: number | null;
  onSelect: (rally: number | null) => void;
};

export function RallyStrip({ report, selected, onSelect }: RallyStripProps) {
  const rows = rallyRows(report);
  const order = teamIds(report);
  const most = Math.max(...rows.map((r) => r.shots));

  return (
    <div className={styles.strip}>
      <p className={styles.note}>
        Each bar is a rally, as tall as its shot count and colored by who won the point. Grey rallies scored
        nothing. Select one to replay its bounces.
      </p>
      <div className={styles.bars} role="group" aria-label="Rallies" data-active={selected !== null}>
        {rows.map((r) => {
          const result = r.winnerTeam && r.score ? `${teamLabel(r.winnerTeam)}, ${formatScore(r.score, order)}` : 'no point';
          return (
            <button
              key={r.number}
              type="button"
              className={styles.bar}
              aria-pressed={selected === r.number}
              aria-label={`Rally ${r.number}, ${r.shots} shots, ${result}`}
              title={`Rally ${r.number}: ${r.shots} shots, ${result}`}
              onClick={() => onSelect(selected === r.number ? null : r.number)}
            >
              <span
                className={styles.fill}
                style={{ height: `${(r.shots / most) * 100}%`, background: teamTone(r.winnerTeam) }}
              />
            </button>
          );
        })}
      </div>
      <div className={styles.axis}>
        <span>Rally 1</span>
        <span>Rally {rows.length}</span>
      </div>
    </div>
  );
}
