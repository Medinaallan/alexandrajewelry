import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, Sun, Moon, Globe } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { TopBar } from './TopBar';

export function Header() {
  const { totalItems, openCart } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [scrollY, setScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const topBarCollapsed = scrollY > 48;

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (mobileOpen || searchOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen, searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/catalog', label: t('nav.catalog') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  return (
    <>
      {/* ── Sticky header shell ─────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-40"
        style={{
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          transition: 'box-shadow 0.3s',
          boxShadow: topBarCollapsed ? '0 2px 24px rgba(0,0,0,0.10)' : 'none',
        }}
      >
        {/* TopBar — collapses on scroll */}
        <div
          style={{
            overflow: 'hidden',
            maxHeight: topBarCollapsed ? 0 : '44px',
            opacity: topBarCollapsed ? 0 : 1,
            transition: 'max-height 0.32s ease, opacity 0.22s ease',
            pointerEvents: topBarCollapsed ? 'none' : 'auto',
          }}
        >
          <TopBar />
        </div>

        {/* ── Main nav ──────────────────────────────────────────────────────── */}
        <header>
          <div
            className="page-container h-16 lg:h-[68px] flex items-center"
            style={{ position: 'relative' }}
          >
            {/* Logo — left */}
            <Link
              to="/"
              className="flex flex-col leading-none select-none shrink-0"
              onClick={() => setMobileOpen(false)}
            >
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', letterSpacing: '0.09em', fontWeight: 500, color: 'var(--text)' }}>
                ALEXANDRA
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.59rem', letterSpacing: '0.26em', fontWeight: 400, color: 'var(--gold)', marginTop: '-1px' }}>
                JEWELRY
              </span>
            </Link>

            {/* Nav — absolutely centered on desktop */}
            <nav
              className="hidden lg:flex items-center gap-8"
              style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
            >
              {navLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  style={({ isActive }) => ({
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.6875rem',
                    letterSpacing: '0.16em',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    color: isActive ? 'var(--gold)' : 'var(--text)',
                    borderBottom: isActive ? '1px solid var(--gold)' : '1px solid transparent',
                    paddingBottom: '3px',
                    transition: 'color 0.2s, border-color 0.2s',
                  })}
                  onMouseEnter={(e) => { if (!(e.currentTarget as HTMLElement).dataset.active) (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; }}
                  onMouseLeave={(e) => { if (!(e.currentTarget as HTMLElement).dataset.active) (e.currentTarget as HTMLElement).style.color = ''; }}
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Actions — right */}
            <div className="ml-auto flex items-center gap-0.5">
              <button
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className="flex items-center gap-1 px-2 py-2 text-[--text-muted] hover:text-[--gold] transition-colors"
                aria-label="Toggle language"
              >
                <Globe size={15} />
                <span className="hidden sm:inline" style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {language === 'en' ? 'ES' : 'EN'}
                </span>
              </button>

              <button onClick={toggleTheme} className="p-2 text-[--text-muted] hover:text-[--gold] transition-colors" aria-label="Toggle theme">
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              <button onClick={() => setSearchOpen(true)} className="p-2 text-[--text-muted] hover:text-[--gold] transition-colors" aria-label={t('nav.search')}>
                <Search size={16} />
              </button>

              <button
                onClick={openCart}
                className="relative p-2 text-[--text-muted] hover:text-[--gold] transition-colors"
                aria-label={t('nav.cart')}
              >
                <ShoppingBag size={16} />
                {totalItems > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-[17px] h-[17px] rounded-full text-white"
                    style={{ background: 'var(--gold)', fontSize: '9px', fontWeight: 600 }}
                  >
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileOpen((o) => !o)}
                className="lg:hidden p-2 text-[--text-muted] hover:text-[--gold] transition-colors ml-1"
                aria-label="Menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* ── Search overlay ───────────────────────────────────────────────────── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="animate-fade-up"
            style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearch} className="page-container flex items-center gap-4 h-16">
              <Search size={18} className="text-[--text-muted] shrink-0" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('catalog.search')}
                className="flex-1 bg-transparent text-lg text-[--text] outline-none"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--text)' }}
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="p-1 text-[--text-muted] hover:text-[--gold] transition-colors">
                <X size={18} />
              </button>
            </form>
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" />
        </div>
      )}

      {/* ── Mobile menu ──────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
          <nav
            className="fixed top-0 right-0 h-full w-[300px] z-50 flex flex-col lg:hidden animate-fade-in"
            style={{ background: 'var(--bg)', borderLeft: '1px solid var(--border)' }}
          >
            <div
              className="flex items-center justify-between px-6 h-16 shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '0.875rem', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Menu
              </span>
              <button onClick={() => setMobileOpen(false)} className="p-2 text-[--text-muted] hover:text-[--gold] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col flex-1 overflow-y-auto px-6 py-2">
              {navLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMobileOpen(false)}
                  style={({ isActive }) => ({
                    padding: '1.125rem 0',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.5rem',
                    fontWeight: 300,
                    color: isActive ? 'var(--gold)' : 'var(--text)',
                    borderBottom: '1px solid var(--border)',
                    transition: 'color 0.2s',
                    display: 'block',
                  })}
                >
                  {label}
                </NavLink>
              ))}
            </div>

            <div
              className="flex items-center gap-5 px-6 py-5 shrink-0"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <button
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className="flex items-center gap-1.5 text-[--text-muted] hover:text-[--gold] transition-colors"
                style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' }}
              >
                <Globe size={13} />
                {language === 'en' ? 'Español' : 'English'}
              </button>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 text-[--text-muted] hover:text-[--gold] transition-colors"
                style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' }}
              >
                {isDark ? <Sun size={13} /> : <Moon size={13} />}
                {isDark ? 'Light' : 'Dark'}
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
