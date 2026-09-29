import { PlatformGroup, PlatformTab } from '../types';

export type FeatureStatus = 'LIVE' | 'HIDDEN';

export interface FeatureFlagDefinition {
  key: string;
  name: string;
  description: string;
  category: PlatformGroup | 'system';
  status: FeatureStatus; // Default status in code
  type: 'category' | 'tab';
}

const STORAGE_KEY = 'app_feature_flags_v1';

/**
 * Master Developer Passcode for Feature Flag Manager
 * Change this value to update the developer access PIN.
 */
export const DEV_ADMIN_PIN = '91009141';

export function verifyAdminPin(inputPin: string): boolean {
  if (!inputPin) return false;
  return inputPin.trim() === DEV_ADMIN_PIN;
}

/**
 * Default Feature Flag Configuration
 * Set any feature to 'HIDDEN' here to keep it hidden in production by default.
 * Set to 'LIVE' to make it visible in the menu for all users.
 */
export const DEFAULT_FEATURE_FLAGS: Record<string, FeatureFlagDefinition> = {
  // --- Categories ---
  'category_x': {
    key: 'category_x',
    name: 'X (Twitter)',
    description: 'X / Twitter post and thread creator module',
    category: 'x',
    status: 'LIVE',
    type: 'category',
  },
  'category_instagram': {
    key: 'category_instagram',
    name: 'Instagram',
    description: 'Instagram Feed, Story, Profile, Notes, and DM module',
    category: 'instagram',
    status: 'LIVE',
    type: 'category',
  },
  'category_whatsapp': {
    key: 'category_whatsapp',
    name: 'WhatsApp',
    description: 'WhatsApp Chat and Call mock generator module',
    category: 'whatsapp',
    status: 'LIVE',
    type: 'category',
  },
  'category_tiktok': {
    key: 'category_tiktok',
    name: 'TikTok',
    description: 'TikTok Profile and Live stream creator module',
    category: 'tiktok',
    status: 'LIVE',
    type: 'category',
  },
  'category_ios': {
    key: 'category_ios',
    name: 'iOS Lockscreen',
    description: 'iOS Notification and Lockscreen creator module',
    category: 'ios',
    status: 'HIDDEN',
    type: 'category',
  },
  'category_line': {
    key: 'category_line',
    name: 'LINE Chat',
    description: 'LINE Messenger chat mock generator module',
    category: 'line',
    status: 'LIVE',
    type: 'category',
  },
  'category_notes': {
    key: 'category_notes',
    name: 'Notes',
    description: 'Notes and Notepad creator module',
    category: 'notes',
    status: 'LIVE',
    type: 'category',
  },
  'category_notifications': {
    key: 'category_notifications',
    name: 'Notification',
    description: 'Floating iOS push notification banner mockup module',
    category: 'notifications',
    status: 'LIVE',
    type: 'category',
  },
  'category_spotify': {
    key: 'category_spotify',
    name: 'Spotify',
    description: 'Aesthetic Spotify player card generator module',
    category: 'spotify',
    status: 'LIVE',
    type: 'category',
  },

  // --- Spotify Tab ---
  'tab_spotify-card': {
    key: 'tab_spotify-card',
    name: 'Spotify Card',
    description: 'Aesthetic Spotify music player card editor',
    category: 'spotify',
    status: 'LIVE',
    type: 'tab',
  },

  // --- Notes Tab ---
  'tab_notes': {
    key: 'tab_notes',
    name: 'Notes',
    description: 'Aesthetic notes and journal mockup editor',
    category: 'notes',
    status: 'LIVE',
    type: 'tab',
  },

  // --- Push Notification Tab ---
  'tab_push-notification': {
    key: 'tab_push-notification',
    name: 'Notification',
    description: 'iOS floating push notification banner editor',
    category: 'notifications',
    status: 'LIVE',
    type: 'tab',
  },

  // --- Instagram Tabs ---
  'tab_instagram-feed': {
    key: 'tab_instagram-feed',
    name: 'Feed / Post',
    description: 'Instagram main post feed mock editor',
    category: 'instagram',
    status: 'LIVE',
    type: 'tab',
  },
  'tab_instagram-feed-comments': {
    key: 'tab_instagram-feed-comments',
    name: 'Feed Comments',
    description: 'Instagram feed comments bottom sheet editor',
    category: 'instagram',
    status: 'LIVE',
    type: 'tab',
  },
  'tab_instagram-story': {
    key: 'tab_instagram-story',
    name: 'Story',
    description: 'Instagram story mock editor',
    category: 'instagram',
    status: 'LIVE',
    type: 'tab',
  },
  'tab_instagram-story-reply': {
    key: 'tab_instagram-story-reply',
    name: 'Story Reply',
    description: 'Instagram story reply screen editor',
    category: 'instagram',
    status: 'LIVE',
    type: 'tab',
  },
  'tab_instagram-story-viewers': {
    key: 'tab_instagram-story-viewers',
    name: 'Story Viewers',
    description: 'Instagram story viewer list editor',
    category: 'instagram',
    status: 'LIVE',
    type: 'tab',
  },
  'tab_instagram-profile': {
    key: 'tab_instagram-profile',
    name: 'Profile',
    description: 'Instagram profile page editor',
    category: 'instagram',
    status: 'LIVE',
    type: 'tab',
  },
  'tab_instagram-live': {
    key: 'tab_instagram-live',
    name: 'Live Stream',
    description: 'Instagram Live overlay editor',
    category: 'instagram',
    status: 'LIVE',
    type: 'tab',
  },
  'tab_instagram-notes': {
    key: 'tab_instagram-notes',
    name: 'Notes',
    description: 'Instagram DM Notes editor',
    category: 'instagram',
    status: 'LIVE',
    type: 'tab',
  },
  'tab_instagram-activity': {
    key: 'tab_instagram-activity',
    name: 'Activity / Notif',
    description: 'Instagram activity notification page editor',
    category: 'instagram',
    status: 'LIVE',
    type: 'tab',
  },
  'tab_instagram-dm-inbox': {
    key: 'tab_instagram-dm-inbox',
    name: 'Direct Messages (Inbox)',
    description: 'Instagram Direct Messages inbox and notes view editor',
    category: 'instagram',
    status: 'LIVE',
    type: 'tab',
  },
  'tab_instagram-dm': {
    key: 'tab_instagram-dm',
    name: 'Direct Message (DM Chat)',
    description: 'Instagram direct chat editor',
    category: 'instagram',
    status: 'LIVE',
    type: 'tab',
  },

  // --- WhatsApp Tabs ---
  'tab_whatsapp-chat': {
    key: 'tab_whatsapp-chat',
    name: 'Chat',
    description: 'WhatsApp direct chat message editor',
    category: 'whatsapp',
    status: 'LIVE',
    type: 'tab',
  },
  'tab_whatsapp-status': {
    key: 'tab_whatsapp-status',
    name: 'Status',
    description: 'WhatsApp status / story mockup generator',
    category: 'whatsapp',
    status: 'LIVE',
    type: 'tab',
  },
  'tab_whatsapp-viewers': {
    key: 'tab_whatsapp-viewers',
    name: 'Status Viewers',
    description: 'WhatsApp status viewers list mockup generator',
    category: 'whatsapp',
    status: 'LIVE',
    type: 'tab',
  },
  'tab_whatsapp-call': {
    key: 'tab_whatsapp-call',
    name: 'Call',
    description: 'WhatsApp call screen editor',
    category: 'whatsapp',
    status: 'LIVE',
    type: 'tab',
  },

  // --- TikTok Tabs ---
  'tab_tiktok-profile': {
    key: 'tab_tiktok-profile',
    name: 'Profile',
    description: 'TikTok profile page editor',
    category: 'tiktok',
    status: 'LIVE',
    type: 'tab',
  },
  'tab_tiktok-feed-live': {
    key: 'tab_tiktok-feed-live',
    name: 'FYP Live',
    description: 'TikTok live stream overlay editor',
    category: 'tiktok',
    status: 'LIVE',
    type: 'tab',
  },
  'tab_tiktok-fyp': {
    key: 'tab_tiktok-fyp',
    name: 'Home Page',
    description: 'TikTok FYP feed post mockup generator',
    category: 'tiktok',
    status: 'LIVE',
    type: 'tab',
  },

  // --- iOS Tabs ---
  'tab_ios-lockscreen': {
    key: 'tab_ios-lockscreen',
    name: 'iOS Lockscreen',
    description: 'iOS notification lockscreen editor',
    category: 'ios',
    status: 'HIDDEN',
    type: 'tab',
  },

  // --- LINE Tabs ---
  'tab_line-chat': {
    key: 'tab_line-chat',
    name: 'LINE Chat',
    description: 'LINE Messenger chat mock editor',
    category: 'line',
    status: 'LIVE',
    type: 'tab',
  },
};

