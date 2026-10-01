from typing import List, Optional
from sqlalchemy import select, desc, delete, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from app.models.item import Item, ItemStatus
from app.models.swap import SwapOffer
from app.schemas.schemas import ItemCreate, ItemUpdate

class ItemService:
    @staticmethod
    async def get_feed(
        session: AsyncSession,
        city: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Item]:
        """
        Получение ленты активных предметов для свопа с фильтром по городу.
        """
        query = select(Item).options(selectinload(Item.owner)).where(Item.status == ItemStatus.ACTIVE)

        if city and city.lower() != "все города":
            query = query.where(Item.city == city)

        query = query.order_by(desc(Item.created_at)).limit(limit).offset(offset)
        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(session: AsyncSession, item_id: int) -> Optional[Item]:
        query = select(Item).options(selectinload(Item.owner)).where(Item.id == item_id)
        result = await session.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_items(session: AsyncSession, user_id: int) -> List[Item]:
        query = (
            select(Item)
            .options(selectinload(Item.owner))
            .where(Item.user_id == user_id)
            .order_by(desc(Item.created_at))
        )
        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def create_item(session: AsyncSession, user_id: int, data: ItemCreate) -> Item:
        item = Item(
            user_id=user_id,
            title=data.title,
            description=data.description,
            condition=data.condition,
            wishlist=data.wishlist,
            images=data.images,
            city=data.city,
            status=ItemStatus.ACTIVE
        )
        session.add(item)
        await session.commit()
        # Перечитываем предмет с жадной загрузкой владельца (selectinload).
        # Без этого при сериализации ответа (ItemOut.owner) сработает ленивая
        # загрузка relationship в sync-контексте FastAPI — упадёт с
        # MissingGreenlet и вернёт HTTP 500.
        query = select(Item).options(selectinload(Item.owner)).where(Item.id == item.id)
        result = await session.execute(query)
        return result.scalar_one()

    @staticmethod
    async def update_item(session: AsyncSession, user_id: int, item_id: int, data: ItemUpdate) -> Item:
        """
        Редактирование своего лота. Менять лот может только его владелец;
        обновляются лишь поля, переданные в запросе.
        """
        result = await session.execute(select(Item).where(Item.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Предмет не найден")
        if item.user_id != user_id:
            raise HTTPException(status_code=403, detail="Можно редактировать только свои лоты")

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(item, field, value)

        await session.commit()
        # Перечитываем с жадной загрузкой владельца — иначе ItemOut.owner
        # упадёт с MissingGreenlet (см. комментарий в create_item)
        query = select(Item).options(selectinload(Item.owner)).where(Item.id == item_id)
        result = await session.execute(query)
        return result.scalar_one()

    @staticmethod
    async def delete_item(session: AsyncSession, user_id: int, item_id: int) -> None:
        """
        Удаление своего лота. Удалять лот может только его владелец.

        Вместе с лотом удаляются связанные предложения обмена: в SQLite внешние
        ключи по умолчанию не форсируются (PRAGMA foreign_keys выключен), поэтому
        ON DELETE CASCADE на swap_offers не срабатывает и оставляет «висячие»
        оферы. Чистим их вручную — так же работает и на PostgreSQL.
        """
        result = await session.execute(select(Item).where(Item.id == item_id))
        item = result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Предмет не найден")
        if item.user_id != user_id:
            raise HTTPException(status_code=403, detail="Можно удалять только свои лоты")

        await session.execute(
            delete(SwapOffer).where(
                or_(
                    SwapOffer.offered_item_id == item_id,
                    SwapOffer.target_item_id == item_id,
                )
            )
        )
        await session.delete(item)
        await session.commit()
