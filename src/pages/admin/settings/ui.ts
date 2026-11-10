import Swal from 'sweetalert2';

// Shared look of the settings pages
export const label: React.CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 500,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

export const card: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '1.75rem',
};

export const toast = (title: string) =>
  void Swal.fire({ toast: true, position: 'top-end', icon: 'success', title, showConfirmButton: false, timer: 2500 });
