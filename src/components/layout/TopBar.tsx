import { useLanguage } from '../../contexts/LanguageContext';

export function TopBar() {
  const { t } = useLanguage();

  return (
    <div
      style={{
        background: 'var(--black)',
        color: 'var(--gray-300)',
        textAlign: 'center',
        padding: '0.75rem 1rem',
        fontSize: '0.75rem',
        letterSpacing: '0.1em',
        fontWeight: 400,
      }}
    >
      {t('topbar.message')}
    </div>
  );
}
