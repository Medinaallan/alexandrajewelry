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
import { categories as localCategories } from '../data/categories';
import { products as localProducts } from '../data/products';
import { testimonials as localTestimonials } from '../data/testimonials';

const CAT_ID: Record<string, number> = {
  'cat-rings': 1, 'cat-necklaces': 2, 'cat-bracelets': 3,
  'cat-earrings': 4, 'cat-sets': 5, 'cat-gold': 6,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptCategory(c: any): Category {
  return {
    id: CAT_ID[c.id] ?? 0,
    name: c.nameEs ?? c.name,
    nameEn: c.name,
    slug: c.slug,
    image: c.image ?? '',
    description: c.descriptionEs ?? c.description ?? '',
    descriptionEn: c.description ?? '',
    active: c.active ?? true,
    createdAt: new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptProduct(p: any, i: number): Product {
  const id = i + 1;
  return {
    id,
    code: p.id ?? `PROD-${id}`,
    name: p.nameEs ?? p.name,
    nameEn: p.name,
    slug: p.slug,
    categoryId: CAT_ID[p.categoryId] ?? 0,
    subcategoryId: 0,
    description: p.descriptionEs ?? p.description ?? '',
    descriptionEn: p.description ?? '',
    cost: null,
    price: p.price ?? 0,
    tax: 0,
    stock: p.available !== false ? 10 : 0,
    minStock: 1,
    featured: p.featured ?? false,
    active: p.active ?? true,
    images: ((p.images ?? []) as string[]).map((url, j) => ({
      id: j, productId: id, filename: url, data: url,
      displayOrder: j, createdAt: new Date().toISOString(),
    })),
    createdAt: p.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

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
        api.testimonials.listApproved(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setSubcategories(subs);
      setTestimonials(tests);
    } catch (err) {
      console.warn('API unavailable, loading local data:', err);
      setCategories(localCategories.map(adaptCategory));
      setProducts(localProducts.map(adaptProduct));
      setTestimonials(localTestimonials);
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
