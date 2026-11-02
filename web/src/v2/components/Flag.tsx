import styles from './Flag.module.css';

type FlagProps = {
  label: string;
  hint: string;
};

// Marks a figure that is a seeded demo value, not a measurement.
export function Flag({ label, hint }: FlagProps) {
  return (
    <span className={styles.flag} title={hint}>
      {label}
      <span className={styles.hidden}>{hint}</span>
    </span>
  );
}
