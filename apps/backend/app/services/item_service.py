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
    async def _find_duplicate(
        session: AsyncSession,
        user_id: int,
        title: str,
        description: str,
        condition: str,
        city: str,
        exclude_item_id: Optional[int] = None,
    ) -> Optional[Item]:
        """
        Ищет у пользователя лот с полностью совпадающим содержимым:
        название + описание + состояние + город.

        Точные поля (состояние, город) фильтруются в SQL. Название и описание
        сравниваются без учёта регистра и внешних пробелов — нормализация делается
        в Python, а не через SQL `lower()`: встроенный `lower()` в SQLite работает
        только с ASCII и не приводит регистр кириллицы, из-за чего дубли по русским
        названиям/описаниям не находились бы.

        exclude_item_id нужен при редактировании, чтобы лот не «находил» сам себя.
        Возвращает найденный предмет-дубль или None.
        """
        query = select(Item).where(
            Item.user_id == user_id,
            Item.condition == condition,
            Item.city == city,
        )
        if exclude_item_id is not None:
            query = query.where(Item.id != exclude_item_id)

        result = await session.execute(query)
        candidates = result.scalars().all()

        norm_title = title.strip().lower()
        norm_description = description.strip().lower()
        for candidate in candidates:
            if (
                candidate.title.strip().lower() == norm_title
                and candidate.description.strip().lower() == norm_description
            ):
                return candidate
        return None

    @staticmethod
    async def create_item(session: AsyncSession, user_id: int, data: ItemCreate) -> Item:
        # Запрещаем дубли в профиле: у одного пользователя не должно быть двух
        # лотов с полностью совпадающим содержимым. Сравнение — в _find_duplicate.
        duplicate = await ItemService._find_duplicate(
            session, user_id, data.title, data.description, data.condition, data.city
        )
        if duplicate:
            raise HTTPException(status_code=409, detail="У вас уже есть точно такой же предмет")

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

        changes = data.model_dump(exclude_unset=True)

        # Запрещаем дубли и при редактировании: если меняются поля, влияющие на
        # «идентичность» лота, проверяем итоговое содержимое (с учётом правок),
        # исключая сам редактируемый лот.
        if any(field in changes for field in ("title", "description", "condition", "city")):
            duplicate = await ItemService._find_duplicate(
                session,
                user_id,
                changes.get("title", item.title),
                changes.get("description", item.description),
                changes.get("condition", item.condition),
                changes.get("city", item.city),
                exclude_item_id=item_id,
            )
            if duplicate:
                raise HTTPException(status_code=409, detail="У вас уже есть точно такой же предмет")

        for field, value in changes.items():
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
