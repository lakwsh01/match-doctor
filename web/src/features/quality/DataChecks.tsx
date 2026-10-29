import { Meter } from '../../components/Meter';
import { useT } from '../../components/useT';
import type { QualityCheck } from '../../lib/report/quality';
import { formatPct, reportName } from '../../lib/format';
import styles from './DataChecks.module.css';

type DataChecksProps = {
  checks: (QualityCheck & { games?: string[] })[];
};

export function DataChecks({ checks }: DataChecksProps) {
  const t = useT();
  const warnings = checks.filter((c) => c.status === 'warning').sort((a, b) => b.count / b.of - a.count / a.of);
  const passed = checks.filter((c) => c.status === 'ok');

  return (
    <div className={styles.checks}>
      <ul className={styles.list}>
        {warnings.map((c) => (
          <li key={c.id} className={styles.item}>
            <span className={styles.name}>{t(`check.${c.id}.title`)}</span>
            <span className={styles.share}>
              {t('checks.share', { count: t.number(c.count), of: t.number(c.of) })}
              <span className={styles.pct}>{formatPct(c.of ? c.count / c.of : null)}</span>
            </span>
            <span className={styles.meter}>
              <Meter value={c.count} max={c.of} tone="var(--ink)" />
            </span>
            <span className={styles.detail}>
              {t(`check.${c.id}.detail`, c.params)}
              {c.games?.length ? ` ${t('checks.seen_in', { games: t.list(c.games.map((id) => reportName(t, id))) })}` : ''}
            </span>
          </li>
        ))}
      </ul>
      {passed.length > 0 && (
        <p className={styles.passed}>
          {t('checks.passed', { checks: t.list(passed.map((c) => t(`check.${c.id}.title`).toLowerCase())) })}
        </p>
      )}
    </div>
  );
}
