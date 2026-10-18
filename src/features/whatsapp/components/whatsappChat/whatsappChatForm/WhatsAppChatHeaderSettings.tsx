import React from 'react';
import { WhatsAppChatData } from '../../../../../types';
import { ImageUploader } from '../../../../../components/FormControls';
import { Sun, Moon, Layout, Sliders } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';
import type { ChatSectionProps } from './whatsAppChatFormTypes';
export const WhatsAppChatHeaderSettings: React.FC<ChatSectionProps> = ({ data, onChange }) => {
  const { t, isId } = useLanguage();
  const updateField = <K extends keyof WhatsAppChatData>(key: K, value: WhatsAppChatData[K]) => {
    onChange({ ...data, [key]: value });
  };
  return (
    <>
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Contact Info & Chat Header</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-700 font-semibold block mb-1">
            {data.isGroupChat ? 'Group Name' : 'Contact Name'}
          </label>
          <input
            type="text"
            value={data.contactName || ''}
            onChange={(e) => updateField('contactName', e.target.value)}
            placeholder={data.isGroupChat ? 'Group Name' : 'Name'}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="text-xs text-slate-700 font-semibold block mb-1">
            {data.isGroupChat ? 'Group Participants (Comma-separated)' : 'Contact Status'}
          </label>
          <input
            type="text"
            value={data.isGroupChat ? (data.groupParticipants ?? '') : (data.statusText ?? '')}
            onChange={(e) => {
              if (data.isGroupChat) {
                updateField('groupParticipants', e.target.value);
              } else {
                updateField('statusText', e.target.value);
              }
            }}
            placeholder={data.isGroupChat ? 'Siti, Budi, Andi, You' : (data.isOnline !== false ? 'online' : 'offline')}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Is Group Chat Toggle */}
      <div className="pt-1">
        <label className="flex items-center space-x-2.5 cursor-pointer bg-slate-50 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors select-none">
          <input
            type="checkbox"
            checked={!!data.isGroupChat}
            onChange={(e) => {
              const checked = e.target.checked;
              const panel = document.getElementById('customization-panel');
              const st = panel ? panel.scrollTop : 0;
              updateField('isGroupChat', checked);
              requestAnimationFrame(() => {
                if (panel && panel.scrollTop !== st) panel.scrollTop = st;
              });
            }}
            className="rounded text-purple-600 focus:ring-0 w-4 h-4 cursor-pointer accent-purple-600"
          />
          <div>
            <span className="text-xs font-bold text-slate-800 block">Is Group Chat? (Mode Chat Grup)</span>
            <span className="text-[10px] text-slate-500 block">Tampilkan daftar anggota di subtitle header & nama pengirim berwarna di tiap pesan masuk</span>
          </div>
        </label>
      </div>

      {/* Contact Profile Picture */}
      <ImageUploader
        label="Contact Profile Picture (Avatar)"
        value={data.contactAvatar || ''}
        onChange={(url) => updateField('contactAvatar', url)}
        onClear={() => updateField('contactAvatar', '')}
      />

      {/* Aspect Ratio, Device OS & Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div>
          <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1 flex items-center space-x-1">
            <Layout className="w-3.5 h-3.5 text-purple-600" />
            <span>Container Aspect Ratio</span>
          </label>
          <div className="flex space-x-1.5">
            {(['1:1', '4:5', '9:16'] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => updateField('aspectRatio', ratio)}
                className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${(data.aspectRatio || '4:5') === ratio
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
            Theme Mode {data.useCustomColors && <span className="text-amber-600 font-normal text-[10px]">(Kustom)</span>}
          </label>
          <div className="flex space-x-1.5">
            {(['light', 'dark'] as const).map((t) => {
              const isDisabled = !!data.useCustomColors;
              const isSelected = !isDisabled && data.theme === t;
              return (
                <button
                  key={t}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => updateField('theme', t)}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center space-x-1.5 transition-all ${isDisabled
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50'
                    : isSelected
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs cursor-pointer'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer'
                    }`}
                >
                  {t === 'light' ? (
                    <>
                      <Sun className="w-3.5 h-3.5" />
                      <span>Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5" />
                      <span>Dark</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upload Chat Wallpaper (Crisp / Sharp / HD) */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <ImageUploader
          label="Upload Chat Wallpaper (Custom Background Image - HD / Tajam)"
          value={data.chatWallpaper || ''}
          onChange={(url) => updateField('chatWallpaper', url)}
          onClear={() => updateField('chatWallpaper', '')}
          aspectHint="Full Container Background (Tajam & Jernih)"
          allow916={true}
          skipCompression={true}
          maxOutputDimension={2560}
          quality={0.96}
        />
      </div>

      {/* Toggle Options */}
      <div className="pt-1 space-y-2">
        <label className="flex items-center space-x-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!data.showInputBar}
            onChange={(e) => {
              const checked = e.target.checked;
              const panel = document.getElementById('customization-panel');
              const st = panel ? panel.scrollTop : 0;
              updateField('showInputBar', checked);
              requestAnimationFrame(() => {
                if (panel && panel.scrollTop !== st) panel.scrollTop = st;
              });
            }}
            className="rounded text-purple-600 focus:ring-0 w-4 h-4 accent-purple-600 cursor-pointer"
          />
          <span className="text-xs font-medium text-slate-700">Show Bottom Input Bar</span>
        </label>

        {!!data.showInputBar && (
          <div className="pt-1">
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              Bottom Bar Input Text / Draft Message
            </label>
            <input
              type="text"
              value={data.inputText || ''}
              onChange={(e) => updateField('inputText', e.target.value)}
              placeholder="Type draft message here..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>
        )}
      </div>

      {/* Message Spacing & Roundness Controls */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
          <Sliders className="w-3.5 h-3.5 text-purple-600" />
          <span>Layout & Spacing Controls (Jarak & Kelengkungan)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
            <label htmlFor="wa-bubble-width" className="flex justify-between items-center text-xs font-semibold text-slate-700">
              <span>{isId ? 'Lebar Bubble' : 'Bubble Width'}</span>
              <span className="font-mono text-purple-700 dark:text-purple-300">{data.bubbleWidthPercent ?? 94}%</span>
            </label>
            <input id="wa-bubble-width" type="range" min={50} max={94} step={1}
              value={data.bubbleWidthPercent ?? 94}
              onChange={(e) => updateField('bubbleWidthPercent', Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer" />
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
            <label htmlFor="wa-message-font-size" className="flex justify-between items-center text-xs font-semibold text-slate-700">
              <span>{isId ? 'Ukuran Teks Pesan' : 'Message Text Size'}</span>
              <span className="font-mono text-purple-700 dark:text-purple-300">{data.messageFontSize ?? 15}px</span>
            </label>
            <input id="wa-message-font-size" type="range" min={11} max={18} step={1}
              value={data.messageFontSize ?? 15}
              onChange={(e) => updateField('messageFontSize', Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer" />
          </div>
          {/* Same Sender Gap */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Same Sender Gap</span>
              <span className="font-mono text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-bold text-[11px]">
                {Math.min(data.sameSenderGap ?? 0, 4)}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={Math.min(data.sameSenderGap ?? 0, 4)}
              onChange={(e) => updateField('sameSenderGap', parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Antar bubble pengirim sama</p>
          </div>

          {/* Different Sender Gap */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Different Sender Gap</span>
              <span className="font-mono text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-bold text-[11px]">
                {Math.min(data.differentSenderGap ?? 6, 12)}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={Math.min(data.differentSenderGap ?? 6, 12)}
              onChange={(e) => updateField('differentSenderGap', parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Pemisah pesan masuk/keluar</p>
          </div>

          {/* Bubble Roundness */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Bubble Roundness</span>
              <span className="font-mono text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-bold text-[11px]">
                {data.bubbleRoundness ?? 12}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={data.bubbleRoundness ?? 12}
              onChange={(e) => updateField('bubbleRoundness', parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Kelengkungan sudut (0-30px)</p>
          </div>
        </div>
      </div>

    </>
  );
};
