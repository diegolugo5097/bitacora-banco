import { STATUS_LABELS } from '@/domain/progress';
import type { TaskStatus } from '@/domain/task.types';
import styles from './StatusChip.module.css';

interface Props {
  status: TaskStatus;
}

export function StatusChip({ status }: Props) {
  return <span className={`${styles.chip} ${styles[status]}`}>{STATUS_LABELS[status]}</span>;
}
