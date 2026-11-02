import styles from './ZoneGrid.module.css';

type ZoneGridProps = {
  label: string;
  // Nine shares, net row first, left to right as the player faces the net.
  cells: number[];
  texts: string[];
  net: string;
  baseline: string;
  tone: string;
};

// One half of the court in nine zones, shaded by share, with the kitchen row against the net.
export function ZoneGrid({ label, cells, texts, net, baseline, tone }: ZoneGridProps) {
  const top = Math.max(...cells, 0.0001);
  return (
    <figure className={styles.zone}>
      <figcaption className={styles.caption}>{label}</figcaption>
      <span className={styles.edge}>{net}</span>
      <div className={styles.grid} role="list">
        {cells.map((c, i) => (
          <span key={i} role="listitem" className={styles.cell} data-row={Math.floor(i / 3)}>
            <span className={styles.fill} style={{ background: tone, opacity: 0.12 + (c / top) * 0.88 }} aria-hidden="true" />
            <span className={styles.text}>{texts[i]}</span>
          </span>
        ))}
      </div>
      <span className={styles.edge}>{baseline}</span>
    </figure>
  );
}
