import { Dispatch, SetStateAction, useCallback } from 'react';
import { LineChatData } from '../../../types';

interface UseLineFormHandlersArgs {
  setLineChatData: Dispatch<SetStateAction<LineChatData>>;
  updateActiveFolderData: (tab: 'line-chat', updated: any) => void;
}

export const useLineFormHandlers = ({
  setLineChatData,
  updateActiveFolderData,
}: UseLineFormHandlersArgs) => {
  const handleLineChatDataChange = useCallback((updated: LineChatData) => {
    setLineChatData(updated);
    updateActiveFolderData('line-chat', updated);
  }, [setLineChatData, updateActiveFolderData]);

  const handleUpdateLineMessageText = useCallback((id: string, text: string) => {
    setLineChatData((prev) => {
      const updated = {
        ...prev,
        messages: (prev.messages || []).map((message) =>
          message.id === id ? { ...message, text } : message
        ),
      };
      updateActiveFolderData('line-chat', updated);
      return updated;
    });
  }, [setLineChatData, updateActiveFolderData]);

  return {
    handleLineChatDataChange,
    handleUpdateLineMessageText,
  };
};
