import { useEffect, useState, useCallback } from 'react';
import { BarChart2, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { formatPrice } from '../../utils/formatPrice';
import type { SaleReport, Sale } from '../../types';

export default function AdminReportsPage() {
  const { token } = useAdmin();
  const { t } = useLanguage();

  const [report, setReport] = useState<SaleReport[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        api.admin.sales.report(token),
        api.admin.sales.list(token),
      ]);
      setReport(r);
      setSales(s);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const totalRevenue = report.reduce((sum, r) => sum + r.totalRevenue, 0);
  const totalUnits = report.reduce((sum, r) => sum + r.totalQuantity, 0);
  const totalSalesCount = report.reduce((sum, r) => sum + r.salesCount, 0);
  const maxRevenue = report.length > 0 ? Math.max(...report.map((r) => r.totalRevenue)) : 1;

  const stats = [
    { label: t('admin.reports.totalRevenue'), value: formatPrice(totalRevenue), Icon: DollarSign, color: 'var(--gold)' },
    { label: t('admin.reports.totalSales'), value: totalSalesCount, Icon: ShoppingBag, color: '#6366f1' },
    { label: t('admin.reports.totalQuantity'), value: totalUnits, Icon: TrendingUp, color: '#22c55e' },
  ];

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
            {t('admin.reports.title')}
          </h1>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</p>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {stats.map(({ label, value, Icon, color }) => (
                <div
                  key={label}
                  style={{ ...sectionCard, display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em' }}>{label}</span>
                    <Icon size={18} style={{ color }} strokeWidth={1.5} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, color: 'var(--text)', lineHeight: 1 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Sales by product */}
            <div style={{ ...sectionCard, marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={16} style={{ color: 'var(--gold)' }} />
                {t('admin.reports.salesByProduct')}
              </h2>

              {report.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('admin.reports.noData')}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {report.map((r) => (
                    <div key={r.productId}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 500 }}>{r.productName}</span>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {r.totalQuantity} {t('admin.reports.quantity')} · {r.salesCount} {t('admin.reports.salesCount')}
                          </span>
                          <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.9rem', minWidth: '80px', textAlign: 'right' }}>
                            {formatPrice(r.totalRevenue)}
                          </span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${(r.totalRevenue / maxRevenue) * 100}%`,
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

            {/* Recent sales log */}
            <div style={sectionCard}>
              <h2 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text)', marginBottom: '1.25rem' }}>
                {t('admin.sales.recent')}
              </h2>
              {sales.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('admin.sales.noSales')}</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {[t('admin.sales.product'), t('admin.sales.quantity'), t('admin.sales.unitPrice'), t('admin.sales.total'), t('admin.sales.soldBy'), t('admin.sales.date')].map((h) => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.75rem', letterSpacing: '0.04em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sales.slice(0, 20).map((s) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--text)', fontWeight: 500 }}>{s.productName}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{s.quantity}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{formatPrice(s.unitPrice)}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--gold)' }}>{formatPrice(s.total)}</td>
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
