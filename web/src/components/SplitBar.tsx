import styles from './SplitBar.module.css';

type Side = { value: number; text: string; note?: string; tone: string };

type SplitBarProps = {
  label: string;
  max: number;
  left: Side;
  right: Side;
};

// One measure for two sides, bars growing out from the label in the middle.
export function SplitBar({ label, max, left, right }: SplitBarProps) {
  const width = (side: Side) => `${max > 0 ? (side.value / max) * 100 : 0}%`;
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      {[left, right].map((side, i) => (
        <span key={i} className={i ? styles.right : styles.left}>
          <span className={styles.figure}>
            {side.text}
            {side.note && <span className={styles.note}>{side.note}</span>}
          </span>
          <span className={styles.track} aria-hidden="true">
            <span className={styles.fill} style={{ width: width(side), background: side.tone }} />
          </span>
        </span>
      ))}
    </div>
  );
}
