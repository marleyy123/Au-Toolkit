import React, { useState } from 'react';
import { WhatsAppChatData, WhatsAppChatMessage } from '../../../../../types';
import { Plus, Smile, Image as ImageIcon, Phone, Video, Calendar, Mail, ShieldAlert, Contact } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';
import { Mic } from 'lucide-react';
import { voiceNoteDefaults } from '../../../voiceNote';
import { isWhatsAppMessageDivider, resolveWhatsAppGroupSenders } from '../../../messageSenders';
import type { ChatSectionProps } from './whatsAppChatFormTypes';
import { WhatsAppChatDateDividerEditor } from './WhatsAppChatDateDividerEditor';
import { WhatsAppChatUnreadDividerEditor } from './WhatsAppChatUnreadDividerEditor';
import { WhatsAppChatSystemMessageEditor } from './WhatsAppChatSystemMessageEditor';
import { WhatsAppChatMessageEditor } from './WhatsAppChatMessageEditor';
import { SAMPLE_STICKERS } from './whatsAppChatFormConstants';
export const WhatsAppChatMessagesEditor: React.FC<ChatSectionProps> = ({ data, onChange }) => {
  const { isId } = useLanguage();
  const [openSenderNameIds, setOpenSenderNameIds] = useState<Record<string, boolean>>({});
  const [openReplyBoxIds, setOpenReplyBoxIds] = useState<Record<string, boolean>>({});
  const updateField = <K extends keyof WhatsAppChatData>(key: K, value: WhatsAppChatData[K]) => {
    onChange({ ...data, [key]: value });
  };
  const [activeActionBtn, setActiveActionBtn] = useState<'date_divider' | 'unread_divider' | null>(null);
  // Add Message
  const handleAddMessage = (sender: 'incoming' | 'outgoing', type: 'text' | 'image' | 'sticker' | 'voice_note' | 'contact' = 'text') => {
    const lastMessage = data.isGroupChat ? resolveWhatsAppGroupSenders(data.messages || []).at(-1) : undefined;
    const previous = lastMessage && !isWhatsAppMessageDivider(lastMessage) ? lastMessage : undefined;
    const newMessage: WhatsAppChatMessage = {
      id: 'wa-msg-' + Date.now(),
      sender,
      type,
      ...(type === 'voice_note' ? voiceNoteDefaults() : {}),
      text: type === 'text' ? '' : '',
      imageUrl: '',
      imageUrls: type === 'image' ? [''] : [],
      stickerUrl: type === 'sticker' ? SAMPLE_STICKERS[0].url : '',
      time: '',
      isRead: true,
      senderName: sender === 'incoming' && previous?.sender === 'incoming' ? previous.senderName : undefined,
      senderColor: sender === 'incoming' && previous?.sender === 'incoming' ? previous.senderColor : undefined,
    };
    updateField('messages', [...(data.messages || []), newMessage]);
  };

  // Update Message
  const handleUpdateMessage = (index: number, updatedField: Partial<WhatsAppChatMessage>) => {
    const updatedMsgs = [...(data.messages || [])];
    updatedMsgs[index] = { ...updatedMsgs[index], ...updatedField };
    updateField('messages', updatedMsgs);
  };

  // Delete Message
  const handleRemoveMessage = (index: number) => {
    const updatedMsgs = (data.messages || []).filter((_, i) => i !== index);
    updateField('messages', updatedMsgs);
  };

  // Reorder Messages
  const handleMoveMessage = (index: number, direction: 'up' | 'down') => {
    const messages = [...(data.messages || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= messages.length) return;
    const temp = messages[index];
    messages[index] = messages[targetIndex];
    messages[targetIndex] = temp;
    updateField('messages', messages);
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleAddMessage('incoming', 'text')}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:bg-purple-600 active:text-white text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 border border-slate-200 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isId ? 'Kamu (Kiri)' : 'You (Left)'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddMessage('outgoing', 'text')}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:bg-purple-600 active:text-white text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 border border-slate-200 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isId ? 'Aku (Kanan)' : 'Me (Right)'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddMessage('incoming', 'image')}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:bg-purple-600 active:text-white text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 border border-slate-200 shadow-2xs cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
            <span>{isId ? 'Foto (Kiri)' : 'Photo (Left)'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddMessage('outgoing', 'image')}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:bg-purple-600 active:text-white text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 border border-slate-200 shadow-2xs cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isId ? 'Foto (Kanan)' : 'Photo (Right)'}</span>
          </button>
          {(['incoming', 'outgoing'] as const).map(sender => (
            <button key={`contact-${sender}`} type="button" onClick={() => handleAddMessage(sender, 'contact')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:bg-purple-600 active:text-white text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 border border-slate-200 shadow-2xs cursor-pointer">
              <Contact className="w-3.5 h-3.5 text-blue-500" />
              <span>{isId ? `Kontak (${sender === 'incoming' ? 'Kiri' : 'Kanan'})` : `Contact (${sender === 'incoming' ? 'Left' : 'Right'})`}</span>
            </button>
          ))}
          {(['incoming', 'outgoing'] as const).map(sender => (
            <button key={`vn-${sender}`} type="button" onClick={() => handleAddMessage(sender, 'voice_note')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:bg-purple-600 active:text-white text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 border border-slate-200 shadow-2xs cursor-pointer">
              <Mic className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isId ? `VN (${sender === 'incoming' ? 'Kiri' : 'Kanan'})` : `Voice Note (${sender === 'incoming' ? 'Left' : 'Right'})`}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const newMessage: WhatsAppChatMessage = {
                id: 'wa-sys-' + Date.now(),
                sender: 'system',
                type: 'system',
                text: 'You blocked this contact.',
                systemAction: 'blocked',
                systemGap: 12,
                time: '',
              };
              updateField('messages', [...(data.messages || []), newMessage]);
            }}
            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-purple-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 shadow-xs cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isId ? 'Pesan Sistem (Blocked)' : 'System Notice'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddMessage('incoming', 'sticker')}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:bg-purple-600 active:text-white text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 border border-slate-200 shadow-2xs cursor-pointer"
          >
            <Smile className="w-3.5 h-3.5" />
            <span>{isId ? 'Stiker' : 'Sticker'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveActionBtn('date_divider');
              setTimeout(() => setActiveActionBtn(null), 1200);
              const newMessage: WhatsAppChatMessage = {
                id: 'wa-date-' + Date.now(),
                sender: 'system',
                type: 'date_divider',
                text: isId ? 'Hari ini' : 'Today',
                time: '',
              };
              updateField('messages', [...(data.messages || []), newMessage]);
            }}
            className={`px-2.5 py-1.5 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1 shadow-xs cursor-pointer active:scale-95 ${activeActionBtn === 'date_divider'
              ? 'bg-purple-600 ring-2 ring-purple-400 shadow-purple-200 dark:shadow-purple-950'
              : 'bg-emerald-600 hover:bg-emerald-700 active:bg-purple-600'
              }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isId ? 'Pemisah Tanggal' : 'Date Divider'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveActionBtn('unread_divider');
              setTimeout(() => setActiveActionBtn(null), 1200);
              const newMessage: WhatsAppChatMessage = {
                id: 'wa-unread-' + Date.now(),
                sender: 'system',
                type: 'unread_divider',
                text: isId ? '1 PESAN BELUM DIBACA' : '1 UNREAD MESSAGE',
                unreadDividerStyle: data.unreadDividerStyle || 'banner',
                unreadDividerGap: data.unreadDividerGap ?? 14,
                unreadDividerPadding: data.unreadDividerPadding ?? 4.5,
                time: '',
              };
              updateField('messages', [...(data.messages || []), newMessage]);
            }}
            className={`px-2.5 py-1.5 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1 shadow-xs cursor-pointer active:scale-95 ${activeActionBtn === 'unread_divider'
              ? 'bg-purple-600 ring-2 ring-purple-400 shadow-purple-200 dark:shadow-purple-950'
              : 'bg-emerald-600 hover:bg-emerald-700 active:bg-purple-600'
              }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{isId ? 'Pesan Belum Dibaca' : 'Unread Divider'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const newMessage: WhatsAppChatMessage = {
                id: 'wa-msg-' + Date.now(),
                sender: 'incoming',
                type: 'missed_voice_call',
                text: isId ? 'Panggilan suara tak terjawab' : 'Missed voice call',
                time: '',
                senderName: data.isGroupChat ? 'Siti' : undefined,
                senderColor: '#E542A3',
              };
              updateField('messages', [...(data.messages || []), newMessage]);
            }}
            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 shadow-xs cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{isId ? 'Panggilan Suara' : 'Missed Voice'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const newMessage: WhatsAppChatMessage = {
                id: 'wa-msg-' + Date.now(),
                sender: 'incoming',
                type: 'missed_video_call',
                text: isId ? 'Panggilan video tak terjawab' : 'Missed video call',
                time: '',
                senderName: data.isGroupChat ? 'Budi' : undefined,
                senderColor: '#2196F3',
              };
              updateField('messages', [...(data.messages || []), newMessage]);
            }}
            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 shadow-xs cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span>{isId ? 'Panggilan Video' : 'Missed Video'}</span>
          </button>
        </div>
      </div>

      {/* Message Items List */}
      <div className="space-y-3">
        {(data.messages || []).length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-xs font-medium">
            No messages added yet. Click the buttons above to add text, photo, sticker, date divider, or missed call blocks.
          </div>
        ) : (
          data.messages.map((msg, index) => {
            const msgType = msg.type || (msg.stickerUrl ? 'sticker' : msg.imageUrl ? 'image' : 'text');
            const Editor = msgType === 'date_divider' ? WhatsAppChatDateDividerEditor
              : msgType === 'unread_divider' ? WhatsAppChatUnreadDividerEditor
                : msgType === 'system' ? WhatsAppChatSystemMessageEditor
                  : WhatsAppChatMessageEditor;
            const editorProps = {
              data, onChange, msg, index,
              openSenderNameIds, setOpenSenderNameIds, openReplyBoxIds, setOpenReplyBoxIds,
              handleUpdateMessage, handleRemoveMessage, handleMoveMessage,
            };
            return <Editor key={msg.id} {...editorProps} />;
          })
        )}
      </div>
    </div>
  );
};
