import styles from './Wordmark.module.css';

type WordmarkProps = {
  name: string;
};

export function Wordmark({ name }: WordmarkProps) {
  return <p className={styles.wordmark}>{name}</p>;
}
