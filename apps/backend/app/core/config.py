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

    # Загрузка фото предметов: файлы лежат на диске и раздаются через /uploads
    UPLOAD_DIR: str = "uploads"
    # Максимальный размер одного файла — 10 МБ
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024
    # Максимум фото на один предмет (минимум — 1, проверяется при публикации)
    MAX_IMAGES: int = 5
    # Разрешенные форматы фото: MIME-тип -> расширение сохраняемого файла
    ALLOWED_IMAGE_TYPES: dict[str, str] = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }
    
    # Режим отладки (True пропускает валидацию Telegram initData для локального тестирования в браузере)
    DEBUG_MODE: bool = True

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

