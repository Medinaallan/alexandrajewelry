import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatPrice } from '../../utils/formatPrice';
import { Button } from '../ui/Button';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, clearCart, subtotal, total, totalItems } = useCart();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeCart]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <>
      <div className="overlay" onClick={closeCart} />
      <div ref={drawerRef} className="cart-drawer" role="dialog" aria-label={t('cart.title')}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} style={{ color: 'var(--gold)' }} />
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400 }}>
              {t('cart.title')}
            </h2>
            {totalItems > 0 && (
              <span
                className="flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-medium"
                style={{ background: 'var(--gold)' }}
              >
                {totalItems}
              </span>
            )}
          </div>
          <button onClick={closeCart} className="p-1.5 hover:text-[--gold] transition-colors text-[--text-muted]">
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
              <ShoppingBag size={48} style={{ color: 'var(--gray-300)' }} />
              <div>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                  {t('cart.empty')}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {t('cart.emptySubtitle')}
                </p>
              </div>
              <button
                onClick={() => { closeCart(); navigate('/catalog'); }}
                className="btn-outline"
                style={{ padding: '0.75rem 1.5rem' }}
              >
                {t('cart.exploreCatalog')}
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[--border]">
              {items.map(({ product, quantity }) => {
                const name = language === 'es' ? product.nameEs : product.name;
                return (
                  <li key={product.id} className="flex gap-4 px-6 py-4">
                    <Link
                      to={`/product/${product.slug}`}
                      onClick={closeCart}
                      className="flex-shrink-0 w-20 h-24 overflow-hidden bg-[--gray-100]"
                    >
                      <img
                        src={product.images[0]}
                        alt={name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                    <div className="flex flex-col flex-1 gap-1 min-w-0">
                      <Link
                        to={`/product/${product.slug}`}
                        onClick={closeCart}
                        style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9375rem', lineHeight: 1.3 }}
                        className="hover:text-[--gold] transition-colors line-clamp-2"
                      >
                        {name}
                      </Link>
                      <span className="section-label text-[9px]">
                        {language === 'es' ? product.categoryNameEs : product.categoryName}
                      </span>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        {/* Quantity */}
                        <div
                          className="flex items-center"
                          style={{ border: '1px solid var(--border)' }}
                        >
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="p-1.5 hover:text-[--gold] transition-colors text-[--text-muted]"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-3 text-sm font-medium">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="p-1.5 hover:text-[--gold] transition-colors text-[--text-muted]"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9375rem', fontWeight: 500 }}>
                          {formatPrice(product.price * quantity)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="flex-shrink-0 p-1.5 hover:text-red-500 transition-colors text-[--text-subtle] self-start"
                      aria-label={t('cart.remove')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            className="px-6 py-5 flex flex-col gap-4"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}
          >
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>{t('cart.subtotal')}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>{t('cart.shipping')}</span>
                <span style={{ color: 'var(--gold)' }}>{t('cart.shippingFree')}</span>
              </div>
              <div
                className="flex justify-between pt-2 mt-1"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem' }}>
                  {t('cart.total')}
                </span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem' }}>
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <Button variant="gold" className="w-full justify-center" onClick={handleCheckout}>
              {t('cart.checkout')} <ArrowRight size={14} />
            </Button>

            <button
              onClick={clearCart}
              className="text-center text-xs text-[--text-muted] hover:text-red-500 transition-colors tracking-wide uppercase"
            >
              {t('cart.clear')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
