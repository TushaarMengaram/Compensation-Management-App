import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';

export function RegisterPage() {
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      const u = await register({ name: name.trim(), email: email.trim(), password });
      toast.success('Account created');
      navigate(u.role === 'admin' ? '/admin' : '/employee', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed'));
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
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Create employee account</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">You will only see your own compensation data.</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="ui-label block" htmlFor="name">
              Full name
            </label>
            <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="ui-input mt-1" />
          </div>
          <div>
            <label className="ui-label block" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ui-input mt-1"
            />
          </div>
          <div>
            <label className="ui-label block" htmlFor="password">
              Password (min 8 characters)
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ui-input mt-1"
            />
          </div>
          <button type="submit" disabled={submitting} className="ui-btn-primary w-full">
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have access?{' '}
          <Link className="font-medium text-slate-900 dark:text-slate-100 underline dark:text-slate-100" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
