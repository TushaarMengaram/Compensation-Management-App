import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';

export function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const u = await login(email.trim(), password);
      toast.success('Signed in');
      navigate(u.role === 'admin' ? '/admin' : '/employee', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Sign in failed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ui-shell relative flex min-h-full w-full items-center justify-center px-4 py-12">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md ui-card rounded-2xl p-8">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Compensation management portal</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="ui-label block" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ui-input mt-1"
            />
          </div>
          <div>
            <label className="ui-label block" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ui-input mt-1"
            />
          </div>
          <button type="submit" disabled={submitting} className="ui-btn-primary w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          New employee?{' '}
          <Link className="font-medium text-slate-900 dark:text-slate-100 underline dark:text-slate-100" to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
