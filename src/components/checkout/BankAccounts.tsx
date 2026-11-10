import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { BankAccount } from '../../lib/siteConfig';

/** The store's bank accounts for a transfer, with a copy button for the account number. */
export function BankAccounts({ accounts }: { accounts: BankAccount[] }) {
  const [copied, setCopied] = useState<number | null>(null);

  if (accounts.length === 0) {
    return (
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
        Te enviaremos los datos para la transferencia por mensaje.
      </p>
    );
  }

  const copy = async (i: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 2000);
    } catch {
      // clipboard blocked: the number is still visible to copy by hand
    }
  };

  return (
    <ul className="flex flex-col gap-3">
      {accounts.map((a, i) => (
        <li key={`${a.bank}-${a.number}`} className="p-4 text-left" style={{ background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '0.875rem', lineHeight: 1.7 }}>
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{a.bank}</div>
          <div style={{ color: 'var(--text-muted)' }}>Titular: <span style={{ color: 'var(--text)' }}>{a.holder}</span></div>
          <div className="flex flex-wrap items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            Cuenta: <span style={{ color: 'var(--text)', fontFamily: 'monospace', fontSize: '0.9375rem' }}>{a.number}</span>
            <button
              type="button"
              onClick={() => void copy(i, a.number)}
              className="inline-flex items-center gap-1 hover:text-(--gold)"
              style={{ fontSize: '0.75rem', color: copied === i ? '#16a34a' : 'var(--text-muted)' }}
              aria-label={`Copiar número de cuenta de ${a.bank}`}
            >
              {copied === i ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
            </button>
          </div>
          {a.details && <div style={{ color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>{a.details}</div>}
        </li>
      ))}
    </ul>
  );
}
