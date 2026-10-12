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
