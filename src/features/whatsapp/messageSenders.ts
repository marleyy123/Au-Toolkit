import type { WhatsAppChatMessage } from '../../types';

export const isWhatsAppMessageDivider = (message: WhatsAppChatMessage): boolean =>
  message.sender === 'system' || ['system', 'divider', 'date_divider', 'unread_divider'].includes(message.type || '');

export function isSameWhatsAppSender(a: WhatsAppChatMessage, b: WhatsAppChatMessage): boolean {
  if (isWhatsAppMessageDivider(a) || isWhatsAppMessageDivider(b)) return false;
  const outgoingA = a.sender === 'outgoing' || a.sender === 'me';
  const outgoingB = b.sender === 'outgoing' || b.sender === 'me';
  return outgoingA === outgoingB && (outgoingA || (a.senderName?.trim() || '') === (b.senderName?.trim() || ''));
}

export function resolveWhatsAppGroupSenders(messages: WhatsAppChatMessage[]): WhatsAppChatMessage[] {
  const resolved: WhatsAppChatMessage[] = [];
  for (const message of messages) {
    const previous = resolved.at(-1);
    // An unnamed consecutive incoming bubble continues the previous participant.
    if (message.sender === 'incoming' && !message.senderName?.trim()
      && previous?.sender === 'incoming' && !isWhatsAppMessageDivider(previous)
      && !isWhatsAppMessageDivider(message)) {
      resolved.push({ ...message, senderName: previous.senderName, senderColor: message.senderColor || previous.senderColor });
    } else {
      resolved.push(message);
    }
  }
  return resolved;
}
