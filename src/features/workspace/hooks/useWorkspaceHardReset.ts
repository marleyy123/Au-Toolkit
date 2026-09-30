import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { AppLanguage } from '../../../context/LanguageContext';
import type { UiTheme } from '../../../context/ThemeContext';
import type { AUFolder, PlatformTab } from '../../../types';
import {
  clearAllFirebaseData,
  clearWorkspaceFingerprintCache,
  saveUserWorkspaceToFirestore,
} from '../../../firebase';
import type { CloudConnectionState } from '../components/CloudSyncIndicator';
import {
  ALL_PLATFORM_TABS,
  STORAGE_RESET_KEY,
  clearPendingCloudSync,
  getFormStorageKey,
  getInitialTabData,
  getModuleActiveFolderKey,
  getModuleFoldersKey,
} from '../workspaceStorage';

type UseWorkspaceHardResetArgs = {
  activeTab: PlatformTab;
  activeCategory: string;
  authUser: any;
  clientSessionId: string;
  userAccountKey: string;
  uiTheme: UiTheme;
  language: AppLanguage;
  globalFont: string;
  customFontName: string;
  cornerRadius: number;
  moduleFoldersRef: MutableRefObject<Record<string, AUFolder[]>>;
  activeFolderIdsRef: MutableRefObject<Record<string, string>>;
  setModuleFolders: Dispatch<SetStateAction<Record<string, AUFolder[]>>>;
  setActiveFolderIds: Dispatch<SetStateAction<Record<string, string>>>;
  setCloudSyncState: Dispatch<SetStateAction<CloudConnectionState>>;
  setLastSyncedTime: Dispatch<SetStateAction<Date | null>>;
  setIsResetting: Dispatch<SetStateAction<boolean>>;
  setIsResetConfirmOpen: Dispatch<SetStateAction<boolean>>;
  setResetSuccessToast: Dispatch<SetStateAction<boolean>>;
  loadTabFormData: (tab: PlatformTab, data: any) => void;
};

export function useWorkspaceHardReset({
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
}: UseWorkspaceHardResetArgs) {
  const handlePerformHardReset = async () => {
    setIsResetting(true);
    try {
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
      keysToRemove.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch {}
      });

      sessionStorage.clear();
      localStorage.setItem(STORAGE_RESET_KEY, 'true');

      clearWorkspaceFingerprintCache();
      if (authUser?.uid) {
        await clearAllFirebaseData(authUser.uid);
      }
    } catch (e) {
      console.warn('Hard reset storage error:', e);
    }

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
      loadTabFormData(tab, freshData);

      try {
        localStorage.setItem(getModuleFoldersKey(userAccountKey, tab), JSON.stringify(freshInitialFolders[tab]));
        localStorage.setItem(getModuleActiveFolderKey(userAccountKey, tab), 'folder-1');
        localStorage.setItem(getFormStorageKey(userAccountKey, tab), JSON.stringify(freshData));
      } catch {}
    });

    setModuleFolders(freshInitialFolders);
    setActiveFolderIds(freshInitialActiveIds);
    moduleFoldersRef.current = freshInitialFolders;
    activeFolderIdsRef.current = freshInitialActiveIds;

    const activeTabFreshData = freshInitialFolders[activeTab]?.[0]?.data || getInitialTabData(activeTab);
    loadTabFormData(activeTab, activeTabFreshData);

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

  return { handlePerformHardReset };
}
