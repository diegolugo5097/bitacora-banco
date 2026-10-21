import { useCallback, useState } from 'react';
import { useTaskRepository } from '@/context/TaskRepositoryContext';
import { archiveLocalSnapshot, readLocalSnapshot } from '@/data/localTaskStorage';
import type { TaskSnapshot } from '@/domain/task.types';

const EMPTY: TaskSnapshot = { parents: [], children: [] };

/**
 * Detecta tareas guardadas solo en este navegador (de antes de conectar Firebase)
 * y permite subirlas a la lista compartida.
 */
export function useLocalImport() {
  const repository = useTaskRepository();
  const [pending, setPending] = useState<TaskSnapshot>(() => (repository.isShared ? readLocalSnapshot() : EMPTY));
  const [isImporting, setIsImporting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const importLocalTasks = useCallback(async () => {
    setIsImporting(true);
    try {
      await repository.importSnapshot(pending);
      archiveLocalSnapshot();
      setPending(EMPTY);
    } finally {
      setIsImporting(false);
    }
  }, [repository, pending]);

  return {
    parentCount: pending.parents.length,
    childCount: pending.children.length,
    isVisible: pending.parents.length > 0 && !isDismissed,
    isImporting,
    importLocalTasks,
    dismiss: () => setIsDismissed(true),
  };
}
