import { Meter } from './Meter';
import styles from './BarList.module.css';

type BarListProps = {
  title: string;
  items: { label: string; value: number; text?: string }[];
  tone: string;
  empty: string;
  // Full-bar value. Defaults to the largest item, so counts compare with each other.
  max?: number;
};

export function BarList({ title, items, tone, empty, max = Math.max(0, ...items.map((item) => item.value)) }: BarListProps) {
  return (
    <section className={styles.list}>
      <h3 className={styles.title}>{title}</h3>
      {items.length === 0 ? (
        <p className={styles.empty}>{empty}</p>
      ) : (
        <ul className={styles.items}>
          {items.map((item) => (
            <li key={item.label} className={styles.item}>
              <span>{item.label}</span>
              <span className={styles.value}>{item.text ?? item.value}</span>
              <span className={styles.meter}>
                <Meter value={item.value} max={max} tone={tone} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
