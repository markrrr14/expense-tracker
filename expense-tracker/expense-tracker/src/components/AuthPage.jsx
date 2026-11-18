import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const empty = { name: '', email: '', password: '', password_confirmation: '' };

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c6.5 0 10 8 10 8a18.4 18.4 0 0 1-3.2 4.3" />
      <path d="M6.1 6.1A18.7 18.7 0 0 0 2 12s3.5 8 10 8a10.7 10.7 0 0 0 4.3-.9" />
    </svg>
  );
}

function PasswordInput({ label, value, onChange, autoComplete, minLength, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <label>
      {label}
      <span className="password-wrap">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
    </label>
  );
}

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setForm(empty);
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isRegister) {
        await register({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          password_confirmation: form.password_confirmation,
        });
      } else {
        await login({ email: form.email.trim(), password: form.password });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card form auth-card" onSubmit={submit}>
        <div className="auth-brand">
          <Logo />
          <h1 className="auth-title">Expense Tracker</h1>
        </div>
        <p className="muted auth-sub">
          {isRegister ? 'Create an account to start tracking.' : 'Log in to see your expenses.'}
        </p>

        {error && <p className="error">{error}</p>}

        {isRegister && (
          <label>
            Name
            <input value={form.name} onChange={set('name')} autoComplete="name" required maxLength={100} placeholder="Juan Dela Cruz" />
          </label>
        )}

        <label>
          Email
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required placeholder="you@example.com" />
        </label>

        <PasswordInput
          label="Password"
          value={form.password}
          onChange={set('password')}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          minLength={isRegister ? 8 : undefined}
          placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
        />

        {isRegister && (
          <PasswordInput
            label="Confirm password"
            value={form.password_confirmation}
            onChange={set('password_confirmation')}
            autoComplete="new-password"
            minLength={8}
            placeholder="Repeat your password"
          />
        )}

        <div className="actions">
          <button className="btn" disabled={busy}>
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </div>

        <p className="muted small auth-switch">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="link" onClick={switchMode}>
            {isRegister ? 'Log in' : 'Register'}
          </button>
        </p>
      </form>
    </div>
  );
}
