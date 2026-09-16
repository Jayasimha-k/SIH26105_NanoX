import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CyberOpt-RQ API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cyberopt-rq-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # CORS Whitelist Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    # DB config: SQLite default for seamless zero-setup execution, PostgreSQL compatible
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cyberopt_rq.db")
    
    # ML Models directory
    MODELS_DIR: str = os.getenv("MODELS_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models_artifacts")))

    class Config:
        case_sensitive = True

settings = Settings()

