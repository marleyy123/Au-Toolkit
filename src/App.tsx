import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PlatformTab, PlatformGroup, TwitterPostData, InstagramFeedData, InstagramStoryData, InstagramProfileData, InstagramLiveData, InstagramNotesData, InstagramActivityData, InstagramDMData, InstagramDMInboxData, InstagramStoryReplyData, InstagramStoryViewersData, InstagramFeedCommentsData, WhatsAppChatData, WhatsAppCallData, WhatsAppStatusData, WhatsAppViewersData, TikTokProfileData, TikTokFeedLiveData, TikTokFypData, IOSLockscreenData, LineChatData, CharacterPreset, AUFolder, NotesData, PushNotificationData, SpotifyData, ViewportTransform } from './types';
import { DEFAULT_AVATAR, INITIAL_TWITTER_DATA, INITIAL_INSTAGRAM_FEED_DATA, INITIAL_INSTAGRAM_STORY_DATA, INITIAL_INSTAGRAM_PROFILE_DATA, INITIAL_INSTAGRAM_LIVE_DATA, INITIAL_INSTAGRAM_NOTES_DATA, INITIAL_INSTAGRAM_ACTIVITY_DATA, INITIAL_INSTAGRAM_DM_DATA, INITIAL_INSTAGRAM_DM_INBOX_DATA, INITIAL_INSTAGRAM_STORY_REPLY_DATA, INITIAL_INSTAGRAM_STORY_VIEWERS_DATA, INITIAL_INSTAGRAM_FEED_COMMENTS_DATA, INITIAL_WHATSAPP_CHAT_DATA, INITIAL_WHATSAPP_CALL_DATA, INITIAL_WHATSAPP_STATUS_DATA, INITIAL_WHATSAPP_VIEWERS_DATA, INITIAL_TIKTOK_PROFILE_DATA, INITIAL_TIKTOK_FEED_LIVE_DATA, INITIAL_TIKTOK_FYP_DATA, INITIAL_IOS_LOCKSCREEN_DATA, INITIAL_LINE_CHAT_DATA, INITIAL_NOTES_DATA, INITIAL_PUSH_NOTIFICATION_DATA, INITIAL_SPOTIFY_DATA } from './data/defaultTemplates';
import { PreviewRegistry } from './export/PreviewRegistry';
import { MobileFloatingPreview } from './components/MobileFloatingPreview';
import { TwitterForm } from './components/TwitterForm';
import { InstagramFeedForm } from './components/InstagramFeedForm';
import { InstagramStoryForm } from './components/InstagramStoryForm';
import { InstagramStoryReplyForm } from './components/InstagramStoryReplyForm';
import { InstagramStoryViewersForm } from './components/InstagramStoryViewersForm';
import { InstagramProfileForm } from './components/InstagramProfileForm';
import { InstagramLiveForm } from './components/InstagramLiveForm';
import { InstagramNotesForm } from './components/InstagramNotesForm';
import { InstagramActivityForm } from './components/InstagramActivityForm';
import { InstagramDMForm } from './components/InstagramDMForm';
import { InstagramDMInboxForm } from './components/InstagramDMInboxForm';
import { InstagramFeedCommentsForm } from './components/InstagramFeedCommentsForm';
import { WhatsAppChatForm } from './components/WhatsAppChatForm';
import { WhatsAppCallForm } from './components/WhatsAppCallForm';
import { WhatsAppStatusForm } from './components/WhatsAppStatusForm';
import { WhatsAppViewersForm } from './components/WhatsAppViewersForm';
import { TikTokProfileForm } from './components/TikTokProfileForm';
import { TikTokFeedLiveForm } from './components/TikTokFeedLiveForm';
import { TikTokFypForm } from './components/TikTokFypForm';
import { IOSLockscreenForm } from './components/IOSLockscreenForm';
import { LineChatForm } from './components/LineChatForm';
import { NotesForm } from './components/NotesForm';
import { PushNotificationForm } from './components/PushNotificationForm';
import { SpotifyPlayerForm } from './components/SpotifyPlayerForm';
import { GlobalFontManager, FontOptionKey, getFontCssValue, FONT_OPTIONS, injectGlobalCustomFonts } from './components/GlobalFontManager';
import { Login } from './components/Login';
import { AccountPasswordModal } from './components/AccountPasswordModal';
import { downloadElementAsPng, downloadElementAsJpg, copyElementToClipboard, exportPreviewToPNG } from './utils/exportUtils';
import { XLogo, VerifiedBadgeBlue, InstagramVerifiedBadge } from './components/Icons';
import { Download, Copy, Sparkles, RefreshCw, Check, CheckCircle2, AlertCircle, Loader2, Smartphone, Monitor, Eye, Sun, Moon, LogOut, KeyRound, Ticket, User, Plus, ZoomIn, ZoomOut, RotateCcw, Maximize2, PictureInPicture2, Square, Trash2, AlertTriangle, Globe, Languages, Cloud, CloudOff, Upload, Move, Hand, Lock, Unlock, X } from 'lucide-react';
import {
  clearAllFirebaseData,
  clearWorkspaceFingerprintCache,
  signInWithGoogle,
  signOutUser,
  onAuthUserChanged,
  getStoredAuthUser,
  setStoredAuthUser,
  saveUserWorkspaceToFirestore,
  loadUserWorkspaceFromFirestore,
  subscribeUserWorkspaceFromFirestore,
  syncFolderToFirestore,
  deleteFolderFromFirestore,
  loadFoldersFromFirestore,
  flushPendingWorkspaceSaves,
  getUserDocumentId,
  isFirestoreQuotaExhausted,
  onQuotaStatusChange,
  resetFirestoreQuotaCircuitBreaker,
  auth,
} from './firebase';
import {
  detectDeviceSlot,
  getDeviceFriendlyLabel,
  verifyAndRegisterDevice,
  subscribeDeviceSlotSession,
} from './utils/deviceAuthService';
import {
  checkBuyerEntitlement,
  EntitlementCheckResult,
} from './services/buyerEntitlementService';
import { AccessGuard } from './components/AccessGuard';
import { AppLoadingScreen, AuthLifecycleStage } from './components/AppLoadingScreen';
import {
  isCategoryLive,
  isTabLive,
  getLiveCategories,
  getFirstLiveTabForCategory,
  getCategoryForTab,
} from './config/featureFlags';
import { FeatureFlagManagerModal } from './components/FeatureFlagManagerModal';
import { PinAuthModal } from './components/PinAuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeContext, UiTheme } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';
import { CloudConnectionState } from './components/CloudSyncIndicator';
import {
  persistUserAssets,
  readPersistentUserAssets,
  USER_ASSETS_SYNC_EVENT,
} from './utils/userAssets';

