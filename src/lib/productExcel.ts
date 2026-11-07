// Excel template and parser for the bulk product import.
// exceljs is loaded on demand so it never weighs on the public site bundle.
import type { Category, Subcategory } from '../types';

export type BulkProductRow = {
  row: number; // spreadsheet row, used in error messages
  code: string;
  name: string;
  description: string;
  categoryId: number;
  subcategoryId: number;
  price: number;
  cost: number | null;
  tax: number;
  stock: number;
  minStock: number;
  featured: boolean;
  active: boolean;
};

type ColumnKey = Exclude<keyof BulkProductRow, 'row'>;
type Column = { key: ColumnKey; header: string; required: boolean; width: number; note: string };

// Only Spanish text: the site is translated in the browser and the API builds the slug.
export const PRODUCT_COLUMNS: Column[] = [
  { key: 'code', header: 'Código', required: true, width: 14, note: 'Código único del producto (ej. AN-001). No puede repetirse.' },
  { key: 'name', header: 'Nombre', required: true, width: 34, note: 'Nombre en español. La tienda se traduce automáticamente con Google Translate.' },
  { key: 'description', header: 'Descripción', required: false, width: 48, note: 'Descripción en español (opcional).' },
  { key: 'categoryId', header: 'ID Categoría', required: true, width: 14, note: 'Número de ID. Consulta la hoja "Categorías".' },
  { key: 'subcategoryId', header: 'ID Subcategoría', required: true, width: 16, note: 'Número de ID. Debe pertenecer a la categoría elegida. Consulta la hoja "Subcategorías".' },
  { key: 'price', header: 'Precio (USD)', required: true, width: 13, note: 'Precio de venta. Usa punto o coma decimal.' },
  { key: 'cost', header: 'Costo (USD)', required: false, width: 13, note: 'Costo interno (opcional). No se muestra en la tienda.' },
  { key: 'tax', header: 'Impuesto (%)', required: false, width: 13, note: 'Porcentaje de impuesto. Vacío = 0.' },
  { key: 'stock', header: 'Stock', required: false, width: 9, note: 'Unidades disponibles (número entero). Vacío = 0.' },
  { key: 'minStock', header: 'Stock mínimo', required: false, width: 13, note: 'Alerta de stock bajo (número entero). Vacío = 0.' },
  { key: 'featured', header: 'Destacado', required: false, width: 11, note: 'SI o NO. Vacío = NO.' },
  { key: 'active', header: 'Activo', required: false, width: 9, note: 'SI o NO. Vacío = SI.' },
];

const SHEET_PRODUCTS = 'Productos';
const SHEET_CATEGORIES = 'Categorías';
const SHEET_SUBCATEGORIES = 'Subcategorías';
const TEMPLATE_ROWS = 500;

const GOLD = 'FFC9A45D';
const DARK = 'FF1A1A1A';
const SOFT = 'FFF5EFE3';

const colLetter = (index: number) => String.fromCharCode(65 + index); // fine for < 26 columns
const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function loadExcel() {
  const mod = await import('exceljs');
  return (mod.default ?? mod) as typeof import('exceljs');
}

// ─── Template ────────────────────────────────────────────────────────────────

