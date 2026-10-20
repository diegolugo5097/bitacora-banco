import styles from './Toast.module.css';

interface Props {
  message: string;
}

export function Toast({ message }: Props) {
  if (!message) return null;
  return (
    <div className={styles.toast} role="status">
      {message}
    </div>
  );
}
