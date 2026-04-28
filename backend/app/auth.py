"""
SkillWeave — JWT Authentication
"""

import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel

from .database import get_db

# ----- Configuration -----
SECRET_KEY = os.getenv("JWT_SECRET", "skillweave-dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours for dev convenience

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


# ----- Pydantic Models -----
class Token(BaseModel):
    access_token: str
    token_type: str
    student_id: int
    name: str
    role: str


class TokenData(BaseModel):
    student_id: int | None = None
    role: str | None = None


# ----- Helpers -----
def verify_password(plain: str, hashed: str) -> bool:
    try:
        if isinstance(hashed, str):
            hashed = hashed.encode('utf-8')
        return bcrypt.checkpw(plain.encode('utf-8'), hashed)
    except Exception:
        return False


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    """FastAPI dependency — extracts and validates the current user from JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        student_id_str = payload.get("sub")
        role: str = payload.get("role")
        if student_id_str is None:
            raise credentials_exception
        student_id: int = int(student_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    db.execute("SELECT student_id, first_name, last_name, email, role FROM STUDENT WHERE student_id = %s", (student_id,))
    user = db.fetchone()
    if user is None:
        raise credentials_exception
    return user


def require_admin(current_user: dict = Depends(get_current_user)):
    """FastAPI dependency — requires admin role."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted",
        )
    return current_user


# ----- Endpoints -----
@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    """
    Authenticate with email (as username) and password.
    Returns a JWT access token.
    """
    db.execute("SELECT student_id, first_name, last_name, email, password_hash, role FROM STUDENT WHERE email = %s", (form_data.username,))
    user = db.fetchone()

    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user["student_id"]), "role": user["role"]})
    return Token(
        access_token=access_token,
        token_type="bearer",
        student_id=user["student_id"],
        name=f"{user['first_name']} {user['last_name']}",
        role=user["role"],
    )
