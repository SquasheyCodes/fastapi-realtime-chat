import { TOKEN_KEY, USERNAME_KEY, ROOM_KEY } from '../config';

// Read the `exp` claim (seconds since epoch) from a JWT without verifying it.
// The server is the one that verifies; we only use this to know when to
// send the user back to the login screen.
export function getTokenExpiry(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(payload));
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const exp = getTokenExpiry(token);
  return exp !== null && exp <= Date.now();
}

export function loadSession() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const username = localStorage.getItem(USERNAME_KEY);
    if (!token || !username || isTokenExpired(token)) return null;
    return { token, username };
  } catch {
    return null;
  }
}

export function saveSession(token, username) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(ROOM_KEY);
}

export function loadRoom() {
  try {
    return localStorage.getItem(ROOM_KEY) || null;
  } catch {
    return null;
  }
}

export function saveRoom(room) {
  if (room) localStorage.setItem(ROOM_KEY, room);
  else localStorage.removeItem(ROOM_KEY);
}
