import React from 'react';
import { Trash2, ArrowUp, ArrowDown, Layout, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';
import type { ChatMessageEditorProps } from './whatsAppChatFormTypes';
export const WhatsAppChatSystemMessageEditor: React.FC<ChatMessageEditorProps> = ({ data, onChange, msg, index, handleUpdateMessage, handleRemoveMessage, handleMoveMessage }) => {
  const { isId } = useLanguage();
  const currentGap = typeof msg.systemGap === 'number' ? msg.systemGap : 12;
  return (
    <div
      key={msg.id}
      className="p-3.5 rounded-xl border-2 bg-amber-50 dark:bg-slate-900 border-amber-400 dark:border-amber-600 shadow-sm transition-all"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-amber-300 dark:border-amber-700/80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-md bg-amber-600 text-white shadow-2xs flex items-center space-x-1 tracking-wide shrink-0">
            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
            <span>#{index + 1} SYSTEM NOTICE</span>
          </span>
          <span className="text-xs text-amber-950 dark:text-amber-200 font-bold">
            {isId ? 'Pemberitahuan Sistem (Blocked / Unblock / Enkripsi)' : 'System Notice'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 shrink-0 ml-auto bg-amber-100 dark:bg-slate-800 p-1 rounded-lg border border-amber-300 dark:border-amber-700 shadow-2xs">
          <button
            type="button"
            onClick={() => handleMoveMessage(index, 'up')}
            disabled={index === 0}
            className="w-7 h-7 flex items-center justify-center text-amber-950 dark:text-amber-100 bg-white dark:bg-slate-700 hover:bg-amber-200/70 dark:hover:bg-amber-900/70 border border-amber-300 dark:border-amber-600 disabled:opacity-35 disabled:hover:bg-white dark:disabled:hover:bg-slate-700 disabled:cursor-not-allowed cursor-pointer rounded-md transition-all shadow-2xs"
            title="Move Up"
          >
            <ArrowUp className="w-4 h-4 shrink-0" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => handleMoveMessage(index, 'down')}
            disabled={index === data.messages.length - 1}
            className="w-7 h-7 flex items-center justify-center text-amber-950 dark:text-amber-100 bg-white dark:bg-slate-700 hover:bg-amber-200/70 dark:hover:bg-amber-900/70 border border-amber-300 dark:border-amber-600 disabled:opacity-35 disabled:hover:bg-white dark:disabled:hover:bg-slate-700 disabled:cursor-not-allowed cursor-pointer rounded-md transition-all shadow-2xs"
            title="Move Down"
          >
            <ArrowDown className="w-4 h-4 shrink-0" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => handleRemoveMessage(index)}
            className="w-7 h-7 flex items-center justify-center text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-white dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-amber-300 dark:border-amber-600 cursor-pointer rounded-md transition-all shadow-2xs"
            title="Delete System Message"
          >
            <Trash2 className="w-4 h-4 shrink-0" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Presets */}
        <div>
          <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block mb-1.5">
            {isId ? 'Pilih Template Pesan Sistem Cepat:' : 'Quick Presets:'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleUpdateMessage(index, {
                text: 'You blocked this contact.',
                systemAction: 'blocked',
              })}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 border border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/60 cursor-pointer transition-colors shadow-2xs"
            >
              You blocked this contact.
            </button>
            <button
              type="button"
              onClick={() => handleUpdateMessage(index, {
                text: 'You unblocked this contact.',
                systemAction: 'unblocked',
              })}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 border border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/60 cursor-pointer transition-colors shadow-2xs"
            >
              You unblocked this contact.
            </button>
            <button
              type="button"
              onClick={() => handleUpdateMessage(index, {
                text: 'Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them. Tap to learn more.',
                systemAction: 'encrypted',
              })}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 border border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/60 cursor-pointer transition-colors shadow-2xs"
            >
              End-to-end Encrypted
            </button>
          </div>
        </div>

        {/* Custom text */}
        <div>
          <label className="text-xs text-slate-900 dark:text-slate-100 font-bold block mb-1">
            {isId ? 'Teks Pesan Sistem' : 'System Message Text'}
          </label>
          <textarea
            rows={2}
            value={msg.text || ''}
            onChange={(e) => handleUpdateMessage(index, { text: e.target.value })}
            placeholder="You blocked this contact."
            className="w-full bg-white dark:bg-slate-800 border border-amber-400 dark:border-amber-600 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y shadow-2xs"
          />
        </div>

        {/* Flexible Spacing / Layout Gap Slider */}
        <div className="pt-2 border-t border-amber-300 dark:border-amber-800">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {isId ? 'Jarak Spasi Atas & Bawah (Layout Gap)' : 'Vertical Layout Gap'}
            </label>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-950 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
              {currentGap}px
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={36}
            step={1}
            value={currentGap}
            onChange={(e) => handleUpdateMessage(index, { systemGap: parseInt(e.target.value, 10) })}
            className="w-full accent-amber-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
            <span>Rapat (2px)</span>
            <span>Normal (12px)</span>
            <span>Longgar (36px)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
