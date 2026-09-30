import { Dispatch, SetStateAction, useCallback } from 'react';
import { IOSLockscreenData, NotesData, PushNotificationData, SpotifyData } from '../../../types';

interface UseMiscFormHandlersArgs {
  setIosLockscreenData: Dispatch<SetStateAction<IOSLockscreenData>>;
  setNotesData: Dispatch<SetStateAction<NotesData>>;
  setPushNotificationData: Dispatch<SetStateAction<PushNotificationData>>;
  setSpotifyData: Dispatch<SetStateAction<SpotifyData>>;
  updateActiveFolderData: (
    tab: 'ios-lockscreen' | 'notes' | 'push-notification' | 'spotify-card',
    updated: any
  ) => void;
}

export function useMiscFormHandlers({
  setIosLockscreenData,
  setNotesData,
  setPushNotificationData,
  setSpotifyData,
  updateActiveFolderData,
}: UseMiscFormHandlersArgs) {
  const handleIosLockscreenDataChange = useCallback((updated: IOSLockscreenData) => {
    setIosLockscreenData(updated);
    updateActiveFolderData('ios-lockscreen', updated);
  }, [setIosLockscreenData, updateActiveFolderData]);

  const handleNotesDataChange = useCallback((updated: NotesData) => {
    setNotesData(updated);
    updateActiveFolderData('notes', updated);
  }, [setNotesData, updateActiveFolderData]);

  const handlePushNotificationDataChange = useCallback((updated: PushNotificationData) => {
    setPushNotificationData(updated);
    updateActiveFolderData('push-notification', updated);
  }, [setPushNotificationData, updateActiveFolderData]);

  const handleSpotifyDataChange = useCallback((updated: SpotifyData) => {
    setSpotifyData(updated);
    updateActiveFolderData('spotify-card', updated);
  }, [setSpotifyData, updateActiveFolderData]);

  return {
    handleIosLockscreenDataChange,
    handleNotesDataChange,
    handlePushNotificationDataChange,
    handleSpotifyDataChange,
  };
}
