import React from 'react';
import type { AppLanguage } from '../../../context/LanguageContext';
import type { UiTheme } from '../../../context/ThemeContext';
import { isTabLive } from '../../../config/featureFlags';
import type { PlatformGroup, PlatformTab } from '../../../types';

type MobileView = 'editor' | 'preview';

interface SubFeatureNavigationProps {
  uiTheme: UiTheme;
  language: AppLanguage;
  activeCategory: PlatformGroup;
  activeTab: PlatformTab;
  setActiveTab: React.Dispatch<React.SetStateAction<PlatformTab>>;
  setMobileView: React.Dispatch<React.SetStateAction<MobileView>>;
}

interface SubFeatureItem {
  tab: PlatformTab;
  category: PlatformGroup;
  label: (language: AppLanguage) => string;
  isActive?: (activeTab: PlatformTab) => boolean;
  icon?: React.ReactNode;
}

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.627.627 0 0 1-.86.208c-2.355-1.439-5.318-1.764-8.81-.966a.627.627 0 1 1-.28-1.222c3.818-.872 7.098-.5 9.742 1.12.302.185.394.577.208.86zm1.226-2.723a.786.786 0 0 1-1.08.26c-2.695-1.656-6.804-2.135-9.992-1.167a.786.786 0 1 1-.462-1.502c3.642-1.107 8.188-.574 11.274 1.328.349.214.46.66.26 1.081zm.105-2.836C14.69 8.878 9.387 8.7 6.305 9.636a.944.944 0 0 1-.557-1.802c3.542-1.074 9.404-.863 13.14 1.355.424.251.564.799.312 1.223a.943.943 0 0 1-1.282.453z" />
  </svg>
);

const SUB_FEATURES: Record<PlatformGroup, SubFeatureItem[]> = {
  x: [
    { tab: 'twitter', category: 'x', label: (language) => language === 'id' ? 'Postingan / Feed' : 'Post / Feed' },
  ],
  instagram: [
    { tab: 'instagram-feed', category: 'instagram', label: (language) => language === 'id' ? 'Feed / Beranda' : 'Feed' },
    { tab: 'instagram-feed-comments', category: 'instagram', label: (language) => language === 'id' ? 'Komentar Feed' : 'Feed Comments' },
    {
      tab: 'instagram-story',
      category: 'instagram',
      label: (language) => language === 'id' ? 'Cerita' : 'Story',
      isActive: (activeTab) => activeTab === 'instagram-story' || activeTab === 'instagram-story-reply',
    },
    { tab: 'instagram-story-viewers', category: 'instagram', label: (language) => language === 'id' ? 'Penonton Story' : 'Story Viewers' },
    { tab: 'instagram-profile', category: 'instagram', label: (language) => language === 'id' ? 'Profil' : 'Profile' },
    { tab: 'instagram-live', category: 'instagram', label: () => 'Live' },
    { tab: 'instagram-notes', category: 'instagram', label: () => 'Notes' },
    { tab: 'instagram-activity', category: 'instagram', label: (language) => language === 'id' ? 'Aktivitas' : 'Activity' },
    { tab: 'instagram-dm', category: 'instagram', label: (language) => language === 'id' ? 'Pesan Langsung (DM)' : 'Direct Messages' },
    { tab: 'instagram-dm-inbox', category: 'instagram', label: () => 'DM Inbox' },
  ],
  whatsapp: [
    { tab: 'whatsapp-chat', category: 'whatsapp', label: (language) => language === 'id' ? 'Obrolan' : 'Chat' },
    { tab: 'whatsapp-call', category: 'whatsapp', label: (language) => language === 'id' ? 'Panggilan' : 'Call' },
    { tab: 'whatsapp-status', category: 'whatsapp', label: () => 'Status' },
    { tab: 'whatsapp-viewers', category: 'whatsapp', label: (language) => language === 'id' ? 'Penonton Status' : 'Status Viewers' },
  ],
  tiktok: [
    { tab: 'tiktok-profile', category: 'tiktok', label: (language) => language === 'id' ? 'Profil' : 'Profile' },
    { tab: 'tiktok-feed-live', category: 'tiktok', label: () => 'FYP Live' },
    { tab: 'tiktok-fyp', category: 'tiktok', label: (language) => language === 'id' ? 'Beranda FYP' : 'Home Page' },
  ],
  ios: [],
  line: [
    { tab: 'line-chat', category: 'line', label: () => 'LINE Chat' },
  ],
  notes: [
    { tab: 'notes', category: 'notes', label: (language) => language === 'id' ? 'Catatan' : 'Notes' },
  ],
  notifications: [
    { tab: 'push-notification', category: 'notifications', label: (language) => language === 'id' ? 'Banner Notifikasi Melayang' : 'Push Notification Banner' },
  ],
  spotify: [
    { tab: 'spotify-card', category: 'spotify', label: () => 'Spotify Player Card', icon: <SpotifyIcon /> },
  ],
};

const getFeatureLabel = (category: PlatformGroup, language: AppLanguage) => {
  const labels: Record<PlatformGroup, { en: string; id: string }> = {
    x: { en: 'X Features:', id: 'Fitur X:' },
    instagram: { en: 'Instagram Features:', id: 'Fitur Instagram:' },
    whatsapp: { en: 'WhatsApp Features:', id: 'Fitur WhatsApp:' },
    tiktok: { en: 'TikTok Features:', id: 'Fitur TikTok:' },
    ios: { en: 'iOS Features:', id: 'Fitur iOS:' },
    line: { en: 'LINE Features:', id: 'Fitur LINE:' },
    notes: { en: 'NOTES:', id: 'NOTES:' },
    notifications: { en: 'NOTIFICATION:', id: 'NOTIFICATION:' },
    spotify: { en: 'Spotify Features:', id: 'Fitur Spotify:' },
  };

  return labels[category][language];
};

export const SubFeatureNavigation: React.FC<SubFeatureNavigationProps> = ({
  uiTheme,
  language,
  activeCategory,
  activeTab,
  setActiveTab,
  setMobileView,
}) => (
  <div className={`mt-2.5 border-t pt-2 max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto ${
    uiTheme === 'dark' ? 'border-slate-800/80' : 'border-slate-200/80'
  }`}>
    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 mr-1.5">
      {getFeatureLabel(activeCategory, language)}
    </span>

    {SUB_FEATURES[activeCategory]
      .filter((item) => isTabLive(item.tab, item.category))
      .map((item) => {
        const isActive = item.isActive?.(activeTab) ?? activeTab === item.tab;

        return (
          <button
            key={item.tab}
            type="button"
            onClick={() => {
              setActiveTab(item.tab);
              setMobileView('editor');
            }}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              isActive
                ? 'bg-purple-600 text-white shadow-xs'
                : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {item.icon}
            <span>{item.label(language)}</span>
          </button>
        );
      })}
  </div>
);

