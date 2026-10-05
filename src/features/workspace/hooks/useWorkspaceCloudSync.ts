import { useCallback, useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import {
  auth,
  isFirestoreQuotaExhausted,
  saveUserWorkspaceToFirestore,
} from '../../../firebase';
import type { CloudConnectionState } from '../components/CloudSyncIndicator';
import { clearPendingCloudSync, getLocalUpdateStorageKey } from '../workspaceStorage';

type UseWorkspaceCloudSyncArgs = {
  authUser: any;
  userAccountKey: string;
  isHydratedRef: MutableRefObject<boolean>;
  syncDebounceTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  gatherCompleteWorkspacePayloadRef: MutableRefObject<() => any>;
  triggerCloudWorkspaceSyncRef: MutableRefObject<() => void>;
  forceCloudWorkspaceSyncNowRef: MutableRefObject<() => void | Promise<void>>;
  setCloudSyncState: Dispatch<SetStateAction<CloudConnectionState>>;
  setLastSyncedTime: Dispatch<SetStateAction<Date | null>>;
};

export function useWorkspaceCloudSync({
  authUser,
  userAccountKey,
  isHydratedRef,
  syncDebounceTimerRef,
  gatherCompleteWorkspacePayloadRef,
  triggerCloudWorkspaceSyncRef,
  forceCloudWorkspaceSyncNowRef,
  setCloudSyncState,
  setLastSyncedTime,
}: UseWorkspaceCloudSyncArgs) {
  const triggerCloudWorkspaceSync = useCallback(() => {
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
        const localRevision = localStorage.getItem(getLocalUpdateStorageKey(userAccountKey));
        const payload = gatherCompleteWorkspacePayloadRef.current();
        await saveUserWorkspaceToFirestore(userEmailOrId, payload);
        if (auth.currentUser?.uid !== userEmailOrId) return;
        if (isFirestoreQuotaExhausted()) {
          setCloudSyncState('offline');
        } else {
          if (localStorage.getItem(getLocalUpdateStorageKey(userAccountKey)) === localRevision) {
            clearPendingCloudSync(userAccountKey);
            setCloudSyncState('synced');
            setLastSyncedTime(new Date());
          } else {
            triggerCloudWorkspaceSyncRef.current();
          }
        }
      } catch (err) {
        console.warn('Real-time cloud sync notice:', err);
        setCloudSyncState(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error');
      }
    }, 3000);
  }, [authUser?.uid, userAccountKey]);

  useEffect(() => {
    triggerCloudWorkspaceSyncRef.current = triggerCloudWorkspaceSync;
  }, [triggerCloudWorkspaceSync, triggerCloudWorkspaceSyncRef]);

  const forceCloudWorkspaceSyncNow = useCallback(async () => {
    if (syncDebounceTimerRef.current) {
      clearTimeout(syncDebounceTimerRef.current);
      syncDebounceTimerRef.current = null;
    }
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
      const localRevision = localStorage.getItem(getLocalUpdateStorageKey(userAccountKey));
      const payload = gatherCompleteWorkspacePayloadRef.current();
      await saveUserWorkspaceToFirestore(userEmailOrId, payload);
      if (auth.currentUser?.uid !== userEmailOrId) return;
      if (isFirestoreQuotaExhausted()) {
        setCloudSyncState('offline');
      } else {
        if (localStorage.getItem(getLocalUpdateStorageKey(userAccountKey)) === localRevision) {
          clearPendingCloudSync(userAccountKey);
          setCloudSyncState('synced');
          setLastSyncedTime(new Date());
        } else {
          triggerCloudWorkspaceSyncRef.current();
        }
      }
    } catch (err) {
      console.warn('Force cloud sync notice:', err);
      setCloudSyncState(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error');
    }
  }, [authUser?.uid, userAccountKey]);

  forceCloudWorkspaceSyncNowRef.current = forceCloudWorkspaceSyncNow;

  return {
    triggerCloudWorkspaceSync,
    forceCloudWorkspaceSyncNow,
  };
}
