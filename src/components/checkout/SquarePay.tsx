import { useEffect, useRef, useState } from 'react';
import { CreditCard, Lock } from 'lucide-react';
import { api } from '../../lib/api';
import { loadSiteConfig } from '../../lib/siteConfig';
import { loadSquare, splitName, SQUARE_CURRENCY, type SquareCard, type SquareWallet, type TokenResult } from '../../lib/square';
import { formatPrice } from '../../utils/formatPrice';
import { Button } from '../ui/Button';

export type SquarePaid = { paymentId: string; method: string; receiptUrl: string | null; stockShort: boolean };

type Wallet = 'googlePay' | 'applePay';
type Source = 'card' | Wallet;

type Props = {
  orderId: number;
  total: number;
  phone: string;
  /** For the bank's verification (3-D Secure) and the receipt; optional */
  customer?: { name?: string; email?: string };
  /** Show only this method (what the customer picked at checkout); all allowed ones if not given */
  only?: Source;
  /** Square charged the card and the order is marked paid. */
  onPaid(result: SquarePaid): void;
};

const errorBox: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: '#ef4444',
  padding: '0.625rem 0.875rem',
  background: 'rgba(239,68,68,0.08)',
  border: '1px solid rgba(239,68,68,0.2)',
};

// Apple's own button look (Safari only; elsewhere Apple Pay isn't offered)
const applePayCss = `
.ajw-apple-pay { -webkit-appearance: -apple-pay-button; -apple-pay-button-type: pay; -apple-pay-button-style: black; height: 48px; width: 100%; cursor: pointer; border: 0; }
`;

