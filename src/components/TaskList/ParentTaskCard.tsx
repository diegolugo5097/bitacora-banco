import { ProgressBar } from '@/components/ui/ProgressBar/ProgressBar';
import { RowActions } from '@/components/ui/RowActions/RowActions';
import { StatusChip } from '@/components/ui/StatusChip/StatusChip';
import { UpdatedBy } from '@/components/ui/UpdatedBy/UpdatedBy';
import { getTaskStatus } from '@/domain/progress';
import type { ChildTaskNode, ParentTaskNode } from '@/domain/task.types';
import { formatShortDate } from '@/utils/date';
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
  onChildJustificationChange: (childId: string, text: string) => void;
}

const plural = (count: number, singular: string, pluralForm: string) => `${count} ${count === 1 ? singular : pluralForm}`;

export function ParentTaskCard({
  parent,
  isExpanded,
  onToggle,
  onEditParent,
  onDeleteParent,
  onEditChild,
  onDeleteChild,
  onChildProgressChange,
  onChildJustificationChange,
}: Props) {
  const hasChildren = parent.children.length > 0;

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
            Inicio {formatShortDate(parent.startDate)}
            {hasChildren && ` · Fin previsto ${formatShortDate(parent.endDate)}`} ·{' '}
            {plural(parent.children.length, 'hija', 'hijas')}
            <StatusChip status={getTaskStatus(parent.progress)} />
            {parent.unmetCount > 0 && (
              <span className={styles.unmetCount}>{plural(parent.unmetCount, 'no cumplida', 'no cumplidas')}</span>
            )}
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
          {!hasChildren ? (
            <div className={styles.emptyChildren}>Sin tareas hijas. Agrégalas desde el formulario con “Tarea hija”.</div>
          ) : (
            parent.children.map((child) => (
              <ChildTaskRow
                key={child.id}
                task={child}
                onEdit={() => onEditChild(child)}
                onDelete={() => onDeleteChild(child.id)}
                onProgressChange={(progress) => onChildProgressChange(child.id, progress)}
                onJustificationChange={(text) => onChildJustificationChange(child.id, text)}
              />
            ))
          )}
        </div>
      )}
    </article>
  );
}
