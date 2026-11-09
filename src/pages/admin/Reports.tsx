import { useEffect, useState, useCallback, useMemo } from 'react';
import { BarChart2, TrendingUp, DollarSign, Globe, Store } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { formatPrice } from '../../utils/formatPrice';
import type { Sale } from '../../types';

type Period = 'today' | '7d' | 'month' | 'lastMonth' | 'year' | 'all' | 'custom';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: '7d', label: 'Últimos 7 días' },
  { id: 'month', label: 'Este mes' },
  { id: 'lastMonth', label: 'Mes pasado' },
  { id: 'year', label: 'Este año' },
  { id: 'all', label: 'Todo' },
  { id: 'custom', label: 'Rango…' },
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const toInputDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** "2026-11-07" → local midnight of that day */
const fromInputDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

/** [from, to) in the browser's local time; null = no limit. */
function periodRange(period: Period, customFrom: string, customTo: string): [Date | null, Date | null] {
  const today = startOfDay(new Date());
  const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  switch (period) {
    case 'today': return [today, addDays(today, 1)];
    case '7d': return [addDays(today, -6), addDays(today, 1)];
    case 'month': return [new Date(today.getFullYear(), today.getMonth(), 1), addDays(today, 1)];
    case 'lastMonth': return [new Date(today.getFullYear(), today.getMonth() - 1, 1), new Date(today.getFullYear(), today.getMonth(), 1)];
    case 'year': return [new Date(today.getFullYear(), 0, 1), addDays(today, 1)];
    case 'custom': return [
      customFrom ? fromInputDate(customFrom) : null,
      customTo ? addDays(fromInputDate(customTo), 1) : null,
    ];
    default: return [null, null];
  }
}

type ProductRow = { productId: number; productName: string; units: number; revenue: number; profit: number | null };

