import { SegmentedControl } from '../../../components/SegmentedControl';
import { useT } from '../../components/useT';
import { score } from '../../lib/format';
import type { Id, ReportV2 } from '../../lib/types';
import { BoxScore } from './BoxScore';
import { Details } from './Details';
import styles from './Masthead.module.css';

type MastheadProps = {
  report: ReportV2;
  own: Id;
  // Outside the diagnosis tab: the result and the team picker on one line, without the verdict and the facts.
  compact: boolean;
  onOwn: (team: Id) => void;
};

// The diagnosis in one or two sentences, the score by game, and the facts of the match.
export function Masthead({ report, own, compact, onOwn }: MastheadProps) {
  const t = useT();
  const { info } = report;
  // Team 1 always comes first in tables and tracks; the sentence reads from the reader's side.
  const order = report.teams.map((x) => x.team_id);
  const reading = [own, ...order.filter((id) => id !== own)];
  const won = report.summary[own].verdict;
  const result = report.kind === 'match'
    ? score(Object.fromEntries(order.map((id) => [id, info.games.filter((g) => g.winner_team_id === id).length])), reading)
    : score(info.games[0].score, reading);
  const team = t('team', { id: own });
  const picker = (
    <div className={styles.view}>
      <span className={styles.viewLabel}>{t('view_as')}</span>
      <SegmentedControl
        label={t('view_as')}
        options={order.map((id) => ({ value: id, label: t('team', { id }) }))}
        value={own}
        onChange={onOwn}
      />
    </div>
  );

  if (compact)
    return (
      <header className={styles.strip}>
        <p className={styles.stripResult}>{t(won.won ? 'verdict.won' : 'verdict.lost', { team, score: result })}</p>
        {picker}
      </header>
    );

  return (
    <header className={styles.mast}>
      <div className={styles.lead}>
        <p className={styles.event}>
          {report.title}
          <span className={styles.part}>
            {report.kind === 'match'
              ? t('mast.match', { best: info.format.best_of })
              : t('mast.game', { n: report.number ?? 1, best: info.format.best_of })}
          </span>
        </p>
        <h1 className={styles.verdict}>
          <span className={styles.result}>{t(won.won ? 'verdict.won' : 'verdict.lost', { team, score: result })}</span>{' '}
          {won.strength && t('verdict.strength', { metric: t(`metric.${won.strength}` as const) })}{' '}
          {won.leak && t('verdict.leak', { metric: t(`metric.${won.leak}` as const) })}
        </h1>
        {picker}
      </div>
      <div className={styles.side}>
        <BoxScore report={report} order={order} />
        <Details report={report} />
      </div>
    </header>
  );
}
