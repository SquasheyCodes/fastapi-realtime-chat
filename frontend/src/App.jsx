import { useCallback, useEffect, useState } from 'react';
import Auth from './components/Auth';
import Shell from './components/Shell';
import {
  clearSession,
  getTokenExpiry,
  loadRoom,
  loadSession,
  saveRoom,
  saveSession,
} from './lib/session';
import {
  cleanRoomName,
  loadRecentRooms,
  saveRecentRooms,
  withRoom,
} from './lib/rooms';
import { useTheme } from './lib/theme';

const MAX_TIMEOUT_MS = 2 ** 31 - 1;

export default function App() {
  // Read the saved login once, synchronously, so there is no flash of the
  // login screen for someone who is already signed in.
  const [session, setSession] = useState(loadSession);
  const [room, setRoom] = useState(loadRoom);
  const [rooms, setRooms] = useState(loadRecentRooms);
  const [notice, setNotice] = useState(null);
  const { theme, toggle: toggleTheme } = useTheme();

  const handleLogout = useCallback(() => {
    clearSession();
    setSession(null);
    setRoom(null);
  }, []);

  const handleExpired = useCallback(() => {
    handleLogout();
    setNotice('Your session expired. Log in again to keep chatting.');
  }, [handleLogout]);

  // Tokens last 30 minutes. Send the user back to login when theirs runs out
  // instead of letting the socket fail with no explanation.
  const token = session?.token;
  useEffect(() => {
    if (!token) return undefined;
    const exp = getTokenExpiry(token);
    if (exp === null) return undefined;
    const delay = Math.max(exp - Date.now(), 0);
    // setTimeout fires immediately if the delay doesn't fit in 32 bits (~24.8
    // days). Tokens here last 30 minutes, so this only guards odd tokens.
    if (delay > MAX_TIMEOUT_MS) return undefined;
    const timer = setTimeout(handleExpired, delay);
    return () => clearTimeout(timer);
  }, [token, handleExpired]);

  const handleAuthSuccess = ({ token: newToken, username }) => {
    saveSession(newToken, username);
    setSession({ token: newToken, username });
    setNotice(null);
  };

  const handleSelectRoom = (value) => {
    const name = cleanRoomName(value);
    if (!name) return;
    const next = withRoom(rooms, name);
    saveRecentRooms(next);
    setRooms(next);
    saveRoom(name);
    setRoom(name);
  };

  const handleRemoveRoom = (name) => {
    const next = rooms.filter((r) => r !== name);
    saveRecentRooms(next);
    setRooms(next);
  };

  const handleHome = () => {
    saveRoom(null);
    setRoom(null);
  };

  if (!session) {
    return (
      <Auth
        onAuthSuccess={handleAuthSuccess}
        notice={notice}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <Shell
      token={session.token}
      username={session.username}
      room={room}
      rooms={rooms}
      theme={theme}
      onSelectRoom={handleSelectRoom}
      onRemoveRoom={handleRemoveRoom}
      onHome={handleHome}
      onLogout={handleLogout}
      onExpired={handleExpired}
      onToggleTheme={toggleTheme}
    />
  );
}
