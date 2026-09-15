from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from pydantic import BaseModel, ValidationError
from database import ASL, get_history, get_db
from models import Message
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import models
import auth


class UserCreate(BaseModel):
    username: str
    password:str

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

@app.websocket('/ws/{room_id}')
async def websocket_endpoint(websocket:WebSocket, room_id, token:str):
    username = auth.get_current_user(token=token)
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


@app.post('/ws/register')
async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db)):

    query = select(models.User).where(models.User.username == user.username)
    result = await db.execute(query)
    fetched_user = result.scalars().first()

    if fetched_user:
        raise HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail="Username already exists! Please choose another username"
        )

    hashed_password  = auth.get_pass_hash(user.password)
    new_account = models.User(username=user.username, hashed_pass=hashed_password)
    db.add(new_account)
    await db.commit()
    return {"message": "User registered"}



@app.post('/ws/login')
async def login_user(user: UserCreate, db: AsyncSession = Depends(get_db)):

    query = select(models.User).where(models.User.username == user.username)
    result = await db.execute(query)
    fetched_user = result.scalars().first()

    if not fetched_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid credentials"

        )

    password_hashed = fetched_user.hashed_pass
    pass_verf = auth.verify_password(user.password, password_hashed )
    if not pass_verf:
        raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid credentials"
        
                )   
    acess_token = {"sub": user.username}
    token = auth.create_access_token(data=acess_token)

    return {"access_token": token, "token_type" : "bearer"}