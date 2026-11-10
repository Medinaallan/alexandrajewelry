import { useSiteConfig } from '../../lib/siteConfig';

/** Message set in Configuración > Mi tienda; hidden when empty. */
export function TopBar() {
  const { store } = useSiteConfig();
  if (!store.topbarMessage) return null;

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
      {store.topbarMessage}
    </div>
  );
}
