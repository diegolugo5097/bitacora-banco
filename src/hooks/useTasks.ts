import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTaskRepository } from '@/context/TaskRepositoryContext';
import { buildTaskTree, completionTimestamp, summarizeProgress } from '@/domain/progress';
import type { ChildTask, ChildTaskNode, ParentTask, TaskDraft, TaskSnapshot } from '@/domain/task.types';
import { createId } from '@/utils/id';

export type LoadStatus = 'loading' | 'ready' | 'error';

/** Campos de auditoría. Firestore no acepta `undefined`, por eso `updatedBy` solo va si existe. */
function auditStamp(userName: string) {
  const name = userName.trim();
  return { updatedAt: new Date().toISOString(), ...(name ? { updatedBy: name } : {}) };
}

function textFields(draft: TaskDraft) {
  return { name: draft.name.trim(), description: draft.description.trim() };
}

/**
 * Conserva la fecha de cierre original si la tarea ya estaba completa,
 * para que volver a guardarla no cambie si se cumplió o no.
 */
function nextCompletion(current: ChildTaskNode | undefined, progress: number): string | null {
  if (current?.completedAt && progress >= 100) return current.completedAt;
  return completionTimestamp(progress);
}

export function useTasks(userName: string) {
  const repository = useTaskRepository();
  const [snapshot, setSnapshot] = useState<TaskSnapshot>({ parents: [], children: [] });
  const [status, setStatus] = useState<LoadStatus>('loading');

  useEffect(() => {
    return repository.subscribe(
      (next) => {
        setSnapshot(next);
        setStatus('ready');
      },
      () => setStatus('error'),
    );
  }, [repository]);

  const tree = useMemo(() => buildTaskTree(snapshot), [snapshot]);
  const summary = useMemo(() => summarizeProgress(tree), [tree]);

  const findChild = useCallback(
    (id: string) => tree.flatMap((parent) => parent.children).find((child) => child.id === id),
    [tree],
  );

  const createParent = useCallback(
    (draft: TaskDraft): Promise<ParentTask> => {
      const task: ParentTask = {
        id: createId(),
        createdAt: new Date().toISOString(),
        startDate: draft.startDate,
        ...textFields(draft),
        ...auditStamp(userName),
      };
      return repository.createParent(task).then(() => task);
    },
    [repository, userName],
  );

  const createChild = useCallback(
    (parentId: string, draft: TaskDraft): Promise<ChildTask> => {
      const task: ChildTask = {
        id: createId(),
        parentId,
        createdAt: new Date().toISOString(),
        dueDate: draft.dueDate,
        progress: draft.progress,
        completedAt: completionTimestamp(draft.progress),
        ...textFields(draft),
        ...auditStamp(userName),
      };
      return repository.createChild(task).then(() => task);
    },
    [repository, userName],
  );

  const updateParent = useCallback(
    (id: string, draft: TaskDraft) =>
      repository.updateParent(id, { ...textFields(draft), startDate: draft.startDate, ...auditStamp(userName) }),
    [repository, userName],
  );

  const updateChild = useCallback(
    (id: string, draft: TaskDraft) =>
      repository.updateChild(id, {
        ...textFields(draft),
        dueDate: draft.dueDate,
        progress: draft.progress,
        completedAt: nextCompletion(findChild(id), draft.progress),
        ...auditStamp(userName),
      }),
    [repository, userName, findChild],
  );

  const updateChildProgress = useCallback(
    (id: string, progress: number) =>
      repository.updateChild(id, {
        progress,
        completedAt: nextCompletion(findChild(id), progress),
        ...auditStamp(userName),
      }),
    [repository, userName, findChild],
  );

  const updateChildJustification = useCallback(
    (id: string, justification: string) =>
      repository.updateChild(id, { justification: justification.trim(), ...auditStamp(userName) }),
    [repository, userName],
  );

  return {
    tree,
    summary,
    status,
    isShared: repository.isShared,
    createParent,
    createChild,
    updateParent,
    updateChild,
    updateChildProgress,
    updateChildJustification,
    deleteParent: repository.deleteParent,
    deleteChild: repository.deleteChild,
  };
}
