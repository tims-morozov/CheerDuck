import React, { useEffect, useState } from 'react';
import { Item, User } from '../types';
import { api } from '../api/client';
import { CheerDuckLogo } from '../components/CheerDuckLogo';
import { ShieldCheck, HelpCircle, Package, ExternalLink } from 'lucide-react';

interface ProfilePageProps {
  onShowRules: () => void;
  onSelectItem: (item: Item) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onShowRules, onSelectItem }) => {
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
          <ExternalLink className="w-3.5 h-3.5 ml-auto text-[#8E8E93]" />
        </a>
      </div>

      {/* Мои выложенные предметы */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] mb-2.5 flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-[#CFFF76]" /> Мои лоты ({myItems.length})
        </p>

        {loading ? (
          <div className="h-20 bg-[#141414] border border-[#262626] rounded-2xl animate-pulse" />
        ) : myItems.length === 0 ? (
          <div className="p-8 text-center bg-[#141414] rounded-2xl border border-[#262626]">
            <p className="text-[#8E8E93]">Вы пока не выставили ни одной вещи</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="p-3.5 bg-[#141414] border border-[#262626] hover:border-[#CFFF76]/50 rounded-xl flex items-center justify-between cursor-pointer transition-all"
              >
                <div>
                  <h3 className="text-sm line-clamp-1 text-white">{item.title}</h3>
                  <span className="text-[10px] text-[#8E8E93]">{item.city}</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === 'active'
                      ? 'bg-[#CFFF76] text-black'
                      : 'bg-[#1A1A1A] border border-[#262626] text-[#8E8E93]'
                  }`}
                >
                  {item.status === 'active' ? 'Активен' : 'В сделке'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

