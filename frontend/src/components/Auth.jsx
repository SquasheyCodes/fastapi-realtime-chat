import { useState } from 'react';
import { API_URL } from '../config';
import {
  IconCheck,
  IconEye,
  IconEyeOff,
  IconMoon,
  IconSpinner,
  IconSun,
  Logo,
} from './icons';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Same rules the backend enforces in UserCreate.
const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { id: 'number', label: 'A number', test: (v) => /\d/.test(v) },
  {
    id: 'symbol',
    label: 'A special character, like ! or @',
    test: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v),
  },
];

async function postJson(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

// FastAPI sends validation failures (422) as a list of { loc, msg }.
function fieldErrorsFrom(data) {
  const errors = {};
  if (!Array.isArray(data?.detail)) return errors;
  for (const item of data.detail) {
    const field = item.loc?.[item.loc.length - 1];
    if (typeof field === 'string' && !errors[field]) {
      errors[field] = String(item.msg ?? 'Invalid value').replace(
        /^Value error, /,
        '',
      );
    }
  }
  return errors;
}

const NETWORK_ERROR = `Can't reach the server at ${API_URL}. Check that the backend is running.`;

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

const inputClass =
  'h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-3 transition-colors hover:border-ink-3/60 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15';

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordInput({ id, value, onChange, autoComplete, invalid, describedBy }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`${inputClass} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-ink-3 transition-colors hover:text-ink"
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  );
}

function FormError({ children }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger animate-pop"
    >
      {children}
    </p>
  );
}

function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-white transition-[background-color,transform] hover:bg-accent-hover active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
    >
      {loading && <IconSpinner size={18} />}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* The two forms. Each owns its own state, so nothing typed into one    */
/* can leak into the other.                                            */
/* ------------------------------------------------------------------ */

function LoginForm({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const name = username.trim();
      const res = await postJson('/ws/login', { username: name, password });
      if (res.ok) {
        onSuccess({ token: res.data.access_token, username: name });
        return;
      }
      // The backend validates login input like a signup, so a password that
      // breaks the rules comes back as 422. Either way it can't match an account.
      setError(
        res.status === 400 || res.status === 422
          ? 'That username and password don’t match an account.'
          : 'Something went wrong on the server. Try again in a moment.',
      );
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FormError>{error}</FormError>
      <Field id="login-username" label="Username">
        <input
          id="login-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          className={inputClass}
        />
      </Field>
      <Field id="login-password" label="Password">
        <PasswordInput
          id="login-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </Field>
      <SubmitButton loading={loading}>
        {loading ? 'Logging in…' : 'Log in'}
      </SubmitButton>
    </form>
  );
}

function RegisterForm({ onSuccess, onNeedLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const failing = PASSWORD_RULES.filter((rule) => !rule.test(password));
  const nameTooShort = username.trim().length < 3;

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const next = {};
    if (nameTooShort) next.username = 'Use at least 3 characters.';
    if (failing.length) next.password = 'Your password is missing a few things.';
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setErrors({});
    setLoading(true);
    const name = username.trim();
    try {
      const created = await postJson('/ws/register', { username: name, password });
      if (!created.ok) {
        const fields = fieldErrorsFrom(created.data);
        if (Object.keys(fields).length) {
          setErrors(fields);
        } else if (typeof created.data?.detail === 'string') {
          // e.g. "Username already exists! Please choose another username"
          setErrors({ username: created.data.detail });
        } else {
          setErrors({ form: 'Could not create the account. Try again.' });
        }
        return;
      }

      // Registration doesn't return a token, so log straight in.
      const session = await postJson('/ws/login', { username: name, password });
      if (session.ok) {
        onSuccess({ token: session.data.access_token, username: name });
      } else {
        onNeedLogin();
      }
    } catch {
      setErrors({ form: NETWORK_ERROR });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FormError>{errors.form}</FormError>
      <Field id="register-username" label="Username" error={errors.username}>
        <input
          id="register-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={errors.username ? true : undefined}
          aria-describedby={errors.username ? 'register-username-error' : undefined}
          className={inputClass}
        />
      </Field>
      <Field id="register-password" label="Password" error={errors.password}>
        <PasswordInput
          id="register-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          invalid={Boolean(errors.password)}
          describedBy="register-rules"
        />
        <ul id="register-rules" className="mt-3 space-y-1.5">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <li
                key={rule.id}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  met ? 'text-ok' : 'text-ink-3'
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                    met ? 'border-ok bg-ok text-surface' : 'border-line'
                  }`}
                >
                  {met && <IconCheck size={11} strokeWidth={3} />}
                </span>
                {rule.label}
              </li>
            );
          })}
        </ul>
      </Field>
      <SubmitButton loading={loading}>
        {loading ? 'Creating account…' : 'Create account'}
      </SubmitButton>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Left panel: a small conversation that plays once on load            */
