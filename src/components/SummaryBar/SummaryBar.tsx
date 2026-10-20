import type { ProgressSummary } from '@/domain/task.types';
import styles from './SummaryBar.module.css';

interface Props {
  summary: ProgressSummary;
}

export function SummaryBar({ summary }: Props) {
  const metrics = [
    { label: 'Avance general', value: `${summary.overallProgress}%` },
    { label: 'Tareas padre', value: String(summary.parentCount) },
    { label: 'Hijas completadas', value: `${summary.completedChildren}/${summary.childCount}` },
    { label: 'Hijas sin iniciar', value: String(summary.notStartedChildren) },
  ];

  return (
    <dl className={styles.summary}>
      {metrics.map((metric) => (
        <div key={metric.label} className={styles.metric}>
          <dt className="eyebrow">{metric.label}</dt>
          <dd>{metric.value}</dd>
        </div>
      ))}
    </dl>
  );
}
