import type { Product, Category, Subcategory, Testimonial, AdminUser, CheckoutForm, CartItem, ProductImage, StockProduct, StockMovement, Sale, SaleReport, Order, OrderStatus, OrderTracking, ContactMessage, Customer } from '../types';
import type { SquareConfig, SquareEnvironment, SquareMethods } from './square';

import type { BulkProductRow } from './productExcel';

/** Configuración > Mi tienda */
export type StoreSettings = {
  name: string;
  street: string;
  cityLine: string;
  phone: string;
  whatsapp: string;
  email: string;
  notifyEmail: string;
  hours: string;
  topbarMessage: string;
};

/** Configuración > Cuentas bancarias */
export type BankAccountSetting = { bank: string; holder: string; number: string; details: string };

/** The summary page */
export type DashboardData = {
  toAttend: number;
  toVerify: number;
  stockShort: number;
  toShip: number;
  /** Web orders paid online (PayPal or Square) still waiting for the customer */
  paypalWaiting: number;
  ordersToday: number;
  unreadMessages: number;
  pendingReviews: number;
  lowStock: { id: number; code: string; name: string; stock: number; minStock: number }[];
  salesToday: { count: number; units: number; total: number };
};

/** Customer and products of an order typed in the panel */
export type AdminOrderInput = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  paymentMethod: 'transfer' | 'paypal' | 'whatsapp' | 'cash';
  items: { productId: number; quantity: number }[];
};

/** The email account the store sends with (the password is never returned) */
/** Configuración > Square, as the panel sees it (the Access Token never leaves the API). */
export type SquareSettings = {
  configured: boolean;
  enabled: boolean;
  environment: SquareEnvironment;
  applicationId: string;
  locationId: string;
  locationName: string;
  methods: SquareMethods;
  hasToken: boolean;
  /** Saved, but can't be read anymore (the API's key changed): enter it again */
  tokenUnreadable: boolean;
  /** Offered on the checkout right now */
  live: boolean;
};

export type SquareSettingsInput = {
  enabled: boolean;
  environment: SquareEnvironment;
  applicationId: string;
  locationId: string;
  accessToken: string;
  methods: SquareMethods;
};

export type MailSettings = {
  user: string;
  host: string;
  port: number;
  hasPassword: boolean;
  passwordUnreadable: boolean;
  /** panel: saved in Configuración · worker: server secrets · none: emails are off */
  source: 'panel' | 'worker' | 'none';
  /** Inbox that receives the store notices */
  notifyEmail: string;
  updatedAt: string | null;
  updatedBy: string;
};

const BASE =import.meta.env.VITE_API_URL ?? 'http://localhost:8787';

