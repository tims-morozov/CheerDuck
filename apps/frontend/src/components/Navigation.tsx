import React from 'react';
import { Home, PlusCircle, ArrowLeftRight, User } from 'lucide-react';

export type TabType = 'feed' | 'create' | 'swaps' | 'profile';

interface NavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  unreadCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  unreadCount = 0,
}) => {
  const tabs = [
    { id: 'feed' as TabType, label: 'Лента', icon: Home },
    { id: 'create' as TabType, label: 'Добавить', icon: PlusCircle },
    { id: 'swaps' as TabType, label: 'Свопы', icon: ArrowLeftRight, badge: unreadCount },
    { id: 'profile' as TabType, label: 'Профиль', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-md border-t border-[#262626] pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-[#CFFF76] font-semibold'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

