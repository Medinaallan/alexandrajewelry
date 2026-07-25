// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  nameEs: string;
  slug: string;
  image: string;
  description: string;
  descriptionEs: string;
  active: boolean;
  productCount?: number;
}

export interface Product {
  id: string;
  name: string;
  nameEs: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  categoryNameEs: string;
  price: number;
  originalPrice?: number;
  description: string;
  descriptionEs: string;
  additionalInfo: string;
  additionalInfoEs: string;
  material: string;
  materialEs: string;
  color: string;
  colorEs: string;
  images: string[];
  available: boolean;
  active: boolean;
  featured: boolean;
  isNew: boolean;
  onSale: boolean;
  tags: string[];
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CheckoutForm {
  name: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
  paymentMethod: 'transfer' | 'googlepay' | 'paypal' | 'whatsapp';
  transferFile?: File | null;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  locationEs: string;
  rating: number;
  text: string;
  textEs: string;
  avatar: string;
  date: string;
}

export interface AdminUser {
  username: string;
  password: string;
  displayName: string;
}

// ─── Filter/Sort Types ─────────────────────────────────────────────────────────

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc';

export interface CatalogFilters {
  category: string;
  minPrice: number;
  maxPrice: number;
  sort: SortOption;
  search: string;
}

// ─── Context Types ─────────────────────────────────────────────────────────────

export interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

export type Language = 'en' | 'es';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export interface AdminContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  products: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
}
