import { useEffect, useRef } from 'react';
import type { MutableRefObject, Dispatch, SetStateAction } from 'react';
import type { AUFolder, PlatformTab } from '../../../types';
import { ALL_PLATFORM_TABS, getModuleFoldersKey } from '../workspaceStorage';
import { deepMigrateAndReplaceMedia } from '../../../utils/imageManager';

type UseWorkspaceAutoMigratorArgs = {
  authUser: any;
  userAccountKey: string;
  isHydrated: boolean;
  moduleFolders: Record<string, AUFolder[]>;
  moduleFoldersRef: MutableRefObject<Record<string, AUFolder[]>>;
  activeFolderIdsRef: MutableRefObject<Record<string, string>>;
  loadTabFormData: (tab: PlatformTab, data: any) => void;
  setModuleFolders: Dispatch<SetStateAction<Record<string, AUFolder[]>>>;
  forceCloudWorkspaceSyncNowRef: MutableRefObject<() => void | Promise<void>>;
};

/**
 * Automatically migrates legacy local Base64 images and IndexedDB references
 * to Cloudflare R2 in the background. Updates both localStorage and active state,
 * then triggers a cloud sync so mobile and laptop stay 100% in sync.
 */
export function useWorkspaceAutoMigrator({
  authUser,
  userAccountKey,
  isHydrated,
  moduleFolders,
  moduleFoldersRef,
  activeFolderIdsRef,
  loadTabFormData,
  setModuleFolders,
  forceCloudWorkspaceSyncNowRef,
}: UseWorkspaceAutoMigratorArgs) {
  const hasRunMigrationRef = useRef<string | null>(null);

  useEffect(() => {
    const uid = authUser?.uid;
    if (!uid || !isHydrated) return;

    // Run once per user login session
    if (hasRunMigrationRef.current === uid) return;

    let isDisposed = false;

    const performAutoMigration = async () => {
      try {
        const currentFolders = moduleFoldersRef.current && Object.keys(moduleFoldersRef.current).length > 0
          ? moduleFoldersRef.current
          : moduleFolders;

        if (!currentFolders || Object.keys(currentFolders).length === 0) return;

        let anyTabChanged = false;
        const updatedModuleFolders: Record<string, AUFolder[]> = { ...currentFolders };
        const migrationCache = new Map<string, string>();

        for (const tab of ALL_PLATFORM_TABS) {
          if (isDisposed) return;
          const tabFolders = currentFolders[tab];
          if (!tabFolders || !Array.isArray(tabFolders) || tabFolders.length === 0) continue;

          // Check if this tab has any legacy media
          const rawTabJson = JSON.stringify(tabFolders);
          if (!rawTabJson.includes('data:image/') && !rawTabJson.includes('au-local-media://')) {
            continue;
          }

          const { data: migratedFolders, hasChanged } = await deepMigrateAndReplaceMedia(
            tabFolders,
            uid,
            migrationCache
          );

          if (hasChanged && !isDisposed) {
            anyTabChanged = true;
            updatedModuleFolders[tab] = migratedFolders;

            // Persist migrated folder to localStorage
            try {
              localStorage.setItem(
                getModuleFoldersKey(userAccountKey, tab),
                JSON.stringify(migratedFolders)
              );
            } catch (err) {
              console.warn('[AutoMigrator] localStorage update notice for tab', tab, err);
            }

            // If this tab has an active folder, sync form state
            const activeFolderId = activeFolderIdsRef.current?.[tab] || migratedFolders[0]?.id;
            const activeFolder = migratedFolders.find((f: AUFolder) => f.id === activeFolderId) || migratedFolders[0];
            if (activeFolder && activeFolder.data) {
              loadTabFormData(tab, activeFolder.data);
            }
          }
        }

        if (anyTabChanged && !isDisposed) {
          hasRunMigrationRef.current = uid;
          setModuleFolders(updatedModuleFolders);
          moduleFoldersRef.current = updatedModuleFolders;

          // Commit to cloud so other devices (e.g., mobile) get the R2 references immediately
          void forceCloudWorkspaceSyncNowRef.current?.();
          console.log('[AutoMigrator] Successfully uplinked legacy media to Cloudflare R2 and synced to cloud.');
        } else {
          hasRunMigrationRef.current = uid;
        }
      } catch (err) {
        console.warn('[AutoMigrator] Background auto-migration notice:', err);
      }
    };

    // Run slightly delayed to avoid competing with initial UI render
    const timer = setTimeout(() => {
      void performAutoMigration();
    }, 1500);

    return () => {
      isDisposed = true;
      clearTimeout(timer);
    };
  }, [
    authUser?.uid,
    isHydrated,
    userAccountKey,
    loadTabFormData,
    setModuleFolders,
    forceCloudWorkspaceSyncNowRef,
  ]);
}
