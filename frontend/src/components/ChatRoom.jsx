import { useEffect, useState } from 'react';
import { useChatSocket } from '../hooks/useChatSocket';
import Avatar from './Avatar';
import Composer from './Composer';
import MessageList from './MessageList';

const STATUS_LABEL = {
  connecting: 'Connecting…',
  open: 'Connected',
  reconnecting: 'Reconnecting…',
  failed: 'Disconnected',
  expired: 'Session expired',
};

const STATUS_DOT = {
  open: 'bg-green-500',
  connecting: 'bg-amber-400',
  reconnecting: 'bg-amber-400',
  failed: 'bg-red-500',
  expired: 'bg-red-500',
};

export default function ChatRoom({
  room,
  token,
  username,
  onLeave,
  onLogout,
  onExpired,
}) {
  const { status, messages, online, notice, dismissNotice, send, retry } =
    useChatSocket({ room, token, username });
  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    if (status === 'expired') onExpired();
  }, [status, onExpired]);

  // Put yourself first, then everyone else alphabetically.
  const people = [...online].sort((a, b) => {
    if (a === username) return -1;
    if (b === username) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex h-full bg-gray-900 text-gray-100">
      {showOnline && (
        <div
          className="fixed inset-0 z-10 bg-black/50 md:hidden"
          onClick={() => setShowOnline(false)}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="People online"
        className={`${
          showOnline ? 'flex' : 'hidden'
        } fixed inset-y-0 left-0 z-20 w-64 flex-col border-r border-gray-700 bg-gray-800 md:static md:z-auto md:flex md:shrink-0`}
      >
        <div className="border-b border-gray-700 px-4 py-4">
          <h2 className="font-semibold text-gray-100">Online now</h2>
          <p className="text-sm text-gray-400">
            {status === 'open'
              ? `${people.length} in #${room}`
              : 'Not connected'}
          </p>
        </div>
        <ul className="flex-1 space-y-1 overflow-y-auto p-2">
          {people.map((person) => (
            <li
              key={person}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5"
            >
              <Avatar name={person} size="sm" />
              <span className="truncate text-sm text-gray-200">{person}</span>
              {person === username && (
                <span className="text-xs text-gray-500">you</span>
              )}
              <span
                className="ml-auto h-2 w-2 shrink-0 rounded-full bg-green-500"
                title="Online"
              />
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-gray-700 bg-gray-800/60 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setShowOnline(true)}
            className="rounded-lg border border-gray-700 px-2.5 py-1.5 text-sm text-gray-300 hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-green-500 md:hidden"
          >
            Online ({people.length})
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold leading-tight">
              #{room}
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-gray-400">
              <span
                className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`}
                aria-hidden="true"
              />
              {STATUS_LABEL[status]}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-gray-400 sm:inline">
              {username}
            </span>
            <button
              type="button"
              onClick={onLeave}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-green-500"
            >
              Change room
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
            >
              Log out
            </button>
          </div>
        </header>

        {status === 'reconnecting' && (
          <div
            role="status"
            className="bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-300"
          >
            Connection lost. Trying to reconnect…
          </div>
        )}
        {status === 'failed' && (
          <div
            role="alert"
            className="flex items-center justify-center gap-3 bg-red-500/15 px-4 py-2 text-sm text-red-300"
          >
            Can&apos;t reach the server. Check that the backend is running.
            <button
              type="button"
              onClick={retry}
              className="rounded-md bg-red-600 px-3 py-1 font-medium text-white hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-red-400"
            >
              Try again
            </button>
          </div>
        )}
        {notice && (
          <div
            role="alert"
            className="flex items-center justify-center gap-3 bg-red-500/15 px-4 py-2 text-sm text-red-300"
          >
            {notice}
            <button
              type="button"
              onClick={dismissNotice}
              className="underline hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        )}

        <MessageList messages={messages} username={username} room={room} />
        <Composer
          onSend={send}
          disabled={status !== 'open'}
          room={room}
        />
      </section>
    </div>
  );
}
