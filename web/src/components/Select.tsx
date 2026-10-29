import * as Popover from '@radix-ui/react-popover';
import { useState } from 'react';
import styles from './Select.module.css';

type SelectProps<T extends string> = {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

// A button that opens a list of choices, after the shadcnblocks "Popover with list" block.
// The popover handles placement, focus, Escape, and outside clicks; picking a choice closes it.
export function Select<T extends string>({ label, options, value, onChange }: SelectProps<T>) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className={styles.trigger}>
        <span className={styles.hidden}>{label}</span>
        {options.find((option) => option.value === value)?.label}
        <svg className={styles.chevron} viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className={styles.content} align="end" sideOffset={4}>
          <div role="group" aria-label={label} className={styles.list}>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={styles.option}
                aria-pressed={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <svg className={styles.check} viewBox="0 0 12 12" aria-hidden="true">
                  <path d="m2.5 6.5 2.5 2.5 4.5-5.5" />
                </svg>
                {option.label}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
