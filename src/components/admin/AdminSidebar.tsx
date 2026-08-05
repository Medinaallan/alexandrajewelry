import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, Layers, LogOut, Gem } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';

const navItems = [
  { to: '/admin/dashboard', Icon: LayoutDashboard, labelKey: 'admin.dashboard.title' },
  { to: '/admin/products', Icon: Package, labelKey: 'admin.products.title' },
  { to: '/admin/categories', Icon: Tag, labelKey: 'admin.categories.title' },
  { to: '/admin/subcategories', Icon: Layers, labelKey: 'admin.subcategories.title' },
];

export function AdminSidebar() {
  const { logout } = useAdmin();
  const { t } = useLanguage();
  const navigate = useNavigate();

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
        {navItems.map(({ to, Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
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
            })}
          >
            <Icon size={16} />
            {t(labelKey)}
          </NavLink>
        ))}
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
