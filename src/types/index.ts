// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  nameEn: string;
  slug: string;
  image: string;
  description: string;
  descriptionEn: string;
  active: boolean;
  createdAt: string;
}

export interface Subcategory {
  id: number;
  categoryId: number;
  name: string;
  nameEn: string;
  slug: string;
  description: string;
  descriptionEn: string;
  active: boolean;
  createdAt: string;
}

export interface ProductImage {
  id: number;
  productId: number;
  filename: string;
  data?: string | null;  // base64 data URI when uploaded via API
  displayOrder: number;
  createdAt: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  nameEn: string;
  slug: string;
  categoryId: number;
  subcategoryId: number;
  description: string;
  descriptionEn: string;
  cost?: number | null;
  price: number;
  tax: number;
  stock: number;
  minStock: number;
  featured: boolean;
  active: boolean;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CatalogFilters {
  category: number | '';
  subcategory: number | '';
  minPrice: number;
  maxPrice: number;
  sort: SortOption;
  search: string;
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
  id: number;
  name: string;
  location: string;
  locationEn: string;
  rating: number;
  text: string;
  textEn: string;
  avatar: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface StockProduct {
  id: number;
  code: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  active: boolean;
}

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  currentStock: number;
  quantity: number;
  type: 'entry' | 'adjustment' | 'return';
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface Sale {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes: string;
  soldBy: string;
  createdAt: string;
}

export interface SaleReport {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  salesCount: number;
}

// ─── Filter/Sort Types ─────────────────────────────────────────────────────────

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc';

// ─── Context Types ─────────────────────────────────────────────────────────────

export interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
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
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}
