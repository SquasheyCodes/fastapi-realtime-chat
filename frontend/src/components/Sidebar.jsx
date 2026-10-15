import { useState } from 'react';
import { cleanRoomName } from '../lib/rooms';
import Avatar from './Avatar';
import { IconLogout, IconMoon, IconPlus, IconSun, IconX, Logo } from './icons';

export default function Sidebar({
  open,
  rooms,
  activeRoom,
  username,
  theme,
  onSelect,
  onRemove,
  onHome,
  onLogout,
  onToggleTheme,
  onClose,
}) {
  const [draft, setDraft] = useState('');
  const cleaned = cleanRoomName(draft);

  const join = (e) => {
    e.preventDefault();
    if (!cleaned) return;
    onSelect(cleaned);
    setDraft('');
  };

  return (
    <aside
      aria-label="Rooms"
      className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-line bg-surface transition-[transform,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:static md:z-auto md:w-64 md:translate-x-0 md:visible ${
        open ? 'translate-x-0' : 'invisible -translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2.5 rounded-lg font-display text-lg font-bold tracking-tight text-ink"
        >
          <Logo />
          Chatten
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 hover:bg-sunken md:hidden"
        >
          <IconX />
        </button>
      </div>

      <nav aria-label="Your rooms" className="min-h-0 flex-1 overflow-y-auto px-3">
        <h2 className="px-2 pb-1.5 pt-2 text-sm font-medium text-ink-3">Rooms</h2>
        <ul className="space-y-0.5">
          {rooms.map((name) => {
            const active = name === activeRoom;
            return (
              <li key={name} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(name)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-10 w-full items-center gap-2 rounded-xl pl-3 pr-9 text-left text-[15px] transition-colors ${
                    active
                      ? 'bg-accent-soft font-semibold text-accent-ink'
                      : 'text-ink-2 hover:bg-sunken hover:text-ink'
                  }`}
                >
                  <span className={active ? 'text-accent-ink' : 'text-ink-3'}>#</span>
                  <span className="truncate">{name}</span>
                </button>
                {!active && (
                  <button
                    type="button"
                    onClick={() => onRemove(name)}
                    aria-label={`Remove #${name} from the list`}
                    className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3 opacity-0 transition-opacity hover:bg-line hover:text-ink focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100"
                  >
                    <IconX size={14} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {rooms.length === 0 && (
          <p className="px-2 py-3 text-sm text-ink-3">
            No rooms yet. Type a name below to start one.
          </p>
        )}
      </nav>

      <form onSubmit={join} className="px-3 pb-3 pt-2">
        <label htmlFor="join-room" className="sr-only">
          Join or create a room
        </label>
        <div className="flex items-center rounded-xl border border-line bg-paper transition-colors focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
          <span className="pl-3 text-ink-3">#</span>
          <input
            id="join-room"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Join or create a room"
            autoComplete="off"
            spellCheck={false}
            className="h-10 min-w-0 flex-1 bg-transparent px-2 text-sm text-ink placeholder:text-ink-3 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!cleaned}
            aria-label={cleaned ? `Join #${cleaned}` : 'Join room'}
            className="mr-1 flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white transition-[opacity,background-color] hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-30"
          >
            <IconPlus size={16} />
          </button>
        </div>
      </form>

      <div className="flex items-center gap-2.5 border-t border-line p-3">
        <Avatar name={username} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{username}</p>
          <p className="text-xs text-ink-3">Signed in</p>
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
        >
          {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
        </button>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Log out"
          title="Log out"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <IconLogout size={18} />
        </button>
      </div>
    </aside>
  );
}
