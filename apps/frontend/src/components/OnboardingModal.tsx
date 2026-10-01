import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CheerDuckLogo } from './CheerDuckLogo';

interface OnboardingModalProps {
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 text-left">
      <div className="bg-[#141414] w-full max-w-sm rounded-xl p-6 border border-[#262626] shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        <div className="w-14 h-14 bg-black rounded-lg flex items-center justify-center border border-[#262626] mb-4">
          <CheerDuckLogo size={42} />
        </div>

        <h2 className="mb-1 text-white">Правила свопа CheerDuck</h2>
        <p className="text-[#8E8E93] mb-5">
          Безопасный и осознанный обмен вещами без денег
        </p>

        <div className="space-y-4 mb-6 text-zinc-300">
          <div className="flex items-start gap-3">
            <span className="font-heading text-p text-[#CFFF76]">01</span>
            <p>
              <strong className="text-white block mb-0.5">Честные фото и состояние</strong>
              Фотографируйте реальные предметы и честно описывайте все нюансы.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="font-heading text-p text-[#CFFF76]">02</span>
            <p>
              <strong className="text-white block mb-0.5">Защита личных данных</strong>
              Ваш Telegram контакт откроется собеседнику только после взаимного согласия на обмен.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="font-heading text-p text-[#CFFF76]">03</span>
            <p>
              <strong className="text-white block mb-0.5">Безопасная встреча</strong>
              Встречайтесь для передачи вещей в светлых и людных местах или отправляйте проверенной доставкой.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-[#CFFF76] hover:bg-[#bce668] text-black font-extrabold rounded-md text-sm shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <span>Понятно, к обменам</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

