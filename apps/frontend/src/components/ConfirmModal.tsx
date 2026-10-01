import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Универсальная модалка подтверждения для необратимых действий (например, удаления).
 * Стилистически повторяет остальные оверлеи приложения (SwapModal и т.п.).
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmLabel,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141414] w-full max-w-sm rounded-2xl p-5 text-left border border-[#262626] shadow-2xl text-white">
        <h2 className="flex items-center gap-2 text-white mb-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" /> {title}
        </h2>
        <p className="text-xs text-[#8E8E93] leading-relaxed mb-5">{message}</p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="py-3 rounded-xl bg-[#1A1A1A] border border-[#262626] text-xs font-semibold text-white hover:border-zinc-500 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-extrabold active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {loading ? 'Удаление...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
