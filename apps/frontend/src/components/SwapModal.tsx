import React, { useEffect, useState } from 'react';
import { Item } from '../types';
import { api } from '../api/client';
import { useTelegram } from '../hooks/useTelegram';
import { X, ArrowRightLeft, MapPin, Check } from 'lucide-react';

interface SwapModalProps {
  targetItem: Item;
  onClose: () => void;
  onSuccess: () => void;
}

export const SwapModal: React.FC<SwapModalProps> = ({ targetItem, onClose, onSuccess }) => {
  const { haptic } = useTelegram();
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Фото целевого лота — показываем миниатюру в блоке «Вы хотите получить»:
  // по названию лоты могут совпадать (см. список выбора ниже), фото нагляднее.
  const targetPhoto = targetItem.images && targetItem.images.length > 0 ? targetItem.images[0] : null;

  useEffect(() => {
    api.getMyItems()
      .then((items) => {
        const available = items.filter((i) => i.status === 'active');
        setMyItems(available);
        if (available.length > 0) setSelectedItemId(available[0].id);
      })
      .finally(() => setFetching(false));
  }, []);

  const handleSendOffer = async () => {
    if (!selectedItemId) {
      alert('Выберите свой предмет для обмена');
      return;
    }

    setLoading(true);
    try {
      await api.createSwap({
        offered_item_id: selectedItemId,
        target_item_id: targetItem.id,
        comment: comment.trim() || undefined,
      });

      haptic.notification('success');
      alert('Предложение обмена успешно отправлено!');
      onSuccess();
    } catch (e: any) {
      haptic.notification('error');
      alert(e.message || 'Ошибка отправки предложения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#141414] w-full max-w-md rounded-t-xl sm:rounded-lg p-5 text-left border border-[#262626] shadow-2xl max-h-[90vh] overflow-y-auto text-white">
        <div className="flex items-center justify-between mb-4">
          {/* Размер заголовка — как у логотип-надписи CheerDuck (text-xl = 20px) */}
          <h2 className="text-xl text-white">Предложить своп</h2>
          <button onClick={onClose} className="p-1 rounded-full text-[#8E8E93] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-[#1A1A1A] border border-[#262626] rounded-md flex items-center gap-3">
          {/* Миниатюра целевого лота — чтобы точно сверить, обмен на что предлагаем */}
          <div className="w-12 h-12 shrink-0 rounded-md overflow-hidden bg-[#0d0d0d] border border-[#262626] flex items-center justify-center">
            {targetPhoto ? (
              <img
                src={targetPhoto}
                alt={targetItem.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <ArrowRightLeft className="w-5 h-5 opacity-40 text-[#CFFF76]" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-[#8E8E93] block mb-0.5 text-xs">Вы хотите получить:</span>
            <span className="font-medium text-white text-xs line-clamp-2">{targetItem.title}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold mb-2 text-[#8E8E93]">
            Выберите ваш предмет для обмена:
          </label>
          {fetching ? (
            <div className="h-16 bg-[#1A1A1A] rounded-md animate-pulse" />
          ) : myItems.length === 0 ? (
            <div className="p-4 bg-[#1A1A1A] border border-[#CFFF76]/30 rounded-md text-xs text-[#CFFF76]">
              У вас пока нет активных предметов для обмена. Сначала добавьте свой лот во вкладке «Добавить».
            </div>
          ) : (
            // Список строится строками (а не сеткой из одних заголовков): у каждого
            // лота показываем миниатюру, город и состояние, поэтому даже лоты с
            // одинаковым названием легко отличить. Выбранный вариант подсвечен и
            // помечен галочкой.
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-0.5">
              {myItems.map((item) => {
                const isSelected = selectedItemId === item.id;
                const photo = item.images && item.images.length > 0 ? item.images[0] : null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setSelectedItemId(item.id);
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-md border text-left transition-all ${
                      isSelected
                        ? 'border-[#CFFF76] bg-[#CFFF76]/10'
                        : 'border-[#262626] bg-[#1A1A1A] hover:border-zinc-500'
                    }`}
                  >
                    {/* Миниатюра лота (или заглушка, если фото нет) */}
                    <div className="w-12 h-12 shrink-0 rounded-md overflow-hidden bg-[#0d0d0d] border border-[#262626] flex items-center justify-center">
                      {photo ? (
                        <img
                          src={photo}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <ArrowRightLeft className="w-5 h-5 opacity-40 text-[#CFFF76]" />
                      )}
                    </div>

                    {/* Название, город и состояние — чтобы различать одинаковые заголовки */}
                    <div className="min-w-0 flex-grow">
                      <p
                        className={`text-xs line-clamp-2 ${
                          isSelected ? 'text-white font-bold' : 'text-zinc-300'
                        }`}
                      >
                        {item.title}
                      </p>
                      <div className="flex items-center text-[11px] text-[#8E8E93] mt-0.5 gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.city}</span>
                        <span className="text-[#3f3f46]">·</span>
                        <span className="truncate">{item.condition}</span>
                      </div>
                    </div>

                    {/* Индикатор выбора */}
                    <div
                      className={`w-5 h-5 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-[#CFFF76] border-[#CFFF76]' : 'border-[#3f3f46]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold mb-1 text-[#8E8E93]">
            Комментарий к предложению (необязательно):
          </label>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Например: могу встретиться в метро или привезти лично"
            className="w-full bg-[#1A1A1A] border border-[#262626] text-white text-xs p-2.5 rounded-md focus:outline-none focus:border-[#CFFF76] resize-none"
          />
        </div>

        <button
          onClick={handleSendOffer}
          disabled={loading || myItems.length === 0}
          className="w-full py-3.5 bg-[#CFFF76] hover:bg-[#bce668] text-black font-extrabold rounded-md text-sm shadow-md flex items-center justify-center disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          {loading ? 'Отправка...' : 'Отправить предложение'}
        </button>
      </div>
    </div>
  );
};
