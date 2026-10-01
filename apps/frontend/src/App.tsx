import { useState, useEffect } from 'react';
import { Item } from './types';
import { Navigation, TabType } from './components/Navigation';
import { FeedPage } from './pages/FeedPage';
import { CreateItemPage } from './pages/CreateItemPage';
import { SwapsPage } from './pages/SwapsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { SwapModal } from './components/SwapModal';
import { OnboardingModal } from './components/OnboardingModal';
import { useTelegram } from './hooks/useTelegram';

export function App() {
  const { ready, user } = useTelegram();
  const [currentTab, setCurrentTab] = useState<TabType>('feed');
  const [selectedCity, setSelectedCity] = useState<string>('Все города');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [swapTargetItem, setSwapTargetItem] = useState<Item | null>(null);
  const [showRules, setShowRules] = useState<boolean>(false);

  useEffect(() => {
    ready();
    const seenRules = localStorage.getItem('cheerduck_seen_rules');
    if (!seenRules) {
      setShowRules(true);
      localStorage.setItem('cheerduck_seen_rules', 'true');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[var(--tg-color-bg)] text-[var(--tg-color-text)] flex flex-col font-sans">
      <main className="flex-1 w-full max-w-md mx-auto">
        {selectedItem ? (
          <ItemDetailPage
            item={selectedItem}
            onBack={() => setSelectedItem(null)}
            onOpenSwapModal={(item) => setSwapTargetItem(item)}
            currentUserId={user?.id}
          />
        ) : (
          <>
            {currentTab === 'feed' && (
              <FeedPage
                onSelectItem={(item) => setSelectedItem(item)}
                selectedCity={selectedCity}
                onCityChange={setSelectedCity}
              />
            )}

            {currentTab === 'create' && (
              <CreateItemPage
                defaultCity={selectedCity !== 'Все города' ? selectedCity : 'Москва'}
                onSuccess={() => setCurrentTab('feed')}
              />
            )}

            {currentTab === 'swaps' && <SwapsPage />}

            {currentTab === 'profile' && (
              <ProfilePage
                onShowRules={() => setShowRules(true)}
                onSelectItem={(item) => setSelectedItem(item)}
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
            setSelectedItem(null);
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
        }}
      />
    </div>
  );
}

export default App;
