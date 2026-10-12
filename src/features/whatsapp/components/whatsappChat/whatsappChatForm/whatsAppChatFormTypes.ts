import type { WhatsAppChatData, WhatsAppChatMessage } from '../../../../../types';
export interface ChatSectionProps {
  data: WhatsAppChatData;
  onChange: (updated: WhatsAppChatData) => void;
}

export interface ChatMessageEditorProps extends ChatSectionProps {
  msg: WhatsAppChatMessage;
  index: number;
  handleUpdateMessage: (index: number, fields: Partial<WhatsAppChatMessage>) => void;
  handleRemoveMessage: (index: number) => void;
  handleMoveMessage: (index: number, direction: 'up' | 'down') => void;
}
