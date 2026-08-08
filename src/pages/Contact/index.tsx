import { useState } from 'react';
import { MessageCircle, Clock, MapPin, Globe, Hash } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/ui/Button';

interface FormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function ContactPage() {
  const { t, language } = useLanguage();
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<FormState> = {};
    if (!form.name.trim()) newErrors.name = t('checkout.required');
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Valid email required';
    if (!form.message.trim()) newErrors.message = t('checkout.required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000)); // Simulate API call
    setLoading(false);
    setSubmitted(true);
  };

  const inputProps = (field: keyof FormState) => ({
    value: form[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value })),
  });

  const es = language === 'es';

  return (
    <main className="pb-24">
      {/* Hero */}
      <section className="py-28 text-center bg-[--bg-subtle]" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="section-label mb-3">{t('contact.subtitle')}</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 300 }}>
          {t('contact.title')}
        </h1>
        <div className="gold-line mt-5" />
      </section>

      <div className="page-container py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">

          {/* Form */}
          <div>
            {submitted ? (
              <div
                className="flex flex-col items-center justify-center gap-5 py-16 text-center"
                style={{ border: '1px solid var(--border)' }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.5rem' }}>✓</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>
                  {t('contact.form.success')}
                </h3>
                <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', message: '' }); }} className="btn-outline" style={{ padding: '0.625rem 1.5rem' }}>
                  {t('common.back')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '0.5rem' }}>
                  {t('contact.title')}
                </h2>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '0.875rem 1rem', background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
                  {t('contact.privacy')}
                </p>

                <FormField label={t('contact.form.name')} error={errors.name}>
                  <input type="text" placeholder={t('contact.form.name')} className="form-input" required {...inputProps('name')} />
                </FormField>
                <FormField label={t('contact.form.email')} error={errors.email}>
                  <input type="email" placeholder={t('contact.form.email')} className="form-input" required {...inputProps('email')} />
                </FormField>
                <FormField label={t('contact.form.phone')}>
                  <input type="tel" placeholder={t('contact.form.phone')} className="form-input" {...inputProps('phone')} />
                </FormField>
                <FormField label={t('contact.form.message')} error={errors.message}>
                  <textarea
                    placeholder={t('contact.form.message')}
                    rows={5}
                    className="form-input resize-none"
                    required
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  />
                </FormField>

                <Button type="submit" variant="gold" isLoading={loading} className="self-start">
                  {t('contact.form.send')}
                </Button>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-10">
            {/* WhatsApp */}
              <div className="flex flex-col gap-5 p-8" style={{ border: '1px solid var(--border)' }}>
              <MessageCircle size={22} style={{ color: 'var(--gold)' }} />
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem' }}>WhatsApp</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                {t('contact.privacy')}
              </p>
              <a
                href="https://wa.me/15550000000"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold self-start mt-2 flex items-center gap-2"
                style={{ padding: '0.75rem 1.5rem' }}
              >
                <MessageCircle size={14} /> {t('contact.whatsapp')}
              </a>
            </div>

            {/* Hours */}
              <div className="flex flex-col gap-5 p-8" style={{ border: '1px solid var(--border)' }}>
              <Clock size={22} style={{ color: 'var(--gold)' }} />
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem' }}>{t('contact.hours')}</h3>
              <div className="flex flex-col gap-1.5">
                {[
                  { days: es ? 'Lunes – Viernes' : 'Monday – Friday', hours: '9:00 AM – 6:00 PM' },
                  { days: es ? 'Sábado' : 'Saturday', hours: '10:00 AM – 4:00 PM' },
                  { days: es ? 'Domingo' : 'Sunday', hours: es ? 'Cerrado' : 'Closed' },
                ].map(({ days, hours }) => (
                  <div key={days} className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>{days}</span>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location (simulated map) */}
              <div className="flex flex-col gap-5 p-8" style={{ border: '1px solid var(--border)' }}>
              <MapPin size={22} style={{ color: 'var(--gold)' }} />
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem' }}>{t('contact.location')}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {es ? '123 Calle de la Joyería, Ciudad de Lujo' : '123 Jewelry Lane, Luxury City'}
              </p>
              {/* Simulated map */}
              <div
                className="w-full mt-2 flex items-center justify-center"
                style={{ height: '160px', background: 'var(--gray-100)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #e8e8e8 25%, #f0f0f0 50%, #e8e8e8 75%)', backgroundSize: '400% 400%', animation: 'shimmer 3s ease infinite' }} />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={28} style={{ color: 'var(--gold)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {es ? 'Mapa de Ubicación' : 'Location Map'}
                  </span>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="flex flex-col gap-3">
              <p className="section-label">{t('contact.social')}</p>
              <div className="flex gap-3">
                {[
                { Icon: Globe, label: 'Instagram', href: '#' },
                { Icon: Hash, label: 'Facebook', href: '#' },
                ].map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-widest border border-[--border] hover:border-[--gold] hover:text-[--gold] transition-all"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Icon size={14} /> {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>}
    </div>
  );
}
