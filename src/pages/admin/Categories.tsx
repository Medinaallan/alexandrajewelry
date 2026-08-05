import { useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useData } from '../../contexts/DataContext';
import { api } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ImageDropzone } from '../../components/ui/ImageDropzone';
import type { Category } from '../../types';

type CategoryForm = {
  name: string;
  slug: string;
  image: string;
  description: string;
  active: boolean;
};

const BLANK: CategoryForm = {
  name: '', slug: '', image: '', description: '', active: true,
};

export default function AdminCategoriesPage() {
  const { token } = useAdmin();
  const { categories, refetch } = useData();
  const { t } = useLanguage();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(BLANK);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const openAdd = () => { setEditing(null); setForm(BLANK); setModalOpen(true); };
  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, image: cat.image, description: cat.description, active: cat.active });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const payload = { ...form, slug };
    if (editing) await api.admin.categories.update(token!, editing.id, payload);
    else await api.admin.categories.create(token!, payload);
    await refetch();
    setModalOpen(false);
  };

  const set = <K extends keyof CategoryForm>(k: K, v: CategoryForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300 }}>
            {t('admin.categories.title')}
          </h1>
          <Button variant="gold" size="sm" onClick={openAdd}>
            <Plus size={14} /> {t('admin.categories.add')}
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}
            >
              <div style={{ aspectRatio: '16/9', background: 'var(--gray-100)', overflow: 'hidden' }}>
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[--text-subtle]" style={{ fontSize: '0.75rem' }}>
                    Sin imagen
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem' }}>{cat.name}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cat.nameEn}</p>
                  </div>
                  <button
                    onClick={() => { void (async () => { await api.admin.categories.update(token!, cat.id, { active: !cat.active }); await refetch(); })(); }}
                    className="hover:text-[--gold] transition-colors text-[--text-muted] shrink-0"
                  >
                    {cat.active ? <ToggleRight size={22} style={{ color: '#22c55e' }} /> : <ToggleLeft size={22} />}
                  </button>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }} className="line-clamp-2">
                  {cat.description}
                </p>
                <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => openEdit(cat)} className="flex items-center gap-1.5 text-xs text-[--text-muted] hover:text-[--gold] transition-colors">
                    <Edit2 size={12} /> {t('common.edit')}
                  </button>
                  <button onClick={() => setConfirmDelete(cat.id)} className="flex items-center gap-1.5 text-xs text-[--text-muted] hover:text-red-500 transition-colors ml-auto">
                    <Trash2 size={12} /> {t('common.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? t('admin.categories.edit') : t('admin.categories.add')}
          size="md"
        >
          <div className="flex flex-col gap-4">
            <p style={{ fontSize: '0.75rem', color: 'var(--gold)', background: 'rgba(201,164,93,0.08)', border: '1px solid rgba(201,164,93,0.2)', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem' }}>
              ✨ Escribe en <strong>español</strong> — la traducción al inglés se genera automáticamente.
            </p>
            <AdminField label="Nombre (ES)">
              <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nombre de la categoría" />
            </AdminField>
            <AdminField label="Descripción (ES)">
              <textarea className="form-input resize-none" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Descripción breve" />
            </AdminField>
            <AdminField label="Imagen">
              <ImageDropzone
                value={form.image}
                onChange={(b64) => set('image', b64)}
                onClear={() => set('image', '')}
              />
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
            {t('admin.products.confirmDelete')}
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={async () => { await api.admin.categories.delete(token!, confirmDelete!); await refetch(); setConfirmDelete(null); }}>
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
