import React, { useEffect, useState } from 'react';
import { Item, User } from '../types';
import { api } from '../api/client';
import { CheerDuckLogo } from '../components/CheerDuckLogo';
import { ItemCard } from '../components/ItemCard';
import { ShieldCheck, HelpCircle } from 'lucide-react';

interface ProfilePageProps {
  onShowRules: () => void;
  onSelectItem: (item: Item) => void;
  onEditItem: (item: Item) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onShowRules, onSelectItem, onEditItem }) => {
  const [user, setUser] = useState<User | null>(null);
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  // Переключатель списка лотов: активные (в обмене) / завершённые (архив).
  const [tab, setTab] = useState<'active' | 'completed'>('active');

  useEffect(() => {
    Promise.all([api.getMe(), api.getMyItems()])
      .then(([userData, itemsData]) => {
        setUser(userData);
        setMyItems(itemsData);
      })
      .finally(() => setLoading(false));
  }, []);

  // Активные лоты — те, что участвуют в обмене; завершённые — ушедшие в архив
  // после принятого свопа (status = 'swapped').
  const activeItems = myItems.filter((item) => item.status === 'active');
  const completedItems = myItems.filter((item) => item.status === 'swapped');
  const visibleItems = tab === 'active' ? activeItems : completedItems;

  return (
    <div className="pb-28 pt-3 px-4 max-w-md mx-auto w-full text-left bg-black text-white">
      <h1 className="mb-3 text-xl text-white">Мой профиль</h1>

      {/* Карточка пользователя */}
      <div className="bg-[#141414] border border-[#262626] rounded-lg p-4 shadow-sm mb-4">
        <div className="flex items-center gap-3.5">
          <CheerDuckLogo size={44} />
          <div>
            <h2 className="text-[15px] leading-tight text-white">
              {user ? `${user.first_name} ${user.last_name || ''}` : 'Пользователь'}
            </h2>
            <span className="text-xs text-[#8E8E93]">
              {user?.username ? `@${user.username}` : 'Telegram профиль'}
            </span>
          </div>
        </div>
      </div>

      {/* Быстрые действия: Правила и Поддержка */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <button
          onClick={onShowRules}
          className="p-3.5 bg-[#141414] border border-[#262626] hover:border-[#CFFF76]/40 rounded-lg flex items-center gap-2.5 text-xs font-normal text-white transition-all shadow-sm active:scale-[0.98]"
        >
          <ShieldCheck className="w-4 h-4 text-[#CFFF76]" />
          <span>Правила свопа</span>
        </button>

        <a
          href="https://t.me/cheerduck_support"
          target="_blank"
          rel="noreferrer"
          className="p-3.5 bg-[#141414] border border-[#262626] hover:border-[#CFFF76]/40 rounded-lg flex items-center gap-2.5 text-xs font-normal text-white transition-all shadow-sm active:scale-[0.98]"
        >
          <HelpCircle className="w-4 h-4 text-[#CFFF76]" />
          <span>Поддержка</span>
        </a>
      </div>

      {/* Мои лоты: заголовок и переключатель «Активные / Завершенные», как в разделе «Свопы» */}
      <div>
        <p className="text-xs font-bold text-[#8E8E93] mb-2.5">
          Мои лоты ({visibleItems.length})
        </p>

        <div className="flex bg-[#141414] border border-[#262626] p-1 rounded-full mb-4">
          <button
            onClick={() => setTab('active')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${
              tab === 'active'
                ? 'bg-[#CFFF76] text-black shadow-sm'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            Активные
          </button>
          <button
            onClick={() => setTab('completed')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${
              tab === 'completed'
                ? 'bg-[#CFFF76] text-black shadow-sm'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            Завершенные
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="aspect-square bg-[#141414] border border-[#262626] animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="p-8 text-center bg-[#141414] rounded-lg border border-[#262626]">
            <p className="text-[#8E8E93]">
              {tab === 'active'
                ? 'Вы пока не добавили предметы'
                : 'У вас пока нет завершенных обменов'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visibleItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => onSelectItem(item)}
                // Редактировать можно только активные лоты: архивные уже не в обмене
                onEdit={item.status === 'active' ? () => onEditItem(item) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

