import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAdmin } from '../../../contexts/AdminContext';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { card, label, toast } from './ui';

/** Configuración > PayPal: the store's Client ID and whether customers can pay with it. */
export function PaypalSection() {
  const { token } = useAdmin();
  const [loaded, setLoaded] = useState<{ configured: boolean; enabled: boolean; clientId: string } | null>(null);
  const [loadError, setLoadError] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [clientId, setClientId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.admin.settings.getPaypal(token);
      setLoaded(data);
      setEnabled(data.enabled);
      setClientId(data.clientId);
      setLoadError('');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudo cargar la configuración.');
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await api.admin.settings.savePaypal(token, { enabled, clientId: clientId.trim() });
      await load();
      toast('PayPal guardado');
    } catch (err) {
      void Swal.fire('No se guardó', err instanceof Error ? err.message : 'Intenta de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const status = !loaded
    ? null
    : !loaded.configured
      ? { ok: false, text: 'PayPal todavía no se configuró aquí. El sitio usa el Client ID de la configuración de Vercel, si existe.' }
      : loaded.enabled
        ? { ok: true, text: 'Los clientes pueden pagar con PayPal o con tarjeta.' }
        : { ok: false, text: 'PayPal está desactivado: no aparece en el checkout.' };

  return (
    <>
      {loadError && <p role="alert" style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{loadError}</p>}

      <section style={card}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 400, marginBottom: '0.5rem' }}>PayPal</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          Muestra en el checkout los botones de PayPal y de tarjeta de débito o crédito. El dinero llega directo a la cuenta
          PayPal de la tienda. Cada pago queda anotado en el pedido como <strong style={{ color: 'var(--text)' }}>Pago por verificar</strong>:
          revísalo en PayPal y márcalo como Pagado.
        </p>

        {status && (
          <p className="flex items-start gap-2" style={{ fontSize: '0.875rem', marginBottom: '1.5rem', color: status.ok ? '#16a34a' : '#b45309' }}>
            {status.ok ? <CheckCircle2 size={16} style={{ marginTop: 2, flexShrink: 0 }} /> : <AlertTriangle size={16} style={{ marginTop: 2, flexShrink: 0 }} />}
            {status.text}
          </p>
        )}

        <form onSubmit={save} className="flex flex-col gap-4">
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

          <label className="flex flex-col gap-1.5">
            <span style={label}>Client ID</span>
            <input
              className="form-input"
              style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
              placeholder="AXXXXXXXXXXXXXXXXXXXX…"
              value={clientId}
              onChange={(e) => setClientId(e.target.value.trim())}
              spellCheck={false}
              autoComplete="off"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Es un dato público (no es la contraseña ni el «Secret»). Si pegas el de una app de pruebas (Sandbox), los pagos serán ficticios.
            </span>
          </label>

          <div className="mt-2">
            <Button type="submit" variant="gold" size="sm" isLoading={saving}>
              <Save size={14} /> Guardar
            </Button>
          </div>
        </form>
      </section>

      <section style={{ ...card, marginTop: '1.5rem', background: 'var(--bg-subtle)' }}>
        <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>Dónde encontrar el Client ID</h2>
        <ol className="list-decimal pl-5 flex flex-col gap-2" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <li>
            Si la tienda ya usa PayPal en WooCommerce: en WordPress, <strong>WooCommerce → Ajustes → Pagos → PayPal</strong>, pestaña de
            conexión. Ahí aparece el <strong>Client ID</strong>.
          </li>
          <li>
            Si no: entra a{' '}
            <a href="https://developer.paypal.com/dashboard/applications/live" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
              developer.paypal.com <ExternalLink size={11} />
            </a>{' '}
            con la cuenta PayPal de la tienda, abre <strong>Apps &amp; Credentials</strong> (modo <strong>Live</strong>) y copia el Client ID de la app.
          </li>
          <li>Pégalo arriba, activa PayPal y pulsa <strong>Guardar</strong>. El cambio se ve en el checkout en un minuto.</li>
        </ol>
      </section>
    </>
  );
}
