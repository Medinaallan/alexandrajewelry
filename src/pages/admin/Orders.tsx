import { useEffect, useState, useCallback, useMemo } from 'react';
import { FileText, MessageCircle, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { NEW_ORDER_EVENT, ORDERS_CHANGED_EVENT } from '../../lib/orderAlerts';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { formatPrice } from '../../utils/formatPrice';
import type { Order, OrderStatus } from '../../types';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'review', 'paid', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  review: '#0ea5e9',
  paid: '#22c55e',
  shipped: '#8b5cf6',
  delivered: '#16a34a',
  cancelled: '#ef4444',
};

// In these statuses the order's units are already out of stock
const STOCK_TAKEN: OrderStatus[] = ['review', 'paid', 'shipped', 'delivered'];

/** WhatsApp chat with the customer, with the order number already written. */
function customerWhatsAppUrl(order: Order): string | null {
  let digits = order.customerPhone.replace(/\D/g, '');
  if (digits.length < 7) return null;
  // The store is in the US: a 10-digit number gets the +1 country code
  if (digits.length === 10) digits = `1${digits}`;
  const firstName = order.customerName.trim().split(/\s+/)[0] ?? '';
  const text = `Hola ${firstName}, te escribimos de Alexandra Jewelry por tu pedido #${order.id}.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/**
 * What the customer's browser reported about their PayPal payment. It is not
 * verified: check it in PayPal before marking the order as paid.
 */
function PayPalPaymentNote({ order }: { order: Order }) {
  const small: React.CSSProperties = { marginTop: '4px', fontSize: '0.75rem', lineHeight: 1.4 };
  if (!order.paymentRef) {
    return <div style={{ ...small, color: 'var(--text-muted)' }}>Sin pago reportado</div>;
  }
  const amountDiffers = order.paymentAmount != null && Math.abs(order.paymentAmount - order.total) > 0.009;
  return (
    <div style={small}>
      <a
        href={`https://www.paypal.com/activity/payment/${encodeURIComponent(order.paymentRef)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Abrir la transacción en PayPal (inicia sesión con la cuenta de la tienda)"
        className="hover:text-(--gold)"
        style={{ textDecoration: 'underline', fontFamily: 'monospace' }}
      >
        {order.paymentRef}
      </a>
      {order.paymentAmount != null && (
        <div style={{ color: amountDiffers ? '#ef4444' : 'var(--text-muted)', fontWeight: amountDiffers ? 700 : 400 }}>
          {formatPrice(order.paymentAmount)}
          {amountDiffers && ' ≠ total del pedido'}
        </div>
      )}
      {order.status === 'review' && (
        <div style={{ color: '#b45309' }}>Stock apartado. Verifica en PayPal y marca como Pagado</div>
      )}
      {(order.status === 'pending' || order.status === 'confirmed') && (
        <div style={{ color: '#ef4444', fontWeight: 700 }}>Pagado, pero sin stock: repón el stock o reembolsa en PayPal</div>
      )}
    </div>
  );
}

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

  // Reload when the panel announces a new order
  useEffect(() => {
    const onNew = () => void fetchData();
    window.addEventListener(NEW_ORDER_EVENT, onNew);
    return () => window.removeEventListener(NEW_ORDER_EVENT, onNew);
  }, [fetchData]);

  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    const byStatus = {} as Record<OrderStatus, number>;
    for (const o of orders) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    return byStatus;
  }, [orders]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(o.id) === q.replace(/^#/, '') ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerCity.toLowerCase().includes(q) ||
        (qDigits.length >= 3 && o.customerPhone.replace(/\D/g, '').includes(qDigits))
      );
    });
  }, [orders, statusFilter, search]);

  const changeStatus = async (order: Order, status: OrderStatus) => {
    if (!token || status === order.status) return;
    if (status === 'cancelled') {
      const returnsStock = STOCK_TAKEN.includes(order.status);
      const answer = await Swal.fire({
        title: `¿Cancelar el pedido #${order.id}?`,
        text: [
          returnsStock
            ? 'Las unidades vuelven al stock y sus ventas se quitan de los reportes.'
            : 'El cliente ya no podrá recibir este pedido.',
          order.paymentRef ? `Este pedido tiene un pago PayPal (${order.paymentRef}): recuerda reembolsarlo desde PayPal.` : '',
          order.customerEmail ? 'Se avisará al cliente por correo.' : '',
        ].filter(Boolean).join(' '),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar pedido',
        cancelButtonText: 'No',
        confirmButtonColor: '#ef4444',
      });
      if (!answer.isConfirmed) return;
    }
    try {
      const updated = await api.admin.orders.updateStatus(token, order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setError('');
      window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT));
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

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {(['', ...STATUSES] as const).map((s) => {
            const active = statusFilter === s;
            const n = s ? counts[s] ?? 0 : orders.length;
            return (
              <button
                key={s || 'all'}
                type="button"
                onClick={() => setStatusFilter(s)}
                aria-pressed={active}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${active ? (s ? STATUS_COLOR[s] : 'var(--gold)') : 'var(--border)'}`,
                  background: active ? 'var(--bg-subtle)' : 'var(--bg)',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                }}
              >
                {s ? t(`admin.orders.status.${s}`) : 'Todos'} ({n})
              </button>
            );
          })}
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar: #pedido, cliente, teléfono, ciudad"
              aria-label="Buscar pedidos"
              className="form-input"
              style={{ paddingLeft: '2rem', width: '280px', padding: '0.5rem 0.75rem 0.5rem 2rem', fontSize: '0.8125rem' }}
            />
          </div>
        </div>

        <div style={sectionCard}>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</p>
          ) : orders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('admin.orders.empty')}</p>
          ) : visible.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Ningún pedido coincide con el filtro.</p>
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
                  {visible.map((o) => (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ ...cell, color: 'var(--text)', fontWeight: 500 }}>{o.id}</td>
                      <td style={cell}>
                        <div style={{ color: 'var(--text)', fontWeight: 500 }}>{o.customerName}</div>
                        <div className="flex items-center gap-2">
                          {o.customerPhone}
                          {customerWhatsAppUrl(o) && (
                            <a
                              href={customerWhatsAppUrl(o)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Escribir al cliente por WhatsApp"
                              aria-label={`Escribir a ${o.customerName} por WhatsApp`}
                              className="inline-flex items-center gap-1 hover:text-(--gold) transition-colors"
                              style={{ color: '#22c55e', fontSize: '0.75rem' }}
                            >
                              <MessageCircle size={13} /> WhatsApp
                            </a>
                          )}
                        </div>
                        {o.customerEmail && (
                          <a href={`mailto:${o.customerEmail}`} className="block hover:text-(--gold)" style={{ textDecoration: 'underline' }}>{o.customerEmail}</a>
                        )}
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
                        {o.paymentMethod === 'paypal' && <PayPalPaymentNote order={o} />}
                        {o.paymentMethod === 'transfer' && (
                          <button
                            type="button"
                            onClick={() => void openReceipt(o)}
                            className="flex items-center gap-1 hover:text-(--gold) transition-colors"
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
                        {new Date(o.createdAt).toLocaleString('es-US', { dateStyle: 'short', timeStyle: 'short' })}
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
