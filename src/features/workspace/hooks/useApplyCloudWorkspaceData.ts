import { useCallback, useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { FontOptionKey } from '../../../components/GlobalFontManager';
import type { UiTheme } from '../../../context/ThemeContext';
import type { AUFolder, PlatformTab } from '../../../types';
import { persistUserAssets } from '../../../utils/userAssets';
import {
  ALL_PLATFORM_TABS,
  clearPendingCloudSync,
  getFormStorageKey,
  getLocalUpdateStorageKey,
  getModuleActiveFolderKey,
  getModuleFolderItemKey,
  getModuleFoldersKey,
  getPendingCloudSyncStorageKey,
} from '../workspaceStorage';

type UseApplyCloudWorkspaceDataArgs = {
  authUser: any;
  userAccountKey: string;
  moduleFolders: Record<string, AUFolder[]>;
  activeFolderIds: Record<string, string>;
  moduleFoldersRef: MutableRefObject<Record<string, AUFolder[]>>;
  activeFolderIdsRef: MutableRefObject<Record<string, string>>;
  hasLocalUserEditsInSessionRef: MutableRefObject<boolean>;
  forceCloudWorkspaceSyncNowRef: MutableRefObject<() => void | Promise<void>>;
  isApplyingCloudAssetsRef: MutableRefObject<boolean>;
  setModuleFolders: Dispatch<SetStateAction<Record<string, AUFolder[]>>>;
  setActiveFolderIds: Dispatch<SetStateAction<Record<string, string>>>;
  setUiTheme: Dispatch<SetStateAction<UiTheme>>;
  setGlobalFont: Dispatch<SetStateAction<FontOptionKey>>;
  setCustomFontName: Dispatch<SetStateAction<string>>;
  setCornerRadius: Dispatch<SetStateAction<number>>;
  setActiveTab: Dispatch<SetStateAction<PlatformTab>>;
  setActiveCategory: Dispatch<SetStateAction<string>>;
  loadTabFormData: (tab: PlatformTab, data: any) => void;
};

export function useApplyCloudWorkspaceData({
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
}: UseApplyCloudWorkspaceDataArgs) {
  const hasInitialTabHydratedRef = useRef(false);

  const applyCloudWorkspaceData = useCallback((cloudData: any, forceHydrate: boolean = false) => {
    if (!cloudData || cloudData.isError || cloudData.status === 'error') return;

    // Unsaved local edits remain authoritative until their write is acknowledged.
    if (localStorage.getItem(getPendingCloudSyncStorageKey(userAccountKey)) === 'true') {
      if (!forceHydrate) forceCloudWorkspaceSyncNowRef.current();
      return;
    }

    if (!forceHydrate && hasLocalUserEditsInSessionRef.current) {
      const localLastUpdated = parseInt(localStorage.getItem(getLocalUpdateStorageKey(userAccountKey)) || '0', 10);
      const cloudUpdatedAt = cloudData.updatedAt ? new Date(cloudData.updatedAt).getTime() : 0;
      if (localLastUpdated > 0 && (!cloudUpdatedAt || localLastUpdated >= cloudUpdatedAt)) {
        forceCloudWorkspaceSyncNowRef.current();
        return;
      }
    }

    const nextFolders = cloudData.moduleFolders && typeof cloudData.moduleFolders === 'object'
      ? cloudData.moduleFolders
      : null;
    const nextActiveIds = cloudData.activeFolderIds && typeof cloudData.activeFolderIds === 'object'
      ? cloudData.activeFolderIds
      : null;

    if (nextFolders) {
      const mergedFolders: Record<string, AUFolder[]> = { ...(moduleFoldersRef.current || moduleFolders) };
      Object.entries(nextFolders).forEach(([tab, folderList]) => {
        if (Array.isArray(folderList) && folderList.length > 0) {
          mergedFolders[tab] = folderList;
        }
      });
      setModuleFolders(mergedFolders);
      moduleFoldersRef.current = mergedFolders;
      Object.entries(mergedFolders).forEach(([tab, folderList]) => {
        try {
          localStorage.setItem(getModuleFoldersKey(userAccountKey, tab as PlatformTab), JSON.stringify(folderList));
          if (Array.isArray(folderList)) {
            folderList.forEach((folder: any) => {
              if (folder && folder.id) {
                localStorage.setItem(getModuleFolderItemKey(userAccountKey, tab as PlatformTab, folder.id), JSON.stringify(folder));
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
      Object.entries(mergedActiveIds).forEach(([tab, activeId]) => {
        try {
          localStorage.setItem(getModuleActiveFolderKey(userAccountKey, tab as PlatformTab), String(activeId));
        } catch {}
      });
    }

    const effectiveFolders = nextFolders || moduleFoldersRef.current;
    const effectiveActiveIds = nextActiveIds || activeFolderIdsRef.current;

    ALL_PLATFORM_TABS.forEach((tab) => {
      const tabFolderList = effectiveFolders?.[tab];
      if (tabFolderList && Array.isArray(tabFolderList) && tabFolderList.length > 0) {
        const activeId = effectiveActiveIds?.[tab] || tabFolderList[0]?.id || 'folder-1';
        const targetFolder = tabFolderList.find((folder: any) => folder.id === activeId) || tabFolderList[0];
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

    if (cloudData.preferences) {
      if (cloudData.preferences.uiTheme && (cloudData.preferences.uiTheme === 'dark' || cloudData.preferences.uiTheme === 'light')) {
        setUiTheme(cloudData.preferences.uiTheme);
        try {
          localStorage.setItem('au_ui_theme', cloudData.preferences.uiTheme);
        } catch {}
      }
      if (cloudData.preferences.globalFont) {
        setGlobalFont(cloudData.preferences.globalFont);
        try {
          localStorage.setItem('global_app_font', cloudData.preferences.globalFont);
        } catch {}
      }
      if (cloudData.preferences.customFontName) {
        setCustomFontName(cloudData.preferences.customFontName);
        try {
          localStorage.setItem('global_custom_font_name', cloudData.preferences.customFontName);
        } catch {}
      }
      if (typeof (cloudData.preferences.cornerRadius ?? cloudData.preferences.cardCornerRadius) === 'number') {
        const radius = cloudData.preferences.cornerRadius ?? cloudData.preferences.cardCornerRadius;
        setCornerRadius(radius);
        try {
          localStorage.setItem('global_card_corner_radius', String(radius));
        } catch {}
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

    if (forceHydrate && !hasInitialTabHydratedRef.current) {
      hasInitialTabHydratedRef.current = true;
      if (cloudData.lastActiveTab && ALL_PLATFORM_TABS.includes(cloudData.lastActiveTab)) {
        setActiveTab(cloudData.lastActiveTab);
        try {
          localStorage.setItem('au_last_active_tab', cloudData.lastActiveTab);
        } catch {}
      }
      if (cloudData.lastActiveCategory) {
        setActiveCategory(cloudData.lastActiveCategory);
      }
    }

    hasLocalUserEditsInSessionRef.current = false;
    const cloudTime = cloudData.updatedAt ? new Date(cloudData.updatedAt).getTime() : Date.now();
    try {
      localStorage.setItem(getLocalUpdateStorageKey(userAccountKey), String(cloudTime));
      clearPendingCloudSync(userAccountKey);
    } catch {}
  }, [userAccountKey, authUser?.uid]);

  const applyCloudWorkspaceDataRef = useRef(applyCloudWorkspaceData);
  applyCloudWorkspaceDataRef.current = applyCloudWorkspaceData;

  return {
    applyCloudWorkspaceData,
    applyCloudWorkspaceDataRef,
  };
}
