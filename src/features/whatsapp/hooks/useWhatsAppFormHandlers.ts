import { Dispatch, SetStateAction, useCallback } from 'react';
import { WhatsAppCallData, WhatsAppChatData, WhatsAppStatusData, WhatsAppViewersData } from '../../../types';

interface UseWhatsAppFormHandlersArgs {
  setWhatsAppChatData: Dispatch<SetStateAction<WhatsAppChatData>>;
  setWhatsAppCallData: Dispatch<SetStateAction<WhatsAppCallData>>;
  setWhatsAppStatusData: Dispatch<SetStateAction<WhatsAppStatusData>>;
  setWhatsAppViewersData: Dispatch<SetStateAction<WhatsAppViewersData>>;
  updateActiveFolderData: (
    tab: 'whatsapp-chat' | 'whatsapp-call' | 'whatsapp-status' | 'whatsapp-viewers',
    updated: any
  ) => void;
}

export const useWhatsAppFormHandlers = ({
  setWhatsAppChatData,
  setWhatsAppCallData,
  setWhatsAppStatusData,
  setWhatsAppViewersData,
  updateActiveFolderData,
}: UseWhatsAppFormHandlersArgs) => {
  const handleWhatsAppChatDataChange = useCallback((updated: WhatsAppChatData) => {
    setWhatsAppChatData(updated);
    updateActiveFolderData('whatsapp-chat', updated);
  }, [setWhatsAppChatData, updateActiveFolderData]);

  const handleWhatsAppCallDataChange = useCallback((updated: WhatsAppCallData) => {
    setWhatsAppCallData(updated);
    updateActiveFolderData('whatsapp-call', updated);
  }, [setWhatsAppCallData, updateActiveFolderData]);

  const handleWhatsAppStatusDataChange = useCallback((updated: WhatsAppStatusData) => {
    setWhatsAppStatusData(updated);
    updateActiveFolderData('whatsapp-status', updated);
  }, [setWhatsAppStatusData, updateActiveFolderData]);

  const handleWhatsAppViewersDataChange = useCallback((updated: WhatsAppViewersData) => {
    setWhatsAppViewersData(updated);
    updateActiveFolderData('whatsapp-viewers', updated);
  }, [setWhatsAppViewersData, updateActiveFolderData]);

  const handleUpdateWhatsAppMessageText = useCallback((id: string, newText: string) => {
    setWhatsAppChatData((prev) => {
      const updated = {
        ...prev,
        messages: (prev.messages || []).map((msg) =>
          msg.id === id ? { ...msg, text: newText } : msg
        ),
      };
      updateActiveFolderData('whatsapp-chat', updated);
      return updated;
    });
  }, [setWhatsAppChatData, updateActiveFolderData]);

  return {
    handleWhatsAppChatDataChange,
    handleWhatsAppCallDataChange,
    handleWhatsAppStatusDataChange,
    handleWhatsAppViewersDataChange,
    handleUpdateWhatsAppMessageText,
  };
};
