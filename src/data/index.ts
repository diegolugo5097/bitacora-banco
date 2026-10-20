import type { FirebaseOptions } from 'firebase/app';
import { createLocalTaskRepository } from './localTaskRepository';
import type { TaskRepository } from './TaskRepository';

function readFirebaseConfig(): FirebaseOptions | null {
  const env = import.meta.env;
  if (!env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_PROJECT_ID) return null;

  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
}

/**
 * Usa Firestore cuando hay configuración; si no, guarda en el navegador.
 * Firebase se descarga solo cuando se va a usar.
 */
export async function createTaskRepository(): Promise<TaskRepository> {
  const firebaseConfig = readFirebaseConfig();
  if (!firebaseConfig) return createLocalTaskRepository();

  const { createFirestoreTaskRepository } = await import('./firestoreTaskRepository');
  return createFirestoreTaskRepository(firebaseConfig);
}

export type { TaskRepository } from './TaskRepository';
