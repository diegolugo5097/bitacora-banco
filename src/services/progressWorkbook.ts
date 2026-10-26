import ExcelJS from 'exceljs';
import { COMPLIANCE_LABELS, dateOf, getTaskStatus, STATUS_LABELS } from '@/domain/progress';
import type { ChildTaskNode, IsoDate, ParentTaskNode } from '@/domain/task.types';
import { progressHex } from '@/utils/progressColor';

const COLORS = {
  brand: 'FFFDDA24',
  ink: 'FF2C2A29',
  line: 'FFE0E0E0',
  red: 'FFE2231A',
  redSoft: 'FFFDECEA',
  green: 'FF1E8E3E',
  muted: 'FF808080',
};

const DATE_FORMAT = 'dd/mm/yyyy';
const PERCENT_FORMAT = '0%';
const MISSING_JUSTIFICATION = 'Sin justificar';

const argb = (hex: string) => `FF${hex.replace('#', '').toUpperCase()}`;
const solidFill = (color: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: color } });

/** Excel guarda fechas sin zona horaria: se construyen en UTC para que no se corran un día. */
function excelDate(date: IsoDate): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

const completedOn = (child: ChildTaskNode) => (child.completedAt ? excelDate(dateOf(child.completedAt)) : null);

function styleHeader(sheet: ExcelJS.Worksheet): void {
  const header = sheet.getRow(1);
  header.height = 22;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COLORS.ink } };
    cell.fill = solidFill(COLORS.brand);
    cell.alignment = { vertical: 'middle' };
    cell.border = { bottom: { style: 'medium', color: { argb: COLORS.ink } } };
  });
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
}

function styleDates(row: ExcelJS.Row, keys: string[]): void {
  keys.forEach((key) => (row.getCell(key).numFmt = DATE_FORMAT));
}

/** La celda de avance se pinta con el mismo color de la app: gris en 0 %, verde en 100 %. */
function styleProgress(cell: ExcelJS.Cell, progress: number): void {
  cell.numFmt = PERCENT_FORMAT;
  cell.fill = solidFill(argb(progressHex(progress)));
  cell.font = { bold: true, color: { argb: progress >= 60 ? 'FFFFFFFF' : COLORS.ink } };
  cell.alignment = { horizontal: 'center' };
}

function addSummarySheet(workbook: ExcelJS.Workbook, tree: ParentTaskNode[]): void {
  const sheet = workbook.addWorksheet('Resumen');
  sheet.columns = [
    { header: 'Tarea padre', key: 'name', width: 34 },
    { header: 'Descripción', key: 'description', width: 44 },
    { header: 'Fecha inicio', key: 'start', width: 13 },
    { header: 'Fin previsto', key: 'end', width: 13 },
    { header: 'Tareas hijas', key: 'children', width: 12 },
    { header: 'No cumplidas', key: 'unmet', width: 13 },
    { header: 'Avance', key: 'progress', width: 10 },
    { header: 'Estado', key: 'status', width: 13 },
  ];

  tree.forEach((parent) => {
    const row = sheet.addRow({
      name: parent.name,
      description: parent.description,
      start: excelDate(parent.startDate),
      end: parent.children.length ? excelDate(parent.endDate) : null,
      children: parent.children.length,
      unmet: parent.unmetCount,
      progress: parent.progress / 100,
      status: STATUS_LABELS[getTaskStatus(parent.progress)],
    });
    styleDates(row, ['start', 'end']);
    styleProgress(row.getCell('progress'), parent.progress);
    if (parent.unmetCount > 0) row.getCell('unmet').font = { bold: true, color: { argb: COLORS.red } };
  });

  styleHeader(sheet);
}

/** Fila no cumplida: margen roja en la primera columna y cumplimiento resaltado. */
function styleUnmetRow(row: ExcelJS.Row, hasJustification: boolean): void {
  const red = { argb: COLORS.red };
  row.getCell('parent').border = { left: { style: 'thick', color: red } };
  const compliance = row.getCell('compliance');
  compliance.font = { bold: true, color: red };
  compliance.fill = solidFill(COLORS.redSoft);
  if (!hasJustification) row.getCell('justification').font = { italic: true, color: red };
}

function addDetailSheet(workbook: ExcelJS.Workbook, tree: ParentTaskNode[]): void {
  const sheet = workbook.addWorksheet('Detalle');
  sheet.columns = [
    { header: 'Tarea padre', key: 'parent', width: 28 },
    { header: 'Tarea hija', key: 'name', width: 30 },
    { header: 'Descripción', key: 'description', width: 36 },
    { header: 'Fecha final', key: 'due', width: 13 },
    { header: 'Terminada el', key: 'completed', width: 14 },
    { header: 'Avance', key: 'progress', width: 10 },
    { header: 'Cumplimiento', key: 'compliance', width: 15 },
    { header: 'Justificación', key: 'justification', width: 50 },
    { header: 'Actualizado por', key: 'updatedBy', width: 18 },
  ];

  tree.forEach((parent) =>
    parent.children.forEach((child) => {
      const isUnmet = child.compliance === 'unmet';
      const justification = child.justification?.trim() ?? '';
      const row = sheet.addRow({
        parent: parent.name,
        name: child.name,
        description: child.description,
        due: child.dueDate ? excelDate(child.dueDate) : null,
        completed: completedOn(child),
        progress: child.progress / 100,
        compliance: COMPLIANCE_LABELS[child.compliance],
        justification: justification || (isUnmet ? MISSING_JUSTIFICATION : ''),
        updatedBy: child.updatedBy ?? '',
      });

      styleDates(row, ['due', 'completed']);
      styleProgress(row.getCell('progress'), child.progress);
      row.getCell('justification').alignment = { wrapText: true, vertical: 'top' };
      if (child.compliance === 'met') row.getCell('compliance').font = { bold: true, color: { argb: COLORS.green } };
      if (isUnmet) styleUnmetRow(row, justification !== '');
    }),
  );

  styleHeader(sheet);
}

export function buildProgressWorkbook(tree: ParentTaskNode[]): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Bitácora de Avances';
  workbook.created = new Date();
  addSummarySheet(workbook, tree);
  addDetailSheet(workbook, tree);
  return workbook;
}
