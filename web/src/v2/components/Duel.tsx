import type { ReactNode } from 'react';
import styles from './Duel.module.css';

type Side = {
  key: string;
  name: string;
  tone: string;
  // Place on the 0-1 track; null when the figure is unknown.
  at: number | null;
  text: string;
  detail: string | null;
  // The reader's own side: drawn larger and set heavier.
  own: boolean;
};

type DuelProps = {
  label: string;
  note?: string;
  sides: Side[];
  band: [number, number] | null;
  flag?: ReactNode;
  size?: 'regular' | 'large';
};

const clamp = (n: number) => Math.min(1, Math.max(0, n)) * 100;

// Two teams on one track: a dot each, joined by the gap between them, over the usual range when there is one.
export function Duel({ label, note, sides, band, flag, size = 'regular' }: DuelProps) {
  const known = sides.flatMap((s) => (s.at === null ? [] : [clamp(s.at)]));
  return (
    <div className={styles.frame}>
      <div className={styles.row} data-size={size}>
        <div className={styles.label}>
          <span className={styles.name}>
            {label} {flag}
          </span>
          {note && <span className={styles.note}>{note}</span>}
        </div>
        <div className={styles.track} aria-hidden="true">
          {band && <span className={styles.band} style={{ left: `${clamp(band[0])}%`, width: `${clamp(band[1]) - clamp(band[0])}%` }} />}
          {known.length === 2 && (
            <span className={styles.gap} style={{ left: `${Math.min(...known)}%`, width: `${Math.abs(known[0] - known[1])}%` }} />
          )}
          {sides.map(
            (s) =>
              s.at !== null && (
                <span key={s.key} className={styles.dot} data-own={s.own} style={{ left: `${clamp(s.at)}%`, background: s.tone }} />
              ),
          )}
        </div>
        <dl className={styles.values}>
          {sides.map((s) => (
            <div key={s.key} className={styles.value} data-own={s.own}>
              <dt className={styles.key}>
                <span className={styles.swatch} style={{ background: s.tone }} />
                <span className={styles.hidden}>{s.name}</span>
              </dt>
              <dd className={styles.number}>
                {s.text}
                {s.detail && <span className={styles.detail}>{s.detail}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
