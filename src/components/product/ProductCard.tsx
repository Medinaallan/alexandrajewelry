import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye } from 'lucide-react';
import type { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatPrice } from '../../utils/formatPrice';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCart();
  const { categories } = useData();
  const { t, language } = useLanguage();
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const name = language === 'es' ? product.name : product.nameEn;
  const imageSrc = product.images?.[0]?.data || FALLBACK_IMG;
  const category = categories.find((c) => c.id === product.categoryId);
  const categoryName = language === 'es' ? category?.name : category?.nameEn;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.active) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className={cn('group flex flex-col', className)}>
      <Link to={`/product/${product.slug}`} className="block">
        {/* Image container */}
        <div
          className="img-zoom relative overflow-hidden bg-[--gray-100]"
          style={{ aspectRatio: '3/4' }}
        >
          <img
            src={imgError ? FALLBACK_IMG : imageSrc}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />

          {/* Badge */}
          {product.featured && (
            <div className="absolute top-3 left-3">
              <Badge label={t('product.popular')} variant="popular" />
            </div>
          )}

          {/* Hover actions */}
          <div
            className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}
          >
            <button
              onClick={handleAdd}
              disabled={!product.active}
              className={cn(
                'w-full py-3 text-[10px] font-medium tracking-[0.15em] uppercase transition-colors flex items-center justify-center gap-2',
                product.active
                  ? added
                    ? 'bg-[--gold] text-white'
                    : 'bg-white text-[--black] hover:bg-[--gold] hover:text-white'
                  : 'bg-white/40 text-white cursor-not-allowed'
              )}
            >
              <ShoppingBag size={12} />
              {!product.active
                ? t('product.outOfStock')
                : added
                ? t('product.addedToCart')
                : t('product.addToCart')}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="pt-5 flex flex-col gap-2">
          <span className="section-label" style={{ fontSize: '0.75rem' }}>
            {categoryName}
          </span>
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.125rem',
              fontWeight: 400,
              color: 'var(--text)',
              lineHeight: 1.3,
              transition: 'color 0.2s',
            }}
            className="group-hover:text-[--gold]"
          >
            {name}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', fontWeight: 500, color: 'var(--text)' }}>
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
      </Link>

      {/* Desktop quick action */}
      <button
        onClick={handleAdd}
        disabled={!product.active}
        className={cn(
          'mt-4 w-full py-3 text-[0.75rem] font-medium tracking-[0.15em] uppercase border transition-colors hidden sm:flex items-center justify-center gap-2',
          product.active
            ? added
              ? 'border-[--gold] bg-[--gold] text-white'
              : 'border-[--border] text-[--text-muted] hover:border-[--gold] hover:text-[--gold]'
            : 'border-[--border] text-[--text-subtle] cursor-not-allowed'
        )}
      >
        <ShoppingBag size={11} />
        {!product.active
          ? t('product.outOfStock')
          : added
          ? t('product.addedToCart')
          : t('product.addToCart')}
      </button>

      <Link
        to={`/product/${product.slug}`}
        className="mt-1.5 w-full py-2 text-[0.75rem] font-medium tracking-[0.15em] uppercase border border-transparent text-[--text-muted] hover:text-[--gold] transition-colors hidden sm:flex items-center justify-center gap-2"
      >
        <Eye size={11} />
        {t('product.viewDetail')}
      </Link>
    </article>
  );
}
