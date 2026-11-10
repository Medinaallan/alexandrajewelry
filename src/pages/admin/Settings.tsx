import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Mail, Wallet, Square, Smartphone, Apple, type LucideIcon } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { MailSection } from './settings/MailSection';
import { PaypalSection } from './settings/PaypalSection';
import { ComingSoonSection } from './settings/ComingSoonSection';

type Tone = 'ok' | 'warn' | 'off';
type Status = { tone: Tone; text: string };

type Option = {
  key: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  group: 'Notificaciones' | 'Pagos';
  render: () => React.ReactNode;
};

const OPTIONS: Option[] = [
  {
    key: 'mail',
    title: 'Correo',
    description: 'Cuenta de Gmail que envía los avisos de pedidos y mensajes.',
    Icon: Mail,
    group: 'Notificaciones',
    render: () => <MailSection />,
  },
  {
    key: 'paypal',
    title: 'PayPal',
    description: 'Pagos con PayPal y con tarjeta de débito o crédito.',
    Icon: Wallet,
    group: 'Pagos',
    render: () => <PaypalSection />,
  },
  {
    key: 'square',
    title: 'Square',
    description: 'Pagos con tarjeta a través de Square.',
    Icon: Square,
    group: 'Pagos',
    render: () => (
      <ComingSoonSection
        title="Square"
        description="Permitiría cobrar con tarjeta usando la cuenta Square de la tienda. Si ya cobras con tarjeta por PayPal, no es necesario."
        needs={[
          'Application ID y Location ID de la cuenta Square de la tienda (son públicos).',
          'Un Access Token de producción, que la dueña genera en developer.squareup.com y se guarda cifrado.',
          'Integrar el formulario de tarjeta de Square en el checkout y el cobro en el servidor.',
        ]}
      />
    ),
  },
  {
    key: 'googlepay',
    title: 'Google Pay',
    description: 'Pago rápido con Google Pay.',
    Icon: Smartphone,
    group: 'Pagos',
    render: () => (
      <ComingSoonSection
        title="Google Pay"
        description="Se puede ofrecer a través de PayPal, sin abrir otra cuenta. Hoy está desactivado en la cuenta PayPal de la tienda."
        needs={[
          'Activar Google Pay en la cuenta PayPal de la tienda.',
          'Que PayPal esté configurado y funcionando en esta tienda.',
          'Agregar el botón de Google Pay de PayPal al checkout.',
        ]}
      />
    ),
  },
  {
    key: 'applepay',
    title: 'Apple Pay',
    description: 'Pago rápido con Apple Pay en iPhone, iPad y Mac.',
    Icon: Apple,
    group: 'Pagos',
    render: () => (
      <ComingSoonSection
        title="Apple Pay"
        description="Se puede ofrecer a través de PayPal. Apple exige verificar el dominio del sitio antes de mostrar el botón."
        needs={[
          'Que PayPal esté configurado y funcionando en esta tienda.',
          'Registrar el dominio del sitio en PayPal (Apple Pay) y publicar el archivo de verificación de Apple.',
          'Agregar el botón de Apple Pay de PayPal al checkout.',
        ]}
      />
    ),
  },
];

const TONE_COLOR: Record<Tone, string> = { ok: '#16a34a', warn: '#b45309', off: 'var(--text-muted)' };

/** Current state of each option, for the cards. */
function useStatuses(): Record<string, Status> {
  const { token } = useAdmin();
  const [statuses, setStatuses] = useState<Record<string, Status>>({
    square: { tone: 'off', text: 'Próximamente' },
    googlepay: { tone: 'off', text: 'Próximamente' },
    applepay: { tone: 'off', text: 'Próximamente' },
  });

  useEffect(() => {
    if (!token) return;
    let active = true;
    const set = (key: string, status: Status) => active && setStatuses((s) => ({ ...s, [key]: status }));
    api.admin.settings.getMail(token)
      .then((m) => set('mail', m.source === 'none' ? { tone: 'warn', text: 'Sin configurar' } : { tone: 'ok', text: m.user ? `Activo · ${m.user}` : 'Activo' }))
      .catch(() => set('mail', { tone: 'warn', text: 'No se pudo leer' }));
    api.admin.settings.getPaypal(token)
      .then((p) => set('paypal', !p.configured ? { tone: 'warn', text: 'Sin configurar' } : p.enabled ? { tone: 'ok', text: 'Activo' } : { tone: 'off', text: 'Desactivado' }))
      .catch(() => set('paypal', { tone: 'warn', text: 'No se pudo leer' }));
    return () => { active = false; };
  }, [token]);

  return statuses;
}

function OptionCard({ option, status }: { option: Option; status?: Status }) {
  const { Icon } = option;
  return (
    <Link
      to={`/admin/settings/${option.key}`}
      className="flex items-start gap-4 p-5 transition-colors hover:border-(--gold)"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
    >
      <span className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(201,164,93,0.12)', color: 'var(--gold)' }}>
        <Icon size={18} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block" style={{ fontWeight: 600, color: 'var(--text)' }}>{option.title}</span>
        <span className="block" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>{option.description}</span>
        <span className="block truncate" style={{ fontSize: '0.75rem', marginTop: 8, color: status ? TONE_COLOR[status.tone] : 'var(--text-muted)' }}>
          ● {status?.text ?? 'Cargando…'}
        </span>
      </span>
      <ChevronRight size={16} style={{ color: 'var(--text-muted)', marginTop: 12 }} />
    </Link>
  );
}

export default function AdminSettingsPage() {
  const { section } = useParams();
  const statuses = useStatuses();
  const current = section ? OPTIONS.find((o) => o.key === section) : null;
  if (section && !current) return <Navigate to="/admin/settings" replace />;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content p-8 max-w-4xl">
        {current ? (
          <>
            <Link to="/admin/settings" className="inline-flex items-center gap-2 mb-4 hover:text-(--gold)" style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              <ArrowLeft size={14} /> Configuración
            </Link>
            <div className="max-w-3xl">{current.render()}</div>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, marginBottom: '0.5rem' }}>Configuración</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Solo los administradores pueden ver y cambiar esta sección.
            </p>
            {(['Notificaciones', 'Pagos'] as const).map((group) => (
              <section key={group} style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {group}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {OPTIONS.filter((o) => o.group === group).map((o) => (
                    <OptionCard key={o.key} option={o} status={statuses[o.key]} />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
