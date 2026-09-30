import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { AUFolder, CharacterPreset, PlatformTab } from '../../../types';
import {
  deleteFolderFromFirestore,
  syncFolderToFirestore,
} from '../../../firebase';
import {
  getFormStorageKey,
  getInitialTabData,
  getModuleActiveFolderKey,
  getModuleFolderItemKey,
  getModuleFoldersKey,
  markLocalWorkspaceUpdated,
} from '../workspaceStorage';

type UseWorkspaceFoldersArgs = {
  activeTab: PlatformTab;
  userAccountKey: string;
  authUserUid?: string;
  moduleFolders: Record<string, AUFolder[]>;
  activeFolderIds: Record<string, string>;
  moduleFoldersRef: MutableRefObject<Record<string, AUFolder[]>>;
  activeFolderIdsRef: MutableRefObject<Record<string, string>>;
  hasLocalUserEditsInSessionRef: MutableRefObject<boolean>;
  setModuleFolders: Dispatch<SetStateAction<Record<string, AUFolder[]>>>;
  setActiveFolderIds: Dispatch<SetStateAction<Record<string, string>>>;
  getCurrentTabFormData: (tab: PlatformTab) => any;
  loadTabFormData: (tab: PlatformTab, data: any) => void;
  triggerCloudWorkspaceSync: () => void;
  forceCloudWorkspaceSyncNow: () => Promise<void>;
};