// Called when the API rejects the admin token (expired or revoked session)
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function send(path: string, options?: RequestInit): Promise<Response> {
  const headers = new Headers(options?.headers);
  // FormData sets its own multipart Content-Type (with the boundary)
  if (!(options?.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    if (res.status === 401 && headers.has('Authorization')) onUnauthorized?.();
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await send(path, options);
  return res.json() as Promise<T>;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// ─── Public ───────────────────────────────────────────────────────────────────

export const api = {
  products: {
    list: () => request<Product[]>('/api/products'),
    get: (idOrSlug: string) => request<Product>(`/api/products/${idOrSlug}`),
  },

  categories: {
    list: () => request<Category[]>('/api/categories'),
  },

  subcategories: {
    list: (categoryId?: number) =>
      request<Subcategory[]>(`/api/subcategories${categoryId ? `?categoryId=${categoryId}` : ''}`),
  },

  testimonials: {
    listApproved: () => request<Testimonial[]>('/api/testimonials/approved'),
    submit: (data: {
      name: string;
      text: string;
      rating?: number;
      location?: string;
      email?: string;
      productPurchased?: string;
    }) => request<Testimonial>('/api/testimonials', { method: 'POST', body: JSON.stringify(data) }),
  },

  orders: {
    // Only product ids and quantities are sent: the API prices the order itself.
    create: (form: CheckoutForm, items: CartItem[], receipt?: File | null) => {
      const data = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        city: form.city,
        notes: form.notes,
        paymentMethod: form.paymentMethod,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      };
      let body: BodyInit = JSON.stringify(data);
      if (receipt) {
        const formData = new FormData();
        formData.append('data', JSON.stringify(data));
        formData.append('receipt', receipt);
        body = formData;
      }
      return request<{ id: number; total: number; receiptUploaded: boolean }>('/api/orders', { method: 'POST', body });
    },
    // The customer checks an order with its number and the phone used to place it
    track: (id: number, phone: string) =>
      request<OrderTracking>(`/api/orders/track?id=${id}&phone=${encodeURIComponent(phone)}`),
    // The customer attaches the transfer receipt after ordering
    uploadReceipt: (id: number, phone: string, file: File) => {
      const form = new FormData();
      form.append('phone', phone);
      form.append('receipt', file);
      return request<{ ok: true; stockShort: boolean }>(`/api/orders/${id}/receipt`, { method: 'POST', body: form });
    },
    // Right before opening PayPal: still payable and in stock? Answers the amount.
    checkPaypal: (id: number, phone: string) =>
      request<{ total: number }>(`/api/orders/${id}/paypal/check`, {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }),
    // Notes a PayPal payment on the order (and sets its stock aside); the admin verifies it in PayPal
    reportPaypal: (id: number, phone: string, captureId: string, amount: number) =>
      request<{ ok: true; stockShort: boolean }>(`/api/orders/${id}/paypal`, {
        method: 'POST',
        body: JSON.stringify({ phone, captureId, amount }),
      }),
    // Charges a Square token (card, Google Pay or Apple Pay); the order is then paid
    paySquare: (id: number, phone: string, sourceId: string, verificationToken?: string) =>
      request<{ ok: true; paymentId: string; receiptUrl: string | null; method: string; stockShort: boolean }>(`/api/orders/${id}/square`, {
        method: 'POST',
        body: JSON.stringify({ phone, sourceId, ...(verificationToken ? { verificationToken } : {}) }),
      }),
  },

  // Public store settings (nothing secret)
  config: {
    // Store details, bank accounts, PayPal and Square, as set in the panel
    site: () =>
      request<{
        store: Omit<StoreSettings, 'notifyEmail'>;
        bankAccounts: BankAccountSetting[];
        paypal: { configured: false } | { configured: true; enabled: boolean; clientId: string };
        square?: SquareConfig;
      }>('/api/settings/public'),
  },

  contact: {
    send: (data: { name: string; email: string; phone: string; message: string }) =>
      request<{ id: number }>('/api/contact', { method: 'POST', body: JSON.stringify(data) }),
  },

  // ─── Admin (requires JWT token) ─────────────────────────────────────────────

  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: Pick<AdminUser, 'id' | 'username' | 'role'> }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    // Emails a one-hour link to set a new password (same answer if the user doesn't exist)
    forgot: (login: string) =>
      request<{ ok: true; message: string }>('/api/auth/forgot', { method: 'POST', body: JSON.stringify({ login }) }),
    reset: (token: string, password: string) =>
      request<{ ok: true }>('/api/auth/reset', { method: 'POST', body: JSON.stringify({ token, password }) }),
  },

  admin: {
    products: {
      list: (token: string) =>
        request<Product[]>('/api/products/admin/all', { headers: authHeaders(token) }),
      create: (token: string, data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'images'>) =>
        request<Product>('/api/products', {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify(data),
        }),
      update: (token: string, id: number, data: Partial<Product>) =>
        request<Product>(`/api/products/${id}`, {
          method: 'PUT',
          headers: authHeaders(token),
          body: JSON.stringify(data),
        }),
      // Bulk import, step 1: checks every row against the database, saves nothing
      bulkVerify: (token: string, products: BulkProductRow[]) =>
        request<{ valid: number; errors: { row: number; error: string }[] }>('/api/products/bulk', {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify({ products, dryRun: true }),
        }),
      // Bulk import, step 2: saves up to 20 rows (all or none)
      bulkCreate: (token: string, products: BulkProductRow[]) =>
        request<{ created: number }>('/api/products/bulk', {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify({ products }),
        }),
      toggle: (token: string, id: number) =>
        request<Product>(`/api/products/${id}/toggle`, {
          method: 'PATCH',
          headers: authHeaders(token),
        }),
      delete: (token: string, id: number) =>
        request<{ success: boolean }>(`/api/products/${id}`, {
          method: 'DELETE',
          headers: authHeaders(token),
        }),
    },

    categories: {
      list: (token: string) =>
        request<Category[]>('/api/categories/admin/all', { headers: authHeaders(token) }),
      create: (token: string, data: Omit<Category, 'id' | 'createdAt'>) =>
        request<Category>('/api/categories', {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify(data),
        }),
      update: (token: string, id: number, data: Partial<Category>) =>
        request<Category>(`/api/categories/${id}`, {
          method: 'PUT',
          headers: authHeaders(token),
          body: JSON.stringify(data),
        }),
      toggle: (token: string, id: number) =>
        request<Category>(`/api/categories/${id}/toggle`, {
          method: 'PATCH',
          headers: authHeaders(token),
        }),
      delete: (token: string, id: number) =>
        request<{ success: boolean }>(`/api/categories/${id}`, {
          method: 'DELETE',
          headers: authHeaders(token),
        }),
    },

    subcategories: {
      list: (token: string) =>
        request<Subcategory[]>('/api/subcategories/admin/all', { headers: authHeaders(token) }),
      create: (token: string, data: Omit<Subcategory, 'id' | 'createdAt'>) =>
        request<Subcategory>('/api/subcategories', {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify(data),
        }),
      update: (token: string, id: number, data: Partial<Subcategory>) =>
        request<Subcategory>(`/api/subcategories/${id}`, {
          method: 'PUT',
          headers: authHeaders(token),
          body: JSON.stringify(data),
        }),
      toggle: (token: string, id: number) =>
        request<Subcategory>(`/api/subcategories/${id}/toggle`, {
          method: 'PATCH',
          headers: authHeaders(token),
        }),
      delete: (token: string, id: number) =>
        request<{ success: boolean }>(`/api/subcategories/${id}`, {
          method: 'DELETE',
          headers: authHeaders(token),
        }),
    },

    testimonials: {
      list: (token: string, status?: string) =>
        request<Testimonial[]>(`/api/admin/testimonials${status ? `?status=${status}` : ''}`, { headers: authHeaders(token) }),
      setStatus: (token: string, id: number, status: 'pending' | 'approved' | 'rejected') =>
        request<Testimonial>(`/api/admin/testimonials/${id}/status`, {
          method: 'PATCH',
          headers: authHeaders(token),
          body: JSON.stringify({ status }),
        }),
      delete: (token: string, id: number) =>
        request<{ success: boolean }>(`/api/admin/testimonials/${id}`, {
          method: 'DELETE',
          headers: authHeaders(token),
        }),
    },

    orders: {
      list: (token: string) =>
        request<Order[]>('/api/orders', { headers: authHeaders(token) }),
      // Cheap call the panel polls to announce new orders
      // What needs the operator: to collect payment, to verify a payment, to ship
      pendingCount: (token: string) =>
        request<{ count: number; toAttend: number; toVerify: number; toShip: number; lastId: number | null }>('/api/orders/pending-count', { headers: authHeaders(token) }),
      dashboard: (token: string) =>
        request<DashboardData>('/api/orders/dashboard', { headers: authHeaders(token) }),
      // Orders taken outside the website (WhatsApp, Instagram, the store)
      createManual: (token: string, data: AdminOrderInput) =>
        request<Order>('/api/orders/manual', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(data) }),
      // Only while the order hasn't taken stock (pending / confirmed, no PayPal payment)
      update: (token: string, id: number, data: AdminOrderInput) =>
        request<Order>(`/api/orders/${id}`, { method: 'PUT', headers: authHeaders(token), body: JSON.stringify(data) }),
      setNotes: (token: string, id: number, adminNotes: string) =>
        request<Order>(`/api/orders/${id}/notes`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ adminNotes }) }),
      customers: (token: string) =>
        request<Customer[]>('/api/orders/customers', { headers: authHeaders(token) }),
      updateStatus: (token: string, id: number, status: OrderStatus) =>
        request<Order>(`/api/orders/${id}/status`, {
          method: 'PATCH',
          headers: authHeaders(token),
          body: JSON.stringify({ status }),
        }),
      // The transfer receipt is private, so it is downloaded with the admin token
      receipt: async (token: string, id: number) => {
        const res = await send(`/api/orders/${id}/receipt`, { headers: authHeaders(token) });
        return res.blob();
      },
    },

    contact: {
      list: (token: string) =>
        request<ContactMessage[]>('/api/contact', { headers: authHeaders(token) }),
      unreadCount: (token: string) =>
        request<{ count: number }>('/api/contact/unread-count', { headers: authHeaders(token) }),
      markRead: (token: string, id: number, read: boolean) =>
        request<ContactMessage>(`/api/contact/${id}/read`, {
          method: 'PATCH',
          headers: authHeaders(token),
          body: JSON.stringify({ read }),
        }),
      remove: (token: string, id: number) =>
        request<{ ok: true }>(`/api/contact/${id}`, { method: 'DELETE', headers: authHeaders(token) }),
    },

    // Store settings (administrators only)
    settings: {
      getMail: (token: string) =>
        request<MailSettings>('/api/settings/mail', { headers: authHeaders(token) }),
      // An empty password keeps the one already saved
      saveMail: (token: string, data: { user: string; password: string; host: string; port: number }) =>
        request<{ ok: true }>('/api/settings/mail', {
          method: 'PUT',
          headers: authHeaders(token),
          body: JSON.stringify(data),
        }),
      deleteMail: (token: string) =>
        request<{ ok: true }>('/api/settings/mail', { method: 'DELETE', headers: authHeaders(token) }),
      getStore: (token: string) =>
        request<StoreSettings>('/api/settings/store', { headers: authHeaders(token) }),
      saveStore: (token: string, data: StoreSettings) =>
        request<StoreSettings>('/api/settings/store', { method: 'PUT', headers: authHeaders(token), body: JSON.stringify(data) }),
      getBank: (token: string) =>
        request<{ accounts: BankAccountSetting[] }>('/api/settings/bank', { headers: authHeaders(token) }),
      saveBank: (token: string, accounts: BankAccountSetting[]) =>
        request<{ accounts: BankAccountSetting[] }>('/api/settings/bank', { method: 'PUT', headers: authHeaders(token), body: JSON.stringify({ accounts }) }),
      getPaypal: (token: string) =>
        request<{ configured: boolean; enabled: boolean; clientId: string }>('/api/settings/paypal', { headers: authHeaders(token) }),
      savePaypal: (token: string, data: { enabled: boolean; clientId: string }) =>
        request<{ ok: true }>('/api/settings/paypal', {
          method: 'PUT',
          headers: authHeaders(token),
          body: JSON.stringify(data),
        }),
      getSquare: (token: string) =>
        request<SquareSettings>('/api/settings/square', { headers: authHeaders(token) }),
      // An empty accessToken keeps the one already saved (same mode)
      saveSquare: (token: string, data: SquareSettingsInput) =>
        request<{ ok: true; locationName: string }>('/api/settings/square', {
          method: 'PUT',
          headers: authHeaders(token),
          body: JSON.stringify(data),
        }),
      deleteSquare: (token: string) =>
        request<{ ok: true }>('/api/settings/square', { method: 'DELETE', headers: authHeaders(token) }),
      registerApplePayDomain: (token: string) =>
        request<{ ok: true; domain: string; status: string }>('/api/settings/square/apple-pay-domain', {
          method: 'POST',
          headers: authHeaders(token),
        }),
      testMail: (token: string, to: string) =>
        request<{ ok: true; to: string }>('/api/settings/mail/test', {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify({ to }),
        }),
    },

    users: {
      list: (token: string) =>
        request<AdminUser[]>('/api/users', { headers: authHeaders(token) }),
      create: (token: string, data: { username: string; email: string; password: string; role?: string }) =>
        request<AdminUser>('/api/users', {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify(data),
        }),
      update: (token: string, id: number, data: Partial<Pick<AdminUser, 'username' | 'email' | 'role'>>) =>
        request<AdminUser>(`/api/users/${id}`, {
          method: 'PUT',
          headers: authHeaders(token),
          body: JSON.stringify(data),
        }),
      changePassword: (token: string, id: number, password: string) =>
        request<{ success: boolean }>(`/api/users/${id}/password`, {
          method: 'PATCH',
          headers: authHeaders(token),
          body: JSON.stringify({ password }),
        }),
      toggle: (token: string, id: number) =>
        request<{ id: number; active: boolean }>(`/api/users/${id}/toggle`, {
          method: 'PATCH',
          headers: authHeaders(token),
        }),
      delete: (token: string, id: number) =>
        request<{ success: boolean }>(`/api/users/${id}`, {
          method: 'DELETE',
          headers: authHeaders(token),
        }),
    },

    images: {
      list: (productId: number) =>
        request<ProductImage[]>(`/api/images/product/${productId}`),
      add: (token: string, productId: number, data: { filename: string; data?: string; displayOrder?: number }) =>
        request<ProductImage>(`/api/images/product/${productId}`, {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify(data),
        }),
      delete: (token: string, id: number) =>
        request<{ success: boolean }>(`/api/images/${id}`, {
          method: 'DELETE',
          headers: authHeaders(token),
        }),
      reorder: (token: string, productId: number, order: Array<{ id: number; displayOrder: number }>) =>
        request<{ success: boolean }>(`/api/images/product/${productId}/reorder`, {
          method: 'PATCH',
          headers: authHeaders(token),
          body: JSON.stringify({ order }),
        }),
    },

    stock: {
      products: (token: string) =>
        request<StockProduct[]>('/api/stock/products', { headers: authHeaders(token) }),
      movements: (token: string) =>
        request<StockMovement[]>('/api/stock', { headers: authHeaders(token) }),
      add: (token: string, data: { productId: number; quantity: number; type?: string; notes?: string }) =>
        request<StockMovement & { newStock: number }>('/api/stock', {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify(data),
        }),
    },

    sales: {
      list: (token: string) =>
        request<Sale[]>('/api/sales', { headers: authHeaders(token) }),
      report: (token: string) =>
        request<SaleReport[]>('/api/sales/report', { headers: authHeaders(token) }),
      // Cancels a counter sale: its units go back to stock
      void: (token: string, id: number) =>
        request<{ ok: true; productId: number; quantity: number; newStock: number }>(`/api/sales/${id}`, {
          method: 'DELETE',
          headers: authHeaders(token),
        }),
      create: (token: string, data: { productId: number; quantity: number; unitPrice?: number; notes?: string }) =>
        request<Sale>('/api/sales', {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify(data),
        }),
      // Several products in one sale: either all lines are registered or none
      createBatch: (token: string, data: { lines: Array<{ productId: number; quantity: number; unitPrice?: number }>; notes?: string }) =>
        request<Sale[]>('/api/sales/batch', {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify(data),
        }),
    },
  },
};
