import { Link } from 'react-router-dom';
import { Globe, Hash, ExternalLink, Heart } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  const shopLinks = [
    { to: '/catalog?category=cat-rings', label: 'Rings' },
    { to: '/catalog?category=cat-necklaces', label: 'Necklaces' },
    { to: '/catalog?category=cat-bracelets', label: 'Bracelets' },
    { to: '/catalog?category=cat-earrings', label: 'Earrings' },
    { to: '/catalog?category=cat-sets', label: 'Sets' },
    { to: '/catalog?category=cat-gold', label: '14K Gold' },
  ];

  const companyLinks = [
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
    { to: '/catalog', label: t('nav.catalog') },
  ];

  const legalLinks = [
    { to: '#', label: t('footer.privacy') },
    { to: '#', label: t('footer.terms') },
    { to: '#', label: t('footer.returns') },
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
                  fontSize: '0.6rem',
                  letterSpacing: '0.22em',
                  color: 'var(--gold)',
                }}
              >
                JEWELRY
              </div>
            </div>
            <p style={{ fontSize: '0.8125rem', lineHeight: '1.7', color: 'var(--gray-500)' }}>
              {t('footer.tagline')}
            </p>
            {/* Socials */}
            <div className="flex items-center gap-3 mt-2">
              {[
              { Icon: Globe, label: 'Instagram' },
              { Icon: Hash, label: 'Facebook' },
              { Icon: ExternalLink, label: 'Twitter / X' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="p-2 border border-[#2a2a2a] hover:border-[--gold] hover:text-[--gold] transition-all duration-300"
                  style={{ color: 'var(--gray-500)' }}
                >
                  <Icon size={15} />
                </a>
              ))}
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
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
            {t('footer.copyright').replace('2026', String(year))}
          </p>
          <p
            style={{ fontSize: '0.75rem', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Made with <Heart size={11} style={{ color: 'var(--gold)' }} /> by Alexandra
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
          fontSize: '0.6rem',
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
              style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', transition: 'color 0.2s' }}
              className="hover:text-[--gold]"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
