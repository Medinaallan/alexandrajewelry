import { useCallback, useEffect, useMemo, useState } from 'react';
import { Mail, MailOpen, Trash2, Reply, Phone } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAdmin } from '../../contexts/AdminContext';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { MESSAGES_CHANGED_EVENT } from '../../lib/orderAlerts';
import type { ContactMessage } from '../../types';

type Filter = 'all' | 'unread';

export default function AdminMessagesPage() {
  const { token } = useAdmin();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setMessages(await api.admin.contact.list(token));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los mensajes.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const unread = messages.filter((m) => !m.read).length;
  const shown = useMemo(() => (filter === 'unread' ? messages.filter((m) => !m.read) : messages), [messages, filter]);

  const setRead = async (m: ContactMessage, read: boolean) => {
    if (!token || m.read === read) return;
    try {
      await api.admin.contact.markRead(token, m.id, read);
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, read } : x)));
      window.dispatchEvent(new Event(MESSAGES_CHANGED_EVENT));
    } catch (err) {
      void Swal.fire('Error', err instanceof Error ? err.message : 'No se pudo actualizar.', 'error');
    }
  };

  const open = (m: ContactMessage) => {
    setOpenId((id) => (id === m.id ? null : m.id));
    void setRead(m, true);
  };

  const remove = async (m: ContactMessage) => {
    if (!token) return;
    const { isConfirmed } = await Swal.fire({
      title: '¿Eliminar este mensaje?',
      text: `De ${m.name}. No se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
    });
    if (!isConfirmed) return;
    try {
      await api.admin.contact.remove(token, m.id);
      setMessages((prev) => prev.filter((x) => x.id !== m.id));
      window.dispatchEvent(new Event(MESSAGES_CHANGED_EVENT));
    } catch (err) {
      void Swal.fire('Error', err instanceof Error ? err.message : 'No se pudo eliminar.', 'error');
    }
  };

  const chip = (value: Filter, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(value)}
      aria-pressed={filter === value}
      style={{
        padding: '6px 14px',
        fontSize: '0.75rem',
        border: `1px solid ${filter === value ? 'var(--gold)' : 'var(--border)'}`,
        background: filter === value ? 'rgba(201,164,93,0.12)' : 'transparent',
        color: filter === value ? 'var(--gold)' : 'var(--text-muted)',
        borderRadius: '999px',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300 }}>Mensajes</h1>
          <div className="flex gap-2">
            {chip('all', `Todos (${messages.length})`)}
            {chip('unread', `Sin leer (${unread})`)}
          </div>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Mensajes del formulario de contacto. Cada uno también llega por correo a la tienda.
        </p>

        {error && <p role="alert" style={{ color: '#ef4444', fontSize: '0.8125rem', marginBottom: '12px' }}>{error}</p>}

        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {loading ? (
            <p className="p-6" style={{ color: 'var(--text-muted)' }}>Cargando…</p>
          ) : shown.length === 0 ? (
            <p className="p-6" style={{ color: 'var(--text-muted)' }}>
              {filter === 'unread' ? 'No hay mensajes sin leer.' : 'Todavía no hay mensajes.'}
            </p>
          ) : (
            <ul>
              {shown.map((m) => {
                const isOpen = openId === m.id;
                return (
                  <li key={m.id} style={{ borderBottom: '1px solid var(--border)', background: m.read ? 'transparent' : 'rgba(201,164,93,0.06)' }}>
                    <button
                      type="button"
                      onClick={() => open(m)}
                      aria-expanded={isOpen}
                      className="w-full text-left px-5 py-4 flex items-start gap-3"
                    >
                      {m.read ? <MailOpen size={16} style={{ color: 'var(--text-muted)', marginTop: 2 }} /> : <Mail size={16} style={{ color: 'var(--gold)', marginTop: 2 }} />}
                      <span className="flex-1 min-w-0">
                        <span className="flex flex-wrap items-baseline justify-between gap-2">
                          <span style={{ fontWeight: m.read ? 400 : 600, color: 'var(--text)' }}>{m.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {new Date(m.createdAt).toLocaleString('es-US', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </span>
                        <span className={isOpen ? 'block' : 'block truncate'} style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: isOpen ? 'pre-wrap' : undefined, marginTop: 2 }}>
                          {m.message}
                        </span>
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pl-12 flex flex-wrap items-center gap-x-5 gap-y-2" style={{ fontSize: '0.8125rem' }}>
                        <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: tu mensaje a Alexandra Jewelry')}`} className="flex items-center gap-1.5 hover:text-(--gold)" style={{ color: 'var(--text)' }}>
                          <Reply size={14} /> {m.email}
                        </a>
                        {m.phone && (
                          <a href={`tel:${m.phone}`} className="flex items-center gap-1.5 hover:text-(--gold)" style={{ color: 'var(--text)' }}>
                            <Phone size={14} /> {m.phone}
                          </a>
                        )}
                        <span className="flex-1" />
                        <button type="button" onClick={() => void setRead(m, false)} className="hover:text-(--gold)" style={{ color: 'var(--text-muted)' }}>
                          Marcar como no leído
                        </button>
                        <button type="button" onClick={() => void remove(m)} className="flex items-center gap-1 hover:text-red-500" style={{ color: 'var(--text-muted)' }} aria-label={`Eliminar mensaje de ${m.name}`}>
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
