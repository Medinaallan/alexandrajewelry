import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Send, Save, ExternalLink } from 'lucide-react';
import { card, label, toast } from './ui';
import Swal from 'sweetalert2';
import { useAdmin } from '../../../contexts/AdminContext';
import { api, type MailSettings } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';



/** Configuración > Correo: the account that sends the store's emails. */
export function MailSection() {
  const { token } = useAdmin();
  const [current, setCurrent] = useState<MailSettings | null>(null);
  const [loadError, setLoadError] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [host, setHost] = useState('smtp.gmail.com');
  const [port, setPort] = useState('465');
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.admin.settings.getMail(token);
      setCurrent(data);
      setUser(data.user);
      setHost(data.host);
      setPort(String(data.port));
      setTestTo((prev) => prev || data.notifyEmail);
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
    setTestResult(null);
    try {
      await api.admin.settings.saveMail(token, { user: user.trim(), password, host: host.trim(), port: Number(port) || 465 });
      setPassword('');
      await load();
      toast('Configuración guardada');
    } catch (err) {
      void Swal.fire('No se guardó', err instanceof Error ? err.message : 'Intenta de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!token) return;
    setTesting(true);
    setTestResult(null);
    try {
      const { to } = await api.admin.settings.testMail(token, testTo.trim());
      setTestResult({ ok: true, text: `Correo de prueba enviado a ${to}. Revisa la bandeja de entrada (y la carpeta de spam).` });
    } catch (err) {
      setTestResult({ ok: false, text: err instanceof Error ? err.message : 'No se pudo enviar.' });
    } finally {
      setTesting(false);
    }
  };

  const remove = async () => {
    if (!token) return;
    const { isConfirmed } = await Swal.fire({
      title: '¿Quitar la cuenta de correo?',
      text: 'La tienda dejará de enviar avisos por correo a los clientes y a la tienda.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Quitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
    });
    if (!isConfirmed) return;
    try {
      await api.admin.settings.deleteMail(token);
      setPassword('');
      await load();
      toast('Cuenta quitada');
    } catch (err) {
      void Swal.fire('Error', err instanceof Error ? err.message : 'Intenta de nuevo.', 'error');
    }
  };

  const status = !current
    ? null
    : current.source === 'panel'
      ? { ok: true, text: `Los correos se envían con ${current.user}.` }
      : current.source === 'worker'
        ? { ok: true, text: 'Los correos se envían con la cuenta configurada en el servidor. Puedes reemplazarla aquí.' }
        : { ok: false, text: current.passwordUnreadable
            ? 'La contraseña guardada ya no se puede leer (cambió la clave del servidor). Escríbela de nuevo.'
            : 'Todavía no hay cuenta de correo: no se están enviando avisos.' };

  return (
    <>
        {loadError && <p role="alert" style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{loadError}</p>}

        <section style={card}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 400, marginBottom: '0.5rem' }}>Correo de la tienda</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Cuenta de Gmail con la que se envían los avisos: pedido recibido, cambios de estado, pagos y mensajes de contacto.
            Los avisos de la tienda llegan a <strong style={{ color: 'var(--text)' }}>{current?.notifyEmail ?? '…'}</strong>, y cuando un
            cliente responde un correo, la respuesta llega a esa misma dirección.
          </p>

          {status && (
            <p className="flex items-start gap-2" style={{ fontSize: '0.875rem', marginBottom: '1.5rem', color: status.ok ? '#16a34a' : '#b45309' }}>
              {status.ok ? <CheckCircle2 size={16} style={{ marginTop: 2, flexShrink: 0 }} /> : <AlertTriangle size={16} style={{ marginTop: 2, flexShrink: 0 }} />}
              {status.text}
            </p>
          )}

          <form onSubmit={save} className="flex flex-col gap-4" autoComplete="off">
            <label className="flex flex-col gap-1.5">
              <span style={label}>Cuenta de Gmail</span>
              <input className="form-input" type="email" placeholder="avisos.tienda@gmail.com" value={user} onChange={(e) => setUser(e.target.value)} required autoComplete="off" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span style={label}>Contraseña de aplicación</span>
              <input
                className="form-input"
                type="password"
                placeholder={current?.hasPassword ? '•••••••••••••••• (guardada; déjala vacía para no cambiarla)' : 'xxxx xxxx xxxx xxxx'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                No es la contraseña normal de Gmail. Se guarda cifrada y nunca se vuelve a mostrar.
              </span>
            </label>

            <button type="button" onClick={() => setShowAdvanced((v) => !v)} className="self-start underline" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {showAdvanced ? 'Ocultar opciones avanzadas' : 'Opciones avanzadas (otro proveedor que no sea Gmail)'}
            </button>
            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
                <label className="flex flex-col gap-1.5">
                  <span style={label}>Servidor SMTP</span>
                  <input className="form-input" value={host} onChange={(e) => setHost(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span style={label}>Puerto</span>
                  <input className="form-input" inputMode="numeric" value={port} onChange={(e) => setPort(e.target.value.replace(/\D/g, ''))} />
                </label>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-2">
              <Button type="submit" variant="gold" size="sm" isLoading={saving}>
                <Save size={14} /> Guardar
              </Button>
              {current?.source === 'panel' && (
                <button type="button" onClick={() => void remove()} className="hover:text-red-500" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Quitar cuenta
                </button>
              )}
            </div>
          </form>

          <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.75rem', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>Probar</h3>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1.5 flex-1 min-w-55">
                <span style={label}>Enviar un correo de prueba a</span>
                <input className="form-input" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
              </label>
              <Button type="button" variant="outline" size="sm" isLoading={testing} onClick={() => void sendTest()} disabled={!current || current.source === 'none'}>
                <Send size={14} /> Enviar prueba
              </Button>
            </div>
            {testResult && (
              <p role="status" style={{ fontSize: '0.8125rem', marginTop: '0.75rem', color: testResult.ok ? '#16a34a' : '#ef4444', lineHeight: 1.5 }}>
                {testResult.text}
              </p>
            )}
          </div>
        </section>

        <section style={{ ...card, marginTop: '1.5rem', background: 'var(--bg-subtle)' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>Cómo obtener la contraseña de aplicación de Gmail</h2>
          <ol className="list-decimal pl-5 flex flex-col gap-2" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <li>Entra a la cuenta de Gmail que enviará los correos (puede ser una cuenta nueva solo para la tienda).</li>
            <li>
              Activa la <strong>verificación en 2 pasos</strong> en{' '}
              <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
                myaccount.google.com/security <ExternalLink size={11} />
              </a>.
            </li>
            <li>
              Abre{' '}
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
                myaccount.google.com/apppasswords <ExternalLink size={11} />
              </a>
              , escribe un nombre (por ejemplo, «Tienda web») y pulsa <strong>Crear</strong>.
            </li>
            <li>Copia la contraseña de 16 letras que aparece, pégala arriba y pulsa <strong>Guardar</strong>.</li>
            <li>Pulsa <strong>Enviar prueba</strong> para confirmar que funciona.</li>
          </ol>
        </section>
    </>
  );
}
