import React from 'react';
import { Item } from '../types';
import { MapPin, ArrowLeftRight, Pencil } from 'lucide-react';

interface ItemCardProps {
  item: Item;
  // Клик по карточке (открыть лот). Необязателен: внутри карточки свопа
  // карточки предметов могут быть некликабельными.
  onClick?: () => void;
  // Необязательная кнопка редактирования: показывается только там, где нужна
  // (например, в «Моих лотах» профиля). В ленте чужих вещей не передаётся.
  onEdit?: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onClick, onEdit }) => {
  const photo = item.images && item.images.length > 0 ? item.images[0] : null;
  // Интерактив (курсор, отклик на нажатие, hover-рамка) — только у кликабельной карточки
  const interactive = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`bg-[#141414] rounded-2xl overflow-hidden border border-[#262626] shadow-sm flex flex-col text-left group ${
        interactive ? 'hover:border-[#383838] active:scale-[0.98] transition-all cursor-pointer' : ''
      }`}
    >
      {/* Изображение лота */}
      <div className="relative aspect-square w-full bg-[#1A1A1A] overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <ArrowLeftRight className="w-8 h-8 opacity-40 text-[#CFFF76]" />
          </div>
        )}

        {/* Кнопка редактирования — только когда передан onEdit (свои лоты в профиле) */}
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              // Не открываем карточку лота — только запускаем редактирование
              e.stopPropagation();
              onEdit();
            }}
            aria-label="Редактировать лот"
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 backdrop-blur-sm border border-white/10 text-white hover:text-[#CFFF76] hover:border-[#CFFF76]/40 active:scale-95 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Информация */}
      <div className="p-3 flex flex-col flex-grow justify-between gap-1.5">
        <div>
          <h3 className="text-sm line-clamp-1 leading-snug text-white">
            {item.title}
          </h3>
          <div className="flex items-center text-[11px] text-[#8E8E93] mt-0.5 gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{item.city}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

