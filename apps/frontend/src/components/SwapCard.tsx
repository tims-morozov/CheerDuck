import React from 'react';
import type { SwapOffer } from '../types';
import { Check, X, MessageCircle } from 'lucide-react';

interface SwapCardProps {
  offer: SwapOffer;
  isIncoming: boolean;
  onRespond: (offerId: number, accept: boolean) => void;
}

export const SwapCard: React.FC<SwapCardProps> = ({ offer, isIncoming, onRespond }) => {
  const isAccepted = offer.status === 'accepted';
  const isPending = offer.status === 'pending';
  const isRejected = offer.status === 'rejected';

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 shadow-sm text-left">
      <div className="flex items-center justify-between text-[11px] mb-2.5 text-[#8E8E93]">
        <span>Своп #{offer.id}</span>
        <span
          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
            isAccepted
              ? 'bg-[#CFFF76] text-black'
              : isRejected
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}
        >
          {isAccepted ? 'Принято' : isRejected ? 'Отклонено' : 'Ожидает ответа'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs bg-[#1A1A1A] p-3 rounded-xl mb-3 border border-[#262626]/60">
        <div>
          <span className="text-[10px] text-[#8E8E93] block mb-0.5">
            {isIncoming ? 'Вам предлагают:' : 'Вы предлагаете:'}
          </span>
          <span className="font-semibold line-clamp-1 text-white">
            {offer.offered_item?.title || 'Предмет'}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#8E8E93] block mb-0.5">Взамен на:</span>
          <span className="font-semibold line-clamp-1 text-[#CFFF76]">
            {offer.target_item?.title || 'Цель'}
          </span>
        </div>
      </div>

      {offer.comment && (
        <p className="bg-[#1A1A1A] text-zinc-300 p-2.5 rounded-xl mb-3 italic border border-[#262626]/40">
          «{offer.comment}»
        </p>
      )}

      {isAccepted && offer.contact_username && (
        <div className="mb-3 p-3 rounded-xl bg-[#CFFF76]/10 border border-[#CFFF76]/30">
          <p className="font-bold text-[#CFFF76] mb-1">
            Контакты для связи открыты!
          </p>
          <a
            href={`https://t.me/${offer.contact_username}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-bold text-white hover:text-[#CFFF76] underline"
          >
            <MessageCircle className="w-4 h-4 text-[#CFFF76]" />
            @{offer.contact_username}
          </a>
        </div>
      )}

      {isIncoming && isPending && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onRespond(offer.id, true)}
            className="flex-1 py-2.5 bg-[#CFFF76] hover:bg-[#bce668] text-black rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
          >
            <Check className="w-4 h-4 stroke-[2.5]" /> Принять
          </button>
          <button
            onClick={() => onRespond(offer.id, false)}
            className="flex-1 py-2.5 bg-[#1A1A1A] border border-[#262626] text-[#8E8E93] hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
          >
            <X className="w-4 h-4" /> Отклонить
          </button>
        </div>
      )}
    </div>
  );
};

