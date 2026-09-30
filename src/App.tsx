import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PlatformTab, PlatformGroup, TwitterPostData, InstagramFeedData, InstagramStoryData, InstagramProfileData, InstagramLiveData, InstagramNotesData, InstagramActivityData, InstagramDMData, InstagramDMInboxData, InstagramStoryReplyData, InstagramStoryViewersData, InstagramFeedCommentsData, WhatsAppChatData, WhatsAppCallData, WhatsAppStatusData, WhatsAppViewersData, TikTokProfileData, TikTokFeedLiveData, TikTokFypData, IOSLockscreenData, LineChatData, AUFolder, NotesData, PushNotificationData, SpotifyData } from './types';
import { DEFAULT_AVATAR, INITIAL_TWITTER_DATA, INITIAL_INSTAGRAM_FEED_DATA, INITIAL_INSTAGRAM_STORY_DATA, INITIAL_INSTAGRAM_PROFILE_DATA, INITIAL_INSTAGRAM_LIVE_DATA, INITIAL_INSTAGRAM_NOTES_DATA, INITIAL_INSTAGRAM_ACTIVITY_DATA, INITIAL_INSTAGRAM_DM_DATA, INITIAL_INSTAGRAM_DM_INBOX_DATA, INITIAL_INSTAGRAM_STORY_REPLY_DATA, INITIAL_INSTAGRAM_STORY_VIEWERS_DATA, INITIAL_INSTAGRAM_FEED_COMMENTS_DATA, INITIAL_WHATSAPP_CHAT_DATA, INITIAL_WHATSAPP_CALL_DATA, INITIAL_WHATSAPP_STATUS_DATA, INITIAL_WHATSAPP_VIEWERS_DATA, INITIAL_TIKTOK_PROFILE_DATA, INITIAL_TIKTOK_FEED_LIVE_DATA, INITIAL_TIKTOK_FYP_DATA, INITIAL_IOS_LOCKSCREEN_DATA, INITIAL_LINE_CHAT_DATA, INITIAL_NOTES_DATA, INITIAL_PUSH_NOTIFICATION_DATA, INITIAL_SPOTIFY_DATA } from './data/defaultTemplates';
import { PreviewRegistry } from './export/PreviewRegistry';
import { MobileFloatingPreview } from './components/MobileFloatingPreview';
import { Login } from './features/auth/components/Login';
import { AccountPasswordModal } from './features/auth/components/AccountPasswordModal';
import { Download, Copy, Sparkles, RefreshCw, Check, CheckCircle2, AlertCircle, Loader2, Smartphone, Monitor, Eye, Sun, Moon, LogOut, KeyRound, Ticket, User, Plus, ZoomIn, ZoomOut, RotateCcw, Maximize2, PictureInPicture2, Square, Globe, Languages, CloudOff, Upload, Move, Hand, Lock, Unlock } from 'lucide-react';
import {
  clearWorkspaceFingerprintCache,
  signInWithGoogle,
  signOutUser,
  onAuthUserChanged,
  getStoredAuthUser,
  setStoredAuthUser,
  saveUserWorkspaceToFirestore,
  loadUserWorkspaceFromFirestore,
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
import { AccessGuard } from './features/auth/components/AccessGuard';
import { AppLoadingScreen, AuthLifecycleStage } from './features/auth/components/AppLoadingScreen';
import {
  isCategoryLive,
  isTabLive,
  getLiveCategories,
  getFirstLiveTabForCategory,
  getCategoryForTab,
} from './config/featureFlags';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeContext, UiTheme } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';
import type { CloudConnectionState } from './features/workspace/components/CloudSyncIndicator';
import { USER_ASSETS_SYNC_EVENT } from './utils/userAssets';
import {
  ALL_PLATFORM_TABS,
  getFloatingPreviewTitle,
  getFormStorageKey,
  getInitialTabData,
  getLocalUpdateStorageKey,
  getModuleActiveFolderKey,
  getModuleFolderItemKey,
  getModuleFoldersKey,
  getUserAccountStorageKey,
  loadAllStoredActiveFolderIds,
  loadAllStoredModuleFolders,
  loadStoredFormState,
  markLocalWorkspaceUpdated,
} from './features/workspace/workspaceStorage';
import { WorkspaceFeedback } from './features/workspace/components/WorkspaceFeedback';
import { EditorFormPanel } from './features/editor/components/EditorFormPanel';
import { DeveloperAccessControls } from './features/admin/components/DeveloperAccessControls';
import { useTikTokFormHandlers } from './features/tiktok/hooks/useTikTokFormHandlers';
import { useWhatsAppFormHandlers } from './features/whatsapp/hooks/useWhatsAppFormHandlers';
import { useLineFormHandlers } from './features/line/hooks/useLineFormHandlers';
import { useInstagramFormHandlers } from './features/instagram/hooks/useInstagramFormHandlers';
import { useTwitterFormHandlers } from './features/twitter/hooks/useTwitterFormHandlers';
import { usePreviewExport } from './features/editor/hooks/usePreviewExport';
import { usePreviewViewport } from './features/editor/hooks/usePreviewViewport';
import { useWorkspaceFolders } from './features/workspace/hooks/useWorkspaceFolders';
import { useWorkspaceAutoSaveProtection } from './features/workspace/hooks/useWorkspaceAutoSaveProtection';
import { useWorkspaceHardReset } from './features/workspace/hooks/useWorkspaceHardReset';
import { useWorkspacePayload } from './features/workspace/hooks/useWorkspacePayload';
import { useManualWorkspaceCloudActions } from './features/workspace/hooks/useManualWorkspaceCloudActions';
import { useWorkspaceCloudSync } from './features/workspace/hooks/useWorkspaceCloudSync';
import { useApplyCloudWorkspaceData } from './features/workspace/hooks/useApplyCloudWorkspaceData';
import { useWorkspaceUiSettings } from './features/workspace/hooks/useWorkspaceUiSettings';
import { useMobilePreviewNavigation } from './features/editor/hooks/useMobilePreviewNavigation';
import { useTabFormDataRegistry } from './features/workspace/hooks/useTabFormDataRegistry';
import { useWorkspaceCloudHydration } from './features/workspace/hooks/useWorkspaceCloudHydration';

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
  const lastManualCloudRefreshAtRef = useRef<number>(0);

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

  const {
    voucherCode,
    handleVoucherCodeChange,
    uiTheme,
    setUiTheme,
    handleSetUiTheme,
    handleToggleTheme,
    globalFont,
    setGlobalFont,
    customFontName,
    setCustomFontName,
    cornerRadius,
    setCornerRadius,
    handleFontChange,
    handleCustomFontUploaded,
    handleCornerRadiusChange,
    currentFontCss,
  } = useWorkspaceUiSettings({
    hasLocalUserEditsInSessionRef,
    triggerCloudWorkspaceSyncRef,
  });

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

  const {
    previewViewportRef,
    previewZoom,
    previewPan,
    isPreviewLocked,
    isDraggingCanvas,
    setPreviewZoom,
    setPreviewPan,
    handleToggleLockPreview,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handlePointerDown,
    handleMouseDown,
    handleDoubleClickViewport,
  } = usePreviewViewport();
  // Ref to Preview node for html2canvas / html-to-image capture
  const previewRef = useRef<HTMLDivElement>(null);

  const {
    mobileView,
    setMobileView,
    isMobileFloatingPreviewOpen,
    setMobileFloatingPreviewOpen,
  } = useMobilePreviewNavigation();
  const {
    updateCurrentTabIdentity,
    getCurrentTabFormData,
    loadTabFormData,
    currentPreviewData,
  } = useTabFormDataRegistry({
    activeTab,
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
    setTwitterData,
    setInstagramFeedData,
    setInstagramStoryData,
    setInstagramStoryReplyData,
    setInstagramStoryViewersData,
    setInstagramProfileData,
    setInstagramLiveData,
    setInstagramNotesData,
    setInstagramActivityData,
    setInstagramDMData,
    setInstagramDMInboxData,
    setInstagramFeedCommentsData,
    setWhatsAppChatData,
    setWhatsAppCallData,
    setWhatsAppStatusData,
    setWhatsAppViewersData,
    setTikTokProfileData,
    setTikTokFeedLiveData,
    setTikTokFypData,
    setIosLockscreenData,
    setLineChatData,
    setNotesData,
    setPushNotificationData,
    setSpotifyData,
  });
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
    if (activeTab === 'line-chat') return handleUpdateLineMessageText(id, text);
  };

  const handleResetActiveTabState = () => {
    const initialData = getInitialTabData(activeTab);
    const cloned = JSON.parse(JSON.stringify(initialData));
    loadTabFormData(activeTab, cloned);
    updateActiveFolderData(activeTab, cloned);
  };

  const { gatherCompleteWorkspacePayloadRef } = useWorkspacePayload({
    activeTab,
    activeCategory,
    authUser,
    clientSessionId,
    moduleFolders,
    activeFolderIds,
    moduleFoldersRef,
    activeFolderIdsRef,
    uiTheme,
    language,
    globalFont,
    customFontName,
    cornerRadius,
    getCurrentTabFormData,
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
  });
  const {
    triggerCloudWorkspaceSync,
    forceCloudWorkspaceSyncNow,
  } = useWorkspaceCloudSync({
    authUser,
    userAccountKey,
    isHydratedRef,
    syncDebounceTimerRef,
    gatherCompleteWorkspacePayloadRef,
    triggerCloudWorkspaceSyncRef,
    forceCloudWorkspaceSyncNowRef,
    setCloudSyncState,
    setLastSyncedTime,
  });
  const {
    applyCloudWorkspaceData,
    applyCloudWorkspaceDataRef,
  } = useApplyCloudWorkspaceData({
    authUser,
    userAccountKey,
    moduleFolders,
    activeFolderIds,
    moduleFoldersRef,
    activeFolderIdsRef,
    hasLocalUserEditsInSessionRef,
    forceCloudWorkspaceSyncNowRef,
    isApplyingCloudAssetsRef,
    setModuleFolders,
    setActiveFolderIds,
    setUiTheme,
    setGlobalFont,
    setCustomFontName,
    setCornerRadius,
    setActiveTab,
    setActiveCategory,
    loadTabFormData,
  });
  const {
    handleManualCloudBackup,
    handleManualCloudRestore,
  } = useManualWorkspaceCloudActions({
    authUser,
    language,
    userAccountKey,
    moduleFoldersRef,
    gatherCompleteWorkspacePayloadRef,
    applyCloudWorkspaceData,
    setCloudSyncState,
    setLastSyncedTime,
    setCloudToast,
  });
  useWorkspaceCloudHydration({
    authUser,
    userAccountKey,
    clientSessionId,
    accountSyncGenerationRef,
    isHydratedRef,
    isApplyingCloudAssetsRef,
    hasLocalUserEditsInSessionRef,
    moduleFoldersRef,
    activeFolderIdsRef,
    forceCloudWorkspaceSyncNowRef,
    applyCloudWorkspaceDataRef,
    setCloudSyncState,
    setIsInitialCloudLoading,
    setIsHydrated,
    setAuthLifecycleStage,
    setLastSyncedTime,
    setModuleFolders,
    setActiveFolderIds,
    loadTabFormData,
  });
  const {
    updateActiveFolderData,
    handleAddCharacterSlot,
    handleSelectCharacter,
    handleSaveActiveProfile,
    handleDeleteCharacter,
    handleRenameCharacter,
  } = useWorkspaceFolders({
    activeTab,
    userAccountKey,
    authUserUid: authUser?.uid,
    moduleFolders,
    activeFolderIds,
    moduleFoldersRef,
    activeFolderIdsRef,
    hasLocalUserEditsInSessionRef,
    setModuleFolders,
    setActiveFolderIds,
    getCurrentTabFormData,
    loadTabFormData,
    triggerCloudWorkspaceSync,
    forceCloudWorkspaceSyncNow,
  });

  const {
    handleTwitterDataChange,
  } = useTwitterFormHandlers({
    setTwitterData,
    updateActiveFolderData,
  });

  const {
    handleInstagramFeedDataChange,
    handleInstagramStoryDataChange,
    handleInstagramStoryReplyDataChange,
    handleInstagramStoryViewersDataChange,
    handleInstagramProfileDataChange,
    handleInstagramLiveDataChange,
    handleInstagramNotesDataChange,
    handleInstagramActivityDataChange,
    handleInstagramDMDataChange,
    handleInstagramDMInboxDataChange,
    handleInstagramFeedCommentsDataChange,
    handleUpdateInstagramDMMessageText,
  } = useInstagramFormHandlers({
    setInstagramFeedData,
    setInstagramStoryData,
    setInstagramStoryReplyData,
    setInstagramStoryViewersData,
    setInstagramProfileData,
    setInstagramLiveData,
    setInstagramNotesData,
    setInstagramActivityData,
    setInstagramDMData,
    setInstagramDMInboxData,
    setInstagramFeedCommentsData,
    updateActiveFolderData,
  });

  const {
    handleWhatsAppChatDataChange,
    handleWhatsAppCallDataChange,
    handleWhatsAppStatusDataChange,
    handleWhatsAppViewersDataChange,
    handleUpdateWhatsAppMessageText,
  } = useWhatsAppFormHandlers({
    setWhatsAppChatData,
    setWhatsAppCallData,
    setWhatsAppStatusData,
    setWhatsAppViewersData,
    updateActiveFolderData,
  });

  const {
    handleTikTokProfileDataChange,
    handleTikTokFeedLiveDataChange,
    handleTikTokFypDataChange,
    handleToggleTikTokFypLike,
    handleToggleTikTokFypBookmark,
    handleToggleTikTokFypFollow,
  } = useTikTokFormHandlers({
    setTikTokProfileData,
    setTikTokFeedLiveData,
    setTikTokFypData,
    updateActiveFolderData,
  });

  const {
    handleLineChatDataChange,
    handleUpdateLineMessageText,
  } = useLineFormHandlers({
    setLineChatData,
    updateActiveFolderData,
  });

  const {
    exportScale,
    setExportScale,
    isExporting,
    isExportingJpg,
    exportStatusText,
    exportError,
    copiedSuccess,
    downloadSuccess,
    downloadJpgSuccess,
    handleDownload,
    handleDownloadJpg,
    handleCopyClipboard,
  } = usePreviewExport({
    activeTab,
    language,
    previewRef,
    getCurrentTabFormData,
    updateActiveFolderData,
  });

  // Form Change Handlers (auto-syncs to active folder preset and storage with strict tab isolation)
  const handleIosLockscreenDataChange = (updated: IOSLockscreenData) => {
    setIosLockscreenData(updated);
    updateActiveFolderData('ios-lockscreen', updated);
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

  useWorkspaceAutoSaveProtection({
    activeTab,
    userAccountKey,
    authUserUid: authUser?.uid,
    cloudSyncState,
    moduleFoldersRef,
    activeFolderIdsRef,
    hasLocalUserEditsInSessionRef,
    lastManualCloudRefreshAtRef,
    triggerCloudWorkspaceSyncRef,
    applyCloudWorkspaceDataRef,
    getCurrentTabFormData,
  });
  const { handlePerformHardReset } = useWorkspaceHardReset({
    activeTab,
    activeCategory,
    authUser,
    clientSessionId,
    userAccountKey,
    uiTheme,
    language,
    globalFont,
    customFontName,
    cornerRadius,
    moduleFoldersRef,
    activeFolderIdsRef,
    setModuleFolders,
    setActiveFolderIds,
    setCloudSyncState,
    setLastSyncedTime,
    setIsResetting,
    setIsResetConfirmOpen,
    setResetSuccessToast,
    loadTabFormData,
  });
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
        <EditorFormPanel
          uiTheme={uiTheme}
          language={language}
          mobileView={mobileView}
          globalFont={globalFont}
          customFontName={customFontName}
          activeTab={activeTab}
          formData={getCurrentTabFormData(activeTab)}
          onFormChange={(updated) => {
            switch (activeTab) {
              case 'twitter': return handleTwitterDataChange(updated);
              case 'instagram-feed': return handleInstagramFeedDataChange(updated);
              case 'instagram-story': return handleInstagramStoryDataChange(updated);
              case 'instagram-story-reply': return handleInstagramStoryReplyDataChange(updated);
              case 'instagram-story-viewers': return handleInstagramStoryViewersDataChange(updated);
              case 'instagram-profile': return handleInstagramProfileDataChange(updated);
              case 'instagram-live': return handleInstagramLiveDataChange(updated);
              case 'instagram-notes': return handleInstagramNotesDataChange(updated);
              case 'instagram-activity': return handleInstagramActivityDataChange(updated);
              case 'instagram-dm': return handleInstagramDMDataChange(updated);
              case 'instagram-dm-inbox': return handleInstagramDMInboxDataChange(updated);
              case 'instagram-feed-comments': return handleInstagramFeedCommentsDataChange(updated);
              case 'whatsapp-chat': return handleWhatsAppChatDataChange(updated);
              case 'whatsapp-call': return handleWhatsAppCallDataChange(updated);
              case 'whatsapp-status': return handleWhatsAppStatusDataChange(updated);
              case 'whatsapp-viewers': return handleWhatsAppViewersDataChange(updated);
              case 'tiktok-profile': return handleTikTokProfileDataChange(updated);
              case 'tiktok-feed-live': return handleTikTokFeedLiveDataChange(updated);
              case 'tiktok-fyp': return handleTikTokFypDataChange(updated);
              case 'ios-lockscreen': return handleIosLockscreenDataChange(updated);
              case 'line-chat': return handleLineChatDataChange(updated);
              case 'notes': return handleNotesDataChange(updated);
              case 'push-notification': return handlePushNotificationDataChange(updated);
              case 'spotify-card': return handleSpotifyDataChange(updated);
            }
          }}
          characters={characters}
          activeCharacterId={activeCharId}
          onSelectFont={handleFontChange}
          onCustomFontUploaded={handleCustomFontUploaded}
          onSaveCharacter={handleAddCharacterSlot}
          onSaveProfile={handleSaveActiveProfile}
          onSelectCharacter={handleSelectCharacter}
          onDeleteCharacter={handleDeleteCharacter}
          onRenameCharacter={handleRenameCharacter}
        />

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
                  onToggleLike: handleToggleTikTokFypLike,
                  onToggleBookmark: handleToggleTikTokFypBookmark,
                  onToggleFollow: handleToggleTikTokFypFollow,
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

      <DeveloperAccessControls
        uiTheme={uiTheme}
        isPinModalOpen={isPinModalOpen}
        isFeatureFlagModalOpen={isFeatureFlagModalOpen}
        onSecretFooterClick={handleSecretFooterClick}
        onClosePinModal={() => setIsPinModalOpen(false)}
        onPinSuccess={() => setIsFeatureFlagModalOpen(true)}
        onCloseFeatureFlagModal={() => setIsFeatureFlagModalOpen(false)}
      />

      <WorkspaceFeedback
        uiTheme={uiTheme}
        language={language}
        isResetConfirmOpen={isResetConfirmOpen}
        isResetting={isResetting}
        resetSuccessToast={resetSuccessToast}
        cloudToast={cloudToast}
        onCloseResetConfirm={() => setIsResetConfirmOpen(false)}
        onConfirmReset={handlePerformHardReset}
        onDismissCloudToast={() => setCloudToast({ show: false, message: '' })}
      />
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