export default function AdminReportsPage() {
  const { token } = useAdmin();
  const { t } = useLanguage();
  const { products } = useAdminProducts();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState(() => toInputDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [customTo, setCustomTo] = useState(() => toInputDate(new Date()));

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setSales(await api.admin.sales.list(token));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las ventas.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const inPeriod = useMemo(() => {
    const [from, to] = periodRange(period, customFrom, customTo);
    return sales.filter((s) => {
      const at = new Date(s.createdAt);
      return (!from || at >= from) && (!to || at < to);
    });
  }, [sales, period, customFrom, customTo]);

  const summary = useMemo(() => {
    // Profit uses each product's current cost (sales don't store the cost they had)
    const costOf = new Map(products.map((p) => [p.id, p.cost ?? null]));
    let revenue = 0, units = 0, webRevenue = 0, counterRevenue = 0, profit = 0, revenueWithCost = 0;
    const orders = new Set<number>();
    const byProduct = new Map<number, ProductRow>();
    const missingCost = new Set<string>();

    for (const s of inPeriod) {
      revenue += s.total;
      units += s.quantity;
      if (s.orderId) { webRevenue += s.total; orders.add(s.orderId); } else counterRevenue += s.total;

      const cost = costOf.get(s.productId);
      const lineProfit = cost == null ? null : s.total - cost * s.quantity;
      if (lineProfit === null) missingCost.add(s.productName);
      else { profit += lineProfit; revenueWithCost += s.total; }

      const row = byProduct.get(s.productId) ?? { productId: s.productId, productName: s.productName, units: 0, revenue: 0, profit: 0 };
      row.units += s.quantity;
      row.revenue += s.total;
      row.profit = row.profit === null || lineProfit === null ? null : row.profit + lineProfit;
      byProduct.set(s.productId, row);
    }

    const rows = [...byProduct.values()].sort((a, b) => b.revenue - a.revenue);
    return { revenue, units, webRevenue, counterRevenue, webOrders: orders.size, profit, revenueWithCost, missingCost: [...missingCost], rows };
  }, [inPeriod, products]);

  const maxRevenue = summary.rows.length > 0 ? Math.max(...summary.rows.map((r) => r.revenue)) : 1;
  const margin = summary.revenueWithCost > 0 ? Math.round((summary.profit / summary.revenueWithCost) * 100) : null;

  const stats = [
    { label: t('admin.reports.totalRevenue'), value: formatPrice(summary.revenue), hint: `${summary.units} unidades`, Icon: DollarSign, color: 'var(--gold)' },
    {
      label: 'Ganancia estimada',
      value: summary.revenueWithCost > 0 ? formatPrice(summary.profit) : '—',
      hint: margin !== null ? `Margen ${margin}%` : 'Falta el costo de los productos',
      Icon: TrendingUp,
      color: '#22c55e',
    },
    { label: 'Ventas web', value: formatPrice(summary.webRevenue), hint: `${summary.webOrders} pedidos`, Icon: Globe, color: '#6366f1' },
    { label: 'Ventas en mostrador', value: formatPrice(summary.counterRevenue), hint: '', Icon: Store, color: '#f59e0b' },
  ];

  const sectionCard: React.CSSProperties = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '24px',
  };
  const dateInput: React.CSSProperties = { padding: '0.375rem 0.625rem', fontSize: '0.8125rem', width: 'auto' };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, color: 'var(--text)' }}>
            {t('admin.reports.title')}
          </h1>
        </div>

        {/* Period */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {PERIODS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={period === id}
              onClick={() => setPeriod(id)}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                borderRadius: 'var(--radius)',
                border: `1px solid ${period === id ? 'var(--gold)' : 'var(--border)'}`,
                background: period === id ? 'var(--gold-pale)' : 'var(--bg)',
                color: period === id ? 'var(--text)' : 'var(--text-muted)',
              }}
            >
              {label}
            </button>
          ))}
          {period === 'custom' && (
            <span className="flex items-center gap-2" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <label className="flex items-center gap-1">Desde
                <input type="date" className="form-input" style={dateInput} value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} />
              </label>
              <label className="flex items-center gap-1">Hasta
                <input type="date" className="form-input" style={dateInput} value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} />
              </label>
            </span>
          )}
        </div>

        {error && <p role="alert" style={{ color: '#ef4444', fontSize: '0.8125rem', marginBottom: '12px' }}>{error}</p>}

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</p>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-4">
              {stats.map(({ label, value, hint, Icon, color }) => (
                <div key={label} style={{ ...sectionCard, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em' }}>{label}</span>
                    <Icon size={18} style={{ color }} strokeWidth={1.5} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 300, color: 'var(--text)', lineHeight: 1 }}>
                    {value}
                  </span>
                  {hint && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hint}</span>}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
              La ganancia se calcula con el costo actual de cada producto.
              {summary.missingCost.length > 0 && (
                <> No incluye {summary.missingCost.length === 1 ? 'un producto' : `${summary.missingCost.length} productos`} sin costo registrado ({summary.missingCost.slice(0, 3).join(', ')}{summary.missingCost.length > 3 ? '…' : ''}).</>
              )}
            </p>

            {/* Sales by product */}
            <div style={{ ...sectionCard, marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={16} style={{ color: 'var(--gold)' }} />
                {t('admin.reports.salesByProduct')}
              </h2>

              {summary.rows.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No hay ventas en este período.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {summary.rows.map((r) => (
                    <div key={r.productId}>
                      <div className="flex items-center justify-between mb-1 gap-4">
                        <span style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 500 }}>{r.productName}</span>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {r.units} {t('admin.reports.quantity')}
                            {r.profit !== null && <> · ganancia {formatPrice(r.profit)}</>}
                          </span>
                          <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.9rem', minWidth: '80px', textAlign: 'right' }}>
                            {formatPrice(r.revenue)}
                          </span>
                        </div>
                      </div>
                      <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${(r.revenue / maxRevenue) * 100}%`,
                            background: 'var(--gold)',
                            borderRadius: '3px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sales in the period */}
            <div style={sectionCard}>
              <h2 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text)', marginBottom: '1.25rem' }}>
                Ventas del período {inPeriod.length > 20 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(últimas 20 de {inPeriod.length})</span>}
              </h2>
              {inPeriod.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('admin.sales.noSales')}</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {[t('admin.sales.product'), t('admin.sales.quantity'), t('admin.sales.unitPrice'), t('admin.sales.total'), 'Origen', t('admin.sales.soldBy'), t('admin.sales.date')].map((h) => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.75rem', letterSpacing: '0.04em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inPeriod.slice(0, 20).map((s) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--text)', fontWeight: 500 }}>{s.productName}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{s.quantity}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{formatPrice(s.unitPrice)}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--gold)' }}>{formatPrice(s.total)}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{s.orderId ? `Web #${s.orderId}` : 'Mostrador'}</td>
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
          </>
        )}
      </div>
    </div>
  );
}
