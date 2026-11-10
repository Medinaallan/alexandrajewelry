import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, BadgeCheck, ClipboardList, Mail, MessageSquare, Package, RefreshCw, Send, ShoppingBag, Tag, CheckCircle, Star, Clock,
  type LucideIcon,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { api, type DashboardData } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { formatPrice } from '../../utils/formatPrice';
import { NEW_ORDER_EVENT, ORDERS_CHANGED_EVENT, MESSAGES_CHANGED_EVENT } from '../../lib/orderAlerts';
import type { Category } from '../../types';

type Task = { n: number; title: string; help: string; to: string; Icon: LucideIcon; color: string; action: string };

/** One big card for something that needs her today. */
function TaskCard({ task }: { task: Task }) {
  const active = task.n > 0;
  return (
    <Link
      to={task.to}
      className="flex items-start gap-4 p-5 transition-shadow hover:shadow-md"
      style={{
        background: 'var(--bg)',
        border: `2px solid ${active ? task.color : 'var(--border)'}`,
        borderRadius: '10px',
        opacity: active ? 1 : 0.75,
      }}
    >
      <span
        className="flex items-center justify-center shrink-0"
        style={{ width: 52, height: 52, borderRadius: '50%', background: active ? task.color : 'var(--bg-subtle)', color: active ? '#fff' : 'var(--text-muted)' }}
      >
        <task.Icon size={24} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-baseline gap-2">
          <span style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1, color: active ? 'var(--text)' : 'var(--text-muted)' }}>{task.n}</span>
          <span style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text)' }}>{task.title}</span>
        </span>
        <span className="block" style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
          {active ? task.help : 'Nada pendiente.'}
        </span>
        {active && (
          <span className="inline-block mt-3" style={{ fontSize: '0.9375rem', fontWeight: 600, color: task.color }}>
            {task.action} →
          </span>
        )}
      </span>
    </Link>
  );
}

