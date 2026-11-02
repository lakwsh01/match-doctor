import styles from './Stack.module.css';

type StackPart = { key: string; label: string; share: number; text: string; tone: string };

type StackProps = {
  label: string;
  caption?: string;
  parts: StackPart[];
};

// Shares of one whole as a single bar, with each part named below it.
export function Stack({ label, caption, parts }: StackProps) {
  return (
    <figure className={styles.stack}>
      <figcaption className={styles.caption}>
        <span className={styles.label}>{label}</span>
        {caption && <span className={styles.note}>{caption}</span>}
      </figcaption>
      <div className={styles.bar} aria-hidden="true">
        {parts.map((p) => p.share > 0 && <span key={p.key} className={styles.part} style={{ flexGrow: p.share, background: p.tone }} />)}
      </div>
      <ul className={styles.legend}>
        {parts.map((p) => (
          <li key={p.key} className={styles.item}>
            <span className={styles.swatch} style={{ background: p.tone }} />
            {p.label}
            <span className={styles.value}>{p.text}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
