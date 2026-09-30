import { MutableRefObject, useEffect, useRef, useState } from 'react';
import {
  clearWorkspaceFingerprintCache,
  getStoredAuthUser,
  isFirestoreQuotaExhausted,
  onQuotaStatusChange,
} from '../../../firebase';
import { USER_ASSETS_SYNC_EVENT } from '../../../utils/userAssets';
import { markLocalWorkspaceUpdated } from '../workspaceStorage';
import { CloudConnectionState } from '../components/CloudSyncIndicator';

interface UseWorkspaceCloudStatusArgs {
  authUser: any;
  userAccountKey: string;
  isApplyingCloudAssetsRef: MutableRefObject<boolean>;
  hasLocalUserEditsInSessionRef: MutableRefObject<boolean>;
  triggerCloudWorkspaceSyncRef: MutableRefObject<() => void>;
  forceCloudWorkspaceSyncNowRef: MutableRefObject<() => void>;
}

export function useWorkspaceCloudStatus({
  authUser,
  userAccountKey,
  isApplyingCloudAssetsRef,
  hasLocalUserEditsInSessionRef,
  triggerCloudWorkspaceSyncRef,
  forceCloudWorkspaceSyncNowRef,
}: UseWorkspaceCloudStatusArgs) {
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
    clearWorkspaceFingerprintCache();
    hasLocalUserEditsInSessionRef.current = false;
  }, [hasLocalUserEditsInSessionRef, userAccountKey]);

  useEffect(() => {
    const handleUserAssetsChanged = () => {
      if (isApplyingCloudAssetsRef.current) return;
      hasLocalUserEditsInSessionRef.current = true;
      markLocalWorkspaceUpdated(userAccountKey);
      setTimeout(() => triggerCloudWorkspaceSyncRef.current?.(), 0);
    };
    window.addEventListener(USER_ASSETS_SYNC_EVENT, handleUserAssetsChanged);
    return () => window.removeEventListener(USER_ASSETS_SYNC_EVENT, handleUserAssetsChanged);
  }, [hasLocalUserEditsInSessionRef, isApplyingCloudAssetsRef, triggerCloudWorkspaceSyncRef, userAccountKey]);

  useEffect(() => {
    return onQuotaStatusChange((exhausted) => {
      setIsQuotaExhausted(exhausted);
      if (exhausted) {
        setCloudSyncState('offline');
      }
    });
  }, []);

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
  }, [authUser?.uid, forceCloudWorkspaceSyncNowRef]);

  return {
    cloudSyncState,
    setCloudSyncState,
    lastSyncedTime,
    setLastSyncedTime,
    isQuotaExhausted,
    syncDebounceTimerRef,
    lastManualCloudRefreshAtRef,
  };
}
