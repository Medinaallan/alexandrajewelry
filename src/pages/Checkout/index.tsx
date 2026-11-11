import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Upload, ArrowLeft } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatPrice } from '../../utils/formatPrice';
import { generateWhatsAppMessage } from '../../utils/generateWhatsAppMessage';
import { Button } from '../../components/ui/Button';
import { PayPalPay } from '../../components/checkout/PayPalPay';
import { SquarePay } from '../../components/checkout/SquarePay';
import { PaymentOptions, type PayOption } from '../../components/checkout/PaymentOptions';
import { isSquareChoice, methodOf, useApplePayAvailable, type PayChoice } from '../../lib/payChoice';
import { useSiteConfig } from '../../lib/siteConfig';
import { BankAccounts } from '../../components/checkout/BankAccounts';
import { api } from '../../lib/api';
import type { CheckoutForm } from '../../types';

// PayPal and Square orders go through 'pay' (the order exists, the payment form is shown)
type Step = 'form' | 'pay' | 'success';

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [transferFile, setTransferFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [placed, setPlaced] = useState<{
    id: number;
    total: number;
    whatsappUrl?: string;
    receiptMissing: boolean;
    /** PayPal capture id once the customer paid */
    paypalRef?: string;
    /** Square payment, confirmed ("Visa •••• 1111", "Apple Pay") */
    squarePaid?: { method: string; receiptUrl: string | null };
    /** Paid, but a product sold out meanwhile */
    stockShort?: boolean;
  } | null>(null);
  const [form, setForm] = useState<CheckoutForm>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    notes: '',
    paymentMethod: 'transfer',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({});
  // PayPal, Square, bank accounts and WhatsApp come from the store settings
  const config = useSiteConfig();
  const paypalOn = config.paypal.enabled;
  const squareOn = config.square.enabled;

  const applePayHere = useApplePayAvailable();

  // What the customer picked; card, Google Pay and Apple Pay are all charged through Square
  const [choice, setChoice] = useState<PayChoice>('transfer');
  const options: PayOption[] = [
    squareOn && config.square.methods.card && { id: 'card' as const, title: t('checkout.optCard'), subtitle: t('checkout.optCardSub') },
    squareOn && config.square.methods.googlePay && { id: 'googlePay' as const, title: 'Google Pay', subtitle: t('checkout.optGooglePaySub') },
    squareOn && config.square.methods.applePay && applePayHere && { id: 'applePay' as const, title: 'Apple Pay', subtitle: t('checkout.optApplePaySub') },
    paypalOn && { id: 'paypal' as const, title: 'PayPal', subtitle: t('checkout.optPaypalSub') },
    { id: 'transfer' as const, title: t('checkout.optTransfer'), subtitle: t('checkout.optTransferSub') },
    { id: 'whatsapp' as const, title: t('checkout.optWhatsapp'), subtitle: t('checkout.optWhatsappSub') },
  ].filter((o): o is PayOption => Boolean(o));
  const optionIds = options.map((o) => o.id).join(',');

  const choose = (c: PayChoice) => {
    setChoice(c);
    setForm((p) => ({ ...p, paymentMethod: methodOf(c) }));
  };
  // Once the store settings load, start on the first option (cards when Square is on);
  // if the picked one turns out to be off, fall back to the first one too.
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    const ids = optionIds.split(',') as PayChoice[];
    if (!touched || !ids.includes(choice)) {
      setChoice(ids[0]);
      setForm((p) => ({ ...p, paymentMethod: methodOf(ids[0]) }));
    }
  }, [optionIds, touched, choice]);
  const paysOnline = form.paymentMethod === 'paypal' || form.paymentMethod === 'square';

  const set = <K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const validate = (): boolean => {
    const e: Partial<Record<keyof CheckoutForm, string>> = {};
    if (!form.name.trim()) e.name = t('checkout.required');
    if (!form.phone.trim()) e.phone = t('checkout.required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = t('contact.invalidEmail');
    if (!form.address.trim()) e.address = t('checkout.required');
    if (!form.city.trim()) e.city = t('checkout.required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFile = (file: File | null) => {
    setFileError('');
    if (file && !RECEIPT_TYPES.includes(file.type)) {
      setFileError(t('checkout.receiptType'));
      return;
    }
    if (file && file.size > MAX_RECEIPT_BYTES) {
      setFileError(t('checkout.receiptTooBig'));
      return;
    }
    setTransferFile(file);
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    setSubmitError('');
    setLoading(true);
    try {
      const receipt = form.paymentMethod === 'transfer' ? transferFile : null;
      const order = await api.orders.create(form, items, receipt);

      let whatsappUrl: string | undefined;
      if (form.paymentMethod === 'whatsapp') {
        whatsappUrl = generateWhatsAppMessage(config.store.whatsapp, items, order.total, form.name, order.id);
        // May be blocked as a pop-up; the success screen also shows the link
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }

      setPlaced({ id: order.id, total: order.total, whatsappUrl, receiptMissing: Boolean(receipt) && !order.receiptUploaded });
      clearCart();
      setStep(paysOnline ? 'pay' : 'success');
    } catch (err) {
      // The cart is kept so the customer can try again
      setSubmitError(err instanceof Error && err.message !== 'Failed to fetch' ? err.message : t('checkout.error'));
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && step === 'form') {
    return (
      <div className="page-container py-32 text-center">
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '1rem' }}>
          {t('cart.empty')}
        </h2>
        <Link to="/catalog" className="btn-gold inline-flex items-center gap-2">
          {t('cart.exploreCatalog')}
        </Link>
      </div>
    );
  }

  if (step === 'pay' && placed) {
    return (
      <div className="page-container py-24 max-w-md mx-auto">
        <div className="text-center mb-8">
          <p style={{ fontSize: '0.6875rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)' }}>
            {t('checkout.orderNumber')} #{placed.id}
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 300, marginTop: '0.5rem' }}>
            {t('checkout.payTitle')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.75rem', lineHeight: 1.6 }}>
            {t(form.paymentMethod === 'square' ? 'checkout.squarePayMsg' : 'checkout.payMsg')}
          </p>
        </div>
        {form.paymentMethod === 'square' ? (
          <SquarePay
            orderId={placed.id}
            total={placed.total}
            phone={form.phone}
            customer={{ name: form.name, email: form.email }}
            only={isSquareChoice(choice) ? choice : undefined}
            onPaid={({ method, receiptUrl, stockShort }) => {
              setPlaced((p) => (p ? { ...p, squarePaid: { method, receiptUrl }, stockShort } : p));
              setStep('success');
            }}
          />
        ) : (
          <PayPalPay
            orderId={placed.id}
            total={placed.total}
            phone={form.phone}
            onPaid={(paypalRef, stockShort) => {
              setPlaced((p) => (p ? { ...p, paypalRef, stockShort } : p));
              setStep('success');
            }}
          />
        )}
        <p className="text-center mt-8" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          <button type="button" onClick={() => setStep('success')} className="underline hover:text-(--gold)">
            {t('checkout.payLater')}
          </button>
        </p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="page-container py-32 text-center max-w-xl mx-auto">
        <div
          className="flex items-center justify-center w-20 h-20 rounded-full mx-auto mb-6"
          style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold)' }}
        >
          <Check size={36} style={{ color: 'var(--gold)' }} strokeWidth={1.5} />
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontWeight: 300,
            marginBottom: '1rem',
          }}
        >
          {t('checkout.success')}
        </h1>
        {placed && (
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '1rem' }}>
            {t('checkout.orderNumber')} #{placed.id}
          </p>
        )}
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '2.5rem', fontSize: '0.9375rem' }}>
          {t('checkout.successMsg')}
        </p>
        {form.paymentMethod === 'paypal' && placed && (
          <p style={{ fontSize: '0.875rem', marginBottom: '2rem', lineHeight: 1.6, color: placed.paypalRef ? 'var(--text)' : '#b45309' }}>
            {placed.paypalRef
              ? `${placed.stockShort ? t('checkout.paypalPaidShort') : t('checkout.paypalPaid')} ${placed.paypalRef}`
              : t('checkout.paypalPending')}
          </p>
        )}
        {form.paymentMethod === 'square' && placed && (
          <p style={{ fontSize: '0.875rem', marginBottom: '2rem', lineHeight: 1.6, color: placed.squarePaid ? 'var(--text)' : '#b45309' }}>
            {placed.squarePaid ? (
              <>
                {placed.stockShort ? t('checkout.squarePaidShort') : t('checkout.squarePaid')} <strong>{placed.squarePaid.method}</strong>.
                {placed.squarePaid.receiptUrl && (
                  <>
                    {' '}
                    <a href={placed.squarePaid.receiptUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-(--gold)">
                      {t('checkout.squareReceipt')}
                    </a>
                  </>
                )}
              </>
            ) : (
              t('checkout.paypalPending')
            )}
          </p>
        )}
        {form.paymentMethod === 'transfer' && placed && !transferFile && (
          <div className="text-left mb-8 flex flex-col gap-3">
            <p style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>
              Haz la transferencia por <strong>{formatPrice(placed.total)}</strong> y luego sube el comprobante desde «Sigue tu pedido».
            </p>
            <BankAccounts accounts={config.bankAccounts} />
          </div>
        )}
        {placed?.receiptMissing && (
          <p style={{ fontSize: '0.875rem', color: '#ef4444', marginBottom: '2rem' }}>
            {t('checkout.receiptNotUploaded')}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {placed?.whatsappUrl && (
            <a href={placed.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-gold inline-flex items-center gap-2">
              {t('checkout.sendWhatsapp')}
            </a>
          )}
          {placed && (
            <Link to={`/track?id=${placed.id}`} className="btn-outline inline-flex items-center gap-2">
              {t('track.link')}
            </Link>
          )}
          <Link to="/" className={`${placed?.whatsappUrl ? 'btn-outline' : 'btn-gold'} inline-flex items-center gap-2`}>
            <ArrowLeft size={14} /> {t('checkout.backHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="pb-24 pt-10">
      <div className="page-container">
        <div className="mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-(--text-muted) hover:text-(--gold) transition-colors"
          >
            <ArrowLeft size={14} /> {t('common.back')}
          </button>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 300,
              marginTop: '1rem',
            }}
          >
            {t('checkout.title')}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
          {/* Left: Form */}
          <div className="flex flex-col gap-8">
            {/* Personal info */}
            <section className="flex flex-col gap-5">
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                {t('checkout.personalInfo')}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CheckoutField label={t('checkout.name')} error={errors.name} htmlFor="checkout-name">
                  <input id="checkout-name" autoComplete="name" className="form-input" placeholder={t('checkout.name')} value={form.name} onChange={(e) => set('name', e.target.value)} />
                </CheckoutField>
                <CheckoutField label={t('checkout.phone')} error={errors.phone} htmlFor="checkout-phone">
                  <input id="checkout-phone" autoComplete="tel" className="form-input" type="tel" placeholder={t('checkout.phone')} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                </CheckoutField>
              </div>
              <CheckoutField label={t('checkout.email')} error={errors.email} htmlFor="checkout-email">
                <input id="checkout-email" autoComplete="email" className="form-input" type="email" placeholder={t('checkout.emailHint')} value={form.email} onChange={(e) => set('email', e.target.value)} />
              </CheckoutField>
              <CheckoutField label={t('checkout.address')} error={errors.address} htmlFor="checkout-address">
                <input id="checkout-address" autoComplete="street-address" className="form-input" placeholder={t('checkout.address')} value={form.address} onChange={(e) => set('address', e.target.value)} />
              </CheckoutField>
              <CheckoutField label={t('checkout.city')} error={errors.city} htmlFor="checkout-city">
                <input id="checkout-city" autoComplete="address-level2" className="form-input" placeholder={t('checkout.city')} value={form.city} onChange={(e) => set('city', e.target.value)} />
              </CheckoutField>
              <CheckoutField label={t('checkout.notes')} htmlFor="checkout-notes">
                <textarea id="checkout-notes" className="form-input resize-none" rows={3} placeholder={t('checkout.notes')} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </CheckoutField>
            </section>

            {/* Payment */}
            <section className="flex flex-col gap-5">
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                {t('checkout.paymentMethod')}
              </h2>

              <PaymentOptions
                options={options}
                value={choice}
                onChange={(c) => {
                  setTouched(true);
                  choose(c);
                }}
                renderDetail={(c) => {
                  const note = (text: string) => (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{text}</p>
                  );
                  switch (c) {
                    case 'card':
                      return note(t('checkout.cardDetail'));
                    case 'googlePay':
                      return note(t('checkout.googlePayDetail'));
                    case 'applePay':
                      return note(t('checkout.applePayDetail'));
                    case 'paypal':
                      return note(t('checkout.paypalMsg'));
                    case 'whatsapp':
                      return note(t('checkout.whatsappMsg'));
                    case 'transfer':
                      return (
                        <div className="flex flex-col gap-4">
                          {config.bankAccounts.length > 0 && note(
                            'Haz la transferencia por el total del pedido a una de estas cuentas y sube aquí la foto o el PDF del comprobante. Si todavía no pagaste, también puedes subirlo después desde «Sigue tu pedido».',
                          )}
                          <BankAccounts accounts={config.bankAccounts} />
                          <label className="flex flex-col items-center gap-3 py-6 border border-dashed border-(--border) cursor-pointer hover:border-(--gold) transition-colors" style={{ background: 'var(--bg)' }}>
                            <Upload size={20} style={{ color: transferFile ? 'var(--gold)' : 'var(--text-muted)' }} />
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                              {transferFile ? transferFile.name : t('checkout.transferDrag')}
                            </span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                            />
                          </label>
                          {fileError && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{fileError}</span>}
                        </div>
                      );
                  }
                }}
              />
            </section>
          </div>

          {/* Right: Order Summary */}
          <div className="flex flex-col gap-0">
            <div className="sticky top-24">
              <div style={{ border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 400 }}>
                    {t('checkout.orderSummary')}
                  </h2>
                </div>
                <ul className="divide-y divide-(--border)">
                  {items.map(({ product, quantity }) => {
                    const name = language === 'es' ? product.name : product.nameEn;
                    return (
                      <li key={product.id} className="flex gap-3 px-6 py-4">
                        <div className="w-14 h-16 shrink-0 overflow-hidden bg-[--gray-100]">
                          <img src={product.images?.[0]?.data || ''} alt={name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                          <p style={{ fontSize: '0.875rem', lineHeight: 1.3 }} className="line-clamp-2">{name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>×{quantity}</p>
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, flexShrink: 0 }}>
                          {formatPrice(product.price * quantity)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="px-6 py-5 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>{t('cart.subtotal')}</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>{t('cart.shipping')}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{t('cart.shippingTbd')}</span>
                  </div>
                  <div className="flex justify-between pt-3 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem' }}>{t('cart.total')}</span>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem' }}>{formatPrice(total)}</span>
                  </div>
                </div>
                <div className="px-6 pb-6 flex flex-col gap-3">
                  {submitError && (
                    <p role="alert" style={{ fontSize: '0.8125rem', color: '#ef4444', padding: '0.625rem 0.875rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {submitError}
                    </p>
                  )}
                  <Button variant="gold" className="w-full justify-center" isLoading={loading} onClick={handleConfirm}>
                    <Check size={15} /> {paysOnline ? t('checkout.continueToPay') : t('checkout.confirm')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function CheckoutField({ label, error, htmlFor, children }: { label: string; error?: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} style={{ fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>}
    </div>
  );
}
