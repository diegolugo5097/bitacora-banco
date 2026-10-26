import { COMPLIANCE_LABELS } from '@/domain/progress';
import type { ComplianceStatus } from '@/domain/task.types';
import styles from './ComplianceChip.module.css';

interface Props {
  status: ComplianceStatus;
}

export function ComplianceChip({ status }: Props) {
  return <span className={`${styles.chip} ${styles[status]}`}>{COMPLIANCE_LABELS[status]}</span>;
}
