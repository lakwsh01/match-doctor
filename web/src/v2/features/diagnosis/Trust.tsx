import { Block } from '../../components/Block';
import { useT } from '../../components/useT';
import { pct } from '../../lib/format';
import type { ReportV2 } from '../../lib/types';
import styles from './Trust.module.css';

type TrustProps = {
  report: ReportV2;
};

const SOURCES = ['measured', 'derived', 'demo', 'not_applicable'] as const;

// How far to trust the report (MI-07), and where each field of the dictionary comes from.
// The counts stay in view; the field ids are there for whoever wants to check one.
export function Trust({ report }: TrustProps) {
  const t = useT();
  const { info, coverage } = report;
  const groups = SOURCES.map((source) => ({ source, fields: coverage.filter((c) => c.source === source) }));
  return (
    <div className={styles.trust}>
      <Block title={t('dx.trust')} level={3}>
        <ul className={styles.facts}>
          <li>{t('dx.tracked', { pct: pct(t, info.tracked.value) })}</li>
          <li>{t('dx.checks', { n: info.checks.warnings, of: info.checks.of })}</li>
          <li>{t('dx.estimates', { fields: t.list(info.estimates) })}</li>
        </ul>
      </Block>
      <Block title={t('dx.coverage')} level={3} note={t('dx.coverage_note', { n: coverage.length })}>
        <dl className={styles.counts}>
          {groups.map(({ source, fields }) => (
            <div key={source} className={styles.count} data-source={source}>
              <dt>{t(`coverage.${source}`)}</dt>
              <dd className={styles.n}>{fields.length}</dd>
            </div>
          ))}
        </dl>
        <details className={styles.more}>
          <summary className={styles.toggle}>{t('dx.coverage_ids')}</summary>
          <dl className={styles.groups}>
            {groups.map(({ source, fields }) => (
              <div key={source} className={styles.group} data-source={source}>
                <dt className={styles.name}>{t(`coverage.${source}`)}</dt>
                <dd className={styles.ids}>
                  {fields.map((f) => (
                    <abbr key={f.field} className={styles.id} data-priority={f.priority} title={t(`priority.${f.priority}`)}>
                      {f.field}
                    </abbr>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      </Block>
    </div>
  );
}
