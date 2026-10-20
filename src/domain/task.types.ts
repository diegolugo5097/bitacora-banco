/** Fecha de calendario en formato ISO `yyyy-mm-dd`. */
export type IsoDate = string;

interface AuditFields {
  /** Momento de creación (ISO). Marca el inicio de la tarea. */
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ParentTask extends AuditFields {
  id: string;
  name: string;
  description: string;
}

export interface ChildTask extends AuditFields {
  id: string;
  parentId: string;
  name: string;
  description: string;
  /** Porcentaje de avance, de 0 a 100. */
  progress: number;
  /** Momento en que llegó al 100 % (ISO), o `null` si sigue abierta. */
  completedAt: string | null;
}

/** Fechas calculadas: nadie las escribe, salen de la creación y del cierre. */
interface Timeline {
  startDate: IsoDate;
  /** Fecha de cierre, o hoy si la tarea sigue abierta. */
  endDate: IsoDate;
  isOpen: boolean;
}

export type ChildTaskNode = ChildTask & Timeline;

/** Tarea padre lista para mostrar: incluye sus hijas, su avance y sus fechas. */
export interface ParentTaskNode extends ParentTask, Timeline {
  children: ChildTaskNode[];
  progress: number;
}

export type TaskStatus = 'completed' | 'inProgress' | 'notStarted';

/** Datos que el usuario escribe en el formulario. */
export interface TaskDraft {
  name: string;
  description: string;
  progress: number;
}

export interface TaskSnapshot {
  parents: ParentTask[];
  children: ChildTask[];
}

export interface ProgressSummary {
  overallProgress: number;
  parentCount: number;
  childCount: number;
  completedChildren: number;
  notStartedChildren: number;
}
