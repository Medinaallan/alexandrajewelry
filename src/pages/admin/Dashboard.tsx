import { Package, Tag, CheckCircle, Star } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { AdminSidebar } from '../../components/admin/AdminSidebar';

export default function AdminDashboard() {
  const { products, categories } = useAdmin();
  const { t } = useLanguage();

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
                  {['Image', 'Name', 'Category', 'Price', 'Status'].map((h) => (
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
                    className="hover:bg-[--bg-subtle] transition-colors"
                  >
                    <td className="px-6 py-3">
                      <div className="w-10 h-10 overflow-hidden" style={{ background: 'var(--gray-100)' }}>
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-6 py-3" style={{ maxWidth: '200px' }}>
                      <span className="truncate block" style={{ color: 'var(--text)' }}>{p.name}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.categoryName}</span>
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
