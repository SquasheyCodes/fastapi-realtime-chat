// Backend location. Override with a .env file (see .env.example).
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ws:// for http://, wss:// for https://
export const WS_URL =
  import.meta.env.VITE_WS_URL ?? API_URL.replace(/^http/, 'ws');

export const TOKEN_KEY = 'chatten_token';
export const USERNAME_KEY = 'chatten_username';
export const ROOM_KEY = 'chatten_room';
