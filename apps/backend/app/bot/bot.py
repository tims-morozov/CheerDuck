import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from app.core.config import settings

logger = logging.getLogger(__name__)

bot = Bot(token=settings.BOT_TOKEN) if settings.BOT_TOKEN != "YOUR_BOT_TOKEN_HERE" else None
dp = Dispatcher()

@dp.message(CommandStart())
async def command_start_handler(message: types.Message) -> None:
    """
    Приветственное сообщение бота с кнопкой открытия Mini App.
    """
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🦆 Открыть CheerDuck Swap",
                    # В продакшене здесь указывается HTTPS-адрес вашего веб-приложения
                    web_app=WebAppInfo(url="https://cheerduck.example.com")
                )
            ]
        ]
    )
    await message.answer(
        f"Привет, {message.from_user.first_name}! 👋\n\n"
        "Добро пожаловать в **CheerDuck** — уютное сообщество для обмена вещами по принципу своп.\n\n"
        "✨ Меняйте ненужные вещи на нужные легко и безопасно без денег!",
        reply_markup=kb,
        parse_mode="Markdown"
    )

async def send_swap_notification(recipient_id: int, sender_name: str, offered_title: str, target_title: str) -> None:
    """
    Отправка мгновенного push-уведомления владельцу предмета о новом предложении обмена.
    """
    if not bot:
        logger.warning("Бот не инициализирован (отсутствует BOT_TOKEN)")
        return

    text = (
        f"🔔 **Новое предложение обмена!**\n\n"
        f"Пользователь **{sender_name}** предлагает вам обмен:\n"
        f"«{offered_title}» ⇄ «{target_title}»\n\n"
        f"Откройте приложение, чтобы посмотреть подробности и ответить на предложение."
    )
    try:
        await bot.send_message(chat_id=recipient_id, text=text, parse_mode="Markdown")
    except Exception as e:
        logger.error(f"Не удалось отправить уведомление пользователю {recipient_id}: {e}")