export async function downloadProductTemplate(categories: Category[], subcategories: Subcategory[]) {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Alexandra Jewelry';

  const cats = [...categories].sort((a, b) => a.id - b.id);
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const subs = [...subcategories].sort((a, b) => a.categoryId - b.categoryId || a.id - b.id);

  const styleHeader = (row: import('exceljs').Row, fill = DARK) => {
    row.height = 22;
    row.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
      cell.alignment = { vertical: 'middle' };
    });
  };

  // Sheet 1 — products to fill in
  const ws = wb.addWorksheet(SHEET_PRODUCTS, { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = [
    ...PRODUCT_COLUMNS.map((c) => ({ header: c.required ? `${c.header} *` : c.header, key: c.key, width: c.width })),
    // Read-only helpers: show the name behind the IDs typed in the row
    { header: '→ Categoría', key: 'catRef', width: 20 },
    { header: '→ Subcategoría', key: 'subRef', width: 20 },
  ];
  styleHeader(ws.getRow(1));
  PRODUCT_COLUMNS.forEach((c, i) => {
    const cell = ws.getRow(1).getCell(i + 1);
    if (c.required) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
    cell.note = c.note;
  });
  const refStart = PRODUCT_COLUMNS.length + 1;
  ws.getRow(1).getCell(refStart).note = 'Columna de ayuda: se completa sola. No se importa.';
  ws.getRow(1).getCell(refStart + 1).note = 'Columna de ayuda: se completa sola. No se importa.';

  const col = (key: ColumnKey) => colLetter(PRODUCT_COLUMNS.findIndex((c) => c.key === key));
  const catList = `'${SHEET_CATEGORIES}'!$A$2:$A$${Math.max(cats.length + 1, 2)}`;
  const subList = `'${SHEET_SUBCATEGORIES}'!$A$2:$A$${Math.max(subs.length + 1, 2)}`;
  const decimal = { type: 'decimal' as const, operator: 'greaterThanOrEqual' as const, formulae: [0], allowBlank: true, showErrorMessage: true, errorTitle: 'Valor inválido', error: 'Debe ser un número mayor o igual a 0.' };
  const whole = { ...decimal, type: 'whole' as const, error: 'Debe ser un número entero mayor o igual a 0.' };
  const yesNo = { type: 'list' as const, formulae: ['"SI,NO"'], allowBlank: true, showErrorMessage: true, errorTitle: 'Valor inválido', error: 'Escribe SI o NO.' };

  for (let r = 2; r <= TEMPLATE_ROWS + 1; r++) {
    ws.getCell(`${col('categoryId')}${r}`).dataValidation = { type: 'list', formulae: [catList], allowBlank: true, showErrorMessage: true, errorTitle: 'Categoría inválida', error: `Elige un ID de la hoja "${SHEET_CATEGORIES}".` };
    ws.getCell(`${col('subcategoryId')}${r}`).dataValidation = { type: 'list', formulae: [subList], allowBlank: true, showErrorMessage: true, errorTitle: 'Subcategoría inválida', error: `Elige un ID de la hoja "${SHEET_SUBCATEGORIES}".` };
    for (const key of ['price', 'cost', 'tax'] as const) ws.getCell(`${col(key)}${r}`).dataValidation = decimal;
    for (const key of ['stock', 'minStock'] as const) ws.getCell(`${col(key)}${r}`).dataValidation = whole;
    for (const key of ['featured', 'active'] as const) ws.getCell(`${col(key)}${r}`).dataValidation = yesNo;
    for (const key of ['price', 'cost'] as const) ws.getCell(`${col(key)}${r}`).numFmt = '#,##0.00';
    // Text columns stay text, so codes like 0012 keep their leading zeros
    for (const key of ['code', 'name', 'description'] as const) ws.getCell(`${col(key)}${r}`).numFmt = '@';

    const catRef = ws.getCell(r, refStart);
    catRef.value = { formula: `IF(${col('categoryId')}${r}="","",IFERROR(VLOOKUP(${col('categoryId')}${r},'${SHEET_CATEGORIES}'!$A:$B,2,FALSE),"¡ID no existe!"))` };
    const subRef = ws.getCell(r, refStart + 1);
    subRef.value = { formula: `IF(${col('subcategoryId')}${r}="","",IFERROR(VLOOKUP(${col('subcategoryId')}${r},'${SHEET_SUBCATEGORIES}'!$A:$D,2,FALSE),"¡ID no existe!"))` };
    for (const cell of [catRef, subRef]) {
      cell.font = { italic: true, color: { argb: 'FF8A7A5A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT } };
    }
  }

  // Sheet 2 — category IDs
  const wsCat = wb.addWorksheet(SHEET_CATEGORIES, { views: [{ state: 'frozen', ySplit: 1 }] });
  wsCat.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Categoría', key: 'name', width: 30 },
    { header: 'Subcategorías (ID)', key: 'subs', width: 60 },
  ];
  styleHeader(wsCat.getRow(1), GOLD);
  for (const c of cats) {
    const own = subs.filter((s) => s.categoryId === c.id).map((s) => `${s.id} = ${s.name}`).join(' · ');
    wsCat.addRow({ id: c.id, name: c.name, subs: own || '(sin subcategorías)' });
  }

  // Sheet 3 — subcategory IDs, grouped by category
  const wsSub = wb.addWorksheet(SHEET_SUBCATEGORIES, { views: [{ state: 'frozen', ySplit: 1 }] });
  wsSub.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Subcategoría', key: 'name', width: 30 },
    { header: 'ID Categoría', key: 'categoryId', width: 14 },
    { header: 'Categoría', key: 'category', width: 30 },
  ];
  styleHeader(wsSub.getRow(1), GOLD);
  for (const s of subs) {
    wsSub.addRow({ id: s.id, name: s.name, categoryId: s.categoryId, category: catName.get(s.categoryId) ?? '—' });
  }
  for (const sheet of [wsCat, wsSub]) {
    sheet.getColumn(1).font = { bold: true };
    sheet.getColumn(1).alignment = { horizontal: 'center' };
  }

  // Sheet 4 — instructions
  const wsHelp = wb.addWorksheet('Instrucciones');
  wsHelp.columns = [{ width: 22 }, { width: 12 }, { width: 80 }];
  wsHelp.addRow(['Carga masiva de productos']).font = { bold: true, size: 14 };
  wsHelp.addRow([]);
  const tips = [
    '1. Llena una fila por producto en la hoja "Productos" (desde la fila 2). No cambies los encabezados.',
    '2. Escribe los textos solo en español: la tienda se traduce automáticamente con Google Translate y la URL (slug) la genera el sistema.',
    '3. En "ID Categoría" e "ID Subcategoría" va el número de ID, no el nombre. Búscalo en las hojas "Categorías" y "Subcategorías".',
    '4. Las columnas "→ Categoría" y "→ Subcategoría" muestran el nombre del ID que escribiste, para que lo verifiques.',
    '5. Las imágenes no van en el Excel: agrégalas después editando cada producto.',
    '6. Si alguna fila tiene errores no se importa nada; el sistema te indicará la fila y el problema.',
  ];
  for (const tip of tips) wsHelp.addRow([tip]).getCell(1).alignment = { wrapText: false };
  wsHelp.addRow([]);
  const head = wsHelp.addRow(['Columna', 'Obligatoria', 'Descripción']);
  head.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } };
  });
  for (const c of PRODUCT_COLUMNS) wsHelp.addRow([c.header, c.required ? 'Sí' : 'No', c.note]);
  wsHelp.addRow([]);
  wsHelp.addRow(['Ejemplo de fila:']).font = { bold: true };
  const example = wsHelp.addRow(['AN-001', 'Anillo de oro rosa', 'Anillo de 14k con circonia', cats[0]?.id ?? 1, subs.find((s) => s.categoryId === cats[0]?.id)?.id ?? 1, 120, 60, 15, 5, 1, 'NO', 'SI']);
  example.font = { color: { argb: 'FF666666' } };

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla_productos.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Parser ──────────────────────────────────────────────────────────────────

