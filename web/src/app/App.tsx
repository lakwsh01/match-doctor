import { useMemo } from 'react';
import { I18nContext } from '../components/useT';
import { signOut } from '../lib/auth/actions';
import { createTranslator } from '../lib/i18n/translate';
import { AuthScreen } from './AuthScreen';
import { Reports } from './Reports';
import { useLocale } from './useLocale';
import { useSession } from './useSession';

export function App() {
  const session = useSession();
  const [locale, setLocale] = useLocale();
  const translator = useMemo(() => createTranslator(locale), [locale]);

  // Render nothing until the stored session is restored, so a signed-in person never sees the form flash.
  // A verified email without a name has not finished creating its account.
  const screen =
    session === undefined ? null : session === null || session.name === null ? (
      <AuthScreen newAccountEmail={session?.email ?? null} locale={locale} onLocale={setLocale} />
    ) : (
      <Reports email={session.email} locale={locale} onLocale={setLocale} onSignOut={signOut} />
    );

  return <I18nContext value={translator}>{screen}</I18nContext>;
}
