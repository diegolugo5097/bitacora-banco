import type { ChildTask, IsoDate, ParentTask, TaskSnapshot } from '@/domain/task.types';

const STORAGE_KEY = 'bitacora-avances';
/** Copia de seguridad que queda en el navegador después de importar. */
const BACKUP_KEY = 'bitacora-avances:respaldo';

export const LOCAL_STORAGE_KEY = STORAGE_KEY;

const EMPTY_SNAPSHOT: TaskSnapshot = { parents: [], children: [] };
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type RawRecord = Record<string, unknown>;

const asString = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
const asOptionalString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);
const asIsoDate = (value: unknown): IsoDate | undefined =>
  typeof value === 'string' && ISO_DATE.test(value) ? value : undefined;

function clampProgress(value: unknown): number {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, Math.round(number))) : 0;
}

/** Firestore no acepta `undefined`: solo se incluyen los campos opcionales que existen. */
function optional<K extends string, V>(key: K, value: V | undefined): Partial<Record<K, V>> {
  return value === undefined || value === '' ? {} : ({ [key]: value } as Record<K, V>);
}

/** Campos comunes a padres e hijas. */
function baseFields(raw: RawRecord) {
  const id = asString(raw.id);
  const name = asString(raw.name).trim();
  if (!id || !name) return null;

  return {
    id,
    name,
    description: asString(raw.description),
    createdAt: asString(raw.createdAt, new Date().toISOString()),
    ...optional('updatedAt', asOptionalString(raw.updatedAt)),
    ...optional('updatedBy', asOptionalString(raw.updatedBy)),
  };
}

function toParent(raw: RawRecord): ParentTask | null {
  const base = baseFields(raw);
  return base ? { ...base, ...optional('startDate', asIsoDate(raw.startDate)) } : null;
}

/**
 * Acepta formatos de versiones anteriores:
 * - Las que tenían fechas manuales guardaban la fecha final en `endDate`.
 * - Las que no guardaban `completedAt` toman su última actualización como cierre si estaban al 100 %.
 */
function toChild(raw: RawRecord): ChildTask | null {
  const base = baseFields(raw);
  const parentId = asString(raw.parentId);
  if (!base || !parentId) return null;

  const progress = clampProgress(raw.progress);
  const savedCompletion = asOptionalString(raw.completedAt);
  const completedAt = progress >= 100 ? (savedCompletion ?? base.updatedAt ?? base.createdAt) : null;

  return {
    ...base,
    parentId,
    progress,
    completedAt,
    ...optional('dueDate', asIsoDate(raw.dueDate) ?? asIsoDate(raw.endDate)),
    ...optional('justification', asOptionalString(raw.justification)),
  };
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
