import { Dispatch, SetStateAction, useCallback } from 'react';
import { TwitterPostData } from '../../../types';

interface UseTwitterFormHandlersArgs {
  setTwitterData: Dispatch<SetStateAction<TwitterPostData>>;
  updateActiveFolderData: (tab: 'twitter', updated: any) => void;
}

export const useTwitterFormHandlers = ({
  setTwitterData,
  updateActiveFolderData,
}: UseTwitterFormHandlersArgs) => {
  const handleTwitterDataChange = useCallback((updated: TwitterPostData) => {
    setTwitterData(updated);
    updateActiveFolderData('twitter', updated);
  }, [setTwitterData, updateActiveFolderData]);

  return {
    handleTwitterDataChange,
  };
};
