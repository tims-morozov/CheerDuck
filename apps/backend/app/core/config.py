from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CheerDuck"
    API_V1_PREFIX: str = "/api/v1"
    
    # Telegram Bot Token (получается в @BotFather)
    BOT_TOKEN: str = "YOUR_BOT_TOKEN_HERE"
    
    # База данных: по умолчанию SQLite в асинхронном режиме (не требует установки отдельных серверов)
    # Позже легко меняется на PostgreSQL (postgresql+asyncpg://...)
    DATABASE_URL: str = "sqlite+aiosqlite:///./cheerduck.db"
    
    # Разрешенные источники для CORS (фронтенд)
    CORS_ORIGINS: list[str] = ["*"]
    
    # Режим отладки (True пропускает валидацию Telegram initData для локального тестирования в браузере)
    DEBUG_MODE: bool = True

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

