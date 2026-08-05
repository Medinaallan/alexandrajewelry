import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Upload, ArrowLeft } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatPrice } from '../../utils/formatPrice';
import { generateWhatsAppMessage } from '../../utils/generateWhatsAppMessage';
import { Button } from '../../components/ui/Button';
import type { CheckoutForm } from '../../types';

type Step = 'form' | 'payment' | 'success';

const PAYMENT_METHODS = [
  { id: 'transfer', icon: '🏦' },
  { id: 'googlepay', icon: '🔵' },
  { id: 'paypal', icon: '🅿️' },
  { id: 'whatsapp', icon: '💬' },
] as const;

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [transferFile, setTransferFile] = useState<File | null>(null);
  const [form, setForm] = useState<CheckoutForm>({
    name: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
    paymentMethod: 'transfer',
    transferFile: null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({});

  const set = <K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const validate = (): boolean => {
    const e: Partial<Record<keyof CheckoutForm, string>> = {};
    if (!form.name.trim()) e.name = t('checkout.required');
    if (!form.phone.trim()) e.phone = t('checkout.required');
    if (!form.address.trim()) e.address = t('checkout.required');
    if (!form.city.trim()) e.city = t('checkout.required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);

    if (form.paymentMethod === 'whatsapp') {
      const url = generateWhatsAppMessage(items, total, form.name);
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    clearCart();
    setStep('success');
  };

  if (items.length === 0 && step !== 'success') {
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
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '2.5rem', fontSize: '0.9375rem' }}>
          {t('checkout.successMsg')}
        </p>
        <Link to="/" className="btn-gold inline-flex items-center gap-2">
          <ArrowLeft size={14} /> {t('checkout.backHome')}
        </Link>
      </div>
    );
  }

  return (
    <main className="pb-24 pt-10">
      <div className="page-container">
        <div className="mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-[--text-muted] hover:text-[--gold] transition-colors"
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
                <CheckoutField label={t('checkout.name')} error={errors.name}>
                  <input className="form-input" placeholder={t('checkout.name')} value={form.name} onChange={(e) => set('name', e.target.value)} />
                </CheckoutField>
                <CheckoutField label={t('checkout.phone')} error={errors.phone}>
                  <input className="form-input" type="tel" placeholder={t('checkout.phone')} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                </CheckoutField>
              </div>
              <CheckoutField label={t('checkout.address')} error={errors.address}>
                <input className="form-input" placeholder={t('checkout.address')} value={form.address} onChange={(e) => set('address', e.target.value)} />
              </CheckoutField>
              <CheckoutField label={t('checkout.city')} error={errors.city}>
                <input className="form-input" placeholder={t('checkout.city')} value={form.city} onChange={(e) => set('city', e.target.value)} />
              </CheckoutField>
              <CheckoutField label={t('checkout.notes')}>
                <textarea className="form-input resize-none" rows={3} placeholder={t('checkout.notes')} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </CheckoutField>
            </section>

            {/* Payment */}
            <section className="flex flex-col gap-5">
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                {t('checkout.paymentMethod')}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PAYMENT_METHODS.map(({ id, icon }) => (
                  <button
                    key={id}
                    onClick={() => set('paymentMethod', id as CheckoutForm['paymentMethod'])}
                    className="flex flex-col items-center gap-2 py-4 px-3 transition-all"
                    style={{
                      border: `1px solid ${form.paymentMethod === id ? 'var(--gold)' : 'var(--border)'}`,
                      background: form.paymentMethod === id ? 'var(--gold-pale)' : 'var(--bg)',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 500,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: form.paymentMethod === id ? 'var(--gold-dark)' : 'var(--text-muted)',
                      }}
                    >
                      {t(`checkout.${id}`)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Payment detail panels */}
              <div className="p-6" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                {form.paymentMethod === 'transfer' && (
                  <div className="flex flex-col gap-4">
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                      {language === 'es'
                        ? 'Por favor realiza tu transferencia a los datos bancarios que te enviaremos por mensaje. Luego sube el comprobante.'
                        : 'Please make your transfer to the bank details we will send you by message. Then upload your receipt.'}
                    </p>
                    <label className="flex flex-col items-center gap-3 py-8 border-2 border-dashed border-[--border] cursor-pointer hover:border-[--gold] transition-colors">
                      <Upload size={24} style={{ color: transferFile ? 'var(--gold)' : 'var(--text-muted)' }} />
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        {transferFile ? transferFile.name : t('checkout.transferDrag')}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setTransferFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                )}
                {form.paymentMethod === 'googlepay' && (
                  <div className="text-center py-4">
                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔵</div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', marginBottom: '0.5rem' }}>Google Pay</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto' }}>
                      {t('checkout.googlePayMsg')}
                    </p>
                  </div>
                )}
                {form.paymentMethod === 'paypal' && (
                  <div className="text-center py-4">
                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🅿️</div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', marginBottom: '0.5rem' }}>PayPal</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto' }}>
                      {t('checkout.paypalMsg')}
                    </p>
                  </div>
                )}
                {form.paymentMethod === 'whatsapp' && (
                  <div className="text-center py-4">
                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>💬</div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', marginBottom: '0.5rem' }}>WhatsApp</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '320px', margin: '0 auto' }}>
                      {t('checkout.whatsappMsg')}
                    </p>
                  </div>
                )}
              </div>
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
                <ul className="divide-y divide-[--border]">
                  {items.map(({ product, quantity }) => {
                    const name = language === 'es' ? product.name : product.nameEn;
                    return (
                      <li key={product.id} className="flex gap-3 px-6 py-4">
                        <div className="w-14 h-16 shrink-0 overflow-hidden bg-[--gray-100]">
                          <img src={product.images?.[0]?.data || ''} alt={name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                          <p style={{ fontSize: '0.875rem', lineHeight: 1.3 }} className="line-clamp-2">{name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {t('cart.items').replace('items', '')} ×{quantity}
                          </p>
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
                    <span style={{ color: 'var(--gold)' }}>{t('cart.shippingFree')}</span>
                  </div>
                  <div className="flex justify-between pt-3 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem' }}>{t('cart.total')}</span>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem' }}>{formatPrice(total)}</span>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <Button variant="gold" className="w-full justify-center" isLoading={loading} onClick={handleConfirm}>
                    <Check size={15} /> {t('checkout.confirm')}
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

function CheckoutField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>}
    </div>
  );
}
