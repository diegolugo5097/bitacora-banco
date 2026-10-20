import { useEffect, useState } from 'react';
import type { TaskDraft } from '@/domain/task.types';
import { validateTaskDraft } from '@/domain/validation';
import type { EditTarget, TaskKind } from './taskForm.types';

const EMPTY_DRAFT: TaskDraft = { name: '', description: '', progress: 0 };

function draftFromEditTarget(target: EditTarget): TaskDraft {
  const { name, description } = target.task;
  return { name, description, progress: target.kind === 'child' ? target.task.progress : 0 };
}

export function useTaskForm(editTarget: EditTarget | null, parentIds: string[]) {
  const [kind, setKind] = useState<TaskKind>('parent');
  const [parentId, setParentId] = useState('');
  const [draft, setDraft] = useState<TaskDraft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editTarget) return;
    setKind(editTarget.kind);
    setDraft(draftFromEditTarget(editTarget));
    setError(null);
  }, [editTarget]);

  // Mantiene seleccionada una padre que todavía exista.
  useEffect(() => {
    if (!parentIds.includes(parentId)) setParentId(parentIds[0] ?? '');
  }, [parentIds, parentId]);

  function updateField<K extends keyof TaskDraft>(field: K, value: TaskDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  /** Valida el formulario. Devuelve `true` si se puede enviar. */
  function validate(): boolean {
    const message = kind === 'child' && !parentId ? 'Primero crea una tarea padre.' : validateTaskDraft(draft);
    setError(message);
    return message === null;
  }

  function reset() {
    setDraft(EMPTY_DRAFT);
    setError(null);
  }

  return { kind, setKind, parentId, setParentId, draft, updateField, error, validate, reset };
}
