import { useLanguage } from '../../contexts/LanguageContext';

const HERO_IMG = 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1200&q=80';
const CRAFT_IMG = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80';
const CRAFT_IMG2 = 'https://images.unsplash.com/photo-1602751584552-8ba733a2d25b?auto=format&fit=crop&w=800&q=80';

const values = [
  { title: 'Authenticity', titleEs: 'Autenticidad', desc: 'Every gemstone and metal we use is certified and ethically sourced.', descEs: 'Cada gema y metal que usamos está certificado y obtenido éticamente.' },
  { title: 'Craftsmanship', titleEs: 'Artesanía', desc: 'Our artisans dedicate hundreds of hours to each piece.', descEs: 'Nuestros artesanos dedican cientos de horas a cada pieza.' },
  { title: 'Sustainability', titleEs: 'Sostenibilidad', desc: 'We are committed to responsible practices and the environment.', descEs: 'Estamos comprometidos con prácticas responsables y el medio ambiente.' },
  { title: 'Excellence', titleEs: 'Excelencia', desc: 'We accept nothing less than perfection in every detail.', descEs: 'No aceptamos nada menos que la perfección en cada detalle.' },
];

const processSteps = [
  { num: '01', title: 'Design', titleEs: 'Diseño', desc: 'Our designers sketch each piece by hand, drawing inspiration from nature, architecture and the human form.', descEs: 'Nuestros diseñadores esbozan cada pieza a mano, inspirándose en la naturaleza, la arquitectura y la forma humana.' },
  { num: '02', title: 'Selection', titleEs: 'Selección', desc: 'We source only the finest gemstones and precious metals, personally selected by our master gemologist.', descEs: 'Solo seleccionamos las mejores gemas y metales preciosos, elegidos personalmente por nuestro maestro gemólogo.' },
  { num: '03', title: 'Crafting', titleEs: 'Elaboración', desc: 'Each piece is handcrafted in our atelier by artisans with over 20 years of experience.', descEs: 'Cada pieza es elaborada a mano en nuestro taller por artesanos con más de 20 años de experiencia.' },
  { num: '04', title: 'Finishing', titleEs: 'Acabado', desc: 'A rigorous quality control process ensures every detail meets our exacting standards before reaching you.', descEs: 'Un riguroso proceso de control de calidad garantiza que cada detalle cumpla nuestros estándares exigentes antes de llegar a ti.' },
];

export default function AboutPage() {
  const { t, language } = useLanguage();
  const es = language === 'es';

  return (
    <main className="pb-32">
      {/* Hero */}
      <section className="relative h-72 lg:h-96 overflow-hidden flex items-end">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="About Alexandra Jewelry" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
        </div>
        <div className="relative page-container pb-16">
          <p className="section-label mb-3" style={{ color: 'var(--gold-light)' }}>Alexandra Jewelry</p>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 300,
              color: 'white',
            }}
          >
            {t('about.title')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem', marginTop: '0.75rem' }}>
            {t('about.subtitle')}
          </p>
        </div>
      </section>

      <div className="page-container py-28">
        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-28">
          <div className="flex flex-col gap-6">
            <p className="section-label">{t('about.mission.title')}</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.875rem', fontWeight: 300 }}>
              {es
                ? 'Crear joyería que trasciende el tiempo y se convierte en parte de las historias de las personas.'
                : 'To create jewelry that transcends time and becomes part of people\'s stories.'}
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '0.9375rem' }}>
              {es
                ? 'Fundada en 2010 con una sola mesa y una visión apasionada, Alexandra Jewelry nació del amor profundo por la artesanía. Hoy, más de una década después, cada pieza que sale de nuestro taller lleva consigo ese mismo espíritu: la búsqueda incesante de la perfección.'
                : 'Founded in 2010 with a single workbench and a passionate vision, Alexandra Jewelry was born from a deep love of craftsmanship. Today, more than a decade later, every piece that leaves our atelier carries that same spirit: the relentless pursuit of perfection.'}
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <p className="section-label">{t('about.vision.title')}</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.875rem', fontWeight: 300 }}>
              {es
                ? 'Ser el estándar global de la joyería artesanal de alta gama.'
                : 'To be the global standard for high-end artisan jewelry.'}
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '0.9375rem' }}>
              {es
                ? 'Visualizamos un mundo donde la belleza auténtica y duradera está al alcance de quienes la aprecian. Donde cada pieza de joyería es un testimonio de habilidad humana y amor por el oficio.'
                : 'We envision a world where authentic, lasting beauty is accessible to those who appreciate it. Where every piece of jewelry is a testament to human skill and love of the craft.'}
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-28">
          <div className="text-center mb-16">
            <p className="section-label mb-3">{t('about.values.title')}</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300 }}>
              {es ? 'Lo que nos define' : 'What defines us'}
            </h2>
            <div className="gold-line mt-5" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {values.map((v) => (
              <div key={v.title} className="flex flex-col gap-5 p-8" style={{ border: '1px solid var(--border)' }}>
                <div style={{ width: '32px', height: '2px', background: 'var(--gold)' }} />
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem' }}>
                  {es ? v.titleEs : v.title}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  {es ? v.descEs : v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Craft process */}
        <div>
          <div className="text-center mb-16">
            <p className="section-label mb-3">{t('about.process.subtitle')}</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300 }}>
              {t('about.process.title')}
            </h2>
            <div className="gold-line mt-5" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-12">
            <div className="grid grid-cols-1 gap-8">
              {processSteps.map((step) => (
                <div key={step.num} className="flex gap-6">
                  <span
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '2rem',
                      fontWeight: 300,
                      color: 'var(--gold)',
                      opacity: 0.4,
                      lineHeight: 1,
                      flexShrink: 0,
                      width: '48px',
                    }}
                  >
                    {step.num}
                  </span>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', marginBottom: '0.625rem' }}>
                      {es ? step.titleEs : step.title}
                    </h4>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                      {es ? step.descEs : step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img src={CRAFT_IMG} alt="Jewelry crafting" className="w-full aspect-square object-cover" loading="lazy" />
              <img src={CRAFT_IMG2} alt="Gold jewelry" className="w-full aspect-square object-cover mt-6" loading="lazy" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
