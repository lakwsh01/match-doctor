import { Block } from '../../components/Block';
import { Stack } from '../../components/Stack';
import { useT } from '../../components/useT';
import { pct, rallyRef, teamTone } from '../../lib/format';
import type { ClipRef, Id, ReportV2 } from '../../lib/types';
import styles from './RallyShape.module.css';

type RallyShapeProps = {
  report: ReportV2;
  own: Id;
  onWatch: (clip: ClipRef) => void;
};

// Averages and records (ST-26, -27, -29, -30) and who won rallies of each length (ST-32).
export function RallyShape({ report, own, onWatch }: RallyShapeProps) {
  const t = useT();
  const { shape } = report;
  const match = report.kind === 'match';
  const order = report.teams.map((x) => x.team_id);
  const records: { key: string; label: string; value: string; clip: ClipRef | null }[] = [
    { key: 'avg', label: t('shape.avg'), value: t('unit.shots', { n: t.number(shape.avg_shots, 1) }), clip: null },
    { key: 'longest', label: t('shape.longest'), value: t('unit.shots', { n: shape.longest.shots }), clip: shape.longest },
    { key: 'dinks', label: t('shape.dinks'), value: t('unit.dinks', { n: shape.longest_dinks.dinks }), clip: shape.longest_dinks },
  ];

  return (
    <Block title={t('shape.title')} level={2}>
      <dl className={styles.records}>
        {records.map((r) => (
          <div key={r.key} className={styles.record}>
            <dt className={styles.label}>{r.label}</dt>
            <dd className={styles.value}>{r.value}</dd>
            {r.clip && (
              <dd className={styles.clip}>
                <button type="button" className={styles.watch} onClick={() => r.clip && onWatch(r.clip)}>
                  {t('watch')} <span className={styles.ref}>{rallyRef(t, r.clip, match)}</span>
                </button>
              </dd>
            )}
          </div>
        ))}
        <div className={styles.record}>
          <dt className={styles.label}>{t('shape.run')}</dt>
          {order.map((team) => (
            <dd key={team} className={styles.run} data-own={team === own}>
              <span className={styles.dot} style={{ background: teamTone(team) }} />
              {t('team', { id: team })}
              <span className={styles.runValue}>{t('unit.points', { n: shape.longest_run[team] })}</span>
            </dd>
          ))}
        </div>
      </dl>
      <div className={styles.lengths}>
        <h3 className={styles.subtitle}>{t('shape.lengths')}</h3>
        {shape.lengths.map((l) => (
          <Stack
            key={l.label}
            label={t('shape.length', { label: l.label })}
            caption={t('shape.rallies', { n: l.rallies })}
            parts={order.map((team) => ({
              key: team,
              label: t('team', { id: team }),
              share: l.won[team].value ?? 0,
              text: pct(t, l.won[team].value),
              tone: teamTone(team),
            }))}
          />
        ))}
      </div>
    </Block>
  );
}
