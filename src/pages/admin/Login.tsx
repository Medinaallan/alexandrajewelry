import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gem, Eye, EyeOff } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/ui/Button';

export default function AdminLoginPage() {
  const { login, isAuthenticated } = useAdmin();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated redirect
  if (isAuthenticated) {
    navigate('/admin/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const ok = await login(username, password);
    setLoading(false);
    if (ok) {
      navigate('/admin/dashboard', { replace: true });
    } else {
      setError(t('admin.login.error'));
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--black)' }}
    >
      <div
        className="w-full max-w-sm flex flex-col gap-8 p-8 lg:p-10"
        style={{ border: '1px solid #1a1a1a', background: '#0d0d0d' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Gem size={28} style={{ color: 'var(--gold)' }} strokeWidth={1.5} />
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'white', letterSpacing: '0.08em' }}>
              ALEXANDRA
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.22em', color: 'var(--gold)', textTransform: 'uppercase' }}>
              JEWELRY
            </div>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>
            {t('admin.login.title')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-500)' }}>
              {t('admin.login.username')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              className="form-input"
              style={{ background: '#141414', borderColor: '#2a2a2a', color: 'white' }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-500)' }}>
              {t('admin.login.password')}
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="form-input pr-10"
                style={{ background: '#141414', borderColor: '#2a2a2a', color: 'white', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[--gray-500] hover:text-[--gold] transition-colors"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p style={{ fontSize: '0.8125rem', color: '#ef4444', padding: '0.625rem 0.875rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </p>
          )}

          <Button type="submit" variant="gold" isLoading={loading} className="w-full justify-center mt-2">
            {t('admin.login.submit')}
          </Button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--gray-600)' }}>
          Demo credentials: admin / alexandra2026
        </p>
      </div>
    </div>
  );
}
