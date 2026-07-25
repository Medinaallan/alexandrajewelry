import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1920&q=80';

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section
      className="relative min-h-[90vh] lg:min-h-screen flex items-end"
      style={{ overflow: 'hidden' }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={HERO_IMAGE}
          alt="Alexandra Jewelry Hero"
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 30%' }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 100%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative page-container pb-20 lg:pb-28 pt-32 w-full">
        <div className="max-w-xl">
          <p
            className="section-label mb-5 animate-fade-up"
            style={{ color: 'var(--gold-light)', animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}
          >
            {t('hero.label')}
          </p>
          <h1
            className="animate-fade-up"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 300,
              color: '#FAFAFA',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              whiteSpace: 'pre-line',
              animationDelay: '0.2s',
              opacity: 0,
              animationFillMode: 'forwards',
            }}
          >
            {t('hero.title')}
          </h1>
          <p
            className="animate-fade-up mt-5"
            style={{
              color: 'rgba(250,250,250,0.8)',
              fontSize: '0.9375rem',
              lineHeight: 1.7,
              maxWidth: '380px',
              animationDelay: '0.35s',
              opacity: 0,
              animationFillMode: 'forwards',
            }}
          >
            {t('hero.subtitle')}
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 mt-8 animate-fade-up"
            style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}
          >
            <Link to="/catalog" className="btn-gold">
              {t('hero.cta')} <ArrowRight size={14} />
            </Link>
            <Link to="/about" className="btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>
              {t('hero.secondary')}
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 right-8 hidden lg:flex flex-col items-center gap-2"
        style={{ color: 'rgba(255,255,255,0.5)' }}
      >
        <span style={{ fontSize: '0.5625rem', letterSpacing: '0.2em', textTransform: 'uppercase', writingMode: 'vertical-rl' }}>
          Scroll
        </span>
        <div style={{ width: '1px', height: '48px', background: 'rgba(255,255,255,0.3)' }} />
      </div>
    </section>
  );
}
