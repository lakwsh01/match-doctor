import { BarList } from '../../components/BarList';
import { playerTallies, teamOf } from '../../lib/report/derive';
import type { Id, Report } from '../../lib/report/types';
import { humanize, playerLabel, teamTone } from '../../lib/format';
import styles from './PlayerDetail.module.css';

type PlayerDetailProps = {
  report: Report;
  player: Id | null;
};

export function PlayerDetail({ report, player }: PlayerDetailProps) {
  if (player === null) {
    return <p className={styles.prompt}>Select a player to see their shot types, errors, and attacks, and to show only their bounces on the court.</p>;
  }

  const tallies = playerTallies(report, player);
  const tone = teamTone(teamOf(report, player));
  const named = (list: typeof tallies.shots) => list.map((t) => ({ ...t, label: humanize(t.label) }));

  return (
    <div className={styles.grid}>
      <BarList title={`${playerLabel(player)} shot types`} items={named(tallies.shots)} tone={tone} empty="No shots logged." />
      <BarList title="Errors" items={named(tallies.errors)} tone="var(--ink)" empty="No errors logged." />
      <BarList title="Attacks" items={named(tallies.attacks)} tone={tone} empty="No attacks logged." />
    </div>
  );
}
