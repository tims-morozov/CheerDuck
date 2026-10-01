from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.item import ItemStatus
from app.models.swap import SwapStatus

# Пользователь
class UserBase(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    city: Optional[str] = "Москва"

class UserOut(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserUpdateCity(BaseModel):
    city: str

# Предмет (Item)
class ItemCreate(BaseModel):
    title: str
    description: str
    condition: str
    # Поле «спящее»: в форме публикации его больше нет, но контракт и колонка Item.wishlist
    # (NOT NULL) сохранены — по умолчанию сохраняем пустую строку
    wishlist: str = ""
    images: List[str] = []
    city: str

class ItemUpdate(BaseModel):
    """Частичное обновление своего лота: приходят только переданные поля."""
    title: Optional[str] = None
    description: Optional[str] = None
    condition: Optional[str] = None
    images: Optional[List[str]] = None
    city: Optional[str] = None

class ItemOut(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    condition: str
    wishlist: str
    images: List[str]
    city: str
    status: ItemStatus
    created_at: datetime
    owner: Optional[UserOut] = None
    model_config = ConfigDict(from_attributes=True)

# Предложение обмена (Swap Offer)
class SwapCreate(BaseModel):
    offered_item_id: int
    target_item_id: int
    comment: Optional[str] = None

class SwapOut(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    offered_item_id: int
    target_item_id: int
    comment: Optional[str]
    status: SwapStatus
    created_at: datetime
    offered_item: Optional[ItemOut] = None
    target_item: Optional[ItemOut] = None
    sender: Optional[UserOut] = None
    recipient: Optional[UserOut] = None
    # Контакт в Telegram показывается ТОЛЬКО если статус accepted
    contact_username: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# Загрузка файлов (фото предметов)
class UploadOut(BaseModel):
    urls: List[str]
