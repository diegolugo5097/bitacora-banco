import type { ChildTask, ParentTask, TaskSnapshot } from '@/domain/task.types';

export type Unsubscribe = () => void;

export type ParentTaskPatch = Partial<Omit<ParentTask, 'id' | 'createdAt'>>;
export type ChildTaskPatch = Partial<Omit<ChildTask, 'id' | 'parentId' | 'createdAt'>>;

/**
 * Contrato de persistencia. La UI solo conoce esta interfaz,
 * así que cambiar de almacenamiento no toca ningún componente.
 */
export interface TaskRepository {
  /** `true` cuando otras personas ven los cambios en vivo. */
  readonly isShared: boolean;

  subscribe(onChange: (snapshot: TaskSnapshot) => void, onError: (error: Error) => void): Unsubscribe;

  createParent(task: ParentTask): Promise<void>;
  updateParent(id: string, patch: ParentTaskPatch): Promise<void>;
  /** Elimina la tarea padre junto con todas sus hijas. */
  deleteParent(id: string): Promise<void>;

  createChild(task: ChildTask): Promise<void>;
  updateChild(id: string, patch: ChildTaskPatch): Promise<void>;
  deleteChild(id: string): Promise<void>;

  /**
   * Sube un lote de tareas conservando sus ids. Si una tarea ya existe se reemplaza,
   * así que repetir la importación no crea duplicados.
   */
  importSnapshot(snapshot: TaskSnapshot): Promise<void>;
}
