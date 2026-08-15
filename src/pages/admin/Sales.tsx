import { useEffect, useState, useCallback } from 'react';
import { ShoppingBag, DollarSign } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Button } from '../../components/ui/Button';
import { formatPrice } from '../../utils/formatPrice';
import type { StockProduct, Sale } from '../../types';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '8px 12px',
  color: 'var(--text)',
  fontSize: '0.875rem',
};

export default function AdminSalesPage() {
  const { token } = useAdmin();
  const { t } = useLanguage();

  const [products, setProducts] = useState<StockProduct[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ productId: '', quantity: '1', unitPrice: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const selectedProduct = products.find((p) => p.id === Number(form.productId));

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        api.admin.stock.products(token),
        api.admin.sales.list(token),
      ]);
      setProducts(p);
      setSales(s);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // Auto-fill price when product changes
  useEffect(() => {
    if (selectedProduct) {
      setForm((f) => ({ ...f, unitPrice: String(selectedProduct.price) }));
    }
  }, [form.productId, selectedProduct]);

  const qty = Number(form.quantity);
  const unitPrice = Number(form.unitPrice);
  const total = qty > 0 && unitPrice > 0 ? qty * unitPrice : 0;

  const insufficientStock = selectedProduct && qty > selectedProduct.stock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormError('');
    setFormSuccess('');
    if (!form.productId || qty < 1 || unitPrice <= 0) {
      setFormError('Completa todos los campos correctamente.');
      return;
    }
    if (insufficientStock) {
      setFormError(t('admin.sales.insufficientStock'));
      return;
    }
    setSaving(true);
    try {
      await api.admin.sales.create(token, {
        productId: Number(form.productId),
        quantity: qty,
        unitPrice,
        notes: form.notes,
      });
      setFormSuccess(t('admin.sales.success'));
      setForm({ productId: '', quantity: '1', unitPrice: '', notes: '' });
      await fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al registrar.');
    } finally {
      setSaving(false);
    }
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
            {t('admin.sales.title')}
          </h1>
        </div>

        {/* POS Form */}
        <div style={{ ...sectionCard, marginBottom: '2rem', borderColor: 'var(--gold)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={16} style={{ color: 'var(--gold)' }} />
            {t('admin.sales.register')}
          </h2>
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {t('admin.sales.product')} *
                </label>
                <select
                  style={inputStyle}
                  value={form.productId}
                  onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                  required
                >
                  <option value="">-- Seleccionar --</option>
                  {products.filter((p) => p.active && p.stock > 0).map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name} ({t('admin.sales.available')}: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {t('admin.sales.quantity')} *
                </label>
                <input
                  type="number"
                  style={{ ...inputStyle, borderColor: insufficientStock ? '#ef4444' : undefined }}
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  min={1}
                  max={selectedProduct?.stock ?? 9999}
                  required
                />
                {insufficientStock && (
                  <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '2px' }}>
                    {t('admin.sales.insufficientStock')}
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {t('admin.sales.unitPrice')} *
                </label>
                <input
                  type="number"
                  style={inputStyle}
                  value={form.unitPrice}
                  onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
                  min={0}
                  step={0.01}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {t('admin.sales.notes')}
                </label>
                <input
                  type="text"
                  style={inputStyle}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Opcional..."
                />
              </div>
            </div>

            {/* Total preview */}
            {total > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '10px 14px', background: 'rgba(201,164,93,0.08)', borderRadius: 'var(--radius)', border: '1px solid rgba(201,164,93,0.3)' }}>
                <DollarSign size={16} style={{ color: 'var(--gold)' }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('admin.sales.total')}:</span>
                <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '1.125rem' }}>{formatPrice(total)}</span>
              </div>
            )}

            {formError && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '10px' }}>{formError}</p>}
            {formSuccess && <p style={{ color: '#22c55e', fontSize: '0.8rem', marginBottom: '10px' }}>{formSuccess}</p>}

            <Button type="submit" disabled={saving || !!insufficientStock}>
              {saving ? '...' : t('admin.sales.confirm')}
            </Button>
          </form>
        </div>

        {/* Recent Sales */}
        <div style={sectionCard}>
          <h2 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text)', marginBottom: '1.25rem' }}>
            {t('admin.sales.recent')}
          </h2>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</p>
          ) : sales.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('admin.sales.noSales')}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {[t('admin.sales.product'), t('admin.sales.quantity'), t('admin.sales.unitPrice'), t('admin.sales.total'), t('admin.sales.notes'), t('admin.sales.soldBy'), t('admin.sales.date')].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.75rem', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', color: 'var(--text)', fontWeight: 500 }}>{s.productName}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{s.quantity}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{formatPrice(s.unitPrice)}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--gold)' }}>{formatPrice(s.total)}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{s.notes || '—'}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{s.soldBy || '—'}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(s.createdAt).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
