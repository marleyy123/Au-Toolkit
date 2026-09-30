import { useEffect, useState } from 'react';
import { PlatformGroup, PlatformTab } from '../../../types';
import {
  getCategoryForTab,
  getFirstLiveTabForCategory,
  getLiveCategories,
  isCategoryLive,
  isTabLive,
} from '../../../config/featureFlags';
import { ALL_PLATFORM_TABS } from '../workspaceStorage';

interface UseWorkspaceNavigationStateArgs {
  featureFlagsVersion: number;
}

function getInitialCategory(activeTab: PlatformTab): PlatformGroup {
  try {
    const savedCategory = localStorage.getItem('au_last_active_category') as PlatformGroup;
    if (savedCategory) return savedCategory;
  } catch {}
  if (activeTab === 'twitter') return 'x';
  if (activeTab === 'whatsapp-chat' || activeTab === 'whatsapp-call' || activeTab === 'whatsapp-status' || activeTab === 'whatsapp-viewers') return 'whatsapp';
  if (activeTab === 'tiktok-profile' || activeTab === 'tiktok-feed-live' || activeTab === 'tiktok-fyp') return 'tiktok';
  if (activeTab === 'ios-lockscreen') return 'ios';
  if (activeTab === 'line-chat') return 'line';
  if (activeTab === 'notes') return 'notes';
  if (activeTab === 'push-notification') return 'notifications';
  if (activeTab === 'spotify-card') return 'spotify';
  return 'instagram';
}

export function useWorkspaceNavigationState({
  featureFlagsVersion,
}: UseWorkspaceNavigationStateArgs) {
  const [activeTab, setActiveTab] = useState<PlatformTab>(() => {
    try {
      const saved = localStorage.getItem('au_last_active_tab') as PlatformTab;
      if (saved && ALL_PLATFORM_TABS.includes(saved)) {
        return saved;
      }
    } catch {}
    return 'twitter';
  });

  const [activeCategory, setActiveCategory] = useState<PlatformGroup>(() => getInitialCategory(activeTab));

  useEffect(() => {
    try {
      localStorage.setItem('au_last_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('au_last_active_category', activeCategory);
    } catch {}
  }, [activeCategory]);

  useEffect(() => {
    setActiveCategory(getCategoryForTab(activeTab));
  }, [activeTab]);

  useEffect(() => {
    const expectedCategory = getCategoryForTab(activeTab);
    if (activeCategory !== expectedCategory && isCategoryLive(expectedCategory)) {
      setActiveCategory(expectedCategory);
      return;
    }

    const liveCategories = getLiveCategories();
    if (liveCategories.length === 0) return;

    if (!isCategoryLive(activeCategory)) {
      const fallbackCategory = liveCategories[0];
      setActiveCategory(fallbackCategory);
      const fallbackTab = getFirstLiveTabForCategory(fallbackCategory);
      if (fallbackTab) {
        setActiveTab(fallbackTab);
      }
    } else if (!isTabLive(activeTab, activeCategory)) {
      const fallbackTab = getFirstLiveTabForCategory(activeCategory);
      if (fallbackTab) {
        setActiveTab(fallbackTab);
      } else if (liveCategories.length > 0) {
        const fallbackCategory = liveCategories[0];
        setActiveCategory(fallbackCategory);
        const fbTab = getFirstLiveTabForCategory(fallbackCategory);
        if (fbTab) setActiveTab(fbTab);
      }
    }
  }, [activeCategory, activeTab, featureFlagsVersion]);

  return {
    activeTab,
    setActiveTab,
    activeCategory,
    setActiveCategory,
  };
}
