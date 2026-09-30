import { AUFolder, PlatformTab } from '../../types';
import {
  INITIAL_TWITTER_DATA,
  INITIAL_INSTAGRAM_FEED_DATA,
  INITIAL_INSTAGRAM_STORY_DATA,
  INITIAL_INSTAGRAM_PROFILE_DATA,
  INITIAL_INSTAGRAM_LIVE_DATA,
  INITIAL_INSTAGRAM_NOTES_DATA,
  INITIAL_INSTAGRAM_ACTIVITY_DATA,
  INITIAL_INSTAGRAM_DM_DATA,
  INITIAL_INSTAGRAM_DM_INBOX_DATA,
  INITIAL_INSTAGRAM_STORY_REPLY_DATA,
  INITIAL_INSTAGRAM_STORY_VIEWERS_DATA,
  INITIAL_INSTAGRAM_FEED_COMMENTS_DATA,
  INITIAL_WHATSAPP_CHAT_DATA,
  INITIAL_WHATSAPP_CALL_DATA,
  INITIAL_WHATSAPP_STATUS_DATA,
  INITIAL_WHATSAPP_VIEWERS_DATA,
  INITIAL_TIKTOK_PROFILE_DATA,
  INITIAL_TIKTOK_FEED_LIVE_DATA,
  INITIAL_TIKTOK_FYP_DATA,
  INITIAL_IOS_LOCKSCREEN_DATA,
  INITIAL_LINE_CHAT_DATA,
  INITIAL_NOTES_DATA,
  INITIAL_PUSH_NOTIFICATION_DATA,
  INITIAL_SPOTIFY_DATA,
} from '../../data/defaultTemplates';
import { getStoredAuthUser } from '../../firebase';

export const STORAGE_RESET_KEY = 'au_hard_reset_v5';

export const getPlatformAndSubFeature = (tab: PlatformTab): { platform: string; subFeature: string } => {
  switch (tab) {
    case 'twitter':
      return { platform: 'x', subFeature: 'feed' };
    case 'instagram-feed':
      return { platform: 'instagram', subFeature: 'feed' };
    case 'instagram-feed-comments':
      return { platform: 'instagram', subFeature: 'feed-comments' };
    case 'instagram-story':
      return { platform: 'instagram', subFeature: 'story' };
    case 'instagram-story-reply':
      return { platform: 'instagram', subFeature: 'story-reply' };
    case 'instagram-story-viewers':
      return { platform: 'instagram', subFeature: 'story-viewers' };
    case 'instagram-profile':
      return { platform: 'instagram', subFeature: 'profile' };
    case 'instagram-live':
      return { platform: 'instagram', subFeature: 'live' };
    case 'instagram-notes':
      return { platform: 'instagram', subFeature: 'notes' };
    case 'instagram-activity':
      return { platform: 'instagram', subFeature: 'activity' };
    case 'instagram-dm-inbox':
      return { platform: 'instagram', subFeature: 'dm-inbox' };
    case 'instagram-dm':
      return { platform: 'instagram', subFeature: 'dm' };
    case 'whatsapp-chat':
      return { platform: 'whatsapp', subFeature: 'chat' };
    case 'whatsapp-call':
      return { platform: 'whatsapp', subFeature: 'call' };
    case 'whatsapp-status':
      return { platform: 'whatsapp', subFeature: 'status' };
    case 'whatsapp-viewers':
      return { platform: 'whatsapp', subFeature: 'viewers' };
    case 'tiktok-profile':
      return { platform: 'tiktok', subFeature: 'profile' };
    case 'tiktok-feed-live':
      return { platform: 'tiktok', subFeature: 'feed-live' };
    case 'tiktok-fyp':
      return { platform: 'tiktok', subFeature: 'fyp' };
    case 'ios-lockscreen':
      return { platform: 'ios', subFeature: 'lockscreen' };
    case 'line-chat':
      return { platform: 'line', subFeature: 'chat' };
    case 'notes':
      return { platform: 'notes', subFeature: 'notepad' };
    case 'push-notification':
      return { platform: 'notifications', subFeature: 'banner' };
    case 'spotify-card':
      return { platform: 'spotify', subFeature: 'card' };
    default:
      return { platform: 'custom', subFeature: tab };
  }
};

