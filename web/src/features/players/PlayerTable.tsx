import { Dot } from '../../components/Dot';
import { Meter } from '../../components/Meter';
import { useT } from '../../components/useT';
import type { PlayerReport } from '../../lib/report/player';
import type { Id } from '../../lib/report/types';
import { formatFixed, formatRate, playerLabel, teamLabel, teamTone } from '../../lib/format';
import styles from './PlayerTable.module.css';

type PlayerTableProps = {
  players: PlayerReport[];
  selected: Id | null;
  onSelect: (player: Id | null) => void;
};

const oneDecimal = formatFixed(1);
const twoDecimals = formatFixed(2);

export function PlayerTable({ players, selected, onSelect }: PlayerTableProps) {
  const t = useT();
  const mostErrors = Math.max(...players.map((p) => p.errors.total));

  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{t('players.col_player')}</th>
            <th scope="col">{t('players.col_contacts')}</th>
            <th scope="col">{t('players.col_points')}</th>
            <th scope="col">{t('players.col_errors')}</th>
            <th scope="col">{t('players.col_serves_in')}</th>
            <th scope="col">{t('players.col_above_net')}</th>
            <th scope="col">{t('players.col_kitchen_time')}</th>
            <th scope="col">{t('players.col_to_kitchen')}</th>
            <th scope="col">{t('players.col_reaction')}</th>
            <th scope="col">{t('players.col_ball_speed')}</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.player_id} data-selected={p.player_id === selected}>
              <th scope="row">
                <button
                  type="button"
                  className={styles.pick}
                  aria-pressed={p.player_id === selected}
                  onClick={() => onSelect(p.player_id === selected ? null : p.player_id)}
                >
                  <Dot tone={teamTone(p.team_id)} />
                  {playerLabel(p.player_id)}
                  <span className={styles.team}>{teamLabel(t, p.team_id)}</span>
                </button>
              </th>
              <td>{p.shots.total}</td>
              <td>{p.points_won}</td>
              <td>
                {p.errors.total} <span className={styles.aside}>{t('players.unforced', { n: p.errors.unforced })}</span>
                <span className={styles.meter}>
                  <Meter value={p.errors.total} max={mostErrors} tone="var(--ink)" />
                </span>
              </td>
              <td>{formatRate(p.serve.in)}</td>
              <td>{formatRate(p.contact.above_net)}</td>
              <td>
                {formatRate(p.positioning.kitchen_time)}
                <span className={styles.meter}>
                  <Meter value={p.positioning.kitchen_time.pct ?? 0} max={1} tone={teamTone(p.team_id)} />
                </span>
              </td>
              <td>{oneDecimal(p.positioning.kitchen_arrival_sec.avg)}</td>
              <td>{twoDecimals(p.reaction_sec.all.avg)}</td>
              <td>{oneDecimal(p.ball_speed_mps.all.avg)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
