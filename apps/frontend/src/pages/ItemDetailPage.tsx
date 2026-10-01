import React, { useEffect, useState } from 'react';
import { Item, SwapOffer } from '../types';
import { api } from '../api/client';
import { ConfirmModal } from '../components/ConfirmModal';
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
  onDeleted?: () => void;
  // Входящий оффер, из которого открыли карточку предлагаемого предмета.
  // Если он ожидает ответа, вместо «Предложить своп» показываем «Принять своп».
  activeOffer?: SwapOffer | null;
  onAcceptSwap?: (offerId: number) => Promise<void>;
}

export const ItemDetailPage: React.FC<ItemDetailPageProps> = ({
  item,
  onBack,
  onOpenSwapModal,
  currentUserId,
  onDeleted,
  activeOffer,
  onAcceptSwap,
}) => {
  const { haptic } = useTelegram();
  const [reportSent, setReportSent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  // Отправлял ли я уже предложение обмена по этому предмету. Повторно предлагать
  // нельзя (бэкенд это тоже проверяет), поэтому вместо кнопки покажем подсказку.
  const [alreadyOffered, setAlreadyOffered] = useState(false);
  const isMyItem = currentUserId === item.user_id;
  // Лот участвует в обмене, только пока он активен: после принятого свопа он
  // уходит в архив (status = 'swapped') и предлагать по нему обмен нельзя.
  const isItemAvailable = item.status === 'active';
  const conditionLabel = CONDITION_LABELS[item.condition] ?? `${item.condition} состояние`;

  // Узнаём, отправлял ли я уже предложение обмена по этому предмету (среди всех
  // моих исходящих офферов — любого статуса). Если да, повторно предлагать нельзя.
  useEffect(() => {
    if (isMyItem) return;
    let cancelled = false;
    api.getMySwaps('outgoing')
      .then((offers) => {
        if (!cancelled) {
          setAlreadyOffered(offers.some((o) => o.target_item_id === item.id));
        }
      })
      .catch(() => {
        // Список недоступен — возможность отправить оффер оставим: повторный
        // оффер всё равно отклонит бэкенд.
      });
    return () => {
      cancelled = true;
    };
  }, [item.id, isMyItem]);

  // Принять оффер можно прямо в карточке, если открыт именно предлагаемый
  // предмет из ожидающего входящего оффера (и это не мой лот).
  const canAcceptSwap =
    !isMyItem &&
    activeOffer?.status === 'pending' &&
    activeOffer?.offered_item_id === item.id &&
    Boolean(onAcceptSwap);

  const handleReport = () => {
    setReportSent(true);
    haptic.notification('success');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteItem(item.id);
      haptic.notification('success');
      // Удаляем лот — возвращаемся назад: App размонтирует карточку и обновит список
      onDeleted?.();
    } catch (e: any) {
      haptic.notification('error');
      alert(e.message || 'Не удалось удалить предмет');
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  // Принять входящий своп прямо из карточки: App после успеха вернёт в список обменов
  const handleAcceptSwap = async () => {
    if (!activeOffer || !onAcceptSwap) return;
    haptic.impact('heavy');
    setAccepting(true);
    try {
      await onAcceptSwap(activeOffer.id);
      haptic.notification('success');
    } catch (e: any) {
      haptic.notification('error');
      alert(e.message || 'Не удалось принять своп');
      setAccepting(false);
    }
  };

  return (
    // pb-40 (160px) — запас под закреплённую панель действий: она стоит на bottom-16 (64px)
    // и вместе с py-3 + кнопкой py-3.5 поднимается до ~136px от низа вьюпорта. При прежнем
    // pb-32 (128px) последний блок карточки («Пожаловаться на лот») уходил под панель —
    // его нижняя часть перекрывалась кнопкой «Предложить своп», и скролл не доходил до конца.
    <div className="pb-40 pt-2 px-4 max-w-md mx-auto w-full text-left bg-black text-white">
      {/* Кнопка назад */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#8E8E93] hover:text-[#CFFF76] transition-colors mb-3.5"
      >
        <ArrowLeft className="w-4 h-4" /> Назад
      </button>

      {/* Заголовок */}
      <h1 className="leading-tight text-white mb-3">{item.title}</h1>

      {/* Фото предмета */}
      <div className="relative aspect-square w-full bg-[#141414] rounded-lg overflow-hidden mb-3 shadow-sm border border-[#262626]">
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

      {/* Состояние и город */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#CFFF76] text-black whitespace-nowrap">
          {conditionLabel}
        </span>
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

      {/* Модерация / Пожаловаться — скрыто на своём лоте */}
      {!isMyItem && (
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
      )}

      {/* Закрепленная кнопка действия */}
      <div className="fixed bottom-16 left-0 right-0 py-3 bg-black/90 backdrop-blur-md z-30">
        <div className="max-w-md mx-auto px-4">
          {isMyItem ? (
            <button
              onClick={() => {
                haptic.impact('medium');
                setConfirmOpen(true);
              }}
              className="w-full py-3.5 bg-[#141414] border border-rose-500/40 text-rose-400 hover:border-rose-500 hover:bg-rose-500/10 active:scale-[0.98] transition-all rounded-md font-extrabold text-sm flex items-center justify-center"
            >
              Удалить предмет
            </button>
          ) : canAcceptSwap ? (
            <button
              onClick={handleAcceptSwap}
              disabled={accepting}
              className="w-full py-3.5 bg-[#CFFF76] hover:bg-[#bce668] active:scale-[0.98] transition-all rounded-md text-black font-extrabold text-sm shadow-lg flex items-center justify-center disabled:opacity-60 disabled:active:scale-100"
            >
              {accepting ? 'Принимаем…' : 'Принять своп'}
            </button>
          ) : !isItemAvailable ? (
            // Лот в архиве (обмен уже состоялся) — предлагать обмен нельзя
            <div className="w-full py-3.5 bg-[#141414] border border-[#262626] rounded-md text-[#8E8E93] font-semibold text-sm flex items-center justify-center">
              Предмет больше не участвует в обмене
            </div>
          ) : alreadyOffered ? (
            // По этому предмету я уже отправлял предложение обмена — повторно нельзя
            <div className="w-full py-3.5 bg-[#141414] border border-[#262626] rounded-md text-[#8E8E93] font-semibold text-sm flex items-center justify-center">
              Вы уже предлагали обмен по этому предмету
            </div>
          ) : (
            <button
              onClick={() => {
                haptic.impact('medium');
                onOpenSwapModal(item);
              }}
              className="w-full py-3.5 bg-[#CFFF76] hover:bg-[#bce668] active:scale-[0.98] transition-all rounded-md text-black font-extrabold text-sm shadow-lg flex items-center justify-center gap-2"
            >
              Предложить своп
            </button>
          )}
        </div>
      </div>

      {confirmOpen && (
        <ConfirmModal
          title="Удалить предмет?"
          message={`Лот «${item.title}» будет удалён без возможности восстановления.`}
          confirmLabel="Удалить"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
};

