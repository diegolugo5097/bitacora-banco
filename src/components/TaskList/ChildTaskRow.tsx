import { useEffect, useRef, useState } from 'react';
import { ProgressSlider } from '@/components/ui/ProgressSlider/ProgressSlider';
import { RowActions } from '@/components/ui/RowActions/RowActions';
import { StatusChip } from '@/components/ui/StatusChip/StatusChip';
import { TaskDates } from '@/components/ui/TaskDates/TaskDates';
import { UpdatedBy } from '@/components/ui/UpdatedBy/UpdatedBy';
import { getTaskStatus } from '@/domain/progress';
import type { ChildTaskNode } from '@/domain/task.types';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import styles from './TaskList.module.css';

/** Espera tras mover el control antes de guardar, para no escribir en cada paso. */
const SAVE_DELAY_MS = 450;

interface Props {
  task: ChildTaskNode;
  onEdit: () => void;
  onDelete: () => void;
  onProgressChange: (progress: number) => void;
}

export function ChildTaskRow({ task, onEdit, onDelete, onProgressChange }: Props) {
  const [draftProgress, setDraftProgress] = useState(task.progress);
  const isDragging = useRef(false);

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
    <div className={styles.child}>
      <div className={styles.body}>
        <div className={styles.childName}>{task.name}</div>
        {task.description && <div className={styles.description}>{task.description}</div>}
        <div className={styles.meta}>
          <TaskDates startDate={task.startDate} endDate={task.endDate} isOpen={task.isOpen} />
          <StatusChip status={getTaskStatus(draftProgress)} />
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
    </div>
  );
}
