import type { ChildTask, ParentTask, TaskSnapshot } from '@/domain/task.types';

const STORAGE_KEY = 'bitacora-avances';
/** Copia de seguridad que queda en el navegador después de importar. */
const BACKUP_KEY = 'bitacora-avances:respaldo';

export const LOCAL_STORAGE_KEY = STORAGE_KEY;

const EMPTY_SNAPSHOT: TaskSnapshot = { parents: [], children: [] };

type RawRecord = Record<string, unknown>;

const asString = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
const asOptionalString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

function clampProgress(value: unknown): number {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, Math.round(number))) : 0;
}

/** Firestore no acepta `undefined`: solo se incluyen los campos de auditoría que existen. */
function auditFields(raw: RawRecord) {
  const createdAt = asString(raw.createdAt, new Date().toISOString());
  const updatedAt = asOptionalString(raw.updatedAt);
  const updatedBy = asOptionalString(raw.updatedBy);
  return { createdAt, ...(updatedAt ? { updatedAt } : {}), ...(updatedBy ? { updatedBy } : {}) };
}

function toParent(raw: RawRecord): ParentTask | null {
  const id = asString(raw.id);
  const name = asString(raw.name).trim();
  if (!id || !name) return null;
  return { id, name, description: asString(raw.description), ...auditFields(raw) };
}

/**
 * Las versiones anteriores no guardaban `completedAt` (tenían fechas manuales).
 * Si la tarea ya estaba al 100 %, se toma su última actualización como fecha de cierre.
 */
function toChild(raw: RawRecord): ChildTask | null {
  const parent = toParent(raw);
  const parentId = asString(raw.parentId);
  if (!parent || !parentId) return null;

  const progress = clampProgress(raw.progress);
  const savedCompletion = asOptionalString(raw.completedAt);
  const completedAt = progress >= 100 ? savedCompletion ?? parent.updatedAt ?? parent.createdAt : null;

  return { ...parent, parentId, progress, completedAt };
}

const isRecord = (value: unknown): value is RawRecord => typeof value === 'object' && value !== null;

/** Convierte lo guardado (de esta versión o de una anterior) al formato actual y descarta lo inválido. */
export function normalizeSnapshot(raw: unknown): TaskSnapshot {
  if (!isRecord(raw)) return EMPTY_SNAPSHOT;
  const rawParents = Array.isArray(raw.parents) ? raw.parents.filter(isRecord) : [];
  const rawChildren = Array.isArray(raw.children) ? raw.children.filter(isRecord) : [];

  const parents = rawParents.map(toParent).filter((task): task is ParentTask => task !== null);
  const parentIds = new Set(parents.map((parent) => parent.id));
  const children = rawChildren
    .map(toChild)
    .filter((task): task is ChildTask => task !== null && parentIds.has(task.parentId));

  return { parents, children };
}

export function readLocalSnapshot(): TaskSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeSnapshot(JSON.parse(raw)) : EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

export function writeLocalSnapshot(snapshot: TaskSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Almacenamiento lleno o bloqueado: los datos siguen en memoria durante la sesión.
  }
}

/** Saca las tareas de la lista local y deja una copia de respaldo, por si acaso. */
export function archiveLocalSnapshot(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) localStorage.setItem(BACKUP_KEY, raw);
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Si el navegador no deja escribir, las tareas quedan donde estaban.
  }
}
