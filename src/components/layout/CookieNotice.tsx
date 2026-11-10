import { useState } from 'react';
import { Link } from 'react-router-dom';

const KEY = 'alexandra-cookie-notice';

function alreadySeen(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** One-time notice about the browser storage the site uses (no tracking cookies). */
export function CookieNotice() {
  const [open, setOpen] = useState(() => !alreadySeen());
  if (!open) return null;

  const accept = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // storage blocked: the notice just shows again next time
    }
    setOpen(false);
  };

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:max-w-sm z-50 p-5 flex flex-col gap-3"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', fontSize: '0.8125rem', lineHeight: 1.6 }}
    >
      <p style={{ color: 'var(--text-muted)' }}>
        Usamos el almacenamiento de tu navegador solo para que el sitio funcione (carrito y preferencias). Algunos servicios,
        como PayPal y Google, pueden usar sus propias cookies.{' '}
        <Link to="/legal/cookies" className="underline hover:text-(--gold)">Más información</Link>
      </p>
      <button type="button" onClick={accept} className="btn-gold self-end" style={{ padding: '0.5rem 1.25rem' }}>
        Entendido
      </button>
    </div>
  );
}
