import React from 'react';
import type { AppLanguage } from '../../../context/LanguageContext';
import type { UiTheme } from '../../../context/ThemeContext';
import { getFirstLiveTabForCategory, isCategoryLive, isTabLive } from '../../../config/featureFlags';
import type { PlatformGroup, PlatformTab } from '../../../types';

type MobileView = 'editor' | 'preview';

interface PlatformCategoryNavProps {
  uiTheme: UiTheme;
  activeCategory: PlatformGroup;
  activeTab: PlatformTab;
  setActiveCategory: React.Dispatch<React.SetStateAction<PlatformGroup>>;
  setActiveTab: React.Dispatch<React.SetStateAction<PlatformTab>>;
  setMobileView: React.Dispatch<React.SetStateAction<MobileView>>;
}

interface CategoryItem {
  category: PlatformGroup;
  label: string;
  fallbackTab: PlatformTab;
  shouldKeepActiveTab?: (activeTab: PlatformTab) => boolean;
}

const CATEGORY_ITEMS: CategoryItem[] = [
  { category: 'x', label: 'X (Twitter)', fallbackTab: 'twitter' },
  {
    category: 'instagram',
    label: 'Instagram',
    fallbackTab: 'instagram-feed',
    shouldKeepActiveTab: (activeTab) => activeTab.startsWith('instagram') && isTabLive(activeTab, 'instagram'),
  },
  { category: 'whatsapp', label: 'WhatsApp', fallbackTab: 'whatsapp-chat' },
  { category: 'tiktok', label: 'TikTok', fallbackTab: 'tiktok-profile' },
  { category: 'line', label: 'LINE', fallbackTab: 'line-chat' },
  { category: 'notes', label: 'Notes', fallbackTab: 'notes' },
  { category: 'notifications', label: 'Notification', fallbackTab: 'push-notification' },
  { category: 'spotify', label: 'Spotify', fallbackTab: 'spotify-card' },
];

export const PlatformCategoryNav: React.FC<PlatformCategoryNavProps> = ({
  uiTheme,
  activeCategory,
  activeTab,
  setActiveCategory,
  setActiveTab,
  setMobileView,
}) => {
  const handleCategoryClick = (item: CategoryItem) => {
    setActiveCategory(item.category);
    if (!item.shouldKeepActiveTab?.(activeTab)) {
      setActiveTab(getFirstLiveTabForCategory(item.category) || item.fallbackTab);
    }
    setMobileView('editor');
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto max-w-full scrollbar-none py-0.5 shrink-0 flex-nowrap">
      <div className={`flex items-center p-1 rounded-xl border text-xs font-bold shrink-0 flex-nowrap gap-1 ${
        uiTheme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        {CATEGORY_ITEMS.filter((item) => isCategoryLive(item.category)).map((item) => (
          <button
            key={item.category}
            type="button"
            onClick={() => handleCategoryClick(item)}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 ${
              activeCategory === item.category
                ? 'bg-purple-600 text-white shadow-md'
                : uiTheme === 'dark'
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

