import { useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { formatPrice } from '../../utils/formatPrice';
import type { Product } from '../../types';

type ProductForm = Omit<Product, 'id' | 'createdAt'>;

const BLANK: ProductForm = {
  name: '', nameEs: '', slug: '', categoryId: '', categoryName: '', categoryNameEs: '',
  price: 0, description: '', descriptionEs: '', additionalInfo: '', additionalInfoEs: '',
  material: '', materialEs: '', color: '', colorEs: '',
  images: [''], available: true, active: true, featured: false, isNew: false, onSale: false,
  tags: [],
};

export default function AdminProductsPage() {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useAdmin();
  const { t } = useLanguage();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(BLANK);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({ ...product });
    setModalOpen(true);
  };

  const handleSave = () => {
    // Auto-generate slug from name
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    // Find category names
    const cat = categories.find((c) => c.id === form.categoryId);
    const payload = { ...form, slug, categoryName: cat?.name || '', categoryNameEs: cat?.nameEs || '' };
    if (editing) {
      updateProduct(editing.id, payload);
    } else {
      addProduct(payload);
    }
    setModalOpen(false);
  };

  const set = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(search.toLowerCase())
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
          <Button variant="gold" size="sm" onClick={openAdd}>
            <Plus size={14} /> {t('admin.products.add')}
          </Button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="form-input mb-6"
          style={{ maxWidth: '300px' }}
        />

        {/* Table */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                  {['', 'Name', 'Category', 'Price', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left" style={{ fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-[--bg-subtle] transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 overflow-hidden bg-[--gray-100] flex-shrink-0">
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ maxWidth: '180px' }}>
                      <div className="flex flex-col">
                        <span className="font-medium truncate" style={{ color: 'var(--text)', fontSize: '0.8125rem' }}>{p.name}</span>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {p.featured && <span className="text-[10px] text-[--gold]">★ Featured</span>}
                          {p.isNew && <span className="text-[10px] text-emerald-500">● New</span>}
                          {p.onSale && <span className="text-[10px] text-orange-500">● Sale</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.categoryName}</td>
                    <td className="px-4 py-3" style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{formatPrice(p.price)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => updateProduct(p.id, { active: !p.active })} className="flex items-center gap-1.5 hover:text-[--gold] transition-colors text-[--text-muted]">
                        {p.active ? <ToggleRight size={20} style={{ color: '#22c55e' }} /> : <ToggleLeft size={20} />}
                        <span style={{ fontSize: '0.6875rem', fontWeight: 500 }}>{p.active ? t('common.active') : t('common.inactive')}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 hover:text-[--gold] transition-colors text-[--text-muted]" title={t('common.edit')}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setConfirmDelete(p.id)} className="p-1.5 hover:text-red-500 transition-colors text-[--text-muted]" title={t('common.delete')}>
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

        {/* Add/Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? t('admin.products.edit') : t('admin.products.add')}
          size="lg"
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <AdminField label="Name (EN)">
                <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </AdminField>
              <AdminField label="Name (ES)">
                <input className="form-input" value={form.nameEs} onChange={(e) => set('nameEs', e.target.value)} />
              </AdminField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <AdminField label="Category">
                <select className="form-input" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </AdminField>
              <AdminField label="Price (USD)">
                <input type="number" className="form-input" value={form.price} onChange={(e) => set('price', Number(e.target.value))} />
              </AdminField>
            </div>
            <AdminField label="Description (EN)">
              <textarea className="form-input resize-none" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </AdminField>
            <AdminField label="Description (ES)">
              <textarea className="form-input resize-none" rows={2} value={form.descriptionEs} onChange={(e) => set('descriptionEs', e.target.value)} />
            </AdminField>
            <div className="grid grid-cols-2 gap-4">
              <AdminField label="Material (EN)">
                <input className="form-input" value={form.material} onChange={(e) => set('material', e.target.value)} />
              </AdminField>
              <AdminField label="Material (ES)">
                <input className="form-input" value={form.materialEs} onChange={(e) => set('materialEs', e.target.value)} />
              </AdminField>
            </div>
            <AdminField label="Image URL">
              <input className="form-input" value={form.images[0] || ''} onChange={(e) => set('images', [e.target.value, ...form.images.slice(1)])} />
            </AdminField>
            <div className="flex flex-wrap gap-4">
              {([['available', 'Available'], ['active', 'Active'], ['featured', 'Featured'], ['isNew', 'New'], ['onSale', 'On Sale']] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => set(key, e.target.checked)} className="accent-[--gold]" />
                  {label}
                </label>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="gold" onClick={handleSave}>{t('common.save')}</Button>
              <Button variant="outline" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            </div>
          </div>
        </Modal>

        {/* Delete confirmation */}
        <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={t('admin.products.delete')} size="sm">
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
            {t('admin.products.confirmDelete')}
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={() => { deleteProduct(confirmDelete!); setConfirmDelete(null); }}>
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
