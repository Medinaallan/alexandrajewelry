import { useCallback, useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, ImageIcon, Upload, Download, FileSpreadsheet } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAdmin } from '../../contexts/AdminContext';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { api } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Button } from '../../components/ui/Button';
import { MySwal } from '../../lib/swal';
import { formatPrice } from '../../utils/formatPrice';
import { downloadProductTemplate, parseProductFile, PRODUCT_COLUMNS, type BulkProductRow, type RowError } from '../../lib/productExcel';
import type { Category, Product, ProductImage, Subcategory } from '../../types';

type ProductForm = {
  code: string;
  name: string;
  nameEn: string;
  categoryId: number | '';
  subcategoryId: number | '';
  description: string;
  descriptionEn: string;
  cost: number | null;
  price: number;
  tax: number;
  stock: number;
  minStock: number;
  featured: boolean;
  active: boolean;
};

const BLANK: ProductForm = {
  code: '', name: '', nameEn: '', categoryId: '', subcategoryId: '',
  description: '', descriptionEn: '', cost: null, price: 0, tax: 0,
  stock: 0, minStock: 0, featured: false, active: true,
};

type PendingImage = { file: File; preview: string; filename: string };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.readAsDataURL(file);
  });
}

// ── Product add/edit form rendered inside MySwal ────────────────────────
type FormProps = { editing: Product | null; token: string; categories: { id: number; name: string }[]; subcategories: { id: number; name: string; categoryId: number; active: boolean }[]; onDone: () => void };
function ProductFormModal({ editing, token, categories, subcategories, onDone }: FormProps) {
  const [form, setForm] = useState<ProductForm>(
    editing ? {
      code: editing.code, name: editing.name, nameEn: editing.nameEn,
      categoryId: editing.categoryId, subcategoryId: editing.subcategoryId,
      description: editing.description, descriptionEn: editing.descriptionEn,
      cost: editing.cost ?? null, price: editing.price, tax: editing.tax,
      stock: editing.stock, minStock: editing.minStock ?? 0,
      featured: editing.featured, active: editing.active,
    } : BLANK
  );
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) api.admin.images.list(editing.id).then(setExistingImages).catch(() => {});
  }, [editing]);

  const filteredSubs = subcategories.filter(
    (s) => s.active && (form.categoryId === '' || s.categoryId === form.categoryId)
  );
  const set = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const payload = {
        code: form.code, name: form.name, nameEn: form.nameEn, slug,
        categoryId: form.categoryId as number, subcategoryId: form.subcategoryId as number,
        description: form.description, descriptionEn: form.descriptionEn,
        cost: form.cost, price: form.price, tax: form.tax,
        stock: form.stock, minStock: form.minStock,
        featured: form.featured, active: form.active,
      };
      let productId: number;
      if (editing) {
        // Stock also changes through sales and stock movements, so it is only
        // sent when it was edited here; otherwise a stale value would undo them.
        const { stock, ...rest } = payload;
        const changes = stock === editing.stock ? rest : payload;
        const updated = await api.admin.products.update(token, editing.id, changes);
        productId = updated.id;
      } else {
        const created = await api.admin.products.create(token, payload);
        productId = created.id;
      }
      for (let i = 0; i < pendingImages.length; i++) {
        const b64 = await fileToBase64(pendingImages[i].file);
        await api.admin.images.add(token, productId, { filename: pendingImages[i].filename, data: b64, displayOrder: existingImages.length + i });
      }
      onDone();
      Swal.close();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (imgId: number) => {
    await api.admin.images.delete(token, imgId);
    setExistingImages((prev) => prev.filter((i) => i.id !== imgId));
  };

  const handleDropFiles = useCallback((files: File[]) => {
    files.filter((f) => f.type.startsWith('image/')).forEach((file) => {
      const preview = URL.createObjectURL(file);
      setPendingImages((prev) => [...prev, { file, preview, filename: file.name }]);
    });
  }, []);

  return (
    <div className="flex flex-col gap-4 text-left">
      <p style={{ fontSize: '0.75rem', color: 'var(--gold)', background: 'rgba(201,164,93,0.08)', border: '1px solid rgba(201,164,93,0.2)', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem' }}>
        ✨ Escribe solo en <strong>español</strong>: la tienda se traduce automáticamente en el navegador con Google Translate.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Código">
          <input className="form-input" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="EJ-001" />
        </AdminField>
        <AdminField label="Nombre (ES)">
          <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nombre del producto" />
        </AdminField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Categoría">
          <select className="form-input" value={form.categoryId} onChange={(e) => { set('categoryId', Number(e.target.value) || ''); set('subcategoryId', ''); }}>
            <option value="">Seleccionar categoría</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </AdminField>
        <AdminField label="Subcategoría">
          <select className="form-input" value={form.subcategoryId} onChange={(e) => set('subcategoryId', Number(e.target.value) || '')}>
            <option value="">Seleccionar subcategoría</option>
            {filteredSubs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </AdminField>
      </div>
      <AdminField label="Descripción (ES)">
        <textarea className="form-input resize-none" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Descripción del producto" />
      </AdminField>
      <div className="grid grid-cols-3 gap-4">
        <AdminField label="Precio (USD)">
          <input type="number" min={0} step={0.01} className="form-input" value={form.price} onChange={(e) => set('price', Number(e.target.value))} />
        </AdminField>
        <AdminField label="Costo (USD)">
          <input type="number" min={0} step={0.01} className="form-input" value={form.cost ?? ''} onChange={(e) => set('cost', e.target.value ? Number(e.target.value) : null)} />
        </AdminField>
        <AdminField label="Impuesto (%)">
          <input type="number" min={0} step={0.01} className="form-input" value={form.tax} onChange={(e) => set('tax', Number(e.target.value))} />
        </AdminField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Stock">
          <input type="number" min={0} className="form-input" value={form.stock} onChange={(e) => set('stock', Number(e.target.value))} />
        </AdminField>
        <AdminField label="Stock mínimo">
          <input type="number" min={0} className="form-input" value={form.minStock} onChange={(e) => set('minStock', Number(e.target.value))} />
        </AdminField>
      </div>
      <AdminField label="Imágenes">
        <div className="flex flex-col gap-3">
          {(existingImages.length > 0 || pendingImages.length > 0) && (
            <div className="flex gap-2 flex-wrap">
              {existingImages.map((img) => (
                <div key={img.id} style={{ position: 'relative', width: 80, height: 80 }}>
                  <img src={img.data || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} />
                  <button type="button" onClick={() => { void handleDeleteImage(img.id); }} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                    <X size={10} />
                  </button>
                </div>
              ))}
              {pendingImages.map((img, i) => (
                <div key={`p-${i}`} style={{ position: 'relative', width: 80, height: 80 }}>
                  <img src={img.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', border: '1px solid rgba(201,164,93,0.5)', borderRadius: 'var(--radius)' }} />
                  <button type="button" onClick={() => setPendingImages((prev) => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                    <X size={10} />
                  </button>
                  <span style={{ position: 'absolute', bottom: 2, left: 2, background: 'rgba(201,164,93,0.9)', borderRadius: 2, fontSize: 8, padding: '1px 3px', color: 'white' }}>nuevo</span>
                </div>
              ))}
            </div>
          )}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleDropFiles(Array.from(e.dataTransfer.files)); }}
            onClick={() => document.getElementById('product-img-input')?.click()}
            style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-muted)' }}
          >
            <ImageIcon size={20} style={{ color: 'var(--text-muted)' }} />
            <span>Arrastra imágenes o haz clic para subir</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-subtle)' }}>PNG, JPG, WEBP · múltiples imágenes</span>
          </div>
          <input id="product-img-input" type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => { handleDropFiles(Array.from(e.target.files || [])); e.target.value = ''; }} />
        </div>
      </AdminField>
      <div className="flex flex-wrap gap-4">
        {([['active', 'Activo'], ['featured', 'Destacado']] as const).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => set(key, e.target.checked)} className="accent-(--gold)" />
            {label}
          </label>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="gold" onClick={handleSave} disabled={saving}>Guardar</Button>
        <Button variant="outline" onClick={() => Swal.close()}>Cancelar</Button>
      </div>
    </div>
  );
}

