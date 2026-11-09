import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Tag, CheckCircle, Star, AlertTriangle } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import type { Category } from '../../types';

export default function AdminDashboard() {
  const { token } = useAdmin();
  const { t } = useLanguage();
  // Admin lists: the public catalog only has active products and categories
  const { products, error: productsError } = useAdminProducts();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.admin.categories
      .list(token)
      .then((rows) => { setCategories(rows); setCategoriesError(''); })
      .catch((err: unknown) => setCategoriesError(err instanceof Error ? err.message : 'No se pudieron cargar las categorías.'));
  }, [token]);
  const error = productsError || categoriesError;

  // Active products at or below their minimum stock, most urgent first
  const lowStock = products
    .filter((p) => p.active && (p.stock === 0 || p.stock <= (p.minStock ?? 0)))
    .sort((a, b) => a.stock - b.stock);

  const stats = [
    {
      label: t('admin.dashboard.totalProducts'),
      value: products.length,
      Icon: Package,
      color: 'var(--gold)',
    },
    {
      label: t('admin.dashboard.totalCategories'),
      value: categories.length,
      Icon: Tag,
      color: '#6366f1',
    },
    {
      label: t('admin.dashboard.activeProducts'),
      value: products.filter((p) => p.active).length,
      Icon: CheckCircle,
      color: '#22c55e',
    },
    {
      label: t('admin.dashboard.featuredProducts'),
      value: products.filter((p) => p.featured).length,
      Icon: Star,
      color: '#f59e0b',
    },
  ];

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8">
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2rem',
            fontWeight: 300,
            color: 'var(--text)',
            marginBottom: '2rem',
          }}
        >
          {t('admin.dashboard.title')}
        </h1>

        {error && <p role="alert" style={{ color: '#ef4444', fontSize: '0.8125rem', marginBottom: '1rem' }}>{error}</p>}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {stats.map(({ label, value, Icon, color }) => (
            <div
              key={label}
              className="flex flex-col gap-3 p-6"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
            >
              <div className="flex items-center justify-between">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em' }}>
                  {label}
                </span>
                <Icon size={18} style={{ color }} strokeWidth={1.5} />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '2.5rem',
                  fontWeight: 300,
                  color: 'var(--text)',
                  lineHeight: 1,
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Low stock */}
        {lowStock.length > 0 && (
          <div
            className="mb-10"
            style={{ background: 'var(--bg)', border: '1px solid #f59e0b', borderRadius: 'var(--radius)' }}
          >
            <div className="px-6 py-4 flex items-center justify-between gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="flex items-center gap-2" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 400 }}>
                <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
                Stock bajo ({lowStock.length})
              </h2>
              <Link to="/admin/stock" className="text-xs uppercase tracking-widest hover:text-(--gold)" style={{ color: 'var(--text-muted)' }}>
                Agregar stock →
              </Link>
            </div>
            <ul className="divide-y divide-(--border)">
              {lowStock.slice(0, 10).map((p) => (
                <li key={p.id} className="px-6 py-3 flex items-center justify-between gap-4 text-sm">
                  <span style={{ color: 'var(--text)' }}>
                    {p.name} <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>({p.code})</span>
                  </span>
                  <span style={{ whiteSpace: 'nowrap', fontWeight: 500, color: p.stock === 0 ? '#ef4444' : '#f59e0b' }}>
                    {p.stock === 0 ? 'Agotado' : `Quedan ${p.stock}`}
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> · mínimo {p.minStock ?? 0}</span>
                  </span>
                </li>
              ))}
            </ul>
            {lowStock.length > 10 && (
              <p className="px-6 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>y {lowStock.length - 10} más en Stock.</p>
            )}
          </div>
        )}

        {/* Recent products */}
        <div
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div
            className="px-6 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 400 }}>
              {t('admin.products.title')}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                  {['Imagen', 'Nombre', 'Categoría', 'Precio', 'Estado'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left"
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 500,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 8).map((p) => (
                  <tr
                    key={p.id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    className="hover:bg-(--bg-subtle) transition-colors"
                  >
                    <td className="px-6 py-3">
                      <div className="w-10 h-10 overflow-hidden" style={{ background: 'var(--gray-100)' }}>
                        <img src={p.images[0]?.data || ''} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-6 py-3" style={{ maxWidth: '200px' }}>
                      <span className="truncate block" style={{ color: 'var(--text)' }}>{p.name}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {categories.find((c) => c.id === p.categoryId)?.name || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span style={{ fontWeight: 500, color: 'var(--text)' }}>${p.price.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          padding: '0.25rem 0.625rem',
                          fontWeight: 500,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          background: p.active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          color: p.active ? '#22c55e' : '#ef4444',
                          border: `1px solid ${p.active ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        }}
                      >
                        {p.active ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
