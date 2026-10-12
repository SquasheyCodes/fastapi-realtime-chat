import { useCallback, useEffect, useState } from 'react';
import Auth from './components/Auth';
import ChatRoom from './components/ChatRoom';
import RoomPicker from './components/RoomPicker';
import {
  clearSession,
  getTokenExpiry,
  loadRoom,
  loadSession,
  saveRoom,
  saveSession,
} from './lib/session';

const MAX_TIMEOUT_MS = 2 ** 31 - 1;

export default function App() {
  // Read the saved login once, synchronously, so there is no flash of the
  // login screen for someone who is already signed in.
  const [session, setSession] = useState(loadSession);
  const [room, setRoom] = useState(loadRoom);
  const [notice, setNotice] = useState(null);

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

  const handleJoin = (name) => {
    saveRoom(name);
    setRoom(name);
  };

  const handleLeave = () => {
    saveRoom(null);
    setRoom(null);
  };

  if (!session) {
    return <Auth onAuthSuccess={handleAuthSuccess} notice={notice} />;
  }

  if (!room) {
    return (
      <RoomPicker
        username={session.username}
        onJoin={handleJoin}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <ChatRoom
      key={room}
      room={room}
      token={session.token}
      username={session.username}
      onLeave={handleLeave}
      onLogout={handleLogout}
      onExpired={handleExpired}
    />
  );
}
