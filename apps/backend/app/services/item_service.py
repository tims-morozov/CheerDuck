from typing import List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.item import Item, ItemStatus
from app.schemas.schemas import ItemCreate

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
        query = select(Item).where(Item.user_id == user_id).order_by(desc(Item.created_at))
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
        await session.refresh(item)
        return item
