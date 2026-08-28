import { useEffect, useState, useCallback } from 'react';
import { TrendingUp } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import type { StockMovement } from '../../types';

export default function AdminStockMovementsPage() {
  const { token } = useAdmin();
  const { t } = useLanguage();

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const m = await api.admin.stock.movements(token);
      setMovements(m);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const movementTypeLabel = (type: string) => {
    if (type === 'entry') return t('admin.stock.entry');
    if (type === 'adjustment') return t('admin.stock.adjustment');
    if (type === 'return') return t('admin.stock.return');
    return type;
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
            {t('admin.stock.history')}
          </h1>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</p>
        ) : (
          <div style={sectionCard}>
            <h2 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} style={{ color: 'var(--gold)' }} />
              {t('admin.stock.history')}
            </h2>
            {movements.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('admin.stock.noMovements')}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {[t('admin.stock.product'), t('admin.stock.quantity'), t('admin.stock.type'), t('admin.stock.notes'), t('admin.stock.createdBy'), t('admin.sales.date')].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.75rem', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', color: 'var(--text)', fontWeight: 500 }}>{m.productName}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontWeight: 700, color: m.quantity >= 0 ? '#22c55e' : '#ef4444' }}>
                            {m.quantity >= 0 ? '+' : ''}{m.quantity}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px' }}>
                            {movementTypeLabel(m.type)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{m.notes || '—'}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{m.createdBy || '—'}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(m.createdAt).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
