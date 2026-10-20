import type { IsoDate } from '@/domain/task.types';

export const DAY_MS = 86_400_000;

const MONTH_LABELS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function parseIsoDate(value: IsoDate): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): IsoDate {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayIso(): IsoDate {
  return toIsoDate(new Date());
}

export function addDays(value: IsoDate, amount: number): IsoDate {
  return toIsoDate(new Date(parseIsoDate(value).getTime() + amount * DAY_MS));
}

/** Días calendario entre dos fechas, contando ambos extremos. */
export function inclusiveDayCount(start: IsoDate, end: IsoDate): number {
  return Math.round((parseIsoDate(end).getTime() - parseIsoDate(start).getTime()) / DAY_MS) + 1;
}

export function formatShortDate(value: IsoDate): string {
  if (!value) return '—';
  return parseIsoDate(value).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

export function monthLabel(date: Date): string {
  return MONTH_LABELS[date.getMonth()];
}

export function minDate(a: IsoDate, b: IsoDate): IsoDate {
  return a < b ? a : b;
}

export function maxDate(a: IsoDate, b: IsoDate): IsoDate {
  return a > b ? a : b;
}

export function formatRelativeTime(timestamp?: string): string {
  if (!timestamp) return '';
  const minutes = Math.round((Date.now() - new Date(timestamp).getTime()) / 60_000);
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return new Date(timestamp).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}
