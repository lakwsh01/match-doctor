import styles from './Radar.module.css';

type RadarProps = {
  label: string;
  axes: { key: string; label: string; value: number; text: string; dashed: boolean }[];
  tone: string;
};

const R = 100;
const RINGS = [0.25, 0.5, 0.75, 1];

// Six skills on 0-100 spokes. A dashed spoke label marks a demo value.
export function Radar({ label, axes, tone }: RadarProps) {
  const angle = (i: number) => (Math.PI * 2 * i) / axes.length - Math.PI / 2;
  const at = (i: number, r: number) => [Math.cos(angle(i)) * r, Math.sin(angle(i)) * r];
  const ring = (f: number) => axes.map((_, i) => at(i, R * f).join(',')).join(' ');
  const shape = axes.map((a, i) => at(i, (R * Math.max(4, a.value)) / 100).join(',')).join(' ');

  return (
    <figure className={styles.radar}>
      <svg viewBox="-170 -135 340 270" role="img" aria-label={label} className={styles.svg}>
        {RINGS.map((f) => (
          <polygon key={f} points={ring(f)} className={styles.ring} />
        ))}
        {axes.map((a, i) => {
          const [x, y] = at(i, R);
          return <line key={a.key} x1={0} y1={0} x2={x} y2={y} className={styles.spoke} />;
        })}
        <polygon points={shape} className={styles.shape} style={{ color: tone }} />
        {axes.map((a, i) => {
          const [x, y] = at(i, R + 18);
          const anchor = Math.abs(x) < 4 ? 'middle' : x > 0 ? 'start' : 'end';
          return (
            <text key={a.key} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className={styles.axis} data-dashed={a.dashed}>
              <tspan className={styles.axisLabel}>{a.label}</tspan>
              <tspan className={styles.axisValue} dx={6}>
                {a.text}
              </tspan>
            </text>
          );
        })}
      </svg>
    </figure>
  );
}
