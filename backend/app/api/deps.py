from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.db_models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token", auto_error=False)

def get_current_user_optional(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    if not token:
        # Return fallback guest user for seamless demo / prototype exploration
        return User(id=1, username="demo_user", role="CISO", email="ciso@cyberopt.internal")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return User(id=1, username="demo_user", role="CISO", email="ciso@cyberopt.internal")
    except JWTError:
        return User(id=1, username="demo_user", role="CISO", email="ciso@cyberopt.internal")

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        return User(id=1, username="demo_user", role="CISO", email="ciso@cyberopt.internal")
    return user
