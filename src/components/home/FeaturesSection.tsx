import { Store, PackageSearch, MessageCircle, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const features = [
  // Only what the store really offers (no unconfirmed claims)
  { Icon: Store, titleKey: 'features.store.title', descKey: 'features.store.desc' },
  { Icon: PackageSearch, titleKey: 'features.track.title', descKey: 'features.track.desc' },
  { Icon: MessageCircle, titleKey: 'features.help.title', descKey: 'features.help.desc' },
  { Icon: RotateCcw, titleKey: 'features.returns.title', descKey: 'features.returns.desc' },
];

export function FeaturesSection() {
  const { t } = useLanguage();

  return (
    <section className="bg-(--bg-subtle)" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="page-container py-6 lg:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 lg:divide-x divide-(--border)">
          {features.map(({ Icon, titleKey, descKey }) => (
            <div key={titleKey} className="flex items-center gap-3.5 lg:px-6 lg:first:pl-0">
              <div className="shrink-0">
                <Icon size={20} style={{ color: 'var(--gold)' }} strokeWidth={1.5} />
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)', marginBottom: '3px' }}>
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
