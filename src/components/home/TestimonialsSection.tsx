import { Star } from 'lucide-react';
import Swal from 'sweetalert2';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';

const INPUT_STYLE =
  'width:100%;padding:10px 12px;background:var(--bg-subtle);border:1px solid var(--border);' +
  'border-radius:4px;color:var(--text);font-size:0.875rem;outline:none;box-sizing:border-box;';

export function TestimonialsSection() {
  const { t } = useLanguage();
  const { testimonials } = useData();

  const openReviewForm = async () => {
    let rating = 5;

    const paintStars = (active: number) => {
      document.querySelectorAll<HTMLElement>('.swal-star').forEach((el) => {
        el.style.opacity = Number(el.dataset.value) <= active ? '1' : '0.3';
      });
    };

    const result = await Swal.fire({
      title: t('testimonials.form.title'),
      background: 'var(--bg)',
      color: 'var(--text)',
      confirmButtonText: t('testimonials.form.submit'),
      confirmButtonColor: '#C9A45D',
      cancelButtonText: t('common.cancel'),
      showCancelButton: true,
      focusConfirm: false,
      width: 560,
      html: `
        <div style="text-align:left;display:flex;flex-direction:column;gap:14px;">
          <div>
            <label style="font-size:0.8125rem;color:var(--text-muted);display:block;margin-bottom:6px;">
              ${t('testimonials.form.clientName')} <span style="color:#C9A45D;">*</span>
            </label>
            <input id="swal-name" maxlength="120"
              placeholder="${t('testimonials.form.clientNamePlaceholder')}"
              style="${INPUT_STYLE}" />
          </div>
          <div>
            <label style="font-size:0.8125rem;color:var(--text-muted);display:block;margin-bottom:6px;">
              ${t('testimonials.form.message')} <span style="color:#C9A45D;">*</span>
            </label>
            <textarea id="swal-text" maxlength="1000" rows="4"
              placeholder="${t('testimonials.form.messagePlaceholder')}"
              style="${INPUT_STYLE}resize:vertical;font-family:inherit;"></textarea>
          </div>
          <div>
            <label style="font-size:0.8125rem;color:var(--text-muted);display:block;margin-bottom:8px;">
              ${t('testimonials.form.rating')}
            </label>
            <div style="display:flex;gap:6px;">
              ${[1, 2, 3, 4, 5].map((i) =>
                `<span class="swal-star" data-value="${i}"
                  style="cursor:pointer;font-size:30px;color:#C9A45D;line-height:1;transition:opacity 0.12s;">&#9733;</span>`
              ).join('')}
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label style="font-size:0.8125rem;color:var(--text-muted);display:block;margin-bottom:6px;">
                ${t('testimonials.form.email')}
              </label>
              <input id="swal-email" type="email" maxlength="200"
                placeholder="correo@ejemplo.com" style="${INPUT_STYLE}" />
            </div>
            <div>
              <label style="font-size:0.8125rem;color:var(--text-muted);display:block;margin-bottom:6px;">
                ${t('testimonials.form.cityCountry')}
              </label>
              <input id="swal-location" maxlength="100"
                placeholder="Tegucigalpa, Honduras" style="${INPUT_STYLE}" />
            </div>
          </div>
          <div>
            <label style="font-size:0.8125rem;color:var(--text-muted);display:block;margin-bottom:6px;">
              ${t('testimonials.form.productPurchased')}
            </label>
            <input id="swal-product" maxlength="200"
              placeholder="Anillo Gold 14K" style="${INPUT_STYLE}" />
          </div>
        </div>
      `,
      didOpen: () => {
        paintStars(rating);
        document.querySelectorAll<HTMLElement>('.swal-star').forEach((el) => {
          el.addEventListener('click', () => {
            rating = Number(el.dataset.value);
            paintStars(rating);
          });
          el.addEventListener('mouseenter', () => paintStars(Number(el.dataset.value)));
          el.addEventListener('mouseleave', () => paintStars(rating));
        });
      },
      preConfirm: () => {
        const name     = (document.getElementById('swal-name')     as HTMLInputElement).value.trim();
        const text     = (document.getElementById('swal-text')     as HTMLTextAreaElement).value.trim();
        const email    = (document.getElementById('swal-email')    as HTMLInputElement).value.trim();
        const location = (document.getElementById('swal-location') as HTMLInputElement).value.trim();
        const productPurchased = (document.getElementById('swal-product') as HTMLInputElement).value.trim();

        if (!name || !text) {
          Swal.showValidationMessage(`${t('testimonials.form.clientName')} y ${t('testimonials.form.message')} son obligatorios`);
          return false;
        }
        return { name, text, rating, email, location, productPurchased };
      },
    });

    if (!result.isConfirmed || !result.value) return;

    try {
      await api.testimonials.submit({
        name: result.value.name,
        text: result.value.text,
        rating: result.value.rating,
        location: result.value.location || undefined,
        email: result.value.email || undefined,
        productPurchased: result.value.productPurchased || undefined,
      });

      void Swal.fire({
        icon: 'success',
        title: `¡${t('common.yes')}!`,
        text: t('testimonials.form.success'),
        background: 'var(--bg)',
        color: 'var(--text)',
        confirmButtonColor: '#C9A45D',
        confirmButtonText: t('common.close'),
      });
    } catch {
      void Swal.fire({
        icon: 'error',
        title: 'Error',
        text: t('testimonials.form.error'),
        background: 'var(--bg)',
        color: 'var(--text)',
        confirmButtonColor: '#C9A45D',
      });
    }
  };

  return (
    <section className="py-16 md:py-24 bg-[--bg]">
      <div className="page-container">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="section-label mb-3">{t('testimonials.label')}</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 300 }}>
            {t('testimonials.title')}
          </h2>
          <div className="gold-line mt-4" />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-5 p-6"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-subtle)', borderRadius: '8px' }}
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: item.rating }).map((_, i) => (
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
                &ldquo;{item.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <img
                  src={item.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=C9A45D&color=fff`}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=C9A45D&color=fff`;
                  }}
                />
                <div>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text)' }}>{item.name}</p>
                  {item.location && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{item.location}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Button variant="outline" onClick={() => { void openReviewForm(); }}>
            {t('testimonials.cta')}
          </Button>
        </div>
      </div>
    </section>
  );
}