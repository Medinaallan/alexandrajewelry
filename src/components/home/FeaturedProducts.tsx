import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { ProductCard } from '../product/ProductCard';

export function FeaturedProducts() {
  const { t } = useLanguage();
  const { getFeaturedProducts, products } = useData();
  const marked = getFeaturedProducts();
  // Sin destacados marcados, mostrar el catálogo activo para no dejar la sección vacía
  const featured = (marked.length > 0 ? marked : products.filter((p) => p.active)).slice(0, 8);

  if (featured.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-(--bg-subtle)">
      <div className="page-container">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="section-label mb-3">{t('featured.label')}</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 300 }}>
            {t('featured.title')}
          </h2>
          <div className="gold-line mt-4" />
        </div>

        {/* Product grid */}
        <div className="flex flex-wrap justify-center gap-6 lg:gap-8">
          {featured.map((product) => (
            <div
              key={product.id}
              className="w-[calc(50%-0.75rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1.5rem)]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/catalog" className="btn-outline">
            {t('featured.viewAll')} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
