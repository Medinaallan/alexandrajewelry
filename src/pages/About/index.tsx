import { Link } from 'react-router-dom';
import { ShoppingBag, CreditCard, PackageSearch, MessageCircle, MapPin } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { mapsLinks, useSiteConfig, whatsappUrl } from '../../lib/siteConfig';

const HERO_IMG = 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1200&q=80';

// Only facts about the store and how the site works (no unconfirmed claims).
const steps = [
  { Icon: ShoppingBag, title: 'Elige tus piezas', text: 'Mira el catálogo y agrega al carrito lo que te guste.' },
  { Icon: CreditCard, title: 'Haz tu pedido', text: 'Escribe tus datos y elige cómo pagar. Recibes un número de pedido.' },
  { Icon: PackageSearch, title: 'Sigue tu pedido', text: 'Con tu número de pedido y tu teléfono ves en qué estado está. También te avisamos por correo.' },
  { Icon: MessageCircle, title: '¿Dudas?', text: 'Escríbenos por WhatsApp o por el formulario de contacto, o visítanos en la tienda.' },
];

export default function AboutPage() {
  const { t } = useLanguage();
  const { store } = useSiteConfig();
  const address = [store.street, store.cityLine].filter(Boolean).join(', ');

  return (
    <main className="pb-32">
      {/* Hero */}
      <section className="relative h-72 lg:h-96 overflow-hidden flex items-end">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
        </div>
        <div className="relative page-container pb-16">
          <p className="section-label mb-3" style={{ color: 'var(--gold-light)' }}>{store.name}</p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 300, color: 'white' }}>
            {t('about.title')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9375rem', marginTop: '0.75rem' }}>{t('about.subtitle')}</p>
        </div>
      </section>

      <div className="page-container py-20">
        {/* Who we are */}
        <section className="max-w-3xl mx-auto text-center mb-24">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300, marginBottom: '1.25rem' }}>
            Quiénes somos
          </h2>
          <div className="gold-line mb-6" />
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1rem' }}>
            {store.name} es una tienda de joyería{address ? ` en ${address}` : ''}. En este sitio puedes ver nuestras piezas,
            comprarlas en línea y seguir tu pedido. También puedes visitarnos en la tienda o escribirnos cuando quieras.
          </p>
        </section>

        {/* How to buy */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Cómo comprar</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300 }}>Comprar es fácil</h2>
            <div className="gold-line mt-5" />
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ Icon, title, text }, i) => (
              <li key={title} className="flex flex-col gap-4 p-7" style={{ border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: 'var(--gold)', opacity: 0.6, lineHeight: 1 }}>{i + 1}</span>
                  <Icon size={20} style={{ color: 'var(--gold)' }} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem' }}>{title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Visit / contact */}
        <section className="flex flex-col items-center gap-5 text-center">
          {address && (
            <a href={mapsLinks(store).url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-(--gold)" style={{ fontSize: '0.9375rem' }}>
              <MapPin size={16} style={{ color: 'var(--gold)' }} /> {address}
            </a>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/catalog" className="btn-gold">{t('nav.catalog')}</Link>
            <a href={whatsappUrl(store.whatsapp)} target="_blank" rel="noopener noreferrer" className="btn-outline inline-flex items-center gap-2">
              <MessageCircle size={14} /> WhatsApp
            </a>
            <Link to="/contact" className="btn-outline">{t('nav.contact')}</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
