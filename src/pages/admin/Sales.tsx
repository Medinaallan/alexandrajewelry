import { useEffect, useState, useCallback, useMemo } from 'react';
import { ShoppingBag, DollarSign, Search, X, ImageIcon } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Button } from '../../components/ui/Button';
import { formatPrice } from '../../utils/formatPrice';
import type { Product, Category, Subcategory } from '../../types';

type CartLine = {
  productId: number;
  code: string;
  name: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '8px 12px',
  color: 'var(--text)',
  fontSize: '0.875rem',
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px',
  borderRadius: '999px',
  border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
  background: active ? 'rgba(201,164,93,0.15)' : 'transparent',
  color: active ? 'var(--gold)' : 'var(--text-muted)',
  fontSize: '0.75rem',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'all 0.15s',
});

export default function AdminSalesPage() {
  const { token } = useAdmin();
  const { t } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const [cart, setCart] = useState<CartLine[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchData = useCallback(async () => {
    if (!token) return;
    const [p, c, s] = await Promise.all([
      api.admin.products.list(token),
      api.admin.categories.list(token),
      api.admin.subcategories.list(token),
    ]);
    setProducts(p);
    setCategories(c);
    setSubcategories(s);
  }, [token]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const visibleSubcategories = useMemo(
    () => subcategories.filter((s) => s.active && s.categoryId === selectedCategory),
    [subcategories, selectedCategory]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (!p.active) return false;
      if (selectedCategory && p.categoryId !== selectedCategory) return false;
      if (selectedSubcategory && p.subcategoryId !== selectedSubcategory) return false;
      if (q && !`${p.name} ${p.code}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, selectedCategory, selectedSubcategory, search]);

  const addToCart = (p: Product) => {
    if (!p.active || p.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        if (existing.quantity >= p.stock) return prev;
        return prev.map((l) => (l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { productId: p.id, code: p.code, name: p.name, unitPrice: p.price, quantity: 1, maxStock: p.stock }];
    });
  };

  const updateLineQuantity = (productId: number, quantity: number) => {
    setCart((prev) => prev.map((l) => (
      l.productId === productId
        ? { ...l, quantity: Math.max(1, Math.min(quantity, l.maxStock)) }
        : l
    )));
  };

  const updateLinePrice = (productId: number, unitPrice: number) => {
    setCart((prev) => prev.map((l) => (
      l.productId === productId ? { ...l, unitPrice: Math.max(0, unitPrice) } : l
    )));
  };

  const removeLine = (productId: number) => {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  };

  const total = cart.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

  const handleConfirm = async () => {
    if (!token || cart.length === 0) return;
    setFormError('');
    setFormSuccess('');
    setSaving(true);
    const remaining = [...cart];
    try {
      while (remaining.length > 0) {
        const line = remaining[0];
        await api.admin.sales.create(token, {
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          notes,
        });
        remaining.shift();
      }
      setFormSuccess(t('admin.sales.success'));
      setCart([]);
      setNotes('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al registrar.');
      setCart(remaining);
    } finally {
      setSaving(false);
      await fetchData();
    }
  };

  const sectionCard: React.CSSProperties = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '24px',
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, color: 'var(--text)' }}>
            {t('admin.sales.title')}
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Cart / register panel */}
          <div style={{ ...sectionCard, borderColor: 'var(--gold)' }} className="w-full lg:w-95 shrink-0">
            <h2 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={16} style={{ color: 'var(--gold)' }} />
              {t('admin.sales.register')}
            </h2>

            {cart.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                {t('admin.sales.emptyCart')}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1rem' }}>
                {cart.map((l) => (
                  <div key={l.productId} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px' }}>
                    <div className="flex items-start justify-between" style={{ marginBottom: '6px' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text)' }}>{l.name}</div>
                      <button
                        type="button"
                        onClick={() => removeLine(l.productId)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                          {t('admin.sales.quantity')}
                        </label>
                        <input
                          type="number"
                          style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.8125rem' }}
                          value={l.quantity}
                          onChange={(e) => updateLineQuantity(l.productId, Number(e.target.value))}
                          min={1}
                          max={l.maxStock}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                          {t('admin.sales.unitPrice')}
                        </label>
                        <input
                          type="number"
                          style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.8125rem' }}
                          value={l.unitPrice}
                          onChange={(e) => updateLinePrice(l.productId, Number(e.target.value))}
                          min={0}
                          step={0.01}
                        />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      {formatPrice(l.quantity * l.unitPrice)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {t('admin.sales.notes')}
              </label>
              <input
                type="text"
                style={inputStyle}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opcional..."
              />
            </div>

            {total > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '10px 14px', background: 'rgba(201,164,93,0.08)', borderRadius: 'var(--radius)', border: '1px solid rgba(201,164,93,0.3)' }}>
                <DollarSign size={16} style={{ color: 'var(--gold)' }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('admin.sales.total')}:</span>
                <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '1.125rem' }}>{formatPrice(total)}</span>
              </div>
            )}

            {formError && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '10px' }}>{formError}</p>}
            {formSuccess && <p style={{ color: '#22c55e', fontSize: '0.8rem', marginBottom: '10px' }}>{formSuccess}</p>}

            <Button
              type="button"
              disabled={saving || cart.length === 0}
              onClick={() => void handleConfirm()}
              style={{ width: '100%' }}
            >
              {saving ? '...' : t('admin.sales.confirm')}
            </Button>
          </div>

          {/* Product catalog */}
          <div style={{ ...sectionCard, flex: 1, minWidth: 0, width: '100%' }}>
            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '10px', paddingBottom: '4px' }}>
              <button
                type="button"
                style={tabStyle(selectedCategory === null)}
                onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}
              >
                {t('admin.sales.allCategories')}
              </button>
              {categories.filter((c) => c.active).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  style={tabStyle(selectedCategory === c.id)}
                  onClick={() => { setSelectedCategory(c.id); setSelectedSubcategory(null); }}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Subcategory tabs */}
            {selectedCategory !== null && visibleSubcategories.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '14px', paddingBottom: '4px' }}>
                <button
                  type="button"
                  style={tabStyle(selectedSubcategory === null)}
                  onClick={() => setSelectedSubcategory(null)}
                >
                  {t('admin.sales.allSubcategories')}
                </button>
                {visibleSubcategories.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    style={tabStyle(selectedSubcategory === s.id)}
                    onClick={() => setSelectedSubcategory(s.id)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                style={{ ...inputStyle, paddingLeft: '32px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.sales.searchProducts')}
              />
            </div>

            {/* Product grid */}
            {filteredProducts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('admin.sales.noProducts')}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((p) => {
                  const outOfStock = p.stock <= 0;
                  const inCart = cart.find((l) => l.productId === p.id);
                  const atMax = !!inCart && inCart.quantity >= p.stock;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={outOfStock || atMax}
                      onClick={() => addToCart(p)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        textAlign: 'left',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--bg-secondary)',
                        padding: '10px',
                        cursor: outOfStock || atMax ? 'not-allowed' : 'pointer',
                        opacity: outOfStock ? 0.5 : 1,
                        transition: 'border-color 0.15s',
                      }}
                    >
                      <div style={{ width: '100%', aspectRatio: '1 / 1', background: 'var(--bg)', borderRadius: 'var(--radius)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                        {p.images?.[0]?.data
                          ? <img src={p.images[0].data} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <ImageIcon size={20} style={{ color: 'var(--text-subtle)' }} />
                        }
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '4px' }}>
                        {p.code}
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--gold)' }}>{formatPrice(p.price)}</span>
                        <span style={{ fontSize: '0.65rem', color: outOfStock ? '#ef4444' : 'var(--text-muted)' }}>
                          {outOfStock ? t('admin.sales.outOfStock') : `${t('admin.sales.available')}: ${p.stock}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
