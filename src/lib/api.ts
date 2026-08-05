import type { Product, Category, Subcategory, Testimonial, AdminUser, CheckoutForm, CartItem, ProductImage } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8787';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error ?? res.statusText);
  }
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
    list: () => request<Testimonial[]>('/api/testimonials'),
    submit: (data: { name: string; location: string; rating: number; text: string }) =>
      request<Testimonial>('/api/testimonials', { method: 'POST', body: JSON.stringify(data) }),
  },

  orders: {
    create: (form: CheckoutForm, items: CartItem[], total: number) =>
      request<{ id: number }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          notes: form.notes,
          paymentMethod: form.paymentMethod,
          items,
          total,
        }),
      }),
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
      list: (token: string) =>
        request<Testimonial[]>('/api/testimonials/admin/all', { headers: authHeaders(token) }),
      setStatus: (token: string, id: number, status: 'approved' | 'rejected') =>
        request<Testimonial>(`/api/testimonials/${id}/status`, {
          method: 'PATCH',
          headers: authHeaders(token),
          body: JSON.stringify({ status }),
        }),
      delete: (token: string, id: number) =>
        request<{ success: boolean }>(`/api/testimonials/${id}`, {
          method: 'DELETE',
          headers: authHeaders(token),
        }),
    },

    orders: {
      list: (token: string) =>
        request<unknown[]>('/api/orders', { headers: authHeaders(token) }),
      updateStatus: (token: string, id: number, status: string) =>
        request<unknown>(`/api/orders/${id}/status`, {
          method: 'PATCH',
          headers: authHeaders(token),
          body: JSON.stringify({ status }),
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
  },
};
