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
  /** Sigue abierta: la barra llega hasta hoy. */
  isOpen: boolean;
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

export function flattenTree(tree: ParentTaskNode[]): GanttRowData[] {
  return tree.flatMap((parent) => [toRow(parent, 'parent'), ...parent.children.map((child) => toRow(child, 'child'))]);
}

function toRow(task: Omit<GanttRowData, 'kind'>, kind: GanttRowData['kind']): GanttRowData {
  const { id, name, startDate, endDate, progress, isOpen } = task;
  return { id, name, kind, startDate, endDate, progress, isOpen };
}

/** Marca el primer día de cada mes y cada lunes. */
function buildTicks(start: Date, totalDays: number): GanttTick[] {
  const ticks: GanttTick[] = [];
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const date = new Date(start.getTime() + dayIndex * DAY_MS);
    if (date.getDate() === 1) {
      ticks.push({ dayIndex, label: `${monthLabel(date)} ${date.getFullYear()}`, isMonthStart: true });
    } else if (date.getDay() === 1) {
      ticks.push({ dayIndex, label: `${date.getDate()} ${monthLabel(date)}`, isMonthStart: false });
    }
  }
  return ticks;
}

export function buildGanttScale(rows: GanttRowData[]): GanttScale {
  const earliest = rows.reduce((date, row) => minDate(date, row.startDate), rows[0].startDate);
  const latest = rows.reduce((date, row) => maxDate(date, row.endDate), rows[0].endDate);

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
