from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Core service settings
    APP_NAME: str = "Smart Finance AI Chatbot"
    ENVIRONMENT: str = "development"
    PORT: int = 8000

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # MongoDB connection
    MONGODB_URI: str = "mongodb://127.0.0.1:27017"
    MONGODB_DB_NAME: str = "expenseDB"

    # JWT Authentication (matches existing backend)
    JWT_SECRET: str = "local-dev-secret-change-before-production"
    JWT_ALGORITHM: str = "HS256"

    # OpenAI API Configuration
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Vector store
    CHROMA_DB_PATH: str = str(BASE_DIR / "chroma_db")
    KNOWLEDGE_BASE_PATH: str = str(BASE_DIR / "knowledge_base")

settings = Settings()
