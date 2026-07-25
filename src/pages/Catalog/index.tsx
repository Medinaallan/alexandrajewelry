import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { products } from '../../data/products';
import { categories } from '../../data/categories';
import { ProductCard } from '../../components/product/ProductCard';
import { ProductGridSkeleton } from '../../components/ui/Skeleton';
import { useLanguage } from '../../contexts/LanguageContext';
import type { CatalogFilters, SortOption } from '../../types';

const MAX_PRICE = 4000;

export default function CatalogPage() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState<CatalogFilters>({
    category: searchParams.get('category') || '',
    minPrice: 0,
    maxPrice: MAX_PRICE,
    sort: (searchParams.get('sort') as SortOption) || 'newest',
    search: searchParams.get('search') || '',
  });

  // Sync URL → filters when params change
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: searchParams.get('category') || '',
      search: searchParams.get('search') || '',
    }));
  }, [searchParams]);

  // Simulate loading
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [filters]);

  const filtered = useMemo(() => {
    let result = products.filter((p) => p.active);

    if (filters.category) {
      result = result.filter((p) => p.categoryId === filters.category);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameEs.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }
    result = result.filter(
      (p) => p.price >= filters.minPrice && p.price <= filters.maxPrice
    );

    switch (filters.sort) {
      case 'price-asc':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        result = [...result].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return result;
  }, [filters]);

  const setFilter = <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ category: '', minPrice: 0, maxPrice: MAX_PRICE, sort: 'newest', search: '' });
    setSearchParams({});
  };

  const hasActiveFilters = filters.category || filters.search || filters.minPrice > 0 || filters.maxPrice < MAX_PRICE;

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: t('catalog.sort.newest') },
    { value: 'price-asc', label: t('catalog.sort.priceAsc') },
    { value: 'price-desc', label: t('catalog.sort.priceDesc') },
    { value: 'name-asc', label: t('catalog.sort.nameAsc') },
  ];

  return (
    <main className="pb-24 pt-12">
      <div className="page-container">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="section-label mb-3">{t('catalog.subtitle')}</p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 300 }}>
            {t('catalog.title')}
          </h1>
          <div className="gold-line mt-5" />
        </div>

        {/* Filter bar */}
        <div
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-10 pb-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                placeholder={t('catalog.search')}
                className="form-input pr-8"
                style={{ width: '220px', padding: '0.625rem 0.875rem' }}
              />
              {filters.search && (
                <button
                  onClick={() => setFilter('search', '')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[--text-muted] hover:text-[--gold]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className="lg:hidden flex items-center gap-2 btn-outline"
              style={{ padding: '0.625rem 1rem' }}
            >
              <SlidersHorizontal size={14} /> Filters
            </button>
          </div>

          {/* Sort */}
          <div className="relative flex items-center gap-2">
            <span className="text-xs text-[--text-muted] uppercase tracking-widest hidden sm:inline">
              {t('catalog.filter.sortBy')}
            </span>
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => setFilter('sort', e.target.value as SortOption)}
                className="form-input appearance-none pr-8 cursor-pointer"
                style={{ padding: '0.5rem 2rem 0.5rem 0.875rem', fontSize: '0.8125rem' }}
              >
                {sortOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[--text-muted]" />
            </div>
          </div>
        </div>

        <div className="flex gap-10">
          {/* Sidebar filters */}
          <aside
            className={`flex-shrink-0 w-56 ${filtersOpen ? 'block' : 'hidden'} lg:block`}
            style={{ position: 'sticky', top: '88px', alignSelf: 'flex-start', height: 'fit-content' }}
          >
            <div className="flex flex-col gap-7">
              {/* Category */}
              <div>
                <h3
                  className="section-label mb-4"
                  style={{ display: 'block', marginBottom: '1rem' }}
                >
                  {t('catalog.filter.category')}
                </h3>
                <ul className="flex flex-col gap-1">
                  <li>
                    <button
                      onClick={() => setFilter('category', '')}
                      className="flex items-center justify-between w-full py-1.5 text-sm text-left transition-colors"
                      style={{ color: !filters.category ? 'var(--gold)' : 'var(--text-muted)' }}
                    >
                      {t('catalog.filter.allCategories')}
                    </button>
                  </li>
                  {categories.filter((c) => c.active).map((cat) => {
                    const name = language === 'es' ? cat.nameEs : cat.name;
                    return (
                      <li key={cat.id}>
                        <button
                          onClick={() => setFilter('category', cat.id)}
                          className="flex items-center justify-between w-full py-1.5 text-sm text-left transition-colors"
                          style={{ color: filters.category === cat.id ? 'var(--gold)' : 'var(--text-muted)' }}
                        >
                          {name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Price */}
              <div>
                <h3 className="section-label mb-4" style={{ display: 'block', marginBottom: '1rem' }}>
                  {t('catalog.filter.price')}
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm text-[--text-muted]">
                    <span>${filters.minPrice}</span>
                    <span>${filters.maxPrice === MAX_PRICE ? `${MAX_PRICE}+` : filters.maxPrice}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={MAX_PRICE}
                    step={100}
                    value={filters.maxPrice}
                    onChange={(e) => setFilter('maxPrice', Number(e.target.value))}
                    className="w-full accent-[--gold] cursor-pointer"
                  />
                </div>
              </div>

              {/* Clear */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-xs text-[--text-muted] hover:text-red-500 transition-colors"
                >
                  <X size={12} /> {t('catalog.clearFilters')}
                </button>
              )}
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[--text-muted] mb-6 tracking-wide">
              {filtered.length} {t('catalog.results')}
            </p>

            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                  {t('catalog.noResults')}
                </p>
                <button onClick={clearFilters} className="btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
                  {t('catalog.clearFilters')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-8">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
