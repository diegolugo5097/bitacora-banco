import styles from './ProgressSlider.module.css';

interface Props {
  id: string;
  value: number;
  label: string;
  onChange: (value: number) => void;
}

const STEP = 5;

export function ProgressSlider({ id, value, label, onChange }: Props) {
  return (
    <span className={styles.slider}>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={STEP}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output htmlFor={id}>{value}%</output>
    </span>
  );
}
