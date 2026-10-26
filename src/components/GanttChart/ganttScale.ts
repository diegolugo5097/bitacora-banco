import type { IsoDate, ParentTaskNode } from '@/domain/task.types';
import { DAY_MS, inclusiveDayCount, maxDate, minDate, monthLabel, parseIsoDate, toIsoDate, todayIso } from '@/utils/date';

/** Días de margen antes de la primera tarea y después de la última. */
const PADDING_BEFORE_DAYS = 2;
const PADDING_AFTER_DAYS = 3;

export interface GanttRowData {
  id: string;
  name: string;
  kind: 'parent' | 'child';
  startDate: IsoDate;
  endDate: IsoDate;
  progress: number;
  /** Solo hijas no cumplidas: hasta dónde llegó el retraso después de la fecha final. */
  overrunEnd: IsoDate | null;
}

export interface GanttTick {
  dayIndex: number;
  label: string;
  isMonthStart: boolean;
}

export interface GanttScale {
  totalDays: number;
  ticks: GanttTick[];
  /** Posición de una fecha como porcentaje del ancho total. */
  offsetPercent: (date: IsoDate) => number;
  /** Ancho de un rango de fechas como porcentaje del ancho total. */
  widthPercent: (start: IsoDate, end: IsoDate) => number;
  todayPercent: number | null;
}

/** La barra de la padre ya incluye los retrasos de sus hijas; solo las hijas dibujan el tramo rojo. */
export function flattenTree(tree: ParentTaskNode[]): GanttRowData[] {
  return tree.flatMap((parent) => [
    { ...pickRow(parent), kind: 'parent' as const, overrunEnd: null },
    ...parent.children.map((child) => ({ ...pickRow(child), kind: 'child' as const, overrunEnd: child.overrunEnd })),
  ]);
}

function pickRow({ id, name, startDate, endDate, progress }: Omit<GanttRowData, 'kind' | 'overrunEnd'>) {
  return { id, name, startDate, endDate, progress };
}

/** Último día que ocupa una fila, contando el retraso. */
export const rowEnd = (row: GanttRowData): IsoDate => row.overrunEnd ?? row.endDate;

/** Días mínimos entre un lunes y el inicio de mes para que sus etiquetas no se monten. */
const MIN_TICK_GAP_DAYS = 4;

function isNearMonthStart(date: Date): boolean {
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const daysSinceStart = date.getDate() - 1;
  const daysUntilNext = daysInMonth - date.getDate() + 1;
  return daysSinceStart < MIN_TICK_GAP_DAYS || daysUntilNext < MIN_TICK_GAP_DAYS;
}

/** Marca el primer día de cada mes y los lunes que no queden pegados a él. */
function buildTicks(start: Date, totalDays: number): GanttTick[] {
  const ticks: GanttTick[] = [];
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const date = new Date(start.getTime() + dayIndex * DAY_MS);
    if (date.getDate() === 1) {
      ticks.push({ dayIndex, label: `${monthLabel(date)} ${date.getFullYear()}`, isMonthStart: true });
    } else if (date.getDay() === 1 && !isNearMonthStart(date)) {
      ticks.push({ dayIndex, label: `${date.getDate()} ${monthLabel(date)}`, isMonthStart: false });
    }
  }
  return ticks;
}

export function buildGanttScale(rows: GanttRowData[]): GanttScale {
  const earliest = rows.reduce((date, row) => minDate(date, row.startDate), rows[0].startDate);
  const latest = rows.reduce((date, row) => maxDate(date, rowEnd(row)), rowEnd(rows[0]));

  const start = new Date(parseIsoDate(earliest).getTime() - PADDING_BEFORE_DAYS * DAY_MS);
  const end = new Date(parseIsoDate(latest).getTime() + PADDING_AFTER_DAYS * DAY_MS);
  const startIso = toIsoDate(start);
  const endIso = toIsoDate(end);
  const totalDays = inclusiveDayCount(startIso, endIso);

  const offsetPercent = (date: IsoDate) => ((inclusiveDayCount(startIso, date) - 1) / totalDays) * 100;
  const widthPercent = (from: IsoDate, to: IsoDate) => (inclusiveDayCount(from, to) / totalDays) * 100;

  const today = todayIso();
  const todayPercent = today >= startIso && today <= endIso ? offsetPercent(today) : null;

  return { totalDays, ticks: buildTicks(start, totalDays), offsetPercent, widthPercent, todayPercent };
}
