import styles from './EmptyState.module.css';

interface Props {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: Props) {
  return (
    <div className={styles.empty}>
      <strong>{title}</strong>
      {description}
    </div>
  );
}
