import { Block } from '../../components/Block';
import { Duel } from '../../components/Duel';
import { Flag } from '../../components/Flag';
import { useT } from '../../components/useT';
import { rallyRef, sides } from '../../lib/format';
import type { ClipRef, Id, ReportV2, Takeaway } from '../../lib/types';
import styles from './Takeaways.module.css';

type TakeawaysProps = {
  title: string;
  items: Takeaway[];
  report: ReportV2;
  own: Id;
  tone: 'gain' | 'loss';
  onWatch: (clip: ClipRef) => void;
};

// The top strengths or leaks (MI-09, MI-10): the figure for both teams, what it was worth, and a rally that shows it.
export function Takeaways({ title, items, report, own, tone, onWatch }: TakeawaysProps) {
  const t = useT();
  const them = report.teams.find((x) => x.team_id !== own)?.team_id ?? own;
  const match = report.kind === 'match';
  return (
    <Block title={title} level={2}>
      {items.length ? (
        <ol className={styles.list}>
          {items.map((item) => (
            <li key={item.key} className={styles.item}>
              <Duel
                label={t(`metric.${item.key}` as const)}
                note={t(tone === 'gain' ? 'dx.gain' : 'dx.loss', { n: t.number(Math.abs(item.impact)) })}
                sides={sides(t, item.unit, { [own]: item.us, [them]: item.them }, own)}
                band={report.phases.flatMap((p) => p.metrics).find((m) => m.key === item.key)?.target ?? null}
                flag={item.source === 'demo' ? <Flag label={t('source.demo')} hint={t('source.demo_hint')} /> : undefined}
              />
              {item.rally && (
                <button type="button" className={styles.watch} onClick={() => item.rally && onWatch(item.rally)}>
                  {t('watch')} <span className={styles.ref}>{rallyRef(t, item.rally, match)}</span>
                </button>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.none}>{t('dx.none')}</p>
      )}
    </Block>
  );
}
