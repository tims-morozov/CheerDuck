from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.core.security import TelegramUser

class UserService:
    @staticmethod
    async def get_or_create(session: AsyncSession, tg_user: TelegramUser) -> User:
        """
        Находит пользователя по Telegram ID или создает нового при первом входе.
        Обновляет username и имя, если они изменились в Telegram.
        """
        result = await session.execute(select(User).where(User.id == tg_user.id))
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                id=tg_user.id,
                username=tg_user.username,
                first_name=tg_user.first_name,
                last_name=tg_user.last_name,
                photo_url=tg_user.photo_url,
                city="Москва",
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
        else:
            # Обновляем профиль при изменениях в TG
            updated = False
            if user.username != tg_user.username:
                user.username = tg_user.username
                updated = True
            if user.first_name != tg_user.first_name:
                user.first_name = tg_user.first_name
                updated = True
            if updated:
                await session.commit()
                await session.refresh(user)

        return user

    @staticmethod
    async def update_city(session: AsyncSession, user_id: int, city: str) -> Optional[User]:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            user.city = city
            await session.commit()
            await session.refresh(user)
        return user
