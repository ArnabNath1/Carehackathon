from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    
    # Groq AI
    GROQ_API_KEY: str
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Email (Mailjet)
    MAILJET_API_KEY: str = ""
    MAILJET_SECRET_KEY: str = ""
    
    # SMS (Vonage)
    VONAGE_API_KEY: str = ""
    VONAGE_API_SECRET: str = ""
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000", 
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ]
    
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )

@lru_cache()
def get_settings():
    return Settings()