export const getFloatingPreviewTitle = (tab: PlatformTab): string => ({
  twitter: 'X / Twitter',
  'instagram-dm': 'Instagram DM',
  'instagram-feed': 'Instagram Feed',
  'instagram-story': 'Instagram Story',
  'whatsapp-chat': 'WhatsApp Chat',
  'line-chat': 'LINE Chat',
  notes: 'Notes',
  'push-notification': 'Notification',
  'spotify-card': 'Spotify',
} as Partial<Record<PlatformTab, string>>)[tab] || tab
  .split('-')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

export const getUserAccountStorageKey = (userOrEmail?: any): string => {
  let email = '';
  if (typeof userOrEmail === 'string') {
    email = userOrEmail;
  } else if (userOrEmail && typeof userOrEmail === 'object') {
    email = userOrEmail.uid || userOrEmail.email || '';
  }
  if (!email) {
    try {
      const stored = getStoredAuthUser();
      email = stored?.uid || stored?.email || '';
    } catch {}
  }
  if (!email) {
    try {
      const userEmail = localStorage.getItem('au_user_email');
      if (userEmail && userEmail.trim()) {
        email = userEmail.trim();
      } else {
        const code = localStorage.getItem('au_access_code');
        if (code) {
          email = `code_${code.trim()}`;
        }
      }
    } catch {}
  }
  const clean = (email || 'shared_user').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return `acc_${clean}`;
};

export const getLocalUpdateStorageKey = (userKey: string): string =>
  `au_last_local_update_time_${userKey.replace(/[^A-Za-z0-9_-]/g, '_')}`;

export const getPendingCloudSyncStorageKey = (userKey: string): string =>
  `au_pending_cloud_sync_${userKey.replace(/[^A-Za-z0-9_-]/g, '_')}`;

export const markLocalWorkspaceUpdated = (userKey: string): void => {
  try {
    localStorage.setItem(getLocalUpdateStorageKey(userKey), String(Date.now()));
    localStorage.setItem(getPendingCloudSyncStorageKey(userKey), 'true');
  } catch {}
};

export const clearPendingCloudSync = (userKey: string): void => {
  try { localStorage.removeItem(getPendingCloudSyncStorageKey(userKey)); } catch {}
};

export const getFormStorageKey = (userKey: string, tab: PlatformTab): string => {
  const cleanUser = userKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'default';
  const { platform, subFeature } = getPlatformAndSubFeature(tab);
  return `au_toolkit_${cleanUser}_${platform}_${subFeature}_form_data`;
};

export const getModuleFoldersKey = (userKey: string, tab: PlatformTab): string => {
  const cleanUser = userKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'default';
  return `au_folders_${cleanUser}_${tab}`;
};

export const getModuleActiveFolderKey = (userKey: string, tab: PlatformTab): string => {
  const cleanUser = userKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'default';
  return `au_active_folder_${cleanUser}_${tab}`;
};

export const getModuleFolderItemKey = (userKey: string, tab: PlatformTab, folderId: string): string => {
  const cleanUser = userKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'default';
  const cleanFolder = folderId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'folder-1';
  return `au_folder_${cleanUser}_${tab}_${cleanFolder}`;
};

