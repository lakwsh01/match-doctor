import { Block } from '../../components/Block';
import { Duel } from '../../components/Duel';
import { Flag } from '../../components/Flag';
import { useT } from '../../components/useT';
import { figure, player, sides } from '../../lib/format';
import type { ClipRef, Id, MetricKey, ReportV2 } from '../../lib/types';
import { Takeaways } from './Takeaways';
import { Trust } from './Trust';
import { WatchList } from './WatchList';
import styles from './Diagnosis.module.css';

type DiagnosisProps = {
  report: ReportV2;
  own: Id;
  onWatch: (clip: ClipRef) => void;
  onPlan: () => void;
};

const VITALS: MetricKey[] = ['side_out', 'serve_points_won', 'return_in', 'dink_in_kitchen', 'speedup_won', 'unforced'];

export function Diagnosis({ report, own, onWatch, onPlan }: DiagnosisProps) {
  const t = useT();
  const s = report.summary[own];
  const metrics = report.phases.flatMap((p) => p.metrics);
  const demo = <Flag label={t('source.demo')} hint={t('source.demo_hint')} />;
  const deciding = s.deciding;
  const decidingMetric = deciding && metrics.find((m) => m.key === deciding.key);
  const focusUnit = metrics.find((m) => m.key === s.focus?.key)?.unit ?? 'pct';

  return (
    <div className={styles.page}>
      {deciding && decidingMetric && (
        <Block title={t('dx.deciding')} level={2} note={t('dx.deciding_note')}>
          <div className={styles.deciding}>
            <Duel
              size="large"
              label={t(`metric.${deciding.key}` as const)}
              note={t(deciding.impact > 0 ? 'dx.gain' : 'dx.loss', { n: t.number(Math.abs(deciding.impact)) })}
              sides={sides(t, deciding.unit, decidingMetric.teams, own)}
              band={decidingMetric.target}
              flag={deciding.source === 'demo' ? demo : undefined}
            />
          </div>
        </Block>
      )}

      <div className={styles.split}>
        <Takeaways title={t('dx.strengths')} items={s.strengths.slice(0, 3)} report={report} own={own} tone="gain" onWatch={onWatch} />
        <Takeaways title={t('dx.leaks')} items={s.leaks.slice(0, 3)} report={report} own={own} tone="loss" onWatch={onWatch} />
      </div>

      <div className={styles.next}>
        {s.focus && (
          <Block title={t('dx.focus')} level={2}>
            <p className={styles.focus}>
              {t(s.focus.target < s.focus.now ? 'dx.focus_down' : 'dx.focus_up', {
                player: player(s.focus.player_id),
                metric: t(`metric.${s.focus.key}` as const),
                now: figure(t, focusUnit, s.focus.now),
                target: figure(t, focusUnit, s.focus.target),
              })}
            </p>
            <button type="button" className={styles.action} onClick={onPlan}>
              {t('dx.focus_open')}
            </button>
          </Block>
        )}
        <WatchList report={report} items={s.must_watch} onWatch={onWatch} />
      </div>

      <Block title={t('dx.vitals')} level={2} note={t('dx.vitals_note')} aside={<span className={styles.legend}>{t('legend.target')}</span>}>
        <div>
          {VITALS.flatMap((key) => metrics.filter((m) => m.key === key)).map((m) => (
            <Duel
              key={m.key}
              label={t(`metric.${m.key}` as const)}
              note={t(`hint.${m.key}` as const)}
              sides={sides(t, m.unit, m.teams, own)}
              band={m.target}
              flag={m.source === 'demo' ? demo : undefined}
            />
          ))}
        </div>
      </Block>

      <Trust report={report} />
    </div>
  );
}
