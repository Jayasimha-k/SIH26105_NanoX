from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import jwt
from app.database import get_db
from app.config import settings
from app.models.db_models import User
from app.schemas.schemas import Token, UserLogin, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/token", response_model=Token)
@router.post("/login", response_model=Token)
def login(form_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user:
        # Default fallback authentication for prototype demo roles: CISO, SOC, IT
        role = "CISO"
        if "soc" in form_data.username.lower():
            role = "SOC"
        elif "it" in form_data.username.lower():
            role = "IT"

        token = jwt.encode(
            {"sub": form_data.username, "role": role},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        return {"access_token": token, "token_type": "bearer", "role": role, "username": form_data.username}

    token = jwt.encode(
        {"sub": user.username, "role": user.role},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return {"access_token": token, "token_type": "bearer", "role": user.role, "username": user.username}

@router.get("/me")
def read_me():
    return {"status": "authenticated", "available_roles": ["CISO", "SOC", "IT"]}