// Helper to get platform and subFeature for a given activeTab
const getPlatformAndSubFeature = (tab: PlatformTab): { platform: string; subFeature: string } => {
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

const getFloatingPreviewTitle = (tab: PlatformTab): string => ({
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

// Storage Reset Key for Hard Reset Versioning
const STORAGE_RESET_KEY = 'au_hard_reset_v5';

// Permanent storage key derived from Google Account / user email, or access code
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

const getLocalUpdateStorageKey = (userKey: string): string =>
  `au_last_local_update_time_${userKey.replace(/[^A-Za-z0-9_-]/g, '_')}`;

const getPendingCloudSyncStorageKey = (userKey: string): string =>
  `au_pending_cloud_sync_${userKey.replace(/[^A-Za-z0-9_-]/g, '_')}`;

const markLocalWorkspaceUpdated = (userKey: string): void => {
  try {
    localStorage.setItem(getLocalUpdateStorageKey(userKey), String(Date.now()));
    localStorage.setItem(getPendingCloudSyncStorageKey(userKey), 'true');
  } catch {}
};

const clearPendingCloudSync = (userKey: string): void => {
  try { localStorage.removeItem(getPendingCloudSyncStorageKey(userKey)); } catch {}
};

// Helper to build dynamic localStorage key for form data
const getFormStorageKey = (userKey: string, tab: PlatformTab): string => {
  const cleanUser = userKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'default';
  const { platform, subFeature } = getPlatformAndSubFeature(tab);
  return `au_toolkit_${cleanUser}_${platform}_${subFeature}_form_data`;
};

// Clean per-module folders storage keys (immutable React state per tab)
const getModuleFoldersKey = (userKey: string, tab: PlatformTab): string => {
  const cleanUser = userKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'default';
  return `au_folders_${cleanUser}_${tab}`;
};

const getModuleActiveFolderKey = (userKey: string, tab: PlatformTab): string => {
  const cleanUser = userKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'default';
  return `au_active_folder_${cleanUser}_${tab}`;
};

const getModuleFolderItemKey = (userKey: string, tab: PlatformTab, folderId: string): string => {
  const cleanUser = userKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'default';
  const cleanFolder = folderId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'folder-1';
  return `au_folder_${cleanUser}_${tab}_${cleanFolder}`;
};

// Helper to get initial fresh data for each tab (Deep Cloned)
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

// All Platform Tabs list for comprehensive multi-device workspace sync & persistence
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

// Robust loader to read form state from active folder or localStorage candidates on first render
export const loadStoredFormState = <T,>(userKey: string, tab: PlatformTab, defaultVal: T): T => {
  if (typeof window === 'undefined' || !window.localStorage) return JSON.parse(JSON.stringify(defaultVal));

  const isUserScoped = Boolean(userKey && userKey !== 'acc_shared_user' && userKey !== 'acc_default' && userKey !== 'anonymous_user');

  // 1. Check active folder data inside stored module folders
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

  // 2. Direct form storage candidates
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

  // 3. Check individual folder items
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

// Robust loader to hydrate module folders across all platform tabs
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

// Robust loader to hydrate active folder IDs across all platform tabs
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

export default function App() {
  // Firebase avatar URLs remain in state/Firestore even when an image request
  // temporarily fails. Only the rendered element receives a visual fallback.
  useEffect(() => {
    const handleStoredAvatarError = (event: Event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement)) return;

      const source = image.getAttribute('src') || '';
      const isStoredAvatar = source.includes('%2Favatars%2F') || source.includes('/avatars/');
      if (!isStoredAvatar || source === DEFAULT_AVATAR) return;

      image.src = DEFAULT_AVATAR;
    };

    document.addEventListener('error', handleStoredAvatarError, true);
    return () => document.removeEventListener('error', handleStoredAvatarError, true);
  }, []);

  // Google / Email Authenticated User State
  const [authUser, setAuthUser] = useState<any>(() => {
    try {
      const stored = getStoredAuthUser();
      if (stored && (stored.email || stored.uid)) return stored;
    } catch {
      return null;
    }
    return null;
  });

  // Keep authUser in sync with Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthUserChanged((user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Primary user storage key permanently tied to Google Account email
  const userAccountKey = useMemo(() => getUserAccountStorageKey(authUser), [authUser]);

  useEffect(() => {
    clearWorkspaceFingerprintCache();
    hasLocalUserEditsInSessionRef.current = false;
  }, [userAccountKey]);

  // Sync trigger ref to permit safe invocation across state changes without hoisting issues
  const triggerCloudWorkspaceSyncRef = useRef<() => void>(() => {});
  const forceCloudWorkspaceSyncNowRef = useRef<() => void>(() => {});
  const isApplyingCloudAssetsRef = useRef(false);
  const accountSyncGenerationRef = useRef(0);

  // Tracks whether the user has actively made local edits in this browser session
  const hasLocalUserEditsInSessionRef = useRef<boolean>(false);

  // Unique client session token for multi-device sync echo prevention
  const clientSessionId = useRef<string>(
    'session_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now()
  ).current;

  // Real-time Cloud Sync State (Multi-Device Firebase Firestore)
  const [cloudSyncState, setCloudSyncState] = useState<CloudConnectionState>(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'offline';
    }
    const stored = getStoredAuthUser();
    return stored?.email || stored?.uid ? 'connecting' : 'signed_out';
  });
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(null);
  const [isQuotaExhausted, setIsQuotaExhausted] = useState<boolean>(() => isFirestoreQuotaExhausted());
  const syncDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleUserAssetsChanged = () => {
      if (isApplyingCloudAssetsRef.current) return;
      hasLocalUserEditsInSessionRef.current = true;
      markLocalWorkspaceUpdated(userAccountKey);
      setTimeout(() => triggerCloudWorkspaceSyncRef.current?.(), 0);
    };
    window.addEventListener(USER_ASSETS_SYNC_EVENT, handleUserAssetsChanged);
    return () => window.removeEventListener(USER_ASSETS_SYNC_EVENT, handleUserAssetsChanged);
  }, [userAccountKey]);

  // Subscribe to Firestore daily write quota status
  useEffect(() => {
    return onQuotaStatusChange((exhausted) => {
      setIsQuotaExhausted(exhausted);
      if (exhausted) {
        setCloudSyncState('offline');
      }
    });
  }, []);

  // Browser connectivity event listeners (Online / Offline)
  useEffect(() => {
    const handleOnline = () => {
      const userEmailOrId = authUser?.uid;
      if (userEmailOrId) {
        setCloudSyncState('syncing');
        forceCloudWorkspaceSyncNowRef.current();
      } else {
        setCloudSyncState('signed_out');
      }
    };
    const handleOffline = () => {
      setCloudSyncState('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [authUser?.email, authUser?.uid]);

  // Initial Cloud Workspace Loading state to prevent empty template overwrite
  const [isInitialCloudLoading, setIsInitialCloudLoading] = useState<boolean>(() => {
    try {
      const stored = getStoredAuthUser();
      return Boolean(stored?.email || stored?.uid);
    } catch {
      return false;
    }
  });

  // User-scoped Hydration State: Auto-save is strictly gated until hydration completes
  const [isHydrated, setIsHydrated] = useState<boolean>(() => {
    try {
      const stored = getStoredAuthUser();
      return !stored?.email && !stored?.uid;
    } catch {
      return true;
    }
  });
  const isHydratedRef = useRef<boolean>(!getStoredAuthUser()?.email && !getStoredAuthUser()?.uid);

  // Interactive Cloud Sync Menu and Feedback Toast
  const [showCloudSyncMenu, setShowCloudSyncMenu] = useState<boolean>(false);
  const cloudSyncMenuRef = useRef<HTMLDivElement | null>(null);
  const [cloudToast, setCloudToast] = useState<{ show: boolean; message: string; type?: 'success' | 'info' | 'warning' | 'error' }>({ show: false, message: '' });

  // Auto-dismiss toast timer
  useEffect(() => {
    if (cloudToast.show) {
      const timer = setTimeout(() => {
        setCloudToast((prev) => ({ ...prev, show: false }));
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [cloudToast.show]);

  // Close cloud sync menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cloudSyncMenuRef.current && !cloudSyncMenuRef.current.contains(e.target as Node)) {
        setShowCloudSyncMenu(false);
      }
    };
    if (showCloudSyncMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCloudSyncMenu]);

  // Canonical Auth Lifecycle Stage
  const [authLifecycleStage, setAuthLifecycleStage] = useState<AuthLifecycleStage>(() => {
    try {
      const emailOrCode = localStorage.getItem('au_user_email') || localStorage.getItem('au_access_code');
      if (!emailOrCode) return 'UNAUTHENTICATED';
      return 'AUTH_LOADING';
    } catch {
      return 'UNAUTHENTICATED';
    }
  });
  const [buyerEntitlement, setBuyerEntitlement] = useState<EntitlementCheckResult | null>(null);
  const [loadingErrorMessage, setLoadingErrorMessage] = useState<string | null>(null);

  // Authentication State (Email-based Login from Spreadsheet Order Data)
  const [accessCode, setAccessCode] = useState<string>(() => {
    try {
      return localStorage.getItem('au_user_email') || localStorage.getItem('au_access_code') || '';
    } catch {
      return '';
    }
  });
  // Long-duration session validation (30 days persistence based on Purchase Date)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const emailOrCode = localStorage.getItem('au_user_email') || localStorage.getItem('au_access_code');
      if (!emailOrCode) return false;
      const expiryStr = localStorage.getItem('au_session_expires_at');
      if (expiryStr) {
        const expiry = parseInt(expiryStr, 10);
        if (!isNaN(expiry) && Date.now() > expiry) {
          // Explicitly expired beyond duration
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  });

  // Client device slot (mobile or desktop)
  const [clientDeviceSlot] = useState<'mobile' | 'desktop'>(() => detectDeviceSlot());

  // Language State
  const { language, toggleLanguage, t } = useLanguage();

  // Logout / Auto-Logout Reason Message
  const [logoutReason, setLogoutReason] = useState<string | null>(null);
  // Logout in-progress state to provide instant visual feedback & prevent duplicate triggers
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleAutoLogout = (reason: string) => {
    try {
      setStoredAuthUser(null);
      localStorage.removeItem('au_user_email');
      localStorage.removeItem('au_access_code');
      localStorage.removeItem('au_is_authenticated');
      localStorage.removeItem('au_session_expires_at');
      localStorage.removeItem('au_session_saved_at');
      localStorage.removeItem('au_device_slot');
      localStorage.removeItem('au_device_label');
    } catch {}
    signOutUser().catch(() => {});
    setAccessCode('');
    setIsAuthenticated(false);
    setAuthUser(null);
    setIsHydrated(false);
    isHydratedRef.current = false;
    setLogoutReason(reason);
    setAuthLifecycleStage('UNAUTHENTICATED');
    setCloudSyncState('signed_out');
    clearWorkspaceFingerprintCache();
    hasLocalUserEditsInSessionRef.current = false;
    const cleanFolders: Record<string, AUFolder[]> = {};
    const cleanActiveIds: Record<string, string> = {};
    ALL_PLATFORM_TABS.forEach((tab) => {
      cleanFolders[tab] = [{ id: 'folder-1', name: 'Folder 1', data: getInitialTabData(tab) }];
      cleanActiveIds[tab] = 'folder-1';
      loadTabFormData(tab, getInitialTabData(tab));
    });
    setModuleFolders(cleanFolders);
    moduleFoldersRef.current = cleanFolders;
    setActiveFolderIds(cleanActiveIds);
    activeFolderIdsRef.current = cleanActiveIds;
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      // 1. Clear any pending debounced sync timers so they cannot fire after logout
      if (syncDebounceTimerRef.current) {
        clearTimeout(syncDebounceTimerRef.current);
        syncDebounceTimerRef.current = null;
      }

      // 2. Flush current complete payload to Firestore immediately (with 1.2s timeout safeguard so it never hangs)
      const userEmailOrId = authUser?.uid || auth.currentUser?.uid;
      if (userEmailOrId && !isFirestoreQuotaExhausted()) {
        try {
          clearWorkspaceFingerprintCache();
          if (gatherCompleteWorkspacePayloadRef.current) {
            const currentPayload = gatherCompleteWorkspacePayloadRef.current();
            currentPayload.moduleFolders = { ...(moduleFoldersRef.current || moduleFolders) };
            currentPayload.activeFolderIds = { ...(activeFolderIdsRef.current || activeFolderIds) };
            await Promise.race([
              saveUserWorkspaceToFirestore(userEmailOrId, currentPayload),
              new Promise((res) => setTimeout(res, 1200)),
            ]);
          }
          await Promise.race([
            flushPendingWorkspaceSaves(),
            new Promise((res) => setTimeout(res, 1200)),
          ]);
        } catch (e) {
          console.warn('Logout cloud sync flush notice:', e);
        }
      }

      // 3. Sign out user from Firebase auth & localStorage
      try {
        await Promise.race([
          signOutUser(),
          new Promise((res) => setTimeout(res, 800)),
        ]);
      } catch {}
      try {
        setStoredAuthUser(null);
        localStorage.removeItem('au_user_email');
        localStorage.removeItem('au_access_code');
        localStorage.removeItem('au_is_authenticated');
        localStorage.removeItem('au_session_expires_at');
        localStorage.removeItem('au_session_saved_at');
        localStorage.removeItem('au_device_slot');
        localStorage.removeItem('au_device_label');
      } catch {}

      // 4. Reset in-memory states to prevent data bleed into next session
      setAccessCode('');
      setIsAuthenticated(false);
      setAuthLifecycleStage('UNAUTHENTICATED');
      setIsInitialCloudLoading(false);
      setIsHydrated(false);
      isHydratedRef.current = false;
      setLogoutReason(null);
      setAuthUser(null);
      setBuyerEntitlement(null);
      setCloudSyncState('signed_out');
      clearWorkspaceFingerprintCache();
      hasLocalUserEditsInSessionRef.current = false;
      const cleanFolders: Record<string, AUFolder[]> = {};
      const cleanActiveIds: Record<string, string> = {};
      ALL_PLATFORM_TABS.forEach((tab) => {
        cleanFolders[tab] = [{ id: 'folder-1', name: 'Folder 1', data: getInitialTabData(tab) }];
        cleanActiveIds[tab] = 'folder-1';
        loadTabFormData(tab, getInitialTabData(tab));
      });
      setModuleFolders(cleanFolders);
      moduleFoldersRef.current = cleanFolders;
      setActiveFolderIds(cleanActiveIds);
      activeFolderIdsRef.current = cleanActiveIds;
    } finally {
      setIsLoggingOut(false);
    }
  };

  // In-flight debounce & lock protection for real-time entitlement revalidation
  const isRevalidatingRef = useRef<boolean>(false);
  const lastRevalidatedAtRef = useRef<number>(0);
  const initialBootExecutedRef = useRef<boolean>(false);

  // Synchronized refs to decouple revalidateEntitlement from state re-render triggers
  const authUserRef = useRef(authUser);
  authUserRef.current = authUser;
  const authLifecycleStageRef = useRef(authLifecycleStage);
  authLifecycleStageRef.current = authLifecycleStage;
  const languageRef = useRef(language);
  languageRef.current = language;
  const buyerEntitlementRef = useRef(buyerEntitlement);
  buyerEntitlementRef.current = buyerEntitlement;

  // Centralized Real-Time Entitlement Revalidation function (Strict Lifecycle & Decoupled State)
  const revalidateEntitlement = useCallback(async (isInitial = false) => {
    // In-flight lock protection
    if (isRevalidatingRef.current) {
      console.log('[Entitlement] Revalidation already in-flight, skipping.');
      return;
    }

    const stored = getStoredAuthUser();
    const localEmail = localStorage.getItem('au_user_email');
    const emailToCheck = (stored?.email || localEmail || authUserRef.current?.email || '').trim().toLowerCase();

    if (!emailToCheck) {
      console.log('[Entitlement] No email found to check. Setting UNAUTHENTICATED.');
      if (isInitial) {
        setIsAuthenticated(false);
        setAuthLifecycleStage('UNAUTHENTICATED');
      }
      return;
    }

    // Debounce: don't make network calls within 15 seconds unless it's initial or manual retry
    const now = Date.now();
    if (!isInitial && now - lastRevalidatedAtRef.current < 15000) {
      return;
    }

    isRevalidatingRef.current = true;
    try {
      if (isInitial) {
        setLoadingErrorMessage(null);
        setAuthLifecycleStage('CHECK_ACCESS');
      }

      console.log('[Entitlement] Checking buyer entitlement for:', emailToCheck, { isInitial });
      const entitlement = await checkBuyerEntitlement(emailToCheck);
      lastRevalidatedAtRef.current = Date.now();

      // 2. Temporary backend / API response failure / Apps Script unavailable
      if (
        entitlement.status === 'BACKEND_ERROR' ||
        entitlement.status === 'INVALID_API_RESPONSE' ||
        entitlement.status === 'APPS_SCRIPT_UNAVAILABLE'
      ) {
        console.warn('[Entitlement] Temporary API/backend error:', entitlement.status);
        if (isInitial) {
          // Check if previously authorized with an unexpired cached entitlement and real Firebase session
          const cached = buyerEntitlementRef.current;
          const isCachedValid = Boolean(
            cached && cached.isValid && cached.status === 'ACTIVE' && cached.email?.toLowerCase() === emailToCheck
          );
          if (isCachedValid && (auth.currentUser || getStoredAuthUser())) {
            console.log('[Entitlement] Using cached valid entitlement with active Firebase session, proceeding to LOAD_USER_DATA');
            setAuthLifecycleStage('LOAD_USER_DATA');
          } else {
            console.warn('[Entitlement] No active authenticated session or valid cached entitlement. Access blocked.');
            setLoadingErrorMessage(
              entitlement.message ||
                (languageRef.current === 'id'
                  ? 'Server verifikasi spreadsheet sedang tidak dapat dijangkau. Silakan coba lagi.'
                  : 'Spreadsheet verification server is currently unreachable. Please try again.')
            );
          }
        }
        return;
      }

      // 3. Auth required / Invalid token -> Prompt user to sign in
      if (entitlement.status === 'AUTH_REQUIRED' || entitlement.status === 'INVALID_FIREBASE_TOKEN') {
        console.log('[Entitlement] Auth session required:', entitlement.status);
        if (isInitial) {
          setIsAuthenticated(false);
          setAuthLifecycleStage('UNAUTHENTICATED');
        }
        return;
      }

      // 4. Authoritative check: ACCOUNT_EXPIRED, INACTIVE, DEVICE_MISMATCH, or ORDER_NOT_SUCCESS
      const isStatusExpired = String(entitlement.statusAccount || '').trim().toLowerCase() === 'expired';
      const isExpiredOrLocked =
        entitlement.status === 'EXPIRED' ||
        isStatusExpired ||
        entitlement.status === 'INACTIVE' ||
        entitlement.statusAccount === 'Inactive' ||
        entitlement.status === 'DEVICE_MISMATCH' ||
        entitlement.status === 'ORDER_NOT_SUCCESS' ||
        entitlement.status === 'INVALID_PURCHASE_DATA';

      if (isExpiredOrLocked) {
        console.warn('[Entitlement] Access denied/expired:', entitlement.status, entitlement.statusAccount);
        setBuyerEntitlement(entitlement);
        setAuthLifecycleStage('ACCESS_EXPIRED');
        try {
          localStorage.setItem('au_is_authenticated', 'false');
          if (entitlement.expirationDate) {
            localStorage.setItem('au_buyer_expiration_date', entitlement.expirationDate);
          }
          if (entitlement.statusAccount) {
            localStorage.setItem('au_buyer_status_account', entitlement.statusAccount);
          }
        } catch {}
        return;
      }

      // 5. BUYER_NOT_FOUND
      if (entitlement.status === 'NOT_REGISTERED' || !entitlement.isRegisteredBuyer) {
        console.warn('[Entitlement] Buyer not found in sheet:', emailToCheck);
        setBuyerEntitlement(entitlement);
        handleAutoLogout(
          entitlement.message ||
            (languageRef.current === 'id'
              ? 'Email tidak terdaftar sebagai pembeli aktif.'
              : 'Email is not registered as an active buyer.')
        );
        setAuthLifecycleStage('UNAUTHENTICATED');
        return;
      }

      // 6. ACCESS_GRANTED -> ACTIVE & VALID BUYER
      console.log('[Entitlement] ACCESS_GRANTED for:', emailToCheck);
      setBuyerEntitlement(entitlement);
      try {
        localStorage.setItem('au_is_authenticated', 'true');
        if (entitlement.purchaseDate) localStorage.setItem('au_buyer_purchase_date', entitlement.purchaseDate);
        if (entitlement.expirationDate) localStorage.setItem('au_buyer_expiration_date', entitlement.expirationDate);
        if (entitlement.statusAccount) localStorage.setItem('au_buyer_status_account', entitlement.statusAccount);
      } catch {}

      // Step 4 of Lifecycle: Validate Firebase client Google Auth session
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email) {
        const googleEmail = (currentUser.email || '').trim().toLowerCase();
        const buyerEmail = (emailToCheck || '').trim().toLowerCase();
        if (googleEmail !== buyerEmail) {
          console.warn('[Auth] EMAIL_ACCOUNT_MISMATCH on revalidation:', { googleEmail, buyerEmail });
          await signOutUser();
          setIsAuthenticated(false);
          setAuthLifecycleStage('UNAUTHENTICATED');
          setLoadingErrorMessage(
            `Email akun Google (${googleEmail}) tidak cocok dengan email pembelian (${buyerEmail}) [EMAIL_ACCOUNT_MISMATCH]. Silakan masuk dengan akun Google ${buyerEmail}.`
          );
          return;
        }
      }

      const activeFirebaseUser: any = currentUser || getStoredAuthUser();
      if (!activeFirebaseUser || !currentUser) {
        console.log('[Auth] Google Sign-In required for verified buyer:', emailToCheck);
        setIsAuthenticated(false);
        setAuthLifecycleStage('UNAUTHENTICATED');
        return;
      }

      const userSession = {
        uid: currentUser.uid,
        email: emailToCheck,
        displayName: currentUser.displayName || emailToCheck.split('@')[0],
        photoURL: currentUser.photoURL || null,
      };

      setIsAuthenticated(true);
      setStoredAuthUser(userSession);
      setAuthUser(userSession);

      if (isInitial) {
        try {
          await verifyAndRegisterDevice(activeFirebaseUser);
        } catch (err) {
          console.warn('Device slot registration notice:', err);
        }
        // Step 5 of Lifecycle: Transition to LOAD_USER_DATA (Never jump directly to READY!)
        console.log('[Lifecycle] Transitioning from CHECK_ACCESS -> LOAD_USER_DATA');
        setAuthLifecycleStage('LOAD_USER_DATA');
      } else {
        if (authLifecycleStageRef.current === 'ACCESS_EXPIRED') {
          setAuthLifecycleStage('READY');
        }
      }
    } catch (err: any) {
      console.error('[Entitlement] Verification unexpected error:', err);
      if (isInitial) {
        setLoadingErrorMessage(
          err?.message || 'Terjadi kesalahan saat memverifikasi hak akses. Silakan coba lagi.'
        );
      }
    } finally {
      isRevalidatingRef.current = false;
    }
  }, []);

  // 1. Initial Authentication & Entitlement Lifecycle Evaluation (Mount / Page Refresh / Session Restore)
  useEffect(() => {
    if (initialBootExecutedRef.current) return;
    initialBootExecutedRef.current = true;
    console.log('[Lifecycle] Initial boot started, evaluating access...');
    revalidateEntitlement(true);
  }, [revalidateEntitlement]);

  // 2. Real-Time Entitlement Revalidation: Tab Visibility & Window Focus checks
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        revalidateEntitlement(false);
      }
    };
    const handleFocus = () => {
      if (isAuthenticated) {
        revalidateEntitlement(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, revalidateEntitlement]);

  // 3. Periodic Entitlement Revalidation while Logged In (Approximately every 5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;
    const intervalId = setInterval(() => {
      revalidateEntitlement(false);
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isAuthenticated, revalidateEntitlement]);

  // 2. Real-time Device Limit Subscription: Detect if another device replaces this slot (1 Mobile + 1 Desktop limit rule)
  useEffect(() => {
    if (!isAuthenticated || !authUser) return;
    const unsubscribe = subscribeDeviceSlotSession(authUser, (newDeviceLabel) => {
      handleAutoLogout(
        language === 'id'
          ? `Akun Anda telah login di perangkat ${newDeviceLabel}. Sesuai ketentuan, 1 akun dapat aktif pada 1 Handphone dan 1 Laptop/PC.`
          : `Your account was logged in on another device (${newDeviceLabel}). Each account is limited to 1 mobile and 1 desktop.`
      );
    });
    return () => unsubscribe();
  }, [isAuthenticated, authUser, language]);

  // Hard Reset Dialog State
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccessToast, setResetSuccessToast] = useState<boolean>(false);

  // Session Voucher Code State
  const [voucherCode, setVoucherCode] = useState<string>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlVoucher = urlParams.get('voucher') || urlParams.get('code');
      if (urlVoucher) return urlVoucher.trim();

      const saved = localStorage.getItem('au_voucher_code');
      if (saved) return saved.trim();

      const savedAccess = localStorage.getItem('au_access_code');
      if (savedAccess) return savedAccess.trim();
    } catch (e) {
      console.warn('Failed to initialize voucher code', e);
    }
    return 'default';
  });

  const handleVoucherCodeChange = (newCode: string) => {
    setVoucherCode(newCode);
    try {
      localStorage.setItem('au_voucher_code', newCode);
    } catch (e) {
      console.warn('Failed to save voucher code to localStorage', e);
    }
  };

  // Global Workspace UI Theme ('light' | 'dark')
  const [uiTheme, setUiTheme] = useState<UiTheme>(() => {
    try {
      const saved = localStorage.getItem('au_ui_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    return 'light';
  });

  const handleSetUiTheme = (newTheme: UiTheme) => {
    setUiTheme(newTheme);
    try {
      localStorage.setItem('au_ui_theme', newTheme);
    } catch (e) {}
    hasLocalUserEditsInSessionRef.current = true;
    setTimeout(() => triggerCloudWorkspaceSyncRef.current?.(), 100);
  };

  const handleToggleTheme = () => {
    hasLocalUserEditsInSessionRef.current = true;
    setUiTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('au_ui_theme', next);
      } catch (e) {}
      setTimeout(() => triggerCloudWorkspaceSyncRef.current?.(), 100);
      return next;
    });
  };

  useEffect(() => {
    if (uiTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [uiTheme]);

  // Active Generator Tab with localStorage persistence
  const [activeTab, setActiveTab] = useState<PlatformTab>(() => {
    try {
      const saved = localStorage.getItem('au_last_active_tab') as PlatformTab;
      if (saved && ALL_PLATFORM_TABS.includes(saved)) {
        return saved;
      }
    } catch {}
    return 'twitter';
  });

  useEffect(() => {
    try {
      localStorage.setItem('au_last_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  // Generator States initialized with stored form data or active folder data
  const [twitterData, setTwitterData] = useState<TwitterPostData>(() => loadStoredFormState(userAccountKey, 'twitter', INITIAL_TWITTER_DATA));
  const [instagramFeedData, setInstagramFeedData] = useState<InstagramFeedData>(() => loadStoredFormState(userAccountKey, 'instagram-feed', INITIAL_INSTAGRAM_FEED_DATA));
  const [instagramStoryData, setInstagramStoryData] = useState<InstagramStoryData>(() => loadStoredFormState(userAccountKey, 'instagram-story', INITIAL_INSTAGRAM_STORY_DATA));
  const [instagramProfileData, setInstagramProfileData] = useState<InstagramProfileData>(() => loadStoredFormState(userAccountKey, 'instagram-profile', INITIAL_INSTAGRAM_PROFILE_DATA));
  const [instagramLiveData, setInstagramLiveData] = useState<InstagramLiveData>(() => loadStoredFormState(userAccountKey, 'instagram-live', INITIAL_INSTAGRAM_LIVE_DATA));
  const [instagramNotesData, setInstagramNotesData] = useState<InstagramNotesData>(() => loadStoredFormState(userAccountKey, 'instagram-notes', INITIAL_INSTAGRAM_NOTES_DATA));
  const [instagramActivityData, setInstagramActivityData] = useState<InstagramActivityData>(() => loadStoredFormState(userAccountKey, 'instagram-activity', INITIAL_INSTAGRAM_ACTIVITY_DATA));
  const [instagramDMData, setInstagramDMData] = useState<InstagramDMData>(() => loadStoredFormState(userAccountKey, 'instagram-dm', INITIAL_INSTAGRAM_DM_DATA));
  const [instagramDMInboxData, setInstagramDMInboxData] = useState<InstagramDMInboxData>(() => loadStoredFormState(userAccountKey, 'instagram-dm-inbox', INITIAL_INSTAGRAM_DM_INBOX_DATA));
  const [instagramFeedCommentsData, setInstagramFeedCommentsData] = useState<InstagramFeedCommentsData>(() => loadStoredFormState(userAccountKey, 'instagram-feed-comments', INITIAL_INSTAGRAM_FEED_COMMENTS_DATA));
  const [instagramStoryReplyData, setInstagramStoryReplyData] = useState<InstagramStoryReplyData>(() => loadStoredFormState(userAccountKey, 'instagram-story-reply', INITIAL_INSTAGRAM_STORY_REPLY_DATA));
  const [instagramStoryViewersData, setInstagramStoryViewersData] = useState<InstagramStoryViewersData>(() => loadStoredFormState(userAccountKey, 'instagram-story-viewers', INITIAL_INSTAGRAM_STORY_VIEWERS_DATA));
  const [whatsAppChatData, setWhatsAppChatData] = useState<WhatsAppChatData>(() => loadStoredFormState(userAccountKey, 'whatsapp-chat', INITIAL_WHATSAPP_CHAT_DATA));
  const [whatsAppCallData, setWhatsAppCallData] = useState<WhatsAppCallData>(() => loadStoredFormState(userAccountKey, 'whatsapp-call', INITIAL_WHATSAPP_CALL_DATA));
  const [whatsAppStatusData, setWhatsAppStatusData] = useState<WhatsAppStatusData>(() => loadStoredFormState(userAccountKey, 'whatsapp-status', INITIAL_WHATSAPP_STATUS_DATA));
  const [whatsAppViewersData, setWhatsAppViewersData] = useState<WhatsAppViewersData>(() => loadStoredFormState(userAccountKey, 'whatsapp-viewers', INITIAL_WHATSAPP_VIEWERS_DATA));
  const [tikTokProfileData, setTikTokProfileData] = useState<TikTokProfileData>(() => loadStoredFormState(userAccountKey, 'tiktok-profile', INITIAL_TIKTOK_PROFILE_DATA));
  const [tikTokFeedLiveData, setTikTokFeedLiveData] = useState<TikTokFeedLiveData>(() => loadStoredFormState(userAccountKey, 'tiktok-feed-live', INITIAL_TIKTOK_FEED_LIVE_DATA));
  const [tikTokFypData, setTikTokFypData] = useState<TikTokFypData>(() => loadStoredFormState(userAccountKey, 'tiktok-fyp', INITIAL_TIKTOK_FYP_DATA));
  const [iosLockscreenData, setIosLockscreenData] = useState<IOSLockscreenData>(() => loadStoredFormState(userAccountKey, 'ios-lockscreen', INITIAL_IOS_LOCKSCREEN_DATA));
  const [lineChatData, setLineChatData] = useState<LineChatData>(() => loadStoredFormState(userAccountKey, 'line-chat', INITIAL_LINE_CHAT_DATA));
  const [notesData, setNotesData] = useState<NotesData>(() => loadStoredFormState(userAccountKey, 'notes', INITIAL_NOTES_DATA));
  const [pushNotificationData, setPushNotificationData] = useState<PushNotificationData>(() => loadStoredFormState(userAccountKey, 'push-notification', INITIAL_PUSH_NOTIFICATION_DATA));
  const [spotifyData, setSpotifyData] = useState<SpotifyData>(() => loadStoredFormState(userAccountKey, 'spotify-card', INITIAL_SPOTIFY_DATA));

  // Global Font Manager State
  const [globalFont, setGlobalFont] = useState<FontOptionKey>('ios');
  const [customFontName, setCustomFontName] = useState<string>('');

  useEffect(() => {
    try {
      const savedFont = localStorage.getItem('global_app_font');
      if (savedFont && FONT_OPTIONS.some((f) => f.key === savedFont)) {
        setGlobalFont(savedFont as FontOptionKey);
      }
      const savedCustomFontName = localStorage.getItem('global_custom_font_name');
      if (savedCustomFontName) {
        setCustomFontName(savedCustomFontName);
      }
    } catch (e) {}
  }, []);

  const handleFontChange = (newFont: FontOptionKey) => {
    setGlobalFont(newFont);
    try {
      localStorage.setItem('global_app_font', newFont);
    } catch (e) {}
    triggerCloudWorkspaceSyncRef.current?.();
  };

  const handleCustomFontUploaded = (fileName: string) => {
    setCustomFontName(fileName);
    try {
      localStorage.setItem('global_custom_font_name', fileName);
    } catch (e) {}
    triggerCloudWorkspaceSyncRef.current?.();
  };

  useEffect(() => {
    injectGlobalCustomFonts();
  }, []);

  const currentFontCss = getFontCssValue(globalFont);

  useEffect(() => {
    document.documentElement.style.setProperty('--selected-global-font', currentFontCss);
  }, [currentFontCss]);

  // Global Card Corner Radius State (0px to 48px)
  const [cornerRadius, setCornerRadius] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('global_card_corner_radius');
      if (saved !== null) return parseInt(saved, 10) || 0;
    } catch (e) {}
    return 0;
  });

  const handleCornerRadiusChange = (newRadius: number) => {
    setCornerRadius(newRadius);
    try {
      localStorage.setItem('global_card_corner_radius', String(newRadius));
    } catch (e) {}
    triggerCloudWorkspaceSyncRef.current?.();
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--preview-corner-radius', `${cornerRadius}px`);
  }, [cornerRadius]);

  // Quick AU Characters / Folders State (Clean immutable map: tab -> folders list)
  const [moduleFolders, setModuleFolders] = useState<Record<string, AUFolder[]>>(() => loadAllStoredModuleFolders(userAccountKey, ALL_PLATFORM_TABS));
  // Active Folder ID per module: tab -> active folder id
  const [activeFolderIds, setActiveFolderIds] = useState<Record<string, string>>(() => loadAllStoredActiveFolderIds(userAccountKey, ALL_PLATFORM_TABS));

  // Active module folders & active folder ID (derived cleanly using immutable state)
  const currentTabFolders: AUFolder[] = useMemo(() => {
    const list = moduleFolders[activeTab];
    if (list && list.length > 0) return list;
    return [{ id: 'folder-1', name: 'Folder 1', data: getInitialTabData(activeTab) }];
  }, [moduleFolders, activeTab]);

  const currentTabActiveFolderId: string = useMemo(() => {
    const id = activeFolderIds[activeTab];
    if (id && currentTabFolders.some((f) => f.id === id)) return id;
    return currentTabFolders[0]?.id || 'folder-1';
  }, [activeFolderIds, activeTab, currentTabFolders]);

  const characters = currentTabFolders;
  const activeCharId = currentTabActiveFolderId;
  const activeFolderIdsRef = useRef<Record<string, string>>(activeFolderIds);
  const moduleFoldersRef = useRef<Record<string, AUFolder[]>>(moduleFolders);
  useEffect(() => {
    activeFolderIdsRef.current = { ...activeFolderIds, [activeTab]: currentTabActiveFolderId };
    moduleFoldersRef.current = moduleFolders;
  }, [currentTabActiveFolderId, activeFolderIds, activeTab, moduleFolders]);

  // Active Category State for Grouped Navigation
  const [activeCategory, setActiveCategory] = useState<PlatformGroup>(() => {
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
  });

  useEffect(() => {
    try {
      localStorage.setItem('au_last_active_category', activeCategory);
    } catch {}
  }, [activeCategory]);

  // Sync category if activeTab changes
  useEffect(() => {
    const cat = getCategoryForTab(activeTab);
    setActiveCategory(cat);
  }, [activeTab]);

  // Immediate flush of debounced cloud saves when switching active tab or category
  useEffect(() => {
    if (syncDebounceTimerRef.current) {
      clearTimeout(syncDebounceTimerRef.current);
      syncDebounceTimerRef.current = null;
      forceCloudWorkspaceSyncNowRef.current?.();
    }
  }, [activeTab, activeCategory]);

  // Feature Flag State & Sync with PIN Security Gate
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isFeatureFlagModalOpen, setIsFeatureFlagModalOpen] = useState<boolean>(false);
  const [featureFlagsVersion, setFeatureFlagsVersion] = useState<number>(0);

  // Secret Click Tracker for Footer Triple-Click
  const secretClickCountRef = useRef<number>(0);
  const secretLastClickTimeRef = useRef<number>(0);

  const handleSecretFooterClick = () => {
    const now = Date.now();
    if (now - secretLastClickTimeRef.current < 1500) {
      secretClickCountRef.current += 1;
    } else {
      secretClickCountRef.current = 1;
    }
    secretLastClickTimeRef.current = now;

    if (secretClickCountRef.current >= 3) {
      secretClickCountRef.current = 0;
      setIsPinModalOpen(true);
    }
  };

  // Secret Trigger 1: Global Shortcut (Ctrl+Shift+F or Cmd+Shift+F or Ctrl+Alt+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        setIsPinModalOpen(true);
      } else if (isCmdOrCtrl && e.altKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        setIsPinModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Secret Trigger 2: Secret URL Parameter (?admin=true, ?admin=ff, ?flag=admin)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('admin') === 'true' ||
        params.get('admin') === 'ff' ||
        params.get('flag') === 'admin' ||
        params.get('ff') === 'admin'
      ) {
        setIsPinModalOpen(true);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const handleFlagsUpdated = () => {
      setFeatureFlagsVersion((v) => v + 1);
    };
    window.addEventListener('feature_flags_updated', handleFlagsUpdated);
    return () => window.removeEventListener('feature_flags_updated', handleFlagsUpdated);
  }, []);

  // Ensure active category and active tab are always synchronized and LIVE
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

  // Hydrate all form states and module folders from localStorage on mount / user change
  useEffect(() => {
    const loadForm = <T,>(tab: PlatformTab, defaultVal: T): T => {
      return loadStoredFormState(userAccountKey, tab, defaultVal);
    };

    const initialTwitter = loadForm('twitter', INITIAL_TWITTER_DATA);
    const initialIgFeed = loadForm('instagram-feed', INITIAL_INSTAGRAM_FEED_DATA);
    const initialIgStory = loadForm('instagram-story', INITIAL_INSTAGRAM_STORY_DATA);
    const initialIgStoryReply = loadForm('instagram-story-reply', INITIAL_INSTAGRAM_STORY_REPLY_DATA);
    const initialIgStoryViewers = loadForm('instagram-story-viewers', INITIAL_INSTAGRAM_STORY_VIEWERS_DATA);
    const initialIgProfile = loadForm('instagram-profile', INITIAL_INSTAGRAM_PROFILE_DATA);
    const initialIgLive = loadForm('instagram-live', INITIAL_INSTAGRAM_LIVE_DATA);
    const initialIgNotes = loadForm('instagram-notes', INITIAL_INSTAGRAM_NOTES_DATA);
    const initialIgActivity = loadForm('instagram-activity', INITIAL_INSTAGRAM_ACTIVITY_DATA);
    const initialIgDM = loadForm('instagram-dm', INITIAL_INSTAGRAM_DM_DATA);
    const initialIgDMInbox = loadForm('instagram-dm-inbox', INITIAL_INSTAGRAM_DM_INBOX_DATA);
    const initialIgFeedComments = loadForm('instagram-feed-comments', INITIAL_INSTAGRAM_FEED_COMMENTS_DATA);
    const initialWhatsAppChat = loadForm('whatsapp-chat', INITIAL_WHATSAPP_CHAT_DATA);
    const initialWhatsAppCall = loadForm('whatsapp-call', INITIAL_WHATSAPP_CALL_DATA);
    const initialWhatsAppStatus = loadForm('whatsapp-status', INITIAL_WHATSAPP_STATUS_DATA);
    const initialWhatsAppViewers = loadForm('whatsapp-viewers', INITIAL_WHATSAPP_VIEWERS_DATA);
    const initialTikTokProfile = loadForm('tiktok-profile', INITIAL_TIKTOK_PROFILE_DATA);
    const initialTikTokFeedLive = loadForm('tiktok-feed-live', INITIAL_TIKTOK_FEED_LIVE_DATA);
    const initialTikTokFyp = loadForm('tiktok-fyp', INITIAL_TIKTOK_FYP_DATA);
    const initialIosLockscreen = loadForm('ios-lockscreen', INITIAL_IOS_LOCKSCREEN_DATA);
    const initialLineChat = loadForm('line-chat', INITIAL_LINE_CHAT_DATA);
    const initialNotes = loadForm('notes', INITIAL_NOTES_DATA);
    const initialPushNotification = loadForm('push-notification', INITIAL_PUSH_NOTIFICATION_DATA);
    const initialSpotify = loadForm('spotify-card', INITIAL_SPOTIFY_DATA);
    if (initialSpotify) {
      initialSpotify.style = 'blur';
      if (!['dark', 'pink', 'blue'].includes(initialSpotify.theme)) {
        initialSpotify.theme = 'dark';
      }
      if (initialSpotify.progressPercent === undefined) {
        initialSpotify.progressPercent = 51;
      }
      if (initialSpotify.volumePercent === undefined) {
        initialSpotify.volumePercent = 75;
      }
    }

    setTwitterData(initialTwitter);
    setInstagramFeedData(initialIgFeed);
    setInstagramStoryData(initialIgStory);
    setInstagramStoryReplyData(initialIgStoryReply);
    setInstagramStoryViewersData(initialIgStoryViewers);
    setInstagramProfileData(initialIgProfile);
    setInstagramLiveData(initialIgLive);
    setInstagramNotesData(initialIgNotes);
    setInstagramActivityData(initialIgActivity);
    setInstagramDMData(initialIgDM);
    setInstagramDMInboxData(initialIgDMInbox);
    setInstagramFeedCommentsData(initialIgFeedComments);
    setWhatsAppChatData(initialWhatsAppChat);
    setWhatsAppCallData(initialWhatsAppCall);
    setWhatsAppStatusData(initialWhatsAppStatus);
    setWhatsAppViewersData(initialWhatsAppViewers);
    setTikTokProfileData(initialTikTokProfile);
    setTikTokFeedLiveData(initialTikTokFeedLive);
    setTikTokFypData(initialTikTokFyp);
    setIosLockscreenData(initialIosLockscreen);
    setLineChatData(initialLineChat);
    setNotesData(initialNotes);
    setPushNotificationData(initialPushNotification);
    setSpotifyData(initialSpotify);

    const loadedFolders = loadAllStoredModuleFolders(userAccountKey, ALL_PLATFORM_TABS);
    const loadedActiveIds = loadAllStoredActiveFolderIds(userAccountKey, ALL_PLATFORM_TABS);

    setModuleFolders(loadedFolders);
    moduleFoldersRef.current = loadedFolders;
    setActiveFolderIds(loadedActiveIds);
    activeFolderIdsRef.current = loadedActiveIds;

    // Hydrate all tabs with their active folder data, guaranteeing zero desync across all 24 modules
    ALL_PLATFORM_TABS.forEach((tab) => {
      const tabFolders = loadedFolders[tab] || [];
      const tabFolderId = loadedActiveIds[tab] || tabFolders[0]?.id;
      const currentFolder = tabFolders.find((f) => f.id === tabFolderId) || tabFolders[0];
      if (currentFolder && currentFolder.data) {
        loadTabFormData(tab, currentFolder.data);
      }
    });
  }, [userAccountKey]);

  // Tab switching: isolate data safely, flush previous tab's form state to its active folder
  const previousTabRef = useRef<PlatformTab>(activeTab);
  useEffect(() => {
    const prevTab = previousTabRef.current;
    if (prevTab !== activeTab) {
      // 1. Flush and save previous tab's form data to its active folder
      const prevFormData = getCurrentTabFormData(prevTab);
      if (prevFormData) {
        const clonedPrevData = JSON.parse(JSON.stringify(prevFormData));
        const prevActiveId = activeFolderIdsRef.current[prevTab] || activeFolderIds[prevTab] || 'folder-1';
        setModuleFolders((prev) => {
          const list = prev[prevTab] || moduleFoldersRef.current[prevTab];
          if (!list || list.length === 0) return prev;
          const updated = list.map((f) => (f.id === prevActiveId ? { ...f, data: clonedPrevData } : f));
          moduleFoldersRef.current[prevTab] = updated;
          try {
            localStorage.setItem(getModuleFoldersKey(userAccountKey, prevTab), JSON.stringify(updated));
            localStorage.setItem(getFormStorageKey(userAccountKey, prevTab), JSON.stringify(clonedPrevData));
            markLocalWorkspaceUpdated(userAccountKey);
          } catch {}
          return { ...prev, [prevTab]: updated };
        });
      }

      // 2. Load active folder's data for the new activeTab
      const tabFolders = moduleFoldersRef.current[activeTab] || moduleFolders[activeTab];
      if (tabFolders && tabFolders.length > 0) {
        const activeId = activeFolderIdsRef.current[activeTab] || activeFolderIds[activeTab] || tabFolders[0].id;
        const folder = tabFolders.find((f) => f.id === activeId) || tabFolders[0];
        if (folder && folder.data) {
          loadTabFormData(activeTab, folder.data);
        }
      }

      previousTabRef.current = activeTab;
      triggerCloudWorkspaceSyncRef.current?.();
    }
  }, [activeTab, userAccountKey, moduleFolders, activeFolderIds]);

  // Export State & Scale
  const [exportScale, setExportScale] = useState<number>(1);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExportingJpg, setIsExportingJpg] = useState<boolean>(false);
  const [exportStatusText, setExportStatusText] = useState<string>('');
  const [exportError, setExportError] = useState<string>('');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [downloadJpgSuccess, setDownloadJpgSuccess] = useState<boolean>(false);

  // Live Preview Viewport State Model (Explicit Current, Locked & Render Viewports)
  const [currentViewport, setCurrentViewport] = useState<ViewportTransform>(() => {
    try {
      const px = Number(localStorage.getItem('preview_pan_x')) || 0;
      const py = Number(localStorage.getItem('preview_pan_y')) || 0;
      const savedZoom = localStorage.getItem('preview_zoom');
      const zoom = savedZoom ? Math.min(200, Math.max(30, Number(savedZoom))) : 75;
      return { x: px, y: py, scale: zoom };
    } catch {
      return { x: 0, y: 0, scale: 75 };
    }
  });

  const [lockedViewport, setLockedViewport] = useState<ViewportTransform>(() => {
    try {
      const px = Number(localStorage.getItem('preview_pan_x')) || 0;
      const py = Number(localStorage.getItem('preview_pan_y')) || 0;
      const savedZoom = localStorage.getItem('preview_zoom');
      const zoom = savedZoom ? Math.min(200, Math.max(30, Number(savedZoom))) : 75;
      return { x: px, y: py, scale: zoom };
    } catch {
      return { x: 0, y: 0, scale: 75 };
    }
  });

  const [isPreviewLocked, setIsPreviewLocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('preview_is_locked');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);

  // Active rendering viewport:
  // When locked, strictly render lockedViewport.
  // When unlocked, render currentViewport.
  const renderViewport: ViewportTransform = isPreviewLocked ? lockedViewport : currentViewport;
  const previewZoom = renderViewport.scale;
  const previewPan = { x: renderViewport.x, y: renderViewport.y };

  const previewViewportRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPointerDownRef = useRef<boolean>(false);
  const activePointerIdRef = useRef<number | null>(null);
  const transientPanRef = useRef<{ x: number; y: number }>({ x: renderViewport.x, y: renderViewport.y });
  const rafIdRef = useRef<number | null>(null);
  const previewZoomRef = useRef<number>(renderViewport.scale);
  previewZoomRef.current = renderViewport.scale;
  const previewPanRef = useRef<{ x: number; y: number }>({ x: renderViewport.x, y: renderViewport.y });
  previewPanRef.current = { x: renderViewport.x, y: renderViewport.y };
  const isPreviewLockedRef = useRef<boolean>(isPreviewLocked);
  isPreviewLockedRef.current = isPreviewLocked;

  useEffect(() => {
    transientPanRef.current = { x: renderViewport.x, y: renderViewport.y };
    previewPanRef.current = { x: renderViewport.x, y: renderViewport.y };
  }, [renderViewport.x, renderViewport.y]);

  useEffect(() => {
    previewZoomRef.current = renderViewport.scale;
  }, [renderViewport.scale]);

  const setPreviewZoom = useCallback((newScaleOrFn: number | ((prev: number) => number)) => {
    if (isPreviewLockedRef.current) return;
    setCurrentViewport((prev) => {
      const nextScale = typeof newScaleOrFn === 'function' ? newScaleOrFn(prev.scale) : newScaleOrFn;
      const clamped = Math.min(200, Math.max(30, nextScale));
      previewZoomRef.current = clamped;
      try { localStorage.setItem('preview_zoom', String(clamped)); } catch {}
      return { ...prev, scale: clamped };
    });
  }, []);

  const setPreviewPan = useCallback((newPanOrFn: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => {
    if (isPreviewLockedRef.current) return;
    setCurrentViewport((prev) => {
      const nextPan = typeof newPanOrFn === 'function' ? newPanOrFn({ x: prev.x, y: prev.y }) : newPanOrFn;
      previewPanRef.current = nextPan;
      transientPanRef.current = nextPan;
      try {
        localStorage.setItem('preview_pan_x', String(Math.round(nextPan.x)));
        localStorage.setItem('preview_pan_y', String(Math.round(nextPan.y)));
      } catch {}
      return { ...prev, x: nextPan.x, y: nextPan.y };
    });
  }, []);

  const handleToggleLockPreview = () => {
    // 1. Immediately cancel any animation frame
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // 2. End any pointer/touch dragging state cleanly
    isPointerDownRef.current = false;
    activePointerIdRef.current = null;
    setIsDraggingCanvas(false);
    if (touchStateRef.current) {
      touchStateRef.current.isPanning = false;
      touchStateRef.current.initialDist = 0;
    }

    // 3. CAPTURE EXACT LIVE VIEWPORT FROM PREVIEW:
    // Read from transientPanRef.current & previewZoomRef.current, or inspect the live DOM container
    let liveX = Math.round(transientPanRef.current.x);
    let liveY = Math.round(transientPanRef.current.y);
    let liveScale = previewZoomRef.current;

    const container = document.getElementById('preview-canvas-container');
    if (container && container.style.transform) {
      const match = container.style.transform.match(/translate3d\(([-0-9.]+)px,\s*([-0-9.]+)px/);
      if (match) {
        liveX = Math.round(parseFloat(match[1]));
        liveY = Math.round(parseFloat(match[2]));
      }
      const scaleMatch = container.style.transform.match(/scale\(([-0-9.]+)\)/);
      if (scaleMatch) {
        liveScale = Math.round(parseFloat(scaleMatch[1]) * 100);
      }
    }

    if (!isPreviewLocked) {
      // USER PRESSED LOCK:
      // Freeze the current live transform exactly into lockedViewport
      const frozen: ViewportTransform = { x: liveX, y: liveY, scale: liveScale };
      setLockedViewport(frozen);
      setCurrentViewport(frozen);
      setIsPreviewLocked(true);
      isPreviewLockedRef.current = true;
      transientPanRef.current = { x: liveX, y: liveY };
      previewPanRef.current = { x: liveX, y: liveY };
      previewZoomRef.current = liveScale;

      if (container) {
        container.style.transition = 'none';
        container.style.transform = `translate3d(${liveX}px, ${liveY}px, 0) scale(${liveScale / 100})`;
      }

      try {
        localStorage.setItem('preview_is_locked', 'true');
        localStorage.setItem('preview_pan_x', String(liveX));
        localStorage.setItem('preview_pan_y', String(liveY));
        localStorage.setItem('preview_zoom', String(liveScale));
      } catch {}
    } else {
      // USER PRESSED UNLOCK:
      // Preserved exact locked transform as the starting position for currentViewport
      const preserved: ViewportTransform = { ...lockedViewport };
      setCurrentViewport(preserved);
      setIsPreviewLocked(false);
      isPreviewLockedRef.current = false;
      transientPanRef.current = { x: preserved.x, y: preserved.y };
      previewPanRef.current = { x: preserved.x, y: preserved.y };
      previewZoomRef.current = preserved.scale;

      if (container) {
        container.style.transition = 'none';
        container.style.transform = `translate3d(${preserved.x}px, ${preserved.y}px, 0) scale(${preserved.scale / 100})`;
      }

      try {
        localStorage.setItem('preview_is_locked', 'false');
      } catch {}
    }
  };

  const touchStateRef = useRef<{
    initialDist: number;
    initialZoom: number;
    initialPan: { x: number; y: number };
    initialMid: { x: number; y: number };
    lastTouchPos: { x: number; y: number };
    isPanning: boolean;
  }>({
    initialDist: 0,
    initialZoom: 75,
    initialPan: { x: 0, y: 0 },
    initialMid: { x: 0, y: 0 },
    lastTouchPos: { x: 0, y: 0 },
    isPanning: false,
  });

  const handleZoomIn = () => {
    if (isPreviewLockedRef.current) return;
    setPreviewZoom((prev) => {
      const next = Math.min(200, prev + 10);
      previewZoomRef.current = next;
      try { localStorage.setItem('preview_zoom', String(next)); } catch {}
      return next;
    });
  };

  const handleZoomOut = () => {
    if (isPreviewLockedRef.current) return;
    setPreviewZoom((prev) => {
      const next = Math.max(30, prev - 10);
      previewZoomRef.current = next;
      try { localStorage.setItem('preview_zoom', String(next)); } catch {}
      return next;
    });
  };

  const handleZoomReset = () => {
    if (isPreviewLockedRef.current) return;
    setPreviewZoom(75);
    setPreviewPan({ x: 0, y: 0 });
    previewZoomRef.current = 75;
    previewPanRef.current = { x: 0, y: 0 };
    transientPanRef.current = { x: 0, y: 0 };
    try {
      localStorage.setItem('preview_zoom', '75');
      localStorage.setItem('preview_pan_x', '0');
      localStorage.setItem('preview_pan_y', '0');
    } catch {}
    const container = document.getElementById('preview-canvas-container');
    if (container) {
      container.style.transform = 'translate3d(0px, 0px, 0) scale(0.75)';
    }
  };

  // Unified Pointer Drag Panning (Mobile Finger Touch & Desktop Mouse)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // When preview is locked, do not allow panning/dragging the canvas - preserve standard interaction & scrolling
    if (isPreviewLockedRef.current) return;

    // Only primary mouse button for mouse, any touch/pen
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const target = e.target as HTMLElement | null;
    // Don't start canvas pan on interactive control elements
    if (
      target &&
      (target.closest('button') ||
       target.closest('input') ||
       target.closest('textarea') ||
       target.closest('select') ||
       target.closest('a') ||
       target.closest('[role="button"]') ||
       target.closest('[role="slider"]') ||
       target.closest('.no-drag'))
    ) {
      return;
    }

    isPointerDownRef.current = true;
    activePointerIdRef.current = e.pointerId;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    transientPanRef.current = { ...previewPanRef.current };
    setIsDraggingCanvas(true);
  };

  // Mouse fallback for older environments
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPreviewLockedRef.current || isPointerDownRef.current) return;
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.closest('button') ||
       target.closest('input') ||
       target.closest('textarea') ||
       target.closest('select') ||
       target.closest('a') ||
       target.closest('[role="button"]') ||
       target.closest('[role="slider"]') ||
       target.closest('.no-drag'))
    ) {
      return;
    }
    if (e.button !== 0) return;
    isPointerDownRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    transientPanRef.current = { ...previewPanRef.current };
    setIsDraggingCanvas(true);
  };

  const handleDoubleClickViewport = (e: React.MouseEvent) => {
    if (isPreviewLockedRef.current) return;
    const target = e.target as HTMLElement;
    if (['INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'A'].includes(target.tagName) || target.closest('button')) {
      return;
    }
    if (previewZoom === 75 && previewPan.x === 0 && previewPan.y === 0) {
      setPreviewZoom(120);
      previewZoomRef.current = 120;
    } else {
      setPreviewZoom(75);
      setPreviewPan({ x: 0, y: 0 });
      previewZoomRef.current = 75;
      previewPanRef.current = { x: 0, y: 0 };
      transientPanRef.current = { x: 0, y: 0 };
    }
  };

  // Global pointermove & pointerup for silky smooth 60/120fps direct hardware transform drag panning
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (isPreviewLockedRef.current || !isPointerDownRef.current) return;
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      const nextX = transientPanRef.current.x + dx;
      const nextY = transientPanRef.current.y + dy;
      transientPanRef.current = { x: nextX, y: nextY };
      previewPanRef.current = { x: nextX, y: nextY };

      // High-performance direct DOM transform via RAF to eliminate lag and prevent re-rendering entire app tree
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        const container = document.getElementById('preview-canvas-container');
        if (container) {
          const zoom = previewZoomRef.current;
          container.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) scale(${zoom / 100})`;
        }
      });
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      if (isPointerDownRef.current && (activePointerIdRef.current === null || e.pointerId === activePointerIdRef.current)) {
        isPointerDownRef.current = false;
        activePointerIdRef.current = null;
        setIsDraggingCanvas(false);
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        // Cleanly commit final pan coordinates to React state & localStorage
        const finalX = Math.round(transientPanRef.current.x);
        const finalY = Math.round(transientPanRef.current.y);
        setPreviewPan({ x: finalX, y: finalY });
        try {
          localStorage.setItem('preview_pan_x', String(finalX));
          localStorage.setItem('preview_pan_y', String(finalY));
        } catch {}
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // Stable wheel and touch listeners for smooth pinch-to-zoom on mobile & desktop
  useEffect(() => {
    const el = previewViewportRef.current;
    if (!el) return;

    // Wheel event for desktop (Wheel controls zoom inside preview canvas with focal point)
    const handleWheel = (e: WheelEvent) => {
      // When locked, do NOT hijack wheel scrolling at all - allow natural scroll for chat and full page
      if (isPreviewLockedRef.current) return;

      e.preventDefault();

      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left - rect.width / 2;
      const cursorY = e.clientY - rect.top;

      const currentZoom = previewZoomRef.current;
      // scroll up (deltaY < 0) -> zoom in, scroll down (deltaY > 0) -> zoom out
      const step = (e.ctrlKey || e.metaKey) ? 12 : 8;
      const zoomDelta = e.deltaY < 0 ? step : -step;
      const targetZoom = Math.min(200, Math.max(30, currentZoom + zoomDelta));

      if (targetZoom === currentZoom) return;

      const scaleOld = currentZoom / 100;
      const scaleNew = targetZoom / 100;

      // Focal point calculation: keep point under cursor invariant
      const currentPan = transientPanRef.current;
      const newPanX = cursorX - (cursorX - currentPan.x) * (scaleNew / scaleOld);
      const newPanY = cursorY - (cursorY - currentPan.y) * (scaleNew / scaleOld);

      transientPanRef.current = { x: newPanX, y: newPanY };
      previewPanRef.current = { x: newPanX, y: newPanY };
      previewZoomRef.current = targetZoom;

      setPreviewZoom(targetZoom);
      setPreviewPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
      try {
        localStorage.setItem('preview_zoom', String(targetZoom));
        localStorage.setItem('preview_pan_x', String(Math.round(newPanX)));
        localStorage.setItem('preview_pan_y', String(Math.round(newPanY)));
      } catch {}

      const container = document.getElementById('preview-canvas-container');
      if (container) {
        container.style.transform = `translate3d(${newPanX}px, ${newPanY}px, 0) scale(${scaleNew})`;
      }
    };

    // Touch handlers for mobile (pinch-to-zoom with mathematical focal point + 2-finger pan)
    const handleTouchStart = (e: TouchEvent) => {
      // When locked, strictly preserve natural mobile page and chat scrolling
      if (isPreviewLockedRef.current) {
        touchStateRef.current.isPanning = false;
        touchStateRef.current.initialDist = 0;
        return;
      }

      const target = e.target as HTMLElement | null;
      // If tapping standard clickable control buttons or inputs, do not interfere
      if (target && (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('select') || target.closest('[data-no-swipe]'))) {
        return;
      }

      if (e.touches.length >= 2) {
        // TWO FINGERS: Intentional Pinch-to-Zoom or 2-finger pan on the Live Preview
        e.preventDefault();
        isPointerDownRef.current = false;
        activePointerIdRef.current = null;

        const rect = el.getBoundingClientRect();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const midClientX = (t1.clientX + t2.clientX) / 2;
        const midClientY = (t1.clientY + t2.clientY) / 2;
        const midX = midClientX - rect.left - rect.width / 2;
        const midY = midClientY - rect.top;

        touchStateRef.current = {
          initialDist: dist > 0 ? dist : 1,
          initialZoom: previewZoomRef.current,
          initialPan: { ...previewPanRef.current },
          initialMid: { x: midX, y: midY },
          lastTouchPos: { x: midClientX, y: midClientY },
          isPanning: true,
        };
        setIsDraggingCanvas(true);
      } else {
        // SINGLE FINGER: Normal handling via PointerDown
        touchStateRef.current.isPanning = false;
        touchStateRef.current.initialDist = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isPreviewLockedRef.current) return;

      // Only pinch-zoom and 2-finger pan when user uses 2 fingers
      if (e.touches.length >= 2) {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const midClientX = (t1.clientX + t2.clientX) / 2;
        const midClientY = (t1.clientY + t2.clientY) / 2;
        const currentMidX = midClientX - rect.left - rect.width / 2;
        const currentMidY = midClientY - rect.top;

        // Seamless dynamic initialization if second finger landed slightly after the first
        if (!touchStateRef.current.isPanning || touchStateRef.current.initialDist <= 0) {
          touchStateRef.current = {
            initialDist: currentDist > 0 ? currentDist : 1,
            initialZoom: previewZoomRef.current,
            initialPan: { ...previewPanRef.current },
            initialMid: { x: currentMidX, y: currentMidY },
            lastTouchPos: { x: midClientX, y: midClientY },
            isPanning: true,
          };
          setIsDraggingCanvas(true);
          return;
        }

        // Fluid scale calculation with focal pan
        const scale = currentDist / touchStateRef.current.initialDist;
        const targetZoom = Math.min(200, Math.max(30, Math.round(touchStateRef.current.initialZoom * scale)));
        const scaleInitial = touchStateRef.current.initialZoom / 100;
        const scaleNew = targetZoom / 100;

        const focalPanX = currentMidX - (touchStateRef.current.initialMid.x - touchStateRef.current.initialPan.x) * (scaleNew / scaleInitial);
        const focalPanY = currentMidY - (touchStateRef.current.initialMid.y - touchStateRef.current.initialPan.y) * (scaleNew / scaleInitial);

        transientPanRef.current = { x: focalPanX, y: focalPanY };
        previewPanRef.current = { x: focalPanX, y: focalPanY };
        previewZoomRef.current = targetZoom;

        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = requestAnimationFrame(() => {
          const container = document.getElementById('preview-canvas-container');
          if (container) {
            container.style.transform = `translate3d(${focalPanX}px, ${focalPanY}px, 0) scale(${scaleNew})`;
          }
        });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2 && touchStateRef.current.isPanning) {
        touchStateRef.current.isPanning = false;
        touchStateRef.current.initialDist = 0;
        setIsDraggingCanvas(false);
        const finalZoom = previewZoomRef.current;
        const finalX = Math.round(transientPanRef.current.x);
        const finalY = Math.round(transientPanRef.current.y);
        setPreviewZoom(finalZoom);
        setPreviewPan({ x: finalX, y: finalY });
        try {
          localStorage.setItem('preview_zoom', String(finalZoom));
          localStorage.setItem('preview_pan_x', String(finalX));
          localStorage.setItem('preview_pan_y', String(finalY));
        } catch {}
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  // Ref to Preview node for html2canvas / html-to-image capture
  const previewRef = useRef<HTMLDivElement>(null);

  // Mobile View Switcher (Input vs Preview)
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [isMobileFloatingPreviewOpen, setIsMobileFloatingPreviewOpen] = useState(() => {
    try {
      return localStorage.getItem('mobile_pip_enabled') === 'true';
    } catch {
      return false;
    }
  });

  const setMobileFloatingPreviewOpen = useCallback((isOpen: boolean) => {
    setIsMobileFloatingPreviewOpen(isOpen);
    try {
      localStorage.setItem('mobile_pip_enabled', String(isOpen));
    } catch {}
  }, []);

  // Mobile Touch Swipe Gesture Navigation:
  // - Swipe right to switch to Live Preview (or back)
  // - Swipe left to return to Form Input (or forward)
  // - Completely non-intrusive: ignores sliders, form inputs, buttons, and vertical scrolls
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isIgnoredTarget = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Only active on mobile / tablet viewport (< 1024px)
      if (window.innerWidth >= 1024) return;
      // Single finger touch only
      if (e.touches.length !== 1) return;

      const target = e.target as HTMLElement | null;
      // Ignore interactions inside preview canvas, inputs, textareas, selects, buttons, range sliders, or horizontal scrollers
      if (
        target?.closest(
          '#preview-viewport-container, #preview-canvas-container, [data-preview-canvas], input, textarea, select, button, [role="slider"], .overflow-x-auto, [data-no-swipe], .no-swipe, a'
        )
      ) {
        isIgnoredTarget = true;
        return;
      }

      isIgnoredTarget = false;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (window.innerWidth >= 1024 || isIgnoredTarget) return;
      if (e.changedTouches.length !== 1) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);
      const duration = Date.now() - touchStartTime;

      // Deliberate horizontal swipe:
      // - Minimum 45px distance
      // - Horizontal travel must be at least 1.5x greater than vertical movement (prevents hijacking vertical scroll)
      // - Fast decisive gesture (< 600ms)
      if (absX >= 45 && absX > absY * 1.5 && duration < 600) {
        if (diffX > 0) {
          // Swipe Right (finger moves left-to-right) -> Live Preview (or toggle)
          if (mobileView === 'editor') {
            setMobileView('preview');
          } else {
            setMobileView('editor');
          }
        } else {
          // Swipe Left (finger moves right-to-left) -> Form Input (or toggle)
          if (mobileView === 'preview') {
            setMobileView('editor');
          } else {
            setMobileView('preview');
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [mobileView]);

  // Helper to sync identity ONLY for the current active tab (strict platform isolation)
  const updateCurrentTabIdentity = (
    identity: { name?: string; handle?: string; avatar?: string; verified?: any },
    tab: PlatformTab
  ) => {
    const { name, handle, avatar, verified } = identity;

    if (tab === 'twitter') {
      setTwitterData((prev) => ({
        ...prev,
        name: name !== undefined ? name : prev.name,
        handle: handle !== undefined ? handle : prev.handle,
        avatar: avatar !== undefined ? avatar : prev.avatar,
        verified: verified !== undefined ? verified : prev.verified,
      }));
    } else if (tab === 'instagram-feed') {
      setInstagramFeedData((prev) => ({
        ...prev,
        username: handle !== undefined ? handle : (name !== undefined ? name : prev.username),
        avatar: avatar !== undefined ? avatar : prev.avatar,
        verified: verified !== undefined ? (verified === 'none' ? 'none' : 'ig-blue') : prev.verified,
      }));
    } else if (tab === 'instagram-story') {
      setInstagramStoryData((prev) => ({
        ...prev,
        username: handle !== undefined ? handle : (name !== undefined ? name : prev.username),
        avatar: avatar !== undefined ? avatar : prev.avatar,
        verified: verified !== undefined ? (verified === 'none' ? 'none' : 'ig-blue') : prev.verified,
      }));
    } else if (tab === 'instagram-story-reply') {
      setInstagramStoryReplyData((prev) => ({
        ...prev,
        username: handle !== undefined ? handle : prev.username,
        avatarUrl: avatar !== undefined ? avatar : prev.avatarUrl,
      }));
    } else if (tab === 'instagram-story-viewers') {
      setInstagramStoryViewersData((prev) => ({
        ...prev,
        storyImage: avatar !== undefined && avatar ? avatar : prev.storyImage,
      }));
    } else if (tab === 'instagram-profile') {
      setInstagramProfileData((prev) => ({
        ...prev,
        name: name !== undefined ? name : prev.name,
        username: handle !== undefined ? handle : (name !== undefined ? name : prev.username),
        avatar: avatar !== undefined ? avatar : prev.avatar,
        verified: verified !== undefined ? (verified === 'none' ? 'none' : 'ig-blue') : prev.verified,
      }));
    } else if (tab === 'instagram-live') {
      setInstagramLiveData((prev) => ({
        ...prev,
        username: handle !== undefined ? handle : (name !== undefined ? name : prev.username),
        avatar: avatar !== undefined ? avatar : prev.avatar,
        verified: verified !== undefined ? (verified === 'none' ? 'none' : 'ig-blue') : prev.verified,
      }));
    } else if (tab === 'instagram-notes') {
      setInstagramNotesData((prev) => ({
        ...prev,
        username: handle !== undefined ? handle : prev.username,
        avatar: avatar !== undefined ? avatar : prev.avatar,
      }));
    } else if (tab === 'instagram-activity') {
      setInstagramActivityData((prev) => ({
        ...prev,
        userAvatar: avatar !== undefined ? avatar : prev.userAvatar,
      }));
    } else if (tab === 'instagram-dm') {
      setInstagramDMData((prev) => ({
        ...prev,
        username: handle !== undefined ? handle : (name !== undefined ? name : prev.username),
        name: name !== undefined ? name : prev.name,
        avatar: avatar !== undefined ? avatar : prev.avatar,
        verified: verified !== undefined ? (verified === 'none' ? 'none' : 'blue') : prev.verified,
      }));
    } else if (tab === 'instagram-dm-inbox') {
      setInstagramDMInboxData((prev) => ({
        ...prev,
        accountUsername: handle !== undefined ? handle : (name !== undefined ? name : prev.accountUsername),
        userAvatar: avatar !== undefined ? avatar : prev.userAvatar,
      }));
    } else if (tab === 'instagram-feed-comments') {
      setInstagramFeedCommentsData((prev) => ({
        ...prev,
        userUsername: handle !== undefined ? handle : (name !== undefined ? name : prev.userUsername),
        userAvatar: avatar !== undefined ? avatar : prev.userAvatar,
      }));
    } else if (tab === 'whatsapp-chat') {
      setWhatsAppChatData((prev) => ({
        ...prev,
        contactName: name !== undefined ? name : prev.contactName,
        contactAvatar: avatar !== undefined ? avatar : prev.contactAvatar,
      }));
    } else if (tab === 'whatsapp-call') {
      setWhatsAppCallData((prev) => ({
        ...prev,
        contactName: name !== undefined ? name : prev.contactName,
        contactAvatar: avatar !== undefined ? avatar : prev.contactAvatar,
      }));
    } else if (tab === 'whatsapp-status') {
      setWhatsAppStatusData((prev) => ({
        ...prev,
        contactName: name !== undefined ? name : prev.contactName,
        contactAvatar: avatar !== undefined ? avatar : prev.contactAvatar,
      }));
    } else if (tab === 'whatsapp-viewers') {
      setWhatsAppViewersData((prev) => ({
        ...prev,
        statusThumbnail: avatar !== undefined ? avatar : prev.statusThumbnail,
      }));
    } else if (tab === 'tiktok-profile') {
      setTikTokProfileData((prev) => ({
        ...prev,
        profileName: name !== undefined ? name : prev.profileName,
        handle: handle !== undefined ? handle : (name !== undefined ? name : prev.handle),
        avatarUrl: avatar !== undefined ? avatar : prev.avatarUrl,
      }));
    } else if (tab === 'tiktok-feed-live') {
      setTikTokFeedLiveData((prev) => ({
        ...prev,
        username: handle !== undefined ? handle : (name !== undefined ? name : prev.username),
        avatarUrl: avatar !== undefined ? avatar : prev.avatarUrl,
      }));
    } else if (tab === 'tiktok-fyp') {
      setTikTokFypData((prev) => ({
        ...prev,
        username: handle !== undefined ? handle : (name !== undefined ? name : prev.username),
        avatarUrl: avatar !== undefined ? avatar : prev.avatarUrl,
      }));
    } else if (tab === 'ios-lockscreen') {
      setIosLockscreenData((prev) => ({
        ...prev,
        senderName: name !== undefined ? name : prev.senderName,
        avatarUrl: avatar !== undefined ? avatar : prev.avatarUrl,
      }));
    } else if (tab === 'line-chat') {
      setLineChatData((prev) => ({
        ...prev,
        contactName: name !== undefined ? name : prev.contactName,
        contactAvatar: avatar !== undefined ? avatar : prev.contactAvatar,
      }));
    }
  };

  const getCurrentTabFormData = (tab: PlatformTab): any => {
    switch (tab) {
      case 'twitter': return twitterData;
      case 'instagram-feed': return instagramFeedData;
      case 'instagram-story': return instagramStoryData;
      case 'instagram-story-reply': return instagramStoryReplyData;
      case 'instagram-story-viewers': return instagramStoryViewersData;
      case 'instagram-profile': return instagramProfileData;
      case 'instagram-live': return instagramLiveData;
      case 'instagram-notes': return instagramNotesData;
      case 'instagram-activity': return instagramActivityData;
      case 'instagram-dm': return instagramDMData;
      case 'instagram-dm-inbox': return instagramDMInboxData;
      case 'instagram-feed-comments': return instagramFeedCommentsData;
      case 'whatsapp-chat': return whatsAppChatData;
      case 'whatsapp-call': return whatsAppCallData;
      case 'whatsapp-status': return whatsAppStatusData;
      case 'whatsapp-viewers': return whatsAppViewersData;
      case 'tiktok-profile': return tikTokProfileData;
      case 'tiktok-feed-live': return tikTokFeedLiveData;
      case 'tiktok-fyp': return tikTokFypData;
      case 'ios-lockscreen': return iosLockscreenData;
      case 'line-chat': return lineChatData;
      case 'notes': return notesData;
      case 'push-notification': return pushNotificationData;
      case 'spotify-card': return spotifyData;
      default: return twitterData;
    }
  };

  // The editor and the private export-render route resolve previews through the
  // same registry. Story Reply intentionally preserves the existing canonical
  // editor behavior, which currently mirrors the Story preview data.
  const currentPreviewData = activeTab === 'instagram-story-reply'
    ? instagramStoryData
    : getCurrentTabFormData(activeTab);

  const handleRegisteredPreviewChange = (next: any) => {
    switch (activeTab) {
      case 'twitter': return handleTwitterDataChange(next);
      case 'instagram-dm': return handleInstagramDMDataChange(next);
      case 'whatsapp-chat': return handleWhatsAppChatDataChange(next);
      case 'whatsapp-call': return handleWhatsAppCallDataChange(next);
      case 'whatsapp-status': return handleWhatsAppStatusDataChange(next);
      case 'whatsapp-viewers': return handleWhatsAppViewersDataChange(next);
      case 'tiktok-profile': return handleTikTokProfileDataChange(next);
      case 'ios-lockscreen': return handleIosLockscreenDataChange(next);
      case 'line-chat': return handleLineChatDataChange(next);
      case 'notes': return handleNotesDataChange(next);
      case 'push-notification': return handlePushNotificationDataChange(next);
      case 'spotify-card': return handleSpotifyDataChange(next);
      default: return undefined;
    }
  };

  const handleRegisteredMessageText = (id: string, text: string) => {
    if (activeTab === 'instagram-dm') return handleUpdateInstagramDMMessageText(id, text);
    if (activeTab === 'whatsapp-chat') return handleUpdateWhatsAppMessageText(id, text);
    if (activeTab === 'line-chat') {
      setLineChatData((prev) => ({
        ...prev,
        messages: (prev.messages || []).map((message) =>
          message.id === id ? { ...message, text } : message
        ),
      }));
    }
  };

  // Helper to set tab form data
  const loadTabFormData = (tab: PlatformTab, data: any) => {
    if (!data) return;
    const cloned = JSON.parse(JSON.stringify(data));
    if (tab === 'twitter') setTwitterData(cloned);
    else if (tab === 'instagram-feed') setInstagramFeedData(cloned);
    else if (tab === 'instagram-story') setInstagramStoryData(cloned);
    else if (tab === 'instagram-story-reply') setInstagramStoryReplyData(cloned);
    else if (tab === 'instagram-story-viewers') setInstagramStoryViewersData(cloned);
    else if (tab === 'instagram-profile') setInstagramProfileData(cloned);
    else if (tab === 'instagram-live') setInstagramLiveData(cloned);
    else if (tab === 'instagram-notes') setInstagramNotesData(cloned);
    else if (tab === 'instagram-activity') setInstagramActivityData(cloned);
    else if (tab === 'instagram-dm') setInstagramDMData(cloned);
    else if (tab === 'instagram-dm-inbox') setInstagramDMInboxData(cloned);
    else if (tab === 'instagram-feed-comments') setInstagramFeedCommentsData(cloned);
    else if (tab === 'whatsapp-chat') setWhatsAppChatData(cloned);
    else if (tab === 'whatsapp-call') setWhatsAppCallData(cloned);
    else if (tab === 'whatsapp-status') setWhatsAppStatusData(cloned);
    else if (tab === 'whatsapp-viewers') setWhatsAppViewersData(cloned);
    else if (tab === 'tiktok-profile') setTikTokProfileData(cloned);
    else if (tab === 'tiktok-feed-live') setTikTokFeedLiveData(cloned);
    else if (tab === 'tiktok-fyp') setTikTokFypData(cloned);
    else if (tab === 'ios-lockscreen') setIosLockscreenData(cloned);
    else if (tab === 'line-chat') setLineChatData(cloned);
    else if (tab === 'notes') setNotesData(cloned);
    else if (tab === 'push-notification') setPushNotificationData(cloned);
    else if (tab === 'spotify-card') setSpotifyData(cloned);
  };

  const handleResetActiveTabState = () => {
    const initialData = getInitialTabData(activeTab);
    const cloned = JSON.parse(JSON.stringify(initialData));
    loadTabFormData(activeTab, cloned);
    updateActiveFolderData(activeTab, cloned);
  };

  // Complete Workspace Data Gatherer for multi-device sync
  const gatherCompleteWorkspacePayload = useCallback(() => {
    const currentFormData = getCurrentTabFormData(activeTab);

    // 1. Gather all form states across all platforms to guarantee zero data loss
    const allFormStates: Record<string, any> = {
      'twitter': twitterData,
      'instagram-feed': instagramFeedData,
      'instagram-story': instagramStoryData,
      'instagram-story-reply': instagramStoryReplyData,
      'instagram-story-viewers': instagramStoryViewersData,
      'instagram-profile': instagramProfileData,
      'instagram-live': instagramLiveData,
      'instagram-notes': instagramNotesData,
      'instagram-activity': instagramActivityData,
      'instagram-dm': instagramDMData,
      'instagram-dm-inbox': instagramDMInboxData,
      'instagram-feed-comments': instagramFeedCommentsData,
      'whatsapp-chat': whatsAppChatData,
      'whatsapp-call': whatsAppCallData,
      'whatsapp-status': whatsAppStatusData,
      'whatsapp-viewers': whatsAppViewersData,
      'tiktok-profile': tikTokProfileData,
      'tiktok-feed-live': tikTokFeedLiveData,
      'tiktok-fyp': tikTokFypData,
      'ios-lockscreen': iosLockscreenData,
      'line-chat': lineChatData,
      'notes': notesData,
      'push-notification': pushNotificationData,
      'spotify-card': spotifyData,
    };
    if (activeTab && currentFormData) {
      allFormStates[activeTab] = currentFormData;
    }

    const effectiveModuleFolders = moduleFoldersRef.current && Object.keys(moduleFoldersRef.current).length > 0
      ? moduleFoldersRef.current
      : moduleFolders;
    const effectiveActiveFolderIds = activeFolderIdsRef.current && Object.keys(activeFolderIdsRef.current).length > 0
      ? activeFolderIdsRef.current
      : activeFolderIds;

    return {
      userId: authUser?.uid || 'anonymous',
      userEmail: authUser?.email ? authUser.email.toLowerCase() : (authUser?.uid || ''),
      lastActiveTab: activeTab,
      lastActiveCategory: activeCategory,
      updatedBy: clientSessionId,
      // Complete form states & histories across all tabs
      formStates: allFormStates,
      // Module folders & active folder IDs
      moduleFolders: effectiveModuleFolders,
      activeFolderIds: effectiveActiveFolderIds,
      characters: effectiveModuleFolders,
      folderStates: effectiveModuleFolders,
      preferences: {
        uiTheme,
        language,
        globalFont,
        customFontName,
        cornerRadius,
      },
      userAssets: readPersistentUserAssets(authUser?.uid, authUser?.email),
      updatedAt: new Date().toISOString(),
    };
  }, [
    activeTab,
    activeCategory,
    moduleFolders,
    activeFolderIds,
    uiTheme,
    language,
    globalFont,
    customFontName,
    cornerRadius,
    authUser?.email,
    authUser?.uid,
    userAccountKey,
    twitterData,
    instagramFeedData,
    instagramStoryData,
    instagramStoryReplyData,
    instagramStoryViewersData,
    instagramProfileData,
    instagramLiveData,
    instagramNotesData,
    instagramActivityData,
    instagramDMData,
    instagramDMInboxData,
    instagramFeedCommentsData,
    whatsAppChatData,
    whatsAppCallData,
    whatsAppStatusData,
    whatsAppViewersData,
    tikTokProfileData,
    tikTokFeedLiveData,
    tikTokFypData,
    iosLockscreenData,
    lineChatData,
    notesData,
    pushNotificationData,
    spotifyData,
  ]);

  // Ref to always access the latest complete workspace payload without forcing callback recreation
  const gatherCompleteWorkspacePayloadRef = useRef(gatherCompleteWorkspacePayload);
  gatherCompleteWorkspacePayloadRef.current = gatherCompleteWorkspacePayload;

  // Debounced real-time cloud workspace sync to Firestore (Multi-Device)
  const triggerCloudWorkspaceSync = useCallback(() => {
    // Gate: Auto-save must never run before hydration completes
    if (!isHydratedRef.current) {
      return;
    }
    const userEmailOrId = authUser?.uid || auth.currentUser?.uid;
    if (!userEmailOrId) return;
    if (isFirestoreQuotaExhausted()) {
      setCloudSyncState('offline');
      return;
    }
    if (syncDebounceTimerRef.current) {
      clearTimeout(syncDebounceTimerRef.current);
    }
    syncDebounceTimerRef.current = setTimeout(async () => {
      if (!isHydratedRef.current) return;
      if (isFirestoreQuotaExhausted()) {
        setCloudSyncState('offline');
        return;
      }
      try {
        setCloudSyncState('syncing');
        const payload = gatherCompleteWorkspacePayloadRef.current();
        await saveUserWorkspaceToFirestore(userEmailOrId, payload);
        if (auth.currentUser?.uid !== userEmailOrId) return;
        if (isFirestoreQuotaExhausted()) {
          setCloudSyncState('offline');
        } else {
          clearPendingCloudSync(userAccountKey);
          setCloudSyncState('synced');
          setLastSyncedTime(new Date());
        }
      } catch (err) {
        console.warn('Real-time cloud sync notice:', err);
        setCloudSyncState(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error');
      }
    }, 800);
  }, [authUser?.email, authUser?.uid]);

  // Keep ref up to date for safe invocation across mutations
  useEffect(() => {
    triggerCloudWorkspaceSyncRef.current = triggerCloudWorkspaceSync;
  }, [triggerCloudWorkspaceSync]);

  // Instant force sync for structural mutations (preset creation, slot deletes, duplicate, etc.)
  const forceCloudWorkspaceSyncNow = useCallback(async () => {
    // Gate: Force sync must never run before hydration completes
    if (!isHydratedRef.current) {
      return;
    }
    const userEmailOrId = authUser?.uid || auth.currentUser?.uid;
    if (!userEmailOrId) return;
    if (isFirestoreQuotaExhausted()) {
      setCloudSyncState('offline');
      return;
    }
    setCloudSyncState('syncing');
    try {
      const payload = gatherCompleteWorkspacePayloadRef.current();
      await saveUserWorkspaceToFirestore(userEmailOrId, payload);
      if (auth.currentUser?.uid !== userEmailOrId) return;
      if (isFirestoreQuotaExhausted()) {
        setCloudSyncState('offline');
      } else {
        clearPendingCloudSync(userAccountKey);
        setCloudSyncState('synced');
        setLastSyncedTime(new Date());
      }
    } catch (err) {
      console.warn('Force cloud sync notice:', err);
      setCloudSyncState(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error');
    }
  }, [authUser?.email, authUser?.uid]);

  forceCloudWorkspaceSyncNowRef.current = forceCloudWorkspaceSyncNow;

  const hasInitialTabHydratedRef = useRef(false);

  // Apply cloud workspace updates into local memory, UI state & localStorage cache
  const applyCloudWorkspaceData = useCallback((cloudData: any, forceHydrate: boolean = false) => {
    if (!cloudData) return;

    // Protect local state: only if user has actively made local edits in this active session AND not forceHydrating
    if (!forceHydrate && hasLocalUserEditsInSessionRef.current) {
      const localLastUpdated = parseInt(localStorage.getItem(getLocalUpdateStorageKey(userAccountKey)) || '0', 10);
      const cloudUpdatedAt = cloudData.updatedAt ? new Date(cloudData.updatedAt).getTime() : 0;
      if (localLastUpdated > 0 && (!cloudUpdatedAt || localLastUpdated >= cloudUpdatedAt)) {
        forceCloudWorkspaceSyncNowRef.current();
        return;
      }
    }

    // 1. Sync module folders across all platform tabs with safe merge
    const nextFolders = cloudData.moduleFolders && typeof cloudData.moduleFolders === 'object'
      ? cloudData.moduleFolders
      : null;
    const nextActiveIds = cloudData.activeFolderIds && typeof cloudData.activeFolderIds === 'object'
      ? cloudData.activeFolderIds
      : null;

    if (nextFolders) {
      const mergedFolders: Record<string, AUFolder[]> = { ...(moduleFoldersRef.current || moduleFolders) };
      Object.entries(nextFolders).forEach(([t, fList]) => {
        if (Array.isArray(fList) && fList.length > 0) {
          mergedFolders[t] = fList;
        }
      });
      setModuleFolders(mergedFolders);
      moduleFoldersRef.current = mergedFolders;
      Object.entries(mergedFolders).forEach(([t, fList]) => {
        try {
          localStorage.setItem(getModuleFoldersKey(userAccountKey, t as PlatformTab), JSON.stringify(fList));
          if (Array.isArray(fList)) {
            fList.forEach((f: any) => {
              if (f && f.id) {
                localStorage.setItem(getModuleFolderItemKey(userAccountKey, t as PlatformTab, f.id), JSON.stringify(f));
              }
            });
          }
        } catch {}
      });
    }

    if (nextActiveIds) {
      const mergedActiveIds: Record<string, string> = { ...(activeFolderIdsRef.current || activeFolderIds), ...nextActiveIds };
      setActiveFolderIds(mergedActiveIds);
      activeFolderIdsRef.current = mergedActiveIds;
      Object.entries(mergedActiveIds).forEach(([t, aId]) => {
        try {
          localStorage.setItem(getModuleActiveFolderKey(userAccountKey, t as PlatformTab), String(aId));
        } catch {}
      });
    }

    // 2. Load the active folder's data for each platform tab to preserve folder isolation
    const effectiveFolders = nextFolders || moduleFoldersRef.current;
    const effectiveActiveIds = nextActiveIds || activeFolderIdsRef.current;

    ALL_PLATFORM_TABS.forEach((tab) => {
      const tabFolderList = effectiveFolders?.[tab];
      if (tabFolderList && Array.isArray(tabFolderList) && tabFolderList.length > 0) {
        const activeId = effectiveActiveIds?.[tab] || tabFolderList[0]?.id || 'folder-1';
        const targetFolder = tabFolderList.find((f: any) => f.id === activeId) || tabFolderList[0];
        if (targetFolder && targetFolder.data) {
          loadTabFormData(tab, targetFolder.data);
          try {
            localStorage.setItem(getFormStorageKey(userAccountKey, tab), JSON.stringify(targetFolder.data));
          } catch {}
        }
      } else if (cloudData.formStates && cloudData.formStates[tab]) {
        loadTabFormData(tab, cloudData.formStates[tab]);
        try {
          localStorage.setItem(getFormStorageKey(userAccountKey, tab), JSON.stringify(cloudData.formStates[tab]));
        } catch {}
      }
    });

    // 4. Sync user preferences
    if (cloudData.preferences) {
      if (cloudData.preferences.uiTheme && (cloudData.preferences.uiTheme === 'dark' || cloudData.preferences.uiTheme === 'light')) {
        setUiTheme(cloudData.preferences.uiTheme);
        try { localStorage.setItem('au_ui_theme', cloudData.preferences.uiTheme); } catch {}
      }
      if (cloudData.preferences.globalFont) {
        setGlobalFont(cloudData.preferences.globalFont);
        try { localStorage.setItem('global_app_font', cloudData.preferences.globalFont); } catch {}
      }
      if (cloudData.preferences.customFontName) {
        setCustomFontName(cloudData.preferences.customFontName);
        try { localStorage.setItem('global_custom_font_name', cloudData.preferences.customFontName); } catch {}
      }
      if (typeof (cloudData.preferences.cornerRadius ?? cloudData.preferences.cardCornerRadius) === 'number') {
        const rad = cloudData.preferences.cornerRadius ?? cloudData.preferences.cardCornerRadius;
        setCornerRadius(rad);
        try { localStorage.setItem('global_card_corner_radius', String(rad)); } catch {}
      }
    }

    if (cloudData.userAssets && authUser?.uid) {
      isApplyingCloudAssetsRef.current = true;
      try {
        persistUserAssets(authUser.uid, cloudData.userAssets, true);
      } finally {
        isApplyingCloudAssetsRef.current = false;
      }
    }

    // 5. Restore active tab & category ONLY once on initial page load / login
    if (forceHydrate && !hasInitialTabHydratedRef.current) {
      hasInitialTabHydratedRef.current = true;
      if (cloudData.lastActiveTab && ALL_PLATFORM_TABS.includes(cloudData.lastActiveTab)) {
        setActiveTab(cloudData.lastActiveTab);
        try { localStorage.setItem('au_last_active_tab', cloudData.lastActiveTab); } catch {}
      }
      if (cloudData.lastActiveCategory) {
        setActiveCategory(cloudData.lastActiveCategory);
      }
    }

    // Mark session as aligned with cloud data
    hasLocalUserEditsInSessionRef.current = false;
    const cloudTime = cloudData.updatedAt ? new Date(cloudData.updatedAt).getTime() : Date.now();
    try {
      localStorage.setItem(getLocalUpdateStorageKey(userAccountKey), String(cloudTime));
      clearPendingCloudSync(userAccountKey);
    } catch {}
  }, [userAccountKey, authUser?.uid]);

  const applyCloudWorkspaceDataRef = useRef(applyCloudWorkspaceData);
  applyCloudWorkspaceDataRef.current = applyCloudWorkspaceData;

  // Manual Cloud Sync: Push all folders 1, 2, 3 and workspace to Firestore
  const handleManualCloudBackup = async () => {
    const userEmailOrId = authUser?.uid;
    if (!userEmailOrId) {
      setCloudToast({
        show: true,
        message: language === 'id' ? 'Silakan login akun Google/Email terlebih dahulu.' : 'Please log in with Google/Email first.',
        type: 'warning',
      });
      return;
    }
    setCloudSyncState('syncing');
    try {
      const payload = gatherCompleteWorkspacePayloadRef.current();
      await saveUserWorkspaceToFirestore(userEmailOrId, payload);
      if (auth.currentUser?.uid === userEmailOrId) clearPendingCloudSync(userAccountKey);
      // Synchronize all folders
      ALL_PLATFORM_TABS.forEach((t) => {
        const folders = moduleFoldersRef.current[t] || [];
        folders.forEach((f) => {
          syncFolderToFirestore(f.id, f, userEmailOrId, t);
        });
      });
      setCloudSyncState('synced');
      setLastSyncedTime(new Date());
      setCloudToast({
        show: true,
        message: language === 'id' ? 'Data folder dan workspace berhasil dicadangkan ke Cloud!' : 'All folder data and workspace backed up to Cloud!',
        type: 'success',
      });
    } catch (err) {
      setCloudSyncState(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error');
      setCloudToast({
        show: true,
        message: language === 'id' ? 'Gagal mencadangkan ke cloud. Periksa koneksi Anda.' : 'Failed to backup to cloud. Check your connection.',
        type: 'error',
      });
    }
  };

  // Manual Cloud Restore: Reload all folders from Firestore
  const handleManualCloudRestore = async () => {
    const userEmailOrId = authUser?.uid;
    if (!userEmailOrId) {
      setCloudToast({
        show: true,
        message: language === 'id' ? 'Silakan login akun terlebih dahulu.' : 'Please log in first.',
        type: 'warning',
      });
      return;
    }
    setCloudSyncState('syncing');
    try {
      const requestedUid = userEmailOrId;
      const cloudData = await loadUserWorkspaceFromFirestore(userEmailOrId);
      if (auth.currentUser?.uid !== requestedUid) return;
      if (cloudData) {
        applyCloudWorkspaceData(cloudData, true);
        setCloudSyncState('synced');
        setLastSyncedTime(new Date());
        setCloudToast({
          show: true,
          message: language === 'id' ? 'Data folder dan workspace berhasil dimuat ulang dari Cloud!' : 'All folder data and workspace reloaded from Cloud!',
          type: 'success',
        });
      } else {
        setCloudSyncState('synced');
        setCloudToast({
          show: true,
          message: language === 'id' ? 'Belum ada data cadangan di cloud untuk akun ini.' : 'No cloud backup found for this account.',
          type: 'info',
        });
      }
    } catch (err) {
      setCloudSyncState(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error');
      setCloudToast({
        show: true,
        message: language === 'id' ? 'Gagal memuat data dari cloud.' : 'Failed to load from cloud.',
        type: 'error',
      });
    }
  };

  // Real-time multi-device subscription & initial cloud hydration (Laptop <-> HP)
  useEffect(() => {
    const userEmailOrId = authUser?.uid;
    if (!userEmailOrId) {
      accountSyncGenerationRef.current += 1;
      setCloudSyncState('signed_out');
      setIsHydrated(true);
      isHydratedRef.current = true;
      return;
    }

    const expectedUid = userEmailOrId;
    const generation = ++accountSyncGenerationRef.current;
    let disposed = false;
    const isCurrentAccount = () =>
      !disposed &&
      accountSyncGenerationRef.current === generation &&
      auth.currentUser?.uid === expectedUid;

    setCloudSyncState('syncing');

    // Immediately switch account-scoped persistent assets in mounted forms. The cloud
    // snapshot below remains authoritative and replaces this cache after hydration.
    isApplyingCloudAssetsRef.current = true;
    try {
      persistUserAssets(expectedUid, readPersistentUserAssets(expectedUid, authUser?.email), true);
    } finally {
      isApplyingCloudAssetsRef.current = false;
    }

    // 1. Initial hydration from Firestore
    setIsInitialCloudLoading(true);
    setIsHydrated(false);
    isHydratedRef.current = false;
    setAuthLifecycleStage((prev) => (prev === 'LOAD_USER_DATA' ? 'HYDRATE_DATA' : prev));
    const hydrationSafetyTimer = setTimeout(() => {
      if (!isCurrentAccount()) return;
      setIsInitialCloudLoading(false);
      setIsHydrated(true);
      isHydratedRef.current = true;
      setAuthLifecycleStage((prev) => (prev === 'HYDRATE_DATA' || prev === 'LOAD_USER_DATA' ? 'READY' : prev));
    }, 6000);

    loadUserWorkspaceFromFirestore(userEmailOrId)
      .then((cloudWorkspace) => {
        if (!isCurrentAccount()) return;
        clearTimeout(hydrationSafetyTimer);
        setIsInitialCloudLoading(false);
        if (cloudWorkspace && cloudWorkspace.hasLoadedData && cloudWorkspace.status === 'loaded') {
          const localUpdatedAt = parseInt(localStorage.getItem(getLocalUpdateStorageKey(userAccountKey)) || '0', 10);
          const hasPendingLocalSync = localStorage.getItem(getPendingCloudSyncStorageKey(userAccountKey)) === 'true';
          const cloudUpdatedAt = cloudWorkspace.updatedAt ? new Date(cloudWorkspace.updatedAt).getTime() : 0;
          if (hasPendingLocalSync && localUpdatedAt > 0 && (!cloudUpdatedAt || localUpdatedAt > cloudUpdatedAt)) {
            // Preserve newer offline/local edits through reload, then push them after hydration.
            setIsHydrated(true);
            isHydratedRef.current = true;
            forceCloudWorkspaceSyncNowRef.current();
          } else {
            applyCloudWorkspaceDataRef.current(cloudWorkspace, true);
          }
          setCloudSyncState('synced');
          setLastSyncedTime(new Date());
        } else if (cloudWorkspace && (cloudWorkspace.isNewUser || cloudWorkspace.status === 'new_user')) {
          // If first time on cloud for this account:
          // Check if this account already has existing local storage (folders or form data) for userAccountKey
          const localFolders = loadAllStoredModuleFolders(userAccountKey, ALL_PLATFORM_TABS);
          const hasExistingLocalData = ALL_PLATFORM_TABS.some((tab) => {
            const hasFolderStorage = Boolean(localStorage.getItem(getModuleFoldersKey(userAccountKey, tab)));
            const hasFormStorage = Boolean(localStorage.getItem(getFormStorageKey(userAccountKey, tab)));
            return hasFolderStorage || hasFormStorage;
          });

          if (hasExistingLocalData || hasLocalUserEditsInSessionRef.current) {
            // Preserve user's local data and sync to cloud immediately
            setModuleFolders(localFolders);
            moduleFoldersRef.current = localFolders;
            const loadedActiveIds = loadAllStoredActiveFolderIds(userAccountKey, ALL_PLATFORM_TABS);
            setActiveFolderIds(loadedActiveIds);
            activeFolderIdsRef.current = loadedActiveIds;
            ALL_PLATFORM_TABS.forEach((tab) => {
              const tabFolders = localFolders[tab] || [];
              const tabFolderId = loadedActiveIds[tab] || tabFolders[0]?.id;
              const currentFolder = tabFolders.find((f) => f.id === tabFolderId) || tabFolders[0];
              if (currentFolder && currentFolder.data) {
                loadTabFormData(tab, currentFolder.data);
              }
            });
            setIsHydrated(true);
            isHydratedRef.current = true;
            forceCloudWorkspaceSyncNowRef.current();
            setCloudSyncState('synced');
            setLastSyncedTime(new Date());
            setAuthLifecycleStage('READY');
            return;
          } else {
            const cleanFolders: Record<string, AUFolder[]> = {};
            const cleanActiveIds: Record<string, string> = {};
            ALL_PLATFORM_TABS.forEach((tab) => {
              cleanFolders[tab] = [{ id: 'folder-1', name: 'Folder 1', data: getInitialTabData(tab), order: 1 }];
              cleanActiveIds[tab] = 'folder-1';
              loadTabFormData(tab, getInitialTabData(tab));
            });
            setModuleFolders(cleanFolders);
            moduleFoldersRef.current = cleanFolders;
            setActiveFolderIds(cleanActiveIds);
            activeFolderIdsRef.current = cleanActiveIds;
            setIsHydrated(true);
            isHydratedRef.current = true;
            forceCloudWorkspaceSyncNowRef.current();
            setCloudSyncState('synced');
            setLastSyncedTime(new Date());
            setAuthLifecycleStage('READY');
            return;
          }
        } else {
          // If Cloud response is an error or offline, never destroy local data
          setCloudSyncState(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error');
        }
        setIsHydrated(true);
        isHydratedRef.current = true;
        setAuthLifecycleStage('READY');
      })
      .catch(() => {
        if (!isCurrentAccount()) return;
        clearTimeout(hydrationSafetyTimer);
        setIsInitialCloudLoading(false);
        setIsHydrated(true);
        isHydratedRef.current = true;
        setCloudSyncState(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error');
        setAuthLifecycleStage('READY');
      });

    // 2. Real-time snapshot listener across devices
    const unsubscribe = subscribeUserWorkspaceFromFirestore(
      userEmailOrId,
      (cloudData) => {
        if (!cloudData || !isCurrentAccount()) return;
        // Suppress echo from this exact client session
        if (cloudData.updatedBy === clientSessionId) {
          setCloudSyncState('synced');
          setLastSyncedTime(new Date());
          return;
        }
        applyCloudWorkspaceDataRef.current(cloudData, false);
        setCloudSyncState('synced');
        setLastSyncedTime(new Date());
      },
      () => {
        if (!isCurrentAccount()) return;
        setCloudSyncState(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error');
      }
    );

    return () => {
      disposed = true;
      clearTimeout(hydrationSafetyTimer);
      unsubscribe();
    };
  }, [authUser?.uid, userAccountKey]);

  // Auto-sync form changes into active folder state & storage in real time
  const updateActiveFolderData = (tab: PlatformTab, updated: any) => {
    hasLocalUserEditsInSessionRef.current = true;
    const activeFolderId =
      activeFolderIdsRef.current[tab] ||
      activeFolderIds[tab] ||
      moduleFoldersRef.current[tab]?.[0]?.id ||
      'folder-1';
    const clonedUpdated = JSON.parse(JSON.stringify(updated));

    // 1. Immediate synchronous auto-save to localStorage
    try {
      localStorage.setItem(getFormStorageKey(userAccountKey, tab), JSON.stringify(clonedUpdated));
      const currentList = moduleFoldersRef.current[tab] || moduleFolders[tab] || [{ id: 'folder-1', name: 'Folder 1', data: clonedUpdated }];
      const targetId = currentList.some((f) => f.id === activeFolderId) ? activeFolderId : currentList[0]?.id || 'folder-1';
      const updatedAt = new Date().toISOString();
      const nextList = currentList.map((folder) =>
        folder.id === targetId ? { ...folder, data: clonedUpdated, updatedAt } : folder
      );
      moduleFoldersRef.current[tab] = nextList;
      localStorage.setItem(getModuleFoldersKey(userAccountKey, tab), JSON.stringify(nextList));
      const targetFolder = nextList.find((f) => f.id === targetId);
      if (targetFolder) {
        localStorage.setItem(getModuleFolderItemKey(userAccountKey, tab, targetId), JSON.stringify(targetFolder));
      }
      markLocalWorkspaceUpdated(userAccountKey);
    } catch (e) {
      console.warn('[Auto-Save] Synchronous localStorage write warning:', e);
    }

    // 2. React state update
    setModuleFolders((prev) => {
      const currentList = prev[tab] || [{ id: 'folder-1', name: 'Folder 1', data: clonedUpdated }];
      const targetId = currentList.some((f) => f.id === activeFolderId) ? activeFolderId : currentList[0].id;
      const updatedAt = new Date().toISOString();
      const nextList = currentList.map((folder) =>
        folder.id === targetId ? { ...folder, data: clonedUpdated, updatedAt } : folder
      );
      return { ...prev, [tab]: nextList };
    });
    triggerCloudWorkspaceSync();
  };

  // 1. Create Slot Handler ("+ Add Folder")
  const handleAddCharacterSlot = async () => {
    hasLocalUserEditsInSessionRef.current = true;
    const currentTab = activeTab;
    const currentActiveId =
      activeFolderIdsRef.current[currentTab] ||
      activeFolderIds[currentTab] ||
      moduleFoldersRef.current[currentTab]?.[0]?.id ||
      'folder-1';

    // Ensure the current folder's state is preserved with its latest form data
    const currentFormData = getCurrentTabFormData(currentTab);
    const clonedCurrentData = currentFormData ? JSON.parse(JSON.stringify(currentFormData)) : getInitialTabData(currentTab);

    // Read from moduleFoldersRef.current first so rapid clicks use the latest list
    const existingList = (moduleFoldersRef.current && moduleFoldersRef.current[currentTab] && moduleFoldersRef.current[currentTab].length > 0)
      ? moduleFoldersRef.current[currentTab]
      : (moduleFolders[currentTab] || [
          { id: 'folder-1', name: 'Folder 1', data: clonedCurrentData, order: 1 },
        ]);

    const updatedExistingList = existingList.map((f, idx) =>
      f.id === currentActiveId ? { ...f, data: clonedCurrentData, order: typeof f.order === 'number' ? f.order : idx + 1 } : f
    );

    // Calculate sequential index: Folder 1, Folder 2, Folder 3...
    let maxIdx = 0;
    updatedExistingList.forEach((f, idx) => {
      const match = f.name?.match(/Folder\s*(\d+)/i) || f.id?.match(/folder-(\d+)/i);
      const num = match ? parseInt(match[1], 10) : (typeof f.order === 'number' ? f.order : idx + 1);
      if (num > maxIdx) maxIdx = num;
    });
    const nextIdx = Math.max(updatedExistingList.length + 1, maxIdx + 1);
    // IDs are immutable and never derived from list position, so delete/reorder cannot
    // collide with an older cloud document.
    const newFolderId = `folder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newFolderName = `Folder ${nextIdx}`;

    // Fresh, isolated clean reset data for the new folder: guaranteed 100% clean / reset from scratch!
    const initialData = getInitialTabData(currentTab);
    const cleanFreshData = JSON.parse(JSON.stringify(initialData));
    const newFolder: AUFolder = {
      id: newFolderId,
      name: newFolderName,
      data: cleanFreshData,
      order: nextIdx,
      updatedAt: new Date().toISOString(),
    };

    const nextList = [...updatedExistingList, newFolder];

    // Synchronously update refs so any immediate change applies to the new folder
    activeFolderIdsRef.current[currentTab] = newFolderId;
    moduleFoldersRef.current[currentTab] = nextList;

    // Update state immutably and persist
    setModuleFolders((prev) => {
      try {
        localStorage.setItem(getModuleFoldersKey(userAccountKey, currentTab), JSON.stringify(nextList));
        localStorage.setItem(getModuleFolderItemKey(userAccountKey, currentTab, newFolderId), JSON.stringify(newFolder));
      } catch {}
      return { ...prev, [currentTab]: nextList };
    });

    setActiveFolderIds((prev) => {
      try {
        localStorage.setItem(getModuleActiveFolderKey(userAccountKey, currentTab), newFolderId);
        localStorage.setItem(getFormStorageKey(userAccountKey, currentTab), JSON.stringify(cleanFreshData));
      } catch {}
      return { ...prev, [currentTab]: newFolderId };
    });

    // Immediately load the clean form data for the new folder
    loadTabFormData(currentTab, cleanFreshData);
    try {
      markLocalWorkspaceUpdated(userAccountKey);
    } catch {}

    // Sync new folder to cloud Firestore immediately and await
    const userEmailOrId = authUser?.uid;
    if (userEmailOrId) {
      await syncFolderToFirestore(newFolderId, newFolder, userEmailOrId, currentTab).catch(() => {});
    }

    await forceCloudWorkspaceSyncNow();
  };

  // Form Change Handlers (auto-syncs to active folder preset and storage with strict tab isolation)
  const handleTwitterDataChange = (updated: TwitterPostData) => {
    setTwitterData(updated);
    updateActiveFolderData('twitter', updated);
  };

  const handleInstagramFeedDataChange = (updated: InstagramFeedData) => {
    setInstagramFeedData(updated);
    updateActiveFolderData('instagram-feed', updated);
  };

  const handleInstagramStoryDataChange = (updated: InstagramStoryData) => {
    setInstagramStoryData(updated);
    updateActiveFolderData('instagram-story', updated);
  };

  const handleInstagramStoryReplyDataChange = (updated: InstagramStoryReplyData) => {
    setInstagramStoryReplyData(updated);
    updateActiveFolderData('instagram-story-reply', updated);
  };

  const handleInstagramStoryViewersDataChange = (updated: InstagramStoryViewersData) => {
    setInstagramStoryViewersData(updated);
    updateActiveFolderData('instagram-story-viewers', updated);
  };

  const handleInstagramProfileDataChange = (updated: InstagramProfileData) => {
    setInstagramProfileData(updated);
    updateActiveFolderData('instagram-profile', updated);
  };

  const handleInstagramLiveDataChange = (updated: InstagramLiveData) => {
    setInstagramLiveData(updated);
    updateActiveFolderData('instagram-live', updated);
  };

  const handleInstagramNotesDataChange = (updated: InstagramNotesData) => {
    setInstagramNotesData(updated);
    updateActiveFolderData('instagram-notes', updated);
  };

  const handleInstagramActivityDataChange = (updated: InstagramActivityData) => {
    setInstagramActivityData(updated);
    updateActiveFolderData('instagram-activity', updated);
  };

  const handleInstagramDMDataChange = (updated: InstagramDMData) => {
    setInstagramDMData(updated);
    updateActiveFolderData('instagram-dm', updated);
  };

  const handleInstagramDMInboxDataChange = (updated: InstagramDMInboxData) => {
    setInstagramDMInboxData(updated);
    updateActiveFolderData('instagram-dm-inbox', updated);
  };

  const handleInstagramFeedCommentsDataChange = (updated: InstagramFeedCommentsData) => {
    setInstagramFeedCommentsData(updated);
    updateActiveFolderData('instagram-feed-comments', updated);
  };

  const handleWhatsAppChatDataChange = (updated: WhatsAppChatData) => {
    setWhatsAppChatData(updated);
    updateActiveFolderData('whatsapp-chat', updated);
  };

  const handleWhatsAppCallDataChange = (updated: WhatsAppCallData) => {
    setWhatsAppCallData(updated);
    updateActiveFolderData('whatsapp-call', updated);
  };

  const handleWhatsAppStatusDataChange = (updated: WhatsAppStatusData) => {
    setWhatsAppStatusData(updated);
    updateActiveFolderData('whatsapp-status', updated);
  };

  const handleWhatsAppViewersDataChange = (updated: WhatsAppViewersData) => {
    setWhatsAppViewersData(updated);
    updateActiveFolderData('whatsapp-viewers', updated);
  };

  const handleTikTokProfileDataChange = (updated: TikTokProfileData) => {
    setTikTokProfileData(updated);
    updateActiveFolderData('tiktok-profile', updated);
  };

  const handleTikTokFeedLiveDataChange = (updated: TikTokFeedLiveData) => {
    setTikTokFeedLiveData(updated);
    updateActiveFolderData('tiktok-feed-live', updated);
  };

  const handleTikTokFypDataChange = (updated: TikTokFypData) => {
    setTikTokFypData(updated);
    updateActiveFolderData('tiktok-fyp', updated);
  };

  const handleIosLockscreenDataChange = (updated: IOSLockscreenData) => {
    setIosLockscreenData(updated);
    updateActiveFolderData('ios-lockscreen', updated);
  };

  const handleLineChatDataChange = (updated: LineChatData) => {
    setLineChatData(updated);
    updateActiveFolderData('line-chat', updated);
  };

  const handleNotesDataChange = (updated: NotesData) => {
    setNotesData(updated);
    updateActiveFolderData('notes', updated);
  };

  const handlePushNotificationDataChange = (updated: PushNotificationData) => {
    setPushNotificationData(updated);
    updateActiveFolderData('push-notification', updated);
  };

  const handleSpotifyDataChange = (updated: SpotifyData) => {
    setSpotifyData(updated);
    updateActiveFolderData('spotify-card', updated);
  };

  const handleUpdateInstagramDMMessageText = (id: string, newText: string) => {
    setInstagramDMData((prev) => {
      const updated = {
        ...prev,
        messages: (prev.messages || []).map((msg) =>
          msg.id === id ? { ...msg, text: newText } : msg
        ),
      };
      updateActiveFolderData('instagram-dm', updated);
      return updated;
    });
  };

  const handleUpdateWhatsAppMessageText = (id: string, newText: string) => {
    setWhatsAppChatData((prev) => {
      const updated = {
        ...prev,
        messages: (prev.messages || []).map((msg) =>
          msg.id === id ? { ...msg, text: newText } : msg
        ),
      };
      updateActiveFolderData('whatsapp-chat', updated);
      return updated;
    });
  };

  // 2. Select & Load Folder Handler
  const handleSelectCharacter = (char: CharacterPreset | AUFolder) => {
    hasLocalUserEditsInSessionRef.current = true;
    const currentTab = activeTab;
    const targetId = char.id;
    const currentActiveId =
      activeFolderIdsRef.current[currentTab] ||
      activeFolderIds[currentTab] ||
      moduleFoldersRef.current[currentTab]?.[0]?.id ||
      'folder-1';
    if (currentActiveId === targetId) return;

    // 1. Save current active folder data first so edits are never lost
    const currentFormData = getCurrentTabFormData(currentTab);
    const clonedCurrentData = currentFormData ? JSON.parse(JSON.stringify(currentFormData)) : null;

    const currentList = moduleFolders[currentTab] || [];
    const updatedList = clonedCurrentData
      ? currentList.map((f) => (f.id === currentActiveId ? { ...f, data: clonedCurrentData } : f))
      : currentList;

    const targetFolder = updatedList.find((f) => f.id === targetId);
    if (!targetFolder) return;

    // 2. Synchronously set the active ref and update moduleFoldersRef
    activeFolderIdsRef.current[currentTab] = targetId;
    moduleFoldersRef.current[currentTab] = updatedList;

    // 3. Persist to localStorage
    try {
      localStorage.setItem(getModuleFoldersKey(userAccountKey, currentTab), JSON.stringify(updatedList));
      localStorage.setItem(getModuleActiveFolderKey(userAccountKey, currentTab), targetId);
      localStorage.setItem(getFormStorageKey(userAccountKey, currentTab), JSON.stringify(targetFolder.data));
      if (clonedCurrentData) {
        localStorage.setItem(getModuleFolderItemKey(userAccountKey, currentTab, currentActiveId), JSON.stringify({ id: currentActiveId, name: targetFolder.name || 'Folder', data: clonedCurrentData }));
      }
      localStorage.setItem(getModuleFolderItemKey(userAccountKey, currentTab, targetId), JSON.stringify(targetFolder));
      markLocalWorkspaceUpdated(userAccountKey);
    } catch {}

    // 4. Update states immutably
    setModuleFolders((prev) => ({ ...prev, [currentTab]: updatedList }));
    setActiveFolderIds((prev) => ({ ...prev, [currentTab]: targetId }));

    // 5. Load selected folder's data with fresh deep clone
    const clonedTargetData = JSON.parse(JSON.stringify(targetFolder.data));
    loadTabFormData(currentTab, clonedTargetData);

    triggerCloudWorkspaceSync();
  };

  // 3. Global "Save This Profile / Folder" Handler
  const handleSaveActiveProfile = () => {
    const currentFormData = getCurrentTabFormData(activeTab);
    if (currentFormData) {
      updateActiveFolderData(activeTab, currentFormData);
    }
  };

  // Delete folder preset
  const handleDeleteCharacter = async (charId: string) => {
    hasLocalUserEditsInSessionRef.current = true;
    const currentTab = activeTab;
    const currentList = (moduleFoldersRef.current && moduleFoldersRef.current[currentTab]) || moduleFolders[currentTab] || [];
    // Primary folder (Folder 1) cannot be deleted
    if (currentList.length <= 1 || charId === 'folder-1' || currentList[0]?.id === charId) {
      return;
    }

    const targetIdx = currentList.findIndex((f) => f.id === charId);
    if (targetIdx <= 0) return;

    const filtered = currentList.filter((f) => f.id !== charId);

    // Keep stable folder IDs. Only display order changes after a delete.
    const remainingFolders: AUFolder[] = filtered.map((f, idx) => ({
      ...f,
      order: idx + 1,
      updatedAt: new Date().toISOString(),
    }));

    const currentActiveId = activeFolderIdsRef.current[currentTab] || activeFolderIds[currentTab];
    let nextActiveId: string;
    if (currentActiveId === charId) {
      const fallbackIdx = Math.max(0, targetIdx - 1);
      nextActiveId = remainingFolders[fallbackIdx]?.id || remainingFolders[0].id;
    } else {
      const newActiveIdx = filtered.findIndex((f) => f.id === currentActiveId);
      nextActiveId = newActiveIdx !== -1 && remainingFolders[newActiveIdx] ? remainingFolders[newActiveIdx].id : remainingFolders[0].id;
    }

    activeFolderIdsRef.current[currentTab] = nextActiveId;
    moduleFoldersRef.current[currentTab] = remainingFolders;

    const activeFolder = remainingFolders.find((f) => f.id === nextActiveId) || remainingFolders[0];
    const clonedActiveData = JSON.parse(JSON.stringify(activeFolder.data));

    setModuleFolders((prev) => ({ ...prev, [currentTab]: remainingFolders }));
    setActiveFolderIds((prev) => ({ ...prev, [currentTab]: nextActiveId }));

    try {
      localStorage.setItem(getModuleFoldersKey(userAccountKey, currentTab), JSON.stringify(remainingFolders));
      localStorage.setItem(getModuleActiveFolderKey(userAccountKey, currentTab), nextActiveId);
      localStorage.setItem(getFormStorageKey(userAccountKey, currentTab), JSON.stringify(clonedActiveData));
      localStorage.removeItem(getModuleFolderItemKey(userAccountKey, currentTab, charId));
      remainingFolders.forEach((f) => {
        localStorage.setItem(getModuleFolderItemKey(userAccountKey, currentTab, f.id), JSON.stringify(f));
      });
      markLocalWorkspaceUpdated(userAccountKey);
    } catch {}

    loadTabFormData(currentTab, clonedActiveData);

    const userEmailOrId = authUser?.uid;
    if (userEmailOrId) {
      await deleteFolderFromFirestore(charId, userEmailOrId, currentTab).catch(() => {});
    }

    await forceCloudWorkspaceSyncNow();
  };

  // Rename folder preset
  const handleRenameCharacter = async (charId: string, newName: string) => {
    hasLocalUserEditsInSessionRef.current = true;
    const currentTab = activeTab;
    const cleanName = newName.trim();
    if (!cleanName) return;

    const currentList = (moduleFoldersRef.current && moduleFoldersRef.current[currentTab]) || moduleFolders[currentTab] || [];
    const nextList = currentList.map((f) =>
      f.id === charId ? { ...f, name: cleanName, updatedAt: new Date().toISOString() } : f
    );

    activeFolderIdsRef.current[currentTab] = activeFolderIdsRef.current[currentTab] || charId;
    moduleFoldersRef.current[currentTab] = nextList;

    setModuleFolders((prev) => ({ ...prev, [currentTab]: nextList }));

    try {
      localStorage.setItem(getModuleFoldersKey(userAccountKey, currentTab), JSON.stringify(nextList));
      const target = nextList.find((f) => f.id === charId);
      if (target) {
        localStorage.setItem(getModuleFolderItemKey(userAccountKey, currentTab, charId), JSON.stringify(target));
      }
      markLocalWorkspaceUpdated(userAccountKey);
    } catch {}

    const userEmailOrId = authUser?.uid;
    if (userEmailOrId) {
      const target = nextList.find((f) => f.id === charId);
      if (target) {
        await syncFolderToFirestore(charId, target, userEmailOrId, currentTab).catch(() => {});
      }
    }

    await forceCloudWorkspaceSyncNow();
  };

  // Global auto-save protection on page refresh, navigation or tab hide
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        const cur = getCurrentTabFormData(activeTab);
        if (cur) {
          const cloned = JSON.parse(JSON.stringify(cur));
          localStorage.setItem(getFormStorageKey(userAccountKey, activeTab), JSON.stringify(cloned));
          const currentList = moduleFoldersRef.current[activeTab] || [];
          const activeId = activeFolderIdsRef.current[activeTab] || currentList[0]?.id || 'folder-1';
          const nextList = currentList.map((f) => (f.id === activeId ? { ...f, data: cloned } : f));
          localStorage.setItem(getModuleFoldersKey(userAccountKey, activeTab), JSON.stringify(nextList));
          markLocalWorkspaceUpdated(userAccountKey);
        }
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        handleBeforeUnload();
        triggerCloudWorkspaceSyncRef.current?.();
      } else if (document.visibilityState === 'visible') {
        const userEmailOrId = authUser?.uid;
        if (userEmailOrId && !hasLocalUserEditsInSessionRef.current) {
          const requestedUid = userEmailOrId;
          loadUserWorkspaceFromFirestore(userEmailOrId)
            .then((cloudWorkspace) => {
              if (auth.currentUser?.uid !== requestedUid) return;
              if (cloudWorkspace) {
                applyCloudWorkspaceDataRef.current(cloudWorkspace, false);
              }
            })
            .catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [activeTab, userAccountKey]);

  // Export Download PNG Handler (strictly isolated from page reloads or form resets)
  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Flush current active form data synchronously to ensure 100% saved before export
    const currentFormData = getCurrentTabFormData(activeTab);
    if (currentFormData) {
      updateActiveFolderData(activeTab, currentFormData);
    }

    const targetElement =
      previewRef.current ||
      (document.getElementById('preview-canvas-container')?.firstElementChild as HTMLElement) ||
      document.getElementById('preview-target');
    if (!targetElement) {
      setExportError(language === 'id' ? 'Preview tidak ditemukan untuk diekspor.' : 'Preview target was not found.');
      return;
    }
    setExportError('');
    setIsExporting(true);

    const effectiveScale = exportScale || 1;
    const scaleSuffix = effectiveScale === 1 ? '1x' : effectiveScale === 2 ? '2x-HD' : '3x-4K';
    setExportStatusText(language === 'id' ? `Menyiapkan ${scaleSuffix}...` : `Preparing ${scaleSuffix}...`);

    try {
      const filename = `AU-Toolkit-${activeTab}-${scaleSuffix}.png`;
      const success = await downloadElementAsPng(targetElement, filename, effectiveScale, (step) => {
        setExportStatusText(step);
      });
      if (success) {
        setDownloadSuccess(true);
        setExportStatusText(language === 'id' ? 'Tersimpan!' : 'Saved PNG!');
        setTimeout(() => {
          setDownloadSuccess(false);
          setExportStatusText('');
        }, 2500);
      }
    } catch (err) {
      console.warn('Export error caught:', err);
      const message = err instanceof Error ? err.message : String(err);
      setExportError(language === 'id' ? `Export gagal: ${message}` : `Export failed: ${message}`);
      setExportStatusText('');
    } finally {
      setIsExporting(false);
    }
  };

  // Export Download JPG Handler (minimal compression for maximum sharpness before IG/TikTok)
  const handleDownloadJpg = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentFormData = getCurrentTabFormData(activeTab);
    if (currentFormData) {
      updateActiveFolderData(activeTab, currentFormData);
    }

    const targetElement =
      previewRef.current ||
      (document.getElementById('preview-canvas-container')?.firstElementChild as HTMLElement) ||
      document.getElementById('preview-target');
    if (!targetElement) {
      setExportError(language === 'id' ? 'Preview tidak ditemukan untuk diekspor.' : 'Preview target was not found.');
      return;
    }
    setExportError('');
    setIsExportingJpg(true);

    const effectiveScale = exportScale || 1;
    const scaleSuffix = effectiveScale === 1 ? '1x' : effectiveScale === 2 ? '2x-HD' : '3x-4K';
    setExportStatusText(language === 'id' ? `Menyiapkan ${scaleSuffix} JPG...` : `Preparing ${scaleSuffix} JPG...`);

    try {
      const filename = `AU-Toolkit-${activeTab}-${scaleSuffix}.jpg`;
      // Encode once at maximum browser JPEG quality; no intermediate JPEG pass.
      const success = await downloadElementAsJpg(targetElement, filename, effectiveScale, 1.0, (step) => {
        setExportStatusText(step);
      });
      if (success) {
        setDownloadJpgSuccess(true);
        setExportStatusText(language === 'id' ? 'Tersimpan!' : 'Saved JPG!');
        setTimeout(() => {
          setDownloadJpgSuccess(false);
          setExportStatusText('');
        }, 2500);
      }
    } catch (err) {
      console.warn('Export JPG error caught:', err);
      const message = err instanceof Error ? err.message : String(err);
      setExportError(language === 'id' ? `Export gagal: ${message}` : `Export failed: ${message}`);
      setExportStatusText('');
    } finally {
      setIsExportingJpg(false);
    }
  };

  // Copy Image to Clipboard Handler (strictly isolated from page reloads or form resets)
  const handleCopyClipboard = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentFormData = getCurrentTabFormData(activeTab);
    if (currentFormData) {
      updateActiveFolderData(activeTab, currentFormData);
    }

    const targetElement =
      previewRef.current ||
      (document.getElementById('preview-canvas-container')?.firstElementChild as HTMLElement) ||
      document.getElementById('preview-target');
    if (!targetElement) {
      setExportError(language === 'id' ? 'Preview tidak ditemukan untuk disalin.' : 'Preview target was not found.');
      return;
    }
    setExportError('');
    setIsExporting(true);

    try {
      const isStoryModule = activeTab === 'instagram-story' || activeTab === 'instagram-story-reply' || activeTab === 'instagram-story-viewers';
      const effectiveScale = isStoryModule ? Math.max(exportScale || 1, 3) : exportScale;
      const success = await copyElementToClipboard(targetElement, effectiveScale);
      if (success) {
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2500);
      }
    } catch (err) {
      console.warn('Copy to clipboard error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setExportError(language === 'id' ? `Gagal menyalin preview: ${message}` : `Failed to copy preview: ${message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Hard Reset Execution Handler
  const handlePerformHardReset = async () => {
    setIsResetting(true);
    try {
      // 1. Clear cached workspace form inputs, characters, and folders from localStorage
      // Preserving user authentication, access code, device ID, language, and system settings
      const preservedKeys = new Set([
        'au_access_code',
        'au_auth_user',
        'au_apps_script_url',
        'au_device_id',
        'au_app_language',
        'au_feature_flags',
        'au_ui_theme',
        'global_app_font',
        'global_custom_font_name',
        'global_custom_fonts_list',
        'global_custom_font_data',
        'global_card_corner_radius',
        'au_voucher_code',
        'au_session_expires_at',
        'au_session_saved_at',
        'au_is_authenticated',
        'au_last_status_check_time',
        'au_last_active_tab',
        'au_last_active_category',
      ]);

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (
          preservedKeys.has(key) ||
          key.startsWith('firebase:') ||
          key.startsWith('firebaseLocal') ||
          key.startsWith('google_')
        ) {
          continue;
        }
        if (
          key.startsWith('au_toolkit_') ||
          key.startsWith('au_folders_') ||
          key.startsWith('au_active_folder_') ||
          key.startsWith('au_form_') ||
          key.startsWith('au_characters_') ||
          key.startsWith('au_workspace_') ||
          key.startsWith('au_line_custom_stickers') ||
          key.startsWith('preview_')
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {}
      });

      sessionStorage.clear();
      localStorage.setItem(STORAGE_RESET_KEY, 'true');

      // Clear Firebase cached fingerprints and user folders in Firestore
      clearWorkspaceFingerprintCache();
      if (authUser?.uid) {
        await clearAllFirebaseData(authUser.uid);
      }
    } catch (e) {
      console.warn('Hard reset storage error:', e);
    }

    // 2. Prepare clean initial folders (Folder 1 with fresh empty form data) for ALL 23 tabs
    const freshInitialFolders: Record<string, AUFolder[]> = {};
    const freshInitialActiveIds: Record<string, string> = {};
    const cleanAllFormStates: Record<string, any> = {};

    ALL_PLATFORM_TABS.forEach((tab) => {
      const freshData = JSON.parse(JSON.stringify(getInitialTabData(tab)));
      freshInitialFolders[tab] = [
        {
          id: 'folder-1',
          name: 'Folder 1',
          data: freshData,
        },
      ];
      freshInitialActiveIds[tab] = 'folder-1';
      cleanAllFormStates[tab] = freshData;

      // Persist fresh Folder 1 and form data to localStorage
      try {
        localStorage.setItem(getModuleFoldersKey(userAccountKey, tab), JSON.stringify(freshInitialFolders[tab]));
        localStorage.setItem(getModuleActiveFolderKey(userAccountKey, tab), 'folder-1');
        localStorage.setItem(getFormStorageKey(userAccountKey, tab), JSON.stringify(freshData));
      } catch {}
    });

    // 3. Reset all React state variables across ALL modules & sub-features simultaneously
    setTwitterData(JSON.parse(JSON.stringify(INITIAL_TWITTER_DATA)));
    setInstagramFeedData(JSON.parse(JSON.stringify(INITIAL_INSTAGRAM_FEED_DATA)));
    setInstagramFeedCommentsData(JSON.parse(JSON.stringify(INITIAL_INSTAGRAM_FEED_COMMENTS_DATA)));
    setInstagramStoryData(JSON.parse(JSON.stringify(INITIAL_INSTAGRAM_STORY_DATA)));
    setInstagramStoryReplyData(JSON.parse(JSON.stringify(INITIAL_INSTAGRAM_STORY_REPLY_DATA)));
    setInstagramStoryViewersData(JSON.parse(JSON.stringify(INITIAL_INSTAGRAM_STORY_VIEWERS_DATA)));
    setInstagramProfileData(JSON.parse(JSON.stringify(INITIAL_INSTAGRAM_PROFILE_DATA)));
    setInstagramLiveData(JSON.parse(JSON.stringify(INITIAL_INSTAGRAM_LIVE_DATA)));
    setInstagramNotesData(JSON.parse(JSON.stringify(INITIAL_INSTAGRAM_NOTES_DATA)));
    setInstagramActivityData(JSON.parse(JSON.stringify(INITIAL_INSTAGRAM_ACTIVITY_DATA)));
    setInstagramDMInboxData(JSON.parse(JSON.stringify(INITIAL_INSTAGRAM_DM_INBOX_DATA)));
    setInstagramDMData(JSON.parse(JSON.stringify(INITIAL_INSTAGRAM_DM_DATA)));
    setWhatsAppChatData(JSON.parse(JSON.stringify(INITIAL_WHATSAPP_CHAT_DATA)));
    setWhatsAppCallData(JSON.parse(JSON.stringify(INITIAL_WHATSAPP_CALL_DATA)));
    setWhatsAppStatusData(JSON.parse(JSON.stringify(INITIAL_WHATSAPP_STATUS_DATA)));
    setWhatsAppViewersData(JSON.parse(JSON.stringify(INITIAL_WHATSAPP_VIEWERS_DATA)));
    setTikTokProfileData(JSON.parse(JSON.stringify(INITIAL_TIKTOK_PROFILE_DATA)));
    setTikTokFeedLiveData(JSON.parse(JSON.stringify(INITIAL_TIKTOK_FEED_LIVE_DATA)));
    setTikTokFypData(JSON.parse(JSON.stringify(INITIAL_TIKTOK_FYP_DATA)));
    setIosLockscreenData(JSON.parse(JSON.stringify(INITIAL_IOS_LOCKSCREEN_DATA)));
    setLineChatData(JSON.parse(JSON.stringify(INITIAL_LINE_CHAT_DATA)));
    setNotesData(JSON.parse(JSON.stringify(INITIAL_NOTES_DATA)));
    setPushNotificationData(JSON.parse(JSON.stringify(INITIAL_PUSH_NOTIFICATION_DATA)));
    setSpotifyData(JSON.parse(JSON.stringify(INITIAL_SPOTIFY_DATA)));

    // 4. Update folder state & refs
    setModuleFolders(freshInitialFolders);
    setActiveFolderIds(freshInitialActiveIds);
    moduleFoldersRef.current = freshInitialFolders;
    activeFolderIdsRef.current = freshInitialActiveIds;

    // 5. Explicitly hydrate active tab with fresh blank form data
    const activeTabFreshData = freshInitialFolders[activeTab]?.[0]?.data || getInitialTabData(activeTab);
    loadTabFormData(activeTab, activeTabFreshData);

    // 6. Real-time Firebase Cloud Sync of the clean workspace if user is authenticated
    if (authUser?.uid) {
      try {
        const cleanPayload = {
          userId: authUser.uid,
          userEmail: authUser.email.toLowerCase(),
          lastActiveTab: activeTab,
          lastActiveCategory: activeCategory,
          updatedBy: clientSessionId,
          formStates: cleanAllFormStates,
          moduleFolders: freshInitialFolders,
          activeFolderIds: freshInitialActiveIds,
          preferences: {
            uiTheme,
            language,
            globalFont,
            customFontName,
            cornerRadius,
          },
          updatedAt: new Date().toISOString(),
        };
        await saveUserWorkspaceToFirestore(authUser.uid, cleanPayload);
        clearPendingCloudSync(userAccountKey);
        setCloudSyncState('synced');
        setLastSyncedTime(new Date());
      } catch (err) {
        console.warn('Hard reset cloud sync error:', err);
      }
    }

    setIsResetting(false);
    setIsResetConfirmOpen(false);
    setResetSuccessToast(true);
    setTimeout(() => setResetSuccessToast(false), 3000);
  };

  // 1. Check if 30-day access has expired or account is locked/mismatched -> render AccessGuard
  // Backend errors and invalid API responses must NEVER render the expiration screen!
  if (
    authLifecycleStage === 'ACCESS_EXPIRED' &&
    buyerEntitlement?.status !== 'INVALID_API_RESPONSE' &&
    buyerEntitlement?.status !== 'BACKEND_ERROR'
  ) {
    return (
      <AccessGuard
        email={buyerEntitlement?.email || authUser?.email || localStorage.getItem('au_user_email') || ''}
        purchaseDate={buyerEntitlement?.purchaseDate}
        accessExpiresAt={buyerEntitlement?.accessExpiresAt}
        expirationDate={buyerEntitlement?.expirationDate}
        statusAccount={buyerEntitlement?.statusAccount}
        daysRemaining={buyerEntitlement?.daysRemaining}
        status={buyerEntitlement?.status}
        customMessage={buyerEntitlement?.message}
        onLogout={handleLogout}
        language={language}
      />
    );
  }

  // Context-aware retry handler
  const handleContextAwareRetry = () => {
    setLoadingErrorMessage(null);
    if (authLifecycleStage === 'CHECK_ACCESS' || authLifecycleStage === 'AUTH_LOADING') {
      console.log('[Retry] Retrying entitlement verification for stage:', authLifecycleStage);
      revalidateEntitlement(true);
    } else if (authLifecycleStage === 'LOAD_USER_DATA' || authLifecycleStage === 'HYDRATE_DATA') {
      console.log('[Retry] Retrying Firestore workspace load for stage:', authLifecycleStage);
      const userEmailOrId = authUser?.uid || auth.currentUser?.uid;
      if (userEmailOrId) {
        const requestedUid = userEmailOrId;
        setIsInitialCloudLoading(true);
        loadUserWorkspaceFromFirestore(userEmailOrId)
          .then((cloudWorkspace) => {
            if (auth.currentUser?.uid !== requestedUid) return;
            setIsInitialCloudLoading(false);
            if (cloudWorkspace?.hasLoadedData) {
              applyCloudWorkspaceDataRef.current(cloudWorkspace, true);
            }
            setAuthLifecycleStage('READY');
          })
          .catch((err) => {
            console.error('[Retry] Firestore load error:', err);
            setIsInitialCloudLoading(false);
            setLoadingErrorMessage('Gagal memuat workspace dari cloud. Silakan coba lagi.');
          });
      } else {
        handleBackToLogin();
      }
    } else {
      revalidateEntitlement(true);
    }
  };

  const handleBackToLogin = () => {
    console.log('[Auth] User navigating back to login from loading screen');
    setLoadingErrorMessage(null);
    setIsAuthenticated(false);
    setAuthUser(null);
    setStoredAuthUser(null);
    setAuthLifecycleStage('UNAUTHENTICATED');
    try {
      localStorage.removeItem('au_is_authenticated');
    } catch {}
  };

  // 2. Structured App Lifecycle Loading Screen (AUTH_LOADING -> CHECK_ACCESS -> LOAD_USER_DATA -> HYDRATE_DATA)
  if (
    authLifecycleStage === 'AUTH_LOADING' ||
    authLifecycleStage === 'CHECK_ACCESS' ||
    authLifecycleStage === 'LOAD_USER_DATA' ||
    authLifecycleStage === 'HYDRATE_DATA' ||
    (isAuthenticated && isInitialCloudLoading)
  ) {
    return (
      <AppLoadingScreen
        stage={authLifecycleStage}
        language={language}
        errorMessage={loadingErrorMessage}
        onRetry={handleContextAwareRetry}
        onBackToLogin={handleBackToLogin}
      />
    );
  }

  // 3. Unauthenticated State -> render Login component
  if (!isAuthenticated || authLifecycleStage === 'UNAUTHENTICATED') {
    return (
      <Login
        onLoginSuccess={async (code, user, entitlement) => {
          setAccessCode(code);
          setIsAuthenticated(true);
          setLogoutReason(null);
          if (user) {
            setAuthUser(user);
          }
          if (entitlement) {
            setBuyerEntitlement(entitlement);
          }
          setAuthLifecycleStage('LOAD_USER_DATA');
          verifyAndRegisterDevice(user || code).catch(() => {});
          // Firebase UID effect owns hydration/listener setup. Avoid a second
          // email/code-based load racing the canonical UID subscription.
          if (!user?.uid) {
            setIsHydrated(true);
            isHydratedRef.current = true;
            setIsInitialCloudLoading(false);
            setAuthLifecycleStage('READY');
          }
          setTimeout(() => {
            revalidateEntitlement(false);
          }, 800);
        }}
        onAccessExpired={(email, entitlement) => {
          setBuyerEntitlement(entitlement);
          setAuthLifecycleStage('ACCESS_EXPIRED');
        }}
        initialErrorMessage={logoutReason}
      />
    );
  }

  return (
    <ThemeContext.Provider value={{ uiTheme, isDark: uiTheme === 'dark', setUiTheme: handleSetUiTheme, toggleTheme: handleToggleTheme }}>
      <div className={`w-full min-h-screen lg:h-screen lg:overflow-hidden font-sans flex flex-col antialiased selection:bg-purple-600 selection:text-white transition-colors duration-200 ${
        uiTheme === 'dark' ? 'theme-dark dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
      {/* Top Application Header */}
      <header className={`shrink-0 sticky top-0 z-40 backdrop-blur-md border-b px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 transition-colors ${
        uiTheme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col gap-1.5">
          {/* Main Top Header: Left (Logo & Title) | Right (Platforms, Controls & Hard Reset directly under X) */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
            {/* Left: App Logo, Title & Tagline */}
            <div className="flex items-center space-x-3 shrink-0 pt-0.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-500 p-[2px] flex items-center justify-center shadow-lg shadow-purple-500/10 shrink-0">
                <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${
                  uiTheme === 'dark' ? 'bg-slate-900' : 'bg-white'
                }`}>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className={`font-extrabold text-base lg:text-lg tracking-tight leading-tight ${
                    uiTheme === 'dark' ? 'bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent' : 'text-slate-900'
                  }`}>
                    AU Toolkit
                  </h1>
                </div>
                <p className={`text-[11px] hidden sm:block leading-tight ${
                  uiTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Fake social media generator for Alternate Universe writers & storytellers
                </p>
              </div>
            </div>

            {/* Right Column: Platform Navigation & Utility Controls */}
            <div className="flex flex-col lg:flex-row items-start lg:items-start gap-2.5 shrink-0">
              {/* Platform Navigation Column (with Desktop Hard Reset neatly below X) */}
              <div className="flex flex-col items-start gap-1.5 shrink-0 max-w-full">
                {/* Level 1: Platform Switcher (X, Instagram, WhatsApp, TikTok, LINE, Notes, Notification, Spotify) */}
                <div className="flex items-center gap-2 overflow-x-auto max-w-full scrollbar-none py-0.5 shrink-0 flex-nowrap">
                  {/* Level 1: Platform Switcher (X, Instagram, WhatsApp, TikTok, LINE, Notes, Notification) */}
                  <div className={`flex items-center p-1 rounded-xl border text-xs font-bold shrink-0 flex-nowrap gap-1 ${
                    uiTheme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    {isCategoryLive('x') && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategory('x');
                          const tab = getFirstLiveTabForCategory('x') || 'twitter';
                          setActiveTab(tab);
                          setMobileView('editor');
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 ${
                          activeCategory === 'x'
                            ? 'bg-purple-600 text-white shadow-md'
                            : uiTheme === 'dark'
                              ? 'text-slate-400 hover:text-white'
                              : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>X (Twitter)</span>
                      </button>
                    )}

                    {isCategoryLive('instagram') && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategory('instagram');
                          if (!activeTab.startsWith('instagram') || !isTabLive(activeTab, 'instagram')) {
                            const tab = getFirstLiveTabForCategory('instagram') || 'instagram-feed';
                            setActiveTab(tab);
                          }
                          setMobileView('editor');
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 ${
                          activeCategory === 'instagram'
                            ? 'bg-purple-600 text-white shadow-md'
                            : uiTheme === 'dark'
                              ? 'text-slate-400 hover:text-white'
                              : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>Instagram</span>
                      </button>
                    )}

                    {isCategoryLive('whatsapp') && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategory('whatsapp');
                          const tab = getFirstLiveTabForCategory('whatsapp') || 'whatsapp-chat';
                          setActiveTab(tab);
                          setMobileView('editor');
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 ${
                          activeCategory === 'whatsapp'
                            ? 'bg-purple-600 text-white shadow-md'
                            : uiTheme === 'dark'
                              ? 'text-slate-400 hover:text-white'
                              : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>WhatsApp</span>
                      </button>
                    )}

                    {isCategoryLive('tiktok') && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategory('tiktok');
                          const tab = getFirstLiveTabForCategory('tiktok') || 'tiktok-profile';
                          setActiveTab(tab);
                          setMobileView('editor');
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 ${
                          activeCategory === 'tiktok'
                            ? 'bg-purple-600 text-white shadow-md'
                            : uiTheme === 'dark'
                              ? 'text-slate-400 hover:text-white'
                              : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>TikTok</span>
                      </button>
                    )}

                    {isCategoryLive('line') && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategory('line');
                          const tab = getFirstLiveTabForCategory('line') || 'line-chat';
                          setActiveTab(tab);
                          setMobileView('editor');
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 ${
                          activeCategory === 'line'
                            ? 'bg-purple-600 text-white shadow-md'
                            : uiTheme === 'dark'
                              ? 'text-slate-400 hover:text-white'
                              : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>LINE</span>
                      </button>
                    )}

                    {isCategoryLive('notes') && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategory('notes');
                          setActiveTab('notes');
                          setMobileView('editor');
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 ${
                          activeCategory === 'notes'
                            ? 'bg-purple-600 text-white shadow-md'
                            : uiTheme === 'dark'
                              ? 'text-slate-400 hover:text-white'
                              : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>Notes</span>
                      </button>
                    )}

                    {isCategoryLive('notifications') && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategory('notifications');
                          setActiveTab('push-notification');
                          setMobileView('editor');
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 ${
                          activeCategory === 'notifications'
                            ? 'bg-purple-600 text-white shadow-md'
                            : uiTheme === 'dark'
                              ? 'text-slate-400 hover:text-white'
                              : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>Notification</span>
                      </button>
                    )}

                    {isCategoryLive('spotify') && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategory('spotify');
                          setActiveTab('spotify-card');
                          setMobileView('editor');
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 ${
                          activeCategory === 'spotify'
                            ? 'bg-purple-600 text-white shadow-md'
                            : uiTheme === 'dark'
                              ? 'text-slate-400 hover:text-white'
                              : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>Spotify</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Hard Reset Button (Desktop View): Placed neatly directly below the X (Twitter) menu section */}
                <div className="hidden lg:flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(true)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all border cursor-pointer shrink-0 shadow-2xs ${
                      uiTheme === 'dark'
                        ? 'bg-rose-950/50 text-rose-300 border-rose-900/80 hover:bg-rose-900/70 hover:text-white'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                    title={language === 'id' ? 'Reset Total (Bersihkan seluruh data & cache)' : 'Hard Reset (Clear all data & cache)'}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{language === 'id' ? 'Reset Total' : 'Hard Reset'}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Language Switcher, Global Theme, and User Account Profile positioned neatly below EN */}
              <div className="flex flex-col items-start gap-1.5 shrink-0">
                {/* Row 1: Language Switcher (EN) + Global Master Theme Toggle + (Mobile-only Hard Reset) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Language Switcher (EN / ID) */}
                  <button
                    type="button"
                    onClick={toggleLanguage}
                    className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all border cursor-pointer shrink-0 ${
                      uiTheme === 'dark'
                        ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700 shadow-xs'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 shadow-xs'
                    }`}
                    title={`Switch language (${language === 'en' ? 'English' : 'Bahasa Indonesia'})`}
                  >
                    <Languages className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{language === 'en' ? 'EN' : 'ID'}</span>
                  </button>

                  {/* Global Master Theme Toggle Button */}
                  <button
                    type="button"
                    id="global-theme-indicator-btn"
                    onClick={handleToggleTheme}
                    className={`px-3 py-1.5 rounded-xl font-medium text-xs flex items-center space-x-1.5 transition-all border cursor-pointer shrink-0 select-none ${
                      uiTheme === 'dark'
                        ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:border-purple-500/70 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-amber-400/70 shadow-xs'
                    }`}
                    title={
                      uiTheme === 'dark'
                        ? (language === 'en' ? 'Editor Theme: Dark (Click to switch to Light Mode)' : 'Tema Editor: Dark (Klik untuk beralih ke Light Mode)')
                        : (language === 'en' ? 'Editor Theme: Light (Click to switch to Dark Mode)' : 'Tema Editor: Light (Klik untuk beralih ke Dark Mode)')
                    }
                  >
                    {uiTheme === 'dark' ? (
                      <>
                        <Moon className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20 shrink-0" />
                        <span className="font-medium text-slate-200">Dark</span>
                      </>
                    ) : (
                      <>
                        <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
                        <span className="font-medium text-slate-700">Light</span>
                      </>
                    )}
                  </button>

                  {/* Hard Reset Button (Mobile View): Kept accessible in row 1 on smaller screens */}
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(true)}
                    className={`lg:hidden px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all border cursor-pointer shrink-0 shadow-2xs ${
                      uiTheme === 'dark'
                        ? 'bg-rose-950/50 text-rose-300 border-rose-900/80 hover:bg-rose-900/70 hover:text-white'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                    title={language === 'id' ? 'Reset Total (Bersihkan seluruh data & cache)' : 'Hard Reset (Clear all data & cache)'}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{language === 'id' ? 'Reset Total' : 'Hard Reset'}</span>
                  </button>
                </div>

                {/* Row 2: User Account Profile Badge with Log Out button */}
                <div className="flex items-center gap-1.5 relative">
                  {/* User Account Profile Badge & Integrated Logout */}
                  <div className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border text-xs shrink-0 ${
                    uiTheme === 'dark'
                      ? 'bg-purple-950/40 text-purple-200 border-purple-800/60'
                      : 'bg-purple-50 text-purple-800 border-purple-200 shadow-xs'
                  }`}>
                    {authUser?.photoURL && authUser.photoURL.trim() !== '' ? (
                      <img
                        src={authUser.photoURL.trim()}
                        alt={authUser.displayName || 'User'}
                        className="w-4 h-4 rounded-full object-cover shrink-0 ring-1 ring-purple-400"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                        {(authUser?.displayName || authUser?.email || localStorage.getItem('au_user_email') || 'A').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col text-left leading-tight">
                      <span className="font-bold text-[11px] truncate max-w-[85px] sm:max-w-[120px]" title={authUser?.email || localStorage.getItem('au_user_email') || ''}>
                        {authUser?.displayName || authUser?.email?.split('@')[0] || (localStorage.getItem('au_user_email') || '').split('@')[0] || 'Member'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPasswordModalOpen(true)}
                      className={`ml-1 px-2.5 py-1 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all border cursor-pointer select-none active:scale-95 shadow-2xs ${
                        uiTheme === 'dark'
                          ? 'bg-slate-800 text-slate-200 border-slate-700 hover:border-purple-500 hover:text-purple-300'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:text-purple-700'
                      }`}
                      title={language === 'id' ? 'Ubah password akun' : 'Change account password'}
                    >
                      <KeyRound className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden sm:inline">Password</span>
                    </button>
                    <button
                      type="button"
                      id="btn-account-logout"
                      disabled={isLoggingOut}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLogout();
                      }}
                      className={`ml-1 px-2.5 py-1 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all border cursor-pointer select-none active:scale-95 shadow-2xs ${
                        uiTheme === 'dark'
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800/80 hover:bg-rose-900 hover:text-white'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:text-rose-900'
                      }`}
                      title={language === 'id' ? 'Keluar dari akun Anda' : 'Log out from your account'}
                    >
                      {isLoggingOut ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500 shrink-0" />
                          <span>{language === 'id' ? 'Keluar...' : 'Logging out...'}</span>
                        </>
                      ) : (
                        <>
                          <LogOut className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>Log Out</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Level 2 Sub-Feature Navigation Row */}
        <div className={`mt-2.5 border-t pt-2 max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto ${
          uiTheme === 'dark' ? 'border-slate-800/80' : 'border-slate-200/80'
        }`}>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 mr-1.5">
            {language === 'id'
              ? (activeCategory === 'x' ? 'Fitur X:' : activeCategory === 'whatsapp' ? 'Fitur WhatsApp:' : activeCategory === 'tiktok' ? 'Fitur TikTok:' : activeCategory === 'line' ? 'Fitur LINE:' : activeCategory === 'notes' ? 'NOTES:' : activeCategory === 'notifications' ? 'NOTIFICATION:' : activeCategory === 'spotify' ? 'Fitur Spotify:' : 'Fitur Instagram:')
              : (activeCategory === 'x' ? 'X Features:' : activeCategory === 'whatsapp' ? 'WhatsApp Features:' : activeCategory === 'tiktok' ? 'TikTok Features:' : activeCategory === 'line' ? 'LINE Features:' : activeCategory === 'notes' ? 'NOTES:' : activeCategory === 'notifications' ? 'NOTIFICATION:' : activeCategory === 'spotify' ? 'Spotify Features:' : 'Instagram Features:')
            }
          </span>

          {activeCategory === 'line' && isTabLive('line-chat', 'line') && (
            <button
              type="button"
              onClick={() => { setActiveTab('line-chat'); setMobileView('editor'); }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeTab === 'line-chat'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>LINE Chat</span>
            </button>
          )}

          {activeCategory === 'x' && isTabLive('twitter', 'x') && (
            <button
              type="button"
              onClick={() => { setActiveTab('twitter'); setMobileView('editor'); }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeTab === 'twitter'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>{language === 'id' ? 'Postingan / Feed' : 'Post / Feed'}</span>
            </button>
          )}

          {activeCategory === 'whatsapp' && (
            <>
              {isTabLive('whatsapp-chat', 'whatsapp') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('whatsapp-chat'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'whatsapp-chat'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{language === 'id' ? 'Obrolan' : 'Chat'}</span>
                </button>
              )}

              {isTabLive('whatsapp-call', 'whatsapp') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('whatsapp-call'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'whatsapp-call'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{language === 'id' ? 'Panggilan' : 'Call'}</span>
                </button>
              )}

              {isTabLive('whatsapp-status', 'whatsapp') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('whatsapp-status'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'whatsapp-status'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>Status</span>
                </button>
              )}

              {isTabLive('whatsapp-viewers', 'whatsapp') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('whatsapp-viewers'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'whatsapp-viewers'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{language === 'id' ? 'Penonton Status' : 'Status Viewers'}</span>
                </button>
              )}
            </>
          )}

          {activeCategory === 'tiktok' && (
            <>
              {isTabLive('tiktok-profile', 'tiktok') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('tiktok-profile'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'tiktok-profile'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{language === 'id' ? 'Profil' : 'Profile'}</span>
                </button>
              )}

              {isTabLive('tiktok-feed-live', 'tiktok') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('tiktok-feed-live'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'tiktok-feed-live'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>FYP Live</span>
                </button>
              )}

              {isTabLive('tiktok-fyp', 'tiktok') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('tiktok-fyp'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'tiktok-fyp'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{language === 'id' ? 'Beranda FYP' : 'Home Page'}</span>
                </button>
              )}
            </>
          )}

          {activeCategory === 'instagram' && (
            <>
              {isTabLive('instagram-feed', 'instagram') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('instagram-feed'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'instagram-feed'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{language === 'id' ? 'Feed / Beranda' : 'Feed'}</span>
                </button>
              )}

              {isTabLive('instagram-feed-comments', 'instagram') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('instagram-feed-comments'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'instagram-feed-comments'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{language === 'id' ? 'Komentar Feed' : 'Feed Comments'}</span>
                </button>
              )}

              {isTabLive('instagram-story', 'instagram') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('instagram-story'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'instagram-story' || activeTab === 'instagram-story-reply'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{language === 'id' ? 'Cerita' : 'Story'}</span>
                </button>
              )}

              {isTabLive('instagram-story-viewers', 'instagram') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('instagram-story-viewers'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'instagram-story-viewers'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{language === 'id' ? 'Penonton Story' : 'Story Viewers'}</span>
                </button>
              )}

              {isTabLive('instagram-profile', 'instagram') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('instagram-profile'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'instagram-profile'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{language === 'id' ? 'Profil' : 'Profile'}</span>
                </button>
              )}

              {isTabLive('instagram-live', 'instagram') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('instagram-live'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'instagram-live'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>Live</span>
                </button>
              )}

              {isTabLive('instagram-notes', 'instagram') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('instagram-notes'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'instagram-notes'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>Notes</span>
                </button>
              )}

              {isTabLive('instagram-activity', 'instagram') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('instagram-activity'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'instagram-activity'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{language === 'id' ? 'Aktivitas' : 'Activity'}</span>
                </button>
              )}

              {isTabLive('instagram-dm', 'instagram') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('instagram-dm'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'instagram-dm'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{language === 'id' ? 'Pesan Langsung (DM)' : 'Direct Messages'}</span>
                </button>
              )}

              {isTabLive('instagram-dm-inbox', 'instagram') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('instagram-dm-inbox'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'instagram-dm-inbox'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{language === 'id' ? 'DM Inbox' : 'DM Inbox'}</span>
                </button>
              )}
            </>
          )}

          {activeCategory === 'notes' && (
            <>
              {isTabLive('notes', 'notes') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('notes'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'notes'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{language === 'id' ? 'Catatan' : 'Notes'}</span>
                </button>
              )}
            </>
          )}

          {activeCategory === 'notifications' && (
            <>
              {isTabLive('push-notification', 'notifications') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('push-notification'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'push-notification'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{language === 'id' ? 'Banner Notifikasi Melayang' : 'Push Notification Banner'}</span>
                </button>
              )}
            </>
          )}

          {activeCategory === 'spotify' && (
            <>
              {isTabLive('spotify-card', 'spotify') && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('spotify-card'); setMobileView('editor'); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    activeTab === 'spotify-card'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : uiTheme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.627.627 0 0 1-.86.208c-2.355-1.439-5.318-1.764-8.81-.966a.627.627 0 1 1-.28-1.222c3.818-.872 7.098-.5 9.742 1.12.302.185.394.577.208.86zm1.226-2.723a.786.786 0 0 1-1.08.26c-2.695-1.656-6.804-2.135-9.992-1.167a.786.786 0 1 1-.462-1.502c3.642-1.107 8.188-.574 11.274 1.328.349.214.46.66.26 1.081zm.105-2.836C14.69 8.878 9.387 8.7 6.305 9.636a.944.944 0 0 1-.557-1.802c3.542-1.074 9.404-.863 13.14 1.355.424.251.564.799.312 1.223a.943.943 0 0 1-1.282.453z" />
                  </svg>
                  <span>{language === 'id' ? 'Spotify Player Card' : 'Spotify Player Card'}</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Sticky Mobile Tab Switcher (Form Input vs Live Preview) - Always pinned under Module Features Bar */}
        <div className={`lg:hidden shrink-0 max-w-7xl mx-auto w-full flex items-center gap-2 pt-2 mt-2 border-t ${
          uiTheme === 'dark' ? 'border-slate-800/80' : 'border-slate-200/80'
        }`}>
          <button
            type="button"
            onClick={() => setMobileView('editor')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl text-center transition-all cursor-pointer shadow-xs flex items-center justify-center space-x-1.5 ${
              mobileView === 'editor'
                ? 'bg-purple-600 text-white shadow-purple-500/25'
                : uiTheme === 'dark'
                ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title={language === 'id' ? 'Tampilkan Form Input (Geser layar ke kiri/kanan untuk beralih cepat)' : 'Show Form Input (Swipe screen left/right to toggle)'}
          >
            <span>{language === 'id' ? 'Form Input' : 'Form Input'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView('preview')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl text-center flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs ${
              mobileView === 'preview'
                ? 'bg-purple-600 text-white shadow-purple-500/25'
                : uiTheme === 'dark'
                ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title={language === 'id' ? 'Tampilkan Pratinjau Langsung (Geser layar ke kiri/kanan untuk beralih cepat)' : 'Show Live Preview (Swipe screen left/right to toggle)'}
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span>{language === 'id' ? 'Pratinjau Langsung' : 'Live Preview'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileFloatingPreviewOpen(!isMobileFloatingPreviewOpen);
              if (!isMobileFloatingPreviewOpen) setMobileView('editor');
            }}
            className={`shrink-0 py-2 px-3 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 ${
              isMobileFloatingPreviewOpen
                ? 'bg-purple-600 text-white shadow-purple-500/25'
                : uiTheme === 'dark'
                  ? 'bg-slate-800/80 text-slate-300 hover:text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title={language === 'id' ? 'Buka/tutup Floating Live Preview' : 'Toggle Floating Live Preview'}
            aria-pressed={isMobileFloatingPreviewOpen}
          >
            <PictureInPicture2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Split Body: Dual-Scroll Split Screen */}
      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch lg:overflow-hidden">
        {/* Left Column: Form Controls (Independent Scroll) */}
        <section
          id="customization-panel"
          className={`customization-editor-panel dual-scroll-panel no-scrollbar scrollbar-none overscroll-y-contain lg:col-span-6 xl:col-span-5 space-y-4 lg:h-full lg:overflow-y-auto lg:pr-3 lg:pb-4 transition-all ${
            mobileView === 'preview' ? 'hidden lg:block' : 'block animate-in fade-in-50 duration-200'
          }`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className={`flex items-center justify-between pb-2 border-b ${
            uiTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div>
              <h2 className={`text-sm font-bold uppercase tracking-wider ${
                uiTheme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>{language === 'id' ? 'Panel Kustomisasi' : 'Customization Panel'}</h2>
              <p className={`text-xs ${
                uiTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>{language === 'id' ? 'Edit detail karakter, konten & metrik secara real-time' : 'Edit character details, content & metrics in real-time'}</p>
            </div>
          </div>

          {/* Global Typography Manager */}
          <GlobalFontManager
            selectedFont={globalFont}
            onSelectFont={handleFontChange}
            customFontName={customFontName}
            onCustomFontUploaded={handleCustomFontUploaded}
          />

          {activeTab === 'twitter' && (
            <TwitterForm
              key={`twitter-${currentTabActiveFolderId}`}
              data={twitterData}
              onChange={handleTwitterDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'instagram-feed' && (
            <InstagramFeedForm
              key={`instagram-feed-${currentTabActiveFolderId}`}
              data={instagramFeedData}
              onChange={handleInstagramFeedDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'instagram-story' && (
            <InstagramStoryForm
              key={`instagram-story-${currentTabActiveFolderId}`}
              data={instagramStoryData}
              onChange={handleInstagramStoryDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'instagram-story-reply' && (
            <InstagramStoryReplyForm
              key={`instagram-story-reply-${currentTabActiveFolderId}`}
              data={instagramStoryReplyData}
              onChange={handleInstagramStoryReplyDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'instagram-story-viewers' && (
            <InstagramStoryViewersForm
              key={`instagram-story-viewers-${currentTabActiveFolderId}`}
              data={instagramStoryViewersData}
              onChange={handleInstagramStoryViewersDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'instagram-profile' && (
            <InstagramProfileForm
              key={`instagram-profile-${currentTabActiveFolderId}`}
              data={instagramProfileData}
              onChange={handleInstagramProfileDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'instagram-live' && (
            <InstagramLiveForm
              key={`instagram-live-${currentTabActiveFolderId}`}
              data={instagramLiveData}
              onChange={handleInstagramLiveDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'instagram-notes' && (
            <InstagramNotesForm
              key={`instagram-notes-${currentTabActiveFolderId}`}
              data={instagramNotesData}
              onChange={handleInstagramNotesDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'instagram-activity' && (
            <InstagramActivityForm
              key={`instagram-activity-${currentTabActiveFolderId}`}
              data={instagramActivityData}
              onChange={handleInstagramActivityDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'instagram-dm' && (
            <InstagramDMForm
              key={`instagram-dm-${currentTabActiveFolderId}`}
              data={instagramDMData}
              onChange={handleInstagramDMDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'instagram-dm-inbox' && (
            <InstagramDMInboxForm
              key={`instagram-dm-inbox-${currentTabActiveFolderId}`}
              data={instagramDMInboxData}
              onChange={handleInstagramDMInboxDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'instagram-feed-comments' && (
            <InstagramFeedCommentsForm
              key={`instagram-feed-comments-${currentTabActiveFolderId}`}
              data={instagramFeedCommentsData}
              onChange={handleInstagramFeedCommentsDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'whatsapp-chat' && (
            <WhatsAppChatForm
              key={`whatsapp-chat-${currentTabActiveFolderId}`}
              data={whatsAppChatData}
              onChange={handleWhatsAppChatDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'whatsapp-call' && (
            <WhatsAppCallForm
              key={`whatsapp-call-${currentTabActiveFolderId}`}
              data={whatsAppCallData}
              onChange={handleWhatsAppCallDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'whatsapp-status' && (
            <WhatsAppStatusForm
              key={`whatsapp-status-${currentTabActiveFolderId}`}
              data={whatsAppStatusData}
              onChange={handleWhatsAppStatusDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'whatsapp-viewers' && (
            <WhatsAppViewersForm
              key={`whatsapp-viewers-${currentTabActiveFolderId}`}
              data={whatsAppViewersData}
              onChange={handleWhatsAppViewersDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'tiktok-profile' && (
            <TikTokProfileForm
              key={`tiktok-profile-${currentTabActiveFolderId}`}
              data={tikTokProfileData}
              onChange={handleTikTokProfileDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'tiktok-feed-live' && (
            <TikTokFeedLiveForm
              key={`tiktok-feed-live-${currentTabActiveFolderId}`}
              data={tikTokFeedLiveData}
              onChange={handleTikTokFeedLiveDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'tiktok-fyp' && (
            <TikTokFypForm
              key={`tiktok-fyp-${currentTabActiveFolderId}`}
              data={tikTokFypData}
              onChange={handleTikTokFypDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'ios-lockscreen' && (
            <IOSLockscreenForm
              key={`ios-lockscreen-${currentTabActiveFolderId}`}
              data={iosLockscreenData}
              onChange={handleIosLockscreenDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'line-chat' && (
            <LineChatForm
              key={`line-chat-${currentTabActiveFolderId}`}
              data={lineChatData}
              onChange={handleLineChatDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'notes' && (
            <NotesForm
              key={`notes-${currentTabActiveFolderId}`}
              data={notesData}
              onChange={handleNotesDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'push-notification' && (
            <PushNotificationForm
              key={`push-notification-${currentTabActiveFolderId}`}
              data={pushNotificationData}
              onChange={handlePushNotificationDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}

          {activeTab === 'spotify-card' && (
            <SpotifyPlayerForm
              key={`spotify-${currentTabActiveFolderId}`}
              data={spotifyData}
              onChange={handleSpotifyDataChange}
              characters={characters}
              activeCharacterId={activeCharId}
              onSaveCharacter={handleAddCharacterSlot}
              onSaveProfile={handleSaveActiveProfile}
              onSelectCharacter={handleSelectCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onRenameCharacter={handleRenameCharacter}
            />
          )}
        </section>

        {/* Right Column: Live Preview & Export Bar (Independent Scroll) */}
        <section
          id="preview-panel"
          className={`preview-column-panel dual-scroll-panel no-scrollbar scrollbar-none overscroll-y-contain lg:col-span-6 xl:col-span-7 space-y-6 lg:h-full lg:overflow-y-auto lg:pl-1 lg:pr-2 lg:pb-4 transition-all ${
            mobileView === 'editor' ? 'hidden lg:block' : 'block animate-in fade-in-50 duration-200'
          }`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Export Toolbar */}
          <div className={`border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 transition-colors ${
            uiTheme === 'dark'
              ? 'bg-slate-900 border-slate-800 shadow-xl'
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center space-x-3">
              <span className={`text-xs font-extrabold uppercase tracking-wider ${
                uiTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {language === 'id' ? 'Opsi Ekspor' : 'Export Options'}
              </span>
            </div>

            <div className="flex items-center space-x-2.5 sm:space-x-3 flex-wrap gap-y-2">
              <div className={`flex items-center border rounded-lg p-0.5 text-xs ${
                uiTheme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}>
                {[1, 2, 3].map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => setExportScale(scale)}
                    title={
                      scale === 1
                        ? (language === 'id' ? 'Resolusi asli' : 'Native resolution')
                        : scale === 2
                          ? (language === 'id' ? 'Resolusi 2×' : '2× resolution')
                          : (language === 'id' ? 'Kualitas tertinggi / resolusi 3×' : 'Highest quality / 3× resolution')
                    }
                    aria-label={
                      scale === 1
                        ? '1x — Normal, native resolution'
                        : scale === 2
                          ? '2x — HD, 2× resolution'
                          : '3x — 4K, highest quality, 3× resolution'
                    }
                    className={`px-2.5 py-1.5 rounded-md font-bold transition-all cursor-pointer flex flex-col items-center leading-tight ${
                      exportScale === scale
                        ? 'bg-purple-600 text-white shadow-xs'
                        : uiTheme === 'dark'
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{scale}x — {scale === 1 ? 'Normal' : scale === 2 ? 'HD' : '4K'}</span>
                    <span className={`text-[9px] font-medium ${
                      exportScale === scale
                        ? 'text-purple-100'
                        : uiTheme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      {scale === 1
                        ? (language === 'id' ? 'Resolusi asli' : 'Native resolution')
                        : scale === 2
                          ? (language === 'id' ? 'Resolusi 2×' : '2× resolution')
                          : (language === 'id' ? 'Kualitas tertinggi / 3×' : 'Highest quality / 3×')}
                    </span>
                  </button>
                ))}
              </div>

              {/* Download PNG Button */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={isExporting || isExportingJpg}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  downloadSuccess
                    ? 'bg-purple-700 text-white shadow-purple-700/20'
                    : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-purple-600/20'
                }`}
                title={language === 'id' ? 'Unduh gambar PNG lossless resolusi tinggi' : 'Download lossless high-res PNG'}
              >
                {isExporting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : downloadSuccess ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Download className="w-4 h-4 text-white" />
                )}
                <span>
                  {isExporting
                    ? (exportStatusText || 'Rendering...')
                    : downloadSuccess
                      ? (language === 'id' ? 'Tersimpan!' : 'Saved PNG!')
                      : 'Download PNG'}
                </span>
              </button>

              {/* Download JPG Button (Minimal Compression for IG / TikTok, styled with AU Toolkit Purple Theme) */}
              <button
                type="button"
                onClick={handleDownloadJpg}
                disabled={isExporting || isExportingJpg}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  downloadJpgSuccess
                    ? 'bg-purple-700 text-white shadow-purple-700/20'
                    : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-purple-600/20'
                }`}
                title={
                  language === 'id'
                    ? 'Unduh JPG ultra-tajam dengan kompresi minimal (optimal sebelum algoritma IG & TikTok)'
                    : 'Download ultra-sharp JPG with minimal compression (optimal before IG & TikTok algorithms)'
                }
              >
                {isExportingJpg ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : downloadJpgSuccess ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Download className="w-4 h-4 text-white" />
                )}
                <span>
                  {isExportingJpg
                    ? (exportStatusText || 'Rendering...')
                    : downloadJpgSuccess
                      ? (language === 'id' ? 'Tersimpan!' : 'Saved JPG!')
                      : 'Download JPG'}
                </span>
              </button>
            </div>
          </div>
          {exportError && (
            <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              {exportError}
            </div>
          )}

          {/* Zoom & Canvas Scale Toolbar */}
          <div className={`border rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 transition-colors ${
            uiTheme === 'dark'
              ? 'bg-slate-900/90 border-slate-800 text-slate-200'
              : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
          }`}>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5">
              <span className={`text-xs font-extrabold uppercase tracking-wider flex items-center space-x-1.5 ${
                uiTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <Maximize2 className="w-3.5 h-3.5 text-purple-500" />
                <span>Zoom View</span>
              </span>

              {/* Lock Preview Toggle (Tombol Gembok) */}
              <button
                type="button"
                onClick={handleToggleLockPreview}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-black border transition-all cursor-pointer shadow-2xs ${
                  isPreviewLocked
                    ? 'btn-locked-amber bg-amber-400 hover:bg-amber-300 border-amber-500 text-black ring-2 ring-amber-400/50 shadow-amber-500/20 active:scale-95'
                    : uiTheme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title={
                  language === 'id'
                    ? (isPreviewLocked ? 'Preview Terkunci: Posisi kotak tetap di tempat, scrolling halaman & chat lancar' : 'Preview Bebas Geser: Klik untuk mengunci posisi kotak')
                    : (isPreviewLocked ? 'Preview Locked: Stays fixed in position, page & chat scroll normally' : 'Preview Unlocked: Free pan active. Click to lock')
                }
              >
                {isPreviewLocked ? (
                  <Lock className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}
                <span className={isPreviewLocked ? 'text-black font-black tracking-wide' : ''}>
                  {language === 'id'
                    ? (isPreviewLocked ? 'Lock: ON' : 'Lock: OFF')
                    : (isPreviewLocked ? 'Lock: ON' : 'Lock: OFF')}
                </span>
              </button>

              {/* Quick Presets */}
              <div className={`flex items-center border rounded-lg p-0.5 text-xs ${
                uiTheme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}>
                {[50, 75, 100, 125, 150, 200].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => {
                      setPreviewZoom(z);
                      if (z === 75) setPreviewPan({ x: 0, y: 0 });
                    }}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      previewZoom === z
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : uiTheme === 'dark'
                          ? 'text-slate-300 hover:text-white'
                          : 'text-slate-700 hover:text-slate-950 font-bold'
                    }`}
                  >
                    {z === 75 ? 'Fit 75%' : `${z}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Zoom Out Button */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={previewZoom <= 40}
                title="Zoom Out (-10%)"
                className={`p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg border transition-all cursor-pointer ${
                  previewZoom <= 40
                    ? 'opacity-40 cursor-not-allowed border-transparent'
                    : uiTheme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-700 active:scale-95 border-slate-700 text-slate-200'
                      : 'bg-slate-100 hover:bg-slate-200 active:scale-95 border-slate-200 text-slate-700'
                }`}
              >
                <ZoomOut className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>

              {/* Range Slider - touchAction none for smooth dragging on mobile */}
              <input
                type="range"
                min="40"
                max="200"
                step="5"
                value={previewZoom}
                onChange={(e) => setPreviewZoom(Number(e.target.value))}
                style={{ touchAction: 'none' }}
                className="w-24 sm:w-32 h-2 sm:h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600 touch-none"
              />

              {/* Numeric Indicator / Reset Button */}
              <button
                type="button"
                onClick={handleZoomReset}
                title="Reset to 75% (Fit & Center)"
                className={`px-2.5 py-1.5 sm:py-1 min-h-[36px] rounded-lg text-xs font-mono font-bold border transition-all flex items-center space-x-1.5 cursor-pointer ${
                  previewZoom === 75 && previewPan.x === 0 && previewPan.y === 0
                    ? uiTheme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-white shadow-2xs'
                      : 'bg-white border-slate-300 text-slate-900 shadow-2xs font-extrabold'
                    : uiTheme === 'dark'
                      ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-2xs font-extrabold active:scale-95'
                      : 'bg-purple-100 border-purple-300 text-purple-900 shadow-2xs font-extrabold active:scale-95'
                }`}
              >
                <span className="font-extrabold tracking-tight">{previewZoom}%</span>
                {(previewZoom !== 75 || previewPan.x !== 0 || previewPan.y !== 0) && (
                  <RotateCcw className="w-3 h-3 ml-0.5 text-purple-600 dark:text-purple-300" />
                )}
              </button>

              {/* Zoom In Button */}
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={previewZoom >= 200}
                title="Zoom In (+10%)"
                className={`p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg border transition-all cursor-pointer ${
                  previewZoom >= 200
                    ? 'opacity-40 cursor-not-allowed border-transparent'
                    : uiTheme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-700 active:scale-95 border-slate-700 text-slate-200'
                      : 'bg-slate-100 hover:bg-slate-200 active:scale-95 border-slate-200 text-slate-700'
                }`}
              >
                <ZoomIn className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

          {/* Corner Radius Toolbar */}
          <div className={`border rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 transition-colors ${
            uiTheme === 'dark'
              ? 'bg-slate-900/90 border-slate-800 text-slate-200'
              : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
          }`}>
            <div className="flex items-center space-x-2.5">
              <span className={`text-xs font-extrabold uppercase tracking-wider flex items-center space-x-1.5 ${
                uiTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <Square className="w-3.5 h-3.5 text-purple-500" />
                <span>Corner Radius</span>
              </span>

              {/* Quick Presets */}
              <div className={`flex items-center border rounded-lg p-0.5 text-xs ${
                uiTheme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}>
                {[0, 12, 24, 32, 40].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleCornerRadiusChange(r)}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      cornerRadius === r
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : uiTheme === 'dark'
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r === 0 ? '0px (Sharp)' : `${r}px`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="48"
                step="2"
                value={cornerRadius}
                onChange={(e) => handleCornerRadiusChange(Number(e.target.value))}
                className="w-24 sm:w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />

              <button
                type="button"
                onClick={() => handleCornerRadiusChange(0)}
                title="Reset Corner Radius to 0px"
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black border transition-all flex items-center space-x-1 cursor-pointer shadow-xs ${
                  cornerRadius === 0
                    ? uiTheme === 'dark'
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-slate-100 border-slate-300 text-black'
                    : uiTheme === 'dark'
                      ? 'bg-purple-950 border-purple-500 text-white ring-1 ring-purple-500/40'
                      : 'bg-purple-100 border-purple-400 text-black ring-1 ring-purple-400/40'
                }`}
              >
                <span className="font-black" style={{ color: uiTheme === 'dark' ? '#FFFFFF' : '#000000', fontWeight: 900 }}>
                  {cornerRadius}px
                </span>
                {cornerRadius !== 0 && <RotateCcw className="w-3 h-3 ml-0.5 text-purple-700 dark:text-purple-300 stroke-[2.5]" />}
              </button>
            </div>
          </div>

          {/* Live Preview Display Box (Interactive Pinch & Pan Viewport) */}
          <div
            id="preview-viewport-container"
            ref={previewViewportRef}
            data-no-swipe="true"
            onPointerDown={handlePointerDown}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClickViewport}
            className={`border rounded-2xl p-2 sm:p-4 lg:p-8 flex flex-col items-center justify-start min-h-[500px] relative overflow-hidden backdrop-blur-xs transition-colors select-none ${
              isPreviewLocked
                ? 'cursor-default touch-pan-y'
                : (isDraggingCanvas ? 'cursor-grabbing touch-none' : 'cursor-grab touch-none')
            } ${
              uiTheme === 'dark'
                ? 'bg-slate-900/60 border-slate-800/80'
                : 'bg-slate-200/50 border-slate-200 shadow-inner'
            }`}
          >
            {/* Subtle Grid Background Pattern */}
            <div className={`absolute inset-0 [background-size:16px_16px] pointer-events-none ${
              uiTheme === 'dark'
                ? 'bg-[radial-gradient(#334155_1px,transparent_1px)] opacity-50'
                : 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] opacity-70'
            }`} />

            {/* Floating Top-Right Controls: Quick Zoom, Lock State Indicator & Reset View */}
            <div className="absolute top-3 right-3 z-30 pointer-events-auto flex flex-wrap items-center justify-end gap-1.5 max-w-[calc(100%-1.5rem)]">
              {/* Floating Quick Zoom Widget - Theme responsive (Light / Dark) */}
              <div className={`flex items-center backdrop-blur-md border rounded-full p-0.5 shadow-md transition-colors ${
                uiTheme === 'dark'
                  ? 'bg-slate-900/95 border-slate-700/90 text-slate-100 shadow-slate-950/40'
                  : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-slate-300/40'
              }`}>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={previewZoom <= 40}
                  className={`w-7 h-7 flex items-center justify-center rounded-full active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer ${
                    uiTheme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-700 hover:text-black hover:bg-slate-100'
                  }`}
                  title="Zoom Out (-10%)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomReset}
                  className={`px-2 py-0.5 font-mono text-[11px] font-extrabold transition-colors cursor-pointer rounded-full ${
                    uiTheme === 'dark'
                      ? 'text-purple-300 bg-purple-950/60 hover:text-white hover:bg-purple-900/70 border border-purple-800/40'
                      : 'text-purple-800 bg-purple-50 hover:text-purple-950 hover:bg-purple-100/90 border border-purple-200'
                  }`}
                  title="Reset to 75%"
                >
                  {previewZoom}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={previewZoom >= 200}
                  className={`w-7 h-7 flex items-center justify-center rounded-full active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer ${
                    uiTheme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-700 hover:text-black hover:bg-slate-100'
                  }`}
                  title="Zoom In (+10%)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Lock / Unlock Floating Badge Button - High Contrast Yellow/Black */}
              <button
                type="button"
                onClick={handleToggleLockPreview}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all shadow-md cursor-pointer backdrop-blur-md active:scale-95 ${
                  isPreviewLocked
                    ? 'btn-locked-amber bg-amber-400 hover:bg-amber-300 border-2 border-amber-500 text-black ring-2 ring-amber-400/60 shadow-amber-500/30'
                    : uiTheme === 'dark'
                      ? 'bg-slate-900/95 hover:bg-slate-800 border border-slate-700 text-slate-200 shadow-slate-950/40'
                      : 'bg-white/95 hover:bg-slate-50 border border-slate-300 text-slate-800 shadow-slate-300/30'
                }`}
                title={
                  language === 'id'
                    ? (isPreviewLocked ? 'Posisi Kotak Terkunci (Klik untuk bebas geser)' : 'Posisi Kotak Bebas Geser (Klik untuk kunci)')
                    : (isPreviewLocked ? 'Position Locked (Click to unlock pan)' : 'Position Unlocked (Click to lock position)')
                }
              >
                {isPreviewLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                    <span className="text-black font-black tracking-wide">{language === 'id' ? 'Terkunci' : 'Locked'}</span>
                  </>
                ) : (
                  <>
                    <Unlock className={`w-3.5 h-3.5 ${uiTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} />
                    <span className={`font-bold ${uiTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{language === 'id' ? 'Bebas Geser' : 'Unlocked'}</span>
                  </>
                )}
              </button>

              {/* Floating Reset View Button (Only shown when zoomed or panned) */}
              {(previewZoom !== 75 || (!isPreviewLocked && (previewPan.x !== 0 || previewPan.y !== 0))) && (
                <button
                  type="button"
                  onClick={handleZoomReset}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all cursor-pointer backdrop-blur-md active:scale-95 ${
                    uiTheme === 'dark'
                      ? 'bg-slate-900/95 hover:bg-purple-950/90 border border-purple-800/80 text-purple-200 shadow-slate-950/40'
                      : 'bg-white/95 hover:bg-purple-50 border border-purple-300 text-purple-800 shadow-slate-300/30'
                  }`}
                  title="Reset Zoom & Center Position"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-purple-500" />
                  <span className="font-bold">Reset View</span>
                </button>
              )}
            </div>

            <div className="w-full flex items-center justify-center relative z-10 mt-2 mb-auto">
              <div
                id="preview-canvas-container"
                data-preview-canvas="true"
                className={`py-2 flex flex-col items-center justify-center origin-top transition-transform ${
                  isDraggingCanvas ? 'duration-0' : 'duration-100 ease-out'
                } global-preview-font-apply shrink-0 ${isPreviewLocked ? 'touch-pan-y' : 'touch-none'}`}
                style={{
                  transform: `translate3d(${previewPan.x}px, ${previewPan.y}px, 0) scale(${previewZoom / 100})`,
                  transformOrigin: 'top center',
                  marginBottom: previewZoom < 100 ? `${(previewZoom - 100) * 3.5}px` : `${(previewZoom - 100) * 2}px`,
                  '--selected-global-font': currentFontCss,
                  fontFamily: currentFontCss,
                } as React.CSSProperties}
              >
              <ErrorBoundary compact onReset={handleResetActiveTabState}>
              <PreviewRegistry
                previewKey={activeTab}
                data={currentPreviewData}
                previewRef={previewRef}
                fontCss={currentFontCss}
                handlers={{
                  onChange: handleRegisteredPreviewChange,
                  onUpdateMessageText: handleRegisteredMessageText,
                  onToggleLike: () => setTikTokFypData((prev) => ({ ...prev, isLiked: !prev.isLiked })),
                  onToggleBookmark: () => setTikTokFypData((prev) => ({ ...prev, isBookmarked: !prev.isBookmarked })),
                  onToggleFollow: () => setTikTokFypData((prev) => ({ ...prev, isFollowed: !prev.isFollowed })),
                }}
              />
              </ErrorBoundary>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MobileFloatingPreview
        sourceRef={previewRef}
        refreshKey={activeTab}
        uiTheme={uiTheme}
        isOpen={isMobileFloatingPreviewOpen && mobileView === 'editor'}
        onClose={() => setMobileFloatingPreviewOpen(false)}
        onSwitchToFullPreview={() => setMobileView('preview')}
        title={`Preview: ${getFloatingPreviewTitle(activeTab)}`}
      />

      {/* Discreet Footer with Secret Triple-Click Developer Access */}
      <footer className="py-2.5 px-4 text-center select-none shrink-0 border-t border-slate-200/60 dark:border-slate-800/60 bg-inherit">
        <span
          onClick={handleSecretFooterClick}
          className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 transition-colors cursor-default"
          title="AU Toolkit"
        >
          AU Toolkit
        </span>
      </footer>

      {/* Secret PIN Verification Gate */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsFeatureFlagModalOpen(true);
        }}
        uiTheme={uiTheme}
      />

      {/* Feature Flag Manager Modal (Unlocked only after valid PIN verification) */}
      <FeatureFlagManagerModal
        isOpen={isFeatureFlagModalOpen}
        onClose={() => setIsFeatureFlagModalOpen(false)}
        uiTheme={uiTheme}
      />

      {/* Hard Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
            uiTheme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">
                  {language === 'id' ? 'Konfirmasi Reset Total (Hard Reset)' : 'Confirm Hard Reset'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'id' ? 'Kembalikan aplikasi ke kondisi bersih awal' : 'Restore application to clean default state'}
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 mb-5">
              {language === 'id' ? (
                <>
                  Tindakan ini akan <strong>mengosongkan seluruh form input dan mereset folder ke Folder 1 bersih</strong> di seluruh modul (X/Twitter, seluruh fitur Instagram, WhatsApp, TikTok, LINE, Notes, dan Notification). Sesi login dan akun Anda tetap aman tanpa logout.
                </>
              ) : (
                <>
                  This action will <strong>clear all form inputs and reset folders to clean Folder 1</strong> across all modules (X/Twitter, Instagram, WhatsApp, TikTok, LINE, Notes, and Notification). Your login session and account remain safe without logging out.
                </>
              )}
            </p>

            <div className="flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                disabled={isResetting}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                  uiTheme === 'dark'
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handlePerformHardReset}
                disabled={isResetting}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'id' ? 'Mereset...' : 'Resetting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'id' ? 'Hapus & Reset Sekarang' : 'Erase & Reset Now'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Success Toast */}
      {resetSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl bg-purple-600 text-white shadow-xl text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-white" />
          <span>Hard Reset successful! All cached data and templates have been cleared.</span>
        </div>
      )}

      {/* Cloud Workspace Sync Feedback Toast */}
      {cloudToast.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 bg-slate-900/95 text-white border-slate-700">
          <Cloud className={`w-4 h-4 shrink-0 ${
            cloudToast.type === 'error' ? 'text-rose-400' : cloudToast.type === 'warning' ? 'text-amber-400' : 'text-emerald-400'
          }`} />
          <span className="flex-1 leading-snug">{cloudToast.message}</span>
          <button
            type="button"
            onClick={() => setCloudToast({ show: false, message: '' })}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      </div>
      <AccountPasswordModal
        isOpen={isPasswordModalOpen}
        email={authUser?.email || ''}
        uiTheme={uiTheme}
        onClose={() => setIsPasswordModalOpen(false)}
        onRequireRecentLogin={async () => {
          setIsPasswordModalOpen(false);
          await handleLogout();
        }}
      />
    </ThemeContext.Provider>
  );
}
