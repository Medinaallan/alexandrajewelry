import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, Layers, LogOut, Gem, MessageSquare, Boxes, ShoppingBag, BarChart2, ChevronDown, ClipboardList, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';

const navItemsTop = [
  { to: '/admin/dashboard', Icon: LayoutDashboard, labelKey: 'admin.dashboard.title' },
  { to: '/admin/products', Icon: Package, labelKey: 'admin.products.title' },
  { to: '/admin/categories', Icon: Tag, labelKey: 'admin.categories.title' },
  { to: '/admin/subcategories', Icon: Layers, labelKey: 'admin.subcategories.title' },
];

const navItemsBottom = [
  { to: '/admin/reports', Icon: BarChart2, labelKey: 'admin.reports.title' },
];

const dropdowns = [
  {
    key: 'stock',
    basePath: '/admin/stock',
    Icon: Boxes,
    labelKey: 'admin.stock.title',
    children: [
      { to: '/admin/stock', end: true, labelKey: 'admin.stock.viewAdjust' },
      { to: '/admin/stock/movements', end: false, labelKey: 'admin.stock.history' },
    ],
  },
  {
    key: 'sales',
    basePath: '/admin/sales',
    Icon: ShoppingBag,
    labelKey: 'admin.sales.title',
    children: [
      { to: '/admin/sales', end: true, labelKey: 'admin.sales.register' },
      { to: '/admin/sales/history', end: false, labelKey: 'admin.sales.recent' },
    ],
  },
];

const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 12px',
  marginBottom: '2px',
  borderRadius: '4px',
  fontSize: '0.8125rem',
  fontWeight: 400,
  color: isActive ? 'white' : 'var(--gray-500)',
  background: isActive ? 'rgba(201,164,93,0.15)' : 'transparent',
  borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
  transition: 'all 0.2s',
  letterSpacing: '0.04em',
});

const childNavLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  display: 'block',
  padding: '8px 12px',
  marginBottom: '2px',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 400,
  color: isActive ? 'white' : 'var(--gray-500)',
  background: isActive ? 'rgba(201,164,93,0.15)' : 'transparent',
  borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
  transition: 'all 0.2s',
  letterSpacing: '0.04em',
});

function NavDropdown({
  Icon,
  label,
  isActive,
  isOpen,
  onToggle,
  children,
}: {
  Icon: LucideIcon;
  label: string;
  isActive: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children: { to: string; end: boolean; label: string }[];
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 12px',
          marginBottom: '2px',
          borderRadius: '4px',
          fontSize: '0.8125rem',
          fontWeight: 400,
          color: isActive ? 'white' : 'var(--gray-500)',
          background: isActive ? 'rgba(201,164,93,0.15)' : 'transparent',
          border: 'none',
          borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
          cursor: 'pointer',
          transition: 'all 0.2s',
          letterSpacing: '0.04em',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Icon size={16} />
          {label}
        </span>
        <ChevronDown
          size={14}
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>
      {isOpen && (
        <div style={{ marginLeft: '16px', marginBottom: '2px' }}>
          {children.map(({ to, end, label: childLabel }) => (
            <NavLink key={to} to={to} end={end} style={childNavLinkStyle}>
              {childLabel}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminSidebar() {
  const { logout, token } = useAdmin();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<string | null>(
    dropdowns.find((d) => location.pathname.startsWith(d.basePath))?.key ?? null
  );

  useEffect(() => {
    if (!token) return;
    api.admin.testimonials.list(token, 'pending')
      .then((rows) => setPendingCount(rows.length))
      .catch(() => {});
    api.admin.orders.list(token)
      .then((rows) => setPendingOrders(rows.filter((o) => o.status === 'pending').length))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    const active = dropdowns.find((d) => location.pathname.startsWith(d.basePath));
    if (active) setOpenDropdown(active.key);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-6 py-6"
        style={{ borderBottom: '1px solid #1a1a1a' }}
      >
        <Gem size={20} style={{ color: 'var(--gold)' }} />
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'white', letterSpacing: '0.06em' }}>
            Alexandra
          </div>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
            Admin Panel
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-3">
        {navItemsTop.map(({ to, Icon, labelKey }) => (
          <NavLink key={to} to={to} style={navLinkStyle}>
            <Icon size={16} />
            {t(labelKey)}
          </NavLink>
        ))}

        {/* Orders placed from the store */}
        <NavLink to="/admin/orders" style={navLinkStyle}>
          <ClipboardList size={16} />
          <span className="flex-1">{t('admin.orders.title')}</span>
          {pendingOrders > 0 && (
            <span
              style={{
                background: 'var(--gold)',
                color: '#000',
                fontSize: '0.65rem',
                fontWeight: 700,
                borderRadius: '10px',
                padding: '1px 6px',
                minWidth: '18px',
                textAlign: 'center',
              }}
            >
              {pendingOrders}
            </span>
          )}
        </NavLink>

        {dropdowns.map(({ key, basePath, Icon, labelKey, children }) => (
          <NavDropdown
            key={key}
            Icon={Icon}
            label={t(labelKey)}
            isActive={location.pathname.startsWith(basePath)}
            isOpen={openDropdown === key}
            onToggle={() => setOpenDropdown((v) => (v === key ? null : key))}
            children={children.map((c) => ({ ...c, label: t(c.labelKey) }))}
          />
        ))}

        {navItemsBottom.map(({ to, Icon, labelKey }) => (
          <NavLink key={to} to={to} style={navLinkStyle}>
            <Icon size={16} />
            {t(labelKey)}
          </NavLink>
        ))}

        {/* Testimonials nav item */}
        <NavLink to="/admin/testimonials" style={navLinkStyle}>
          <MessageSquare size={16} />
          <span className="flex-1">{t('admin.testimonials.title')}</span>
          {pendingCount > 0 && (
            <span
              style={{
                background: 'var(--gold)',
                color: '#000',
                fontSize: '0.65rem',
                fontWeight: 700,
                borderRadius: '10px',
                padding: '1px 6px',
                minWidth: '18px',
                textAlign: 'center',
              }}
            >
              {pendingCount}
            </span>
          )}
        </NavLink>
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6" style={{ borderTop: '1px solid #1a1a1a', paddingTop: '1rem' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-[--gray-500] hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          {t('admin.logout')}
        </button>
      </div>
    </aside>
  );
}