export default function AdminDashboard() {
  const { token } = useAdmin();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  // Catalog numbers ("lo demás"), below the day's tasks
  const { products } = useAdminProducts();
  const [categories, setCategories] = useState<Category[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setData(await api.admin.orders.dashboard(token));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el resumen.');
    }
  }, [token]);

  useEffect(() => {
    void load();
    // Refresh with new orders and every couple of minutes
    const refresh = () => void load();
    const timer = window.setInterval(refresh, 120_000);
    window.addEventListener(NEW_ORDER_EVENT, refresh);
    window.addEventListener(ORDERS_CHANGED_EVENT, refresh);
    window.addEventListener(MESSAGES_CHANGED_EVENT, refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(NEW_ORDER_EVENT, refresh);
      window.removeEventListener(ORDERS_CHANGED_EVENT, refresh);
      window.removeEventListener(MESSAGES_CHANGED_EVENT, refresh);
    };
  }, [load]);

  useEffect(() => {
    if (!token) return;
    api.admin.categories.list(token).then(setCategories).catch(() => {});
  }, [token]);

  const today = new Date().toLocaleDateString('es-US', { weekday: 'long', day: 'numeric', month: 'long' });

  const tasks: Task[] = data
    ? [
        {
          n: data.toVerify + data.stockShort,
          title: 'Pagos por verificar',
          help: 'Clientes que pagaron por PayPal o enviaron comprobante de transferencia. Revisa que el dinero llegó y confírmalo.',
          to: '/admin/orders?view=verify',
          Icon: BadgeCheck,
          color: '#0284c7',
          action: 'Verificar pagos',
        },
        {
          n: data.toAttend - data.stockShort,
          title: 'Pedidos por cobrar',
          help: 'Pedidos nuevos que todavía no pagaron (transferencia sin comprobante, WhatsApp o efectivo). Contacta al cliente para cobrar.',
          to: '/admin/orders?view=attend',
          Icon: ClipboardList,
          color: '#d97706',
          action: 'Ver pedidos',
        },
        {
          n: data.toShip,
          title: 'Pedidos para enviar',
          help: 'Ya están pagados. Prepáralos y envíalos o entrégalos.',
          to: '/admin/orders?view=ship',
          Icon: Send,
          color: '#7c3aed',
          action: 'Ver pedidos',
        },
        {
          n: data.unreadMessages,
          title: 'Mensajes sin leer',
          help: 'Mensajes que llegaron desde el formulario de contacto.',
          to: '/admin/messages',
          Icon: Mail,
          color: '#16a34a',
          action: 'Leer mensajes',
        },
      ]
    : [];

  const lowStock = data?.lowStock ?? [];

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', fontWeight: 300, color: 'var(--text)' }}>Resumen</h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{today}</p>
          </div>
          <button type="button" onClick={() => void load()} className="flex items-center gap-2 hover:text-(--gold)" style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>

        {error && <p role="alert" style={{ color: '#ef4444', fontSize: '0.9375rem', marginBottom: '1rem' }}>{error}</p>}

        {/* 1. What needs her today */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Para hacer hoy</h2>
        {!data && !error ? (
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Cargando…</p>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
            {tasks.map((task) => <TaskCard key={task.title} task={task} />)}
          </div>
        )}
        {data && data.paypalWaiting > 0 && (
          <p className="flex items-center gap-2 mb-10" style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
            <Clock size={16} />
            {data.paypalWaiting === 1 ? '1 pedido con PayPal espera' : `${data.paypalWaiting} pedidos con PayPal esperan`} que el cliente pague. No tienes que hacer nada: si no pagan en 24 horas, se cancelan solos.
          </p>
        )}

        {/* 2. Today's sales and low stock */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-12 mt-8">
          <section className="p-6" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px' }}>
            <h2 className="flex items-center gap-2" style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
              <ShoppingBag size={20} style={{ color: 'var(--gold)' }} /> Ventas de hoy
            </h2>
            {data && (
              <>
                <p style={{ fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.1 }}>{formatPrice(data.salesToday.total)}</p>
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  {data.salesToday.units === 1 ? '1 pieza vendida' : `${data.salesToday.units} piezas vendidas`} ·{' '}
                  {data.ordersToday === 1 ? '1 pedido nuevo hoy' : `${data.ordersToday} pedidos nuevos hoy`}
                </p>
                <Link to="/admin/sales/history" className="inline-block mt-4 hover:text-(--gold)" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                  Ver ventas realizadas →
                </Link>
              </>
            )}
          </section>

          <section className="p-6" style={{ background: 'var(--bg)', border: `1px solid ${lowStock.length ? '#f59e0b' : 'var(--border)'}`, borderRadius: '10px' }}>
            <h2 className="flex items-center gap-2" style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
              <AlertTriangle size={20} style={{ color: lowStock.length ? '#f59e0b' : 'var(--text-muted)' }} /> Stock bajo
              {lowStock.length > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({lowStock.length})</span>}
            </h2>
            {data && lowStock.length === 0 && <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>Todos los productos tienen stock suficiente.</p>}
            <ul className="flex flex-col gap-2">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4" style={{ fontSize: '0.9375rem' }}>
                  <span className="truncate">{p.name}</span>
                  <span style={{ whiteSpace: 'nowrap', fontWeight: 600, color: p.stock === 0 ? '#ef4444' : '#d97706' }}>
                    {p.stock === 0 ? 'Agotado' : `Quedan ${p.stock}`}
                  </span>
                </li>
              ))}
            </ul>
            {lowStock.length > 0 && (
              <Link to="/admin/stock" className="inline-block mt-4 hover:text-(--gold)" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                {lowStock.length > 6 ? `Ver los ${lowStock.length} y agregar stock →` : 'Agregar stock →'}
              </Link>
            )}
          </section>
        </div>

        {/* 3. The rest */}
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-muted)' }}>Otros datos</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Reseñas por revisar', value: data?.pendingReviews ?? 0, Icon: MessageSquare, to: '/admin/testimonials' },
            { label: 'Productos', value: products.length, Icon: Package, to: '/admin/products' },
            { label: 'Productos a la venta', value: products.filter((p) => p.active).length, Icon: CheckCircle, to: '/admin/products' },
            { label: 'Destacados', value: products.filter((p) => p.featured).length, Icon: Star, to: '/admin/products' },
            { label: 'Categorías', value: categories.length, Icon: Tag, to: '/admin/categories' },
          ].map(({ label, value, Icon, to }) => (
            <Link key={label} to={to} className="flex flex-col gap-2 p-4 hover:border-(--gold)" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <Icon size={18} style={{ color: 'var(--gold)' }} />
              <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>{value}</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
