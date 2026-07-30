import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const BANNER_IMAGE =
  'https://images.unsplash.com/photo-1602751584552-8ba733a2d25b?auto=format&fit=crop&w=1600&q=80';

export function BannerSection() {
  const { t } = useLanguage();

  return (
    <section className="relative py-32 flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={BANNER_IMAGE}
          alt="Jewelry banner"
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 40%' }}
          loading="lazy"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        />
      </div>

      {/* Content */}
      <div className="relative page-container text-center text-white">
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            fontWeight: 300,
            lineHeight: 1.2,
            whiteSpace: 'pre-line',
            marginBottom: '1.25rem',
          }}
        >
          {t('banner.title')}
        </h2>
        <p
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: '1.125rem',
            maxWidth: '480px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.7,
          }}
        >
          {t('banner.subtitle')}
        </p>
        <Link
          to="/catalog"
          className="btn-gold inline-flex items-center gap-2"
          style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}
        >
          {t('banner.cta')} <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
