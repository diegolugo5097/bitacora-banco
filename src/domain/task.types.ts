/** Fecha de calendario en formato ISO `yyyy-mm-dd`. */
export type IsoDate = string;

export type TaskKind = 'parent' | 'child';

interface AuditFields {
  /** Momento de creación (ISO). */
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ParentTask extends AuditFields {
  id: string;
  name: string;
  description: string;
  /** Fecha de inicio. Las tareas creadas antes de existir este campo usan su fecha de creación. */
  startDate?: IsoDate;
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
  /** Fecha límite para terminarla. */
  dueDate?: IsoDate;
  /** Por qué no se cumplió a tiempo. */
  justification?: string;
}

/**
 * - `met`: llegó al 100 % a tiempo.
 * - `unmet`: se venció sin terminar, o se terminó después de la fecha final.
 * - `onTrack`: todavía no vence.
 * - `noDueDate`: tarea antigua sin fecha final.
 */
export type ComplianceStatus = 'met' | 'unmet' | 'onTrack' | 'noDueDate';

export interface ChildTaskNode extends ChildTask {
  startDate: IsoDate;
  /** Fecha final planeada (o, en tareas antiguas, la de cierre u hoy). */
  endDate: IsoDate;
  compliance: ComplianceStatus;
  /** Si no se cumplió: hasta dónde llegó el retraso (fecha de cierre real u hoy). */
  overrunEnd: IsoDate | null;
}

/** Tarea padre lista para mostrar: incluye sus hijas, su avance y sus fechas. */
export interface ParentTaskNode extends ParentTask {
  startDate: IsoDate;
  /** La fecha final más lejana entre sus hijas (incluyendo retrasos). */
  endDate: IsoDate;
  children: ChildTaskNode[];
  progress: number;
  unmetCount: number;
}

export type TaskStatus = 'completed' | 'inProgress' | 'notStarted';

/** Datos que el usuario escribe en el formulario. Cada tipo de tarea usa solo su fecha. */
export interface TaskDraft {
  name: string;
  description: string;
  progress: number;
  /** Solo tareas padre. */
  startDate: IsoDate;
  /** Solo tareas hijas. */
  dueDate: IsoDate;
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
  unmetChildren: number;
}
