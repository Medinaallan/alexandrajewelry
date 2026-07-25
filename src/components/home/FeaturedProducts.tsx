import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getFeaturedProducts } from '../../data/products';
import { ProductCard } from '../product/ProductCard';

export function FeaturedProducts() {
  const { t } = useLanguage();
  const featured = getFeaturedProducts().slice(0, 8);

  return (
    <section className="py-24 bg-[--bg-subtle]">
      <div className="page-container">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="section-label mb-3">{t('featured.label')}</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.875rem, 4vw, 3rem)', fontWeight: 300 }}>
            {t('featured.title')}
          </h2>
          <div className="gold-line mt-5" />
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <Link to="/catalog" className="btn-outline inline-flex items-center gap-2">
            {t('featured.viewAll')} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
