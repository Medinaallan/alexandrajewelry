import type { Product, Category, Subcategory, Testimonial, AdminUser, CheckoutForm, CartItem, ProductImage, StockProduct, StockMovement, Sale, SaleReport, Order, OrderStatus } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8787';

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
  },

  // ─── Admin (requires JWT token) ─────────────────────────────────────────────

  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: Pick<AdminUser, 'id' | 'username' | 'role'> }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
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
