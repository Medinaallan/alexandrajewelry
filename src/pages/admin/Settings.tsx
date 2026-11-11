import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Mail, Wallet, CreditCard, Smartphone, Apple, Store, Landmark, type LucideIcon } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { api } from '../../lib/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { MailSection } from './settings/MailSection';
import { PaypalSection } from './settings/PaypalSection';
import { SquareSection } from './settings/SquareSection';
import { StoreSection } from './settings/StoreSection';
import { BankSection } from './settings/BankSection';

type Tone = 'ok' | 'warn' | 'off';
type Status = { tone: Tone; text: string };

type Option = {
  key: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  group: 'Mi tienda' | 'Notificaciones' | 'Pagos';
  render: () => React.ReactNode;
};

const OPTIONS: Option[] = [
  {
    key: 'store',
    title: 'Mi tienda',
    description: 'Dirección, teléfono, WhatsApp, horario, correos y mensaje de la barra superior.',
    Icon: Store,
    group: 'Mi tienda',
    render: () => <StoreSection />,
  },
  {
    key: 'bank',
    title: 'Cuentas bancarias',
    description: 'Las cuentas que ve el cliente cuando paga por transferencia.',
    Icon: Landmark,
    group: 'Pagos',
    render: () => <BankSection />,
  },
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
  // Square is the card processor; Google Pay and Apple Pay go through it,
  // so their cards open the same page.
  {
    key: 'square',
    title: 'Square',
    description: 'Procesador de pagos: tarjetas de débito y crédito, Google Pay y Apple Pay.',
    Icon: CreditCard,
    group: 'Pagos',
    render: () => <SquareSection />,
  },
  {
    key: 'googlepay',
    title: 'Google Pay',
    description: 'Pago rápido con Google Pay, procesado por Square.',
    Icon: Smartphone,
    group: 'Pagos',
    render: () => <SquareSection />,
  },
  {
    key: 'applepay',
    title: 'Apple Pay',
    description: 'Pago rápido con Apple Pay en iPhone, iPad y Mac, procesado por Square.',
    Icon: Apple,
    group: 'Pagos',
    render: () => <SquareSection />,
  },
];

const TONE_COLOR: Record<Tone, string> = { ok: '#16a34a', warn: '#b45309', off: 'var(--text-muted)' };

/** Current state of each option, for the cards. */
function useStatuses(): Record<string, Status> {
  const { token } = useAdmin();
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  useEffect(() => {
    if (!token) return;
    let active = true;
    const set = (key: string, status: Status) => active && setStatuses((s) => ({ ...s, [key]: status }));
    api.admin.settings.getMail(token)
      .then((m) => set('mail', m.source === 'none' ? { tone: 'warn', text: 'Sin configurar' } : { tone: 'ok', text: m.user ? `Activo · ${m.user}` : 'Activo' }))
      .catch(() => set('mail', { tone: 'warn', text: 'No se pudo leer' }));
    api.admin.settings.getStore(token)
      .then((st) => set('store', { tone: 'ok', text: [st.street, st.cityLine].filter(Boolean).join(', ') || st.name }))
      .catch(() => set('store', { tone: 'warn', text: 'No se pudo leer' }));
    api.admin.settings.getBank(token)
      .then(({ accounts }) => set('bank', accounts.length ? { tone: 'ok', text: accounts.length === 1 ? '1 cuenta' : `${accounts.length} cuentas` } : { tone: 'warn', text: 'Sin cuentas: agrega al menos una' }))
      .catch(() => set('bank', { tone: 'warn', text: 'No se pudo leer' }));
    api.admin.settings.getPaypal(token)
      .then((p) => set('paypal', !p.configured ? { tone: 'warn', text: 'Sin configurar' } : p.enabled ? { tone: 'ok', text: 'Activo' } : { tone: 'off', text: 'Desactivado' }))
      .catch(() => set('paypal', { tone: 'warn', text: 'No se pudo leer' }));
    api.admin.settings.getSquare(token)
      .then((sq) => {
        const test = sq.environment === 'sandbox' ? ' (pruebas)' : '';
        set('square', sq.tokenUnreadable
          ? { tone: 'warn', text: 'Vuelve a pegar el Access Token' }
          : sq.live
            ? { tone: 'ok', text: `Activo${test}${sq.locationName ? ` · ${sq.locationName}` : ''}` }
            : !sq.configured ? { tone: 'warn', text: 'Sin configurar' } : { tone: 'off', text: 'Desactivado' });
        const wallet = (on: boolean): Status =>
          sq.live && on ? { tone: 'ok', text: `Activo vía Square${test}` }
            : !sq.configured ? { tone: 'warn', text: 'Configura Square primero' }
            : { tone: 'off', text: 'Desactivado' };
        set('googlepay', wallet(sq.methods.googlePay));
        set('applepay', wallet(sq.methods.applePay));
      })
      .catch(() => ['square', 'googlepay', 'applepay'].forEach((k) => set(k, { tone: 'warn', text: 'No se pudo leer' })));
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
            {(['Mi tienda', 'Pagos', 'Notificaciones'] as const).map((group) => (
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