/** Card form, Google Pay and Apple Pay through Square, for one order. */
export function SquarePay({ orderId, total, phone, customer, only, onPaid }: Props) {
  const cardBox = useRef<HTMLDivElement>(null);
  const googleBox = useRef<HTMLDivElement>(null);
  const card = useRef<SquareCard | null>(null);
  const wallets = useRef<Partial<Record<Wallet, SquareWallet>>>({});
  const [phase, setPhase] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [fatal, setFatal] = useState('');
  const [available, setAvailable] = useState<Record<Source, boolean>>({ card: false, googlePay: false, applePay: false });
  const [busy, setBusy] = useState<Source | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // Latest values without rebuilding the form
  const latest = useRef({ onPaid, customer, phone });
  latest.current = { onPaid, customer, phone };

  useEffect(() => {
    let closed = false;
    const created: Array<{ destroy(): Promise<boolean> }> = [];
    const keep = <T extends { destroy(): Promise<boolean> }>(x: T) => {
      created.push(x);
      return x;
    };
    const unavailable = 'El pago con tarjeta no está disponible en este momento. Escríbenos y te ayudamos a pagar.';

    (async () => {
      const { square: config } = await loadSiteConfig();
      if (!config.enabled) throw new Error(unavailable);
      const Square = await loadSquare(config.environment);
      if (closed) return;
      const payments = Square.payments(config.applicationId, config.locationId);
      // Only what the customer picked (if given and allowed), otherwise everything allowed
      const wanted: Record<Source, boolean> = only
        ? { card: false, googlePay: false, applePay: false, [only]: config.methods[only] }
        : { ...config.methods };
      const found: Record<Source, boolean> = { card: false, googlePay: false, applePay: false };

      const request = wanted.googlePay || wanted.applePay
        ? payments.paymentRequest({
            countryCode: 'US',
            currencyCode: SQUARE_CURRENCY,
            total: { amount: total.toFixed(2), label: 'Alexandra Jewelry' },
          })
        : null;

      // Each wallet only shows where the device supports it
      if (request && wanted.googlePay && googleBox.current) {
        try {
          const g = keep(await payments.googlePay(request));
          if (closed) return;
          await g.attach?.(googleBox.current, { buttonColor: 'black', buttonSizeMode: 'fill', buttonType: 'pay' });
          wallets.current.googlePay = g;
          found.googlePay = true;
        } catch {
          /* not available on this device */
        }
      }
      if (request && wanted.applePay) {
        try {
          const a = keep(await payments.applePay(request));
          wallets.current.applePay = a;
          found.applePay = true;
        } catch {
          /* not Safari / no Apple Pay / domain not registered */
        }
      }
      if (closed) return;

      // The wallet they picked isn't available here: offer the card instead
      const walletMissing = only && only !== 'card' && !found[only];
      if (walletMissing && config.methods.card) {
        setNotice(`${only === 'googlePay' ? 'Google Pay' : 'Apple Pay'} no está disponible en este dispositivo o navegador. Puedes pagar con tarjeta:`);
      }
      if ((wanted.card || (walletMissing && config.methods.card)) && cardBox.current) {
        const c = keep(await payments.card({ style: { input: { fontSize: '15px' } } }));
        if (closed) return;
        await c.attach(cardBox.current);
        card.current = c;
        found.card = true;
      }

      if (closed) return;
      if (!found.card && !found.googlePay && !found.applePay) {
        throw new Error(config.methods.card ? 'Square no cargó' : 'Este dispositivo no admite Google Pay ni Apple Pay. Elige otra forma de pago.');
      }
      setAvailable(found);
      setPhase('ready');
    })().catch((err: unknown) => {
      if (closed) return;
      // Our own messages are shown as they are; anything from the SDK gets a generic one
      const own = err instanceof Error && (err.message === unavailable || err.message.startsWith('Este dispositivo'));
      setFatal(own ? (err as Error).message : 'No pudimos cargar el pago con tarjeta. Revisa tu conexión y recarga la página.');
      setPhase('failed');
    });

    return () => {
      closed = true;
      card.current = null;
      wallets.current = {};
      for (const x of created) void x.destroy().catch(() => undefined);
    };
  }, [orderId, total, only]);

  const pay = async (source: Source) => {
    if (busy) return;
    setError('');
    setBusy(source);
    try {
      const { customer: who, phone: tel } = latest.current;
      let result: TokenResult | undefined;
      if (source === 'card') {
        const name = splitName(who?.name ?? '');
        result = await card.current?.tokenize({
          amount: total.toFixed(2),
          currencyCode: SQUARE_CURRENCY,
          intent: 'CHARGE',
          customerInitiated: true,
          sellerKeyedIn: false,
          billingContact: {
            givenName: name.givenName || undefined,
            familyName: name.familyName || undefined,
            email: who?.email || undefined,
            phone: tel || undefined,
            countryCode: 'US',
          },
        });
      } else {
        result = await wallets.current[source]?.tokenize();
      }

      if (!result || result.status === 'Cancel' || result.status === 'Abort') return; // closed the wallet sheet
      if (result.status !== 'OK' || !result.token) {
        setError(source === 'card' ? 'Revisa los datos de la tarjeta e intenta de nuevo.' : 'No se completó el pago. Intenta de nuevo.');
        return;
      }

      const paid = await api.orders.paySquare(orderId, tel, result.token);
      latest.current.onPaid({ paymentId: paid.paymentId, method: paid.method, receiptUrl: paid.receiptUrl, stockShort: paid.stockShort });
    } catch (err) {
      setError(err instanceof Error && err.message !== 'Failed to fetch' ? err.message : 'No pudimos procesar el pago. No se te cobró; intenta de nuevo.');
    } finally {
      setBusy(null);
    }
  };

  const hasWallet = available.googlePay || available.applePay;

  return (
    <div className="flex flex-col gap-4">
      <style>{applePayCss}</style>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Total a pagar: <strong style={{ color: 'var(--text)' }}>{formatPrice(total)}</strong>
      </p>
      {phase === 'loading' && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>Cargando el pago seguro…</p>
      )}
      {phase === 'failed' && <p role="alert" style={errorBox}>{fatal}</p>}

      {/* Square draws its buttons and fields here; the elements must stay mounted */}
      <div className="flex flex-col gap-3" style={{ display: phase === 'failed' ? 'none' : undefined }}>
        {available.applePay && (
          <button
            type="button"
            className="ajw-apple-pay"
            aria-label="Pagar con Apple Pay"
            disabled={busy !== null}
            onClick={() => void pay('applePay')}
          />
        )}
        <div
          ref={googleBox}
          role="button"
          aria-label="Pagar con Google Pay"
          onClick={() => available.googlePay && void pay('googlePay')}
          style={{ display: available.googlePay ? 'block' : 'none', minHeight: 48, pointerEvents: busy ? 'none' : undefined }}
        />

        {notice && <p style={{ fontSize: '0.8125rem', color: '#b45309', lineHeight: 1.5 }}>{notice}</p>}
        {hasWallet && available.card && (
          <div className="flex items-center gap-3" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span className="flex-1" style={{ borderTop: '1px solid var(--border)' }} />
            o con tarjeta de débito o crédito
            <span className="flex-1" style={{ borderTop: '1px solid var(--border)' }} />
          </div>
        )}

        <div ref={cardBox} style={{ display: available.card || phase === 'loading' ? 'block' : 'none' }} />
        {available.card && (
          <Button type="button" variant="gold" className="w-full justify-center" isLoading={busy === 'card'} disabled={busy !== null} onClick={() => void pay('card')}>
            <CreditCard size={15} /> Pagar {formatPrice(total)}
          </Button>
        )}
      </div>

      {error && <p role="alert" style={errorBox}>{error}</p>}
      {phase === 'ready' && (
        <p className="flex items-center justify-center gap-1.5" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Lock size={12} /> Pago procesado de forma segura por Square. No guardamos los datos de tu tarjeta.
        </p>
      )}
    </div>
  );
}
