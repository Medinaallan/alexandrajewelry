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
    <section className="bg-[--bg-subtle]" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="page-container py-5 lg:py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
          {features.map(({ Icon, titleKey, descKey }) => (
            <div key={titleKey} className="flex items-center gap-3">
              <div className="shrink-0">
                <Icon size={18} style={{ color: 'var(--gold)' }} strokeWidth={1.5} />
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>
                  {t(titleKey)}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
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
