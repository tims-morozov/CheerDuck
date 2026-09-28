import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class SwapStatus(str, enum.Enum):
    PENDING = "pending"       # Ожидает ответа владельца
    ACCEPTED = "accepted"     # Принято (открываются контакты Telegram!)
    REJECTED = "rejected"     # Отклонено владельцем
    CANCELLED = "cancelled"   # Отозвано инициатором
    COMPLETED = "completed"   # Обмен успешно состоялся

class SwapOffer(Base):
    """
    Модель предложения обмена (сделки).
    """
    __tablename__ = "swap_offers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, index=True)
    sender_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), index=True)
    recipient_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), index=True)
    offered_item_id: Mapped[int] = mapped_column(ForeignKey("items.id", ondelete="CASCADE"), index=True)
    target_item_id: Mapped[int] = mapped_column(ForeignKey("items.id", ondelete="CASCADE"), index=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[SwapStatus] = mapped_column(SQLEnum(SwapStatus), default=SwapStatus.PENDING, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Связи
    offered_item = relationship("Item", foreign_keys=[offered_item_id])
    target_item = relationship("Item", foreign_keys=[target_item_id])
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
