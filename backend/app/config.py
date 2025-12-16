"""
Configuration settings for the application.
Uses environment variables with sensible defaults.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # JWT secret key - in production, use a strong random secret
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    # JWT algorithm
    ALGORITHM: str = "HS256"
    
    # Token expiration time (in minutes)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Upload directory
    UPLOAD_DIR: str = "uploads"
    
    class Config:
        env_file = ".env"  # Load from .env file if present


settings = Settings()











