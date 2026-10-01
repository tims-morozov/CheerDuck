import React, { useEffect, useState } from 'react';
import { Item } from '../types';
import { api } from '../api/client';
import { ItemCard } from '../components/ItemCard';
import { CheerDuckLogo } from '../components/CheerDuckLogo';
import { MapPin, Search, Sparkles } from 'lucide-react';

const CITIES = ['Все города', 'Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск'];

interface FeedPageProps {
  onSelectItem: (item: Item) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  currentUserId?: number;
}

export const FeedPage: React.FC<FeedPageProps> = ({
  onSelectItem,
  selectedCity,
  onCityChange,
  currentUserId,
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  const loadFeed = async () => {
    setLoading(true);
    try {
      const data = await api.getFeed(selectedCity);
      setItems(data);
    } catch (e) {
      console.error('Ошибка загрузки ленты:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [selectedCity]);

  // Свои лоты в ленте не показываем: лента — витрина чужих вещей для свопа.
  // currentUserId приходит с бэкенда (GET /users/me) асинхронно: пока он undefined,
  // фильтр ничего не скрывает, а после ответа React перерисовывает список.
  const otherItems = items.filter((item) => item.user_id !== currentUserId);

  const filteredItems = otherItems.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto w-full">
      {/* Шапка: фирменный логотип CheerDuck и выбор города */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <CheerDuckLogo size={34} />
          <span className="font-heading font-medium text-xl tracking-tight text-white">
            Cheer<span className="text-[#CFFF76]">Duck</span>
          </span>
        </div>

        {/* Выбор города: иконка слева, надпись рядом с ней, ширина кнопки — по выбранному городу.
            Невидимый sizer с тем же текстом и теми же размерами задаёт ширину (нативный <select>
            с appearance-none всегда растягивается по самому длинному пункту), а сам <select>
            растянут поверх него через absolute inset-0 */}
        <div className="relative">
          <span
            aria-hidden="true"
            className="invisible block whitespace-nowrap text-xs font-medium py-1.5 pl-7 pr-2 border border-transparent"
          >
            {selectedCity}
          </span>
          <select
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            className="absolute inset-0 w-full h-full appearance-none whitespace-nowrap bg-[#141414] text-white text-xs font-medium py-1.5 pl-7 pr-2 rounded-full border border-[#262626] focus:outline-none focus:border-[#CFFF76]"
          >
            {CITIES.map((c) => (
              <option key={c} value={c} className="bg-black text-white">
                {c}
              </option>
            ))}
          </select>
          <MapPin className="w-3.5 h-3.5 absolute left-2 top-2 text-[#8E8E93] pointer-events-none" />
        </div>
      </div>

      {/* Поиск */}
      <div className="relative mb-3.5">
        <Search className="w-4 h-4 absolute left-3 top-3 text-[#8E8E93]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск вещей для свопа..."
          className="w-full bg-[#141414] text-white text-sm py-2.5 pl-9 pr-3 rounded-xl border border-[#262626] focus:outline-none focus:border-[#CFFF76]"
        />
      </div>

      {/* Сетка предметов */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="aspect-square bg-[#141414] border border-[#262626] animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4">
          <CheerDuckLogo size={56} className="mx-auto mb-3 opacity-60" />
          <h3 className="text-white mb-1">Пока ничего не найдено</h3>
          <p className="text-[#8E8E93] max-w-xs mx-auto">
            Станьте первым, кто выложит лот — или смените город
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} onClick={() => onSelectItem(item)} />
          ))}
        </div>
      )}
    </div>
  );
};

