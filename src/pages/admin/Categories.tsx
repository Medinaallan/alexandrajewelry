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
import type { Category } from '../../types';

type CategoryForm = {
  name: string; nameEn: string; slug: string; image: string;
  description: string; descriptionEn: string; active: boolean;
};
const BLANK: CategoryForm = { name: '', nameEn: '', slug: '', image: '', description: '', descriptionEn: '', active: true };

// ── Add/Edit form rendered inside MySwal ─────────────────────────────────
function CategoryFormModal({ editing, token, onDone }: { editing: Category | null; token: string; onDone: () => void }) {
  const [form, setForm] = useState<CategoryForm>(
    editing
      ? { name: editing.name, nameEn: editing.nameEn, slug: editing.slug, image: editing.image, description: editing.description, descriptionEn: editing.descriptionEn, active: editing.active }
      : BLANK
  );
  const set = <K extends keyof CategoryForm>(k: K, v: CategoryForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (editing) await api.admin.categories.update(token, editing.id, { ...form, slug });
    else await api.admin.categories.create(token, { ...form, slug });
    onDone();
    Swal.close();
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      <p style={{ fontSize: '0.75rem', color: 'var(--gold)', background: 'rgba(201,164,93,0.08)', border: '1px solid rgba(201,164,93,0.2)', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem' }}>
        ✨ Escribe en <strong>español</strong> — la traducción al inglés se genera automáticamente.
      </p>
      <AdminField label="Nombre (ES)">
        <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nombre de la categoría" />
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
function CategoryBulkModal({ token, onDone }: { token: string; onDone: () => void }) {
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
    const nameIdx = cols.indexOf('name');
    const descIdx = cols.indexOf('description');
    if (nameIdx === -1) { setBulkError('Columna "name" requerida en el encabezado.'); return; }
    setBulkLoading(true);
    try {
      for (const row of rows) {
        const cells = row.split(',').map((c) => c.trim());
        const name = cells[nameIdx] ?? '';
        if (!name) continue;
        const description = descIdx !== -1 ? (cells[descIdx] ?? '') : '';
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        await api.admin.categories.create(token, { name, nameEn: '', slug, image: '', description, descriptionEn: '', active: true });
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
      ['name', 'description', 'active'],
      ['Anillos', 'Colección de anillos', 'true'],
      ['Pulseras', 'Colección de pulseras', 'true'],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plantilla_categorias.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Sube un CSV con las siguientes columnas de base de datos:
      </p>
      <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
        <div className="grid" style={{ gridTemplateColumns: 'auto 1fr', gap: '0.25rem 1rem' }}>
          <span style={{ fontFamily: 'monospace', color: 'var(--gold)' }}>name</span><span>Nombre de la categoría (ES)</span>
          <span style={{ fontFamily: 'monospace', color: 'var(--gold)' }}>description</span><span>Descripción breve (ES)</span>
          <span style={{ fontFamily: 'monospace', color: 'var(--gold)' }}>active</span><span><code style={{ background: 'var(--bg-muted)', padding: '0 3px', borderRadius: 2 }}>true</code> o <code style={{ background: 'var(--bg-muted)', padding: '0 3px', borderRadius: 2 }}>false</code></span>
        </div>
        <p style={{ marginTop: '0.5rem', fontSize: '0.6875rem', opacity: 0.7 }}>Campos auto-generados por el sistema: id · nameEn · slug · descriptionEn · createdAt</p>
      </div>
      <Button variant="outline" size="sm" onClick={downloadTemplate}>
        <Upload size={13} /> Descargar plantilla CSV
      </Button>
      <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleBulkFile} className="hidden" />
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
        <Upload size={13} /> Seleccionar archivo CSV
      </Button>
      <AdminField label="O pega el contenido CSV aquí">
        <textarea className="form-input resize-none" rows={5} placeholder={"name,description,active\nAnillos,Colección de anillos,true"} value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
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
export default function AdminCategoriesPage() {
  const { token } = useAdmin();
  const { categories, refetch } = useData();
  const { t } = useLanguage();

  const openAdd = () =>
    MySwal.fire({ title: t('admin.categories.add'), html: <CategoryFormModal editing={null} token={token!} onDone={() => { void refetch(); }} />, showConfirmButton: false, showCloseButton: true, width: '540px' });

  const openEdit = (cat: Category) =>
    MySwal.fire({ title: t('admin.categories.edit'), html: <CategoryFormModal editing={cat} token={token!} onDone={() => { void refetch(); }} />, showConfirmButton: false, showCloseButton: true, width: '540px' });

  const openBulk = () =>
    MySwal.fire({ title: 'Carga masiva de categorías', html: <CategoryBulkModal token={token!} onDone={() => { void refetch(); }} />, showConfirmButton: false, showCloseButton: true, width: '580px' });

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: t('common.delete'),
      text: t('admin.products.confirmDelete'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel'),
      confirmButtonColor: '#ef4444',
    });
    if (result.isConfirmed) {
      await api.admin.categories.delete(token!, id);
      await refetch();
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300 }}>
            {t('admin.categories.title')}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openBulk}>
              <Upload size={14} /> Carga masiva
            </Button>
            <Button variant="gold" size="sm" onClick={openAdd}>
              <Plus size={14} /> {t('admin.categories.add')}
            </Button>
          </div>
        </div>

        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                  {['ID', 'Nombre', 'EN (auto)', 'Descripción', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left" style={{ fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-[--bg-subtle] transition-colors">
                    <td className="px-4 py-3">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{cat.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{cat.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{cat.nameEn}</span>
                    </td>
                    <td className="px-4 py-3" style={{ maxWidth: '240px' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }} className="line-clamp-1">{cat.description || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={async () => { await api.admin.categories.update(token!, cat.id, { active: !cat.active }); await refetch(); }}
                        className="flex items-center gap-1.5 hover:text-[--gold] transition-colors text-[--text-muted]"
                      >
                        {cat.active ? <ToggleRight size={20} style={{ color: '#22c55e' }} /> : <ToggleLeft size={20} />}
                        <span style={{ fontSize: '0.6875rem', fontWeight: 500 }}>{cat.active ? t('common.active') : t('common.inactive')}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(cat)} className="p-1.5 hover:text-[--gold] transition-colors text-[--text-muted]" title={t('common.edit')}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => { void handleDelete(cat.id); }} className="p-1.5 hover:text-red-500 transition-colors text-[--text-muted]" title={t('common.delete')}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No hay categorías</td>
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


