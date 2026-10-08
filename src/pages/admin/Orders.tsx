import { useEffect, useState, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { formatPrice } from '../../utils/formatPrice';
import type { Order, OrderStatus } from '../../types';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  paid: '#22c55e',
  shipped: '#8b5cf6',
  delivered: '#16a34a',
  cancelled: '#ef4444',
};

export default function AdminOrdersPage() {
  const { token } = useAdmin();
  const { t } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setOrders(await api.admin.orders.list(token));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.orders.error'));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const changeStatus = async (order: Order, status: OrderStatus) => {
    if (!token || status === order.status) return;
    try {
      const updated = await api.admin.orders.updateStatus(token, order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.orders.error'));
    }
  };

  const openReceipt = async (order: Order) => {
    if (!token) return;
    // Open the tab right away (inside the click) so it isn't blocked as a pop-up
    const tab = window.open('', '_blank');
    try {
      const blob = await api.admin.orders.receipt(token, order.id);
      const url = URL.createObjectURL(blob);
      if (tab) tab.location.href = url;
      else window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setError('');
    } catch (err) {
      tab?.close();
      setError(err instanceof Error ? err.message : t('admin.orders.error'));
    }
  };

  const sectionCard: React.CSSProperties = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '24px',
  };
  const cell: React.CSSProperties = { padding: '10px 12px', color: 'var(--text-muted)', verticalAlign: 'top' };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, color: 'var(--text)' }}>
            {t('admin.orders.title')}
          </h1>
        </div>

        {error && <p role="alert" style={{ color: '#ef4444', fontSize: '0.8125rem', marginBottom: '12px' }}>{error}</p>}

        <div style={sectionCard}>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</p>
          ) : orders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('admin.orders.empty')}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', t('admin.orders.customer'), t('admin.orders.items'), t('admin.orders.total'), t('admin.orders.payment'), t('admin.orders.status'), t('admin.orders.date')].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.75rem', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ ...cell, color: 'var(--text)', fontWeight: 500 }}>{o.id}</td>
                      <td style={cell}>
                        <div style={{ color: 'var(--text)', fontWeight: 500 }}>{o.customerName}</div>
                        <div>{o.customerPhone}</div>
                        <div>{[o.customerAddress, o.customerCity].filter(Boolean).join(', ')}</div>
                        {o.notes && <div style={{ fontStyle: 'italic', marginTop: '4px' }}>“{o.notes}”</div>}
                      </td>
                      <td style={cell}>
                        {(Array.isArray(o.items) ? o.items : []).map((item) => (
                          <div key={item.productId}>
                            {item.quantity} × {item.name}
                            <span style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}> ({item.code})</span>
                          </div>
                        ))}
                      </td>
                      <td style={{ ...cell, fontWeight: 700, color: 'var(--gold)', whiteSpace: 'nowrap' }}>{formatPrice(o.total)}</td>
                      <td style={cell}>
                        <div>{t(`checkout.${o.paymentMethod}`)}</div>
                        {o.paymentMethod === 'transfer' && (
                          <button
                            type="button"
                            onClick={() => void openReceipt(o)}
                            className="flex items-center gap-1 hover:text-[--gold] transition-colors"
                            style={{ marginTop: '4px', fontSize: '0.75rem', textDecoration: 'underline' }}
                          >
                            <FileText size={12} /> {t('admin.orders.viewReceipt')}
                          </button>
                        )}
                      </td>
                      <td style={cell}>
                        <select
                          aria-label={t('admin.orders.status')}
                          value={o.status}
                          onChange={(e) => void changeStatus(o, e.target.value as OrderStatus)}
                          style={{
                            background: 'var(--bg-secondary)',
                            border: `1px solid ${STATUS_COLOR[o.status] ?? 'var(--border)'}`,
                            borderRadius: 'var(--radius)',
                            padding: '4px 8px',
                            color: 'var(--text)',
                            fontSize: '0.75rem',
                          }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{t(`admin.orders.status.${s}`)}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                        {new Date(o.createdAt).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })}
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
