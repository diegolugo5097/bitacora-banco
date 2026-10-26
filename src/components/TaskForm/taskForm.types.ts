import type { ChildTaskNode, ParentTaskNode, TaskDraft, TaskKind } from '@/domain/task.types';

export type { TaskKind } from '@/domain/task.types';

export type EditTarget = { kind: 'parent'; task: ParentTaskNode } | { kind: 'child'; task: ChildTaskNode };

export type TaskFormSubmit = (values: { kind: TaskKind; parentId: string; draft: TaskDraft }) => Promise<boolean>;
