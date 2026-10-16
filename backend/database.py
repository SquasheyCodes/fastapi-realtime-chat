from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import select
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

DATABASE_URL = normalize_database_url(DATABASE_URL)

SQL_ECHO = os.getenv("SQL_ECHO", "false").lower() in ("true", "1", "yes")

engine = create_async_engine(DATABASE_URL, echo=SQL_ECHO)

ASL = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

BASE = declarative_base()

from models import Message, User

async def get_history(room_id):
    async with ASL() as session:
        que = (
            select(User.username, Message.content)
            .join(User, Message.user_id == User.id)
            .where(Message.room_id == room_id)
            .order_by(Message.id.desc())
            .limit(50)
        )
        result = await session.execute(que)
        messages = result.all()
        return messages

async def get_db():
    async with ASL() as session:
        yield session