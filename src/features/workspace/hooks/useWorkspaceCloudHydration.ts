import { useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { AuthLifecycleStage } from '../../auth/components/AppLoadingScreen';
import type { AUFolder, PlatformTab } from '../../../types';
import {
  loadUserWorkspaceFromFirestore,
  subscribeUserWorkspaceFromFirestore,
} from '../../../firebase';
import {
  ALL_PLATFORM_TABS,
  getFormStorageKey,
  getInitialTabData,
  getLocalUpdateStorageKey,
  getModuleFoldersKey,
  getPendingCloudSyncStorageKey,
  loadAllStoredActiveFolderIds,
  loadAllStoredModuleFolders,
} from '../workspaceStorage';
import type { CloudConnectionState } from '../components/CloudSyncIndicator';
import { persistUserAssets, readPersistentUserAssets } from '../../../utils/userAssets';

type UseWorkspaceCloudHydrationArgs = {
  enabled: boolean;
  authUser: any;
  userAccountKey: string;
  clientSessionId: string;
  accountSyncGenerationRef: MutableRefObject<number>;
  isHydratedRef: MutableRefObject<boolean>;
  isApplyingCloudAssetsRef: MutableRefObject<boolean>;
  hasLocalUserEditsInSessionRef: MutableRefObject<boolean>;
  moduleFoldersRef: MutableRefObject<Record<string, AUFolder[]>>;
  activeFolderIdsRef: MutableRefObject<Record<string, string>>;
  forceCloudWorkspaceSyncNowRef: MutableRefObject<() => void | Promise<void>>;
  applyCloudWorkspaceDataRef: MutableRefObject<(cloudData: any, forceHydrate?: boolean) => void>;
  setCloudSyncState: Dispatch<SetStateAction<CloudConnectionState>>;
  setIsInitialCloudLoading: Dispatch<SetStateAction<boolean>>;
  setIsHydrated: Dispatch<SetStateAction<boolean>>;
  setAuthLifecycleStage: Dispatch<SetStateAction<AuthLifecycleStage>>;
  setLastSyncedTime: Dispatch<SetStateAction<Date | null>>;
  setModuleFolders: Dispatch<SetStateAction<Record<string, AUFolder[]>>>;
  setActiveFolderIds: Dispatch<SetStateAction<Record<string, string>>>;
  loadTabFormData: (tab: PlatformTab, data: any) => void;
};

export function useWorkspaceCloudHydration({
  enabled,
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
}: UseWorkspaceCloudHydrationArgs) {
  useEffect(() => {
    const userEmailOrId = authUser?.uid;
    if (!userEmailOrId) {
      accountSyncGenerationRef.current += 1;
      setCloudSyncState('signed_out');
      setIsInitialCloudLoading(false);
      setIsHydrated(true);
      isHydratedRef.current = true;
      setAuthLifecycleStage((prev) => (prev === 'LOAD_USER_DATA' || prev === 'HYDRATE_DATA' ? 'READY' : prev));
      return;
    }

    if (!enabled) return;

    const expectedUid = userEmailOrId;
    const generation = ++accountSyncGenerationRef.current;
    let disposed = false;
    const isCurrentAccount = () =>
      !disposed &&
      accountSyncGenerationRef.current === generation &&
      authUser?.uid === expectedUid;

    setCloudSyncState('syncing');

    isApplyingCloudAssetsRef.current = true;
    try {
      persistUserAssets(expectedUid, readPersistentUserAssets(expectedUid, authUser?.email), true);
    } finally {
      isApplyingCloudAssetsRef.current = false;
    }

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
            setIsHydrated(true);
            isHydratedRef.current = true;
            forceCloudWorkspaceSyncNowRef.current();
          } else {
            applyCloudWorkspaceDataRef.current(cloudWorkspace, true);
          }
          setCloudSyncState('synced');
          setLastSyncedTime(new Date());
        } else if (cloudWorkspace && (cloudWorkspace.isNewUser || cloudWorkspace.status === 'new_user')) {
          const localFolders = loadAllStoredModuleFolders(userAccountKey, ALL_PLATFORM_TABS);
          const hasExistingLocalData = ALL_PLATFORM_TABS.some((tab) => {
            const hasFolderStorage = Boolean(localStorage.getItem(getModuleFoldersKey(userAccountKey, tab)));
            const hasFormStorage = Boolean(localStorage.getItem(getFormStorageKey(userAccountKey, tab)));
            return hasFolderStorage || hasFormStorage;
          });

          if (hasExistingLocalData || hasLocalUserEditsInSessionRef.current) {
            setModuleFolders(localFolders);
            moduleFoldersRef.current = localFolders;
            const loadedActiveIds = loadAllStoredActiveFolderIds(userAccountKey, ALL_PLATFORM_TABS);
            setActiveFolderIds(loadedActiveIds);
            activeFolderIdsRef.current = loadedActiveIds;
            ALL_PLATFORM_TABS.forEach((tab) => {
              const tabFolders = localFolders[tab] || [];
              const tabFolderId = loadedActiveIds[tab] || tabFolders[0]?.id;
              const currentFolder = tabFolders.find((folder) => folder.id === tabFolderId) || tabFolders[0];
              if (currentFolder && currentFolder.data) {
                loadTabFormData(tab, currentFolder.data);
              }
            });
            setIsHydrated(true);
            isHydratedRef.current = true;
            forceCloudWorkspaceSyncNowRef.current();
            setCloudSyncState('synced');
            setLastSyncedTime(new Date());
            setAuthLifecycleStage((prev) => (prev === 'LOAD_USER_DATA' || prev === 'HYDRATE_DATA' ? 'READY' : prev));
            return;
          }

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
          setAuthLifecycleStage((prev) => (prev === 'LOAD_USER_DATA' || prev === 'HYDRATE_DATA' ? 'READY' : prev));
          return;
        } else {
          setCloudSyncState(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error');
        }
        setIsHydrated(true);
        isHydratedRef.current = true;
        setAuthLifecycleStage((prev) => (prev === 'LOAD_USER_DATA' || prev === 'HYDRATE_DATA' ? 'READY' : prev));
      })
      .catch(() => {
        if (!isCurrentAccount()) return;
        clearTimeout(hydrationSafetyTimer);
        setIsInitialCloudLoading(false);
        setIsHydrated(true);
        isHydratedRef.current = true;
        setCloudSyncState(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error');
        setAuthLifecycleStage((prev) => (prev === 'LOAD_USER_DATA' || prev === 'HYDRATE_DATA' ? 'READY' : prev));
      });

    const unsubscribe = subscribeUserWorkspaceFromFirestore(
      userEmailOrId,
      (cloudData) => {
        if (!cloudData || !isCurrentAccount()) return;
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
  }, [enabled, authUser?.uid, userAccountKey]);
}
