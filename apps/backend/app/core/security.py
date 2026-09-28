import hashlib
import hmac
import json
import urllib.parse
from typing import Optional
from pydantic import BaseModel
from fastapi import HTTPException, Header, Depends
from app.core.config import settings

class TelegramUser(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    language_code: Optional[str] = None
    photo_url: Optional[str] = None

def validate_init_data(init_data: str, bot_token: str) -> Optional[TelegramUser]:
    """
    Криптографическая проверка подписи Telegram initData по стандарту Telegram Mini Apps.
    Защищает от подделки запросов злоумышленниками.
    """
    try:
        parsed_data = dict(urllib.parse.parse_qsl(init_data, keep_blank_values=True))
        if "hash" not in parsed_data:
            return None
        
        received_hash = parsed_data.pop("hash")
        # Сортируем параметры по алфавиту в формате key=value
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed_data.items()))
        
        # Секретный ключ создается из bot_token и константы "WebAppData"
        secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        if calculated_hash != received_hash:
            return None
            
        user_dict = json.loads(parsed_data.get("user", "{}"))
        return TelegramUser(**user_dict)
    except Exception:
        return None

async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> TelegramUser:
    """
    Зависимость для эндпоинтов: извлекает и проверяет Telegram пользователя из заголовка.
    В режиме отладки (DEBUG_MODE=True) возвращает тестового пользователя, если заголовок отсутствует.
    """
    if authorization and authorization.startswith("tma "):
        init_data = authorization[4:]
        user = validate_init_data(init_data, settings.BOT_TOKEN)
        if user:
            return user

    # Если включен режим отладки — даем возможность тестировать в обычном браузере
    if settings.DEBUG_MODE:
        return TelegramUser(
            id=99999999,
            first_name="Тестовый",
            last_name="Утёнок",
            username="test_duck",
        )

    raise HTTPException(
        status_code=401,
        detail="Не авторизован: неверные или отсутствующие данные Telegram initData"
    )
