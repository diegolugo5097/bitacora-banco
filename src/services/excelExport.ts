import type { ParentTaskNode } from '@/domain/task.types';
import { todayIso } from '@/utils/date';
import { buildProgressWorkbook } from './progressWorkbook';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportProgressReport(tree: ParentTaskNode[]): Promise<void> {
  const buffer = await buildProgressWorkbook(tree).xlsx.writeBuffer();
  downloadBlob(new Blob([buffer], { type: XLSX_MIME }), `reporte-avances-${todayIso()}.xlsx`);
}
