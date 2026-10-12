import { useState } from 'react';
import { API_URL } from '../config';

// FastAPI returns `detail` as a string for HTTPException (400) but as a list
// of { msg, loc } objects for validation failures (422). Turn either into
// readable lines.
function readErrors(data) {
  const detail = data?.detail;
  if (typeof detail === 'string') return [detail];
  if (Array.isArray(detail)) {
    return detail.map((item) => {
      const field = item.loc?.[item.loc.length - 1];
      const msg = String(item.msg ?? 'Invalid value').replace(
        /^Value error, /,
        '',
      );
      return field ? `${field[0].toUpperCase()}${field.slice(1)}: ${msg}` : msg;
    });
  }
  return ['Authentication failed. Please try again.'];
}

const inputClass =
  'w-full p-2.5 rounded bg-gray-900 text-white border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-colors';

export default function Auth({ onAuthSuccess, notice }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = () => {
    setIsLogin((v) => !v);
    setErrors([]);
    setSuccess('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSuccess('');
    setLoading(true);

    // Routes live under /ws/ on the FastAPI side.
    const endpoint = `${API_URL}/ws/${isLogin ? 'login' : 'register'}`;
    const name = username.trim();

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrors(readErrors(data));
        return;
      }

      if (isLogin) {
        onAuthSuccess({ token: data.access_token, username: name });
      } else {
        // Registration doesn't return a token, so send them to the login form.
        setIsLogin(true);
        setPassword('');
        setSuccess('Account created. Log in to start chatting.');
      }
    } catch {
      setErrors([
        `Can't reach the server at ${API_URL}. Check that the backend is running.`,
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-700 bg-gray-800 p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold tracking-wide text-white">
          {isLogin ? 'Chatten Login' : 'Chatten Registration'}
        </h1>

        <div aria-live="polite">
          {notice && !errors.length && !success && (
            <p className="mb-4 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
              {notice}
            </p>
          )}
          {success && (
            <p className="mb-4 rounded border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-300">
              {success}
            </p>
          )}
          {errors.length > 0 && (
            <ul
              role="alert"
              className="mb-4 space-y-1 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
            >
              {errors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-gray-400"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              minLength={3}
              maxLength={50}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-400"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              minLength={8}
              className={inputClass}
              required
            />
            {!isLogin && (
              <p className="mt-1.5 text-xs text-gray-500">
                At least 8 characters, with a number and a special character
                (for example !@#$).
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded bg-green-600 px-4 py-2.5 font-bold text-white transition duration-200 hover:bg-green-500 disabled:cursor-wait disabled:opacity-70"
          >
            {loading
              ? 'Please wait…'
              : isLogin
                ? 'Log in'
                : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={switchMode}
            className="font-medium text-green-400 transition-colors hover:text-green-300 hover:underline"
            type="button"
          >
            {isLogin ? 'Register' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
