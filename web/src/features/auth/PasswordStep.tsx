import { useState } from 'react';
import { LinkButton } from '../../components/LinkButton';
import { TextField } from '../../components/TextField';
import { useT } from '../../components/useT';
import { messageFor } from '../../lib/auth/actions';
import type { AuthFailure } from '../../lib/auth/actions';
import { AuthStep } from './AuthStep';
import { useSubmit } from './useSubmit';

type PasswordStepProps = {
  email: string;
  onEmail: (email: string) => void;
  onSignIn: (password: string) => Promise<AuthFailure | null>;
  onUseCode: () => void;
};

export function PasswordStep({ email, onEmail, onSignIn, onUseCode }: PasswordStepProps) {
  const t = useT();
  const [password, setPassword] = useState('');
  const { pending, error, run } = useSubmit(() => onSignIn(password));

  return (
    <AuthStep
      title={t('auth.password.title')}
      lead={t('auth.password.lead')}
      submitLabel={t('auth.password.submit')}
      pendingLabel={t('auth.password.pending')}
      pending={pending}
      error={error}
      onSubmit={() => void run()}
      footer={
        <p>
          {t('auth.password.footer')} <LinkButton label={t('auth.password.use_code')} onClick={onUseCode} />
        </p>
      }
    >
      <TextField
        label={t('auth.field.email')}
        type="email"
        value={email}
        onChange={onEmail}
        autoComplete="username"
        error={messageFor(t, error, 'email')}
      />
      <TextField
        label={t('auth.password.field')}
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        error={messageFor(t, error, 'password')}
      />
    </AuthStep>
  );
}
