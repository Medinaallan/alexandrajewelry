import { useEffect, useState, useCallback } from 'react';
import { Package, Plus } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Button } from '../../components/ui/Button';
import { formatPrice } from '../../utils/formatPrice';
import type { StockProduct } from '../../types';

type MovementType = 'entry' | 'adjustment' | 'return';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '8px 12px',
  color: 'var(--text)',
  fontSize: '0.875rem',
};

export default function AdminStockPage() {
  const { token } = useAdmin();
  const { t } = useLanguage();

  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    productId: '',
    quantity: '',
    type: 'entry' as MovementType,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const p = await api.admin.stock.products(token);
      setProducts(p);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormError('');
    const qty = Number(form.quantity);
    if (!form.productId || !qty) { setFormError('Completa todos los campos.'); return; }
    if (!form.notes.trim()) { setFormError('El motivo es obligatorio.'); return; }
    setSaving(true);
    try {
      await api.admin.stock.add(token, {
        productId: Number(form.productId),
        quantity: qty,
        type: form.type,
        notes: form.notes,
      });
      setForm({ productId: '', quantity: '', type: 'entry', notes: '' });
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const stockStatus = (p: StockProduct) => {
    if (p.stock === 0) return { label: t('admin.stock.critical'), color: '#ef4444' };
    if (p.stock <= p.minStock) return { label: t('admin.stock.lowStock'), color: '#f59e0b' };
    return { label: t('admin.stock.ok'), color: '#22c55e' };
  };

  const sectionCard: React.CSSProperties = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '24px',
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, color: 'var(--text)' }}>
            {t('admin.stock.title')}
          </h1>
          <Button onClick={() => setShowForm((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} />
            {t('admin.stock.add')}
          </Button>
        </div>

        {/* Entry Form */}
        {showForm && (
          <div style={{ ...sectionCard, marginBottom: '2rem', borderColor: 'var(--gold)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text)', marginBottom: '1.25rem' }}>
              {t('admin.stock.add')}
            </h2>
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t('admin.stock.product')} *
                  </label>
                  <select
                    style={inputStyle}
                    value={form.productId}
                    onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.name} (stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t('admin.stock.quantity')} *
                  </label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    min={0}
                    required
                  />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {form.type === 'adjustment'
                      ? 'Nuevo stock total del producto.'
                      : form.type === 'return'
                        ? 'Cantidad a restar del stock.'
                        : 'Cantidad a sumar al stock.'}
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t('admin.stock.type')}
                  </label>
                  <select
                    style={inputStyle}
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as MovementType }))}
                  >
                    <option value="entry">{t('admin.stock.entry')}</option>
                    <option value="adjustment">{t('admin.stock.adjustment')}</option>
                    <option value="return">{t('admin.stock.return')}</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t('admin.stock.notes')} *
                  </label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {formError && (
                <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '12px' }}>{formError}</p>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? '...' : t('admin.stock.save')}
                </Button>
                <Button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(''); }}
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</p>
        ) : (
          <>
            {/* Products stock table */}
            <div style={sectionCard}>
              <h2 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={16} style={{ color: 'var(--gold)' }} />
                {t('admin.stock.product')}
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {[t('admin.stock.code'), t('admin.stock.product'), t('admin.stock.price'), t('admin.stock.currentStock'), t('admin.stock.minStock'), t('admin.stock.status')].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.75rem', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const { label, color } = stockStatus(p);
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.code}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text)', fontWeight: 500 }}>{p.name}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{formatPrice(p.price)}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontWeight: 700, color, fontSize: '1rem' }}>{p.stock}</span>
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{p.minStock}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ background: color + '22', color, fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', letterSpacing: '0.04em' }}>
                              {label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
