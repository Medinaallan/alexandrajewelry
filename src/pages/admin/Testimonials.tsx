import { useEffect, useState, useCallback } from 'react';
import { Star, Check, X, RotateCcw, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Button } from '../../components/ui/Button';
import type { Testimonial } from '../../types';

type Tab = 'pending' | 'approved' | 'rejected';

const TABS: { id: Tab; labelKey: string }[] = [
  { id: 'pending',  labelKey: 'admin.testimonials.pending' },
  { id: 'approved', labelKey: 'admin.testimonials.published' },
  { id: 'rejected', labelKey: 'admin.testimonials.rejected' },
];

const EMPTY_KEYS: Record<Tab, string> = {
  pending:  'admin.testimonials.emptyPending',
  approved: 'admin.testimonials.emptyPublished',
  rejected: 'admin.testimonials.emptyRejected',
};

export default function AdminTestimonialsPage() {
  const { token } = useAdmin();
  const { t } = useLanguage();

  const [tab, setTab] = useState<Tab>('pending');
  const [rows, setRows] = useState<Testimonial[]>([]);
  const [counts, setCounts] = useState<Record<Tab, number>>({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);

  const fetchTab = useCallback(async (status: Tab) => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.admin.testimonials.list(token, status);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchCounts = useCallback(async () => {
    if (!token) return;
    const [pending, approved, rejected] = await Promise.all([
      api.admin.testimonials.list(token, 'pending'),
      api.admin.testimonials.list(token, 'approved'),
      api.admin.testimonials.list(token, 'rejected'),
    ]);
    setCounts({ pending: pending.length, approved: approved.length, rejected: rejected.length });
  }, [token]);

  useEffect(() => {
    void fetchTab(tab);
  }, [tab, fetchTab]);

  useEffect(() => {
    void fetchCounts();
  }, [fetchCounts]);

  const setStatus = async (id: number, status: 'pending' | 'approved' | 'rejected') => {
    if (!token) return;
    await api.admin.testimonials.setStatus(token, id, status);
    await fetchTab(tab);
    await fetchCounts();
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    await api.admin.testimonials.delete(token, id);
    await fetchTab(tab);
    await fetchCounts();
  };

  const handleDeleteWithConfirm = async (id: number) => {
    const result = await Swal.fire({
      title: t('admin.testimonials.confirmDelete'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('common.yes'),
      cancelButtonText: t('common.no'),
      confirmButtonColor: '#ef4444',
    });
    if (result.isConfirmed) await handleDelete(id);
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300 }}>
            {t('admin.testimonials.title')}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
          {TABS.map(({ id, labelKey }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                padding: '8px 16px',
                fontSize: '0.8125rem',
                fontWeight: tab === id ? 500 : 400,
                color: tab === id ? 'var(--gold)' : 'var(--text-muted)',
                borderBottom: tab === id ? '2px solid var(--gold)' : '2px solid transparent',
                background: 'transparent',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {t(labelKey)}
              {counts[id] > 0 && (
                <span
                  style={{
                    background: id === 'pending' ? 'var(--gold)' : 'var(--border)',
                    color: id === 'pending' ? '#000' : 'var(--text-muted)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    padding: '1px 6px',
                    minWidth: '18px',
                    textAlign: 'center',
                  }}
                >
                  {counts[id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t(EMPTY_KEYS[tab])}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {rows.map((item) => (
              <div key={item.id} style={cardStyle}>
                {/* Top row: stars + date + client info */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span style={{ fontWeight: 500, fontSize: '0.9375rem', color: 'var(--text)' }}>
                        {item.name}
                      </span>
                      {item.location && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          · {item.location}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          fill={s <= item.rating ? 'var(--gold)' : 'transparent'}
                          style={{ color: 'var(--gold)' }}
                        />
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(item.createdAt).toLocaleDateString('es-HN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Message */}
                <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.7, fontStyle: 'italic' }}>
                  &ldquo;{item.text}&rdquo;
                </p>

                {/* Optional meta */}
                {item.avatar && (
                  <div className="flex flex-wrap gap-4" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Foto: {item.avatar}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  {tab === 'pending' && (
                    <>
                      <button
                        onClick={() => { void setStatus(item.id, 'approved'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                        style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
                      >
                        <Check size={13} /> {t('admin.testimonials.approve')}
                      </button>
                      <button
                        onClick={() => { void setStatus(item.id, 'rejected'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                      >
                        <X size={13} /> {t('admin.testimonials.reject')}
                      </button>
                    </>
                  )}
                  {tab === 'approved' && (
                    <button
                      onClick={() => { void setStatus(item.id, 'rejected'); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                    >
                      <X size={13} /> {t('admin.testimonials.hide')}
                    </button>
                  )}
                  {tab === 'rejected' && (
                    <button
                      onClick={() => { void setStatus(item.id, 'approved'); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                      style={{ background: 'rgba(201,164,93,0.12)', color: 'var(--gold)', border: '1px solid rgba(201,164,93,0.3)' }}
                    >
                      <RotateCcw size={13} /> {t('admin.testimonials.reconsider')}
                    </button>
                  )}
                  {tab === 'rejected' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => { void handleDeleteWithConfirm(item.id); }}
                    >
                      <Trash2 size={13} /> {t('admin.testimonials.deleteForever')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
