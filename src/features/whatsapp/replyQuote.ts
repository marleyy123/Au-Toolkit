import type { WhatsAppChatMessage } from '../../types';

export function hasWhatsAppReplyQuote(message: WhatsAppChatMessage): boolean {
  return Boolean(message.showReplyQuote || message.replyType === 'status' || message.replyToSender?.trim() || message.replyToText?.trim());
}

export function clearedWhatsAppReplyQuote(): Partial<WhatsAppChatMessage> {
  return {
    replyType: 'message', replyToMessageId: '', replyToSender: '', replyToText: '',
    statusReplyName: '', statusReplyCaption: '', statusReplyImage: '', showMediaIndicator: false,
  };
}
