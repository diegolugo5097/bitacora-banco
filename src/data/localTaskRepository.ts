import type { TaskSnapshot } from '@/domain/task.types';
import type { ChildTaskPatch, ParentTaskPatch, TaskRepository } from './TaskRepository';

const STORAGE_KEY = 'bitacora-avances';
const EMPTY_SNAPSHOT: TaskSnapshot = { parents: [], children: [] };

function readStorage(): TaskSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TaskSnapshot) : EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

function writeStorage(snapshot: TaskSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Almacenamiento lleno o bloqueado: los datos siguen en memoria durante la sesión.
  }
}

/**
 * Guarda las tareas en el navegador. Las pestañas abiertas del mismo
 * navegador se sincronizan con el evento `storage`.
 */
export function createLocalTaskRepository(): TaskRepository {
  let snapshot = readStorage();
  const listeners = new Set<(snapshot: TaskSnapshot) => void>();

  const notify = () => listeners.forEach((listener) => listener(snapshot));

  const commit = (next: TaskSnapshot) => {
    snapshot = next;
    writeStorage(snapshot);
    notify();
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = readStorage();
    notify();
  };

  return {
    isShared: false,

    subscribe(onChange) {
      listeners.add(onChange);
      if (listeners.size === 1) window.addEventListener('storage', onStorage);
      onChange(snapshot);
      return () => {
        listeners.delete(onChange);
        if (listeners.size === 0) window.removeEventListener('storage', onStorage);
      };
    },

    async createParent(task) {
      commit({ ...snapshot, parents: [...snapshot.parents, task] });
    },

    async updateParent(id, patch: ParentTaskPatch) {
      commit({
        ...snapshot,
        parents: snapshot.parents.map((parent) => (parent.id === id ? { ...parent, ...patch } : parent)),
      });
    },

    async deleteParent(id) {
      commit({
        parents: snapshot.parents.filter((parent) => parent.id !== id),
        children: snapshot.children.filter((child) => child.parentId !== id),
      });
    },

    async createChild(task) {
      commit({ ...snapshot, children: [...snapshot.children, task] });
    },

    async updateChild(id, patch: ChildTaskPatch) {
      commit({
        ...snapshot,
        children: snapshot.children.map((child) => (child.id === id ? { ...child, ...patch } : child)),
      });
    },

    async deleteChild(id) {
      commit({ ...snapshot, children: snapshot.children.filter((child) => child.id !== id) });
    },
  };
}
