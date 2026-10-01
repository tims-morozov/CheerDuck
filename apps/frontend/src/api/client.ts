import { Item, SwapOffer, User } from '../types';

const API_BASE = '/api/v1';

interface UploadResponse {
  urls: string[];
}

// Получаем строку initData от Telegram WebApp (если запущено внутри Telegram)
function getTelegramInitData(): string {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
    return (window as any).Telegram.WebApp.initData;
  }
  return '';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const initData = getTelegramInitData();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (initData) {
    headers['Authorization'] = `tma ${initData}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Ошибка запроса (${response.status})`);
  }

  return response.json();
}

export const api = {
  // Профиль
  getMe: () => request<User>('/users/me'),
  updateCity: (city: string) =>
    request<User>('/users/me/city', {
      method: 'PATCH',
      body: JSON.stringify({ city }),
    }),

  // Предметы
  getFeed: (city?: string) => {
    const params = new URLSearchParams();
    if (city && city !== 'Все города') params.append('city', city);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Item[]>(`/items/feed${query}`);
  },
  getMyItems: () => request<Item[]>('/items/my'),
  getItem: (id: number) => request<Item>(`/items/${id}`),
  createItem: (data: Omit<Item, 'id' | 'user_id' | 'status' | 'created_at' | 'owner' | 'wishlist'>) =>
    request<Item>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateItem: (id: number, data: Omit<Item, 'id' | 'user_id' | 'status' | 'created_at' | 'owner' | 'wishlist'>) =>
    request<Item>(`/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteItem: (id: number) =>
    request<{ status: string }>(`/items/${id}`, {
      method: 'DELETE',
    }),

  // Загрузка фото предмета (до 5 файлов за раз) — возвращает относительные URL
  uploadImages: async (files: File[]): Promise<string[]> => {
    const initData = getTelegramInitData();
    const headers: Record<string, string> = {};
    if (initData) {
      headers['Authorization'] = `tma ${initData}`;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    // Content-Type НЕ задаём вручную: браузер сам добавит multipart/form-data с boundary
    const response = await fetch(`${API_BASE}/uploads`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Ошибка загрузки фото (${response.status})`);
    }

    const data: UploadResponse = await response.json();
    return data.urls;
  },

  // Обмены
  getMySwaps: (type: 'incoming' | 'outgoing') =>
    request<SwapOffer[]>(`/swaps?offer_type=${type}`),
  createSwap: (data: { offered_item_id: number; target_item_id: number; comment?: string }) =>
    request<SwapOffer>('/swaps', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  respondToSwap: (offerId: number, accept: boolean) =>
    request<SwapOffer>(`/swaps/${offerId}/respond?accept=${accept}`, {
      method: 'POST',
    }),
};
