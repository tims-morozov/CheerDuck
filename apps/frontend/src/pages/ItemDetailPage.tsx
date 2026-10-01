import React, { useState } from 'react';
import { Item } from '../types';
import { ArrowLeft, MapPin, ShieldAlert } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';

// Текст пилюли состояния: добавляем слово «состояние» с учётом грамматики
// (значения совпадают с CONDITIONS из CreateItemPage.tsx)
const CONDITION_LABELS: Record<string, string> = {
  'Новое': 'Новое состояние',
  'Отличное': 'Отличное состояние',
  'Хорошее': 'Хорошее состояние',
  'С нюансами': 'Состояние с нюансами',
};

interface ItemDetailPageProps {
  item: Item;
  onBack: () => void;
  onOpenSwapModal: (item: Item) => void;
  currentUserId?: number;
}

export const ItemDetailPage: React.FC<ItemDetailPageProps> = ({
  item,
  onBack,
  onOpenSwapModal,
  currentUserId,
}) => {
  const { haptic } = useTelegram();
  const [reportSent, setReportSent] = useState(false);
  const isMyItem = currentUserId === item.user_id;
  const conditionLabel = CONDITION_LABELS[item.condition] ?? `${item.condition} состояние`;

  const handleReport = () => {
    setReportSent(true);
    haptic.notification('success');
  };

  return (
    <div className="pb-32 pt-2 px-4 max-w-md mx-auto w-full text-left bg-black text-white">
      {/* Кнопка назад */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#8E8E93] hover:text-[#CFFF76] transition-colors mb-3.5"
      >
        <ArrowLeft className="w-4 h-4" /> Назад в ленту
      </button>

      {/* Фото предмета */}
      <div className="relative aspect-square w-full bg-[#141414] rounded-2xl overflow-hidden mb-3 shadow-sm border border-[#262626]">
        {item.images && item.images.length > 0 ? (
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            📦
          </div>
        )}
      </div>

      {/* Заголовок, состояние и город */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="leading-tight text-white">{item.title}</h1>
          <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#CFFF76] text-black whitespace-nowrap">
            {conditionLabel}
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs text-[#8E8E93] shrink-0">
          <MapPin className="w-3.5 h-3.5" />
          <span>{item.city}</span>
        </span>
      </div>

      {/* Описание */}
      <div className="mt-6 mb-6">
        <p className="text-[11px] font-bold tracking-wider text-[#8E8E93] mb-1.5">
          Описание
        </p>
        <p className="text-zinc-300 whitespace-pre-line leading-relaxed">
          {item.description}
        </p>
      </div>

      {/* Модерация / Пожаловаться */}
      <div className="pt-3 border-t border-[#262626]">
        {reportSent ? (
          <span className="text-xs text-[#CFFF76] font-semibold">
            ✓ Жалоба отправлена на модерацию
          </span>
        ) : (
          <button
            onClick={handleReport}
            className="flex items-center gap-1 text-xs text-[#8E8E93] hover:text-rose-400 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Пожаловаться на лот
          </button>
        )}
      </div>

      {/* Закрепленная кнопка действия */}
      <div className="fixed bottom-16 left-0 right-0 py-3 bg-black/90 backdrop-blur-md z-30">
        <div className="max-w-md mx-auto px-4">
          {isMyItem ? (
            <div className="w-full py-3 bg-[#141414] border border-[#262626] text-center rounded-xl text-xs font-semibold text-[#8E8E93]">
              Это ваш собственный лот
            </div>
          ) : (
            <button
              onClick={() => {
                haptic.impact('medium');
                onOpenSwapModal(item);
              }}
              className="w-full py-3.5 bg-[#CFFF76] hover:bg-[#bce668] active:scale-[0.98] transition-all rounded-xl text-black font-extrabold text-sm shadow-lg flex items-center justify-center gap-2"
            >
              Предложить обмен
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

