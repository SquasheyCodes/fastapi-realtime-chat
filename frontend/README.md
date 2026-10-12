# Chatten frontend

React 19 + Vite + Tailwind. Talks to the FastAPI backend in `../backend`.

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
open the app on one of those. To point at a different backend, copy
`.env.example` to `.env` and edit `VITE_API_URL`.

## How it fits together

| File | Job |
| --- | --- |
| `src/App.jsx` | Login → pick a room → chat. Logs out when the 30-minute token expires. |
| `src/components/Auth.jsx` | Login and registration against `/ws/login` and `/ws/register`. |
| `src/components/RoomPicker.jsx` | Choose the room name used in `/ws/{room}`. |
| `src/components/ChatRoom.jsx` | Header, online list, connection banners. |
| `src/components/MessageList.jsx` | Grouped messages, join/leave notices, auto-scroll. |
| `src/components/Composer.jsx` | Enter to send, Shift+Enter for a new line. |
| `src/hooks/useChatSocket.js` | WebSocket connection, roster/presence/history, auto-reconnect. |
| `src/lib/session.js` | Token, username and room kept in `localStorage`. |

## Scripts

- `npm run dev` start the dev server
- `npm run build` production build into `dist/`
- `npm run lint` ESLint
