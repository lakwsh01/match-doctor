import { useEffect, useState } from 'react';
import { CodeField } from '../../components/CodeField';
import { LinkButton } from '../../components/LinkButton';
import { useT } from '../../components/useT';
import { messageFor } from '../../lib/auth/actions';
import type { AuthFailure } from '../../lib/auth/actions';
import { AuthStep } from './AuthStep';
import { useSubmit } from './useSubmit';

const LENGTH = 6;
// Hosted Supabase refuses a new email code within 60 seconds of the last one.
const RESEND_AFTER_SEC = 60;

type CodeStepProps = {
  email: string;
  onVerify: (code: string) => Promise<AuthFailure | null>;
  onResend: () => Promise<AuthFailure | null>;
  onChangeEmail: () => void;
};

export function CodeStep({ email, onVerify, onResend, onChangeEmail }: CodeStepProps) {
  const t = useT();
  const [code, setCode] = useState('');
  const [sentAt, setSentAt] = useState(() => Date.now());
  const [now, setNow] = useState(sentAt);
  const [resent, setResent] = useState(false);
  const verify = useSubmit(onVerify);
  const resend = useSubmit(onResend, () => {
    const at = Date.now();
    setSentAt(at);
    setNow(at);
    setResent(true);
  });
  const error = verify.error ?? resend.error;
  const wait = Math.max(0, RESEND_AFTER_SEC - Math.floor((now - sentAt) / 1000));

  useEffect(() => {
    if (wait === 0) return;
    const timer = window.setTimeout(() => setNow(Date.now()), 1000);
    return () => window.clearTimeout(timer);
  }, [wait, now]);

  // The code checks itself once the last digit is in, so most people never press the button.
  const change = (next: string) => {
    setCode(next);
    if (next.length === LENGTH && !verify.pending) void verify.run(next);
  };

  return (
    <AuthStep
      title={t('auth.code.title')}
      lead={
        <>
          {t('auth.code.lead', { length: LENGTH })} <strong>{email}</strong>{' '}
          <LinkButton label={t('auth.code.change')} onClick={onChangeEmail} />
        </>
      }
      submitLabel={t('auth.code.submit')}
      pendingLabel={t('auth.code.pending')}
      pending={verify.pending}
      error={error}
      notice={resent ? t('auth.code.resent', { email }) : undefined}
      onSubmit={() => void verify.run(code)}
      footer={
        wait > 0 ? (
          <p>{t('auth.code.wait', { wait })}</p>
        ) : (
          <p>
            {t('auth.code.no_email')}{' '}
            <LinkButton label={resend.pending ? t('auth.code.resending') : t('auth.code.resend')} onClick={() => void resend.run()} />
          </p>
        )
      }
    >
      <CodeField label={t('auth.code.field')} length={LENGTH} value={code} onChange={change} busy={verify.pending} error={messageFor(t, error, 'code')} />
    </AuthStep>
  );
}
