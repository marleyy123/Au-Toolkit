import { Dispatch, MutableRefObject, SetStateAction, useState } from 'react';
import {
  auth,
  clearWorkspaceFingerprintCache,
  flushPendingWorkspaceSaves,
  isFirestoreQuotaExhausted,
  saveUserWorkspaceToFirestore,
  setStoredAuthUser,
  signOutUser,
} from '../../../firebase';
import { AUFolder, PlatformTab } from '../../../types';
import { AuthLifecycleStage } from '../components/AppLoadingScreen';
import { CloudConnectionState } from '../../workspace/components/CloudSyncIndicator';
import { ALL_PLATFORM_TABS, getInitialTabData } from '../../workspace/workspaceStorage';

interface UseAuthLogoutActionsArgs {
  authUser: any;
  moduleFolders: Record<string, AUFolder[]>;
  activeFolderIds: Record<string, string>;
  moduleFoldersRef: MutableRefObject<Record<string, AUFolder[]>>;
  activeFolderIdsRef: MutableRefObject<Record<string, string>>;
  syncDebounceTimerRef: MutableRefObject<NodeJS.Timeout | null>;
  isHydratedRef: MutableRefObject<boolean>;
  hasLocalUserEditsInSessionRef: MutableRefObject<boolean>;
  gatherCompleteWorkspacePayloadRef: MutableRefObject<any>;
  loadTabFormData: (tab: PlatformTab, data: any) => void;
  setAccessCode: Dispatch<SetStateAction<string>>;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
  setAuthUser: Dispatch<SetStateAction<any>>;
  setIsHydrated: Dispatch<SetStateAction<boolean>>;
  setAuthLifecycleStage: Dispatch<SetStateAction<AuthLifecycleStage>>;
  setCloudSyncState: Dispatch<SetStateAction<CloudConnectionState>>;
  setModuleFolders: Dispatch<SetStateAction<Record<string, AUFolder[]>>>;
  setActiveFolderIds: Dispatch<SetStateAction<Record<string, string>>>;
  setIsInitialCloudLoading: Dispatch<SetStateAction<boolean>>;
  setBuyerEntitlement: Dispatch<SetStateAction<any>>;
}

const clearAuthStorage = () => {
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
};

export function useAuthLogoutActions({
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
}: UseAuthLogoutActionsArgs) {
  const [logoutReason, setLogoutReason] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const resetWorkspaceState = () => {
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

  const handleAutoLogout = (reason: string) => {
    clearAuthStorage();
    signOutUser().catch(() => {});
    setAccessCode('');
    setIsAuthenticated(false);
    setAuthUser(null);
    setIsHydrated(false);
    isHydratedRef.current = false;
    setLogoutReason(reason);
    setAuthLifecycleStage('UNAUTHENTICATED');
    setCloudSyncState('signed_out');
    resetWorkspaceState();
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      if (syncDebounceTimerRef.current) {
        clearTimeout(syncDebounceTimerRef.current);
        syncDebounceTimerRef.current = null;
      }

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

      try {
        await Promise.race([
          signOutUser(),
          new Promise((res) => setTimeout(res, 800)),
        ]);
      } catch {}

      clearAuthStorage();
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
      resetWorkspaceState();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    logoutReason,
    setLogoutReason,
    isLoggingOut,
    isPasswordModalOpen,
    setIsPasswordModalOpen,
    handleAutoLogout,
    handleLogout,
  };
}
