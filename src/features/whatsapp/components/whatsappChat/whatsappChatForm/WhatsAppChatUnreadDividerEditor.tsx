import React from 'react';
import { Trash2, ArrowUp, ArrowDown, Mail } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';
import type { ChatMessageEditorProps } from './whatsAppChatFormTypes';
export const WhatsAppChatUnreadDividerEditor: React.FC<ChatMessageEditorProps> = ({ data, onChange, msg, index, handleUpdateMessage, handleRemoveMessage, handleMoveMessage }) => {
  const { isId } = useLanguage();
  return (
    <div
      key={msg.id}
      className="p-3.5 rounded-xl border bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 transition-all shadow-xs wa-unread-divider-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b border-purple-200 dark:border-purple-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-md bg-purple-600 text-white shadow-2xs flex items-center space-x-1 tracking-wide shrink-0">
            <Mail className="w-3.5 h-3.5 mr-1" />
            <span>#{index + 1} UNREAD DIVIDER</span>
          </span>
          <span className="text-[11.5px] text-purple-900 dark:text-purple-200 font-bold">
            {msg.unreadDividerStyle === 'pill' ? (isId ? 'Gaya Pil Ramping' : 'Slim Pill Style') : (isId ? 'Gaya Banner Ramping' : 'Slim Banner Style')}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 shrink-0 ml-auto bg-purple-100/80 dark:bg-slate-800 p-1 rounded-lg border border-purple-300 dark:border-purple-700 shadow-2xs">
          <button
            type="button"
            onClick={() => handleMoveMessage(index, 'up')}
            disabled={index === 0}
            className="w-7 h-7 flex items-center justify-center text-purple-900 dark:text-purple-100 bg-white dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-900/70 border border-purple-200 dark:border-purple-600 disabled:opacity-35 disabled:hover:bg-white dark:disabled:hover:bg-slate-700 disabled:cursor-not-allowed cursor-pointer rounded-md transition-all shadow-2xs"
            title="Move Up"
          >
            <ArrowUp className="w-4 h-4 shrink-0" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => handleMoveMessage(index, 'down')}
            disabled={index === data.messages.length - 1}
            className="w-7 h-7 flex items-center justify-center text-purple-900 dark:text-purple-100 bg-white dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-900/70 border border-purple-200 dark:border-purple-600 disabled:opacity-35 disabled:hover:bg-white dark:disabled:hover:bg-slate-700 disabled:cursor-not-allowed cursor-pointer rounded-md transition-all shadow-2xs"
            title="Move Down"
          >
            <ArrowDown className="w-4 h-4 shrink-0" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => handleRemoveMessage(index)}
            className="w-7 h-7 flex items-center justify-center text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-white dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-purple-200 dark:border-purple-600 cursor-pointer rounded-md transition-all shadow-2xs"
            title="Delete Divider"
          >
            <Trash2 className="w-4 h-4 shrink-0" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-xs text-slate-950 dark:text-white font-bold block mb-1">
            {isId ? 'Teks Indikator (e.g. 1 UNREAD MESSAGE / 1 PESAN BELUM DIBACA)' : 'Indicator Text (e.g. 1 UNREAD MESSAGE)'}
          </label>
          <input
            type="text"
            value={msg.text || ''}
            onChange={(e) => handleUpdateMessage(index, { text: e.target.value })}
            placeholder={isId ? '1 PESAN BELUM DIBACA' : '1 UNREAD MESSAGE'}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 uppercase tracking-wide font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-slate-950 dark:text-white">
              {isId ? 'Gaya:' : 'Style:'}
            </span>
            <button
              type="button"
              onClick={() => handleUpdateMessage(index, { unreadDividerStyle: 'banner' })}
              className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-all border cursor-pointer ${(msg.unreadDividerStyle || 'banner') === 'banner'
                ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-purple-50'
                }`}
            >
              Banner
            </button>
            <button
              type="button"
              onClick={() => handleUpdateMessage(index, { unreadDividerStyle: 'pill' })}
              className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-all border cursor-pointer ${msg.unreadDividerStyle === 'pill'
                ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-purple-50'
                }`}
            >
              Pill
            </button>
          </div>

          <div className="flex items-center space-x-1">
            {['1 UNREAD MESSAGE', '2 UNREAD MESSAGES', '1 PESAN BELUM DIBACA'].map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => handleUpdateMessage(index, { text: quick })}
                className="text-[9.5px] px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-purple-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md cursor-pointer"
              >
                {quick}
              </button>
            ))}
          </div>
        </div>

        {/* Unread Divider Gap Slider inside Card Container */}
        <div className="pt-2.5 mt-2.5 border-t border-purple-200 dark:border-purple-800/70 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-black dark:text-black text-xs">
              {isId ? 'Unread Divider Gap (Spasi Atas/Bawah)' : 'Unread Divider Gap (Top/Bottom Spacing)'}
            </span>
            <span className="font-mono text-black dark:text-black bg-slate-100 dark:bg-slate-200 px-2 py-0.5 rounded font-bold text-xs border border-slate-300 dark:border-slate-400 shadow-none">
              {msg.unreadDividerGap ?? data.unreadDividerGap ?? 14}px
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={48}
            step={1}
            value={msg.unreadDividerGap ?? data.unreadDividerGap ?? 14}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              const updatedMsgs = [...(data.messages || [])];
              updatedMsgs[index] = { ...updatedMsgs[index], unreadDividerGap: val };
              onChange({
                ...data,
                unreadDividerGap: val,
                messages: updatedMsgs,
              });
            }}
            className="w-full accent-purple-600 cursor-pointer"
          />
          <p className="text-[11px] font-medium text-black dark:text-black">
            {isId ? 'Jarak spasi vertikal atas & bawah simetris di sekitar divider' : 'Symmetrical vertical spacing above and below this divider'}
          </p>
        </div>
      </div>
    </div>
  );
};
