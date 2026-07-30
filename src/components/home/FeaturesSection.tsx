import { Shield, Hammer, ShieldCheck, Truck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const features = [
  {
    Icon: Shield,
    titleKey: 'features.auth.title',
    descKey: 'features.auth.desc',
  },
  {
    Icon: Hammer,
    titleKey: 'features.design.title',
    descKey: 'features.design.desc',
  },
  {
    Icon: ShieldCheck,
    titleKey: 'features.care.title',
    descKey: 'features.care.desc',
  },
  {
    Icon: Truck,
    titleKey: 'features.ship.title',
    descKey: 'features.ship.desc',
  },
];

export function FeaturesSection() {
  const { t } = useLanguage();

  return (
    <section className="py-16 lg:py-20 bg-[--bg]" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="page-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
          {features.map(({ Icon, titleKey, descKey }) => (
            <div key={titleKey} className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <Icon size={20} style={{ color: 'var(--gold)' }} strokeWidth={1.5} />
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
                  {t(titleKey)}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {t(descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
