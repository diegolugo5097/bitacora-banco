import type { TaskKind } from './taskForm.types';
import styles from './TaskForm.module.css';

interface Props {
  value: TaskKind;
  onChange: (kind: TaskKind) => void;
  canCreateChild: boolean;
}

export function TaskTypeToggle({ value, onChange, canCreateChild }: Props) {
  return (
    <div className={styles.toggle} role="group" aria-label="Tipo de tarea">
      <button type="button" aria-pressed={value === 'parent'} onClick={() => onChange('parent')}>
        Tarea padre
      </button>
      <button type="button" aria-pressed={value === 'child'} onClick={() => onChange('child')} disabled={!canCreateChild}>
        Tarea hija
      </button>
    </div>
  );
}
