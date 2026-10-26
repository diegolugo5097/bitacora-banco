import { addDays, formatShortDate } from '@/utils/date';
import { progressStyle } from '@/utils/progressColor';
import { rowEnd, type GanttRowData, type GanttScale } from './ganttScale';
import styles from './GanttChart.module.css';

interface Props {
  row: GanttRowData;
  scale: GanttScale;
}

const LABEL_GAP_PX = 6;

function tooltip(row: GanttRowData): string {
  const range = `${formatShortDate(row.startDate)} → ${formatShortDate(row.endDate)}`;
  const delay = row.overrunEnd ? ` · no cumplida, retraso hasta ${formatShortDate(row.overrunEnd)}` : '';
  return `${row.name}: ${range} · ${row.progress}%${delay}`;
}

export function GanttRow({ row, scale }: Props) {
  const left = scale.offsetPercent(row.startDate);
  const width = scale.widthPercent(row.startDate, row.endDate);
  const overrunStart = row.overrunEnd ? addDays(row.endDate, 1) : null;
  const labelLeft = scale.offsetPercent(rowEnd(row)) + scale.widthPercent(rowEnd(row), rowEnd(row));

  return (
    <div
      className={`${styles.row} ${styles[row.kind]} ${row.overrunEnd ? styles.unmet : ''} progress-tone`}
      style={progressStyle(row.progress)}
    >
      <div className={styles.bar} style={{ left: `${left}%`, width: `${width}%` }} title={tooltip(row)}>
        <i className={styles.barFill} style={{ width: `${row.progress}%` }} />
      </div>

      {overrunStart && row.overrunEnd && (
        <div
          className={styles.overrun}
          style={{
            left: `${scale.offsetPercent(overrunStart)}%`,
            width: `${scale.widthPercent(overrunStart, row.overrunEnd)}%`,
          }}
          title={`Retraso: ${formatShortDate(overrunStart)} → ${formatShortDate(row.overrunEnd)}`}
        />
      )}

      {/* El porcentaje va fuera de la barra para leerse igual sobre cualquier color */}
      <span className={styles.barLabel} style={{ left: `calc(${labelLeft}% + ${LABEL_GAP_PX}px)` }}>
        {row.progress}%
      </span>
    </div>
  );
}
