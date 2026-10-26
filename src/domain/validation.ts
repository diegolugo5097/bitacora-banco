import type { IsoDate, TaskDraft, TaskKind } from './task.types';
import { formatShortDate } from '@/utils/date';

/** Devuelve un mensaje de error para el usuario, o `null` si el borrador es válido. */
export function validateTaskDraft(draft: TaskDraft, kind: TaskKind, parentStartDate?: IsoDate): string | null {
  if (!draft.name.trim()) return 'Escribe un nombre para la tarea.';

  if (kind === 'parent' && !draft.startDate) return 'Indica la fecha de inicio.';

  if (kind === 'child') {
    if (!draft.dueDate) return 'Indica la fecha final.';
    if (parentStartDate && draft.dueDate < parentStartDate) {
      return `La fecha final no puede ser anterior al inicio de la tarea padre (${formatShortDate(parentStartDate)}).`;
    }
  }

  if (draft.progress < 0 || draft.progress > 100) return 'El avance debe estar entre 0 y 100.';
  return null;
}
