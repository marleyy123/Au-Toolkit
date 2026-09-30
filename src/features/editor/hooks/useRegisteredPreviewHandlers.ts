import { PlatformTab } from '../../../types';

interface UseRegisteredPreviewHandlersArgs {
  activeTab: PlatformTab;
  handleTwitterDataChange: (next: any) => void;
  handleInstagramDMDataChange: (next: any) => void;
  handleUpdateInstagramDMMessageText: (id: string, text: string) => void;
  handleWhatsAppChatDataChange: (next: any) => void;
  handleWhatsAppCallDataChange: (next: any) => void;
  handleWhatsAppStatusDataChange: (next: any) => void;
  handleWhatsAppViewersDataChange: (next: any) => void;
  handleUpdateWhatsAppMessageText: (id: string, text: string) => void;
  handleTikTokProfileDataChange: (next: any) => void;
  handleIosLockscreenDataChange: (next: any) => void;
  handleLineChatDataChange: (next: any) => void;
  handleUpdateLineMessageText: (id: string, text: string) => void;
  handleNotesDataChange: (next: any) => void;
  handlePushNotificationDataChange: (next: any) => void;
  handleSpotifyDataChange: (next: any) => void;
}

export function useRegisteredPreviewHandlers({
  activeTab,
  handleTwitterDataChange,
  handleInstagramDMDataChange,
  handleUpdateInstagramDMMessageText,
  handleWhatsAppChatDataChange,
  handleWhatsAppCallDataChange,
  handleWhatsAppStatusDataChange,
  handleWhatsAppViewersDataChange,
  handleUpdateWhatsAppMessageText,
  handleTikTokProfileDataChange,
  handleIosLockscreenDataChange,
  handleLineChatDataChange,
  handleUpdateLineMessageText,
  handleNotesDataChange,
  handlePushNotificationDataChange,
  handleSpotifyDataChange,
}: UseRegisteredPreviewHandlersArgs) {
  const handleRegisteredPreviewChange = (next: any) => {
    switch (activeTab) {
      case 'twitter': return handleTwitterDataChange(next);
      case 'instagram-dm': return handleInstagramDMDataChange(next);
      case 'whatsapp-chat': return handleWhatsAppChatDataChange(next);
      case 'whatsapp-call': return handleWhatsAppCallDataChange(next);
      case 'whatsapp-status': return handleWhatsAppStatusDataChange(next);
      case 'whatsapp-viewers': return handleWhatsAppViewersDataChange(next);
      case 'tiktok-profile': return handleTikTokProfileDataChange(next);
      case 'ios-lockscreen': return handleIosLockscreenDataChange(next);
      case 'line-chat': return handleLineChatDataChange(next);
      case 'notes': return handleNotesDataChange(next);
      case 'push-notification': return handlePushNotificationDataChange(next);
      case 'spotify-card': return handleSpotifyDataChange(next);
      default: return undefined;
    }
  };

  const handleRegisteredMessageText = (id: string, text: string) => {
    if (activeTab === 'instagram-dm') return handleUpdateInstagramDMMessageText(id, text);
    if (activeTab === 'whatsapp-chat') return handleUpdateWhatsAppMessageText(id, text);
    if (activeTab === 'line-chat') return handleUpdateLineMessageText(id, text);
  };

  return {
    handleRegisteredPreviewChange,
    handleRegisteredMessageText,
  };
}
