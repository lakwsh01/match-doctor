import styles from './Worm.module.css';

type WormProps = {
  label: string;
  // The lead after each point: above zero, the first team leads.
  points: { key: string; diff: number }[];
  games: { key: string; label: string; from: number; to: number }[];
  up: string;
  down: string;
};

const W = 1000;
const H = 180;
const MID = H / 2;
const GAP = 14;

// Lead after every point, as bars above or below the line, one stretch per game.
export function Worm({ label, points, games, up, down }: WormProps) {
  const top = Math.max(3, ...points.map((p) => Math.abs(p.diff)));
  const usable = W - GAP * (games.length - 1);
  const step = usable / Math.max(1, points.length);
  const x = (i: number) => {
    const game = games.findIndex((g) => i >= g.from && i <= g.to);
    return i * step + Math.max(0, game) * GAP;
  };
  const y = (d: number) => (d / top) * (MID - 22);

  return (
    <figure className={styles.worm}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className={styles.svg} preserveAspectRatio="none">
        {games.map((g) => (
          <g key={g.key}>
            <rect x={x(g.from)} y={0} width={x(g.to) + step - x(g.from)} height={H} className={styles.game} />
            <text x={x(g.from) + 6} y={14} className={styles.label}>
              {g.label}
            </text>
          </g>
        ))}
        <line x1={0} x2={W} y1={MID} y2={MID} className={styles.zero} />
        {points.map((p, i) => (
          <rect
            key={p.key}
            x={x(i) + step * 0.12}
            width={Math.max(1, step * 0.76)}
            y={p.diff > 0 ? MID - y(p.diff) : MID}
            height={Math.max(1.5, Math.abs(y(p.diff)))}
            className={styles.bar}
            style={{ fill: p.diff > 0 ? up : p.diff < 0 ? down : 'var(--sage)' }}
          />
        ))}
      </svg>
    </figure>
  );
}
