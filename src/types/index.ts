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
  // cost and minStock are internal: only the admin product list includes them
  cost?: number | null;
  price: number;
  tax: number;
  stock: number;
  minStock?: number;
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
  email: string;
  address: string;
  city: string;
  notes: string;
  // cash: only for orders entered in the panel
  // square: card, Google Pay or Apple Pay through Square (charged on the spot)
  paymentMethod: 'transfer' | 'googlepay' | 'paypal' | 'square' | 'whatsapp' | 'cash';
}

// `review`: PayPal payment reported by the customer, not verified yet (stock already taken)
export type OrderStatus = 'pending' | 'confirmed' | 'review' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: number;
  code: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerCity: string;
  notes: string;
  paymentMethod: CheckoutForm['paymentMethod'];
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  /** PayPal capture id reported by the customer's browser (not verified), or the Square payment id (confirmed) */
  paymentRef: string | null;
  paymentAmount: number | null;
  /** When the customer attached the transfer receipt */
  receiptAt: string | null;
  /** web: placed on the site · manual: entered in the panel */
  source: 'web' | 'manual';
  /** Only the store sees these */
  adminNotes: string;
  createdAt: string;
}

/** What a customer sees when checking their order (no personal data) */
export interface OrderTracking {
  id: number;
  status: OrderStatus;
  paymentMethod: CheckoutForm['paymentMethod'];
  total: number;
  createdAt: string;
  /** A PayPal payment was already noted on the order */
  paymentReported: boolean;
  /** PayPal / Square order still waiting for its payment (within its 24 hours) */
  canPay: boolean;
  /** Transfer: the customer already attached the receipt */
  receiptSent: boolean;
  /** Transfer order still waiting: the receipt can be attached */
  canUploadReceipt: boolean;
  items: { name: string; quantity: number; subtotal: number }[];
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
  /** Only the store sees these */
  email?: string;
  productPurchased?: string;
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
  /** Product cost when it was sold (null: the product had no cost) */
  unitCost?: number | null;
  total: number;
  notes: string;
  soldBy: string;
  /** Set when the sale comes from a web order marked as paid */
  orderId?: number | null;
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
  /** Language the pages are written in: always Spanish (Google Translate translates the rendered page). */
  language: Language;
  /** Language the visitor chose to read the site in. */
  targetLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export interface AdminContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

/** A message sent from the contact form */
export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  read: boolean;
  createdAt: string;
}

/** A customer, built from the orders (same phone = same customer) */
export interface Customer {
  key: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  orders: number;
  openOrders: number;
  /** Total of paid / shipped / delivered / under-review orders */
  spent: number;
  lastOrderAt: string;
  firstOrderAt: string;
  orderIds: number[];
}
