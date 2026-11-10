// Exports admin tables (orders, sales, customers) to an .xlsx file.
// exceljs is loaded on demand so it never weighs on the public site bundle.

export type ExcelColumn<T> = {
  header: string;
  width?: number;
  value: (row: T) => string | number | Date | null | undefined;
  /** Excel number format, e.g. '"$"#,##0.00' or 'dd/mm/yyyy hh:mm' */
  format?: string;
};

export const MONEY_FORMAT = '"$"#,##0.00';
export const DATE_FORMAT = 'mm/dd/yyyy hh:mm';

/** Builds a one-sheet workbook and downloads it. */
export async function downloadExcel<T>(filename: string, sheetName: string, columns: ExcelColumn<T>[], rows: T[]) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Alexandra Jewelry';
  const ws = wb.addWorksheet(sheetName, { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = columns.map((c) => ({ header: c.header, width: c.width ?? 16, style: c.format ? { numFmt: c.format } : {} }));

  const header = ws.getRow(1);
  header.height = 22;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } };
    cell.alignment = { vertical: 'middle' };
  });
  for (const row of rows) ws.addRow(columns.map((c) => c.value(row) ?? ''));
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** "pedidos_2026-11-09.xlsx" */
export const datedName = (base: string) => `${base}_${new Date().toISOString().slice(0, 10)}.xlsx`;
