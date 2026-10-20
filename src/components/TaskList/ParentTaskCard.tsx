import { ProgressBar } from '@/components/ui/ProgressBar/ProgressBar';
import { RowActions } from '@/components/ui/RowActions/RowActions';
import { StatusChip } from '@/components/ui/StatusChip/StatusChip';
import { TaskDates } from '@/components/ui/TaskDates/TaskDates';
import { UpdatedBy } from '@/components/ui/UpdatedBy/UpdatedBy';
import { getTaskStatus } from '@/domain/progress';
import type { ChildTaskNode, ParentTaskNode } from '@/domain/task.types';
import { ChildTaskRow } from './ChildTaskRow';
import styles from './TaskList.module.css';

interface Props {
  parent: ParentTaskNode;
  isExpanded: boolean;
  onToggle: () => void;
  onEditParent: (task: ParentTaskNode) => void;
  onDeleteParent: (parentId: string) => void;
  onEditChild: (task: ChildTaskNode) => void;
  onDeleteChild: (childId: string) => void;
  onChildProgressChange: (childId: string, progress: number) => void;
}

export function ParentTaskCard({
  parent,
  isExpanded,
  onToggle,
  onEditParent,
  onDeleteParent,
  onEditChild,
  onDeleteChild,
  onChildProgressChange,
}: Props) {
  const childCountLabel = `${parent.children.length} ${parent.children.length === 1 ? 'hija' : 'hijas'}`;

  return (
    <article className={styles.parent}>
      <div className={styles.parentHeader}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Ocultar tareas hijas' : 'Mostrar tareas hijas'}
          onClick={onToggle}
        >
          ▶
        </button>

        <div className={styles.body}>
          <div className={styles.parentName}>{parent.name}</div>
          {parent.description && <div className={styles.description}>{parent.description}</div>}
          <div className={styles.meta}>
            <TaskDates startDate={parent.startDate} endDate={parent.endDate} isOpen={parent.isOpen} /> ·{' '}
            {childCountLabel}
            <StatusChip status={getTaskStatus(parent.progress)} />
            <RowActions
              onEdit={() => onEditParent(parent)}
              onDelete={() => onDeleteParent(parent.id)}
              confirmMessage="¿Eliminar con sus hijas?"
            />
          </div>
          <UpdatedBy updatedAt={parent.updatedAt} updatedBy={parent.updatedBy} />
          <ProgressBar value={parent.progress} />
        </div>

        <div className={styles.percent}>{parent.progress}%</div>
      </div>

      {isExpanded && (
        <div>
          {parent.children.length === 0 ? (
            <div className={styles.emptyChildren}>Sin tareas hijas. Agrégalas desde el formulario con “Tarea hija”.</div>
          ) : (
            parent.children.map((child) => (
              <ChildTaskRow
                key={child.id}
                task={child}
                onEdit={() => onEditChild(child)}
                onDelete={() => onDeleteChild(child.id)}
                onProgressChange={(progress) => onChildProgressChange(child.id, progress)}
              />
            ))
          )}
        </div>
      )}
    </article>
  );
}
