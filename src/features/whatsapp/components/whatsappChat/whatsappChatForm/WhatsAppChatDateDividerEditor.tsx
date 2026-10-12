import React from 'react';
import { Trash2, ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';
import type { ChatMessageEditorProps } from './whatsAppChatFormTypes';
export const WhatsAppChatDateDividerEditor: React.FC<ChatMessageEditorProps> = ({ data, onChange, msg, index, handleUpdateMessage, handleRemoveMessage, handleMoveMessage }) => {
  const { isId } = useLanguage();
  return (
    <div
      key={msg.id}
      className="p-3.5 rounded-xl border bg-purple-50/40 dark:bg-purple-950/20 border-purple-200/70 dark:border-purple-900/40 transition-all shadow-xs wa-date-divider-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b border-purple-200/50 dark:border-purple-900/40">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-md bg-purple-600 text-white shadow-2xs flex items-center space-x-1 tracking-wide shrink-0">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            <span>#{index + 1} DATE DIVIDER</span>
          </span>
          <span className="text-[11.5px] text-purple-900 dark:text-purple-200 font-bold">
            {isId ? 'Pemisah Tanggal Chat' : 'Chat Date Divider'}
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

      <div>
        <label className="text-xs text-slate-900 dark:text-slate-100 font-bold block mb-1">
          Date Divider Text (e.g. Today / Hari Ini / Yesterday / 24 August 2024)
        </label>
        <input
          type="text"
          value={msg.text || ''}
          onChange={(e) => handleUpdateMessage(index, { text: e.target.value })}
          placeholder="Today"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
        />
      </div>

      {/* Date Divider Gap Slider inside Card Container */}
      <div className="pt-2.5 mt-2.5 border-t border-purple-200 dark:border-purple-800/70 space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-black dark:text-black text-xs">
            {isId ? 'Date Divider Gap (Spasi Atas/Bawah)' : 'Date Divider Gap (Top/Bottom Spacing)'}
          </span>
          <span className="font-mono text-black dark:text-black bg-slate-100 dark:bg-slate-200 px-2 py-0.5 rounded font-bold text-xs border border-slate-300 dark:border-slate-400 shadow-none">
            {msg.dateDividerGap ?? data.dateDividerGap ?? 12}px
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={48}
          step={1}
          value={msg.dateDividerGap ?? data.dateDividerGap ?? 12}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            const updatedMsgs = [...(data.messages || [])];
            updatedMsgs[index] = { ...updatedMsgs[index], dateDividerGap: val };
            onChange({
              ...data,
              dateDividerGap: val,
              messages: updatedMsgs,
            });
          }}
          className="w-full accent-purple-600 cursor-pointer"
        />
        <p className="text-[11px] text-black dark:text-black font-medium">
          {isId ? 'Jarak spasi pemisah tanggal chat' : 'Top & bottom spacing for date divider'}
        </p>
      </div>
    </div>
  );
};
