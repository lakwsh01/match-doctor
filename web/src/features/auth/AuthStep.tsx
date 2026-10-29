import type { ReactNode } from 'react';
import { useT } from '../../components/useT';
import type { AuthFailure } from '../../lib/auth/actions';
import styles from './AuthStep.module.css';

type AuthStepProps = {
  title: string;
  lead: ReactNode;
  submitLabel: string;
  pendingLabel: string;
  pending: boolean;
  error: AuthFailure | null;
  notice?: string;
  onSubmit: () => void;
  children: ReactNode;
  footer: ReactNode;
};

// The frame every sign-in step shares. Field errors show under their field; the rest show above the button.
export function AuthStep({ title, lead, submitLabel, pendingLabel, pending, error, notice, onSubmit, children, footer }: AuthStepProps) {
  const t = useT();
  return (
    <div className={styles.column}>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        aria-busy={pending}
      >
        <div className={styles.heading}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.lead}>{lead}</p>
        </div>
        {children}
        {error?.field === null && (
          <p className={styles.formError} role="alert">
            {t(error.key)}
          </p>
        )}
        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}
        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </button>
      </form>
      <div className={styles.footer}>{footer}</div>
    </div>
  );
}
