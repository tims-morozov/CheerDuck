import React, { useMemo, useState } from 'react';
import { Check, MapPin, Search, X } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';
import { ALL_CITIES_LABEL, filterCities } from '../utils/cities';

interface CityPickerModalProps {
  selectedCity: string;
  // Показывать первым пунктом «Все города». Нужно в ленте, где фильтр по городу
  // необязателен. В форме лота город обязателен — там пункт не показываем.
  includeAllCities?: boolean;
  title?: string;
  onSelect: (city: string) => void;
  onClose: () => void;
}

/**
 * Выбор города с живым поиском. Модалка-нижний лист на мобильных и по центру на
 * десктопе (как SwapModal). Поиск фильтрует список на лету, поэтому листать
 * длинный справочник вручную не нужно.
 */
export const CityPickerModal: React.FC<CityPickerModalProps> = ({
  selectedCity,
  includeAllCities = false,
  title = 'Выбор города',
  onSelect,
  onClose,
}) => {
  const { haptic } = useTelegram();
  const [query, setQuery] = useState<string>('');

  const cities = useMemo(() => filterCities(query), [query]);

  const handleSelect = (city: string) => {
    haptic.selection();
    onSelect(city);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        // Останавливаем всплытие, чтобы случайный тап по списку не закрывал модалку
        onClick={(e) => e.stopPropagation()}
        className="bg-[#141414] w-full max-w-md rounded-t-xl sm:rounded-lg border border-[#262626] shadow-2xl text-white flex flex-col max-h-[85vh] sm:max-h-[80vh]"
      >
        {/* Шапка: заголовок и закрытие */}
        <div className="flex items-center justify-between p-5 pb-3">
          {/* Заголовок по размеру логотип-надписи CheerDuck (text-xl = 20px) */}
          <h2 className="flex items-center gap-2 text-xl text-white">
            <MapPin className="w-5 h-5 text-[#CFFF76]" />
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="p-1 rounded-full text-[#8E8E93] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Поиск: автофокус открывает клавиатуру сразу — город ищется вводом, а не скроллом */}
        <div className="px-5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#8E8E93]" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск города..."
              className="w-full bg-[#1A1A1A] text-white text-sm py-2.5 pl-9 pr-3 rounded-md border border-[#262626] focus:outline-none focus:border-[#CFFF76]"
            />
          </div>
        </div>

        {/* Список городов */}
        <div className="overflow-y-auto overscroll-contain px-2.5 py-3 mt-1">
          {includeAllCities && (
            <CityRow
              label={ALL_CITIES_LABEL}
              active={selectedCity === ALL_CITIES_LABEL}
              onClick={() => handleSelect(ALL_CITIES_LABEL)}
            />
          )}

          {cities.length === 0 ? (
            <p className="text-center text-sm text-[#8E8E93] py-8">Ничего не найдено</p>
          ) : (
            cities.map((city) => (
              <CityRow
                key={city}
                label={city}
                active={city === selectedCity}
                onClick={() => handleSelect(city)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Строка списка городов: выбранный подсвечивается акцентом и галочкой
const CityRow: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({
  label,
  active,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md text-left text-sm transition-colors ${
      active ? 'bg-[#CFFF76]/10 text-[#CFFF76] font-semibold' : 'text-white hover:bg-[#1A1A1A]'
    }`}
  >
    <span className="truncate">{label}</span>
    {active && <Check className="w-4 h-4 shrink-0 text-[#CFFF76]" />}
  </button>
);
