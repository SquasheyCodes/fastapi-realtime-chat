from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, ValidationError
from database import ASL, get_history
from models import Message

async def save_msg(username, room_id, content):
    async with ASL() as session:
        msg = Message(username=username, room_id=room_id, content=content)
        session.add(msg)
        await session.commit()



app = FastAPI(title='Chatten')

class MessagePayLoad(BaseModel):
    content: str

class ConnectionManager:

    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id):
        await websocket.accept()

        if room_id not in self.active_connections:
            self.active_connections[room_id] = []

        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket:WebSocket, room_id):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)

            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, message:str, room_id:str):

        if room_id in self.active_connections:

            for conection in self.active_connections[room_id]:
                await conection.send_text(message)


manager = ConnectionManager()

@app.websocket('/ws/{room_id}/{username}')
async def websocket_endpoint(websocket:WebSocket, room_id, username):
    await manager.connect(websocket, room_id)
    load_msg = await get_history(room_id)
    if load_msg:
        for msg in range(len(load_msg)-1, -1, -1):
            await websocket.send_text(f"{load_msg[msg].username} : {load_msg[msg].content}")
    await manager.broadcast(f"{username} has joined the room", room_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = MessagePayLoad.model_validate_json(data)
                await save_msg(username, room_id, payload.content)
                await manager.broadcast(f"{username}: {payload.content}", room_id)
            except ValidationError:
                await websocket.send_text("Sys: Invalid message format")

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        await manager.broadcast(f"{username} left the room", room_id)

