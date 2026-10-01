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

  useEffect(() => {
    Promise.all([api.getMe(), api.getMyItems()])
      .then(([userData, itemsData]) => {
        setUser(userData);
        setMyItems(itemsData);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pb-28 pt-3 px-4 max-w-md mx-auto w-full text-left bg-black text-white">
      <h1 className="mb-3 text-white">Мой профиль</h1>

      {/* Карточка пользователя */}
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex items-center gap-3.5">
          <CheerDuckLogo size={44} />
          <div>
            <h2 className="text-lg leading-tight text-white">
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
          className="p-3.5 bg-[#141414] border border-[#262626] hover:border-[#CFFF76]/40 rounded-2xl flex items-center gap-2.5 text-xs font-normal text-white transition-all shadow-sm active:scale-[0.98]"
        >
          <ShieldCheck className="w-4 h-4 text-[#CFFF76]" />
          <span>Правила свопа</span>
        </button>

        <a
          href="https://t.me/cheerduck_support"
          target="_blank"
          rel="noreferrer"
          className="p-3.5 bg-[#141414] border border-[#262626] hover:border-[#CFFF76]/40 rounded-2xl flex items-center gap-2.5 text-xs font-normal text-white transition-all shadow-sm active:scale-[0.98]"
        >
          <HelpCircle className="w-4 h-4 text-[#CFFF76]" />
          <span>Поддержка</span>
        </a>
      </div>

      {/* Мои выложенные предметы */}
      <div>
        <p className="text-xs font-bold text-[#8E8E93] mb-2.5">
          Мои лоты ({myItems.length})
        </p>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="aspect-square bg-[#141414] border border-[#262626] animate-pulse rounded-2xl"
              />
            ))}
          </div>
        ) : myItems.length === 0 ? (
          <div className="p-8 text-center bg-[#141414] rounded-2xl border border-[#262626]">
            <p className="text-[#8E8E93]">Вы пока не выставили ни одной вещи</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {myItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => onSelectItem(item)}
                onEdit={() => onEditItem(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

