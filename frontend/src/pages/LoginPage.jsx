import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(255, 75, 42, 0.1), transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(255, 75, 42, 0.05), transparent 50%),
          var(--bg-primary)
        `,
      }}
    >
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255, 75, 42, 0.07), transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255, 75, 42, 0.04), transparent 70%)',
          }}
        />
      </div>

      <div className="animate-fade-in-up w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FF4B2A, #FF745F)',
              boxShadow: '0 8px 32px rgba(255, 75, 42, 0.25)',
            }}
          >
            <Logo className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Atlas<span style={{ color: '#FF4B2A' }}>.</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            AI-Driven Educational Intelligence
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="aryan.k@srm.edu"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Demo credentials: any student email + <code className="px-1.5 py-0.5 rounded-md text-xs" style={{ background: 'var(--bg-secondary)' }}>password123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
