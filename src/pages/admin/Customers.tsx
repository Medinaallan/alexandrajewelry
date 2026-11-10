import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Search, MessageCircle } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Button } from '../../components/ui/Button';
import { formatPrice } from '../../utils/formatPrice';
import { downloadExcel, datedName, MONEY_FORMAT, DATE_FORMAT } from '../../lib/adminExcel';
import type { Customer } from '../../types';

type Sort = 'recent' | 'spent' | 'orders';

/** wa.me link; a 10-digit number gets the US code */
function whatsappUrl(phone: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return null;
  if (digits.length === 10) digits = `1${digits}`;
  return `https://wa.me/${digits}`;
}

const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase' };
const td: React.CSSProperties = { padding: '10px 12px', verticalAlign: 'top', color: 'var(--text-muted)' };

export default function AdminCustomersPage() {
  const { token } = useAdmin();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('recent');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setCustomers(await api.admin.orders.customers(token));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los clientes.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    const list = customers.filter((c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      (qDigits.length >= 3 && c.phone.replace(/\D/g, '').includes(qDigits))
    );
    if (sort === 'spent') return [...list].sort((a, b) => b.spent - a.spent);
    if (sort === 'orders') return [...list].sort((a, b) => b.orders - a.orders);
    return list;
  }, [customers, search, sort]);

  const repeat = customers.filter((c) => c.orders > 1).length;

  const exportExcel = () =>
    void downloadExcel(datedName('clientes'), 'Clientes', [
      { header: 'Nombre', width: 26, value: (c: Customer) => c.name },
      { header: 'Teléfono', width: 18, value: (c) => c.phone },
      { header: 'Correo', width: 28, value: (c) => c.email },
      { header: 'Ciudad', width: 18, value: (c) => c.city },
      { header: 'Pedidos', width: 10, value: (c) => c.orders },
      { header: 'Abiertos', width: 10, value: (c) => c.openOrders },
      { header: 'Total comprado', width: 16, value: (c) => c.spent, format: MONEY_FORMAT },
      { header: 'Primer pedido', width: 18, value: (c) => new Date(c.firstOrderAt), format: DATE_FORMAT },
      { header: 'Último pedido', width: 18, value: (c) => new Date(c.lastOrderAt), format: DATE_FORMAT },
    ], visible);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300 }}>Clientes</h1>
          <Button variant="outline" size="sm" onClick={exportExcel} disabled={visible.length === 0}>
            <Download size={14} /> Exportar a Excel
          </Button>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Armado a partir de los pedidos: el mismo teléfono es el mismo cliente. {customers.length} clientes · {repeat} compraron más de una vez.
          «Total comprado» cuenta los pedidos pagados, enviados, entregados o con pago por verificar.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar: nombre, teléfono, correo, ciudad"
              aria-label="Buscar clientes"
              className="form-input"
              style={{ width: 300, padding: '0.5rem 0.75rem 0.5rem 2rem', fontSize: '0.8125rem' }}
            />
          </div>
          <label className="flex items-center gap-2" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Ordenar por
            <select className="form-input" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8125rem', width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="recent">Pedido más reciente</option>
              <option value="spent">Total comprado</option>
              <option value="orders">Cantidad de pedidos</option>
            </select>
          </label>
        </div>

        {error && <p role="alert" style={{ color: '#ef4444', fontSize: '0.8125rem', marginBottom: 12 }}>{error}</p>}

        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflowX: 'auto' }}>
          {loading ? (
            <p className="p-6" style={{ color: 'var(--text-muted)' }}>Cargando…</p>
          ) : visible.length === 0 ? (
            <p className="p-6" style={{ color: 'var(--text-muted)' }}>{customers.length ? 'Ningún cliente coincide con la búsqueda.' : 'Todavía no hay pedidos.'}</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                  {['Cliente', 'Contacto', 'Pedidos', 'Total comprado', 'Último pedido', ''].map((h) => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => {
                  const wa = whatsappUrl(c.phone);
                  return (
                    <tr key={c.key} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={td}>
                        <div style={{ color: 'var(--text)', fontWeight: 500 }}>{c.name}</div>
                        {c.city && <div>{c.city}</div>}
                        {c.orders > 1 && <span style={{ fontSize: '0.6875rem', color: 'var(--gold)' }}>Cliente frecuente</span>}
                      </td>
                      <td style={td}>
                        <div className="flex items-center gap-2">
                          {c.phone}
                          {wa && (
                            <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp de ${c.name}`} style={{ color: '#22c55e' }}>
                              <MessageCircle size={13} />
                            </a>
                          )}
                        </div>
                        {c.email && <a href={`mailto:${c.email}`} className="underline hover:text-(--gold)">{c.email}</a>}
                      </td>
                      <td style={td}>
                        {c.orders}
                        {c.openOrders > 0 && <span style={{ color: '#b45309' }}> ({c.openOrders} abiertos)</span>}
                      </td>
                      <td style={{ ...td, color: 'var(--text)', fontWeight: 600 }}>{formatPrice(c.spent)}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{new Date(c.lastOrderAt).toLocaleDateString('es-US', { dateStyle: 'medium' })}</td>
                      <td style={td}>
                        <Link to={`/admin/orders?q=${encodeURIComponent(c.phone)}`} className="underline hover:text-(--gold)" style={{ whiteSpace: 'nowrap' }}>
                          Ver pedidos
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
