import { createContext, useContext, type ReactNode } from 'react';
import type { TaskRepository } from '@/data';

const TaskRepositoryContext = createContext<TaskRepository | null>(null);

interface Props {
  repository: TaskRepository;
  children: ReactNode;
}

export function TaskRepositoryProvider({ repository, children }: Props) {
  return <TaskRepositoryContext.Provider value={repository}>{children}</TaskRepositoryContext.Provider>;
}

export function useTaskRepository(): TaskRepository {
  const repository = useContext(TaskRepositoryContext);
  if (!repository) throw new Error('useTaskRepository debe usarse dentro de <TaskRepositoryProvider>.');
  return repository;
}
