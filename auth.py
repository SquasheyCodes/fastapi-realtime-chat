import os
import jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from dotenv import load_dotenv
from fastapi import WebSocketDisconnect, status, HTTPException

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
        return fetched_token.username

    except jwt.InvalidTokenError:
        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid credentials"
                
                        ) 

    except jwt.InvalidSignatureError:
        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid credentials"
                
                        ) 
        