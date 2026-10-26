import { useMemo, type CSSProperties } from 'react';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import type { ParentTaskNode } from '@/domain/task.types';
import { GanttLegend } from './GanttLegend';
import { GanttRow } from './GanttRow';
import { buildGanttScale, flattenTree } from './ganttScale';
import styles from './GanttChart.module.css';

const LABEL_COLUMN_PX = 220;
const DAY_WIDTH_PX = 26;

interface Props {
  tree: ParentTaskNode[];
}

export function GanttChart({ tree }: Props) {
  const rows = useMemo(() => flattenTree(tree), [tree]);
  const scale = useMemo(() => (rows.length ? buildGanttScale(rows) : null), [rows]);
  const tickLeft = (dayIndex: number) => `${(dayIndex / (scale?.totalDays ?? 1)) * 100}%`;

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <div>
          <div className="eyebrow">Cronograma</div>
          <h2>Diagrama de Gantt</h2>
        </div>
        <GanttLegend />
      </div>

      {!scale ? (
        <EmptyState
          title="El cronograma aparecerá aquí"
          description="Cada tarea se dibuja como una barra entre su fecha de inicio y de fin."
        />
      ) : (
        <div className={styles.scroll}>
          <div
            className={styles.chart}
            style={{ '--chart-width': `${LABEL_COLUMN_PX + scale.totalDays * DAY_WIDTH_PX}px` } as CSSProperties}
          >
            <div className={styles.labels}>
              <div className={`${styles.labelHeader} eyebrow`}>Tarea</div>
              {rows.map((row) => (
                <div
                  key={row.id}
                  className={`${styles.label} ${styles[row.kind]} ${row.overrunEnd ? styles.unmet : ''}`}
                  title={row.overrunEnd ? `${row.name} (no cumplida)` : row.name}
                >
                  {row.name}
                </div>
              ))}
            </div>

            <div>
              <div className={styles.scale}>
                {scale.ticks.map((tick) => (
                  <div
                    key={tick.dayIndex}
                    className={`${styles.tick} ${tick.isMonthStart ? styles.monthTick : ''}`}
                    style={{ left: tickLeft(tick.dayIndex) }}
                  >
                    {tick.label}
                  </div>
                ))}
              </div>

              <div className={styles.track}>
                {scale.ticks.map((tick) => (
                  <b key={tick.dayIndex} className={styles.gridLine} style={{ left: tickLeft(tick.dayIndex) }} />
                ))}
                {scale.todayPercent !== null && (
                  <div className={styles.today} style={{ left: `${scale.todayPercent}%` }} title="Hoy" />
                )}
                {rows.map((row) => (
                  <GanttRow key={row.id} row={row} scale={scale} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
