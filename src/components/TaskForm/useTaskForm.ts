import { useEffect, useState } from 'react';
import type { ParentTaskNode, TaskDraft } from '@/domain/task.types';
import { validateTaskDraft } from '@/domain/validation';
import { addDays, todayIso } from '@/utils/date';
import type { EditTarget, TaskKind } from './taskForm.types';

const DEFAULT_DURATION_DAYS = 7;

function emptyDraft(): TaskDraft {
  const today = todayIso();
  return { name: '', description: '', progress: 0, startDate: today, dueDate: addDays(today, DEFAULT_DURATION_DAYS) };
}

function draftFromEditTarget(target: EditTarget): TaskDraft {
  const base = emptyDraft();
  const { name, description } = target.task;

  if (target.kind === 'parent') return { ...base, name, description, startDate: target.task.startDate };

  const { progress, dueDate } = target.task;
  return { ...base, name, description, progress, dueDate: dueDate ?? base.dueDate };
}

export function useTaskForm(editTarget: EditTarget | null, parents: ParentTaskNode[]) {
  const [kind, setKind] = useState<TaskKind>('parent');
  const [parentId, setParentId] = useState('');
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editTarget) return;
    setKind(editTarget.kind);
    if (editTarget.kind === 'child') setParentId(editTarget.task.parentId);
    setDraft(draftFromEditTarget(editTarget));
    setError(null);
  }, [editTarget]);

  // Mantiene seleccionada una padre que todavía exista.
  useEffect(() => {
    if (!parents.some((parent) => parent.id === parentId)) setParentId(parents[0]?.id ?? '');
  }, [parents, parentId]);

  const selectedParent = parents.find((parent) => parent.id === parentId);

  function updateField<K extends keyof TaskDraft>(field: K, value: TaskDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  /** Valida el formulario. Devuelve `true` si se puede enviar. */
  function validate(): boolean {
    const message =
      kind === 'child' && !selectedParent
        ? 'Primero crea una tarea padre.'
        : validateTaskDraft(draft, kind, selectedParent?.startDate);
    setError(message);
    return message === null;
  }

  function reset() {
    setDraft(emptyDraft());
    setError(null);
  }

  return { kind, setKind, parentId, setParentId, selectedParent, draft, updateField, error, validate, reset };
}
