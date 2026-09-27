from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from pydantic import BaseModel, ValidationError, Field, field_validator
from database import ASL, get_history, get_db
from models import Message
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import models
import auth
import re
from fastapi.middleware.cors import CORSMiddleware


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError('Password must contain at least one special character')
        return v

async def save_msg(user_id, room_id, content):
    async with ASL() as session:
        msg = Message(user_id=user_id, room_id=room_id, content=content)
        session.add(msg)
        await session.commit()



app = FastAPI(title='Chatten')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MessagePayLoad(BaseModel):
    content: str

class ConnectionManager:

    def __init__(self):
        self.active_connections: dict[str, dict[WebSocket, str]] = {}

    async def connect(self, websocket: WebSocket, room_id, username):
        await websocket.accept()

        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}

        self.active_connections[room_id][websocket] = username

    def disconnect(self, websocket:WebSocket, room_id):

        if room_id in self.active_connections:
            user = self.active_connections[room_id][websocket]
            del self.active_connections[room_id][websocket]

            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

            return user
    
    async def broadcast(self, message:dict, room_id:str):
        if room_id in self.active_connections:
            for connection in list(self.active_connections[room_id]):
                try:
                    await connection.send_json(message)
                except Exception:
                    del self.active_connections[room_id][connection]


manager = ConnectionManager()

@app.websocket('/ws/{room_id}')
async def websocket_endpoint(websocket:WebSocket, room_id, token:str):
    user = auth.get_current_user(token=token)
    username = user["username"]
    user_id = user["user_id"]
    await manager.connect(websocket, room_id, username=username)
    active_users = list(manager.active_connections[room_id].values())
    await websocket.send_json({
        "type": "roster",
        "active_users": active_users
    })

    await manager.broadcast({
        "type": "presence",
        "user": username,
        "status": "online"
    }, room_id)

    load_msg = await get_history(room_id)
    if load_msg:
        for msg in range(len(load_msg)-1, -1, -1):
            await websocket.send_json({
                "type": "chat",
                "user": load_msg[msg].username,
                "content": load_msg[msg].content
            })
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = MessagePayLoad.model_validate_json(data)
                await save_msg(user_id, room_id, payload.content)
                await manager.broadcast({
                "type": "chat",
                "user": username,
                "content": payload.content
        }, room_id)
            except ValidationError:
                await websocket.send_json({"type": "error", "content": "Invalid message format"})

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        await manager.broadcast({
            "type": "presence",
            "user": username,
            "status": "offline"
        }, room_id)

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
    acess_token = {"sub": fetched_user.username, "user_id" : fetched_user.id}
    token = auth.create_access_token(data=acess_token)

    return {"access_token": token, "token_type" : "bearer"}