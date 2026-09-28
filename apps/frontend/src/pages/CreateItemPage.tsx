import React, { useState } from 'react';
import { api } from '../api/client';
import { useTelegram } from '../hooks/useTelegram';
import { Camera, ChevronDown } from 'lucide-react';

const CONDITIONS = ['Новое', 'Отличное', 'Хорошее', 'С нюансами'];
const CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск'];

interface CreateItemPageProps {
  onSuccess: () => void;
  defaultCity: string;
}

export const CreateItemPage: React.FC<CreateItemPageProps> = ({ onSuccess, defaultCity }) => {
  const { haptic } = useTelegram();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState(CONDITIONS[1]);
  const [city, setCity] = useState(defaultCity || 'Москва');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Все поля формы обязательные. Селекты «Состояние» и «Город обмена» всегда
    // имеют значение (дефолт), поэтому отдельной проверки на пустоту им не нужно.
    if (!imageUrl.trim() || !title.trim() || !description.trim()) {
      setError('Заполните все поля: ссылку на фото, название и описание лота');
      haptic.notification('warning');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.createItem({
        title,
        description,
        condition,
        city,
        images: imageUrl ? [imageUrl] : [],
      });

      haptic.notification('success');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Ошибка публикации');
      haptic.notification('error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="pb-28 pt-3 px-4 max-w-md mx-auto w-full text-left bg-black text-white">
      <h1 className="mb-1 text-white">Выложить вещь</h1>
      <p className="text-[#8E8E93] mb-4">
        Опишите предмет: состояние, комплект, нюансы
      </p>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <label className="block text-xs font-semibold mb-1 text-[#8E8E93]">
            Ссылка на фото
          </label>
          <div className="relative">
            <Camera className="w-4 h-4 absolute left-3 top-3 text-[#8E8E93]" />
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#141414] border border-[#262626] text-white text-sm py-2.5 pl-9 pr-3 rounded-xl focus:outline-none focus:border-[#CFFF76]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[#8E8E93]">
            Название лота
          </label>
          <input
            type="text"
            required
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Книга «Чистый код»"
            className="w-full bg-[#141414] border border-[#262626] text-white text-sm py-2.5 px-3 rounded-xl focus:outline-none focus:border-[#CFFF76]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[#8E8E93]">
            Состояние
          </label>
          {/* Стрелка у нативного <select> прижата к правому краю (на iOS — вплотную к рамке),
              поэтому системный вид отключён (appearance-none), а стрелка нарисована иконкой
              ChevronDown на right-3 — с тем же отступом, что и иконка Camera слева.
              Цвет стрелки — белый (text-white).
              pr-9 = 12px отступ + 16px иконка + 8px зазор, чтобы текст не заезжал под стрелку */}
          <div className="relative">
            <select
              required
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full appearance-none bg-[#141414] border border-[#262626] text-white text-xs font-medium py-2.5 pl-3 pr-9 rounded-xl focus:outline-none focus:border-[#CFFF76]"
            >
              {CONDITIONS.map((cond) => (
                <option key={cond} value={cond} className="bg-black text-white">{cond}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[#8E8E93]">
            Город обмена
          </label>
          {/* Те же правки, что и у селекта «Состояние»: своя стрелка с отступом от правого края */}
          <div className="relative">
            <select
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full appearance-none bg-[#141414] border border-[#262626] text-white text-xs font-medium py-2.5 pl-3 pr-9 rounded-xl focus:outline-none focus:border-[#CFFF76]"
            >
              {CITIES.map((c) => (
                <option key={c} value={c} className="bg-black text-white">{c}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-[#8E8E93]">
            Подробное описание
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Нюансы, комплект, состояние..."
            className="w-full bg-[#141414] border border-[#262626] text-white text-sm py-2 px-3 rounded-xl focus:outline-none focus:border-[#CFFF76] resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full py-3.5 bg-[#CFFF76] hover:bg-[#bce668] rounded-xl text-black font-extrabold text-sm shadow-md flex items-center justify-center disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {loading ? 'Публикация...' : 'Опубликовать для свопа'}
        </button>
      </form>
    </div>
  );
};


