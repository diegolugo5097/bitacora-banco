import { useEffect, useRef, useState } from 'react';
import { ComplianceChip } from '@/components/ui/ComplianceChip/ComplianceChip';
import { ProgressSlider } from '@/components/ui/ProgressSlider/ProgressSlider';
import { RowActions } from '@/components/ui/RowActions/RowActions';
import { UpdatedBy } from '@/components/ui/UpdatedBy/UpdatedBy';
import { dateOf } from '@/domain/progress';
import type { ChildTaskNode } from '@/domain/task.types';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { formatShortDate } from '@/utils/date';
import { JustificationField } from './JustificationField';
import styles from './TaskList.module.css';

/** Espera tras mover el control antes de guardar, para no escribir en cada paso. */
const SAVE_DELAY_MS = 450;

interface Props {
  task: ChildTaskNode;
  onEdit: () => void;
  onDelete: () => void;
  onProgressChange: (progress: number) => void;
  onJustificationChange: (text: string) => void;
}

function dueDateLabel(task: ChildTaskNode): string {
  if (!task.dueDate) return 'Sin fecha final';
  const due = `Fecha final ${formatShortDate(task.dueDate)}`;
  return task.completedAt ? `${due} · terminada el ${formatShortDate(dateOf(task.completedAt))}` : due;
}

export function ChildTaskRow({ task, onEdit, onDelete, onProgressChange, onJustificationChange }: Props) {
  const [draftProgress, setDraftProgress] = useState(task.progress);
  const isDragging = useRef(false);
  const isUnmet = task.compliance === 'unmet';

  const saveProgress = useDebouncedCallback((progress: number) => {
    isDragging.current = false;
    onProgressChange(progress);
  }, SAVE_DELAY_MS);

  // Si otra persona cambia el avance, se refleja aquí salvo que este usuario lo esté moviendo.
  useEffect(() => {
    if (!isDragging.current) setDraftProgress(task.progress);
  }, [task.progress]);

  function handleProgressChange(progress: number) {
    isDragging.current = true;
    setDraftProgress(progress);
    saveProgress(progress);
  }

  return (
    <div className={`${styles.child} ${isUnmet ? styles.unmet : ''}`}>
      <div className={styles.body}>
        <div className={styles.childName}>{task.name}</div>
        {task.description && <div className={styles.description}>{task.description}</div>}
        <div className={styles.meta}>
          {dueDateLabel(task)}
          <ComplianceChip status={task.compliance} />
        </div>
        <UpdatedBy updatedAt={task.updatedAt} updatedBy={task.updatedBy} />
      </div>

      <ProgressSlider
        id={`progress-${task.id}`}
        label={`Avance de ${task.name}`}
        value={draftProgress}
        onChange={handleProgressChange}
      />

      <RowActions onEdit={onEdit} onDelete={onDelete} confirmMessage="¿Eliminar?" />

      {isUnmet && (
        <JustificationField taskId={task.id} value={task.justification ?? ''} onSave={onJustificationChange} />
      )}
    </div>
  );
}