export const getInitialTabData = (tab: PlatformTab): any => {
  let base: any;
  switch (tab) {
    case 'twitter': base = INITIAL_TWITTER_DATA; break;
    case 'instagram-feed': base = INITIAL_INSTAGRAM_FEED_DATA; break;
    case 'instagram-story': base = INITIAL_INSTAGRAM_STORY_DATA; break;
    case 'instagram-story-reply': base = INITIAL_INSTAGRAM_STORY_REPLY_DATA; break;
    case 'instagram-story-viewers': base = INITIAL_INSTAGRAM_STORY_VIEWERS_DATA; break;
    case 'instagram-profile': base = INITIAL_INSTAGRAM_PROFILE_DATA; break;
    case 'instagram-live': base = INITIAL_INSTAGRAM_LIVE_DATA; break;
    case 'instagram-notes': base = INITIAL_INSTAGRAM_NOTES_DATA; break;
    case 'instagram-activity': base = INITIAL_INSTAGRAM_ACTIVITY_DATA; break;
    case 'instagram-dm': base = INITIAL_INSTAGRAM_DM_DATA; break;
    case 'instagram-dm-inbox': base = INITIAL_INSTAGRAM_DM_INBOX_DATA; break;
    case 'instagram-feed-comments': base = INITIAL_INSTAGRAM_FEED_COMMENTS_DATA; break;
    case 'whatsapp-chat': base = INITIAL_WHATSAPP_CHAT_DATA; break;
    case 'whatsapp-call': base = INITIAL_WHATSAPP_CALL_DATA; break;
    case 'whatsapp-status': base = INITIAL_WHATSAPP_STATUS_DATA; break;
    case 'whatsapp-viewers': base = INITIAL_WHATSAPP_VIEWERS_DATA; break;
    case 'tiktok-profile': base = INITIAL_TIKTOK_PROFILE_DATA; break;
    case 'tiktok-feed-live': base = INITIAL_TIKTOK_FEED_LIVE_DATA; break;
    case 'tiktok-fyp': base = INITIAL_TIKTOK_FYP_DATA; break;
    case 'ios-lockscreen': base = INITIAL_IOS_LOCKSCREEN_DATA; break;
    case 'line-chat': base = INITIAL_LINE_CHAT_DATA; break;
    case 'notes': base = INITIAL_NOTES_DATA; break;
    case 'push-notification': base = INITIAL_PUSH_NOTIFICATION_DATA; break;
    case 'spotify-card': base = INITIAL_SPOTIFY_DATA; break;
    default: base = INITIAL_TWITTER_DATA;
  }
  return JSON.parse(JSON.stringify(base));
};

export const ALL_PLATFORM_TABS: PlatformTab[] = [
  'twitter',
  'instagram-feed',
  'instagram-feed-comments',
  'instagram-story',
  'instagram-story-reply',
  'instagram-story-viewers',
  'instagram-profile',
  'instagram-live',
  'instagram-notes',
  'instagram-activity',
  'instagram-dm-inbox',
  'instagram-dm',
  'whatsapp-chat',
  'whatsapp-status',
  'whatsapp-viewers',
  'whatsapp-call',
  'tiktok-profile',
  'tiktok-feed-live',
  'tiktok-fyp',
  'ios-lockscreen',
  'line-chat',
  'notes',
  'push-notification',
  'spotify-card',
];

export const loadStoredFormState = <T,>(userKey: string, tab: PlatformTab, defaultVal: T): T => {
  if (typeof window === 'undefined' || !window.localStorage) return JSON.parse(JSON.stringify(defaultVal));

  const isUserScoped = Boolean(userKey && userKey !== 'acc_shared_user' && userKey !== 'acc_default' && userKey !== 'anonymous_user');
  const folderKey = getModuleFoldersKey(userKey, tab);
  const activeKey = getModuleActiveFolderKey(userKey, tab);
  const folderCandidateKeys = isUserScoped
    ? [folderKey, `au_folders_${userKey}_${tab}`]
    : [
        folderKey,
        `au_folders_${userKey}_${tab}`,
        `au_folders_acc_shared_user_${tab}`,
        `au_folders_shared_user_${tab}`,
        `au_folders_default_${tab}`,
        `au_folders_${tab}`,
      ];

  for (const fk of folderCandidateKeys) {
    try {
      const raw = localStorage.getItem(fk);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const activeId = localStorage.getItem(activeKey) || parsed[0]?.id;
          const target = parsed.find((f: any) => f.id === activeId) || parsed[0];
          if (target && target.data && typeof target.data === 'object' && Object.keys(target.data).length > 0) {
            const data = { ...target.data };
            if (tab === 'spotify-card') {
              if (data.progressPercent === undefined) data.progressPercent = 51;
              if (data.volumePercent === undefined) data.volumePercent = 75;
              if (!['dark', 'pink', 'blue'].includes(data.theme)) data.theme = 'dark';
              data.style = 'blur';
            }
            return data;
          }
        }
      }
    } catch {}
  }

  const primaryKey = getFormStorageKey(userKey, tab);
  const { platform, subFeature } = getPlatformAndSubFeature(tab);
  const candidateKeys = isUserScoped
    ? [primaryKey, `au_toolkit_${userKey}_${platform}_${subFeature}_form_data`]
    : [
        primaryKey,
        `au_toolkit_${userKey}_${platform}_${subFeature}_form_data`,
        `au_toolkit_acc_shared_user_${platform}_${subFeature}_form_data`,
        `au_toolkit_shared_user_${platform}_${subFeature}_form_data`,
        `au_toolkit_default_${platform}_${subFeature}_form_data`,
        `au_toolkit_${platform}_${subFeature}_form_data`,
        `au_form_${tab}`,
      ];

  for (const candidateKey of candidateKeys) {
    try {
      const saved = localStorage.getItem(candidateKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          const data = { ...parsed };
          if (tab === 'spotify-card') {
            if (data.progressPercent === undefined) data.progressPercent = 51;
            if (data.volumePercent === undefined) data.volumePercent = 75;
            if (!['dark', 'pink', 'blue'].includes(data.theme)) data.theme = 'dark';
            data.style = 'blur';
          }
          return data;
        }
      }
    } catch {}
  }

  for (let fIdx = 1; fIdx <= 10; fIdx++) {
    try {
      const itemKey = getModuleFolderItemKey(userKey, tab, `folder-${fIdx}`);
      const itemRaw = localStorage.getItem(itemKey);
      if (itemRaw) {
        const itemParsed = JSON.parse(itemRaw);
        if (itemParsed?.data && typeof itemParsed.data === 'object' && Object.keys(itemParsed.data).length > 0) {
          return itemParsed.data;
        }
      }
    } catch {}
  }

  return JSON.parse(JSON.stringify(defaultVal));
};

