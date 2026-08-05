import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';

export function CategoriesSection() {
  const { t, language } = useLanguage();
  const { categories } = useData();

  return (
    <section className="py-24 bg-[--bg]">
      <div className="page-container">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="section-label mb-3">{t('categories.subtitle')}</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.875rem, 4vw, 3rem)', fontWeight: 300 }}>
            {t('categories.title')}
          </h2>
          <div className="gold-line mt-5" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.filter((c) => c.active).map((cat) => {
            const name = language === 'es' ? cat.name : cat.nameEn;
            return (
              <Link
                key={cat.id}
                to={`/catalog?category=${cat.id}`}
                className="group flex flex-col items-center gap-3"
              >
                {/* Image */}
                <div
                  className="img-zoom w-full overflow-hidden"
                  style={{ aspectRatio: '1/1', background: 'var(--gray-100)' }}
                >
                  <img
                    src={cat.image}
                    alt={name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Label */}
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                    color: 'var(--text)',
                    transition: 'color 0.2s',
                  }}
                  className="group-hover:text-[--gold]"
                >
                  {name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* View all link */}
        <div className="text-center mt-10">
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.18em] text-[--text-muted] hover:text-[--gold] transition-colors"
          >
            {t('categories.viewAll')} <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </section>
  );
}
