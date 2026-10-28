import type { ReactNode } from 'react';
import styles from './Section.module.css';

type SectionProps = {
  title: string;
  note?: ReactNode;
  children: ReactNode;
};

export function Section({ title, note, children }: SectionProps) {
  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {note && <p className={styles.note}>{note}</p>}
      </header>
      {children}
    </section>
  );
}
