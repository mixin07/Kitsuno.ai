from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Learning Platform API"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/ai_learning_platform"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"

    # JWT Configuration
    jwt_secret_key: str = "change-this-in-development"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # AI Question Generation (backend-only credentials)
    ai_provider: str = "mock"
    ai_api_key: str = ""
    ai_model: str = "gpt-4o-mini"
    ai_max_questions: int = 20
    model_config = SettingsConfigDict(
        env_file=(
            str(Path(__file__).resolve().parent.parent / ".env"),
            ".env",
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        dev_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
        ]
        for dev in dev_origins:
            if dev not in origins:
                origins.append(dev)
        return origins


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()