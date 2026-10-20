import styles from './GanttChart.module.css';

export function GanttLegend() {
  return (
    <div className={styles.legend}>
      <span>
        <i className={`${styles.swatch} ${styles.swatchParent}`} />
        Tarea padre
      </span>
      <span>
        <i className={`${styles.swatch} ${styles.swatchChild}`} />
        Tarea hija
      </span>
      <span>
        <i className={styles.swatchToday} />
        Hoy
      </span>
    </div>
  );
}
