import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, LogOut, Gem, MessageSquare, Boxes, ShoppingBag, BarChart2, ChevronDown,
  ClipboardList, Users, Mail, Settings, Contact, History, Menu, X, LifeBuoy, type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import Swal from 'sweetalert2';
import { api } from '../../lib/api';
import { MESSAGES_CHANGED_EVENT, NEW_ORDER_EVENT, ORDERS_CHANGED_EVENT, ORDER_POLL_MS, playChime } from '../../lib/orderAlerts';

// ─── Menu structure ──────────────────────────────────────────────────────────
// Grouped by task, in plain words. Daily tasks are always visible; the rest
// sits in dropdowns that open by themselves when one of their pages is active.

type Badge = 'orders' | 'messages' | 'reviews';
type Link = { to: string; label: string; Icon: LucideIcon; end?: boolean; badge?: Badge };
type Group = { key: string; label: string; Icon: LucideIcon; children: Link[] };
type Entry = Link | Group;
type Section = { title: string; entries: Entry[] };

const SECTIONS: Section[] = [
  {
    title: 'Inicio',
    entries: [
      { to: '/admin/dashboard', label: 'Resumen', Icon: LayoutDashboard },
      { to: '/admin/help', label: 'Guía de uso', Icon: LifeBuoy },
    ],
  },
  {
    title: 'Ventas',
    entries: [
      { to: '/admin/orders', label: 'Pedidos', Icon: ClipboardList, badge: 'orders' },
      { to: '/admin/sales', label: 'Vender en tienda', Icon: ShoppingBag, end: true },
      { to: '/admin/sales/history', label: 'Ventas realizadas', Icon: History },
      { to: '/admin/customers', label: 'Clientes', Icon: Contact },
    ],
  },
  {
    title: 'Productos',
    entries: [
      { to: '/admin/products', label: 'Productos', Icon: Package },
      {
        key: 'stock',
        label: 'Inventario',
        Icon: Boxes,
        children: [
          { to: '/admin/stock', label: 'Ver y ajustar stock', Icon: Boxes, end: true },
          { to: '/admin/stock/movements', label: 'Entradas y salidas', Icon: History },
        ],
      },
      {
        key: 'catalog',
        label: 'Categorías',
        Icon: Tag,
        children: [
          { to: '/admin/categories', label: 'Categorías', Icon: Tag },
          { to: '/admin/subcategories', label: 'Subcategorías', Icon: Tag },
        ],
      },
    ],
  },
  {
    title: 'Mensajes',
    entries: [
      { to: '/admin/messages', label: 'Mensajes de contacto', Icon: Mail, badge: 'messages' },
      { to: '/admin/testimonials', label: 'Reseñas', Icon: MessageSquare, badge: 'reviews' },
    ],
  },
  {
    title: 'Informes',
    entries: [{ to: '/admin/reports', label: 'Reportes', Icon: BarChart2 }],
  },
  {
    title: 'Administración',
    entries: [
      {
        key: 'admin',
        label: 'Ajustes',
        Icon: Settings,
        children: [
          { to: '/admin/settings', label: 'Configuración', Icon: Settings },
          { to: '/admin/users', label: 'Usuarios', Icon: Users },
        ],
      },
    ],
  },
];

const isGroup = (e: Entry): e is Group => 'children' in e;

/** Same rule as NavLink: exact match for `end` links, prefix match otherwise. */
function matches(link: Link, path: string) {
  return link.end ? path === link.to : path === link.to || path.startsWith(`${link.to}/`);
}

// ─── Look (large, high-contrast, easy to hit) ────────────────────────────────

const TEXT = '#d4d4d4';
const TEXT_DIM = '#a3a3a3';

