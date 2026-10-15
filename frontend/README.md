# Chatten frontend

React 19 + Vite + Tailwind 4. Talks to the FastAPI backend in `../backend`.

## Run it

```bash
# 1. Backend (from ../backend, with SECRET_KEY and DATABASE_URL set)
uvicorn main:app --reload --port 8000

# 2. Frontend
cd frontend
npm install
npm run dev        # http://localhost:5173
```

The backend only allows CORS from `localhost:5173` and `localhost:5174`, so
open the app at `http://localhost:5173` (not `127.0.0.1`). To point at a
different backend, copy `.env.example` to `.env` and edit `VITE_API_URL`.

Fonts (Bricolage Grotesque and Geist) load from Google Fonts. Offline, the app
falls back to your system font.

## How it fits together

| File | Job |
| --- | --- |
| `src/App.jsx` | Session, current room, recent rooms. Logs out when the 30-minute token expires. |
| `src/components/Auth.jsx` | Log in / create account. Each form keeps its own state; creating an account logs you straight in. |
| `src/components/Shell.jsx` | Signed-in layout: sidebar plus the lobby or the active room. |
| `src/components/Sidebar.jsx` | Recent rooms, join-a-room box, account and theme toggle. |
| `src/components/RoomPicker.jsx` | Welcome screen before a room is chosen. |
| `src/components/ChatRoom.jsx` | Header, connection banners, people-online panel. |
| `src/components/MessageList.jsx` | Grouped messages, links, join/leave notices, new-message pill. |
| `src/components/Composer.jsx` | Enter to send, Shift+Enter for a new line. |
| `src/hooks/useChatSocket.js` | WebSocket connection, roster/presence/history, auto-reconnect. |
| `src/lib/` | Session storage, room names, light/dark theme. |
| `src/index.css` | Design tokens (colours, fonts, animations) for light and dark. |

## Theming

All colours are tokens in `src/index.css` (`--paper`, `--surface`, `--ink`,
`--accent`, ...). Change `--accent` there to re-colour the whole app. Dark mode
follows the system setting until you use the toggle, which then remembers your
choice.

## Scripts

- `npm run dev` start the dev server
- `npm run build` production build into `dist/`
- `npm run lint` ESLint
