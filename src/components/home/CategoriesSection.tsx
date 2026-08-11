import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

import { useData } from '../../contexts/DataContext';

export function CategoriesSection() {
  const { t, language } = useLanguage();
  const { categories } = useData();
  const active = categories.filter((c) => c.active);

  return (
    <section className="py-16 md:py-24" style={{ background: 'var(--bg)' }}>
      <div className="page-container">
        <div className="text-center mb-12">
          <p className="section-label mb-3">{t('categories.subtitle')}</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 300 }}>
            {t('categories.title')}
          </h2>
          <div className="gold-line mt-4" />
        </div>

        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {active.map((cat) => {
            const name = language === 'es' ? cat.name : cat.nameEn;
            return (
              <Link
                key={cat.id}
                to={`/catalog?category=${cat.id}`}
                className="group"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.65rem 1.5rem',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  transition: 'all 0.25s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--gold)';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--gold)';
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(212,175,55,0.06)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)';
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                }}
              >
                {name}
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 text-[--text-muted] hover:text-[--gold] transition-colors"
            style={{ fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase' }}
          >
            {t('categories.viewAll')} <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </section>
  );
}
