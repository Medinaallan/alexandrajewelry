import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Apple, CheckCircle2, CreditCard, ExternalLink, Globe, Save, Smartphone, ToggleLeft, ToggleRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAdmin } from '../../../contexts/AdminContext';
import { api, type SquareSettings } from '../../../lib/api';
import type { SquareEnvironment, SquareMethods } from '../../../lib/square';
import { Button } from '../../../components/ui/Button';
import { card, label, toast } from './ui';

const METHODS: { key: keyof SquareMethods; title: string; help: string; Icon: typeof CreditCard }[] = [
  { key: 'card', title: 'Tarjetas de débito y crédito', help: 'Visa, Mastercard, American Express, Discover.', Icon: CreditCard },
  { key: 'googlePay', title: 'Google Pay', help: 'Aparece en Chrome y Android cuando el cliente tiene Google Pay.', Icon: Smartphone },
  { key: 'applePay', title: 'Apple Pay', help: 'Aparece en Safari (iPhone, iPad, Mac). Requiere registrar el dominio (abajo).', Icon: Apple },
];

const muted: React.CSSProperties = { fontSize: '0.75rem', color: 'var(--text-muted)' };

/**
 * Configuración > Square: the store's card processor. Cards, Google Pay and
 * Apple Pay are charged through the store's Square account and confirmed on
 * the spot, so those orders go straight to "Para enviar".
 */
