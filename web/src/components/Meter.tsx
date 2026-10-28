import styles from './Meter.module.css';

type MeterProps = {
  value: number;
  max: number;
  tone: string;
};

// Decorative bar; the number it shows is always printed next to it.
export function Meter({ value, max, tone }: MeterProps) {
  const width = max > 0 ? (value / max) * 100 : 0;
  return (
    <span className={styles.track} aria-hidden="true">
      <span className={styles.fill} style={{ width: `${width}%`, background: tone }} />
    </span>
  );
}
