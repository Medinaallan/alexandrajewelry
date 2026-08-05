import { useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useData } from '../../contexts/DataContext';
import { api } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import type { Subcategory } from '../../types';

type SubcategoryForm = {
  categoryId: number | '';
  name: string;
  description: string;
  active: boolean;
};

const BLANK: SubcategoryForm = {
  categoryId: '', name: '', description: '', active: true,
};

export default function AdminSubcategoriesPage() {
  const { token } = useAdmin();
  const { subcategories, categories, refetch } = useData();
  const { t } = useLanguage();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [form, setForm] = useState<SubcategoryForm>(BLANK);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<number | ''>('');

  const openAdd = () => { setEditing(null); setForm(BLANK); setModalOpen(true); };
  const openEdit = (sub: Subcategory) => {
    setEditing(sub);
    setForm({ categoryId: sub.categoryId, name: sub.name, description: sub.description, active: sub.active });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const payload = {
      categoryId: form.categoryId as number,
      name: form.name,
      slug,
      description: form.description,
      active: form.active,
    };
    if (editing) await api.admin.subcategories.update(token!, editing.id, payload);
    else await api.admin.subcategories.create(token!, payload);
    await refetch();
    setModalOpen(false);
  };

  const set = <K extends keyof SubcategoryForm>(k: K, v: SubcategoryForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const displayed = filterCategory
    ? subcategories.filter((s) => s.categoryId === filterCategory)
    : subcategories;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300 }}>
            {t('admin.subcategories.title')}
          </h1>
          <Button variant="gold" size="sm" onClick={openAdd}>
            <Plus size={14} /> {t('admin.subcategories.add')}
          </Button>
        </div>

        {/* Filter by category */}
        <div className="mb-6">
          <select
            className="form-input"
            style={{ maxWidth: '260px' }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(Number(e.target.value) || '')}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                  {['Nombre', 'EN (auto)', 'Categoría', 'Estado', 'Acciones'].map((h) => (
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
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text)', fontWeight: 500 }}>{s.name}</span>
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
                        <button onClick={() => setConfirmDelete(s.id)} className="p-1.5 hover:text-red-500 transition-colors text-[--text-muted]" title={t('common.delete')}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {displayed.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      No hay subcategorías
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? t('admin.subcategories.edit') : t('admin.subcategories.add')}
          size="md"
        >
          <div className="flex flex-col gap-4">
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
              {t('common.active')}
            </label>
            <div className="flex gap-3 pt-2">
              <Button variant="gold" onClick={handleSave}>{t('common.save')}</Button>
              <Button variant="outline" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            </div>
          </div>
        </Modal>

        {/* Delete confirm */}
        <Modal isOpen={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title={t('common.delete')} size="sm">
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {t('admin.subcategories.confirmDelete')}
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={async () => { await api.admin.subcategories.delete(token!, confirmDelete!); await refetch(); setConfirmDelete(null); }}>
              {t('common.delete')}
            </Button>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>{t('common.cancel')}</Button>
          </div>
        </Modal>
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
