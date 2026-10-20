import { formatRelativeTime } from '@/utils/date';
import styles from './UpdatedBy.module.css';

interface Props {
  updatedAt?: string;
  updatedBy?: string;
}

export function UpdatedBy({ updatedAt, updatedBy }: Props) {
  if (!updatedAt) return null;
  const author = updatedBy ? `Actualizado por ${updatedBy} · ` : 'Actualizado ';
  return (
    <div className={styles.text}>
      {author}
      {formatRelativeTime(updatedAt)}
    </div>
  );
}
