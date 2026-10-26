import styles from './GanttChart.module.css';

export function GanttLegend() {
  return (
    <div className={styles.legend}>
      <span>
        0%
        <i className={`${styles.swatch} ${styles.swatchProgress}`} />
        100%
      </span>
      <span>
        <i className={`${styles.swatch} ${styles.swatchOverrun}`} />
        Retraso (no cumplida)
      </span>
      <span>
        <i className={styles.swatchToday} />
        Hoy
      </span>
    </div>
  );
}
