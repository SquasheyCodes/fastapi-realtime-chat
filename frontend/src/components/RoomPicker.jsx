import { useState } from 'react';
import { cleanRoomName } from '../lib/rooms';
import { IconMenu, IconPlus } from './icons';

const IDEAS = ['general', 'random', 'help', 'show-and-tell'];

// The screen after login, before a room is chosen.
export default function RoomPicker({ rooms, username, onJoin, onOpenNav }) {
  const [draft, setDraft] = useState('');
  const cleaned = cleanRoomName(draft);

  const submit = (e) => {
    e.preventDefault();
    if (cleaned) onJoin(cleaned);
  };

  // Suggestions that aren't already in the sidebar come first.
  const ideas = [
    ...IDEAS.filter((name) => !rooms.includes(name)),
    ...IDEAS.filter((name) => rooms.includes(name)),
  ].slice(0, 4);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-14 items-center px-4 md:hidden">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Open rooms"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-2 hover:bg-sunken"
        >
          <IconMenu />
        </button>
      </header>

      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 pb-16">
        <div className="w-full max-w-md animate-rise">
          <h1 className="font-display text-4xl font-bold tracking-tight">
            Hi {username}, where to?
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-2">
            Type a room name to join it. If nobody has used the name yet, you’ll
            start a new room.
          </p>

          <form onSubmit={submit} className="mt-8">
            <label htmlFor="room" className="sr-only">
              Room name
            </label>
            <div className="flex items-center rounded-2xl border border-line bg-surface shadow-sm transition-colors focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
              <span className="pl-4 text-lg text-ink-3">#</span>
              <input
                id="room"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="room-name"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                className="h-14 min-w-0 flex-1 bg-transparent px-2 text-lg text-ink placeholder:text-ink-3 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!cleaned}
                className="mr-2 flex h-10 items-center gap-1.5 rounded-xl bg-accent px-4 font-semibold text-white transition-[opacity,background-color] hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-30"
              >
                <IconPlus size={16} />
                Join
              </button>
            </div>
            <p className="mt-2 text-sm text-ink-3">
              Letters, numbers, dashes and underscores.
            </p>
          </form>

          <div className="mt-8">
            <h2 className="text-sm font-medium text-ink-3">Try one of these</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {ideas.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onJoin(name)}
                  className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-accent hover:text-accent-ink"
                >
                  #{name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
