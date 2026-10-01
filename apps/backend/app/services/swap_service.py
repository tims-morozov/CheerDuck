from typing import List
from sqlalchemy import select, desc, update, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from app.models.swap import SwapOffer, SwapStatus
from app.models.item import Item, ItemStatus
from app.schemas.schemas import SwapCreate

class SwapService:
    @staticmethod
    async def create_offer(session: AsyncSession, sender_id: int, data: SwapCreate) -> SwapOffer:
        """
        Создать предложение обмена между двумя вещами.
        """
        # Проверяем свой предмет
        offered_res = await session.execute(select(Item).where(Item.id == data.offered_item_id))
        offered = offered_res.scalar_one_or_none()
        if not offered or offered.user_id != sender_id:
            raise HTTPException(status_code=400, detail="Предлагаемый предмет не принадлежит вам")
        # Предлагать можно только активные вещи: после принятого свопа лот уходит
        # в архив (ItemStatus.SWAPPED) и участвовать в новых обменах уже не должен.
        if offered.status != ItemStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="Этот предмет больше не участвует в обмене")

        # Проверяем целевой предмет
        target_res = await session.execute(select(Item).where(Item.id == data.target_item_id))
        target = target_res.scalar_one_or_none()
        if not target:
            raise HTTPException(status_code=404, detail="Целевой предмет не найден")
        if target.user_id == sender_id:
            raise HTTPException(status_code=400, detail="Нельзя меняться с самим собой")
        # Целевой лот тоже должен быть активным (лента отдаёт только active,
        # но оффер можно создать и прямым запросом к API).
        if target.status != ItemStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="Этот предмет больше недоступен для обмена")

        # Запрет повторных предложений: по одному целевому предмету пользователь
        # может предложить обмен только один раз — независимо от того, чем
        # закончился прежний оффер (ожидает ответа, отклонён или принят).
        # Предложить обмен заново по тому же предмету нельзя.
        already_offered_res = await session.execute(
            select(SwapOffer.id)
            .where(
                SwapOffer.sender_id == sender_id,
                SwapOffer.target_item_id == data.target_item_id,
            )
            .limit(1)
        )
        if already_offered_res.scalar_one_or_none() is not None:
            raise HTTPException(status_code=400, detail="Вы уже предлагали обмен по этому предмету")

        offer = SwapOffer(
            sender_id=sender_id,
            recipient_id=target.user_id,
            offered_item_id=data.offered_item_id,
            target_item_id=data.target_item_id,
            comment=data.comment,
            status=SwapStatus.PENDING,
        )
        session.add(offer)
        await session.commit()
        # Перечитываем предложение с жадной загрузкой связанных объектов.
        # Иначе сериализация SwapOut (offered_item/target_item/sender/recipient)
        # вызовет ленивую загрузку и упадёт с MissingGreenlet -> HTTP 500.
        query = (
            select(SwapOffer)
            .options(
                selectinload(SwapOffer.offered_item),
                selectinload(SwapOffer.target_item),
                selectinload(SwapOffer.sender),
                selectinload(SwapOffer.recipient),
            )
            .where(SwapOffer.id == offer.id)
        )
        result = await session.execute(query)
        return result.scalar_one()

    @staticmethod
    async def get_user_offers(session: AsyncSession, user_id: int, offer_type: str = "incoming") -> List[SwapOffer]:
        """
        Получить список входящих или исходящих предложений.
        """
        query = (
            select(SwapOffer)
            .options(
                selectinload(SwapOffer.offered_item),
                selectinload(SwapOffer.target_item),
                selectinload(SwapOffer.sender),
                selectinload(SwapOffer.recipient),
            )
            .order_by(desc(SwapOffer.created_at))
        )

        if offer_type == "incoming":
            query = query.where(SwapOffer.recipient_id == user_id)
        else:
            query = query.where(SwapOffer.sender_id == user_id)

        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def respond_to_offer(session: AsyncSession, user_id: int, offer_id: int, accept: bool) -> SwapOffer:
        """
        Принять или отклонить предложение обмена.
        Только получатель (владелец целевой вещи) может принять/отклонить.
        """
        query = (
            select(SwapOffer)
            .options(
                selectinload(SwapOffer.offered_item),
                selectinload(SwapOffer.target_item),
                selectinload(SwapOffer.sender),
                selectinload(SwapOffer.recipient),
            )
            .where(SwapOffer.id == offer_id)
        )
        result = await session.execute(query)
        offer = result.scalar_one_or_none()

        if not offer:
            raise HTTPException(status_code=404, detail="Предложение не найдено")
        if offer.recipient_id != user_id:
            raise HTTPException(status_code=403, detail="Вы не можете ответить на эту сделку")
        if offer.status != SwapStatus.PENDING:
            raise HTTPException(status_code=400, detail="На это предложение уже дан ответ")

        if accept:
            # Принять сделку можно, только пока оба предмета активны. Если лот уже
            # выбыл из обмена (архив/модерация), завершить оффер нельзя — на фронте
            # такая карточка приглушается и подписывается «Предмет больше не активен».
            offered_active = offer.offered_item is not None and offer.offered_item.status == ItemStatus.ACTIVE
            target_active = offer.target_item is not None and offer.target_item.status == ItemStatus.ACTIVE
            if not (offered_active and target_active):
                raise HTTPException(status_code=400, detail="Один из предметов больше не участвует в обмене")
            offer.status = SwapStatus.ACCEPTED
            # Сделка состоялась — обе вещи уходят в архив (ItemStatus.SWAPPED):
            # лента отдаёт только активные лоты, поэтому архивированные пропадают
            # из неё, а create_offer больше не даст предложить по ним обмен.
            if offer.offered_item:
                offer.offered_item.status = ItemStatus.SWAPPED
            if offer.target_item:
                offer.target_item.status = ItemStatus.SWAPPED

            # Закрываем конкурирующие ожидающие офферы на те же вещи: раз предметы
            # ушли в архив, завершить по ним другую сделку уже нельзя.
            item_ids = [offer.offered_item_id, offer.target_item_id]
            await session.execute(
                update(SwapOffer)
                .where(
                    SwapOffer.id != offer.id,
                    SwapOffer.status == SwapStatus.PENDING,
                    or_(
                        SwapOffer.offered_item_id.in_(item_ids),
                        SwapOffer.target_item_id.in_(item_ids),
                    ),
                )
                .values(status=SwapStatus.REJECTED)
            )
        else:
            offer.status = SwapStatus.REJECTED

        await session.commit()
        await session.refresh(offer)
        return offer

