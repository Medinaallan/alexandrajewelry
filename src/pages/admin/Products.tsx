import { useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, ImageIcon } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useData } from '../../contexts/DataContext';
import { api } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { formatPrice } from '../../utils/formatPrice';
import type { Product, ProductImage } from '../../types';

type ProductForm = {
  code: string;
  name: string;
  categoryId: number | '';
  subcategoryId: number | '';
  description: string;
  cost: number | null;
  price: number;
  tax: number;
  stock: number;
  minStock: number;
  featured: boolean;
  active: boolean;
};

const BLANK: ProductForm = {
  code: '', name: '', categoryId: '', subcategoryId: '',
  description: '', cost: null, price: 0, tax: 0,
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

export default function AdminProductsPage() {
  const { token } = useAdmin();
  const { products, categories, subcategories, refetch } = useData();
  const { t } = useLanguage();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(BLANK);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredSubs = subcategories.filter(
    (s) => s.active && (form.categoryId === '' || s.categoryId === form.categoryId)
  );

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK);
    setPendingImages([]);
    setExistingImages([]);
    setModalOpen(true);
  };

  const openEdit = async (product: Product) => {
    setEditing(product);
    setForm({
      code: product.code,
      name: product.name,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      description: product.description,
      cost: product.cost ?? null,
      price: product.price,
      tax: product.tax,
      stock: product.stock,
      minStock: product.minStock,
      featured: product.featured,
      active: product.active,
    });
    setPendingImages([]);
    const imgs = await api.admin.images.list(product.id);
    setExistingImages(imgs);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const payload = {
        code: form.code,
        name: form.name,
        slug,
        categoryId: form.categoryId as number,
        subcategoryId: form.subcategoryId as number,
        description: form.description,
        cost: form.cost,
        price: form.price,
        tax: form.tax,
        stock: form.stock,
        minStock: form.minStock,
        featured: form.featured,
        active: form.active,
      };

      let productId: number;
      if (editing) {
        const updated = await api.admin.products.update(token!, editing.id, payload);
        productId = updated.id;
      } else {
        const created = await api.admin.products.create(token!, payload);
        productId = created.id;
      }

      for (let i = 0; i < pendingImages.length; i++) {
        const b64 = await fileToBase64(pendingImages[i].file);
        await api.admin.images.add(token!, productId, {
          filename: pendingImages[i].filename,
          data: b64,
          displayOrder: existingImages.length + i,
        });
      }

      await refetch();
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (imgId: number) => {
    await api.admin.images.delete(token!, imgId);
    setExistingImages((prev) => prev.filter((i) => i.id !== imgId));
  };

  const handleDropFiles = useCallback((files: File[]) => {
    files.filter((f) => f.type.startsWith('image/')).forEach((file) => {
      const preview = URL.createObjectURL(file);
      setPendingImages((prev) => [...prev, { file, preview, filename: file.name }]);
    });
  }, []);

  const set = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

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
          <Button variant="gold" size="sm" onClick={openAdd}>
            <Plus size={14} /> {t('admin.products.add')}
          </Button>
        </div>

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
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-[--bg-subtle] transition-colors">
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
                        {p.featured && <span className="text-[10px] text-[--gold]">★ Destacado</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.code}</td>
                    <td className="px-4 py-3" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {categories.find((c) => c.id === p.categoryId)?.name || '—'}
                    </td>
                    <td className="px-4 py-3" style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{formatPrice(p.price)}</td>
                    <td className="px-4 py-3">
                      <button onClick={async () => { await api.admin.products.update(token!, p.id, { active: !p.active }); await refetch(); }} className="flex items-center gap-1.5 hover:text-[--gold] transition-colors text-[--text-muted]">
                        {p.active ? <ToggleRight size={20} style={{ color: '#22c55e' }} /> : <ToggleLeft size={20} />}
                        <span style={{ fontSize: '0.6875rem', fontWeight: 500 }}>{p.active ? t('common.active') : t('common.inactive')}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 hover:text-[--gold] transition-colors text-[--text-muted]">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setConfirmDelete(p.id)} className="p-1.5 hover:text-red-500 transition-colors text-[--text-muted]">
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
            {/* Auto-translate notice */}
            <p style={{ fontSize: '0.75rem', color: 'var(--gold)', background: 'rgba(201,164,93,0.08)', border: '1px solid rgba(201,164,93,0.2)', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem' }}>
              ✨ Los campos de texto se escriben en <strong>español</strong> — la traducción al inglés se genera automáticamente.
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

            {/* Images */}
            <AdminField label="Imágenes">
              <div className="flex flex-col gap-3">
                {(existingImages.length > 0 || pendingImages.length > 0) && (
                  <div className="flex gap-2 flex-wrap">
                    {existingImages.map((img) => (
                      <div key={img.id} style={{ position: 'relative', width: 80, height: 80 }}>
                        <img src={img.data || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} />
                        <button type="button" onClick={() => handleDeleteImage(img.id)} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
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
                  <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => set(key, e.target.checked)} className="accent-[--gold]" />
                  {label}
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="gold" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : t('common.save')}
              </Button>
              <Button variant="outline" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            </div>
          </div>
        </Modal>

        {/* Delete confirmation */}
        <Modal isOpen={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title={t('admin.products.delete')} size="sm">
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
            {t('admin.products.confirmDelete')}
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={async () => { await api.admin.products.delete(token!, confirmDelete!); await refetch(); setConfirmDelete(null); }}>
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
