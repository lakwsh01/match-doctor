import type { ReactNode } from 'react';
import styles from './Scroll.module.css';

type ScrollProps = {
  children: ReactNode;
};

// A row of choices that keeps its natural width and scrolls sideways when the screen is narrower,
// instead of squeezing each label onto one character per line.
export function Scroll({ children }: ScrollProps) {
  return (
    <div className={styles.scroll}>
      <div className={styles.fit}>{children}</div>
    </div>
  );
}
