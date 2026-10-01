"""
Демонстрационный сидер для ручной проверки интерфейса.

Создаёт ВХОДЯЩЕЕ предложение обмена (sender -> получатель), в котором один из
предметов уже не активен, — чтобы в разделе «Свопы -> Входящие» появилась
приглушённая карточка с подписью «Предмет больше не активен».

Запуск из каталога apps/backend (при DEBUG_MODE=True, тестовый пользователь id=99999999):
    .\\venv\\Scripts\\python.exe seed_demo_swap.py

Повторный запуск идемпотентен: второй такой же оффер не создаётся.
"""

import asyncio

from sqlalchemy import select

from app.core.database import async_session_maker
from app.models.item import Item, ItemStatus
from app.models.swap import SwapOffer, SwapStatus
from app.models.user import User

# Получатель — тестовый пользователь DEBUG-режима (см. app/core/security.py),
# отправитель — партнёр из тестовых данных.
RECIPIENT_ID = 99999999
SENDER_ID = 100000001
DEMO_COMMENT = "Демонстрационное предложение для проверки серой карточки"


async def main() -> None:
    async with async_session_maker() as session:
        recipient = (await session.execute(select(User).where(User.id == RECIPIENT_ID))).scalar_one_or_none()
        sender = (await session.execute(select(User).where(User.id == SENDER_ID))).scalar_one_or_none()
        if recipient is None or sender is None:
            print("Нет тестовых пользователей. Сначала откройте приложение (GET /users/me).")
            return

        # Неактивный (выбывший) лот отправителя и активный лот получателя
        offered = (
            await session.execute(
                select(Item).where(Item.user_id == SENDER_ID, Item.status != ItemStatus.ACTIVE).limit(1)
            )
        ).scalar_one_or_none()
        target = (
            await session.execute(
                select(Item).where(Item.user_id == RECIPIENT_ID, Item.status == ItemStatus.ACTIVE).limit(1)
            )
        ).scalar_one_or_none()

        if offered is None or target is None:
            print("Не нашёл предметы: нужен неактивный лот у отправителя и активный лот у получателя.")
            return

        existing = (
            await session.execute(
                select(SwapOffer).where(
                    SwapOffer.sender_id == SENDER_ID,
                    SwapOffer.recipient_id == RECIPIENT_ID,
                    SwapOffer.offered_item_id == offered.id,
                    SwapOffer.target_item_id == target.id,
                )
            )
        ).scalar_one_or_none()
        if existing is not None:
            print(f"Демо-оффер уже есть: id={existing.id}, status={existing.status}")
            return

        offer = SwapOffer(
            sender_id=SENDER_ID,
            recipient_id=RECIPIENT_ID,
            offered_item_id=offered.id,
            target_item_id=target.id,
            comment=DEMO_COMMENT,
            status=SwapStatus.PENDING,
        )
        session.add(offer)
        await session.commit()
        print(
            f"Создан демо-оффер id={offer.id}: offered_item={offered.id} (status={offered.status}), "
            f"target_item={target.id} (status={target.status})"
        )


if __name__ == "__main__":
    asyncio.run(main())
