import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import type { ChildTaskNode, ParentTaskNode } from '@/domain/task.types';
import type { LoadStatus } from '@/hooks/useTasks';
import { ParentTaskCard } from './ParentTaskCard';
import styles from './TaskList.module.css';

interface Props {
  tree: ParentTaskNode[];
  status: LoadStatus;
  collapsedParents: Set<string>;
  onToggleParent: (parentId: string) => void;
  onEditParent: (task: ParentTaskNode) => void;
  onDeleteParent: (parentId: string) => void;
  onEditChild: (task: ChildTaskNode) => void;
  onDeleteChild: (childId: string) => void;
  onChildProgressChange: (childId: string, progress: number) => void;
  onChildJustificationChange: (childId: string, text: string) => void;
}

export function TaskList({ tree, status, collapsedParents, onToggleParent, ...handlers }: Props) {
  return (
    <section className="panel">
      <div>
        <div className="eyebrow">Estructura</div>
        <h2>Tareas</h2>
      </div>

      {status === 'loading' && <p className={styles.note}>Cargando tareas…</p>}

      {status !== 'loading' && tree.length === 0 && (
        <EmptyState
          title="Aún no hay tareas"
          description="Crea la primera tarea padre con el formulario y luego agrégale tareas hijas."
        />
      )}

      {tree.length > 0 && (
        <div className={styles.list}>
          {tree.map((parent) => (
            <ParentTaskCard
              key={parent.id}
              parent={parent}
              isExpanded={!collapsedParents.has(parent.id)}
              onToggle={() => onToggleParent(parent.id)}
              {...handlers}
            />
          ))}
        </div>
      )}
    </section>
  );
}
