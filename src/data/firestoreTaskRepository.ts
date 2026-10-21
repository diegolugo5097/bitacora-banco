import { initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore';
import type { ChildTask, ParentTask, TaskSnapshot } from '@/domain/task.types';
import type { TaskRepository } from './TaskRepository';

const PARENTS = 'parentTasks';
const CHILDREN = 'childTasks';
/** Firestore permite hasta 500 escrituras por lote. */
const BATCH_LIMIT = 450;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

function toRows<T>(snapshot: QuerySnapshot<DocumentData>): T[] {
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }) as T);
}

/** Quita el `id` del cuerpo: en Firestore el id ya es la llave del documento. */
function withoutId<T extends { id: string }>({ id: _id, ...rest }: T): Omit<T, 'id'> {
  return rest;
}

/**
 * Tareas compartidas en vivo con Firebase Firestore.
 * Cada tarea es un documento, así dos personas pueden editar tareas
 * distintas al mismo tiempo sin pisarse.
 */
export function createFirestoreTaskRepository(options: FirebaseOptions): TaskRepository {
  const db = getFirestore(initializeApp(options));
  const parentsRef = collection(db, PARENTS);
  const childrenRef = collection(db, CHILDREN);

  return {
    isShared: true,

    subscribe(onChange, onError) {
      let parents: ParentTask[] | null = null;
      let children: ChildTask[] | null = null;

      const emitWhenReady = () => {
        if (parents && children) onChange({ parents, children } satisfies TaskSnapshot);
      };

      const stopParents = onSnapshot(
        parentsRef,
        (snapshot) => {
          parents = toRows<ParentTask>(snapshot);
          emitWhenReady();
        },
        onError,
      );
      const stopChildren = onSnapshot(
        childrenRef,
        (snapshot) => {
          children = toRows<ChildTask>(snapshot);
          emitWhenReady();
        },
        onError,
      );

      return () => {
        stopParents();
        stopChildren();
      };
    },

    createParent: (task) => setDoc(doc(parentsRef, task.id), withoutId(task)),
    updateParent: (id, patch) => updateDoc(doc(parentsRef, id), patch),

    async deleteParent(id) {
      const batch = writeBatch(db);
      const children = await getDocs(query(childrenRef, where('parentId', '==', id)));
      children.forEach((child) => batch.delete(child.ref));
      batch.delete(doc(parentsRef, id));
      await batch.commit();
    },

    createChild: (task) => setDoc(doc(childrenRef, task.id), withoutId(task)),
    updateChild: (id, patch) => updateDoc(doc(childrenRef, id), patch),
    deleteChild: (id) => deleteDoc(doc(childrenRef, id)),

    /** Primero las padres y luego las hijas, para que nunca quede una hija sin su padre. */
    async importSnapshot({ parents, children }) {
      const writes = [
        ...parents.map((task) => ({ ref: doc(parentsRef, task.id), data: withoutId(task) })),
        ...children.map((task) => ({ ref: doc(childrenRef, task.id), data: withoutId(task) })),
      ];

      for (const group of chunk(writes, BATCH_LIMIT)) {
        const batch = writeBatch(db);
        group.forEach(({ ref, data }) => batch.set(ref, data));
        await batch.commit();
      }
    },
  };
}
