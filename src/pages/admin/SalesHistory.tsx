import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Undo2, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { downloadExcel, datedName, MONEY_FORMAT, DATE_FORMAT } from '../../lib/adminExcel';
import Swal from 'sweetalert2';
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
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const s = await api.admin.sales.list(token);
      setSales(s);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las ventas.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // Only counter sales: a web order's sales are undone from the order status
  const voidSale = async (sale: Sale) => {
    if (!token) return;
    const answer = await Swal.fire({
      title: '¿Anular esta venta?',
      text: `${sale.quantity} × ${sale.productName} (${formatPrice(sale.total)}). Las unidades vuelven al stock y la venta deja de contar en los reportes.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'No',
      confirmButtonColor: '#ef4444',
    });
    if (!answer.isConfirmed) return;
    try {
      const result = await api.admin.sales.void(token, sale.id);
      setSales((prev) => prev.filter((s) => s.id !== sale.id));
      setError('');
      void Swal.fire({
        toast: true, position: 'top-end', icon: 'success', showConfirmButton: false, timer: 3000,
        title: `Venta anulada. Stock de ${sale.productName}: ${result.newStock}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo anular la venta.');
      void fetchData();
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
            {t('admin.sales.recent')}
          </h1>
          <Button
            variant="outline"
            size="sm"
            disabled={sales.length === 0}
            onClick={() =>
              void downloadExcel(datedName('ventas'), 'Ventas', [
                { header: 'Fecha', width: 18, value: (s: Sale) => new Date(s.createdAt), format: DATE_FORMAT },
                { header: 'Producto', width: 30, value: (s) => s.productName },
                { header: 'Cantidad', width: 10, value: (s) => s.quantity },
                { header: 'Precio unitario', width: 15, value: (s) => s.unitPrice, format: MONEY_FORMAT },
                { header: 'Costo unitario', width: 15, value: (s) => s.unitCost ?? null, format: MONEY_FORMAT },
                { header: 'Total', width: 14, value: (s) => s.total, format: MONEY_FORMAT },
                { header: 'Ganancia', width: 14, value: (s) => (s.unitCost == null ? null : s.total - s.unitCost * s.quantity), format: MONEY_FORMAT },
                { header: 'Origen', width: 14, value: (s) => (s.orderId ? `Pedido #${s.orderId}` : 'Mostrador') },
                { header: 'Vendido por', width: 14, value: (s) => s.soldBy },
                { header: 'Notas', width: 30, value: (s) => s.notes },
              ], sales)
            }
          >
            <Download size={14} /> Exportar a Excel
          </Button>
        </div>

        {error && <p role="alert" style={{ color: '#ef4444', fontSize: '0.8125rem', marginBottom: '12px' }}>{error}</p>}

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
                    {[t('admin.sales.product'), t('admin.sales.quantity'), t('admin.sales.unitPrice'), t('admin.sales.total'), t('admin.sales.notes'), t('admin.sales.soldBy'), 'Origen', t('admin.sales.date'), ''].map((h) => (
                      <th key={h || 'actions'} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.75rem', letterSpacing: '0.04em' }}>{h}</th>
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
                        {s.orderId ? (
                          <Link to="/admin/orders" className="hover:text-(--gold) underline">Web · pedido #{s.orderId}</Link>
                        ) : 'Mostrador'}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(s.createdAt).toLocaleString('es-US', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {!s.orderId && (
                          <button
                            type="button"
                            onClick={() => void voidSale(s)}
                            className="flex items-center gap-1 hover:text-red-500 transition-colors"
                            style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
                            title="Anular venta"
                          >
                            <Undo2 size={13} /> Anular
                          </button>
                        )}
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
