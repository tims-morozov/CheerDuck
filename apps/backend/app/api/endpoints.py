from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user, TelegramUser
from app.schemas.schemas import UserOut, UserUpdateCity, ItemOut, ItemCreate, SwapOut, SwapCreate
from app.services.user_service import UserService
from app.services.item_service import ItemService
from app.services.swap_service import SwapService
from app.models.swap import SwapStatus

api_router = APIRouter()

# --- Пользователи ---
@api_router.get("/users/me", response_model=UserOut)
async def get_my_profile(
    current_user: TelegramUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Возвращает или создает профиль текущего пользователя Telegram"""
    user = await UserService.get_or_create(db, current_user)
    return user

@api_router.patch("/users/me/city", response_model=UserOut)
async def update_my_city(
    data: UserUpdateCity,
    current_user: TelegramUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Смена домашнего города пользователя"""
    user = await UserService.update_city(db, current_user.id, data.city)
    return user

# --- Предметы (Items) ---
@api_router.get("/items/feed", response_model=List[ItemOut])
async def get_feed(
    city: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Лента активных предметов с фильтром по городу"""
    return await ItemService.get_feed(db, city=city)

@api_router.get("/items/my", response_model=List[ItemOut])
async def get_my_items(
    current_user: TelegramUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Список вещей текущего пользователя"""
    return await ItemService.get_user_items(db, current_user.id)

@api_router.get("/items/{item_id}", response_model=ItemOut)
async def get_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Детальная карточка предмета"""
    item = await ItemService.get_by_id(db, item_id)
    return item

@api_router.post("/items", response_model=ItemOut)
async def create_item(
    data: ItemCreate,
    current_user: TelegramUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Публикация нового предмета на своп"""
    # Убедимся, что пользователь есть в БД
    await UserService.get_or_create(db, current_user)
    return await ItemService.create_item(db, current_user.id, data)

# --- Свопы (Swap Offers) ---
@api_router.post("/swaps", response_model=SwapOut)
async def create_swap_offer(
    data: SwapCreate,
    current_user: TelegramUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Отправить предложение обмена на предмет"""
    await UserService.get_or_create(db, current_user)
    offer = await SwapService.create_offer(db, current_user.id, data)
    return offer

@api_router.get("/swaps", response_model=List[SwapOut])
async def get_my_swaps(
    offer_type: str = Query("incoming", pattern="^(incoming|outgoing)$"),
    current_user: TelegramUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Список входящих или исходящих предложений обмена"""
    offers = await SwapService.get_user_offers(db, current_user.id, offer_type)
    
    # Защита данных: контакт Telegram виден только если статус ACCEPTED
    result = []
    for o in offers:
        swap_dict = SwapOut.model_validate(o)
        if o.status == SwapStatus.ACCEPTED:
            # Если предложение принято, показываем второй стороне контакт
            other_user = o.recipient if o.sender_id == current_user.id else o.sender
            swap_dict.contact_username = other_user.username if other_user else None
        result.append(swap_dict)
    return result

@api_router.post("/swaps/{offer_id}/respond", response_model=SwapOut)
async def respond_to_swap(
    offer_id: int,
    accept: bool = Query(...),
    current_user: TelegramUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Принять или отклонить входящее предложение обмена"""
    offer = await SwapService.respond_to_offer(db, current_user.id, offer_id, accept)
    swap_dict = SwapOut.model_validate(offer)
    if offer.status == SwapStatus.ACCEPTED:
        swap_dict.contact_username = offer.sender.username if offer.sender else None
    return swap_dict
