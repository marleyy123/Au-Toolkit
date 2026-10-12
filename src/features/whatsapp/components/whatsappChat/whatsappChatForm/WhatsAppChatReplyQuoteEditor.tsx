import { Select } from '../../../../../components/ui/Select';
import React from 'react';
import { toHexForPicker } from '../../../../../utils/colorUtils';
import { useLanguage } from '../../../../../context/LanguageContext';
import type { ChatMessageEditorProps } from './whatsAppChatFormTypes';
interface Props extends ChatMessageEditorProps {
  isDarkTheme: boolean;
  innerBoxClass: string;
  singleLineInputClass: string;
}
export const WhatsAppChatReplyQuoteEditor: React.FC<Props> = ({ data, msg, index, handleUpdateMessage, isDarkTheme, innerBoxClass, singleLineInputClass }) => {
  const { isId } = useLanguage();
  return (
    <div className={`p-2.5 rounded-lg border space-y-2 ${innerBoxClass}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold block ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>
          Reply Quote Box
        </span>
        {(msg.showReplyQuote || msg.replyToSender || msg.replyToText) && (
          <button
            type="button"
            onClick={() => handleUpdateMessage(index, { replyToMessageId: '', replyToSender: '', replyToText: '' })}
            className="text-[10px] text-rose-500 hover:text-rose-400 font-semibold cursor-pointer"
          >
            Clear Quote
          </button>
        )}
      </div>

      {/* Dropdown to Pick from Existing Messages in Chat */}
      <div>
        <label className={`text-[10.5px] font-medium block mb-0.5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
          Pick Message to Reply from Chat:
        </label>
        <Select
          value={msg.replyToMessageId
            ? (() => {
              const foundIdx = data.messages.findIndex((item) => item.id === msg.replyToMessageId);
              return foundIdx >= 0 ? String(foundIdx) : '';
            })()
            : ''}
          onValueChange={(value) => {
            const selectedIdx = parseInt(value, 10);
            if (!isNaN(selectedIdx) && data.messages[selectedIdx]) {
              const targetMsg = data.messages[selectedIdx];
              const senderLabel = targetMsg.sender === 'outgoing' || targetMsg.sender === 'me'
                ? ''
                : (targetMsg.senderName?.trim() || data.contactName?.trim() || '');
              const textPreview = targetMsg.type === 'contact'
                ? (targetMsg.sharedContactName?.trim() || (isId ? 'Kontak' : 'Contact'))
                : targetMsg.text?.trim()
                ? targetMsg.text
                : (targetMsg.imageUrl ? (isId ? '📷 Foto' : '📷 Photo') : targetMsg.stickerUrl ? (isId ? '🌟 Stiker' : '🌟 Sticker') : '');
              handleUpdateMessage(index, {
                showReplyQuote: true,
                replyToMessageId: targetMsg.id,
                replyToSender: senderLabel,
                replyToText: textPreview,
              });
            }
          }}
          className={`w-full ${singleLineInputClass} cursor-pointer`}
        >
          <option value="" disabled hidden>{isId ? '-- Pilih pesan dari obrolan ini --' : '-- Select a message from this chat --'}</option>
          {data.messages
            .map((m, mIdx) => ({ m, mIdx }))
            .filter(({ mIdx }) => mIdx !== index && data.messages[mIdx].type !== 'date_divider' && data.messages[mIdx].type !== 'unread_divider')
            .map(({ m, mIdx }) => {
              const sLabel = m.sender === 'outgoing' || m.sender === 'me' ? (isId ? 'Kamu' : 'You') : (m.senderName || data.contactName || (isId ? 'Kontak' : 'Contact'));
              const preview = m.type === 'contact'
                ? (m.sharedContactName?.trim() || (isId ? 'Kontak' : 'Contact'))
                : m.text || (m.imageUrl ? (isId ? '📷 Foto' : '📷 Photo') : m.stickerUrl ? (isId ? '🌟 Stiker' : '🌟 Sticker') : (isId ? 'Pesan' : 'Message'));
              return (
                <option key={m.id} value={mIdx}>
                  #{mIdx + 1} [{sLabel}]: {preview.length > 40 ? preview.substring(0, 40) + '...' : preview}
                </option>
              );
            })}
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className={`text-[10.5px] font-medium block mb-0.5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            Reply Sender Name (Nama Kontak)
          </label>
          <input
            type="text"
            value={(msg.replyToSender === 'Contact' || msg.replyToSender === 'Kontak' || msg.replyToSender === 'You' || msg.replyToSender === 'Kamu') ? '' : (msg.replyToSender || '')}
            onChange={(e) => handleUpdateMessage(index, { showReplyQuote: true, replyToSender: e.target.value })}
            placeholder={data.contactName?.trim() || (isId ? 'Kontak' : 'Contact')}
            className={singleLineInputClass}
          />
        </div>

        <div>
          <label className={`text-[10.5px] font-medium block mb-0.5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            Quoted Text (Teks yang Dibalas)
          </label>
          <input
            type="text"
            value={(msg.replyToText === 'Message' || msg.replyToText === 'Pesan') ? '' : (msg.replyToText || '')}
            onChange={(e) => handleUpdateMessage(index, { showReplyQuote: true, replyToText: e.target.value })}
            placeholder={isId ? 'Pesan' : 'Message'}
            className={singleLineInputClass}
          />
        </div>
      </div>

      {/* Reply Box Custom Colors (Bar Color & Sender Name Color) */}
      <div className={`pt-1.5 border-t space-y-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200/80'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Vertical Bar Color */}
          <div>
            <label className={`text-[10.5px] font-semibold block mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
              Warna Garis Vertikal (Bar Color)
            </label>
            <div className="flex items-center space-x-1.5">
              <input
                type="color"
                value={toHexForPicker(msg.replyBarColor, data.useCustomColors && data.iconColor ? data.iconColor : '#25D366')}
                onChange={(e) => handleUpdateMessage(index, { replyBarColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0 shrink-0"
              />
              <input
                type="text"
                value={msg.replyBarColor ?? ''}
                onChange={(e) => handleUpdateMessage(index, { replyBarColor: e.target.value })}
                placeholder={data.useCustomColors && data.iconColor ? data.iconColor : '#25D366'}
                className={`flex-1 font-mono text-[11px] ${singleLineInputClass} px-2 py-0.5`}
              />
            </div>
          </div>

          {/* Reply Contact Name Color */}
          <div>
            <label className={`text-[10.5px] font-semibold block mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
              Warna Nama Kontak (Sender Color)
            </label>
            <div className="flex items-center space-x-1.5">
              <input
                type="color"
                value={toHexForPicker(msg.replySenderColor, msg.replyBarColor || (data.useCustomColors && data.iconColor ? data.iconColor : '#25D366'))}
                onChange={(e) => handleUpdateMessage(index, { replySenderColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0 shrink-0"
              />
              <input
                type="text"
                value={msg.replySenderColor ?? ''}
                onChange={(e) => handleUpdateMessage(index, { replySenderColor: e.target.value })}
                placeholder={msg.replyBarColor || (data.useCustomColors && data.iconColor ? data.iconColor : '#25D366')}
                className={`flex-1 font-mono text-[11px] ${singleLineInputClass} px-2 py-0.5`}
              />
            </div>
          </div>
        </div>

        {/* Quick Swatches for Reply Bar & Text */}
        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
          <span className="text-[10px] text-slate-500 font-medium">Presets:</span>
          {[
            { name: 'WhatsApp Green', hex: '#25D366' },
            { name: 'Sky Blue', hex: '#0284c7' },
            { name: 'Purple', hex: '#8b5cf6' },
            { name: 'Pink', hex: '#e542a3' },
            { name: 'Amber', hex: '#f59e0b' },
            { name: 'Rose', hex: '#f43f5e' },
            { name: 'Slate', hex: '#64748b' },
          ].map((preset) => (
            <button
              key={preset.hex}
              type="button"
              onClick={() => handleUpdateMessage(index, { replyBarColor: preset.hex, replySenderColor: preset.hex })}
              style={{ backgroundColor: preset.hex }}
              className="w-4 h-4 rounded-full border border-black/20 hover:scale-125 transition-transform cursor-pointer"
              title={preset.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
