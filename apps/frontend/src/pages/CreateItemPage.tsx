import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { useTelegram } from '../hooks/useTelegram';
import { Camera, ChevronDown, X } from 'lucide-react';

const CONDITIONS = ['Новое', 'Отличное', 'Хорошее', 'С нюансами'];
const CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск'];
// Максимум фото на один предмет (минимум — 1, проверяется при публикации)
const MAX_PHOTOS = 5;

// Выбранный для загрузки файл вместе со своим blob-превью
interface PhotoItem {
  file: File;
  preview: string;
}

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
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Актуальный список фото — нужен, чтобы освободить blob-превью при размонтировании страницы
  const photosRef = useRef<PhotoItem[]>([]);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview));
    };
  }, []);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    // Сбрасываем input, чтобы можно было повторно выбрать тот же самый файл
    e.target.value = '';
    if (selected.length === 0) return;

    if (photos.length + selected.length > MAX_PHOTOS) {
      setError(`Можно добавить не более ${MAX_PHOTOS} фото`);
      haptic.notification('warning');
      return;
    }

    setError('');
    setPhotos((prev) => [
      ...prev,
      ...selected.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Фото — обязательное поле: минимум 1, максимум MAX_PHOTOS.
    // Селекты «Состояние» и «Город обмена» всегда имеют значение (дефолт),
    // поэтому отдельной проверки на пустоту им не нужно.
    if (photos.length === 0) {
      setError('Добавьте хотя бы одно фото');
      haptic.notification('warning');
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError('Заполните название и описание лота');
      haptic.notification('warning');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Сначала загружаем файлы на сервер, затем публикуем лот со ссылками на них
      const imageUrls = await api.uploadImages(photos.map((photo) => photo.file));

      await api.createItem({
        title,
        description,
        condition,
        city,
        images: imageUrls,
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

  // Пока фото нет — кнопка выбора занимает всю ширину и заметно выше строки поля,
  // после первого фото она сжимается до габаритов обычного поля формы (см. разметку ниже)
  const hasPhotos = photos.length > 0;

  return (
    <div className="pb-28 pt-3 px-4 max-w-md mx-auto w-full text-left bg-black text-white">
      <h1 className="mb-1 text-white">Добавьте предмет</h1>
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
            Фото предмета
          </label>
          {/* Пока фото нет — кнопка выбора файлов на всю ширину и выше обычного поля.
              После первого фото миниатюры идут в один ряд: колонок ровно столько,
              сколько максимум фото, поэтому все фото помещаются в одну строку
              и форма не растягивается по высоте.
              Число в grid-cols-5 задано литералом (Tailwind не собирает классы
              из переменных) и должно совпадать с MAX_PHOTOS.
              Пропорция aspect-square та же, что у фото в ленте (ItemCard) и в карточке предмета */}
          <div className="flex flex-col gap-2.5">
            {hasPhotos && (
              <div className="grid grid-cols-5 gap-2">
                {photos.map((photo, index) => (
                  <div
                    key={photo.preview}
                    className="relative w-full aspect-square rounded-lg overflow-hidden border border-[#262626] bg-[#141414]"
                  >
                    <img
                      src={photo.preview}
                      alt={`Фото ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      aria-label="Удалить фото"
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 border border-[#262626] flex items-center justify-center text-white active:scale-95 transition-transform"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Пустое состояние — большая карточка на всю ширину,
                с первым фото — компактная строка в габаритах остальных полей формы */}
            {photos.length < MAX_PHOTOS && (
              <label
                className={`w-full rounded-xl border border-dashed border-[#3A3A3A] bg-[#141414] flex items-center justify-center text-[#8E8E93] cursor-pointer hover:border-[#CFFF76] hover:text-[#CFFF76] transition-colors ${
                  hasPhotos ? 'gap-2 py-2.5' : 'h-32 flex-col gap-1'
                }`}
              >
                <Camera className={hasPhotos ? 'w-4 h-4' : 'w-5 h-5'} />
                <span className="text-xs font-semibold">
                  {hasPhotos ? 'Добавить еще фото' : 'Добавить фото'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFilesSelected}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-[#8E8E93]">
            От 1 до {MAX_PHOTOS} фото · JPEG, PNG, WEBP, GIF
          </p>
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


