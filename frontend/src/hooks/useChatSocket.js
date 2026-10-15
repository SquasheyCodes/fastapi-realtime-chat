import { useCallback, useEffect, useRef, useState } from 'react';
import { WS_URL } from '../config';
import { isTokenExpired } from '../lib/session';

const MAX_ATTEMPTS = 6;

function backoff(attempt) {
  // 1s, 2s, 4s, 8s ... capped at 15s
  return Math.min(1000 * 2 ** attempt, 15000);
}

/**
 * Connects to /ws/{room}?token=... and keeps the chat state in sync.
 *
 * Server events handled:
 *   roster   { active_users: string[] }        sent once, on join
 *   presence { user, status: online|offline }  broadcast to the room
 *   chat     { user, content }                 history first, then live
 *   error    { content }                       bad payload
 *
 * status: 'connecting' | 'open' | 'reconnecting' | 'failed' | 'expired'
 *
 * The server replays recent history on every connect, so the message list is
 * cleared each time a socket opens to avoid duplicates after a reconnect.
 * Mount this with `key={room}` so switching rooms starts from a clean state.
 */
export function useChatSocket({ room, token, username }) {
  const [status, setStatus] = useState('connecting');
  const [messages, setMessages] = useState([]);
  const [online, setOnline] = useState([]);
  const [notice, setNotice] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const socketRef = useRef(null);
  const nextId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let attempt = 0;
    let retryTimer = null;

    const push = (entry) => {
      setMessages((prev) => [...prev, { id: nextId.current++, ...entry }]);
    };

    const connect = () => {
      const url = `${WS_URL}/ws/${encodeURIComponent(room)}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      socketRef.current = ws;
      let opened = false;

      ws.onopen = () => {
        if (cancelled) return;
        opened = true;
        attempt = 0;
        setMessages([]);
        setNotice(null);
        setStatus('open');
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        let data;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data.type === 'roster') {
          setOnline([...new Set(data.active_users)]);
        } else if (data.type === 'presence') {
          const isOnline = data.status === 'online';
          setOnline((prev) => {
            const without = prev.filter((u) => u !== data.user);
            return isOnline ? [...without, data.user] : without;
          });
          if (data.user !== username) {
            push({ kind: 'presence', user: data.user, status: data.status });
          }
        } else if (data.type === 'chat') {
          push({ kind: 'chat', user: data.user, content: data.content });
        } else if (data.type === 'error') {
          setNotice(data.content || 'Something went wrong.');
        }
      };

      // Browsers fire `error` and then `close` when a connection drops or is
      // refused, but not every WebSocket implementation fires both, so either
      // one counts. `dropped` makes sure we only react once per socket.
      let dropped = false;
      const handleDrop = () => {
        if (cancelled || dropped) return;
        dropped = true;
        socketRef.current = null;
        try {
          ws.close();
        } catch {
          // already closed
        }

        // The server rejects a bad or expired token before the handshake
        // completes, so the socket closes without ever opening.
        if (!opened && isTokenExpired(token)) {
          setStatus('expired');
          return;
        }

        if (attempt >= MAX_ATTEMPTS) {
          setStatus('failed');
          return;
        }

        setStatus('reconnecting');
        retryTimer = setTimeout(connect, backoff(attempt));
        attempt += 1;
      };

      ws.onerror = handleDrop;
      ws.onclose = handleDrop;
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [room, token, username, retryCount]);

  const send = useCallback((content) => {
    const ws = socketRef.current;
    const text = content.trim();
    if (!text || !ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify({ content: text }));
    return true;
  }, []);

  // Manual retry after the automatic attempts are exhausted.
  const retry = useCallback(() => {
    setStatus('connecting');
    setRetryCount((n) => n + 1);
  }, []);

  const dismissNotice = useCallback(() => setNotice(null), []);

  return { status, messages, online, notice, dismissNotice, send, retry };
}
