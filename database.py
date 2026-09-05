from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Forces Python to read the hidden .env file
load_dotenv()

# Safely imports the URL into your application
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(DATABASE_URL, echo=True)

ASL = sessionmaker(
    engine, 
    class_=AsyncSession,
    expire_on_commit=False
)

BASE = declarative_base()


