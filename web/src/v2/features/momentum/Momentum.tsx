import { Block } from '../../components/Block';
import { Duel } from '../../components/Duel';
import { Worm } from '../../components/Worm';
import { useT } from '../../components/useT';
import { score, sides, teamTone } from '../../lib/format';
import type { ClipRef, Id, ReportV2 } from '../../lib/types';
import { RallyIndex } from './RallyIndex';
import { Streaks } from './Streaks';
import styles from './Momentum.module.css';

type MomentumProps = {
  report: ReportV2;
  own: Id;
  onWatch: (clip: ClipRef) => void;
};

// How the score moved (MO-06 to MO-09) and every rally of the report (MO-01 to MO-05).
export function Momentum({ report, own, onWatch }: MomentumProps) {
  const t = useT();
  const { momentum } = report;
  const [first, second] = report.teams.map((x) => x.team_id);
  const games = [...new Set(momentum.worm.map((p) => p.game))].map((game) => ({
    key: String(game),
    label: t('nav.game', { n: game }),
    from: momentum.worm.findIndex((p) => p.game === game),
    to: momentum.worm.findLastIndex((p) => p.game === game),
  }));
  const clutch = (pick: 'converted' | 'saved') => Object.fromEntries(report.teams.map((x) => [x.team_id, momentum.clutch[x.team_id][pick]]));

  return (
    <div className={styles.page}>
      <Block title={t('mo.flow')} level={2} note={t('mo.flow_note', { team: t('team', { id: first }) })}>
        <Worm
          label={t('mo.flow_label')}
          points={momentum.worm.map((p) => ({ key: `${p.game}-${p.rally_number}`, diff: p.diff }))}
          games={games}
          up={teamTone(first)}
          down={teamTone(second)}
        />
        <ul className={styles.turns} aria-label={t('mo.turns')}>
          {momentum.turns.map((turn) => (
            <li key={`${turn.game}-${turn.rally_number}`}>
              <button type="button" className={styles.turn} onClick={() => onWatch(turn)}>
                <span className={styles.dot} style={{ background: teamTone(turn.team_id) }} />
                {t(turn.kind === 'run' ? 'mo.turn_run' : 'mo.turn_drought', {
                  game: turn.game,
                  from: score(turn.from, [first, second]),
                  team: t('team', { id: turn.team_id }),
                  n: turn.length,
                })}
              </button>
            </li>
          ))}
        </ul>
      </Block>

      <div className={styles.columns}>
        <Streaks title={t('mo.runs')} streaks={momentum.runs} kind="run" order={[first, second]} report={report} onWatch={onWatch} />
        <Streaks title={t('mo.droughts')} streaks={momentum.droughts} kind="drought" order={[first, second]} report={report} onWatch={onWatch} />
        <Block title={t('mo.clutch')} level={3}>
          <div>
            <Duel label={t('mo.converted')} sides={sides(t, 'pct', clutch('converted'), own)} band={null} />
            <Duel label={t('mo.saved')} sides={sides(t, 'pct', clutch('saved'), own)} band={null} />
          </div>
        </Block>
      </div>

      <RallyIndex report={report} onWatch={onWatch} />
    </div>
  );
}
