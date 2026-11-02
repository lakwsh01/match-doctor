import { useT } from '../../components/useT';
import { teamTone } from '../../lib/format';
import type { Id, ReportV2 } from '../../lib/types';
import styles from './BoxScore.module.css';

type BoxScoreProps = {
  report: ReportV2;
  order: Id[];
};

// Points per game for each team, game winners in bold, and games won at the end.
export function BoxScore({ report, order }: BoxScoreProps) {
  const t = useT();
  const { games } = report.info;
  return (
    <table className={styles.box}>
      <caption className={styles.caption}>{t('box.label')}</caption>
      <thead>
        <tr>
          <th scope="col" className={styles.team}>
            {t('box.team')}
          </th>
          {games.map((g) => (
            <th key={g.number} scope="col" className={styles.num}>
              {t('box.game', { n: g.number })}
            </th>
          ))}
          {games.length > 1 && (
            <th scope="col" className={styles.num}>
              {t('box.games')}
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {order.map((id) => (
          <tr key={id} data-winner={report.info.winner_team_id === id}>
            <th scope="row" className={styles.team}>
              <span className={styles.dot} style={{ background: teamTone(id) }} />
              {t('team', { id })}
            </th>
            {games.map((g) => (
              <td key={g.number} className={styles.num} data-won={g.winner_team_id === id}>
                {g.score[id]}
              </td>
            ))}
            {games.length > 1 && <td className={styles.total}>{games.filter((g) => g.winner_team_id === id).length}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
