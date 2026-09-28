from typing import List
from sqlalchemy import select, desc
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

        # Проверяем целевой предмет
        target_res = await session.execute(select(Item).where(Item.id == data.target_item_id))
        target = target_res.scalar_one_or_none()
        if not target:
            raise HTTPException(status_code=404, detail="Целевой предмет не найден")
        if target.user_id == sender_id:
            raise HTTPException(status_code=400, detail="Нельзя меняться с самим собой")

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
        await session.refresh(offer)
        return offer

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
            offer.status = SwapStatus.ACCEPTED
            # Помечаем вещи как "в сделке"
            if offer.offered_item:
                offer.offered_item.status = ItemStatus.IN_DEAL
            if offer.target_item:
                offer.target_item.status = ItemStatus.IN_DEAL
        else:
            offer.status = SwapStatus.REJECTED

        await session.commit()
        await session.refresh(offer)
        return offer