const rowStyle = (active: boolean, nested = false): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  width: '100%',
  minHeight: nested ? '42px' : '46px',
  padding: nested ? '8px 12px 8px 16px' : '10px 12px',
  marginBottom: '2px',
  borderRadius: '6px',
  fontSize: nested ? '0.9375rem' : '1rem',
  fontWeight: active ? 600 : 400,
  color: active ? '#ffffff' : nested ? TEXT_DIM : TEXT,
  background: active ? 'rgba(201,164,93,0.2)' : 'transparent',
  borderLeft: `3px solid ${active ? 'var(--gold)' : 'transparent'}`,
  textAlign: 'left',
  transition: 'background 0.15s, color 0.15s',
});

function CountBadge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span
      aria-label={`${n} sin atender`}
      style={{
        background: 'var(--gold)',
        color: '#000',
        fontSize: '0.8125rem',
        fontWeight: 700,
        borderRadius: '999px',
        padding: '1px 8px',
        minWidth: '24px',
        textAlign: 'center',
      }}
    >
      {n}
    </span>
  );
}

// ─── Order alerts ────────────────────────────────────────────────────────────

// Kept outside the component: the sidebar remounts on every admin page, and
// the newest order already announced must survive that.
let lastSeenOrderId: number | null = null;
let lastToVerify: number | null = null;
const baseTitle = document.title;

function announce(title: string, open: () => void) {
  playChime();
  window.dispatchEvent(new Event(NEW_ORDER_EVENT));
  void Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'info',
    title,
    text: 'Haz clic para verlo.',
    showConfirmButton: false,
    timer: 10_000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.style.cursor = 'pointer';
      toast.addEventListener('click', () => {
        Swal.close();
        open();
      });
    },
  });
}

