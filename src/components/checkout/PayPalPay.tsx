import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { captureOf, loadPayPal, PAYPAL_CLIENT_ID, PAYPAL_CURRENCY } from '../../lib/paypal';
import { formatPrice } from '../../utils/formatPrice';

type Props = {
  orderId: number;
  total: number;
  phone: string;
  /** Called once PayPal took the money and the order has the payment noted. */
  onPaid(captureId: string): void;
};

type State =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'failed'; message: string }
  // PayPal charged the customer but the store didn't get the note
  | { kind: 'unreported'; captureId: string };

const errorBox: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: '#ef4444',
  padding: '0.625rem 0.875rem',
  background: 'rgba(239,68,68,0.08)',
  border: '1px solid rgba(239,68,68,0.2)',
};

/** PayPal buttons (PayPal, card, and whatever PayPal offers the buyer) for one order. */
export function PayPalPay({ orderId, total, phone, onPaid }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>({ kind: 'loading' });
  // Latest callback without re-rendering the buttons
  const paidRef = useRef(onPaid);
  paidRef.current = onPaid;

  useEffect(() => {
    if (!PAYPAL_CLIENT_ID) {
      setState({ kind: 'failed', message: 'El pago con PayPal no está disponible en este momento. Escríbenos y te ayudamos a pagar.' });
      return;
    }
    let closed = false;
    let buttons: { close(): Promise<void> } | null = null;

    loadPayPal()
      .then((paypal) => {
        if (closed || !container.current) return;
        const instance = paypal.Buttons({
          style: { layout: 'vertical', shape: 'rect', label: 'pay' },
          createOrder: (_data, actions) =>
            actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  // PayPal refuses a second payment with the same invoice id
                  invoice_id: `AJW-${orderId}`,
                  custom_id: String(orderId),
                  description: `Alexandra Jewelry - Pedido #${orderId}`,
                  amount: { currency_code: PAYPAL_CURRENCY, value: total.toFixed(2) },
                },
              ],
            }),
          onApprove: async (_data, actions) => {
            const result = await actions.order.capture();
            const capture = captureOf(result);
            if (!capture) {
              setState({ kind: 'failed', message: 'PayPal no confirmó el pago. No se te cobró; intenta de nuevo.' });
              return;
            }
            try {
              await api.orders.reportPaypal(orderId, phone, capture.id, Number(capture.amount?.value ?? total));
              paidRef.current(capture.id);
            } catch {
              setState({ kind: 'unreported', captureId: capture.id });
            }
          },
          onError: () =>
            setState({ kind: 'failed', message: 'Hubo un problema con PayPal. No se te cobró; intenta de nuevo.' }),
        });
        buttons = instance;
        return instance.render(container.current).then(() => {
          if (!closed) setState({ kind: 'ready' });
        });
      })
      .catch(() => {
        if (!closed) setState({ kind: 'failed', message: 'No pudimos cargar PayPal. Revisa tu conexión y recarga la página.' });
      });

    return () => {
      closed = true;
      void buttons?.close().catch(() => undefined);
    };
  }, [orderId, total, phone]);

  if (state.kind === 'unreported') {
    return (
      <p role="alert" style={errorBox}>
        Tu pago se realizó (referencia PayPal <strong>{state.captureId}</strong>), pero no pudimos anotarlo en tu
        pedido #{orderId}. Guarda esa referencia y envíanosla para confirmar tu pedido.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Total a pagar: <strong style={{ color: 'var(--text)' }}>{formatPrice(total)}</strong>
      </p>
      {state.kind === 'loading' && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>Cargando PayPal…</p>
      )}
      {state.kind === 'failed' && <p role="alert" style={errorBox}>{state.message}</p>}
      {/* PayPal draws its buttons here; the element must stay mounted */}
      <div ref={container} />
    </div>
  );
}
