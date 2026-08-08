import { Star } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';

export function TestimonialsSection() {
  const { t, language } = useLanguage();
  const { testimonials } = useData();

  return (
    <section className="py-28 lg:py-32 bg-[--bg]">
      <div className="page-container">
        {/* Header */}
        <div className="text-center mb-20">
          <p className="section-label mb-3">{t('testimonials.label')}</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.875rem, 4vw, 3rem)', fontWeight: 300 }}>
            {t('testimonials.title')}
          </h2>
          <div className="gold-line mt-5" />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {testimonials.map((t_) => {
            const text = language === 'es' ? t_.text : t_.textEn;
            const location = language === 'es' ? t_.location : t_.locationEn;

            return (
              <div
                key={t_.id}
                className="flex flex-col gap-6 p-10"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}
              >
                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: t_.rating }).map((_, i) => (
                    <Star key={i} size={13} fill="var(--gold)" style={{ color: 'var(--gold)' }} />
                  ))}
                </div>

                {/* Quote */}
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.125rem',
                    fontWeight: 300,
                    lineHeight: 1.8,
                    color: 'var(--text)',
                    fontStyle: 'italic',
                  }}
                >
                  &ldquo;{text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <img
                    src={t_.avatar}
                    alt={t_.name}
                    className="w-10 h-10 rounded-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(t_.name)}&background=C9A45D&color=fff`;
                    }}
                  />
                  <div>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text)' }}>{t_.name}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{location}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
