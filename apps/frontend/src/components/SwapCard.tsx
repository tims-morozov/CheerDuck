import React from 'react';
import type { Item, SwapOffer } from '../types';
import { ArrowLeftRight } from 'lucide-react';
import { ItemCard } from './ItemCard';

interface SwapCardProps {
  offer: SwapOffer;
  isIncoming: boolean;
  onRespond: (offerId: number, accept: boolean) => void;
  // Клик по карточке предмета — открыть лот (как в ленте). Необязателен.
  // Вместе с предметом передаём сам оффер: в карточке входящего свопа это
  // позволяет показать «Принять своп» вместо «Предложить своп».
  onSelectItem?: (item: Item, offer: SwapOffer) => void;
}

// Заглушка на случай, если связанный предмет недоступен (offered_item/target_item = null):
// держим сетку одинаковой высоты, чтобы карточка не «прыгала».
const SwapItemPlaceholder: React.FC = () => (
  <div className="rounded-2xl border border-[#262626] bg-[#141414] aspect-square flex items-center justify-center">
    <ArrowLeftRight className="w-6 h-6 opacity-40 text-[#CFFF76]" />
  </div>
);

export const SwapCard: React.FC<SwapCardProps> = ({ offer, isIncoming, onRespond, onSelectItem }) => {
  const isAccepted = offer.status === 'accepted';
  const isPending = offer.status === 'pending';
  const isRejected = offer.status === 'rejected';

  const offeredItem = offer.offered_item ?? null;
  const targetItem = offer.target_item ?? null;

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 shadow-sm text-left">
      {/* Статус показываем только у отклонённых офферов: «Ожидает ответа» и «Принято» не выводим */}
      {isRejected && (
        <div className="flex items-center justify-end mb-3">
          <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Отклонено
          </span>
        </div>
      )}

      {/* Предметы обмена — те же карточки, что и в ленте */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-[10px] font-medium text-[#8E8E93]">
            {isIncoming ? 'Вам предлагают:' : 'Вы предлагаете:'}
          </span>
          {offeredItem ? (
            <ItemCard
              item={offeredItem}
              onClick={onSelectItem ? () => onSelectItem(offeredItem, offer) : undefined}
            />
          ) : (
            <SwapItemPlaceholder />
          )}
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-[10px] font-medium text-[#8E8E93]">Взамен на:</span>
          {targetItem ? (
            <ItemCard
              item={targetItem}
              onClick={onSelectItem ? () => onSelectItem(targetItem, offer) : undefined}
            />
          ) : (
            <SwapItemPlaceholder />
          )}
        </div>
      </div>

      {offer.comment && (
        <p className="bg-[#1A1A1A] text-zinc-300 text-[15px] p-2.5 rounded-xl mt-3 border border-[#262626]/40 whitespace-pre-line leading-relaxed">
          «{offer.comment}»
        </p>
      )}

      {isAccepted && offer.contact_username && (
        <a
          href={`https://t.me/${offer.contact_username}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 w-full py-2.5 bg-[#CFFF76] hover:bg-[#bce668] text-black rounded-xl text-xs font-bold flex items-center justify-center shadow-sm active:scale-[0.98] transition-all"
        >
          Связаться с @{offer.contact_username}
        </a>
      )}

      {isIncoming && isPending && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onRespond(offer.id, true)}
            className="flex-1 py-2.5 bg-[#CFFF76] hover:bg-[#bce668] text-black rounded-xl text-xs font-bold flex items-center justify-center shadow-sm active:scale-[0.98] transition-all"
          >
            Принять
          </button>
          <button
            onClick={() => onRespond(offer.id, false)}
            className="flex-1 py-2.5 bg-[#1A1A1A] border border-[#262626] text-[#8E8E93] hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center active:scale-[0.98] transition-all"
          >
            Отклонить
          </button>
        </div>
      )}
    </div>
  );
};

