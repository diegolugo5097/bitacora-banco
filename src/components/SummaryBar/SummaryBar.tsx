import type { ProgressSummary } from '@/domain/task.types';
import styles from './SummaryBar.module.css';

interface Props {
  summary: ProgressSummary;
}

export function SummaryBar({ summary }: Props) {
  const metrics = [
    { label: 'Avance general', value: `${summary.overallProgress}%`, alert: false },
    { label: 'Tareas padre', value: String(summary.parentCount), alert: false },
    { label: 'Hijas completadas', value: `${summary.completedChildren}/${summary.childCount}`, alert: false },
    { label: 'Hijas no cumplidas', value: String(summary.unmetChildren), alert: summary.unmetChildren > 0 },
  ];

  return (
    <dl className={styles.summary}>
      {metrics.map((metric) => (
        <div key={metric.label} className={styles.metric}>
          <dt className="eyebrow">{metric.label}</dt>
          <dd className={metric.alert ? styles.alert : undefined}>{metric.value}</dd>
        </div>
      ))}
    </dl>
  );
}
