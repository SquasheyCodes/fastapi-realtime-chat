import { useState } from 'react';
import { cleanRoomName } from '../lib/rooms';

const SUGGESTED = ['general', 'random', 'help'];

export default function RoomPicker({ username, onJoin, onLogout }) {
  const [value, setValue] = useState('general');
  const room = cleanRoomName(value);

  const submit = (e) => {
    e.preventDefault();
    if (room) onJoin(room);
  };

  return (
    <div className="flex h-full items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-700 bg-gray-800 p-8 shadow-lg">
        <h1 className="text-2xl font-bold tracking-wide text-white">
          Pick a room
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Signed in as <span className="text-gray-200">{username}</span>. Anyone
          who joins the same room name will see your messages.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="room"
              className="mb-1 block text-sm font-medium text-gray-400"
            >
              Room name
            </label>
            <div className="flex items-center rounded border border-gray-700 bg-gray-900 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500">
              <span className="pl-3 text-gray-500">#</span>
              <input
                id="room"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
                autoComplete="off"
                className="w-full bg-transparent p-2.5 pl-1.5 text-white focus:outline-none"
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              Letters, numbers, dashes and underscores. A new name creates a new
              room.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onJoin(name)}
                className="rounded-full border border-gray-700 px-3 py-1 text-sm text-gray-300 transition-colors hover:border-green-500 hover:text-white focus-visible:outline-2 focus-visible:outline-green-500"
              >
                #{name}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={!room}
            className="w-full rounded bg-green-600 px-4 py-2.5 font-bold text-white transition duration-200 hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
          >
            Join #{room || '…'}
          </button>
        </form>

        <button
          type="button"
          onClick={onLogout}
          className="mt-5 w-full text-center text-sm text-gray-400 hover:text-gray-200 hover:underline"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
