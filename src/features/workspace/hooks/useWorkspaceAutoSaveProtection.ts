import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { AUFolder, PlatformTab } from '../../../types';
import { auth, loadUserWorkspaceFromFirestore } from '../../../firebase';
import type { CloudConnectionState } from '../components/CloudSyncIndicator';
import {
  getFormStorageKey,
  getModuleFoldersKey,
  markLocalWorkspaceUpdated,
} from '../workspaceStorage';

type UseWorkspaceAutoSaveProtectionArgs = {
  activeTab: PlatformTab;
  userAccountKey: string;
  authUserUid?: string;
  cloudSyncState: CloudConnectionState;
  moduleFoldersRef: MutableRefObject<Record<string, AUFolder[]>>;
  activeFolderIdsRef: MutableRefObject<Record<string, string>>;
  hasLocalUserEditsInSessionRef: MutableRefObject<boolean>;
  lastManualCloudRefreshAtRef: MutableRefObject<number>;
  triggerCloudWorkspaceSyncRef: MutableRefObject<() => void>;
  applyCloudWorkspaceDataRef: MutableRefObject<(cloudData: any, forceHydrate?: boolean) => void>;
  getCurrentTabFormData: (tab: PlatformTab) => any;
};

export function useWorkspaceAutoSaveProtection({
  activeTab,
  userAccountKey,
  authUserUid,
  cloudSyncState,
  moduleFoldersRef,
  activeFolderIdsRef,
  hasLocalUserEditsInSessionRef,
  lastManualCloudRefreshAtRef,
  triggerCloudWorkspaceSyncRef,
  applyCloudWorkspaceDataRef,
  getCurrentTabFormData,
}: UseWorkspaceAutoSaveProtectionArgs) {
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
        const shouldFallbackRefresh =
          authUserUid &&
          !hasLocalUserEditsInSessionRef.current &&
          typeof navigator !== 'undefined' &&
          navigator.onLine &&
          (cloudSyncState === 'error' || cloudSyncState === 'offline') &&
          Date.now() - lastManualCloudRefreshAtRef.current > 5 * 60 * 1000;

        if (shouldFallbackRefresh) {
          lastManualCloudRefreshAtRef.current = Date.now();
          const requestedUid = authUserUid;
          loadUserWorkspaceFromFirestore(authUserUid)
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
  }, [activeTab, userAccountKey, authUserUid, cloudSyncState]);
}
