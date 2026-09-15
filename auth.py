import os
import jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from dotenv import load_dotenv
from fastapi import WebSocketException, status, HTTPException

load_dotenv()

sec_key = os.getenv("SECRET_KEY")
algo = os.getenv("ALGORITHM", "HS256")
access_token_expires = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):

    return pwd_context.verify(plain_password, hashed_password)

def get_pass_hash(password):
    return pwd_context.hash(password)

def create_access_token(data:dict):
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(minutes=access_token_expires)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, sec_key, algorithm=algo)

    return encoded_jwt



def get_current_user(token:str):

    try:
        fetched_token = jwt.decode(token, sec_key, algorithms=[algo])
        user = fetched_token.get("sub")
        if not user:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
        return user

    except jwt.ExpiredSignatureError:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION
        ) 

    except jwt.InvalidTokenError:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION
        )