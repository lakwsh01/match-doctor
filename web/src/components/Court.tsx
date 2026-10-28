import styles from './Court.module.css';

type CourtMark = { id: string; x: number; y: number; tone: string; inBounds: boolean };

type CourtProps = {
  label: string;
  width: number;
  length: number;
  net: number;
  kitchen: number;
  marks: CourtMark[];
  trace: boolean;
};

const PAD = 1;
const TRACE_SEC = 1.2;

// Top-down court, turned so the far end sits on the left. Input is in meters:
// x across the court (0 = left sideline in the video), y along it (0 = far baseline).
// With `trace`, marks are joined in order and appear one after another.
export function Court({ label, width, length, net, kitchen, marks, trace }: CourtProps) {
  const spots = marks.map((m) => ({ ...m, cx: m.y, cy: width - m.x }));
  const path = spots.map((s) => `${s.cx},${s.cy}`).join(' ');
  const step = trace && spots.length > 1 ? TRACE_SEC / spots.length : 0;

  return (
    <svg
      className={styles.court}
      viewBox={`${-PAD} ${-PAD} ${length + PAD * 2} ${width + PAD * 2}`}
      role="img"
      aria-label={label}
    >
      <rect x={-PAD} y={-PAD} width={length + PAD * 2} height={width + PAD * 2} className={styles.surround} />
      <rect width={length} height={width} className={styles.surface} />
      <rect x={net - kitchen} width={kitchen * 2} height={width} className={styles.kitchen} />
      <g className={styles.lines}>
        <rect width={length} height={width} fill="none" />
        <line x1={0} x2={net - kitchen} y1={width / 2} y2={width / 2} />
        <line x1={net + kitchen} x2={length} y1={width / 2} y2={width / 2} />
        <line x1={net - kitchen} x2={net - kitchen} y1={0} y2={width} />
        <line x1={net + kitchen} x2={net + kitchen} y1={0} y2={width} />
      </g>
      <line x1={net} x2={net} y1={-0.3} y2={width + 0.3} className={styles.net} />
      {trace && spots.length > 1 && <polyline key={path} points={path} pathLength={1} className={styles.trace} />}
      {spots.map((s, i) => (
        <circle
          key={trace ? `${path}-${s.id}` : s.id}
          cx={s.cx}
          cy={s.cy}
          r={0.13}
          className={`${s.inBounds ? styles.in : styles.out} ${trace ? styles.enter : ''}`}
          style={{ color: s.tone, animationDelay: trace ? `${i * step}s` : undefined }}
        />
      ))}
    </svg>
  );
}