/**
 * Get current feature flag statuses merging defaults with local storage overrides
 */
export function getFeatureFlags(): Record<string, FeatureStatus> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const initial: Record<string, FeatureStatus> = {};
      Object.keys(DEFAULT_FEATURE_FLAGS).forEach((k) => {
        initial[k] = DEFAULT_FEATURE_FLAGS[k].status;
      });
      return initial;
    }
    const parsed = JSON.parse(stored) as Record<string, FeatureStatus>;
    const result: Record<string, FeatureStatus> = {};
    Object.keys(DEFAULT_FEATURE_FLAGS).forEach((k) => {
      result[k] = parsed[k] || DEFAULT_FEATURE_FLAGS[k].status;
    });
    return result;
  } catch (err) {
    console.warn('Failed to read feature flags from localStorage:', err);
    const fallback: Record<string, FeatureStatus> = {};
    Object.keys(DEFAULT_FEATURE_FLAGS).forEach((k) => {
      fallback[k] = DEFAULT_FEATURE_FLAGS[k].status;
    });
    return fallback;
  }
}

/**
 * Check if a specific feature flag key is LIVE
 */
export function isFeatureLive(flagKey: string): boolean {
  const flags = getFeatureFlags();
  return flags[flagKey] === 'LIVE';
}

/**
 * Check if a category module is LIVE
 */
