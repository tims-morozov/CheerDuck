import enum
from datetime import datetime
from typing import List
from sqlalchemy import BigInteger, String, Text, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class ItemStatus(str, enum.Enum):
    ACTIVE = "active"                   # Доступен для обмена в ленте
    IN_DEAL = "in_deal"                 # В процессе обмена (принято предложение)
    SWAPPED = "swapped"                 # Успешно обменян (архив)
    ON_MODERATION = "on_moderation"     # На проверке модератором
    REJECTED = "rejected"               # Отклонен модератором

class Item(Base):
    """
    Модель предмета, выставленного на своп.
    """
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str] = mapped_column(Text)
    # Категории временно убраны из продукта (UI и API их больше не используют).
    # Колонка сохранена, чтобы не ломать уже созданную схему БД: при вставке
    # подставляется значение по умолчанию, миграция не требуется.
    category: Mapped[str] = mapped_column(String(64), default="Другое")
    condition: Mapped[str] = mapped_column(String(64))  # Новое, Отличное, Хорошее
    wishlist: Mapped[str] = mapped_column(String(255))  # На что автор готов меняться
    images: Mapped[List[str]] = mapped_column(JSON, default=list)  # Ссылки на фото
    city: Mapped[str] = mapped_column(String(100), index=True)
    status: Mapped[ItemStatus] = mapped_column(SQLEnum(ItemStatus), default=ItemStatus.ACTIVE, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner: Mapped["User"] = relationship("User", back_populates="items")