export function useWorkspaceFolders({
  activeTab,
  userAccountKey,
  authUserUid,
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
}: UseWorkspaceFoldersArgs) {
  const updateActiveFolderData = (tab: PlatformTab, updated: any) => {
    hasLocalUserEditsInSessionRef.current = true;
    const activeFolderId =
      activeFolderIdsRef.current[tab] ||
      activeFolderIds[tab] ||
      moduleFoldersRef.current[tab]?.[0]?.id ||
      'folder-1';
    const clonedUpdated = JSON.parse(JSON.stringify(updated));

    try {
      localStorage.setItem(getFormStorageKey(userAccountKey, tab), JSON.stringify(clonedUpdated));
      const currentList = moduleFoldersRef.current[tab] || moduleFolders[tab] || [{ id: 'folder-1', name: 'Folder 1', data: clonedUpdated }];
      const targetId = currentList.some((f) => f.id === activeFolderId) ? activeFolderId : currentList[0]?.id || 'folder-1';
      const updatedAt = new Date().toISOString();
      const nextList = currentList.map((folder) =>
        folder.id === targetId ? { ...folder, data: clonedUpdated, updatedAt } : folder
      );
      moduleFoldersRef.current[tab] = nextList;
      localStorage.setItem(getModuleFoldersKey(userAccountKey, tab), JSON.stringify(nextList));
      const targetFolder = nextList.find((f) => f.id === targetId);
      if (targetFolder) {
        localStorage.setItem(getModuleFolderItemKey(userAccountKey, tab, targetId), JSON.stringify(targetFolder));
      }
      markLocalWorkspaceUpdated(userAccountKey);
    } catch (e) {
      console.warn('[Auto-Save] Synchronous localStorage write warning:', e);
    }

    setModuleFolders((prev) => {
      const currentList = prev[tab] || [{ id: 'folder-1', name: 'Folder 1', data: clonedUpdated }];
      const targetId = currentList.some((f) => f.id === activeFolderId) ? activeFolderId : currentList[0].id;
      const updatedAt = new Date().toISOString();
      const nextList = currentList.map((folder) =>
        folder.id === targetId ? { ...folder, data: clonedUpdated, updatedAt } : folder
      );
      return { ...prev, [tab]: nextList };
    });
    triggerCloudWorkspaceSync();
  };

  const handleAddCharacterSlot = async () => {
    hasLocalUserEditsInSessionRef.current = true;
    const currentTab = activeTab;
    const currentActiveId =
      activeFolderIdsRef.current[currentTab] ||
      activeFolderIds[currentTab] ||
      moduleFoldersRef.current[currentTab]?.[0]?.id ||
      'folder-1';

    const currentFormData = getCurrentTabFormData(currentTab);
    const clonedCurrentData = currentFormData ? JSON.parse(JSON.stringify(currentFormData)) : getInitialTabData(currentTab);
    const existingList = (moduleFoldersRef.current && moduleFoldersRef.current[currentTab] && moduleFoldersRef.current[currentTab].length > 0)
      ? moduleFoldersRef.current[currentTab]
      : (moduleFolders[currentTab] || [
          { id: 'folder-1', name: 'Folder 1', data: clonedCurrentData, order: 1 },
        ]);

    const updatedExistingList = existingList.map((f, idx) =>
      f.id === currentActiveId ? { ...f, data: clonedCurrentData, order: typeof f.order === 'number' ? f.order : idx + 1 } : f
    );

    let maxIdx = 0;
    updatedExistingList.forEach((f, idx) => {
      const match = f.name?.match(/Folder\s*(\d+)/i) || f.id?.match(/folder-(\d+)/i);
      const num = match ? parseInt(match[1], 10) : (typeof f.order === 'number' ? f.order : idx + 1);
      if (num > maxIdx) maxIdx = num;
    });
    const nextIdx = Math.max(updatedExistingList.length + 1, maxIdx + 1);
    const newFolderId = `folder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newFolderName = `Folder ${nextIdx}`;
    const initialData = getInitialTabData(currentTab);
    const cleanFreshData = JSON.parse(JSON.stringify(initialData));
    const newFolder: AUFolder = {
      id: newFolderId,
      name: newFolderName,
      data: cleanFreshData,
      order: nextIdx,
      updatedAt: new Date().toISOString(),
    };

    const nextList = [...updatedExistingList, newFolder];
    activeFolderIdsRef.current[currentTab] = newFolderId;
    moduleFoldersRef.current[currentTab] = nextList;

    setModuleFolders((prev) => {
      try {
        localStorage.setItem(getModuleFoldersKey(userAccountKey, currentTab), JSON.stringify(nextList));
        localStorage.setItem(getModuleFolderItemKey(userAccountKey, currentTab, newFolderId), JSON.stringify(newFolder));
      } catch {}
      return { ...prev, [currentTab]: nextList };
    });

    setActiveFolderIds((prev) => {
      try {
        localStorage.setItem(getModuleActiveFolderKey(userAccountKey, currentTab), newFolderId);
        localStorage.setItem(getFormStorageKey(userAccountKey, currentTab), JSON.stringify(cleanFreshData));
      } catch {}
      return { ...prev, [currentTab]: newFolderId };
    });

    loadTabFormData(currentTab, cleanFreshData);
    try {
      markLocalWorkspaceUpdated(userAccountKey);
    } catch {}

    if (authUserUid) {
      await syncFolderToFirestore(newFolderId, newFolder, authUserUid, currentTab).catch(() => {});
    }

    await forceCloudWorkspaceSyncNow();
  };

  const handleSelectCharacter = (char: CharacterPreset | AUFolder) => {
    hasLocalUserEditsInSessionRef.current = true;
    const currentTab = activeTab;
    const targetId = char.id;
    const currentActiveId =
      activeFolderIdsRef.current[currentTab] ||
      activeFolderIds[currentTab] ||
      moduleFoldersRef.current[currentTab]?.[0]?.id ||
      'folder-1';
    if (currentActiveId === targetId) return;

    const currentFormData = getCurrentTabFormData(currentTab);
    const clonedCurrentData = currentFormData ? JSON.parse(JSON.stringify(currentFormData)) : null;
    const currentList = moduleFolders[currentTab] || [];
    const updatedList = clonedCurrentData
      ? currentList.map((f) => (f.id === currentActiveId ? { ...f, data: clonedCurrentData } : f))
      : currentList;

    const targetFolder = updatedList.find((f) => f.id === targetId);
    if (!targetFolder) return;

    activeFolderIdsRef.current[currentTab] = targetId;
    moduleFoldersRef.current[currentTab] = updatedList;

    try {
      localStorage.setItem(getModuleFoldersKey(userAccountKey, currentTab), JSON.stringify(updatedList));
      localStorage.setItem(getModuleActiveFolderKey(userAccountKey, currentTab), targetId);
      localStorage.setItem(getFormStorageKey(userAccountKey, currentTab), JSON.stringify(targetFolder.data));
      if (clonedCurrentData) {
        localStorage.setItem(getModuleFolderItemKey(userAccountKey, currentTab, currentActiveId), JSON.stringify({ id: currentActiveId, name: targetFolder.name || 'Folder', data: clonedCurrentData }));
      }
      localStorage.setItem(getModuleFolderItemKey(userAccountKey, currentTab, targetId), JSON.stringify(targetFolder));
      markLocalWorkspaceUpdated(userAccountKey);
    } catch {}

    setModuleFolders((prev) => ({ ...prev, [currentTab]: updatedList }));
    setActiveFolderIds((prev) => ({ ...prev, [currentTab]: targetId }));
    loadTabFormData(currentTab, JSON.parse(JSON.stringify(targetFolder.data)));
    triggerCloudWorkspaceSync();
  };

  const handleSaveActiveProfile = () => {
    const currentFormData = getCurrentTabFormData(activeTab);
    if (currentFormData) {
      updateActiveFolderData(activeTab, currentFormData);
    }
  };

  const handleDeleteCharacter = async (charId: string) => {
    hasLocalUserEditsInSessionRef.current = true;
    const currentTab = activeTab;
    const currentList = (moduleFoldersRef.current && moduleFoldersRef.current[currentTab]) || moduleFolders[currentTab] || [];
    if (currentList.length <= 1 || charId === 'folder-1' || currentList[0]?.id === charId) {
      return;
    }

    const targetIdx = currentList.findIndex((f) => f.id === charId);
    if (targetIdx <= 0) return;

    const filtered = currentList.filter((f) => f.id !== charId);
    const remainingFolders: AUFolder[] = filtered.map((f, idx) => ({
      ...f,
      order: idx + 1,
      updatedAt: new Date().toISOString(),
    }));

    const currentActiveId = activeFolderIdsRef.current[currentTab] || activeFolderIds[currentTab];
    let nextActiveId: string;
    if (currentActiveId === charId) {
      const fallbackIdx = Math.max(0, targetIdx - 1);
      nextActiveId = remainingFolders[fallbackIdx]?.id || remainingFolders[0].id;
    } else {
      const newActiveIdx = filtered.findIndex((f) => f.id === currentActiveId);
      nextActiveId = newActiveIdx !== -1 && remainingFolders[newActiveIdx] ? remainingFolders[newActiveIdx].id : remainingFolders[0].id;
    }

    activeFolderIdsRef.current[currentTab] = nextActiveId;
    moduleFoldersRef.current[currentTab] = remainingFolders;

    const activeFolder = remainingFolders.find((f) => f.id === nextActiveId) || remainingFolders[0];
    const clonedActiveData = JSON.parse(JSON.stringify(activeFolder.data));

    setModuleFolders((prev) => ({ ...prev, [currentTab]: remainingFolders }));
    setActiveFolderIds((prev) => ({ ...prev, [currentTab]: nextActiveId }));

    try {
      localStorage.setItem(getModuleFoldersKey(userAccountKey, currentTab), JSON.stringify(remainingFolders));
      localStorage.setItem(getModuleActiveFolderKey(userAccountKey, currentTab), nextActiveId);
      localStorage.setItem(getFormStorageKey(userAccountKey, currentTab), JSON.stringify(clonedActiveData));
      localStorage.removeItem(getModuleFolderItemKey(userAccountKey, currentTab, charId));
      remainingFolders.forEach((f) => {
        localStorage.setItem(getModuleFolderItemKey(userAccountKey, currentTab, f.id), JSON.stringify(f));
      });
      markLocalWorkspaceUpdated(userAccountKey);
    } catch {}

    loadTabFormData(currentTab, clonedActiveData);

    if (authUserUid) {
      await deleteFolderFromFirestore(charId, authUserUid, currentTab).catch(() => {});
    }

    await forceCloudWorkspaceSyncNow();
  };

  const handleRenameCharacter = async (charId: string, newName: string) => {
    hasLocalUserEditsInSessionRef.current = true;
    const currentTab = activeTab;
    const cleanName = newName.trim();
    if (!cleanName) return;

    const currentList = (moduleFoldersRef.current && moduleFoldersRef.current[currentTab]) || moduleFolders[currentTab] || [];
    const nextList = currentList.map((f) =>
      f.id === charId ? { ...f, name: cleanName, updatedAt: new Date().toISOString() } : f
    );

    activeFolderIdsRef.current[currentTab] = activeFolderIdsRef.current[currentTab] || charId;
    moduleFoldersRef.current[currentTab] = nextList;
    setModuleFolders((prev) => ({ ...prev, [currentTab]: nextList }));

    try {
      localStorage.setItem(getModuleFoldersKey(userAccountKey, currentTab), JSON.stringify(nextList));
      const target = nextList.find((f) => f.id === charId);
      if (target) {
        localStorage.setItem(getModuleFolderItemKey(userAccountKey, currentTab, charId), JSON.stringify(target));
      }
      markLocalWorkspaceUpdated(userAccountKey);
    } catch {}

    if (authUserUid) {
      const target = nextList.find((f) => f.id === charId);
      if (target) {
        await syncFolderToFirestore(charId, target, authUserUid, currentTab).catch(() => {});
      }
    }

    await forceCloudWorkspaceSyncNow();
  };

  return {
    updateActiveFolderData,
    handleAddCharacterSlot,
    handleSelectCharacter,
    handleSaveActiveProfile,
    handleDeleteCharacter,
    handleRenameCharacter,
  };
}