/** row = spreadsheet row; 0 when the problem is the whole file (missing columns, unreadable…). */
export type RowError = { row: number; message: string };
export type ParseOutcome = { rows: BulkProductRow[]; errors: RowError[] };

/** Plain value of a cell, whatever exceljs wraps it in (rich text, formula, hyperlink…). */
function cellValue(value: unknown): string | number | boolean | Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.trim() === '' ? null : value.trim();
  if (typeof value === 'number' || typeof value === 'boolean' || value instanceof Date) return value;
  if (typeof value === 'object') {
    const v = value as { richText?: { text: string }[]; result?: unknown; text?: unknown };
    if (v.richText) return cellValue(v.richText.map((t) => t.text).join(''));
    if ('result' in v) return cellValue(v.result);
    if (v.text !== undefined) return cellValue(v.text);
  }
  return null;
}

export async function parseProductFile(file: File, categories: Category[], subcategories: Subcategory[]): Promise<ParseOutcome> {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(await file.arrayBuffer());
  } catch {
    return { rows: [], errors: [{ row: 0, message: 'No se pudo leer el archivo. Usa la plantilla en formato .xlsx.' }] };
  }
  const ws = wb.getWorksheet(SHEET_PRODUCTS) ?? wb.worksheets[0];
  if (!ws) return { rows: [], errors: [{ row: 0, message: 'El archivo no tiene hojas.' }] };

  // Map header text → column number (tolerates accents, "*" and case)
  const byHeader = new Map<string, ColumnKey>();
  for (const c of PRODUCT_COLUMNS) {
    byHeader.set(normalize(c.header), c.key);
    byHeader.set(normalize(c.key), c.key);
  }
  const colOf = new Map<ColumnKey, number>();
  ws.getRow(1).eachCell((cell, colNumber) => {
    const key = byHeader.get(normalize(String(cellValue(cell.value) ?? '')));
    if (key && !colOf.has(key)) colOf.set(key, colNumber);
  });
  const missing = PRODUCT_COLUMNS.filter((c) => c.required && !colOf.has(c.key)).map((c) => c.header);
  if (missing.length) {
    return { rows: [], errors: [{ row: 0, message: `Faltan columnas obligatorias en la hoja "${ws.name}": ${missing.join(', ')}. Descarga la plantilla de nuevo.` }] };
  }

  const catIds = new Set(categories.map((c) => c.id));
  const subParent = new Map(subcategories.map((s) => [s.id, s.categoryId]));
  const rows: BulkProductRow[] = [];
  const errors: RowError[] = [];
  const seenCodes = new Map<string, number>();

  ws.eachRow({ includeEmpty: false }, (excelRow, r) => {
    if (r === 1) return;
    const get = (key: ColumnKey) => {
      const n = colOf.get(key);
      return n ? cellValue(excelRow.getCell(n).value) : null;
    };
    // Rows with only helper/formula cells count as empty
    if (PRODUCT_COLUMNS.every((c) => get(c.key) === null)) return;

    const rowErrors: string[] = [];
    const text = (key: ColumnKey) => {
      const v = get(key);
      return v === null ? '' : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).trim();
    };
    const number = (key: ColumnKey, label: string, opts: { required?: boolean; integer?: boolean; fallback: number | null }) => {
      const v = get(key);
      if (v === null) {
        if (opts.required) rowErrors.push(`${label} es obligatorio`);
        return opts.fallback;
      }
      const n = typeof v === 'number' ? v : Number(String(v).replace(/\s|\$/g, '').replace(',', '.'));
      if (!Number.isFinite(n) || n < 0) {
        rowErrors.push(`${label} debe ser un número mayor o igual a 0 (valor: "${String(v)}")`);
        return opts.fallback;
      }
      if (opts.integer && !Number.isInteger(n)) {
        rowErrors.push(`${label} debe ser un número entero`);
        return opts.fallback;
      }
      return n;
    };
    const yesNo = (key: ColumnKey, label: string, fallback: boolean) => {
      const v = get(key);
      if (v === null) return fallback;
      if (typeof v === 'boolean') return v;
      const s = normalize(String(v));
      if (['si', 's', 'yes', 'y', 'true', '1', 'x'].includes(s)) return true;
      if (['no', 'n', 'false', '0'].includes(s)) return false;
      rowErrors.push(`${label} debe ser SI o NO`);
      return fallback;
    };

    const code = text('code');
    const name = text('name');
    if (!code) rowErrors.push('Código es obligatorio');
    if (!name) rowErrors.push('Nombre es obligatorio');
    if (code.length > 60) rowErrors.push('Código admite máximo 60 caracteres');
    if (name.length > 200) rowErrors.push('Nombre admite máximo 200 caracteres');
    const description = text('description');
    if (description.length > 5000) rowErrors.push('Descripción admite máximo 5000 caracteres');

    const categoryId = number('categoryId', 'ID Categoría', { required: true, integer: true, fallback: null });
    const subcategoryId = number('subcategoryId', 'ID Subcategoría', { required: true, integer: true, fallback: null });
    if (categoryId !== null && !catIds.has(categoryId)) rowErrors.push(`la categoría ${categoryId} no existe (ver hoja "${SHEET_CATEGORIES}")`);
    if (subcategoryId !== null) {
      const parent = subParent.get(subcategoryId);
      if (parent === undefined) rowErrors.push(`la subcategoría ${subcategoryId} no existe (ver hoja "${SHEET_SUBCATEGORIES}")`);
      else if (categoryId !== null && catIds.has(categoryId) && parent !== categoryId) rowErrors.push(`la subcategoría ${subcategoryId} no pertenece a la categoría ${categoryId}`);
    }

    if (code) {
      const first = seenCodes.get(code);
      if (first) rowErrors.push(`el código "${code}" ya aparece en la fila ${first}`);
      else seenCodes.set(code, r);
    }

    const row: BulkProductRow = {
      row: r,
      code,
      name,
      description,
      categoryId: categoryId ?? 0,
      subcategoryId: subcategoryId ?? 0,
      price: number('price', 'Precio', { required: true, fallback: 0 }) ?? 0,
      cost: number('cost', 'Costo', { fallback: null }),
      tax: number('tax', 'Impuesto', { fallback: 0 }) ?? 0,
      stock: number('stock', 'Stock', { integer: true, fallback: 0 }) ?? 0,
      minStock: number('minStock', 'Stock mínimo', { integer: true, fallback: 0 }) ?? 0,
      featured: yesNo('featured', 'Destacado', false),
      active: yesNo('active', 'Activo', true),
    };

    if (rowErrors.length) errors.push({ row: r, message: rowErrors.join('; ') });
    else rows.push(row);
  });

  if (!rows.length && !errors.length) errors.push({ row: 0, message: `La hoja "${ws.name}" no tiene productos.` });
  return { rows, errors };
}
