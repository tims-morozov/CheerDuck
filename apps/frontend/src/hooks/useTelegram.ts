// Хук для безопасной работы с Telegram WebApp SDK
export function useTelegram() {
  const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;

  const haptic = {
    impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
      try {
        tg?.HapticFeedback?.impactOccurred(style);
      } catch (e) {
        // Игнорируем в браузере
      }
    },
    notification: (type: 'error' | 'success' | 'warning') => {
      try {
        tg?.HapticFeedback?.notificationOccurred(type);
      } catch (e) {
        // Игнорируем в браузере
      }
    },
    selection: () => {
      try {
        tg?.HapticFeedback?.selectionChanged();
      } catch (e) {
        // Игнорируем в браузере
      }
    },
  };

  const close = () => {
    tg?.close();
  };

  const ready = () => {
    tg?.ready();
    tg?.expand();
  };

  return {
    tg,
    user: tg?.initDataUnsafe?.user,
    haptic,
    close,
    ready,
  };
}
