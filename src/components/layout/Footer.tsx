import { Link } from 'react-router-dom';
import { MapPin, Phone } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { STORE } from '../../utils/store';

export function Footer() {
  const { t, language } = useLanguage();
  const { categories } = useData();
  const year = new Date().getFullYear();

  // The store's real categories (the catalog filters by category id)
  const shopLinks = [
    ...categories
      .filter((c) => c.active)
      .slice(0, 6)
      .map((c) => ({ to: `/catalog?category=${c.id}`, label: language === 'es' ? c.name : c.nameEn || c.name })),
    { to: '/catalog', label: t('nav.catalog') },
  ];

  const companyLinks = [
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
    { to: '/track', label: t('track.link') },
  ];

  const legalLinks = [
    { to: '/legal/privacy', label: t('footer.privacy') },
    { to: '/legal/terms', label: t('footer.terms') },
    { to: '/legal/returns', label: t('footer.returns') },
    { to: '/legal/cookies', label: 'Política de Cookies' },
  ];

  return (
    <footer
      style={{
        background: 'var(--black)',
        color: 'var(--gray-400)',
        borderTop: '1px solid #1A1A1A',
      }}
    >
      <div className="page-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.25rem',
                  letterSpacing: '0.08em',
                  color: 'var(--white)',
                }}
              >
                ALEXANDRA
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.22em',
                  color: 'var(--gold)',
                }}
              >
                JEWELRY
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.7', color: 'var(--gray-500)' }}>
              {t('footer.tagline')}
            </p>
            {/* Store */}
            <div className="flex flex-col gap-2 mt-2" style={{ fontSize: '0.8125rem' }}>
              <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:text-(--gold) transition-colors">
                <MapPin size={14} style={{ marginTop: 3, flexShrink: 0 }} />
                <span>{STORE.street}, {STORE.cityLine}</span>
              </a>
              <a href={STORE.phoneHref} className="flex items-center gap-2 hover:text-(--gold) transition-colors">
                <Phone size={14} /> {STORE.phone}
              </a>
            </div>
          </div>

          {/* Shop */}
          <FooterColumn title={t('footer.catalog')} links={shopLinks} />

          {/* Company */}
          <FooterColumn title={t('footer.company')} links={companyLinks} />

          {/* Legal */}
          <FooterColumn title={t('footer.legal')} links={legalLinks} />
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid #1A1A1A' }}>
        <div className="page-container py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p style={{ fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
            {t('footer.copyright').replace('2026', String(year))}
          </p>
          <p
            style={{ fontSize: '0.8125rem', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {STORE.address}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h4
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.6875rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--gray-300)',
          fontWeight: 500,
        }}
      >
        {title}
      </h4>
      <ul className="flex flex-col gap-2.5">
        {links.map(({ to, label }) => (
          <li key={label}>
            <Link
              to={to}
              style={{ fontSize: '0.875rem', color: 'var(--gray-500)', transition: 'color 0.2s' }}
              className="hover:text-(--gold)"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
