import type { InstagramDMMessage } from '../../../../../types';

export const hasNoteReply = (message: InstagramDMMessage) => Boolean(
  message.isNoteReply || message.noteText?.trim() || message.noteSongTitle?.trim() || message.noteArtistName?.trim(),
);

export const clearNoteReply: Partial<InstagramDMMessage> = {
  isNoteReply: false,
  noteText: '',
  noteSongTitle: '',
  noteArtistName: '',
  noteOwnerName: '',
  noteOwnerAvatar: '',
};
