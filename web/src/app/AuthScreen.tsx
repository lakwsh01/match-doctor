import { useState } from 'react';
import { AuthPanel } from '../features/auth/AuthPanel';
import { CodeStep } from '../features/auth/CodeStep';
import { CreateStep } from '../features/auth/CreateStep';
import { EmailStep } from '../features/auth/EmailStep';
import { PasswordStep } from '../features/auth/PasswordStep';
import { Select } from '../components/Select';
import { useT } from '../components/useT';
import { Wordmark } from '../components/Wordmark';
import { createAccount, sendCode, signIn, signOut, verifyCode } from '../lib/auth/actions';
import { LOCALE_OPTIONS } from '../lib/i18n/locales';
import type { Locale } from '../lib/i18n/locales';
import { useMediaQuery } from './useMediaQuery';
import styles from './AuthScreen.module.css';

// Served from web/public/auth-athlete.mp4.
const video = '/auth-athlete.mp4';

type Step = 'email' | 'code' | 'password';

type AuthScreenProps = {
  // Set once a code is verified for an email that has no account yet.
  newAccountEmail: string | null;
  locale: Locale;
  onLocale: (locale: Locale) => void;
};

export function AuthScreen({ newAccountEmail, locale, onLocale }: AuthScreenProps) {
  const t = useT();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  // The panel mounts only beside the form, so phones never download the clip.
  const wide = useMediaQuery('(min-width: 900px)');
  const still = useMediaQuery('(prefers-reduced-motion: reduce)');

  const leave = () => {
    setStep('email');
    void signOut();
  };

  const form =
    newAccountEmail !== null ? (
      <CreateStep email={newAccountEmail} onCreate={createAccount} onCancel={leave} />
    ) : step === 'code' ? (
      <CodeStep
        email={email}
        onVerify={(code) => verifyCode(email, code)}
        onResend={() => sendCode(email)}
        onChangeEmail={() => setStep('email')}
      />
    ) : step === 'password' ? (
      <PasswordStep
        email={email}
        onEmail={setEmail}
        onSignIn={(password) => signIn(email, password)}
        onUseCode={() => setStep('email')}
      />
    ) : (
      <EmailStep
        email={email}
        onEmail={setEmail}
        onSend={() => sendCode(email)}
        onSent={() => setStep('code')}
        onUsePassword={() => setStep('password')}
      />
    );

  return (
    <main className={styles.screen}>
      <div className={styles.side}>
        <header className={styles.top}>
          <Wordmark name="Match Doctor" />
          <Select label={t('language')} options={LOCALE_OPTIONS} value={locale} onChange={onLocale} />
        </header>
        {form}
      </div>
      {wide && <AuthPanel video={still ? undefined : video} poster="/auth-athlete.jpg" />}
    </main>
  );
}
