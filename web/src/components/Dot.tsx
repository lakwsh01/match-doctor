import styles from './Dot.module.css';

type DotProps = {
  tone: string;
};

// Ball-shaped color key. Matches the bounce marks on the court.
export function Dot({ tone }: DotProps) {
  return <span className={styles.dot} style={{ background: tone }} aria-hidden="true" />;
}
