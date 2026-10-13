import { Select } from '../../../../../components/ui/Select';
import React from 'react';
import { ImageUploader } from '../../../../../components/FormControls';
import { toHexForPicker } from '../../../../../utils/colorUtils';
import { Plus, Trash2, ArrowUp, ArrowDown, Check, CheckCheck, Smile, Image as ImageIcon, MessageSquare, Phone, Video, Ban, Contact } from 'lucide-react';
import { useTheme } from '../../../../../context/ThemeContext';
import { useLanguage } from '../../../../../context/LanguageContext';
import { Mic } from 'lucide-react';
import { voiceNoteDefaults } from '../../../voiceNote';
import { WhatsAppVoiceNoteControls } from './WhatsAppVoiceNoteControls';
import type { ChatMessageEditorProps } from './whatsAppChatFormTypes';
import { WhatsAppChatReplyQuoteEditor } from './WhatsAppChatReplyQuoteEditor';
import { SAMPLE_STICKERS } from './whatsAppChatFormConstants';
import { WhatsAppContactControls } from './WhatsAppContactControls';
import { hasWhatsAppReplyQuote, clearedWhatsAppReplyQuote } from '../../../replyQuote';

interface Props extends ChatMessageEditorProps {
  openSenderNameIds: Record<string, boolean>;
  setOpenSenderNameIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  openReplyBoxIds: Record<string, boolean>;
  setOpenReplyBoxIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const WhatsAppChatMessageEditor: React.FC<Props> = ({ data, onChange, msg, index, handleUpdateMessage, handleRemoveMessage, handleMoveMessage, openSenderNameIds, setOpenSenderNameIds, openReplyBoxIds, setOpenReplyBoxIds }) => {
  const { isDark: isEditorDark } = useTheme();
  const { isId } = useLanguage();
  const isOutgoing = msg.sender === 'outgoing' || msg.sender === 'me';
  const msgType = msg.type || (msg.stickerUrl ? 'sticker' : msg.imageUrl ? 'image' : 'text');
  const isDarkTheme = isEditorDark;
  const messageInputClass = isEditorDark
    ? 'w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors'
    : 'w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors';
  const singleLineInputClass = isEditorDark
    ? 'w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors'
    : 'w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors';
  const cardClass = isEditorDark
    ? (isOutgoing ? 'bg-purple-950/40 border-purple-900/60 text-slate-100' : 'bg-slate-900/90 border-slate-800 text-slate-100')
    : (isOutgoing ? 'bg-white border-purple-200/90 text-slate-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-900 shadow-2xs');
  const innerBoxClass = isEditorDark
    ? 'bg-slate-800/80 border-slate-700'
    : 'bg-slate-50/90 border-slate-200/80';
  const labelColorClass = isEditorDark ? 'text-slate-300' : 'text-slate-700';
  const hasSenderName = Boolean(msg.senderName?.trim());
  const isSenderNameChecked = openSenderNameIds[msg.id] ?? hasSenderName;
  const hasReplyQuote = hasWhatsAppReplyQuote(msg);
  const isReplyQuoteChecked = openReplyBoxIds[msg.id] ?? hasReplyQuote;

  return (
    <div
      key={msg.id}
      data-sync-theme={isDarkTheme ? 'dark' : 'light'}
      className={`p-3.5 rounded-xl border transition-all ${cardClass}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md shrink-0 bg-purple-600 text-white">
            #{index + 1} {isOutgoing ? (isId ? 'AKU (KANAN)' : 'ME (RIGHT)') : (isId ? 'KAMU (KIRI)' : 'YOU (LEFT)')}
          </span>

          {/* Sender Toggle Buttons */}
          <div className="inline-flex border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-white dark:bg-slate-800 text-[10px] font-bold shrink-0">
            <button
              type="button"
              onClick={() => handleUpdateMessage(index, { sender: 'incoming' })}
              className={`px-2.5 py-1 cursor-pointer transition-colors ${!isOutgoing ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
              {isId ? 'KAMU (KIRI)' : 'YOU (LEFT)'}
            </button>
            <button
              type="button"
              onClick={() => handleUpdateMessage(index, { sender: 'outgoing' })}
              className={`px-2.5 py-1 cursor-pointer transition-colors ${isOutgoing ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
              {isId ? 'AKU (KANAN)' : 'ME (RIGHT)'}
            </button>
          </div>

          {/* Message type selector */}
          <div className="flex flex-wrap border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-white dark:bg-slate-800 text-[10px] font-bold">
            <button type="button" onClick={() => handleUpdateMessage(index, { type: 'contact', isRecalled: false, status: isOutgoing ? 'read' : undefined })}
              className={`px-2 py-1 flex items-center space-x-1 cursor-pointer transition-colors ${msgType === 'contact' ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
              <Contact className="w-3 h-3" /><span>{isId ? 'Kontak' : 'Contact'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleUpdateMessage(index, { type: 'text' })}
              className={`px-2 py-1 flex items-center space-x-1 cursor-pointer transition-colors ${msgType === 'text' ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>{isId ? 'Teks' : 'Text'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleUpdateMessage(index, { type: 'image' })}
              className={`px-2 py-1 flex items-center space-x-1 cursor-pointer transition-colors ${msgType === 'image' ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>{isId ? 'Foto' : 'Photo'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleUpdateMessage(index, { type: 'sticker' })}
              className={`px-2 py-1 flex items-center space-x-1 cursor-pointer transition-colors ${msgType === 'sticker' ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
              <Smile className="w-3 h-3" />
              <span>{isId ? 'Stiker' : 'Sticker'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleUpdateMessage(index, { ...voiceNoteDefaults(), ...msg, type: 'voice_note', isRecalled: false, status: isOutgoing ? 'read' : undefined })}
              className={`px-2 py-1 flex items-center space-x-1 cursor-pointer transition-colors ${msgType === 'voice_note' ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
              <Mic className="w-3 h-3" />
              <span>VN</span>
            </button>
            <button
              type="button"
              onClick={() => handleUpdateMessage(index, { type: 'missed_voice_call' })}
              className={`px-2 py-1 flex items-center space-x-1 cursor-pointer transition-colors ${msgType === 'missed_voice_call' ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
              <Phone className="w-3 h-3" />
              <span>{isId ? 'Suara' : 'Missed Voice'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleUpdateMessage(index, { type: 'missed_video_call' })}
              className={`px-2 py-1 flex items-center space-x-1 cursor-pointer transition-colors ${msgType === 'missed_video_call' ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
              <Video className="w-3 h-3" />
              <span>{isId ? 'Video' : 'Missed Video'}</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 shrink-0 ml-auto bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => handleMoveMessage(index, 'up')}
            disabled={index === 0}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-30 cursor-pointer rounded transition-colors"
            title={isId ? 'Pindah ke Atas' : 'Move Up'}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleMoveMessage(index, 'down')}
            disabled={index === data.messages.length - 1}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-30 cursor-pointer rounded transition-colors"
            title={isId ? 'Pindah ke Bawah' : 'Move Down'}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              const isNowRecalled = !(msg.isRecalled || msg.status === 'recalled' || msg.type === 'recalled');
              handleUpdateMessage(index, {
                isRecalled: isNowRecalled,
                status: isNowRecalled ? 'recalled' : (isOutgoing ? 'read' : undefined),
                type: msg.type === 'voice_note' || msg.type === 'contact' ? msg.type : isNowRecalled ? 'recalled' : (msg.imageUrl ? 'image' : 'text'),
                isVoicePlaying: false,
              });
            }}
            className={`p-1.5 cursor-pointer rounded transition-colors ${(msg.isRecalled || msg.status === 'recalled' || msg.type === 'recalled')
              ? 'text-rose-600 bg-rose-100 dark:bg-rose-950/60 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            title={
              (msg.isRecalled || msg.status === 'recalled' || msg.type === 'recalled')
                ? (isId ? 'Batalkan Tarik Pesan' : 'Restore Message')
                : (isId ? 'Tarik Pesan (Pesan Dihapus / Recall)' : 'Recall / Delete Message')
            }
          >
            <Ban className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRemoveMessage(index);
            }}
            className="p-1.5 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer rounded transition-colors"
            title={isId ? 'Hapus Pesan' : 'Delete Message'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Message Field Inputs according to type */}
      <div className="space-y-2.5 pt-1">
        {msgType === 'contact' && <WhatsAppContactControls message={msg} onChange={patch => handleUpdateMessage(index, patch)} />}
        <div className="flex flex-wrap items-center gap-3 pb-0.5">
          {(!isOutgoing || data.isGroupChat) && (
            <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSenderNameChecked}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setOpenSenderNameIds((prev) => ({ ...prev, [msg.id]: checked }));
                  handleUpdateMessage(index, { showSenderName: checked });
                }}
                className="rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer w-3.5 h-3.5"
              />
              <Plus className="w-3 h-3 -mr-0.5" />
              <span>Sender Name</span>
            </label>
          )}
          <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isReplyQuoteChecked}
              onChange={(e) => {
                const checked = e.target.checked;
                setOpenReplyBoxIds((prev) => ({ ...prev, [msg.id]: checked }));
                handleUpdateMessage(index, checked
                  ? { showReplyQuote: true }
                  : { ...clearedWhatsAppReplyQuote(), showReplyQuote: false });
              }}
              className="rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer w-3.5 h-3.5"
            />
            <Plus className="w-3 h-3 -mr-0.5" />
            <span>Reply Quote Box</span>
          </label>
        </div>

        {/* SENDER NAME & COLOR (Only visible when enabled) */}
        {(!isOutgoing || data.isGroupChat) && isSenderNameChecked && (
          <div className={`p-2.5 rounded-lg border space-y-2 ${innerBoxClass}`}>
            <label className={`text-[11px] font-semibold block ${labelColorClass}`}>
              {isId ? 'Tampilan Nama Pengirim' : 'Sender Name Display'}
              <Select
                value={msg.showSenderName === undefined ? 'auto' : msg.showSenderName ? 'always' : 'hidden'}
                onValueChange={(value) => handleUpdateMessage(index, {
                  showSenderName: value === 'auto' ? undefined : value === 'always',
                })}
                className={`${singleLineInputClass} mt-1`}
              >
                <option value="auto">{isId ? 'Otomatis' : 'Automatic'}</option>
                <option value="always">{isId ? 'Selalu tampil' : 'Always show'}</option>
                <option value="hidden">{isId ? 'Sembunyikan' : 'Hide'}</option>
              </Select>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className={`text-[11px] font-semibold block mb-0.5 ${labelColorClass}`}>
                  Sender Name (Nama Pengirim)
                </label>
                <input
                  type="text"
                  value={msg.senderName || ''}
                  onChange={(e) => handleUpdateMessage(index, { senderName: e.target.value })}
                  placeholder="e.g. Siti / Budi"
                  className={singleLineInputClass}
                />
              </div>

              <div>
                <label className={`text-[11px] font-semibold block mb-0.5 ${labelColorClass}`}>
                  Sender Name Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={toHexForPicker(msg.senderColor, '#e542a3')}
                    onChange={(e) => handleUpdateMessage(index, { senderColor: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer border border-slate-300 p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={msg.senderColor ?? ''}
                    placeholder="#e542a3"
                    onChange={(e) => handleUpdateMessage(index, { senderColor: e.target.value })}
                    className={`w-24 ${singleLineInputClass} font-mono`}
                  />
                </div>
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <span className={`text-[10px] font-bold block mb-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                Preset Warna Member WA Group:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Pink', hex: '#e542a3' },
                  { name: 'Blue', hex: '#2196f3' },
                  { name: 'Teal', hex: '#26a69a' },
                  { name: 'Orange', hex: '#ff9800' },
                  { name: 'Purple', hex: '#ab47bc' },
                  { name: 'Green', hex: '#4caf50' },
                  { name: 'Deep Orange', hex: '#ff5722' },
                  { name: 'Cyan', hex: '#00bcd4' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handleUpdateMessage(index, { senderColor: c.hex })}
                    style={{ backgroundColor: c.hex }}
                    className="w-5 h-5 rounded-full border border-black/20 shadow-xs cursor-pointer hover:scale-110 transition-transform"
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TEXT TYPE */}
        {msgType === 'voice_note' && <WhatsAppVoiceNoteControls message={msg} onChange={patch => handleUpdateMessage(index, patch)} />}
        {msgType === 'text' && (
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className={`text-[11px] font-semibold block ${labelColorClass}`}>
                Message Text (Supports iOS Emojis)
              </label>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                {isId ? 'Bubble Chat: Pindah baris tiap 33 karakter' : 'Chat Bubble: Wraps at 33 chars'}
              </span>
            </div>
            <textarea
              rows={2}
              value={msg.text || ''}
              onChange={(e) => handleUpdateMessage(index, { text: e.target.value })}
              placeholder={!isOutgoing ? (isId ? 'Pesan masuk (kiri)' : 'Received message (left)') : 'Read a message'}
              className={messageInputClass}
            />
          </div>
        )}

        {/* MISSED CALL TYPES */}
        {(msgType === 'missed_voice_call' || msgType === 'missed_video_call') && (
          <div>
            <label className={`text-[11px] font-semibold block mb-0.5 ${labelColorClass}`}>
              Missed Call Text Line
            </label>
            <input
              type="text"
              value={msg.text || (msgType === 'missed_video_call' ? 'Missed video call' : 'Missed voice call')}
              onChange={(e) => handleUpdateMessage(index, { text: e.target.value })}
              placeholder={msgType === 'missed_video_call' ? 'Missed video call' : 'Missed voice call'}
              className={singleLineInputClass}
            />
          </div>
        )}

        {/* IMAGE TYPE (Single or Multi-Photo Album Grid) */}
        {msgType === 'image' && (
          <div className="space-y-3 p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <label htmlFor={`wa-photo-width-${msg.id}`} className={`flex items-center justify-between text-[11px] font-semibold mb-1 ${labelColorClass}`}>
                <span>{isId ? 'Ukuran Foto' : 'Photo Size'}</span>
                <span className="font-mono">{msg.photoWidth ?? 260}px</span>
              </label>
              <input id={`wa-photo-width-${msg.id}`} type="range" min={120} max={260} step={10}
                value={msg.photoWidth ?? 260}
                onChange={(e) => handleUpdateMessage(index, { photoWidth: Number(e.target.value) })}
                className="w-full accent-purple-600 cursor-pointer" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`text-[11px] font-semibold ${labelColorClass}`}>
                  {isId ? 'Daftar Foto / Gambar' : 'Photos / Media List'}
                </label>
                <span className="text-[10px] text-purple-600 font-bold">
                  {((msg.imageUrls && msg.imageUrls.length > 0) ? msg.imageUrls.length : (msg.imageUrl ? 1 : 0))} {isId ? 'foto' : 'photo(s)'}
                </span>
              </div>

              {/* Primary or First Image */}
              <ImageUploader
                label={isId ? 'Foto Utama (Foto #1)' : 'Primary Photo (Photo #1)'}
                value={((msg.imageUrls && msg.imageUrls[0]) || msg.imageUrl || '')}
                onChange={(url) => {
                  const currentUrls = msg.imageUrls && msg.imageUrls.length > 0 ? [...msg.imageUrls] : [msg.imageUrl || ''];
                  currentUrls[0] = url;
                  handleUpdateMessage(index, { imageUrl: url, imageUrls: currentUrls });
                }}
                onClear={() => {
                  const currentUrls = msg.imageUrls && msg.imageUrls.length > 0 ? [...msg.imageUrls] : [''];
                  currentUrls[0] = '';
                  handleUpdateMessage(index, { imageUrl: '', imageUrls: currentUrls });
                }}
                skipCompression={true}
                maxOutputDimension={2048}
                quality={0.95}
              />
            </div>

            {/* Extra Multi-Photos list (Photo #2, #3, #4, ...) */}
            {Boolean(msg.imageUrls && msg.imageUrls.length > 1) && (
              <div className="space-y-2">
                {(msg.imageUrls?.slice(1) || []).map((extraUrl, extraIdx) => (
                  <div key={extraIdx} className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <ImageUploader
                      label={`${isId ? 'Foto Tambahan' : 'Extra Photo'} #${extraIdx + 2}`}
                      value={extraUrl}
                      onChange={(url) => {
                        const newUrls = [...(msg.imageUrls || [])];
                        newUrls[extraIdx + 1] = url;
                        handleUpdateMessage(index, { imageUrls: newUrls });
                      }}
                      onClear={() => {
                        const newUrls = [...(msg.imageUrls || [])];
                        newUrls.splice(extraIdx + 1, 1);
                        handleUpdateMessage(index, { imageUrls: newUrls });
                      }}
                      skipCompression={true}
                      maxOutputDimension={2048}
                      quality={0.95}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Button to Add More Photos to Grid */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const currentUrls = msg.imageUrls && msg.imageUrls.length > 0
                    ? [...msg.imageUrls]
                    : [msg.imageUrl || ''];
                  currentUrls.push('');
                  handleUpdateMessage(index, {
                    imageUrls: currentUrls,
                    imageUrl: currentUrls[0] || '',
                  });
                }}
                className="px-2.5 py-1 text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isId ? 'Tambah Foto ke Album' : 'Add Photo to Album'}</span>
              </button>
            </div>

            {/* Counter "+N" (misal: +15) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1">
                <label className={`text-[11px] font-semibold ${labelColorClass}`}>
                  {isId ? 'Teks Counter "+N" (Contoh: +15)' : 'Counter Badge "+N" (e.g. +15)'}
                </label>
                <span className="text-[10px] text-slate-400">
                  {isId ? 'Opsional: overlay foto ke-4' : 'Optional 4th photo overlay'}
                </span>
              </div>
              <input
                type="text"
                value={msg.extraPhotosText || ''}
                onChange={(e) => handleUpdateMessage(index, { extraPhotosText: e.target.value })}
                placeholder="+15"
                className={singleLineInputClass}
              />
            </div>

            {/* Caption */}
            <div>
              <label className={`text-[11px] font-semibold block mb-0.5 ${labelColorClass}`}>
                {isId ? 'Keterangan Foto (Caption Opsional)' : 'Photo Caption (Optional)'}
              </label>
              <input
                type="text"
                value={msg.text || ''}
                onChange={(e) => handleUpdateMessage(index, { text: e.target.value })}
                placeholder={isId ? 'Ketik keterangan foto jika ada...' : 'Type photo caption if any...'}
                className={singleLineInputClass}
              />
            </div>
          </div>
        )}

        {/* STICKER TYPE */}
        {msgType === 'sticker' && (
          <div className="space-y-2">
            <ImageUploader
              label="Upload / Enter Sticker Image URL (Transparent PNG)"
              value={msg.stickerUrl ?? ''}
              onChange={(url) => handleUpdateMessage(index, { stickerUrl: url })}
              onClear={() => handleUpdateMessage(index, { stickerUrl: '' })}
              forceAspect={1}
              aspectHint="1:1 Fixed Square Ratio"
            />

            {/* Quick Sticker Preset Selection */}
            <div>
              <label className={`text-[10px] font-bold block mb-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                Quick Sticker Presets:
              </label>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_STICKERS.map((stk, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleUpdateMessage(index, { stickerUrl: stk.url });
                    }}
                    className={`p-1 border rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${isDarkTheme
                      ? 'border-slate-700 bg-slate-800 hover:border-purple-500'
                      : 'border-slate-200 bg-white hover:bg-purple-50 hover:border-purple-500'
                      }`}
                  >
                    <img src={stk.url} alt={stk.name} className="w-6 h-6 object-contain" />
                    <span className={`text-[10px] font-medium pr-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>{stk.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Timestamp & Read Status Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div>
            <label className={`text-[11px] font-semibold block mb-0.5 ${labelColorClass}`}>
              Timestamp (e.g. "12.00")
            </label>
            <input
              type="text"
              value={msg.time || ''}
              onChange={(e) => handleUpdateMessage(index, { time: e.target.value })}
              placeholder="12.00"
              className={singleLineInputClass}
            />
          </div>

          {/* Read Status Selector for Outgoing */}
          {isOutgoing && (
            <div>
              <label className={`text-[11px] font-semibold block mb-0.5 ${labelColorClass}`}>
                Read Status
              </label>
              <div className={`flex border rounded-lg overflow-hidden text-[10px] font-bold ${isDarkTheme ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
                }`}>
                <button
                  type="button"
                  onClick={() => handleUpdateMessage(index, { status: 'sent', isRead: false })}
                  className={`flex-1 py-1 px-1.5 flex items-center justify-center space-x-1 cursor-pointer transition-colors ${(msg.status === 'sent')
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  title={isId ? 'Terkirim (Centang 1 Abu-abu)' : 'Sent (Single gray check)'}
                >
                  <Check className="w-3 h-3" />
                  <span>{isId ? 'Terkirim (✓)' : 'Sent (✓)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateMessage(index, { status: 'delivered', isRead: false })}
                  className={`flex-1 py-1 px-1.5 flex items-center justify-center space-x-1 cursor-pointer transition-colors border-l border-r ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'
                    } ${(msg.status === 'delivered' || (!msg.status && msg.isRead === false))
                      ? 'bg-purple-600 text-white font-bold shadow-xs'
                      : isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  title={isId ? 'Diterima (Centang 2 Abu-abu)' : 'Delivered (Double gray check)'}
                >
                  <CheckCheck className="w-3 h-3 text-current" />
                  <span>{isId ? 'Diterima (✓✓)' : 'Delivered (✓✓)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateMessage(index, { status: 'read', isRead: true, isRecalled: false, type: msg.type === 'recalled' ? 'text' : msg.type })}
                  className={`flex-1 py-1 px-1.5 flex items-center justify-center space-x-1 cursor-pointer transition-colors ${(msg.status === 'read' || (!msg.status && msg.isRead !== false && !msg.isRecalled))
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  title={isId ? 'Dibaca (Centang 2 Biru)' : 'Read (Double blue check)'}
                >
                  <CheckCheck className="w-3 h-3 text-current" />
                  <span>{isId ? 'Dibaca (✓✓)' : 'Read (✓✓)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateMessage(index, { status: 'recalled', isRecalled: true, type: msg.type === 'voice_note' || msg.type === 'contact' ? msg.type : 'recalled', isVoicePlaying: false })}
                  className={`flex-1 py-1 px-1.5 flex items-center justify-center space-x-1 cursor-pointer transition-colors border-l ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'
                    } ${(msg.status === 'recalled' || msg.type === 'recalled' || msg.isRecalled)
                      ? 'bg-rose-600 text-white font-bold shadow-xs'
                      : isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  title={isId ? 'Ditarik / Dihapus untuk Semua' : 'Recalled / Deleted'}
                >
                  <Ban className="w-3 h-3" />
                  <span>{isId ? 'Ditarik (🚫)' : 'Recalled (🚫)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Recalled Status for Incoming */}
          {!isOutgoing && (
            <div>
              <label className={`text-[11px] font-semibold block mb-0.5 ${labelColorClass}`}>
                Status Pesan Masuk
              </label>
              <button
                type="button"
                onClick={() => {
                  const isNowRecalled = !(msg.isRecalled || msg.status === 'recalled' || msg.type === 'recalled');
                  handleUpdateMessage(index, {
                    isRecalled: isNowRecalled,
                    status: isNowRecalled ? 'recalled' : undefined,
                    type: msg.type === 'voice_note' || msg.type === 'contact' ? msg.type : isNowRecalled ? 'recalled' : (msg.imageUrl ? 'image' : 'text'),
                    isVoicePlaying: false,
                  });
                }}
                className={`w-full py-1 px-2 text-[11px] font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${(msg.isRecalled || msg.status === 'recalled' || msg.type === 'recalled')
                  ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-300'
                  : isDarkTheme
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <Ban className="w-3 h-3" />
                <span>
                  {(msg.isRecalled || msg.status === 'recalled' || msg.type === 'recalled')
                    ? (isId ? '🚫 Ditarik Pengirim ("Pesan ini telah dihapus")' : '🚫 Recalled by Sender')
                    : (isId ? 'Tandai sebagai Ditarik / Dihapus' : 'Mark as Recalled / Deleted')}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* REPLY QUOTE BOX (Only visible when enabled) */}
        {isReplyQuoteChecked && (
          <WhatsAppChatReplyQuoteEditor data={data} onChange={onChange} msg={msg} index={index}
            handleUpdateMessage={handleUpdateMessage} handleRemoveMessage={handleRemoveMessage} handleMoveMessage={handleMoveMessage}
            isDarkTheme={isDarkTheme} innerBoxClass={innerBoxClass} singleLineInputClass={singleLineInputClass} />
        )}
      </div>
    </div>
  );
};
