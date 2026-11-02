import type { ReactNode } from 'react';
import styles from './Block.module.css';

type BlockProps = {
  title: string;
  level: 2 | 3;
  note?: string;
  aside?: ReactNode;
  id?: string;
  children: ReactNode;
};

// A titled part of a report tab. Level 2 opens a chapter; level 3 sits inside one.
export function Block({ title, level, note, aside, id, children }: BlockProps) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <section className={styles.block} data-level={level} id={id} aria-labelledby={id ? `${id}-title` : undefined}>
      <header className={styles.header}>
        <div className={styles.titles}>
          <Heading className={styles.title} id={id ? `${id}-title` : undefined}>
            {title}
          </Heading>
          {note && <p className={styles.note}>{note}</p>}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}
