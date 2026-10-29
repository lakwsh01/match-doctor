import { useId } from 'react';
import { Dot } from '../../components/Dot';
import { useT } from '../../components/useT';
import type { MessageKey } from '../../lib/i18n/messages/en-US';
import type { TeamReport } from '../../lib/report/analysis';
import { teamLabel, teamTone } from '../../lib/format';
import styles from './PointSummary.module.css';

type PointSummaryProps = {
  teams: Pick<TeamReport, 'team_id' | 'point_sources'>[];
};

const ROWS: { id: string; label: MessageKey }[] = [
  { id: 'ace', label: 'points.ace' },
  { id: 'attack', label: 'points.attack' },
  { id: 'winner', label: 'points.winner' },
  { id: 'opponent_error', label: 'points.opponent_error' },
];

const count = (team: PointSummaryProps['teams'][number], id: string) =>
  team.point_sources.find((row) => row.label === id)?.value ?? 0;

export function PointSummary({ teams }: PointSummaryProps) {
  const t = useT();
  const titleId = useId();
  const rows = teams.some((team) => count(team, 'unknown') > 0)
    ? [...ROWS, { id: 'unknown', label: 'points.unknown' as const }]
    : ROWS;

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        {t('points.title')}
      </h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <td />
            {teams.map((team) => (
              <th key={team.team_id} className={styles.team} scope="col">
                <span className={styles.teamLabel}>
                  <Dot tone={teamTone(team.team_id)} />
                  {teamLabel(t, team.team_id)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th className={styles.way} scope="row">
                {t(row.label)}
              </th>
              {teams.map((team) => {
                const n = count(team, row.id);
                return (
                  <td key={team.team_id} className={styles.count} data-zero={n === 0}>
                    {t.number(n)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
