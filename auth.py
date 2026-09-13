import os
import jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from dotenv import load_dotenv


sec_key = os.getenv("SECRET_KEY")
algo = os.getenv("ALGORITHM", "HS256")
access_token_expires = 30

pwd_context = CryptContext(schemes=["bycrypt"], deprecated="auto")