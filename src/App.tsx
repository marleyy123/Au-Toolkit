import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AUFolder } from './types';
import { DEFAULT_AVATAR } from './data/defaultTemplates';
import { MobileFloatingPreview } from './components/MobileFloatingPreview';
import { Login } from './features/auth/components/Login';
import { AccountPasswordModal } from './features/auth/components/AccountPasswordModal';
import {
  signInWithGoogle,
  getStoredAuthUser,
  loadFoldersFromFirestore,
  getUserDocumentId,
  resetFirestoreQuotaCircuitBreaker,
} from './firebase';
import {
  getDeviceFriendlyLabel,
  subscribeDeviceSlotSession,
} from './utils/deviceAuthService';
import { AccessGuard } from './features/auth/components/AccessGuard';
import { AppLoadingScreen } from './features/auth/components/AppLoadingScreen';
import { ThemeContext, UiTheme } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';
import {
  ALL_PLATFORM_TABS,
  getFloatingPreviewTitle,
  getInitialTabData,
  loadAllStoredActiveFolderIds,
  loadAllStoredModuleFolders,
} from './features/workspace/workspaceStorage';
import { WorkspaceFeedback } from './features/workspace/components/WorkspaceFeedback';
import { AppHeader } from './features/workspace/components/AppHeader';
import { PreviewExportPanel } from './features/workspace/components/PreviewExportPanel';
import { EditorFormPanel } from './features/editor/components/EditorFormPanel';
import { DeveloperAccessControls } from './features/admin/components/DeveloperAccessControls';
import { useTikTokFormHandlers } from './features/tiktok/hooks/useTikTokFormHandlers';
import { useWhatsAppFormHandlers } from './features/whatsapp/hooks/useWhatsAppFormHandlers';
import { useLineFormHandlers } from './features/line/hooks/useLineFormHandlers';
import { useInstagramFormHandlers } from './features/instagram/hooks/useInstagramFormHandlers';
import { useTwitterFormHandlers } from './features/twitter/hooks/useTwitterFormHandlers';
import { usePreviewExport } from './features/editor/hooks/usePreviewExport';
import { PreparedImageDialog } from './features/editor/components/PreparedImageDialog';
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
import { useWorkspaceLocalStateSync } from './features/workspace/hooks/useWorkspaceLocalStateSync';
import { useAdminFeatureGate } from './features/admin/hooks/useAdminFeatureGate';
import { useRegisteredPreviewHandlers } from './features/editor/hooks/useRegisteredPreviewHandlers';
import { useMiscFormHandlers } from './features/misc/hooks/useMiscFormHandlers';
import { useEntitlementLifecycle } from './features/auth/hooks/useEntitlementLifecycle';
import { useGeneratorFormStates } from './features/workspace/hooks/useGeneratorFormStates';
import { useWorkspaceNavigationState } from './features/workspace/hooks/useWorkspaceNavigationState';
import { useAuthGateActions } from './features/auth/hooks/useAuthGateActions';
import { useAuthLogoutActions } from './features/auth/hooks/useAuthLogoutActions';
import { useWorkspaceCloudStatus } from './features/workspace/hooks/useWorkspaceCloudStatus';
import { useAuthSessionState } from './features/auth/hooks/useAuthSessionState';

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

  const {
    authUser,
    setAuthUser,
    userAccountKey,
    authLifecycleStage,
    setAuthLifecycleStage,
    buyerEntitlement,
    setBuyerEntitlement,
    loadingErrorMessage,
    setLoadingErrorMessage,
    accessCode,
    setAccessCode,
    isAuthenticated,
    setIsAuthenticated,
    clientDeviceSlot,
  } = useAuthSessionState();
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

  const {
    cloudSyncState,
    setCloudSyncState,
    lastSyncedTime,
    setLastSyncedTime,
    isQuotaExhausted,
    syncDebounceTimerRef,
    lastManualCloudRefreshAtRef,
  } = useWorkspaceCloudStatus({
    authUser,
    userAccountKey,
    isApplyingCloudAssetsRef,
    hasLocalUserEditsInSessionRef,
    triggerCloudWorkspaceSyncRef,
    forceCloudWorkspaceSyncNowRef,
  });

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

  // Language State
  const { language, toggleLanguage, t } = useLanguage();

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

  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isFeatureFlagModalOpen, setIsFeatureFlagModalOpen] = useState<boolean>(false);
  const [featureFlagsVersion, setFeatureFlagsVersion] = useState<number>(0);
  const { handleSecretFooterClick } = useAdminFeatureGate({
    setIsPinModalOpen,
    setFeatureFlagsVersion,
  });

  const {
    activeTab,
    setActiveTab,
    activeCategory,
    setActiveCategory,
  } = useWorkspaceNavigationState({
    featureFlagsVersion,
  });

  const {
    twitterData,
    instagramFeedData,
    instagramStoryData,
    instagramProfileData,
    instagramLiveData,
    instagramNotesData,
    instagramActivityData,
    instagramDMData,
    instagramDMInboxData,
    instagramFeedCommentsData,
    instagramStoryReplyData,
    instagramStoryViewersData,
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
    setInstagramProfileData,
    setInstagramLiveData,
    setInstagramNotesData,
    setInstagramActivityData,
    setInstagramDMData,
    setInstagramDMInboxData,
    setInstagramFeedCommentsData,
    setInstagramStoryReplyData,
    setInstagramStoryViewersData,
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
  } = useGeneratorFormStates(userAccountKey);
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

  useWorkspaceLocalStateSync({
    userAccountKey,
    activeTab,
    moduleFolders,
    activeFolderIds,
    moduleFoldersRef,
    activeFolderIdsRef,
    triggerCloudWorkspaceSyncRef,
    setModuleFolders,
    setActiveFolderIds,
    getCurrentTabFormData,
    loadTabFormData,
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
    logoutReason,
    setLogoutReason,
    isLoggingOut,
    isPasswordModalOpen,
    setIsPasswordModalOpen,
    handleAutoLogout,
    handleLogout,
  } = useAuthLogoutActions({
    authUser,
    moduleFolders,
    activeFolderIds,
    moduleFoldersRef,
    activeFolderIdsRef,
    syncDebounceTimerRef,
    isHydratedRef,
    hasLocalUserEditsInSessionRef,
    gatherCompleteWorkspacePayloadRef,
    loadTabFormData,
    setAccessCode,
    setIsAuthenticated,
    setAuthUser,
    setIsHydrated,
    setAuthLifecycleStage,
    setCloudSyncState,
    setModuleFolders,
    setActiveFolderIds,
    setIsInitialCloudLoading,
    setBuyerEntitlement,
  });
  const { revalidateEntitlement } = useEntitlementLifecycle({
    authUser,
    authLifecycleStage,
    isAuthenticated,
    language,
    buyerEntitlement,
    setAuthUser,
    setIsAuthenticated,
    setAuthLifecycleStage,
    setLoadingErrorMessage,
    setBuyerEntitlement,
    handleAutoLogout,
  });
  useEffect(() => {
    if (
      !isAuthenticated ||
      (authLifecycleStage !== 'LOAD_USER_DATA' && authLifecycleStage !== 'HYDRATE_DATA')
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (!isAuthenticated) return;
      setIsInitialCloudLoading(false);
      setIsHydrated(true);
      isHydratedRef.current = true;
      setAuthLifecycleStage((prev) =>
        prev === 'LOAD_USER_DATA' || prev === 'HYDRATE_DATA' ? 'READY' : prev
      );
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [authLifecycleStage, isAuthenticated]);
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
    preparedImage,
    closePreparedImage,
    exportScale,
    setExportScale,
    isExporting,
    isExportingJpg,
    exportStatusText,
    exportError,
    downloadSuccess,
    downloadJpgSuccess,
    handleDownload,
    handleDownloadJpg,
  } = usePreviewExport({
    activeTab,
    language,
    previewRef,
    getCurrentTabFormData,
    updateActiveFolderData,
  });

  const {
    handleIosLockscreenDataChange,
    handleNotesDataChange,
    handlePushNotificationDataChange,
    handleSpotifyDataChange,
  } = useMiscFormHandlers({
    setIosLockscreenData,
    setNotesData,
    setPushNotificationData,
    setSpotifyData,
    updateActiveFolderData,
  });

  const {
    handleRegisteredPreviewChange,
    handleRegisteredMessageText,
  } = useRegisteredPreviewHandlers({
    activeTab,
    handleTwitterDataChange,
    handleInstagramDMDataChange,
    handleUpdateInstagramDMMessageText,
    handleWhatsAppChatDataChange,
    handleWhatsAppCallDataChange,
    handleWhatsAppStatusDataChange,
    handleWhatsAppViewersDataChange,
    handleUpdateWhatsAppMessageText,
    handleTikTokProfileDataChange,
    handleIosLockscreenDataChange,
    handleLineChatDataChange,
    handleUpdateLineMessageText,
    handleNotesDataChange,
    handlePushNotificationDataChange,
    handleSpotifyDataChange,
  });

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
  const {
    handleBackToLogin,
    handleContextAwareRetry,
    handleLoginSuccess,
    handleAccessExpired,
  } = useAuthGateActions({
    authUser,
    authLifecycleStage,
    applyCloudWorkspaceDataRef,
    isHydratedRef,
    setAccessCode,
    setIsAuthenticated,
    setLogoutReason,
    setAuthUser,
    setBuyerEntitlement,
    setAuthLifecycleStage,
    setIsHydrated,
    setIsInitialCloudLoading,
    setLoadingErrorMessage,
    revalidateEntitlement,
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
        onLoginSuccess={handleLoginSuccess}
        onAccessExpired={handleAccessExpired}
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
      <AppHeader
        uiTheme={uiTheme}
        language={language}
        activeCategory={activeCategory}
        activeTab={activeTab}
        mobileView={mobileView}
        isMobileFloatingPreviewOpen={isMobileFloatingPreviewOpen}
        authUser={authUser}
        isLoggingOut={isLoggingOut}
        toggleLanguage={toggleLanguage}
        handleToggleTheme={handleToggleTheme}
        handleLogout={handleLogout}
        setActiveCategory={setActiveCategory}
        setActiveTab={setActiveTab}
        setMobileView={setMobileView}
        setMobileFloatingPreviewOpen={setMobileFloatingPreviewOpen}
        setIsPasswordModalOpen={setIsPasswordModalOpen}
        setIsResetConfirmOpen={setIsResetConfirmOpen}
      />

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
        <PreviewExportPanel
          uiTheme={uiTheme}
          language={language}
          mobileView={mobileView}
          activeTab={activeTab}
          currentPreviewData={currentPreviewData}
          currentFontCss={currentFontCss}
          previewRef={previewRef}
          previewViewportRef={previewViewportRef}
          exportScale={exportScale}
          setExportScale={setExportScale}
          isExporting={isExporting}
          isExportingJpg={isExportingJpg}
          exportStatusText={exportStatusText}
          exportError={exportError}
          downloadSuccess={downloadSuccess}
          downloadJpgSuccess={downloadJpgSuccess}
          handleDownload={handleDownload}
          handleDownloadJpg={handleDownloadJpg}
          previewZoom={previewZoom}
          previewPan={previewPan}
          isPreviewLocked={isPreviewLocked}
          isDraggingCanvas={isDraggingCanvas}
          setPreviewZoom={setPreviewZoom}
          setPreviewPan={setPreviewPan}
          handleToggleLockPreview={handleToggleLockPreview}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          handleZoomReset={handleZoomReset}
          handlePointerDown={handlePointerDown}
          handleMouseDown={handleMouseDown}
          handleDoubleClickViewport={handleDoubleClickViewport}
          cornerRadius={cornerRadius}
          handleCornerRadiusChange={handleCornerRadiusChange}
          handleResetActiveTabState={handleResetActiveTabState}
          handleRegisteredPreviewChange={handleRegisteredPreviewChange}
          handleRegisteredMessageText={handleRegisteredMessageText}
          handleToggleTikTokFypLike={handleToggleTikTokFypLike}
          handleToggleTikTokFypBookmark={handleToggleTikTokFypBookmark}
          handleToggleTikTokFypFollow={handleToggleTikTokFypFollow}
        />
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

      <PreparedImageDialog file={preparedImage} language={language} onClose={closePreparedImage}/>

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









