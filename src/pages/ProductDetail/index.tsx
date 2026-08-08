import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatPrice } from '../../utils/formatPrice';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProductCard } from '../../components/product/ProductCard';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { getProductBySlug, getRelatedProducts, categories, loading } = useData();

  const product = slug ? getProductBySlug(slug) : null;
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (loading) {
    return (
      <div className="page-container py-32 text-center">
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container py-32 text-center">
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '1rem' }}>
          Product not found
        </h2>
        <Button variant="outline" onClick={() => navigate('/catalog')}>
          <ArrowLeft size={14} /> Back to Catalog
        </Button>
      </div>
    );
  }

  const name = language === 'es' ? product.name : product.nameEn;
  const description = language === 'es' ? product.description : product.descriptionEn;
  const related = getRelatedProducts(product, 4);
  const category = categories.find((c) => c.id === product.categoryId);
  const categoryName = language === 'es' ? category?.name : category?.nameEn;

  const handleAdd = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const prevImage = () => setActiveImage((i) => (i === 0 ? product.images.length - 1 : i - 1));
  const nextImage = () => setActiveImage((i) => (i === product.images.length - 1 ? 0 : i + 1));

  return (
    <main className="pb-24">
      {/* Breadcrumb */}
      <div className="page-container py-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <nav className="flex items-center gap-2 text-xs text-[--text-muted]">
          <Link to="/" className="hover:text-[--gold] transition-colors">{t('nav.home')}</Link>
          <span>/</span>
          <Link to="/catalog" className="hover:text-[--gold] transition-colors">{t('nav.catalog')}</Link>
          <span>/</span>
          <span style={{ color: 'var(--text)' }}>{name}</span>
        </nav>
      </div>

      <div className="page-container py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-28">

          {/* â”€â”€ Image Gallery â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex flex-col gap-4">
            {/* Main image */}
            <div
              className="relative overflow-hidden bg-[--gray-100]"
              style={{ aspectRatio: '1/1' }}
            >
              <img
                src={product.images[activeImage]?.data || ''}
                alt={name}
                className="w-full h-full object-cover transition-opacity duration-300"
                key={activeImage}
                style={{ animation: 'fadeIn 0.3s ease' }}
              />
              {/* Featured badge */}
              {product.featured && (
                <div className="absolute top-4 left-4">
                  <Badge label={t('product.popular')} variant="popular" />
                </div>
              )}

              {/* Nav arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white transition-colors shadow-sm"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white transition-colors shadow-sm"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-4">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className="shrink-0 overflow-hidden"
                    style={{
                      width: '80px',
                      aspectRatio: '1/1',
                      border: `2px solid ${i === activeImage ? 'var(--gold)' : 'var(--border)'}`,
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <img src={img.data || ''} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* â”€â”€ Product Info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex flex-col gap-8">
            {/* Category */}
            <span className="section-label">{categoryName}</span>

            {/* Name */}
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                fontWeight: 300,
                lineHeight: 1.2,
              }}
            >
              {name}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: 'var(--text)' }}>
                {formatPrice(product.price)}
              </span>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'var(--border)', width: '100%' }} />

            {/* Description */}
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '0.9375rem' }}>
              {description}
            </p>

            {/* Details */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="w-28 shrink-0 text-xs uppercase tracking-widest text-[--text-muted]">
                  {t('detail.availability')}
                </span>
                <span style={{ fontSize: '0.875rem', color: product.active ? 'var(--gold)' : 'var(--text-muted)', fontWeight: product.active ? 500 : 400 }}>
                  {product.active ? t('detail.available') : t('detail.unavailable')}
                </span>
              </div>
              {product.code && (
                <div className="flex items-center gap-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="w-28 shrink-0 text-xs uppercase tracking-widest text-[--text-muted]">
                    {t('detail.category')}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{product.code}</span>
                </div>
              )}
            </div>

            {/* Quantity + Add to cart */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <span className="text-xs uppercase tracking-widest text-[--text-muted]">
                  {t('detail.quantity')}
                </span>
                <div className="flex items-center" style={{ border: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-4 py-3 hover:text-[--gold] transition-colors text-lg leading-none"
                  >
                    -
                  </button>
                  <span className="px-6 py-3 text-sm font-medium" style={{ borderInline: '1px solid var(--border)' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-4 py-3 hover:text-[--gold] transition-colors text-lg leading-none"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="gold"
                  className="flex-1 justify-center"
                  disabled={!product.active}
                  onClick={handleAdd}
                >
                  <ShoppingBag size={15} />
                  {added ? t('product.addedToCart') : t('product.addToCart')}
                </Button>
                <button
                  onClick={handleShare}
                  className="p-4 border border-[--border] hover:border-[--gold] hover:text-[--gold] transition-colors"
                  aria-label={t('detail.share')}
                >
                  <Share2 size={17} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-32">
            <div className="text-center mb-16">
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300 }}>
                {t('detail.related')}
              </h2>
              <div className="gold-line mt-4" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
