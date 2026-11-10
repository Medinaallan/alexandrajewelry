import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Search, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import { formatPrice } from '../../utils/formatPrice';
import { Button } from '../../components/ui/Button';
import { PayPalPay } from '../../components/checkout/PayPalPay';
import { BankAccounts } from '../../components/checkout/BankAccounts';
import { useSiteConfig } from '../../lib/siteConfig';
import type { OrderStatus, OrderTracking } from '../../types';

// The normal path of an order; "cancelled" is shown apart
// "confirmed" and "review" (payment being checked) show on the first step
const STEPS: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered'];

const STEP_HELP: Record<OrderStatus, string> = {
  pending: 'Recibimos tu pedido. Pronto te contactaremos para confirmarlo.',
  confirmed: 'Confirmamos tu pedido y estamos esperando tu pago.',
  review: 'Recibimos tu pago y lo estamos verificando.',
  paid: 'Recibimos tu pago. Estamos preparando tu pedido.',
  shipped: 'Tu pedido va en camino.',
  delivered: 'Tu pedido fue entregado. ¡Gracias por tu compra!',
  cancelled: '',
};

export default function TrackOrderPage() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const [orderId, setOrderId] = useState(params.get('id') ?? '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<OrderTracking | null>(null);
  // Phone of the order shown (the input may be edited afterwards)
  const [orderPhone, setOrderPhone] = useState('');
  const config = useSiteConfig();
  const [receipt, setReceipt] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const sendReceipt = async () => {
    if (!order || !receipt) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(receipt.type)) {
      setUploadMsg({ ok: false, text: 'El comprobante debe ser una foto (JPG, PNG, WebP) o un PDF.' });
      return;
    }
    if (receipt.size > 5 * 1024 * 1024) {
      setUploadMsg({ ok: false, text: 'El archivo no puede pesar más de 5 MB.' });
      return;
    }
    setUploading(true);
    setUploadMsg(null);
    try {
      const { stockShort } = await api.orders.uploadReceipt(order.id, orderPhone, receipt);
      setOrder({ ...order, receiptSent: true, canUploadReceipt: false, status: stockShort ? order.status : 'review' });
      setReceipt(null);
      setUploadMsg({
        ok: true,
        text: stockShort
          ? 'Recibimos tu comprobante, pero uno de los productos se agotó. Te contactaremos para resolverlo.'
          : 'Recibimos tu comprobante. Lo verificaremos y te avisaremos.',
      });
    } catch (err) {
      setUploadMsg({ ok: false, text: err instanceof Error && err.message !== 'Failed to fetch' ? err.message : 'No se pudo enviar. Intenta de nuevo.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = Number(orderId.replace(/\D/g, ''));
    if (!id || !phone.trim()) {
      setError('Escribe el número de pedido y tu teléfono.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      setOrder(await api.orders.track(id, phone));
      setOrderPhone(phone);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error && err.message !== 'Failed to fetch' ? err.message : 'No pudimos consultar tu pedido. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = order ? (['confirmed', 'review'].includes(order.status) ? 0 : STEPS.indexOf(order.status)) : -1;
  const labelStyle: React.CSSProperties = { fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' };

  return (
    <main className="pb-24 pt-12">
      <div className="page-container max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 300 }}>
            {t('track.title')}
          </h1>
          <div className="gold-line mt-4" />
          <p style={{ color: 'var(--text-muted)', marginTop: '1.25rem', fontSize: '0.9375rem' }}>{t('track.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] gap-4 items-end mb-10">
          <label className="flex flex-col gap-1.5">
            <span style={labelStyle}>{t('track.orderNumber')}</span>
            <input className="form-input" inputMode="numeric" placeholder="Ej: 12" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span style={labelStyle}>{t('track.phone')}</span>
            <input className="form-input" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <Button type="submit" variant="gold" isLoading={loading} className="justify-center">
            <Search size={14} /> {t('track.search')}
          </Button>
        </form>

        {error && (
          <p role="alert" style={{ fontSize: '0.875rem', color: '#ef4444', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </p>
        )}

        {order && (
          <section aria-live="polite" style={{ border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
            <div className="px-6 py-5 flex flex-wrap items-baseline justify-between gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 400 }}>
                {t('checkout.orderNumber')} #{order.id}
              </h2>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {t('track.placed')} {new Date(order.createdAt).toLocaleDateString('es-US', { dateStyle: 'long' })}
              </span>
            </div>

            <div className="px-6 py-6">
              {order.status === 'cancelled' ? (
                <p className="flex items-center gap-2" style={{ color: '#ef4444', fontSize: '0.9375rem' }}>
                  <X size={18} /> {t('track.cancelled')}
                </p>
              ) : (
                <>
                  <ol className="grid grid-cols-4 gap-2 mb-5" aria-label="Estado del pedido">
                    {STEPS.map((step, i) => {
                      const done = i <= currentStep;
                      return (
                        <li key={step} className="flex flex-col items-center gap-2 text-center" aria-current={i === currentStep ? 'step' : undefined}>
                          <span
                            className="flex items-center justify-center w-8 h-8 rounded-full"
                            style={{
                              border: `1px solid ${done ? 'var(--gold)' : 'var(--border)'}`,
                              background: done ? 'var(--gold)' : 'var(--bg)',
                              color: done ? 'white' : 'var(--text-muted)',
                              fontSize: '0.75rem',
                            }}
                          >
                            {done ? <Check size={14} /> : i + 1}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: done ? 'var(--text)' : 'var(--text-muted)', fontWeight: i === currentStep ? 600 : 400 }}>
                            {t(`admin.orders.status.${step}`)}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--text)' }}>{STEP_HELP[order.status]}</p>
                  {order.canUploadReceipt && (
                    <div className="mt-6 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                        {order.receiptSent ? 'Ya recibimos un comprobante. Si necesitas, puedes enviar otro:' : 'Paga por transferencia y envíanos el comprobante'}
                      </p>
                      {!order.receiptSent && <BankAccounts accounts={config.bankAccounts} />}
                      <label className="flex flex-col items-center gap-2 py-6 border-2 border-dashed border-(--border) cursor-pointer hover:border-(--gold) transition-colors" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {receipt ? receipt.name : 'Toca aquí para elegir la foto o el PDF del comprobante'}
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { setReceipt(e.target.files?.[0] ?? null); setUploadMsg(null); }} />
                      </label>
                      <Button type="button" variant="gold" isLoading={uploading} disabled={!receipt} onClick={() => void sendReceipt()} className="justify-center">
                        Enviar comprobante
                      </Button>
                    </div>
                  )}
                  {uploadMsg && (
                    <p role="status" style={{ fontSize: '0.875rem', marginTop: '0.75rem', color: uploadMsg.ok ? '#16a34a' : '#ef4444' }}>{uploadMsg.text}</p>
                  )}
                  {order.paymentMethod === 'paypal' && (order.status === 'pending' || order.status === 'confirmed') && (
                    order.paymentReported ? (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>{t('track.paypalReported')}</p>
                    ) : !order.canPay ? (
                      <p style={{ fontSize: '0.875rem', color: '#b45309', marginTop: '0.75rem' }}>{t('track.paypalExpired')}</p>
                    ) : (
                      <div className="mt-6 max-w-sm mx-auto">
                        <p style={{ fontSize: '0.875rem', color: '#b45309', marginBottom: '1rem', textAlign: 'center' }}>{t('track.paypalDue')}</p>
                        <PayPalPay
                          orderId={order.id}
                          total={order.total}
                          phone={orderPhone}
                          onPaid={(_ref, stockShort) =>
                            setOrder((o) => (o ? { ...o, paymentReported: true, canPay: false, status: stockShort ? o.status : 'review' } : o))
                          }
                        />
                      </div>
                    )
                  )}
                </>
              )}
            </div>

            <ul className="divide-y divide-(--border)" style={{ borderTop: '1px solid var(--border)' }}>
              {order.items.map((item, i) => (
                <li key={i} className="px-6 py-3 flex justify-between gap-4 text-sm">
                  <span>{item.quantity} × {item.name}</span>
                  <span>{formatPrice(item.subtotal)}</span>
                </li>
              ))}
            </ul>
            <div className="px-6 py-4 flex justify-between" style={{ borderTop: '1px solid var(--border)', fontFamily: 'var(--font-serif)', fontSize: '1.0625rem' }}>
              <span>{t('cart.total')}</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </section>
        )}

        <p className="text-center mt-10" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          ¿Necesitas ayuda? <Link to="/contact" className="underline hover:text-(--gold)">Contáctanos</Link>
        </p>
      </div>
    </main>
  );
}
