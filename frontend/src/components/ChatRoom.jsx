import { useEffect, useState } from 'react';
import { useChatSocket } from '../hooks/useChatSocket';
import Avatar from './Avatar';
import Composer from './Composer';
import { IconMenu, IconUsers, IconX } from './icons';
import MessageList from './MessageList';

const STATUS = {
  connecting: { label: 'Connecting…', dot: 'bg-warn' },
  open: { label: 'Live', dot: 'bg-ok' },
  reconnecting: { label: 'Reconnecting…', dot: 'bg-warn' },
  failed: { label: 'Offline', dot: 'bg-danger' },
  expired: { label: 'Session expired', dot: 'bg-danger' },
};

const wideScreen = () => window.matchMedia('(min-width: 1280px)').matches;

function Banner({ tone, children }) {
  const tones = {
    warn: 'bg-warn-soft text-warn',
    danger: 'bg-danger-soft text-danger',
  };
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`mx-4 mt-3 flex animate-pop items-center justify-center gap-3 rounded-xl px-4 py-2.5 text-sm sm:mx-6 ${tones[tone]}`}
    >
      {children}
    </div>
  );
}

export default function ChatRoom({ room, token, username, onOpenNav, onExpired }) {
  const { status, messages, online, notice, dismissNotice, send, retry } =
    useChatSocket({ room, token, username });
  const [membersOpen, setMembersOpen] = useState(wideScreen);

  useEffect(() => {
    if (status === 'expired') onExpired();
  }, [status, onExpired]);

  useEffect(() => {
    if (!membersOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !wideScreen()) setMembersOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [membersOpen]);

  // You first, then everyone else alphabetically.
  const people = [...online].sort((a, b) => {
    if (a === username) return -1;
    if (b === username) return 1;
    return a.localeCompare(b);
  });
  const stack = people.slice(0, 3);
  const extra = people.length - stack.length;
  const state = STATUS[status];

  return (
    <div className="flex min-h-0 flex-1 animate-fade">
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6">
          <button
            type="button"
            onClick={onOpenNav}
            aria-label="Open rooms"
            className="-ml-1 flex h-10 w-10 items-center justify-center rounded-xl text-ink-2 hover:bg-sunken md:hidden"
          >
            <IconMenu />
          </button>

          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold leading-tight tracking-tight">
              <span className="mr-0.5 text-ink-3">#</span>
              {room}
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-ink-2">
              <span
                className={`h-2 w-2 rounded-full ${state.dot} ${
                  status === 'open' ? '' : 'animate-pulse'
                }`}
                aria-hidden="true"
              />
              {state.label}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMembersOpen((v) => !v)}
            aria-expanded={membersOpen}
            aria-label={`People online: ${people.length}`}
            className={`ml-auto flex h-10 items-center gap-2 rounded-xl pl-2 pr-3 text-sm font-medium transition-colors ${
              membersOpen
                ? 'bg-accent-soft text-accent-ink'
                : 'text-ink-2 hover:bg-sunken hover:text-ink'
            }`}
          >
            <span className="flex -space-x-2">
              {stack.map((name) => (
                <Avatar
                  key={name}
                  name={name}
                  size="xs"
                  className="ring-2 ring-surface"
                />
              ))}
              {stack.length === 0 && <IconUsers size={18} className="ml-1.5" />}
            </span>
            {extra > 0 ? `+${extra}` : people.length}
          </button>
        </header>

        {status === 'reconnecting' && (
          <Banner tone="warn">Connection lost. Trying to reconnect…</Banner>
        )}
        {status === 'failed' && (
          <Banner tone="danger">
            Can’t reach the server. Check that the backend is running.
            <button
              type="button"
              onClick={retry}
              className="rounded-lg bg-danger px-3 py-1 font-semibold text-surface transition-opacity hover:opacity-90"
            >
              Try again
            </button>
          </Banner>
        )}
        {notice && (
          <Banner tone="danger">
            {notice}
            <button type="button" onClick={dismissNotice} className="font-semibold underline">
              Dismiss
            </button>
          </Banner>
        )}

        <MessageList messages={messages} username={username} room={room} />
        <Composer onSend={send} disabled={status !== 'open'} room={room} />
      </section>

      {/* People list: a drawer on small screens, a column on wide ones */}
      <div
        aria-hidden="true"
        onClick={() => setMembersOpen(false)}
        className={`fixed inset-0 z-30 bg-ink/40 transition-opacity duration-300 xl:hidden ${
          membersOpen ? 'opacity-100' : 'invisible opacity-0'
        }`}
      />
      <aside
        aria-label="People online"
        className={`shrink-0 overflow-hidden border-l border-line bg-surface transition-[width,transform,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] max-xl:fixed max-xl:inset-y-0 max-xl:right-0 max-xl:z-40 max-xl:w-72 ${
          membersOpen
            ? 'visible max-xl:translate-x-0 xl:w-64'
            : 'invisible max-xl:translate-x-full xl:w-0 xl:border-l-0'
        }`}
      >
        <div className="flex h-full w-72 flex-col xl:w-64">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
            <div>
              <h2 className="font-display text-base font-bold">People online</h2>
              <p className="text-xs text-ink-2">
                {status === 'open'
                  ? `${people.length} in #${room}`
                  : 'Not connected'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMembersOpen(false)}
              aria-label="Close people list"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 hover:bg-sunken xl:hidden"
            >
              <IconX />
            </button>
          </div>

          <ul className="flex-1 space-y-0.5 overflow-y-auto p-2">
            {people.map((person) => (
              <li
                key={person}
                className="flex animate-fade items-center gap-3 rounded-xl px-2.5 py-2"
              >
                <span className="relative">
                  <Avatar name={person} />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-ok ring-2 ring-surface"
                    title="Online"
                  />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {person}
                </span>
                {person === username && (
                  <span className="rounded-full bg-sunken px-2 py-0.5 text-xs text-ink-2">
                    You
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
