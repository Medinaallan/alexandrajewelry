import { useEffect, useState, useCallback } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { formatPrice } from '../../utils/formatPrice';
import type { Sale } from '../../types';

export default function AdminSalesHistoryPage() {
  const { token } = useAdmin();
  const { t } = useLanguage();

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const s = await api.admin.sales.list(token);
      setSales(s);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void fetchData(); }, [fetchData]);

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
            {t('admin.sales.recent')}
          </h1>
        </div>

        <div style={sectionCard}>
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
