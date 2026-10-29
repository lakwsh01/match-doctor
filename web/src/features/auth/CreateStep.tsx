import { useState } from 'react';
import { LinkButton } from '../../components/LinkButton';
import { TextField } from '../../components/TextField';
import { useT } from '../../components/useT';
import { messageFor } from '../../lib/auth/actions';
import type { AuthFailure } from '../../lib/auth/actions';
import { AuthStep } from './AuthStep';
import { useSubmit } from './useSubmit';

type CreateStepProps = {
  email: string;
  onCreate: (name: string, password: string) => Promise<AuthFailure | null>;
  onCancel: () => void;
};

// Shown after a verified code when the email has no account yet.
export function CreateStep({ email, onCreate, onCancel }: CreateStepProps) {
  const t = useT();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const { pending, error, run } = useSubmit(() => onCreate(name.trim(), password));

  return (
    <AuthStep
      title={t('auth.create.title')}
      lead={t('auth.create.lead', { email })}
      submitLabel={t('auth.create.submit')}
      pendingLabel={t('auth.create.pending')}
      pending={pending}
      error={error}
      onSubmit={() => void run()}
      footer={
        <p>
          {t('auth.create.footer')} <LinkButton label={t('auth.create.other_email')} onClick={onCancel} />
        </p>
      }
    >
      <TextField
        label={t('auth.create.name')}
        type="text"
        value={name}
        onChange={setName}
        autoComplete="name"
        autoFocus
        error={messageFor(t, error, 'name')}
      />
      <TextField
        label={t('auth.create.password')}
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        minLength={8}
        optional
        error={messageFor(t, error, 'password')}
      />
    </AuthStep>
  );
}