/* ------------------------------------------------------------------ */

const DEMO = [
  { who: 'mira', text: 'Standup moved to 10:30. Does that work for everyone?', delay: 500 },
  { who: 'dev', text: 'Works for me.', delay: 1500 },
  { who: 'sam', text: 'Same. I’ll drop the demo link in here.', delay: 2500, mine: true },
];

function Hero() {
  return (
    <section
      aria-hidden="true"
      className="relative hidden overflow-hidden bg-accent p-12 text-white lg:flex lg:flex-col"
    >
      <span className="pointer-events-none absolute -bottom-24 -right-6 select-none font-display text-[26rem] font-bold leading-none text-white/[0.07]">
        #
      </span>

      <div className="relative flex items-center gap-2.5 font-display text-xl font-bold tracking-tight">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-white text-accent">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H12l-3.5 3.2V15h-1A2.5 2.5 0 0 1 5 12.5z" />
          </svg>
        </span>
        Chatten
      </div>

      <div className="relative mt-auto max-w-md pb-6">
        <h2 className="font-display text-5xl font-bold leading-[1.05] tracking-tight">
          Chat rooms that feel instant.
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-white/80">
          Join any room by name. See who’s online, and catch up on the last 50
          messages when you arrive.
        </p>

        <div className="mt-10 space-y-2.5">
          <p className="animate-rise font-display text-sm font-semibold text-white/80" style={{ animationDelay: '300ms' }}>
            #general
          </p>
          {DEMO.map((m) => (
            <div
              key={m.who}
              className={`flex animate-rise ${m.mine ? 'justify-end' : 'justify-start'}`}
              style={{ animationDelay: `${m.delay}ms` }}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-snug ${
                  m.mine
                    ? 'rounded-br-md bg-white text-accent'
                    : 'rounded-bl-md bg-white/15 text-white'
                }`}
              >
                {!m.mine && (
                  <span className="mb-0.5 block text-xs font-semibold text-white/70">
                    {m.who}
                  </span>
                )}
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function Auth({ onAuthSuccess, notice, theme, onToggleTheme }) {
  const [mode, setMode] = useState('login');
  const isLogin = mode === 'login';

  return (
    <div className="grid min-h-dvh animate-fade bg-paper lg:grid-cols-[1.05fr_1fr]">
      <Hero />

      <main className="relative flex flex-col bg-surface">
        <div className="flex items-center justify-between px-6 pt-6 sm:px-10">
          <div className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight lg:invisible">
            <Logo />
            Chatten
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-sm">
            {/* Mode switch with a sliding highlight */}
            <div
              role="group"
              aria-label="Log in or create an account"
              className="relative grid grid-cols-2 rounded-xl bg-sunken p-1"
            >
              <span
                aria-hidden="true"
                className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-surface shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isLogin ? 'translate-x-0' : 'translate-x-full'
                }`}
              />
              {[
                ['login', 'Log in'],
                ['register', 'Create account'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  aria-pressed={mode === value}
                  className={`relative z-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                    mode === value ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-8">
              <h1
                key={mode}
                className="animate-fade font-display text-3xl font-bold tracking-tight text-ink"
              >
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h1>
              <p key={`${mode}-sub`} className="mt-1.5 animate-fade text-ink-2">
                {isLogin
                  ? 'Log in to pick up where you left off.'
                  : 'Pick a username and you’re in. No email needed.'}
              </p>
            </div>

            {notice && (
              <p
                role="status"
                className="mt-6 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn"
              >
                {notice}
              </p>
            )}

            {/* Both forms sit in the same grid cell and cross-fade, so the
                height stays put and each one keeps its own typing. */}
            <div className="mt-6 grid">
              <div
                inert={!isLogin}
                className={`col-start-1 row-start-1 transition-[opacity,transform,visibility] duration-300 ease-out ${
                  isLogin
                    ? 'visible translate-x-0 opacity-100'
                    : 'invisible -translate-x-4 opacity-0'
                }`}
              >
                <LoginForm onSuccess={onAuthSuccess} />
              </div>
              <div
                inert={isLogin}
                className={`col-start-1 row-start-1 transition-[opacity,transform,visibility] duration-300 ease-out ${
                  isLogin
                    ? 'invisible translate-x-4 opacity-0'
                    : 'visible translate-x-0 opacity-100'
                }`}
              >
                <RegisterForm
                  onSuccess={onAuthSuccess}
                  onNeedLogin={() => setMode('login')}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
