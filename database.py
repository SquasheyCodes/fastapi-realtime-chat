from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv
from sqlalchemy import select
from models import Message


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(DATABASE_URL, echo=True)

ASL = sessionmaker(
    engine, 
    class_=AsyncSession,
    expire_on_commit=False
)

BASE = declarative_base()



async def get_history(room_id):

    async with ASL() as session:

        que = (select(Message).where(Message.room_id == room_id).order_by(Message.id.desc()).limit(50))

        result = await session.execute(que)


        messages = result.scalars().all()

        return messages
    

