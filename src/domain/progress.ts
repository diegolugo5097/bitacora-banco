import type {
  ChildTask,
  ChildTaskNode,
  ComplianceStatus,
  IsoDate,
  ParentTask,
  ParentTaskNode,
  ProgressSummary,
  TaskSnapshot,
  TaskStatus,
} from './task.types';
import { maxDate, minDate, toIsoDate, todayIso } from '@/utils/date';

export const COMPLETE = 100;

/** Fecha local (yyyy-mm-dd) de un momento ISO. */
export const dateOf = (timestamp: string): IsoDate => toIsoDate(new Date(timestamp));

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

export function getCompliance(
  child: Pick<ChildTask, 'dueDate' | 'completedAt'>,
  today: IsoDate = todayIso(),
): ComplianceStatus {
  if (!child.dueDate) return 'noDueDate';
  if (child.completedAt) return dateOf(child.completedAt) <= child.dueDate ? 'met' : 'unmet';
  return today > child.dueDate ? 'unmet' : 'onTrack';
}

export const COMPLIANCE_LABELS: Record<ComplianceStatus, string> = {
  met: 'Cumplida',
  unmet: 'No cumplida',
  onTrack: 'En plazo',
  noDueDate: 'Sin fecha final',
};

/** Momento de cierre al guardar un avance: se fija al llegar a 100 % y se borra si baja. */
export function completionTimestamp(progress: number): string | null {
  return progress >= COMPLETE ? new Date().toISOString() : null;
}

const byCreation = (a: { createdAt: string }, b: { createdAt: string }) => a.createdAt.localeCompare(b.createdAt);

/** Hijas ordenadas por fecha final; las que no tienen fecha van al final. */
function byDueDate(a: ChildTask, b: ChildTask): number {
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate && !b.dueDate) return -1;
  if (!a.dueDate && b.dueDate) return 1;
  return byCreation(a, b);
}

/**
 * La hija empieza cuando se registró (nunca antes del inicio de su padre)
 * y termina en su fecha final. Si no se cumplió, el retraso llega hasta su cierre real u hoy.
 */
function toChildNode(child: ChildTask, parentStart: IsoDate, today: IsoDate): ChildTaskNode {
  const compliance = getCompliance(child, today);
  const closedOn = child.completedAt ? dateOf(child.completedAt) : null;
  const endDate = child.dueDate ?? closedOn ?? today;
  const startDate = minDate(maxDate(dateOf(child.createdAt), parentStart), endDate);
  const overrunEnd = compliance === 'unmet' ? (closedOn ?? today) : null;

  return { ...child, startDate, endDate, compliance, overrunEnd };
}

function toParentNode(parent: ParentTask, children: ChildTask[], today: IsoDate): ParentTaskNode {
  const startDate = parent.startDate ?? dateOf(parent.createdAt);
  const childNodes = [...children].sort(byDueDate).map((child) => toChildNode(child, startDate, today));
  const endDate = childNodes.reduce((date, child) => maxDate(date, child.overrunEnd ?? child.endDate), startDate);

  return {
    ...parent,
    startDate,
    endDate,
    children: childNodes,
    progress: calculateParentProgress(childNodes),
    unmetCount: childNodes.filter((child) => child.compliance === 'unmet').length,
  };
}

function groupChildrenByParent(children: ChildTask[]): Map<string, ChildTask[]> {
  const groups = new Map<string, ChildTask[]>();
  for (const child of children) {
    const siblings = groups.get(child.parentId) ?? [];
    siblings.push(child);
    groups.set(child.parentId, siblings);
  }
  return groups;
}

export function buildTaskTree({ parents, children }: TaskSnapshot, today: IsoDate = todayIso()): ParentTaskNode[] {
  const childrenByParent = groupChildrenByParent(children);
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
    completedChildren: allChildren.filter((child) => child.progress >= COMPLETE).length,
    unmetChildren: allChildren.filter((child) => child.compliance === 'unmet').length,
  };
}
