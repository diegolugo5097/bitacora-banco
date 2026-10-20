import { formatShortDate } from '@/utils/date';
import type { GanttRowData, GanttScale } from './ganttScale';
import styles from './GanttChart.module.css';

interface Props {
  row: GanttRowData;
  scale: GanttScale;
}

export function GanttRow({ row, scale }: Props) {
  const left = scale.offsetPercent(row.startDate);
  const width = scale.widthPercent(row.startDate, row.endDate);
  const period = row.isOpen
    ? `desde ${formatShortDate(row.startDate)}, en curso`
    : `${formatShortDate(row.startDate)} → ${formatShortDate(row.endDate)}`;

  return (
    <div className={`${styles.row} ${styles[row.kind]}`}>
      <div
        className={`${styles.bar} ${row.isOpen ? styles.open : ''}`}
        style={{ left: `${left}%`, width: `${width}%` }}
        title={`${row.name}: ${period} · ${row.progress}%`}
      >
        <i className={styles.barFill} style={{ width: `${row.progress}%` }} />
      </div>
      {/* El porcentaje va fuera de la barra para leerse igual sobre cualquier color */}
      <span className={styles.barLabel} style={{ left: `calc(${left + width}% + 6px)` }}>
        {row.progress}%
      </span>
    </div>
  );
}
