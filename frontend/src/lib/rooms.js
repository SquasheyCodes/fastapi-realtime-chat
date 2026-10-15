const RECENT_KEY = 'chatten_recent_rooms';
const DEFAULT_ROOMS = ['general', 'random', 'help'];
const MAX_RECENT = 12;

// Room ids go straight into the WebSocket URL path, so keep them URL-safe
// and predictable: lowercase, words joined with dashes.
export function cleanRoomName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 40);
}

// The server has no "list rooms" call, so the sidebar remembers the rooms
// this browser has visited.
export function loadRecentRooms() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY));
    if (Array.isArray(parsed)) {
      return parsed.filter((r) => typeof r === 'string' && r).slice(0, MAX_RECENT);
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_ROOMS;
}

export function saveRecentRooms(rooms) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(rooms));
  } catch {
    // storage unavailable: the list just won't persist
  }
}

// Move (or add) a room to the front of the list.
export function withRoom(rooms, name) {
  return [name, ...rooms.filter((r) => r !== name)].slice(0, MAX_RECENT);
}
