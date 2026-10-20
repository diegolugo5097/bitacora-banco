import type {
  ChildTask,
  ChildTaskNode,
  ParentTask,
  ParentTaskNode,
  ProgressSummary,
  TaskSnapshot,
  TaskStatus,
} from './task.types';
import { maxDate, minDate, toIsoDate, todayIso } from '@/utils/date';

export const COMPLETE = 100;

/** Avance de la padre: promedio simple del avance de sus hijas. */
export function calculateParentProgress(children: ChildTask[]): number {
  if (children.length === 0) return 0;
  const total = children.reduce((sum, child) => sum + child.progress, 0);
  return Math.round(total / children.length);
}

export function getTaskStatus(progress: number): TaskStatus {
  if (progress >= COMPLETE) return 'completed';
  if (progress > 0) return 'inProgress';
  return 'notStarted';
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  completed: 'Completada',
  inProgress: 'En curso',
  notStarted: 'Sin iniciar',
};

/** Momento de cierre al guardar un avance: se fija al llegar a 100 % y se borra si baja. */
export function completionTimestamp(progress: number): string | null {
  return progress >= COMPLETE ? new Date().toISOString() : null;
}

const dateOf = (timestamp: string) => toIsoDate(new Date(timestamp));

const byCreation = (a: { createdAt: string }, b: { createdAt: string }) => a.createdAt.localeCompare(b.createdAt);

function toChildNode(child: ChildTask, today: string): ChildTaskNode {
  const isOpen = !child.completedAt;
  return {
    ...child,
    startDate: dateOf(child.createdAt),
    endDate: child.completedAt ? dateOf(child.completedAt) : today,
    isOpen,
  };
}

function groupChildrenByParent(children: ChildTaskNode[]): Map<string, ChildTaskNode[]> {
  const groups = new Map<string, ChildTaskNode[]>();
  for (const child of [...children].sort(byCreation)) {
    const siblings = groups.get(child.parentId) ?? [];
    siblings.push(child);
    groups.set(child.parentId, siblings);
  }
  return groups;
}

/** La padre va desde su creación hasta el cierre de su última hija (o hasta hoy si alguna sigue abierta). */
function toParentNode(parent: ParentTask, children: ChildTaskNode[], today: string): ParentTaskNode {
  const progress = calculateParentProgress(children);
  const isOpen = children.length === 0 || children.some((child) => child.isOpen);
  const startDate = children.reduce((date, child) => minDate(date, child.startDate), dateOf(parent.createdAt));
  const endDate = isOpen ? today : children.reduce((date, child) => maxDate(date, child.endDate), startDate);

  return { ...parent, children, progress, startDate, endDate, isOpen };
}

export function buildTaskTree({ parents, children }: TaskSnapshot): ParentTaskNode[] {
  const today = todayIso();
  const childrenByParent = groupChildrenByParent(children.map((child) => toChildNode(child, today)));
  return [...parents]
    .sort(byCreation)
    .map((parent) => toParentNode(parent, childrenByParent.get(parent.id) ?? [], today));
}

export function summarizeProgress(tree: ParentTaskNode[]): ProgressSummary {
  const allChildren = tree.flatMap((parent) => parent.children);
  const overallProgress = tree.length
    ? Math.round(tree.reduce((sum, parent) => sum + parent.progress, 0) / tree.length)
    : 0;

  return {
    overallProgress,
    parentCount: tree.length,
    childCount: allChildren.length,
    completedChildren: allChildren.filter((child) => getTaskStatus(child.progress) === 'completed').length,
    notStartedChildren: allChildren.filter((child) => getTaskStatus(child.progress) === 'notStarted').length,
  };
}
