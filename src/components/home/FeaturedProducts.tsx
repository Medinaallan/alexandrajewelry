import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { ProductCard } from '../product/ProductCard';

export function FeaturedProducts() {
  const { t } = useLanguage();
  const { getFeaturedProducts } = useData();
  const featured = getFeaturedProducts().slice(0, 8);

  return (
    <section className="py-28 bg-[--bg-subtle]">
      <div className="page-container">
        {/* Header */}
        <div className="text-center mb-20">
          <p className="section-label mb-3">{t('featured.label')}</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.875rem, 4vw, 3rem)', fontWeight: 300 }}>
            {t('featured.title')}
          </h2>
          <div className="gold-line mt-5" />
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-12">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link to="/catalog" className="btn-outline">
            {t('featured.viewAll')} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
