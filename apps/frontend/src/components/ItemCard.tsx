import React from 'react';
import { Item } from '../types';
import { MapPin, ArrowLeftRight } from 'lucide-react';

interface ItemCardProps {
  item: Item;
  onClick: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
  const photo = item.images && item.images.length > 0 ? item.images[0] : null;

  return (
    <div
      onClick={onClick}
      className="bg-[#141414] rounded-2xl overflow-hidden border border-[#262626] hover:border-[#383838] shadow-sm active:scale-[0.98] transition-all cursor-pointer flex flex-col text-left group"
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

