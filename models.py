from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import BASE

class Message(BASE):

    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String, index=True)
    username = Column(String)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


