import React, { useEffect, useState } from 'react';
import { Item } from '../types';
import { api } from '../api/client';
import { useTelegram } from '../hooks/useTelegram';
import { X, ArrowRightLeft, Send } from 'lucide-react';

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
      <div className="bg-[#141414] w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 text-left border border-[#262626] shadow-2xl max-h-[90vh] overflow-y-auto text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-white">
            <ArrowRightLeft className="w-5 h-5 text-[#CFFF76]" /> Предложить обмен
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-[#8E8E93] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-xs">
          <span className="text-[#8E8E93] block mb-0.5">Вы хотите получить:</span>
          <span className="font-medium text-white line-clamp-1">{targetItem.title}</span>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold mb-2 text-[#8E8E93]">
            Выберите ваш предмет для обмена:
          </label>
          {fetching ? (
            <div className="h-16 bg-[#1A1A1A] rounded-xl animate-pulse" />
          ) : myItems.length === 0 ? (
            <div className="p-4 bg-[#1A1A1A] border border-[#CFFF76]/30 rounded-xl text-xs text-[#CFFF76]">
              У вас пока нет активных предметов для обмена. Сначала добавьте свой лот во вкладке «Добавить».
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {myItems.map((item) => {
                const isSelected = selectedItemId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      haptic.selection();
                      setSelectedItemId(item.id);
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#CFFF76] bg-[#CFFF76]/10 text-white font-bold'
                        : 'border-[#262626] bg-[#1A1A1A] text-[#8E8E93] hover:border-zinc-500'
                    }`}
                  >
                    <p className="text-xs line-clamp-2">{item.title}</p>
                  </div>
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
            className="w-full bg-[#1A1A1A] border border-[#262626] text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#CFFF76] resize-none"
          />
        </div>

        <button
          onClick={handleSendOffer}
          disabled={loading || myItems.length === 0}
          className="w-full py-3.5 bg-[#CFFF76] hover:bg-[#bce668] text-black font-extrabold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          <Send className="w-4 h-4 stroke-[2.5]" />
          {loading ? 'Отправка...' : 'Отправить предложение'}
        </button>
      </div>
    </div>
  );
};
