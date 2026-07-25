import { useLanguage } from '../../contexts/LanguageContext';

export function TopBar() {
  const { t } = useLanguage();

  return (
    <div
      style={{
        background: 'var(--black)',
        color: 'var(--gray-300)',
        textAlign: 'center',
        padding: '0.6rem 1rem',
        fontSize: '0.6875rem',
        letterSpacing: '0.1em',
        fontWeight: 400,
      }}
    >
      {t('topbar.message')}
    </div>
  );
}
