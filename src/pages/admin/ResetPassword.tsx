import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Gem } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';

const MIN_PASSWORD = 8;

/** Opened from the "forgot password" email: sets a new admin password. */
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) return setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    setError('');
    try {
      await api.auth.reset(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error && err.message !== 'Failed to fetch' ? err.message : 'No se pudo cambiar la contraseña. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-subtle)' }}>
      <div className="w-full max-w-sm p-8" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="flex flex-col items-center gap-2 mb-6 text-center">
          <Gem size={24} style={{ color: 'var(--gold)' }} />
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400 }}>Contraseña nueva</h1>
        </div>

        {!token ? (
          <p style={{ fontSize: '0.875rem', color: '#ef4444', textAlign: 'center' }}>
            El enlace está incompleto. Ábrelo de nuevo desde el correo o pide uno nuevo.
          </p>
        ) : done ? (
          <div className="flex flex-col gap-4 text-center">
            <p style={{ fontSize: '0.9375rem' }}>Listo, tu contraseña cambió. Las sesiones abiertas se cerraron.</p>
            <Link to="/admin" className="btn-gold">Iniciar sesión</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contraseña nueva (mínimo {MIN_PASSWORD} caracteres)</span>
              <input className="form-input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Repítela</span>
              <input className="form-input" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
            {error && <p role="alert" style={{ fontSize: '0.8125rem', color: '#ef4444' }}>{error}</p>}
            <Button type="submit" variant="gold" isLoading={loading} className="w-full justify-center">Guardar contraseña</Button>
            <Link to="/admin" className="text-center underline" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Volver al inicio de sesión</Link>
          </form>
        )}
      </div>
    </main>
  );
}
