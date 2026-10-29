import { useId } from 'react';
import styles from './CodeField.module.css';

type CodeFieldProps = {
  label: string;
  length: number;
  value: string;
  onChange: (value: string) => void;
  busy: boolean;
  error?: string;
};

// One real input holds the code, so paste, one-time-code autofill and screen readers see a single field.
// The cells only draw it. The field takes focus on mount, since it is the only thing to do on its screen.
export function CodeField({ label, length, value, onChange, busy, error }: CodeFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const next = Math.min(value.length, length - 1);

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.cells} data-invalid={error ? true : undefined} data-busy={busy || undefined}>
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={styles.cell}
            data-next={i === next || undefined}
            data-split={i === length / 2 - 1 || undefined}
            aria-hidden="true"
          >
            {value[i] ?? ''}
          </span>
        ))}
        <input
          id={id}
          className={styles.input}
          value={value}
          required
          readOnly={busy}
          pattern={`\\d{${length}}`}
          inputMode="numeric"
          autoComplete="one-time-code"
          spellCheck={false}
          autoFocus
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, length))}
        />
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