// Which dropdowns are open is remembered between pages and visits
const OPEN_KEY = 'admin-menu-open';
function loadOpen(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(OPEN_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function AdminSidebar() {
  const { logout, token } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [counts, setCounts] = useState<Record<Badge, number>>({ orders: 0, messages: 0, reviews: 0 });
  const [open, setOpen] = useState<string[]>(loadOpen);
  // Small screens: the menu slides in from the left
  const [mobileOpen, setMobileOpen] = useState(false);

  const setCount = (badge: Badge, n: number) => setCounts((c) => (c[badge] === n ? c : { ...c, [badge]: n }));

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify(open));
    } catch {
      // storage blocked: the menu just won't remember
    }
  }, [open]);

  // The group of the current page is always open
  useEffect(() => {
    const active = SECTIONS.flatMap((s) => s.entries)
      .filter(isGroup)
      .find((g) => g.children.some((l) => matches(l, location.pathname)));
    if (active) setOpen((o) => (o.includes(active.key) ? o : [...o, active.key]));
    setMobileOpen(false);
  }, [location.pathname]);

  // Pending reviews
  useEffect(() => {
    if (!token) return;
    api.admin.testimonials.list(token, 'pending')
      .then((rows) => setCount('reviews', rows.length))
      .catch(() => {});
  }, [token]);

  // Pending orders: checked every minute and right after a status change.
  // A higher order number than the last one seen means a new order arrived.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const check = async () => {
      try {
        const { count, lastId, toVerify } = await api.admin.orders.pendingCount(token);
        if (cancelled) return;
        setCount('orders', count);
        document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;
        if (lastSeenOrderId !== null && lastId !== null && lastId > lastSeenOrderId) {
          announce('¡Nuevo pedido recibido!', () => navigate('/admin/orders'));
        } else if (lastToVerify !== null && toVerify > lastToVerify) {
          // A PayPal payment or a transfer receipt arrived
          announce('Llegó un pago para verificar', () => navigate('/admin/orders?view=verify'));
        }
        if (lastId !== null && (lastSeenOrderId === null || lastId > lastSeenOrderId)) lastSeenOrderId = lastId;
        lastToVerify = toVerify;
      } catch {
        // offline for a moment: try again on the next tick
      }
    };
    void check();
    const timer = window.setInterval(() => void check(), ORDER_POLL_MS);
    const onChanged = () => void check();
    window.addEventListener(ORDERS_CHANGED_EVENT, onChanged);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener(ORDERS_CHANGED_EVENT, onChanged);
      document.title = baseTitle;
    };
  }, [token, navigate]);

  // Unread contact messages: same rhythm as the orders
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const check = () =>
      api.admin.contact.unreadCount(token)
        .then(({ count }) => { if (!cancelled) setCount('messages', count); })
        .catch(() => {});
    void check();
    const timer = window.setInterval(() => void check(), ORDER_POLL_MS);
    window.addEventListener(MESSAGES_CHANGED_EVENT, check);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener(MESSAGES_CHANGED_EVENT, check);
    };
  }, [token]);

  const handleLogout = async () => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Cerrar sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'No, seguir aquí',
    });
    if (!isConfirmed) return;
    logout();
    navigate('/admin');
  };

  const toggle = (key: string) => setOpen((o) => (o.includes(key) ? o.filter((k) => k !== key) : [...o, key]));

  const renderLink = (link: Link, nested = false) => (
    <NavLink key={link.to} to={link.to} end={link.end} style={({ isActive }) => rowStyle(isActive, nested)} className="admin-nav-row">
      <link.Icon size={nested ? 18 : 20} style={{ flexShrink: 0 }} />
      <span className="flex-1">{link.label}</span>
      {link.badge && <CountBadge n={counts[link.badge]} />}
    </NavLink>
  );

  const renderGroup = (group: Group) => {
    const isOpen = open.includes(group.key);
    const active = group.children.some((l) => matches(l, location.pathname));
    const pending = group.children.reduce((n, l) => n + (l.badge ? counts[l.badge] : 0), 0);
    return (
      <div key={group.key}>
        <button
          type="button"
          onClick={() => toggle(group.key)}
          aria-expanded={isOpen}
          style={{ ...rowStyle(active && !isOpen), fontWeight: active ? 600 : 400 }}
          className="admin-nav-row"
        >
          <group.Icon size={20} style={{ flexShrink: 0 }} />
          <span className="flex-1">{group.label}</span>
          {!isOpen && <CountBadge n={pending} />}
          <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
        </button>
        {isOpen && (
          <div style={{ marginLeft: '18px', paddingLeft: '6px', borderLeft: '1px solid #2a2a2a', marginBottom: '4px' }}>
            {group.children.map((l) => renderLink(l, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Small screens: a bar with a clearly labelled menu button */}
      <div className="admin-mobile-bar">
        <button type="button" onClick={() => setMobileOpen(true)} className="flex items-center gap-2" style={{ color: 'white', fontSize: '1rem', padding: '8px 4px' }}>
          <Menu size={24} /> Menú
        </button>
        <span style={{ fontFamily: 'var(--font-serif)', color: 'white', fontSize: '1.0625rem' }}>Alexandra</span>
        <CountBadge n={counts.orders} />
      </div>
      {mobileOpen && <div className="admin-sidebar-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <aside className={`admin-sidebar${mobileOpen ? ' is-open' : ''}`} aria-label="Menú del panel">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid #1f1f1f' }}>
          <Gem size={22} style={{ color: 'var(--gold)' }} />
          <div className="flex-1">
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', color: 'white', letterSpacing: '0.04em' }}>Alexandra</div>
            <div style={{ fontSize: '0.75rem', color: TEXT_DIM }}>Panel de la tienda</div>
          </div>
          <button type="button" onClick={() => setMobileOpen(false)} className="admin-sidebar-close" aria-label="Cerrar menú" style={{ color: 'white' }}>
            <X size={24} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {SECTIONS.map((section, i) => (
            <div key={section.title} style={{ marginTop: i === 0 ? 0 : '18px' }}>
              <h2
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--gold)',
                  padding: '0 12px 6px',
                }}
              >
                {section.title}
              </h2>
              {section.entries.map((e) => (isGroup(e) ? renderGroup(e) : renderLink(e)))}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid #1f1f1f' }}>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="admin-nav-row flex items-center gap-3 w-full hover:text-red-400 transition-colors"
            style={{ ...rowStyle(false), color: TEXT }}
          >
            <LogOut size={20} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
