import styles from './SegmentedControl.module.css';

type SegmentedControlProps = {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
};

export function SegmentedControl({ label, options, value, onChange, orientation = 'horizontal' }: SegmentedControlProps) {
  return (
    <div className={styles.group} role="group" aria-label={label} data-orientation={orientation}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.option}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
