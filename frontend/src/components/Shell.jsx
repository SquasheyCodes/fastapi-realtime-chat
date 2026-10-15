import { useEffect, useState } from 'react';
import ChatRoom from './ChatRoom';
import RoomPicker from './RoomPicker';
import Sidebar from './Sidebar';

/**
 * The signed-in layout: room list on the left, the active room (or the
 * welcome screen) on the right. On phones the room list becomes a drawer.
 */
export default function Shell({
  token,
  username,
  room,
  rooms,
  theme,
  onSelectRoom,
  onRemoveRoom,
  onHome,
  onLogout,
  onExpired,
  onToggleTheme,
}) {
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!navOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  const select = (name) => {
    setNavOpen(false);
    onSelectRoom(name);
  };

  const home = () => {
    setNavOpen(false);
    onHome();
  };

  return (
    <div className="flex h-dvh animate-fade overflow-hidden bg-paper text-ink">
      <div
        aria-hidden="true"
        onClick={() => setNavOpen(false)}
        className={`fixed inset-0 z-30 bg-ink/40 transition-opacity duration-300 md:hidden ${
          navOpen ? 'opacity-100' : 'invisible opacity-0'
        }`}
      />

      <Sidebar
        open={navOpen}
        rooms={rooms}
        activeRoom={room}
        username={username}
        theme={theme}
        onSelect={select}
        onRemove={onRemoveRoom}
        onHome={home}
        onLogout={onLogout}
        onToggleTheme={onToggleTheme}
        onClose={() => setNavOpen(false)}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {room ? (
          <ChatRoom
            key={room}
            room={room}
            token={token}
            username={username}
            onOpenNav={() => setNavOpen(true)}
            onExpired={onExpired}
          />
        ) : (
          <RoomPicker
            rooms={rooms}
            username={username}
            onJoin={select}
            onOpenNav={() => setNavOpen(true)}
          />
        )}
      </main>
    </div>
  );
}
