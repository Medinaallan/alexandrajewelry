import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, Sun, Moon, Globe } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { TopBar } from './TopBar';
import { cn } from '../../utils/cn';

export function Header() {
  const { totalItems, openCart } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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
      <TopBar />

      {/* ── Main Header ─────────────────────────────────────────────────────── */}
      <header
        className={cn(
          'sticky top-0 z-30 transition-all duration-300',
          scrolled
            ? 'bg-[--bg] shadow-[0_2px_20px_rgba(0,0,0,0.08)]'
            : 'bg-[--bg]'
        )}
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="page-container flex items-center justify-between h-16 lg:h-20">

          {/* Logo */}
          <Link
            to="/"
            className="flex flex-col leading-none select-none"
            onClick={() => setMobileOpen(false)}
          >
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                letterSpacing: '0.08em',
                fontWeight: 500,
                color: 'var(--text)',
              }}
            >
              ALEXANDRA
            </span>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.6875rem',
                letterSpacing: '0.22em',
                fontWeight: 300,
                color: 'var(--gold)',
                marginTop: '-2px',
              }}
            >
              JEWELRY
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                style={({ isActive }) => ({
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.14em',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  color: isActive ? 'var(--gold)' : 'var(--text)',
                  borderBottom: isActive ? '1px solid var(--gold)' : '1px solid transparent',
                  paddingBottom: '2px',
                  transition: 'var(--transition)',
                })}
                className="hover:text-[--gold]"
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 lg:gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="p-2 hover:text-[--gold] transition-colors text-[--text-muted] flex items-center gap-1"
              aria-label="Toggle language"
            >
              <Globe size={16} />
              <span className="text-[10px] font-medium tracking-wider uppercase hidden sm:inline">
                {language === 'en' ? 'ES' : 'EN'}
              </span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:text-[--gold] transition-colors text-[--text-muted]"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 hover:text-[--gold] transition-colors text-[--text-muted]"
              aria-label={t('nav.search')}
            >
              <Search size={17} />
            </button>

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative p-2 hover:text-[--gold] transition-colors text-[--text-muted]"
              aria-label={t('nav.cart')}
            >
              <ShoppingBag size={17} />
              {totalItems > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-medium"
                  style={{ background: 'var(--gold)' }}
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* Hamburger (mobile) */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden p-2 hover:text-[--gold] transition-colors text-[--text-muted]"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Search Overlay ───────────────────────────────────────────────────── */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="overlay" onClick={() => setSearchOpen(false)} />
          <div
            className="relative z-50 bg-[--bg] px-6 py-8 animate-fade-up"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <form onSubmit={handleSearch} className="page-container flex items-center gap-4">
              <Search size={20} className="text-[--text-muted] flex-shrink-0" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('catalog.search')}
                className="flex-1 bg-transparent text-xl text-[--text] placeholder-[--text-subtle] outline-none"
                style={{ fontFamily: 'var(--font-serif)' }}
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 hover:text-[--gold] transition-colors text-[--text-muted]"
              >
                <X size={20} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Mobile Menu ──────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div className="overlay lg:hidden" onClick={() => setMobileOpen(false)} />
          <nav
            className="fixed top-0 left-0 h-full w-72 bg-[--bg] z-50 flex flex-col pt-20 pb-8 px-8 shadow-xl animate-fade-in lg:hidden"
            style={{ borderRight: '1px solid var(--border)' }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 right-5 p-2 text-[--text-muted] hover:text-[--gold] transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col gap-1">
              {navLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMobileOpen(false)}
                  style={({ isActive }) => ({
                    padding: '1rem 0',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.5rem',
                    color: isActive ? 'var(--gold)' : 'var(--text)',
                    borderBottom: '1px solid var(--border)',
                    transition: 'color 0.2s',
                  })}
                >
                  {label}
                </NavLink>
              ))}
            </div>

            <div className="mt-auto flex items-center gap-4">
              <button
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-[--text-muted] hover:text-[--gold] transition-colors"
              >
                <Globe size={14} />
                {language === 'en' ? 'Español' : 'English'}
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
