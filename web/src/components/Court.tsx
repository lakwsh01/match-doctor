import styles from './Court.module.css';

type Spot = { x: number; y: number };
type CourtMark = Spot & { id: string; tone: string; hollow: boolean };
type CourtPath = { id: string; tone: string; points: Spot[] };
type HeatCell = Spot & { w: number; h: number; level: number };

type CourtProps = {
  label: string;
  width: number;
  length: number;
  net: number;
  kitchen: number;
  heat: HeatCell[];
  heatTone: string;
  paths: CourtPath[];
  marks: CourtMark[];
  ball: Spot[];
  trace: boolean;
};

const PAD = 1;
const TRACE_SEC = 1.2;

// Top-down court with the far end at the top, matching the video. Input is in meters:
// x across the court (0 = left sideline), y along it (0 = far baseline).
// Layers stack bottom to top: heat cells, paths, marks. With `trace`, marks are joined
// in order, appear one after another, and paths draw in.
export function Court({ label, width, length, net, kitchen, heat, heatTone, paths, marks, ball, trace }: CourtProps) {
  const toSvg = (s: Spot) => `${s.x},${s.y}`;
  const ballLine = (ball.length > 1 ? ball : trace ? marks : []).map(toSvg).join(' ');
  const step = trace && marks.length > 1 ? TRACE_SEC / marks.length : 0;
  const enter = trace ? styles.enter : '';

  return (
    <svg
      className={styles.court}
      viewBox={`${-PAD} ${-PAD} ${width + PAD * 2} ${length + PAD * 2}`}
      role="img"
      aria-label={label}
    >
      <rect x={-PAD} y={-PAD} width={width + PAD * 2} height={length + PAD * 2} className={styles.surround} />
      <rect width={width} height={length} className={styles.surface} />
      <rect y={net - kitchen} width={width} height={kitchen * 2} className={styles.kitchen} />
      <g style={{ color: heatTone }}>
        {heat.map((c) => (
          <rect key={`${c.x},${c.y}`} x={c.x} y={c.y} width={c.w} height={c.h} fillOpacity={c.level} className={styles.heat} />
        ))}
      </g>
      <g className={styles.lines}>
        <rect width={width} height={length} fill="none" />
        <line x1={width / 2} x2={width / 2} y1={0} y2={net - kitchen} />
        <line x1={width / 2} x2={width / 2} y1={net + kitchen} y2={length} />
        <line x1={0} x2={width} y1={net - kitchen} y2={net - kitchen} />
        <line x1={0} x2={width} y1={net + kitchen} y2={net + kitchen} />
      </g>
      <line x1={-0.3} x2={width + 0.3} y1={net} y2={net} className={styles.net} />
      {paths.map((p) => (
        <polyline
          key={p.id}
          points={p.points.map(toSvg).join(' ')}
          pathLength={1}
          className={`${styles.path} ${trace ? styles.draw : ''}`}
          style={{ color: p.tone }}
        />
      ))}
      {ballLine && (
        <polyline points={ballLine} pathLength={1} className={`${styles.ball} ${trace && ball.length < 2 ? styles.draw : ''}`} />
      )}
      {marks.map((m, i) => (
        <circle
          key={trace ? `${ballLine}-${m.id}` : m.id}
          cx={m.x}
          cy={m.y}
          r={0.13}
          className={`${m.hollow ? styles.out : styles.in} ${enter}`}
          style={{ color: m.tone, animationDelay: trace ? `${i * step}s` : undefined }}
        />
      ))}
    </svg>
  );
}
