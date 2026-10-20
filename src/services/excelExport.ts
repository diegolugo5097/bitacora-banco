import * as XLSX from 'xlsx';
import { getTaskStatus, STATUS_LABELS } from '@/domain/progress';
import type { ParentTaskNode } from '@/domain/task.types';
import { parseIsoDate, todayIso } from '@/utils/date';

const PERCENT_FORMAT = '0%';
const DATE_FORMAT = 'dd/mm/yyyy';
const DATE_COLUMNS = new Set(['Inicio', 'Completada']);

/** Las tareas abiertas no tienen fecha de cierre: la celda queda vacía. */
const closingDate = (task: { isOpen: boolean; endDate: string }) => (task.isOpen ? '' : parseIsoDate(task.endDate));

function summaryRows(tree: ParentTaskNode[]) {
  return tree.map((parent) => ({
    'Tarea padre': parent.name,
    Descripción: parent.description,
    Inicio: parseIsoDate(parent.startDate),
    Completada: closingDate(parent),
    'Tareas hijas': parent.children.length,
    Avance: parent.progress / 100,
    Estado: STATUS_LABELS[getTaskStatus(parent.progress)],
  }));
}

function detailRows(tree: ParentTaskNode[]) {
  return tree.flatMap((parent) =>
    parent.children.map((child) => ({
      'Tarea padre': parent.name,
      'Tarea hija': child.name,
      Descripción: child.description,
      Inicio: parseIsoDate(child.startDate),
      Completada: closingDate(child),
      Avance: child.progress / 100,
      Estado: STATUS_LABELS[getTaskStatus(child.progress)],
      'Actualizado por': child.updatedBy ?? '',
    })),
  );
}

/** Crea una hoja con anchos de columna y formato de fecha y porcentaje. */
function buildSheet(rows: Record<string, unknown>[], columnWidths: number[]): XLSX.WorkSheet {
  const sheet = XLSX.utils.json_to_sheet(rows, { cellDates: true });
  sheet['!cols'] = columnWidths.map((wch) => ({ wch }));

  const headers = Object.keys(rows[0] ?? {});
  const lastRow = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1').e.r;

  for (let row = 1; row <= lastRow; row++) {
    headers.forEach((header, column) => {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })];
      if (!cell) return;
      if (header === 'Avance') cell.z = PERCENT_FORMAT;
      if (DATE_COLUMNS.has(header)) cell.z = DATE_FORMAT;
    });
  }
  return sheet;
}

export function exportProgressReport(tree: ParentTaskNode[]): void {
  const workbook = XLSX.utils.book_new();
  const details = detailRows(tree);

  XLSX.utils.book_append_sheet(workbook, buildSheet(summaryRows(tree), [34, 48, 12, 12, 12, 10, 14]), 'Resumen');
  XLSX.utils.book_append_sheet(
    workbook,
    buildSheet(details.length ? details : [{ 'Tarea padre': '', 'Tarea hija': '' }], [30, 30, 48, 12, 12, 10, 14, 20]),
    'Detalle',
  );

  XLSX.writeFile(workbook, `reporte-avances-${todayIso()}.xlsx`);
}
