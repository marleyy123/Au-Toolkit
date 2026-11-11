import React from 'react';
import { WhatsAppChatData } from '../../../../../types';

interface Props {
  data: WhatsAppChatData;
  activeBarBg?: string;
  activeMainText?: string;
  activeIconColor?: string;
  inputBarIconColor: string;
  useCustomColors: boolean;
  isAndroid: boolean;
  isDark: boolean;
  language: string;
  onChange?: (updated: WhatsAppChatData) => void;
}

export const WhatsAppChatInputBar: React.FC<Props> = ({
  data,
  activeBarBg,
  activeMainText,
  activeIconColor,
  inputBarIconColor,
  useCustomColors,
  isAndroid,
  isDark,
  language,
  onChange,
}) => {
  const handleSendMessage = () => {
    if (!onChange || !(data.inputText || '').trim()) return;
    const newMsg = {
      id: 'wa-msg-' + Date.now(),
      sender: 'outgoing' as const,
      type: 'text' as const,
      text: data.inputText!.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      isRead: true,
    };
    onChange({
      ...data,
      messages: [...(data.messages || []), newMsg],
      inputText: '',
    });
  };

  return (
    <div className="shrink-0 z-20">
      <div
        style={{
          backgroundColor: activeBarBg || (isAndroid ? 'transparent' : undefined),
          borderColor: (useCustomColors || isAndroid) ? 'transparent' : undefined,
        }}
        className={`px-2 py-1.5 flex items-center space-x-1.5 min-h-[44px] transition-colors ${
          !useCustomColors && !isAndroid && (isDark ? 'bg-[#1c1c1e] border-t border-white/10 text-white' : 'bg-[#F6F6F6] border-t border-black/8 text-slate-800')
        }`}
      >
        {isAndroid ? (
          /* Android WhatsApp Input Bar */
          <div className="flex items-center space-x-1.5 w-full">
            <div
              style={{
                backgroundColor: isDark ? '#1f2c34' : '#ffffff',
                color: activeMainText || (isDark ? '#ffffff' : '#111b21'),
              }}
              className="flex-1 rounded-[24px] px-3 py-1 flex items-center shadow-2xs border-0 min-h-[42px] transition-colors"
            >
              <button
                type="button"
                style={{ color: isDark ? '#8696a0' : '#54656f' }}
                className="hover:opacity-80 p-0.5 mr-2 shrink-0 cursor-pointer flex items-center justify-center"
                title="Emoji"
              >
                <svg className="w-5.5 h-5.5 fill-none stroke-current" strokeWidth="1.8" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
                  <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>

              <div className="grid grid-cols-1 flex-1 relative min-w-0 items-center">
                <span className="col-start-1 row-start-1 invisible whitespace-pre-wrap break-words break-all text-[14px] leading-snug px-0 py-0 min-h-[18px] max-h-[90px] overflow-hidden">
                  {(data.inputText || '') + ' '}
                </span>
                <textarea
                  rows={1}
                  value={data.inputText ?? ''}
                  onChange={(e) => onChange?.({ ...data, inputText: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && (data.inputText || '').trim()) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder=""
                  style={{ color: activeMainText || (isDark ? '#ffffff' : '#111b21') }}
                  className="col-start-1 row-start-1 w-full bg-transparent border-none outline-none focus:outline-none text-[14px] leading-snug p-0 resize-none break-words break-all whitespace-pre-wrap overflow-y-auto max-h-[90px]"
                />
              </div>

              <button
                type="button"
                style={{ color: isDark ? '#8696a0' : '#54656f' }}
                className="hover:opacity-80 p-1 ml-1.5 shrink-0 cursor-pointer flex items-center justify-center rotate-[45deg]"
                title="Attach"
              >
                <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>

              {!((data.inputText || '').trim()) && (
                <button
                  type="button"
                  style={{ color: isDark ? '#8696a0' : '#54656f' }}
                  className="hover:opacity-80 p-1 ml-1 shrink-0 cursor-pointer flex items-center justify-center"
                  title="Camera"
                >
                  <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="3.75" />
                    <circle cx="18" cy="10" r="0.9" fill="currentColor" stroke="none" />
                  </svg>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleSendMessage}
              style={{
                backgroundColor: activeIconColor || '#00a884',
                color: '#ffffff',
              }}
              className="w-10.5 h-10.5 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-md hover:brightness-105 active:scale-95"
              title={(data.inputText || '').trim() ? (language === 'id' ? 'Kirim Pesan' : 'Send') : 'Voice message'}
            >
              {(data.inputText || '').trim() ? (
                <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                </svg>
              )}
            </button>
          </div>
        ) : (
          /* iOS WhatsApp Input Bar */
          <>
            <button
              type="button"
              style={{ color: inputBarIconColor }}
              className="hover:opacity-80 p-0.5 transition-opacity shrink-0 cursor-pointer flex items-center justify-center"
            >
              <svg className="w-6.5 h-6.5 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <line x1="12" y1="4" x2="12" y2="20" />
                <line x1="4" y1="12" x2="20" y2="12" />
              </svg>
            </button>

            <div
              style={{
                backgroundColor: useCustomColors
                  ? (typeof activeMainText === 'string' && (activeMainText.toLowerCase().startsWith('#f') || activeMainText.toLowerCase() === '#ffffff')
                      ? 'rgba(255, 255, 255, 0.18)'
                      : 'rgba(0, 0, 0, 0.07)')
                  : undefined,
                color: activeMainText,
                borderColor: useCustomColors
                  ? (typeof activeMainText === 'string' && (activeMainText.toLowerCase().startsWith('#f') || activeMainText.toLowerCase() === '#ffffff')
                      ? 'rgba(255, 255, 255, 0.25)'
                      : 'rgba(0, 0, 0, 0.12)')
                  : undefined,
              }}
              className={`relative flex-1 min-w-0 rounded-[18px] px-3 py-1 flex items-center text-[13.5px] border backdrop-blur-2xs transition-colors ${
                !useCustomColors && (isDark ? 'bg-black border-gray-700 text-slate-100' : 'bg-white border-gray-300 text-slate-900')
              }`}
            >
              <div className="grid grid-cols-1 flex-1 relative min-w-0 items-center">
                <span className={`col-start-1 row-start-1 invisible whitespace-pre-wrap break-words break-all text-[13.5px] leading-snug px-0 py-0 min-h-[18px] max-h-[90px] overflow-hidden ${
                  !((data.inputText || '').trim()) ? 'pr-6' : ''
                }`}>
                  {(data.inputText || '') + ' '}
                </span>
                <textarea
                  rows={1}
                  value={data.inputText ?? ''}
                  onChange={(e) => onChange?.({ ...data, inputText: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && (data.inputText || '').trim()) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder=""
                  style={{ color: activeMainText }}
                  className={`col-start-1 row-start-1 w-full bg-transparent border-none outline-none focus:outline-none text-[13.5px] leading-snug p-0 resize-none break-words break-all whitespace-pre-wrap overflow-y-auto max-h-[90px] ${
                    !((data.inputText || '').trim()) ? 'pr-7' : ''
                  } ${
                    !useCustomColors && (isDark ? 'text-slate-100' : 'text-slate-900')
                  }`}
                />
              </div>

              {!((data.inputText || '').trim()) && (
                <button
                  type="button"
                  style={{ color: inputBarIconColor }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-80 p-0.5 transition-opacity shrink-0 cursor-pointer flex items-center justify-center"
                  title="Sticker"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-current shrink-0">
                    <path d="M9.5 3H14.5C18.0899 3 21 5.91015 21 9.5V12.2C21 17.0601 17.0601 21 12.2 21H9.5C5.91015 21 3 18.0899 3 14.5V9.5C3 5.91015 5.91015 3 9.5 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12.2 20.8C12.6 19.8 12.7 18.6 12.7 17.2C12.7 14.3 14.3 12.7 17.2 12.7C18.6 12.7 19.8 12.6 20.8 12.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>

            {(data.inputText || '').trim() ? (
              <button
                type="button"
                onClick={handleSendMessage}
                style={{ backgroundColor: activeIconColor || '#007AFF' }}
                className="w-7.5 h-7.5 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-xs ml-0.5 hover:opacity-90"
                title={language === 'id' ? 'Kirim Pesan' : 'Send Message'}
              >
                <svg
                  className="w-3.5 h-3.5 ml-0.5"
                  style={{
                    fill: (activeIconColor?.toLowerCase() === '#ffffff' || activeIconColor?.toLowerCase() === '#fff') ? '#0b141a' : '#ffffff',
                  }}
                  viewBox="0 0 24 24"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            ) : (
              <div
                style={{ color: inputBarIconColor }}
                className="flex items-center space-x-1.5 shrink-0"
              >
                <button
                  type="button"
                  style={{ color: inputBarIconColor }}
                  className="p-0.5 hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center"
                  title="Camera"
                >
                  <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="3.75" />
                    <circle cx="18" cy="10" r="0.9" fill="currentColor" stroke="none" />
                  </svg>
                </button>
                <button type="button" className="hover:opacity-80 p-0.5 transition-opacity cursor-pointer" title="Microphone">
                  <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