// ── Bulk import from Excel ───────────────────────────────────────────────
// Two steps: 1) verify the file (browser + database checks, nothing is saved)
//            2) the admin confirms and only the correct rows are processed.
const BULK_BATCH = 100; // must not exceed BULK_MAX in the API

type Verification = {
  valid: BulkProductRow[];
  errors: RowError[]; // one entry per row (row 0 = problem with the whole file)
};

type BulkProps = { token: string; categories: Category[]; subcategories: Subcategory[]; onDone: () => void };
function ProductBulkModal({ token, categories, subcategories, onDone }: BulkProps) {
  const [fileName, setFileName] = useState('');
  const [check, setCheck] = useState<Verification | null>(null);
  const [busy, setBusy] = useState<'' | 'template' | 'verifying' | 'processing'>('');
  const [progress, setProgress] = useState('');
  const [failure, setFailure] = useState('');

  const handleTemplate = async () => {
    setBusy('template');
    try {
      await downloadProductTemplate(categories, subcategories);
    } finally {
      setBusy('');
    }
  };

  // Step 1 — verify
  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setCheck(null);
    setFailure('');
    setBusy('verifying');
    try {
      const parsed = await parseProductFile(file, categories, subcategories);
      let valid = parsed.rows;
      const errors = [...parsed.errors];
      const fileProblem = errors.some((e) => e.row === 0);
      if (valid.length && !fileProblem) {
        // The database checks what the browser can't: codes that already exist
        const server = await api.admin.products.bulkVerify(token, valid);
        const byRow = new Map<number, string[]>();
        for (const e of server.errors) byRow.set(e.row, [...(byRow.get(e.row) ?? []), e.error]);
        for (const [row, msgs] of byRow) errors.push({ row, message: msgs.join('; ') });
        valid = valid.filter((r) => !byRow.has(r.row));
      }
      errors.sort((a, b) => a.row - b.row);
      setCheck({ valid: fileProblem ? [] : valid, errors });
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'No se pudo verificar el archivo.');
    } finally {
      setBusy('');
    }
  };

  // Step 2 — process the verified rows
  const handleProcess = async () => {
    if (!check) return;
    const rows = check.valid;
    setBusy('processing');
    setFailure('');
    let created = 0;
    try {
      for (let i = 0; i < rows.length; i += BULK_BATCH) {
        setProgress(`Procesando ${Math.min(i + BULK_BATCH, rows.length)} de ${rows.length}…`);
        const res = await api.admin.products.bulkCreate(token, rows.slice(i, i + BULK_BATCH));
        created += res.created;
      }
      onDone();
      const skipped = check.errors.filter((e) => e.row > 0).length;
      void Swal.fire({
        icon: 'success',
        title: 'Carga completada',
        html: `Se subieron <strong>${created}</strong> productos.` +
          (skipped ? `<br>${skipped} fila(s) con errores no se subieron; corrígelas y súbelas en otro archivo.` : '') +
          '<br><small>Recuerda agregar las imágenes editando cada producto.</small>',
        confirmButtonColor: '#c9a45d',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      if (created) onDone();
      setFailure(
        (created ? `Se subieron ${created} de ${rows.length} productos (hasta la fila ${rows[created - 1].row}) antes del error. ` : 'No se subió ningún producto. ') +
        message,
      );
      setCheck({ ...check, valid: rows.slice(created) });
    } finally {
      setBusy('');
      setProgress('');
    }
  };

  const mono = { fontFamily: 'monospace', color: 'var(--gold)', whiteSpace: 'nowrap' } as const;
  const box = (color: string) => ({
    fontSize: '0.75rem', borderRadius: 'var(--radius)', padding: '0.625rem 0.75rem',
    color, background: `color-mix(in srgb, ${color} 7%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
  });
  const rowErrors = check?.errors.filter((e) => e.row > 0) ?? [];
  const fileErrors = check?.errors.filter((e) => e.row === 0) ?? [];
  const total = (check?.valid.length ?? 0) + rowErrors.length;

  return (
    <div className="flex flex-col gap-4 text-left">
      <p style={{ fontSize: '0.75rem', color: 'var(--gold)', background: 'rgba(201,164,93,0.08)', border: '1px solid rgba(201,164,93,0.2)', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem' }}>
        ✨ Escribe solo en <strong>español</strong>: la tienda se traduce automáticamente en el navegador con Google Translate. El slug lo genera el sistema.
      </p>

      {!check && (
        <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <div className="grid" style={{ gridTemplateColumns: 'auto 1fr', gap: '0.125rem 1rem' }}>
            {PRODUCT_COLUMNS.map((c) => (
              <div key={c.key} className="contents">
                <span style={mono}>{c.header}{c.required ? ' *' : ''}</span>
                <span>{c.note}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.6875rem', opacity: 0.8 }}>
            La plantilla trae las hojas <strong>Categorías</strong> y <strong>Subcategorías</strong> con sus IDs. Las imágenes se agregan después, editando cada producto.
          </p>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        <span style={{ color: check ? 'var(--text-muted)' : 'var(--gold)', fontWeight: 600 }}>1. Verificar archivo</span>
        <span style={{ color: 'var(--text-subtle)' }}>→</span>
        <span style={{ color: check?.valid.length ? 'var(--gold)' : 'var(--text-subtle)', fontWeight: 600 }}>2. Procesar</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" onClick={() => { void handleTemplate(); }} disabled={busy !== ''}>
          <Download size={13} /> {busy === 'template' ? 'Generando…' : 'Descargar plantilla Excel'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => document.getElementById('product-bulk-input')?.click()} disabled={busy !== ''}>
          <FileSpreadsheet size={13} /> {busy === 'verifying' ? 'Verificando…' : check ? 'Subir otro archivo' : 'Seleccionar y verificar .xlsx'}
        </Button>
        <input id="product-bulk-input" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ''; }} />
      </div>

      {fileName && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Archivo: <strong>{fileName}</strong></p>}

      {/* Verification result */}
      {check && fileErrors.length > 0 && (
        <div style={box('#ef4444')}>
          <p style={{ fontWeight: 600 }}>✖ No se pudo verificar el archivo</p>
          {fileErrors.map((e, i) => <p key={i}>{e.message}</p>)}
        </div>
      )}

      {check && fileErrors.length === 0 && rowErrors.length === 0 && (
        <div style={box('#16a34a')}>
          <p style={{ fontWeight: 600 }}>✔ Verificación completa: los {check.valid.length} productos están correctos.</p>
          <p>¿Deseas procesarlos?</p>
        </div>
      )}

      {check && fileErrors.length === 0 && rowErrors.length > 0 && (
        <div style={box(check.valid.length ? '#d97706' : '#ef4444')}>
          <p style={{ fontWeight: 600 }}>
            {check.valid.length
              ? `⚠ ${check.valid.length} de ${total} productos están correctos. ${rowErrors.length} fila(s) tienen errores y no se pueden subir:`
              : `✖ Ninguno de los ${total} productos se puede subir. Corrige el Excel y vuelve a subirlo:`}
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: '1rem', maxHeight: 150, overflowY: 'auto', marginTop: '0.25rem' }}>
            {rowErrors.map((e) => <li key={e.row}><strong>Fila {e.row}:</strong> {e.message}</li>)}
          </ul>
          {check.valid.length > 0 && <p style={{ marginTop: '0.375rem' }}>Puedes corregir el Excel y volver a subirlo, o procesar solo los productos correctos.</p>}
        </div>
      )}

      {check && check.valid.length > 0 && (
        <div style={{ maxHeight: 170, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <table className="w-full" style={{ fontSize: '0.6875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                {['Fila', 'Código', 'Nombre', 'Categoría', 'Subcategoría', 'Precio', 'Stock'].map((h) => <th key={h} className="px-2 py-1 text-left">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {check.valid.map((r) => (
                <tr key={r.row} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-2 py-1">{r.row}</td>
                  <td className="px-2 py-1">{r.code}</td>
                  <td className="px-2 py-1">{r.name}</td>
                  <td className="px-2 py-1">{categories.find((c) => c.id === r.categoryId)?.name}</td>
                  <td className="px-2 py-1">{subcategories.find((s) => s.id === r.subcategoryId)?.name}</td>
                  <td className="px-2 py-1">{formatPrice(r.price)}</td>
                  <td className="px-2 py-1">{r.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {failure && <div style={box('#ef4444')}>{failure.split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>}
      {progress && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{progress}</p>}

      <div className="flex gap-3 pt-2">
        {check && check.valid.length > 0 && (
          <Button variant="gold" onClick={() => { void handleProcess(); }} disabled={busy !== ''}>
            {busy === 'processing'
              ? 'Procesando…'
              : rowErrors.length
                ? `Procesar solo los ${check.valid.length} correctos`
                : `Sí, procesar ${check.valid.length} productos`}
          </Button>
        )}
        <Button variant="outline" onClick={() => Swal.close()} disabled={busy === 'processing'}>Cerrar</Button>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const { token } = useAdmin();
  const { categories, subcategories, error: categoriesError, refetch: refetchCategories } = useAdminCategories();
  const { products, error: productsError, refetch: refetchProducts } = useAdminProducts();
  const loadError = productsError || categoriesError;
  const refetch = async () => { await Promise.all([refetchProducts(), refetchCategories()]); };
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const openAdd = () =>
    MySwal.fire({ title: t('admin.products.add'), html: <ProductFormModal editing={null} token={token!} categories={categories} subcategories={subcategories} onDone={() => { void refetch(); }} />, showConfirmButton: false, showCloseButton: true, width: '680px' });

  const openEdit = (product: Product) =>
    MySwal.fire({ title: t('admin.products.edit'), html: <ProductFormModal editing={product} token={token!} categories={categories} subcategories={subcategories} onDone={() => { void refetch(); }} />, showConfirmButton: false, showCloseButton: true, width: '680px' });

  const openBulk = () =>
    MySwal.fire({ title: 'Carga masiva de productos', html: <ProductBulkModal token={token!} categories={categories} subcategories={subcategories} onDone={() => { void refetch(); }} />, showConfirmButton: false, showCloseButton: true, width: '680px' });

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: t('admin.products.delete'),
      text: t('admin.products.confirmDelete'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel'),
      confirmButtonColor: '#ef4444',
    });
    if (result.isConfirmed) {
      await api.admin.products.delete(token!, id);
      await refetch();
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (categories.find((c) => c.id === p.categoryId)?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300 }}>
            {t('admin.products.title')}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openBulk}>
              <Upload size={14} /> Carga masiva
            </Button>
            <Button variant="gold" size="sm" onClick={openAdd}>
              <Plus size={14} /> {t('admin.products.add')}
            </Button>
          </div>
        </div>

        {loadError && <p role="alert" style={{ color: '#ef4444', fontSize: '0.8125rem', marginBottom: '12px' }}>{loadError}</p>}

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar productos..."
          className="form-input mb-6"
          style={{ maxWidth: '300px' }}
        />

        {/* Table */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                  {['', 'Nombre', 'Código', 'Categoría', 'Precio', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left" style={{ fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-(--bg-subtle) transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 overflow-hidden bg-[--gray-100] shrink-0 flex items-center justify-center">
                        {p.images?.[0]?.data
                          ? <img src={p.images[0].data} alt={p.name} className="w-full h-full object-cover" />
                          : <ImageIcon size={16} style={{ color: 'var(--text-subtle)' }} />
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ maxWidth: '180px' }}>
                      <div className="flex flex-col">
                        <span className="font-medium truncate" style={{ color: 'var(--text)', fontSize: '0.8125rem' }}>{p.name}</span>
                        {p.featured && <span className="text-[10px] text-(--gold)">★ Destacado</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.code}</td>
                    <td className="px-4 py-3" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {categories.find((c) => c.id === p.categoryId)?.name || '—'}
                    </td>
                    <td className="px-4 py-3" style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{formatPrice(p.price)}</td>
                    <td className="px-4 py-3">
                      <button onClick={async () => { await api.admin.products.update(token!, p.id, { active: !p.active }); await refetch(); }} className="flex items-center gap-1.5 hover:text-(--gold) transition-colors text-(--text-muted)">
                        {p.active ? <ToggleRight size={20} style={{ color: '#22c55e' }} /> : <ToggleLeft size={20} />}
                        <span style={{ fontSize: '0.6875rem', fontWeight: 500 }}>{p.active ? t('common.active') : t('common.inactive')}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 hover:text-(--gold) transition-colors text-(--text-muted)" title={t('common.edit')}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => { void handleDelete(p.id); }} className="p-1.5 hover:text-red-500 transition-colors text-(--text-muted)">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
