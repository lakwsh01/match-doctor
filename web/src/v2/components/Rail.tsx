import styles from './Rail.module.css';

type RailProps = {
  label: string;
  stops: { id: string; number: string; label: string }[];
  active: string;
  onPick: (id: string) => void;
};

const ROW = 64;
const W = 80;
// A court seen side-on, baseline to baseline across the strip, with the net down the middle.
// The kitchen is 2.13 m of the 13.41 m court on each side of the net.
const BASE = [6, 74];
const NET_X = 40;
const KITCHEN = (BASE[1] - BASE[0]) * (2.1336 / 13.4112);
// Where the ball is at each phase: served from behind one baseline, returned deep to the other,
// then the serving side works forward from its baseline to the net.
const XS = [6, 74, 12, 22, 30, 37];

// The phases of a rally as stops on one ball path. The ball moves to the phase being read.
export function Rail({ label, stops, active, onPick }: RailProps) {
  const at = (i: number) => ({ x: XS[i % XS.length], y: ROW * i + ROW / 2 });
  const path = stops
    .map((_, i) => {
      const p = at(i);
      if (i === 0) return `M${p.x},${p.y}`;
      const q = at(i - 1);
      return `Q${(p.x + q.x) / 2 + (i % 2 ? -18 : 18)},${(p.y + q.y) / 2} ${p.x},${p.y}`;
    })
    .join(' ');
  const index = Math.max(0, stops.findIndex((s) => s.id === active));
  const ball = at(index);
  const h = ROW * stops.length;

  return (
    <nav className={styles.rail} aria-label={label}>
      <svg className={styles.svg} viewBox={`0 0 ${W} ${h}`} aria-hidden="true" style={{ height: h }}>
        <rect width={W} height={h} rx={4} className={styles.court} />
        {[...BASE, NET_X - KITCHEN, NET_X + KITCHEN].map((x, i) => (
          <line key={x} x1={x} x2={x} y1={0} y2={h} className={i < 2 ? styles.line : styles.kitchen} />
        ))}
        <line x1={NET_X} x2={NET_X} y1={0} y2={h} className={styles.net} />
        <path d={path} className={styles.path} />
        {stops.map((s, i) => (
          <circle key={s.id} cx={at(i).x} cy={at(i).y} r={3} className={styles.stop} data-done={i <= index} />
        ))}
        <circle cx={0} cy={0} r={6} className={styles.ball} style={{ transform: `translate(${ball.x}px, ${ball.y}px)` }} />
      </svg>
      <ol className={styles.list}>
        {stops.map((s) => (
          <li key={s.id} className={styles.item} style={{ height: ROW }}>
            <button type="button" className={styles.button} aria-current={s.id === active ? 'step' : undefined} onClick={() => onPick(s.id)}>
              <span className={styles.number}>{s.number}</span>
              {s.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
