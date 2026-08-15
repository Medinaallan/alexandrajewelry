import { useRef, useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Upload } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAdmin } from '../../contexts/AdminContext';
import { useData } from '../../contexts/DataContext';
import { api } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Button } from '../../components/ui/Button';
import { MySwal } from '../../lib/swal';
import type { Subcategory } from '../../types';

type SubcategoryForm = {
  categoryId: number | '';
  name: string; nameEn: string; description: string; descriptionEn: string; active: boolean;
};
const BLANK: SubcategoryForm = { categoryId: '', name: '', nameEn: '', description: '', descriptionEn: '', active: true };

// ── Add/Edit form rendered inside MySwal ─────────────────────────────────
function SubcategoryFormModal({ editing, token, categories, onDone }: {
  editing: Subcategory | null; token: string; categories: { id: number; name: string }[]; onDone: () => void;
}) {
  const [form, setForm] = useState<SubcategoryForm>(
    editing
      ? { categoryId: editing.categoryId, name: editing.name, nameEn: editing.nameEn, description: editing.description, descriptionEn: editing.descriptionEn, active: editing.active }
      : BLANK
  );
  const set = <K extends keyof SubcategoryForm>(k: K, v: SubcategoryForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const payload = { categoryId: form.categoryId as number, name: form.name, nameEn: form.nameEn, slug, description: form.description, descriptionEn: form.descriptionEn, active: form.active };
    if (editing) await api.admin.subcategories.update(token, editing.id, payload);
    else await api.admin.subcategories.create(token, payload);
    onDone();
    Swal.close();
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      <p style={{ fontSize: '0.75rem', color: 'var(--gold)', background: 'rgba(201,164,93,0.08)', border: '1px solid rgba(201,164,93,0.2)', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem' }}>
        ✨ Escribe en <strong>español</strong> — la traducción al inglés se genera automáticamente.
      </p>
      <AdminField label="Categoría padre">
        <select className="form-input" value={form.categoryId} onChange={(e) => set('categoryId', Number(e.target.value) || '')}>
          <option value="">Seleccionar categoría</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </AdminField>
      <AdminField label="Nombre (ES)">
        <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nombre de la subcategoría" />
      </AdminField>
      <AdminField label="Descripción (ES)">
        <textarea className="form-input resize-none" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Descripción breve" />
      </AdminField>
      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="accent-[--gold]" />
        Activo
      </label>
      <div className="flex gap-3 pt-2">
        <Button variant="gold" onClick={handleSave}>Guardar</Button>
        <Button variant="outline" onClick={() => Swal.close()}>Cancelar</Button>
      </div>
    </div>
  );
}

// ── Bulk upload form rendered inside MySwal ──────────────────────────────
function SubcategoryBulkModal({ token, categories, onDone }: { token: string; categories: { id: number; name: string }[]; onDone: () => void }) {
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBulkText(ev.target?.result as string ?? '');
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBulkImport = async () => {
    setBulkError('');
    const lines = bulkText.trim().split('\n').filter(Boolean);
    if (lines.length < 2) { setBulkError('El archivo debe tener encabezado y al menos una fila.'); return; }
    const [header, ...rows] = lines;
    const cols = header.split(',').map((c) => c.trim().toLowerCase());
    const catIdx = cols.indexOf('category');
    const nameIdx = cols.indexOf('name');
    const descIdx = cols.indexOf('description');
    if (nameIdx === -1) { setBulkError('Columna "name" requerida en el encabezado.'); return; }
    if (catIdx === -1) { setBulkError('Columna "category" requerida en el encabezado.'); return; }
    setBulkLoading(true);
    try {
      for (const row of rows) {
        const cells = row.split(',').map((c) => c.trim());
        const name = cells[nameIdx] ?? '';
        if (!name) continue;
        const catRef = cells[catIdx] ?? '';
        const cat = categories.find((c) => c.name.toLowerCase() === catRef.toLowerCase() || String(c.id) === catRef);
        if (!cat) continue;
        const description = descIdx !== -1 ? (cells[descIdx] ?? '') : '';
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        await api.admin.subcategories.create(token, { categoryId: cat.id, name, nameEn: '', slug, description, descriptionEn: '', active: true });
      }
      onDone();
      Swal.close();
    } catch {
      setBulkError('Error al importar. Verifica el formato del archivo.');
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadTemplate = () => {
    const rows = [
      ['category', 'name', 'description', 'active'],
      ['Anillos', 'Oro', 'Subcategoría materiales oro', 'true'],
      ['Pulseras', 'Plata', 'Subcategoría materiales plata', 'true'],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plantilla_subcategorias.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Sube un CSV con las siguientes columnas de base de datos:
      </p>
      <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
        <div className="grid" style={{ gridTemplateColumns: 'auto 1fr', gap: '0.25rem 1rem' }}>
          <span style={{ fontFamily: 'monospace', color: 'var(--gold)' }}>category</span><span>Nombre exacto o ID numérico de la categoría padre</span>
          <span style={{ fontFamily: 'monospace', color: 'var(--gold)' }}>name</span><span>Nombre de la subcategoría (ES)</span>
          <span style={{ fontFamily: 'monospace', color: 'var(--gold)' }}>description</span><span>Descripción breve (ES)</span>
          <span style={{ fontFamily: 'monospace', color: 'var(--gold)' }}>active</span><span><code style={{ background: 'var(--bg-muted)', padding: '0 3px', borderRadius: 2 }}>true</code> o <code style={{ background: 'var(--bg-muted)', padding: '0 3px', borderRadius: 2 }}>false</code></span>
        </div>
        <p style={{ marginTop: '0.5rem', fontSize: '0.6875rem', opacity: 0.7 }}>Campos auto-generados: id · categoryId · nameEn · slug · descriptionEn · createdAt</p>
      </div>
      <Button variant="outline" size="sm" onClick={downloadTemplate}>
        <Upload size={13} /> Descargar plantilla CSV
      </Button>
      <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleBulkFile} className="hidden" />
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
        <Upload size={13} /> Seleccionar archivo CSV
      </Button>
      <AdminField label="O pega el contenido CSV aquí">
        <textarea className="form-input resize-none" rows={5} placeholder={"category,name,description,active\nAnillos,Oro,Subcategoría oro,true"} value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
      </AdminField>
      {bulkError && <p style={{ fontSize: '0.75rem', color: '#ef4444' }}>{bulkError}</p>}
      <div className="flex gap-3 pt-2">
        <Button variant="gold" onClick={handleBulkImport} disabled={bulkLoading || !bulkText.trim()}>
          {bulkLoading ? 'Importando...' : 'Importar'}
        </Button>
        <Button variant="outline" onClick={() => Swal.close()}>Cancelar</Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function AdminSubcategoriesPage() {
  const { token } = useAdmin();
  const { subcategories, categories, refetch } = useData();
  const { t } = useLanguage();
  const [filterCategory, setFilterCategory] = useState<number | ''>('');

  const openAdd = () =>
    MySwal.fire({ title: t('admin.subcategories.add'), html: <SubcategoryFormModal editing={null} token={token!} categories={categories} onDone={() => { void refetch(); }} />, showConfirmButton: false, showCloseButton: true, width: '540px' });

  const openEdit = (sub: Subcategory) =>
    MySwal.fire({ title: t('admin.subcategories.edit'), html: <SubcategoryFormModal editing={sub} token={token!} categories={categories} onDone={() => { void refetch(); }} />, showConfirmButton: false, showCloseButton: true, width: '540px' });

  const openBulk = () =>
    MySwal.fire({ title: 'Carga masiva de subcategorías', html: <SubcategoryBulkModal token={token!} categories={categories} onDone={() => { void refetch(); }} />, showConfirmButton: false, showCloseButton: true, width: '580px' });

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: t('common.delete'),
      text: t('admin.subcategories.confirmDelete'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel'),
      confirmButtonColor: '#ef4444',
    });
    if (result.isConfirmed) {
      await api.admin.subcategories.delete(token!, id);
      await refetch();
    }
  };

  const displayed = filterCategory
    ? subcategories.filter((s) => s.categoryId === filterCategory)
    : subcategories;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300 }}>
            {t('admin.subcategories.title')}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openBulk}>
              <Upload size={14} /> Carga masiva
            </Button>
            <Button variant="gold" size="sm" onClick={openAdd}>
              <Plus size={14} /> {t('admin.subcategories.add')}
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <select className="form-input" style={{ maxWidth: '260px' }} value={filterCategory} onChange={(e) => setFilterCategory(Number(e.target.value) || '')}>
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                  {['ID', 'Nombre', 'EN (auto)', 'Categoría', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left" style={{ fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-[--bg-subtle] transition-colors">
                    <td className="px-4 py-3">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{s.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{s.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{s.nameEn}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {categories.find((c) => c.id === s.categoryId)?.name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={async () => { await api.admin.subcategories.update(token!, s.id, { active: !s.active }); await refetch(); }}
                        className="flex items-center gap-1.5 hover:text-[--gold] transition-colors text-[--text-muted]"
                      >
                        {s.active ? <ToggleRight size={20} style={{ color: '#22c55e' }} /> : <ToggleLeft size={20} />}
                        <span style={{ fontSize: '0.6875rem', fontWeight: 500 }}>{s.active ? t('common.active') : t('common.inactive')}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 hover:text-[--gold] transition-colors text-[--text-muted]" title={t('common.edit')}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => { void handleDelete(s.id); }} className="p-1.5 hover:text-red-500 transition-colors text-[--text-muted]" title={t('common.delete')}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {displayed.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No hay subcategorías</td>
                  </tr>
                )}
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


