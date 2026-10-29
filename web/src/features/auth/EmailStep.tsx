import { LinkButton } from '../../components/LinkButton';
import { TextField } from '../../components/TextField';
import { useT } from '../../components/useT';
import { messageFor } from '../../lib/auth/actions';
import type { AuthFailure } from '../../lib/auth/actions';
import { AuthStep } from './AuthStep';
import { useSubmit } from './useSubmit';

type EmailStepProps = {
  email: string;
  onEmail: (email: string) => void;
  onSend: () => Promise<AuthFailure | null>;
  onSent: () => void;
  onUsePassword: () => void;
};

export function EmailStep({ email, onEmail, onSend, onSent, onUsePassword }: EmailStepProps) {
  const t = useT();
  const { pending, error, run } = useSubmit(onSend, onSent);

  return (
    <AuthStep
      title={t('auth.email.title')}
      lead={t('auth.email.lead')}
      submitLabel={t('auth.email.submit')}
      pendingLabel={t('auth.email.pending')}
      pending={pending}
      error={error}
      onSubmit={() => void run()}
      footer={
        <p>
          {t('auth.email.footer')} <LinkButton label={t('auth.email.use_password')} onClick={onUsePassword} />
        </p>
      }
    >
      <TextField
        label={t('auth.field.email')}
        type="email"
        value={email}
        onChange={onEmail}
        autoComplete="email"
        error={messageFor(t, error, 'email')}
      />
    </AuthStep>
  );
}
