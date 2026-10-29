import styles from './LinkButton.module.css';

type LinkButtonProps = {
  label: string;
  onClick: () => void;
};

export function LinkButton({ label, onClick }: LinkButtonProps) {
  return (
    <button type="button" className={styles.link} onClick={onClick}>
      {label}
    </button>
  );
}
