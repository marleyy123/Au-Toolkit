import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { AppLanguage } from '../../../context/LanguageContext';
import type { AUFolder } from '../../../types';
import {
  auth,
  loadUserWorkspaceFromFirestore,
  saveUserWorkspaceToFirestore,
  syncFolderToFirestore,
} from '../../../firebase';
import type { CloudConnectionState } from '../components/CloudSyncIndicator';
import {
  ALL_PLATFORM_TABS,
  clearPendingCloudSync,
} from '../workspaceStorage';

type CloudToastState = {
  show: boolean;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
};

type UseManualWorkspaceCloudActionsArgs = {
  authUser: any;
  language: AppLanguage;
  userAccountKey: string;
  moduleFoldersRef: MutableRefObject<Record<string, AUFolder[]>>;
  gatherCompleteWorkspacePayloadRef: MutableRefObject<() => any>;
  applyCloudWorkspaceData: (cloudData: any, forceHydrate?: boolean) => void;
  setCloudSyncState: Dispatch<SetStateAction<CloudConnectionState>>;
  setLastSyncedTime: Dispatch<SetStateAction<Date | null>>;
  setCloudToast: Dispatch<SetStateAction<CloudToastState>>;
};

export function useManualWorkspaceCloudActions({
  authUser,
  language,
  userAccountKey,
  moduleFoldersRef,
  gatherCompleteWorkspacePayloadRef,
  applyCloudWorkspaceData,
  setCloudSyncState,
  setLastSyncedTime,
  setCloudToast,
}: UseManualWorkspaceCloudActionsArgs) {
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
      ALL_PLATFORM_TABS.forEach((tab) => {
        const folders = moduleFoldersRef.current[tab] || [];
        folders.forEach((folder) => {
          syncFolderToFirestore(folder.id, folder, userEmailOrId, tab);
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

  return {
    handleManualCloudBackup,
    handleManualCloudRestore,
  };
}
