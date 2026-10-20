import styles from './ProgressBar.module.css';

interface Props {
  value: number;
}

export function ProgressBar({ value }: Props) {
  return (
    <div className={styles.track} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <i className={styles.fill} style={{ width: `${value}%` }} />
    </div>
  );
}
