import { useState, useEffect } from 'react';
import { Item, SwapOffer } from './types';
import { Navigation, TabType } from './components/Navigation';
import { FeedPage } from './pages/FeedPage';
import { CreateItemPage } from './pages/CreateItemPage';
import { SwapsPage } from './pages/SwapsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { SwapModal } from './components/SwapModal';
import { OnboardingModal } from './components/OnboardingModal';
import { useTelegram } from './hooks/useTelegram';
import { api } from './api/client';

export function App() {
  const { ready } = useTelegram();
  const [currentTab, setCurrentTab] = useState<TabType>('feed');
  const [selectedCity, setSelectedCity] = useState<string>('Все города');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [swapTargetItem, setSwapTargetItem] = useState<Item | null>(null);
  // Оффер входящего свопа, из которого открыли карточку предмета: позволяет
  // показать в карточке кнопку «Принять своп» вместо «Предложить своп».
  const [activeSwapOffer, setActiveSwapOffer] = useState<SwapOffer | null>(null);
  const [showRules, setShowRules] = useState<boolean>(false);
  // Идентификатор текущего пользователя берём с бэкенда (GET /users/me), а не из
  // сырого tg.initDataUnsafe.user.id: сервер в DEBUG-режиме отдаёт тестового
  // пользователя (id=99999999), и только этот id совпадает с item.user_id
  // опубликованных лотов. Иначе «свой лот» не определяется.
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);

  useEffect(() => {
    ready();
    api.getMe()
      .then((me) => setCurrentUserId(me.id))
      .catch(() => {
        // Профиль недоступен — определение «своего лота» останется ложным
      });
    const seenRules = localStorage.getItem('cheerduck_seen_rules');
    if (!seenRules) {
      setShowRules(true);
      localStorage.setItem('cheerduck_seen_rules', 'true');
    }
  }, []);

  // Открытие карточки предмета. Из свопов вместе с лотом приходит оффер —
  // тогда карточка знает, что можно принять предложение прямо в ней.
  const handleSelectItem = (item: Item, offer?: SwapOffer) => {
    setSelectedItem(item);
    setActiveSwapOffer(offer ?? null);
  };

  const closeItemDetail = () => {
    setSelectedItem(null);
    setActiveSwapOffer(null);
  };

  // Принять входящий своп прямо из карточки предмета: после ответа возвращаем
  // пользователя в список обменов — SwapsPage монтируется заново и обновляет данные.
  const handleAcceptSwap = async (offerId: number) => {
    await api.respondToSwap(offerId, true);
    closeItemDetail();
    setCurrentTab('swaps');
  };

  return (
    <div className="min-h-screen bg-[var(--tg-color-bg)] text-[var(--tg-color-text)] flex flex-col font-sans">
      <main className="flex-1 w-full max-w-md mx-auto">
        {editingItem ? (
          <CreateItemPage
            editItem={editingItem}
            defaultCity={editingItem.city || 'Москва'}
            onCancel={() => setEditingItem(null)}
            onSuccess={() => setEditingItem(null)}
          />
        ) : selectedItem ? (
          <ItemDetailPage
            item={selectedItem}
            onBack={closeItemDetail}
            onOpenSwapModal={(item) => setSwapTargetItem(item)}
            currentUserId={currentUserId}
            onDeleted={closeItemDetail}
            activeOffer={activeSwapOffer}
            onAcceptSwap={handleAcceptSwap}
          />
        ) : (
          <>
            {currentTab === 'feed' && (
              <FeedPage
                onSelectItem={handleSelectItem}
                selectedCity={selectedCity}
                onCityChange={setSelectedCity}
                currentUserId={currentUserId}
              />
            )}

            {currentTab === 'create' && (
              <CreateItemPage
                defaultCity={selectedCity !== 'Все города' ? selectedCity : 'Москва'}
                onSuccess={() => setCurrentTab('feed')}
              />
            )}

            {currentTab === 'swaps' && (
              <SwapsPage onSelectItem={handleSelectItem} />
            )}

            {currentTab === 'profile' && (
              <ProfilePage
                onShowRules={() => setShowRules(true)}
                onSelectItem={handleSelectItem}
                onEditItem={(item) => setEditingItem(item)}
              />
            )}
          </>
        )}
      </main>

      {swapTargetItem && (
        <SwapModal
          targetItem={swapTargetItem}
          onClose={() => setSwapTargetItem(null)}
          onSuccess={() => {
            setSwapTargetItem(null);
            closeItemDetail();
            setCurrentTab('swaps');
          }}
        />
      )}

      {showRules && <OnboardingModal onClose={() => setShowRules(false)} />}

      <Navigation
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setSelectedItem(null);
          setActiveSwapOffer(null);
        }}
      />
    </div>
  );
}

export default App;
