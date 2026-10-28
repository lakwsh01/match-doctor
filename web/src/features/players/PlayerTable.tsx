import { Dot } from '../../components/Dot';
import { Meter } from '../../components/Meter';
import { playerSummaries } from '../../lib/report/derive';
import type { Id, Report } from '../../lib/report/types';
import { formatFixed, playerLabel, teamLabel, teamTone } from '../../lib/format';
import styles from './PlayerTable.module.css';

type PlayerTableProps = {
  report: Report;
  selected: Id | null;
  onSelect: (player: Id | null) => void;
};

const oneDecimal = formatFixed(1);
const twoDecimals = formatFixed(2);

export function PlayerTable({ report, selected, onSelect }: PlayerTableProps) {
  const rows = playerSummaries(report);
  const mostErrors = Math.max(...rows.map((r) => r.errors));

  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Player</th>
            <th scope="col">Shots</th>
            <th scope="col">Attacks won</th>
            <th scope="col">Errors</th>
            <th scope="col">Ball speed, m/s</th>
            <th scope="col">Fastest, m/s</th>
            <th scope="col">Reaction, s</th>
            <th scope="col">Move speed, m/s</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} data-selected={r.id === selected}>
              <th scope="row">
                <button
                  type="button"
                  className={styles.pick}
                  aria-pressed={r.id === selected}
                  onClick={() => onSelect(r.id === selected ? null : r.id)}
                >
                  <Dot tone={teamTone(r.teamId)} />
                  {playerLabel(r.id)}
                  <span className={styles.team}>{teamLabel(r.teamId)}</span>
                </button>
              </th>
              <td>{r.shots}</td>
              <td>
                {r.attacksWon} of {r.attacks}
                <span className={styles.meter}>
                  <Meter value={r.attacksWon} max={r.attacks} tone={teamTone(r.teamId)} />
                </span>
              </td>
              <td>
                {r.errors} <span className={styles.aside}>({r.unforced} unforced)</span>
                <span className={styles.meter}>
                  <Meter value={r.errors} max={mostErrors} tone="var(--ink)" />
                </span>
              </td>
              <td>{oneDecimal(r.ballSpeed)}</td>
              <td>{oneDecimal(r.topSpeed)}</td>
              <td>{twoDecimals(r.reaction)}</td>
              <td>{twoDecimals(r.moveSpeed)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
