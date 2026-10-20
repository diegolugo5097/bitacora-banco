import type { TaskDraft } from './task.types';

/** Devuelve un mensaje de error para el usuario, o `null` si el borrador es válido. */
export function validateTaskDraft(draft: TaskDraft): string | null {
  if (!draft.name.trim()) return 'Escribe un nombre para la tarea.';
  if (draft.progress < 0 || draft.progress > 100) return 'El avance debe estar entre 0 y 100.';
  return null;
}
