import React, { useEffect, useState } from 'react';
import type { Item, SwapOffer } from '../types';
import { api } from '../api/client';
import { useTelegram } from '../hooks/useTelegram';
import { ArrowRightLeft } from 'lucide-react';
import { SwapCard } from '../components/SwapCard';
import { offerSortRank } from '../utils/swap';

interface SwapsPageProps {
  // Клик по карточке предмета в свопе — открыть лот (как в ленте).
  // Вторым аргументом передаём сам оффер: в карточке входящего свопа это
  // позволяет сразу принять предложение («Принять своп»).
  onSelectItem?: (item: Item, offer?: SwapOffer) => void;
}

export const SwapsPage: React.FC<SwapsPageProps> = ({ onSelectItem }) => {
  const { haptic } = useTelegram();
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [offers, setOffers] = useState<SwapOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const data = await api.getMySwaps(tab);
      setOffers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, [tab]);

  const handleRespond = async (offerId: number, accept: boolean) => {
    haptic.impact(accept ? 'heavy' : 'light');
    try {
      await api.respondToSwap(offerId, accept);
      loadOffers();
    } catch (e: any) {
      alert(e.message || 'Ошибка обработки');
    }
  };

  // Порядок карточек: активные (ожидают ответа, предметы живы) — сверху;
  // завершённые (принятые/отклонённые) — ниже; «выбывшие» (приглушённая карточка
  // «Предмет больше не активен») — в самом низу. Внутри каждой группы сохраняем
  // порядок бэкенда (свежие сверху): сортировка в JS стабильная.
  const sortedOffers = [...offers].sort((a, b) => offerSortRank(a) - offerSortRank(b));

  return (
    <div className="pb-28 pt-3 px-4 max-w-md mx-auto w-full text-left bg-black text-white">
      <h1 className="mb-3 text-xl text-white">Предложения обмена</h1>

      <div className="flex bg-[#141414] border border-[#262626] p-1 rounded-full mb-4">
        <button
          onClick={() => setTab('incoming')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${
            tab === 'incoming'
              ? 'bg-[#CFFF76] text-black shadow-sm'
              : 'text-[#8E8E93] hover:text-white'
          }`}
        >
          Входящие
        </button>
        <button
          onClick={() => setTab('outgoing')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${
            tab === 'outgoing'
              ? 'bg-[#CFFF76] text-black shadow-sm'
              : 'text-[#8E8E93] hover:text-white'
          }`}
        >
          Исходящие
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-32 bg-[#141414] border border-[#262626] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16">
          <ArrowRightLeft className="w-8 h-8 mx-auto text-zinc-600 mb-2 opacity-50" />
          <h3 className="text-white">Нет предложений</h3>
          <p className="text-[#8E8E93] mt-0.5">
            {tab === 'incoming' ? 'Пока никто не предложил обмен' : 'Вы еще не отправляли предложений'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedOffers.map((offer) => (
            <SwapCard
              key={offer.id}
              offer={offer}
              isIncoming={tab === 'incoming'}
              onRespond={handleRespond}
              onSelectItem={onSelectItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};