export function SquareSection() {
  const { token } = useAdmin();
  const [loaded, setLoaded] = useState<SquareSettings | null>(null);
  const [loadError, setLoadError] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [environment, setEnvironment] = useState<SquareEnvironment>('production');
  const [applicationId, setApplicationId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [methods, setMethods] = useState<SquareMethods>({ card: true, googlePay: true, applePay: true });
  const [saving, setSaving] = useState(false);
  const [registering, setRegistering] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.admin.settings.getSquare(token);
      setLoaded(data);
      setEnabled(data.enabled);
      setEnvironment(data.environment);
      setApplicationId(data.applicationId);
      setLocationId(data.locationId);
      setMethods(data.methods);
      setAccessToken('');
      setLoadError('');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudo cargar la configuración.');
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  // The saved token belongs to the saved mode; switching modes needs that mode's token
  const tokenKept = Boolean(loaded?.hasToken) && loaded?.environment === environment;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const { locationName } = await api.admin.settings.saveSquare(token, {
        enabled,
        environment,
        applicationId: applicationId.trim(),
        locationId: locationId.trim(),
        accessToken: accessToken.trim(),
        methods,
      });
      await load();
      toast(locationName ? `Square guardado · ${locationName}` : 'Square guardado');
    } catch (err) {
      void Swal.fire('No se guardó', err instanceof Error ? err.message : 'Intenta de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!token) return;
    const { isConfirmed } = await Swal.fire({
      title: '¿Quitar Square?',
      text: 'Se borran los datos y el Access Token. El checkout deja de ofrecer tarjeta, Google Pay y Apple Pay.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'No',
      confirmButtonColor: '#ef4444',
      reverseButtons: true,
    });
    if (!isConfirmed) return;
    try {
      await api.admin.settings.deleteSquare(token);
      await load();
      toast('Square quitado');
    } catch (err) {
      void Swal.fire('No se pudo', err instanceof Error ? err.message : 'Intenta de nuevo.', 'error');
    }
  };

  const registerDomain = async () => {
    if (!token) return;
    setRegistering(true);
    try {
      const r = await api.admin.settings.registerApplePayDomain(token);
      void Swal.fire('Dominio registrado', `Square registró ${r.domain} para Apple Pay (${r.status}).`, 'success');
    } catch (err) {
      void Swal.fire('No se registró', err instanceof Error ? err.message : 'Intenta de nuevo.', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const status = !loaded
    ? null
    : loaded.tokenUnreadable
      ? { ok: false, text: 'El Access Token guardado ya no se puede leer (cambió la clave del servidor). Pégalo de nuevo.' }
      : loaded.live
        ? {
            ok: true,
            text: `Activo${loaded.environment === 'sandbox' ? ' en modo de PRUEBAS (los cobros no son reales)' : ''}${loaded.locationName ? ` · ${loaded.locationName}` : ''}. Los clientes pueden pagar con ${[
              loaded.methods.card && 'tarjeta',
              loaded.methods.googlePay && 'Google Pay',
              loaded.methods.applePay && 'Apple Pay',
            ].filter(Boolean).join(', ')}.`,
          }
        : !loaded.configured
          ? { ok: false, text: 'Square todavía no está configurado: el checkout no ofrece pago con tarjeta por Square.' }
          : { ok: false, text: 'Square está desactivado: no aparece en el checkout.' };

  return (
    <>
      {loadError && <p role="alert" style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{loadError}</p>}

      <section style={card}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 400, marginBottom: '0.5rem' }}>Square</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          Procesador de pagos de la tienda: cobra con <strong style={{ color: 'var(--text)' }}>tarjeta de débito o crédito, Google Pay y Apple Pay</strong> sin
          que el cliente salga del sitio. El dinero llega a la cuenta Square de la tienda. Square confirma cada cobro al momento, así que el
          pedido pasa solo a <strong style={{ color: 'var(--text)' }}>Para enviar</strong>: no hay que verificar nada.
        </p>

        {status && (
          <p className="flex items-start gap-2" style={{ fontSize: '0.875rem', marginBottom: '1.5rem', color: status.ok ? '#16a34a' : '#b45309' }}>
            {status.ok ? <CheckCircle2 size={16} style={{ marginTop: 2, flexShrink: 0 }} /> : <AlertTriangle size={16} style={{ marginTop: 2, flexShrink: 0 }} />}
            {status.text}
          </p>
        )}

        <form onSubmit={save} className="flex flex-col gap-5" autoComplete="off">
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((v) => !v)}
            className="flex items-center gap-2 self-start"
            style={{ fontSize: '0.875rem' }}
          >
            {enabled ? <ToggleRight size={28} style={{ color: '#22c55e' }} /> : <ToggleLeft size={28} style={{ color: 'var(--text-muted)' }} />}
            {enabled ? 'Activado en el checkout' : 'Desactivado'}
          </button>

          <fieldset className="flex flex-col gap-1.5">
            <legend style={{ ...label, marginBottom: 6 }}>Modo</legend>
            <div className="flex flex-wrap gap-2">
              {(['production', 'sandbox'] as const).map((env) => (
                <button
                  key={env}
                  type="button"
                  aria-pressed={environment === env}
                  onClick={() => setEnvironment(env)}
                  className="px-4 py-2"
                  style={{
                    fontSize: '0.8125rem',
                    border: `1px solid ${environment === env ? 'var(--gold)' : 'var(--border)'}`,
                    background: environment === env ? 'var(--gold-pale)' : 'var(--bg)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  {env === 'production' ? 'Producción (cobros reales)' : 'Pruebas (Sandbox)'}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span style={label}>Application ID</span>
              <input
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
                placeholder={environment === 'sandbox' ? 'sandbox-sq0idb-…' : 'sq0idp-…'}
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value.trim())}
                spellCheck={false}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span style={label}>Location ID</span>
              <input
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
                placeholder="L8XXXXXXXXXXX"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value.trim())}
                spellCheck={false}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span style={label}>Access Token</span>
            <input
              className="form-input"
              type="password"
              style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
              placeholder={tokenKept ? '•••••••••••••••• (guardado; déjalo vacío para no cambiarlo)' : 'EAAA…'}
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value.trim())}
              autoComplete="new-password"
              spellCheck={false}
            />
            <span style={muted}>
              Es la clave secreta con la que el servidor cobra. Se guarda cifrada, nunca llega al navegador del cliente y no se vuelve a mostrar.
              {loaded?.hasToken && !tokenKept && ' Cambiaste de modo: pega el Access Token de ese modo.'}
            </span>
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend style={{ ...label, marginBottom: 6 }}>Formas de pago que se ofrecen</legend>
            {METHODS.map(({ key, title, help, Icon }) => (
              <label key={key} className="flex items-start gap-3 p-3 cursor-pointer" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <input
                  type="checkbox"
                  checked={methods[key]}
                  onChange={(e) => setMethods((m) => ({ ...m, [key]: e.target.checked }))}
                  style={{ marginTop: 3, accentColor: 'var(--gold)' }}
                />
                <Icon size={18} style={{ color: 'var(--gold)', marginTop: 1, flexShrink: 0 }} />
                <span className="flex flex-col">
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{title}</span>
                  <span style={muted}>{help}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="flex flex-wrap items-center gap-3 mt-1">
            <Button type="submit" variant="gold" size="sm" isLoading={saving}>
              <Save size={14} /> Guardar
            </Button>
            {loaded?.configured && (
              <button type="button" onClick={() => void remove()} className="hover:text-red-500" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Quitar Square
              </button>
            )}
          </div>
          <p style={muted}>Al guardar, se comprueban los datos con Square: si algo está mal, lo verás aquí y no cuando un cliente intente pagar.</p>
        </form>

        {methods.applePay && (
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.75rem', paddingTop: '1.5rem' }}>
            <h3 className="flex items-center gap-2" style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              <Globe size={16} /> Dominio para Apple Pay
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              Apple solo muestra su botón en dominios registrados. El sitio ya publica el archivo de verificación de Square; después de guardar
              Square, pulsa el botón una vez (y otra vez si cambias el dominio del sitio o el modo).
            </p>
            <Button type="button" variant="outline" size="sm" isLoading={registering} disabled={!loaded?.hasToken} onClick={() => void registerDomain()}>
              <Apple size={14} /> Registrar dominio para Apple Pay
            </Button>
          </div>
        )}
      </section>

      <section style={{ ...card, marginTop: '1.5rem', background: 'var(--bg-subtle)' }}>
        <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>Dónde encontrar los datos de Square</h2>
        <ol className="list-decimal pl-5 flex flex-col gap-2" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <li>
            Entra a{' '}
            <a href="https://developer.squareup.com/apps" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
              developer.squareup.com <ExternalLink size={11} />
            </a>{' '}
            con la cuenta Square de la tienda y crea una aplicación (por ejemplo, «Tienda web»). Es gratis.
          </li>
          <li>
            Abre la aplicación y, arriba, elige <strong>Production</strong> (o <strong>Sandbox</strong> para pruebas). En <strong>Credentials</strong> copia el{' '}
            <strong>Application ID</strong> y el <strong>Access Token</strong>.
          </li>
          <li>
            En <strong>Locations</strong> copia el <strong>Location ID</strong> de la tienda.
          </li>
          <li>Pégalos arriba, marca las formas de pago, activa Square y pulsa <strong>Guardar</strong>. El cambio se ve en el checkout en un minuto.</li>
          <li>
            Para probar sin dinero real, usa el modo Pruebas y la tarjeta <code>4111 1111 1111 1111</code> (cualquier fecha futura, CVV y código postal).
          </li>
        </ol>
        <p style={{ ...muted, marginTop: '1rem', lineHeight: 1.6 }}>
          Los pagos aparecen en el panel de Square (Ventas → Transacciones). Si cancelas un pedido pagado con Square, devuélvele el dinero al
          cliente desde ahí.
        </p>
      </section>
    </>
  );
}
