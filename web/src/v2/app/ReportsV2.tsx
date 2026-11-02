import { Suspense, useMemo, useState, useTransition } from 'react';
import { LinkButton } from '../../components/LinkButton';
import { Select } from '../../components/Select';
import { Wordmark } from '../../components/Wordmark';
import { LOCALE_OPTIONS } from '../../lib/i18n/locales';
import type { Locale } from '../../lib/i18n/locales';
import { I18nContext } from '../components/useT';
import { createTranslator } from '../lib/i18n/translate';
import { reportIds } from '../lib/load';
import type { Id } from '../lib/types';
import { ReportPage } from './ReportPage';
import { useRoute } from './useRoute';
import '../styles/tokens.css';
import styles from './ReportsV2.module.css';

type ReportsV2Props = {
  email: string;
  locale: Locale;
  onLocale: (locale: Locale) => void;
  onSignOut: () => void;
};

// The v2 trial at /v2/*: its own header, words, and route, behind the same sign-in as the main report.
export function ReportsV2({ email, locale, onLocale, onSignOut }: ReportsV2Props) {
  const t = useMemo(() => createTranslator(locale), [locale]);
  const [route, go] = useRoute();
  const [own, setOwn] = useState<Id | null>(null);
  const [loading, startTransition] = useTransition();
  const report = route.report && reportIds.includes(route.report) ? route.report : reportIds[0];

  return (
    <I18nContext value={t}>
      <div className={styles.page} aria-busy={loading}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <Wordmark name="Match Doctor" />
            <span className={styles.preview}>{t('nav.preview')}</span>
          </div>
          <div className={styles.account}>
            <a className={styles.back} href="/">
              {t('nav.back')}
            </a>
            <Select label={t('language')} options={LOCALE_OPTIONS} value={locale} onChange={onLocale} />
            <span>{email}</span>
            <LinkButton label={t('sign_out')} onClick={onSignOut} />
          </div>
        </header>
        <main className={styles.body} data-loading={loading}>
          {report ? (
            <Suspense fallback={<p className={styles.status}>{t('loading')}</p>}>
              <ReportPage
                id={report}
                route={route}
                own={own}
                onOwn={setOwn}
                onRoute={go}
                onReport={(id) => startTransition(() => go({ ...route, report: id, subject: null }))}
              />
            </Suspense>
          ) : (
            <p className={styles.status}>{t('empty')}</p>
          )}
        </main>
      </div>
    </I18nContext>
  );
}
