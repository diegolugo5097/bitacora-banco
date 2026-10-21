import type { TaskSnapshot } from '@/domain/task.types';
import { LOCAL_STORAGE_KEY, readLocalSnapshot, writeLocalSnapshot } from './localTaskStorage';
import type { ChildTaskPatch, ParentTaskPatch, TaskRepository } from './TaskRepository';

/** Agrega o reemplaza por id, para que importar dos veces no duplique tareas. */
function upsertById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const byId = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => byId.set(item.id, item));
  return [...byId.values()];
}

/**
 * Guarda las tareas en el navegador. Las pestañas abiertas del mismo
 * navegador se sincronizan con el evento `storage`.
 */
export function createLocalTaskRepository(): TaskRepository {
  let snapshot = readLocalSnapshot();
  const listeners = new Set<(snapshot: TaskSnapshot) => void>();

  const notify = () => listeners.forEach((listener) => listener(snapshot));

  const commit = (next: TaskSnapshot) => {
    snapshot = next;
    writeLocalSnapshot(snapshot);
    notify();
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== LOCAL_STORAGE_KEY) return;
    snapshot = readLocalSnapshot();
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

    async importSnapshot(incoming) {
      commit({
        parents: upsertById(snapshot.parents, incoming.parents),
        children: upsertById(snapshot.children, incoming.children),
      });
    },
  };
}
