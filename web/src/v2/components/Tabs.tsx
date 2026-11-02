import type { KeyboardEvent } from 'react';
import styles from './Tabs.module.css';

type TabsProps<T extends string> = {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  panel: string;
  // keyboard: the move came from an arrow key, Home, or End, so the caller can replace history instead of adding to it.
  onChange: (value: T, keyboard: boolean) => void;
};

// A row of tabs. Arrow keys, Home, and End move between them, as the WAI-ARIA tabs pattern asks.
export function Tabs<T extends string>({ label, options, value, panel, onChange }: TabsProps<T>) {
  const move = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = options.findIndex((o) => o.value === value);
    const next =
      e.key === 'ArrowRight' ? (i + 1) % options.length
      : e.key === 'ArrowLeft' ? (i - 1 + options.length) % options.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? options.length - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(options[next].value, true);
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <div className={styles.tabs} role="tablist" aria-label={label} onKeyDown={move}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          className={styles.tab}
          aria-selected={o.value === value}
          aria-controls={panel}
          tabIndex={o.value === value ? 0 : -1}
          onClick={() => onChange(o.value, false)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