export const loadAllStoredModuleFolders = (userKey: string, tabs: PlatformTab[]): Record<string, AUFolder[]> => {
  const result: Record<string, AUFolder[]> = {};
  if (typeof window === 'undefined' || !window.localStorage) {
    tabs.forEach((t) => {
      result[t] = [{ id: 'folder-1', name: 'Folder 1', data: getInitialTabData(t) }];
    });
    return result;
  }

  const isUserScoped = Boolean(userKey && userKey !== 'acc_shared_user' && userKey !== 'acc_default' && userKey !== 'anonymous_user');

  tabs.forEach((tab) => {
    let folders: AUFolder[] | null = null;
    const folderKey = getModuleFoldersKey(userKey, tab);
    const candidateKeys = isUserScoped
      ? [folderKey, `au_folders_${userKey}_${tab}`]
      : [
          folderKey,
          `au_folders_${userKey}_${tab}`,
          `au_folders_acc_shared_user_${tab}`,
          `au_folders_shared_user_${tab}`,
          `au_folders_default_${tab}`,
          `au_folders_${tab}`,
        ];

    for (const fKey of candidateKeys) {
      try {
        const saved = localStorage.getItem(fKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            folders = parsed.map((item: any, idx: number) => ({
              id: item.id || `folder-${idx + 1}`,
              name: item.name && item.name.trim() !== '' ? item.name : `Folder ${idx + 1}`,
              data: item.data || item.profileData || loadStoredFormState(userKey, tab, getInitialTabData(tab)),
            }));
            break;
          }
        }
      } catch {}
    }

    if (!folders || folders.length === 0) {
      const initialForm = loadStoredFormState(userKey, tab, getInitialTabData(tab));
      folders = [{ id: 'folder-1', name: 'Folder 1', data: initialForm }];
    }
    result[tab] = folders;
  });

  return result;
};

export const loadAllStoredActiveFolderIds = (userKey: string, tabs: PlatformTab[]): Record<string, string> => {
  const result: Record<string, string> = {};
  if (typeof window === 'undefined' || !window.localStorage) {
    tabs.forEach((t) => { result[t] = 'folder-1'; });
    return result;
  }

  const isUserScoped = Boolean(userKey && userKey !== 'acc_shared_user' && userKey !== 'acc_default' && userKey !== 'anonymous_user');

  tabs.forEach((tab) => {
    const activeKey = getModuleActiveFolderKey(userKey, tab);
    const candidates = isUserScoped
      ? [activeKey, `au_active_folder_${userKey}_${tab}`]
      : [
          activeKey,
          `au_active_folder_${userKey}_${tab}`,
          `au_active_folder_acc_shared_user_${tab}`,
          `au_active_folder_default_${tab}`,
          `au_active_folder_${tab}`,
        ];
    let activeId = 'folder-1';
    for (const aKey of candidates) {
      try {
        const saved = localStorage.getItem(aKey);
        if (saved && typeof saved === 'string' && saved.trim()) {
          activeId = saved.trim();
          break;
        }
      } catch {}
    }
    result[tab] = activeId;
  });
  return result;
};
