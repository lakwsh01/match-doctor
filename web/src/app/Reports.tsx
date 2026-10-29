import { Suspense, useState, useTransition } from 'react';
import { LinkButton } from '../components/LinkButton';
import { SegmentedControl } from '../components/SegmentedControl';
import { Select } from '../components/Select';
import { useT } from '../components/useT';
import { Wordmark } from '../components/Wordmark';
import { reportName } from '../lib/format';
import { LOCALE_OPTIONS } from '../lib/i18n/locales';
import type { Locale } from '../lib/i18n/locales';
import { reportIds } from '../lib/report/load';
import type { Id } from '../lib/report/types';
import { ReportView } from './ReportView';
import styles from './Reports.module.css';

type ReportsProps = {
  email: string;
  locale: Locale;
  onLocale: (locale: Locale) => void;
  onSignOut: () => void;
};

export function Reports({ email, locale, onLocale, onSignOut }: ReportsProps) {
  const t = useT();
  const [gameId, setGameId] = useState(reportIds[0]);
  const [rally, setRally] = useState<number | null>(null);
  const [player, setPlayer] = useState<Id | null>(null);
  const [loading, startTransition] = useTransition();

  const pickGame = (id: string) =>
    startTransition(() => {
      setGameId(id);
      setRally(null);
    });

  return (
    <div className={styles.page} aria-busy={loading}>
      <header className={styles.header}>
        <Wordmark name="Match Doctor" />
        {gameId && (
          <SegmentedControl
            label={t('report.label')}
            options={reportIds.map((id) => ({ value: id, label: reportName(t, id) }))}
            value={gameId}
            onChange={pickGame}
          />
        )}
        <div className={styles.account}>
          <Select label={t('language')} options={LOCALE_OPTIONS} value={locale} onChange={onLocale} />
          <span>{email}</span>
          <LinkButton label={t('account.sign_out')} onClick={onSignOut} />
        </div>
      </header>
      {gameId ? (
        <Suspense fallback={<p className={styles.status}>{t('report.loading')}</p>}>
          <div className={styles.body} data-loading={loading}>
            <ReportView reportId={gameId} rally={rally} player={player} onRally={setRally} onPlayer={setPlayer} />
          </div>
        </Suspense>
      ) : (
        <p className={styles.status}>{t('report.empty')}</p>
      )}
    </div>
  );
}