export function isCategoryLive(category: PlatformGroup): boolean {
  return isFeatureLive(`category_${category}`);
}

/**
 * Check if a sub-feature tab is LIVE (both category and tab must be LIVE)
 */
export function isTabLive(tab: PlatformTab, category?: PlatformGroup): boolean {
  const tabFlag = isFeatureLive(`tab_${tab}`);
  if (!tabFlag) return false;

  if (category) {
    return isCategoryLive(category);
  }
  return true;
}

/**
 * Get all LIVE categories
 */
export function getLiveCategories(): PlatformGroup[] {
  const allCategories: PlatformGroup[] = ['x', 'instagram', 'whatsapp', 'tiktok', 'ios', 'line', 'notes', 'notifications', 'spotify'];
  return allCategories.filter((cat) => isCategoryLive(cat));
}

/**
 * Map of tabs per category
 */
export const CATEGORY_TABS_MAP: Record<PlatformGroup, PlatformTab[]> = {
  x: ['twitter'],
  instagram: [
    'instagram-feed',
    'instagram-feed-comments',
    'instagram-story',
    'instagram-story-reply',
    'instagram-story-viewers',
    'instagram-profile',
    'instagram-live',
    'instagram-notes',
    'instagram-activity',
    'instagram-dm',
    'instagram-dm-inbox',
  ],
  whatsapp: ['whatsapp-chat', 'whatsapp-status', 'whatsapp-viewers', 'whatsapp-call'],
  tiktok: ['tiktok-profile', 'tiktok-feed-live', 'tiktok-fyp'],
  ios: ['ios-lockscreen'],
  line: ['line-chat'],
  notes: ['notes'],
  notifications: ['push-notification'],
  spotify: ['spotify-card'],
};

/**
 * Get category for any platform tab
 */
export function getCategoryForTab(tab: PlatformTab): PlatformGroup {
  for (const [cat, tabs] of Object.entries(CATEGORY_TABS_MAP)) {
    if ((tabs as PlatformTab[]).includes(tab)) {
      return cat as PlatformGroup;
    }
  }
  return 'instagram';
}

/**
 * Get all LIVE tabs for a category
 */
export function getLiveTabsForCategory(category: PlatformGroup): PlatformTab[] {
  if (!isCategoryLive(category)) return [];
  const tabs = CATEGORY_TABS_MAP[category] || [];
  return tabs.filter((t) => isTabLive(t, category));
}

/**
 * Get the first LIVE tab for a category
 */
export function getFirstLiveTabForCategory(category: PlatformGroup): PlatformTab | null {
  const liveTabs = getLiveTabsForCategory(category);
  return liveTabs.length > 0 ? liveTabs[0] : null;
}

/**
 * Update a specific feature flag status
 */
export function setFeatureFlag(flagKey: string, status: FeatureStatus): void {
  try {
    const current = getFeatureFlags();
    current[flagKey] = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('feature_flags_updated'));
  } catch (err) {
    console.error('Failed to set feature flag:', err);
  }
}

/**
 * Reset all feature flags to code defaults
 */
export function resetFeatureFlags(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('feature_flags_updated'));
  } catch (err) {
    console.error('Failed to reset feature flags:', err);
  }
}
