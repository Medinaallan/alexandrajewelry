import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Product, Category, Subcategory, Testimonial } from '../types';
import { api } from '../lib/api';

interface DataContextType {
  products: Product[];
  categories: Category[];
  subcategories: Subcategory[];
  testimonials: Testimonial[];
  loading: boolean;
  refetch: () => Promise<void>;
  getFeaturedProducts: () => Product[];
  getProductBySlug: (slug: string) => Product | undefined;
  getRelatedProducts: (product: Product, limit?: number) => Product[];
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, cats, subs, tests] = await Promise.all([
        api.products.list(),
        api.categories.list(),
        api.subcategories.list(),
        api.testimonials.list(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setSubcategories(subs);
      setTestimonials(tests);
    } catch (err) {
      console.error('Failed to fetch store data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getFeaturedProducts = useCallback(
    () => products.filter((p) => p.featured && p.active),
    [products]
  );

  const getProductBySlug = useCallback(
    (slug: string) => products.find((p) => p.slug === slug),
    [products]
  );

  const getRelatedProducts = useCallback(
    (product: Product, limit = 4) =>
      products
        .filter((p) => p.active && p.id !== product.id && p.categoryId === product.categoryId)
        .slice(0, limit),
    [products]
  );

  return (
    <DataContext.Provider
      value={{
        products,
        categories,
        subcategories,
        testimonials,
        loading,
        refetch: fetchAll,
        getFeaturedProducts,
        getProductBySlug,
        getRelatedProducts,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
