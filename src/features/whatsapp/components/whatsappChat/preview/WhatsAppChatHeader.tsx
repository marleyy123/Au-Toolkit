import React from 'react';
import { WhatsAppChatData } from '../../../../../types';
import { DEFAULT_AVATAR } from '../../../../../data/defaultTemplates';
import { renderIosEmojis } from './whatsAppPreviewHelpers';

interface Props {
  data: WhatsAppChatData;
  effectiveHeaderBg: string;
  effectiveHeaderTextColor: string;
  effectiveHeaderIconColor: string;
  effectiveHeaderSecText: string;
  isAndroid: boolean;
  language: string;
}

export const WhatsAppChatHeader: React.FC<Props> = ({
  data,
  effectiveHeaderBg,
  effectiveHeaderTextColor,
  effectiveHeaderIconColor,
  effectiveHeaderSecText,
  isAndroid,
  language,
}) => {
  const {
    contactName = '',
    contactAvatar = '',
    statusText = '',
    isGroupChat = false,
    groupParticipants = '',
  } = data;

  return (
    <div
      style={{
        backgroundColor: effectiveHeaderBg,
        borderColor: 'transparent',
        color: effectiveHeaderTextColor,
      }}
      className="px-2 py-1.5 min-h-[50px] flex items-center justify-between shrink-0 border-b-0 z-20 transition-colors shadow-2xs"
    >
      {/* Left: Back button + Avatar + Contact Info */}
      <div className="flex items-center min-w-0">
        <button
          type="button"
          style={{ color: effectiveHeaderIconColor }}
          className="hover:opacity-80 transition-opacity p-1 flex items-center justify-center shrink-0 cursor-pointer"
          title="Back"
        >
          {isAndroid ? (
            <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          )}
        </button>

        <div className="flex items-center space-x-2 ml-0.5 min-w-0">
          <div className="w-8.5 h-8.5 rounded-full overflow-hidden bg-slate-200 shrink-0">
            <img
              src={(contactAvatar && contactAvatar.trim() !== '') ? contactAvatar : DEFAULT_AVATAR}
              alt={contactName || 'Avatar'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0 justify-center">
            <h2
              style={{ color: effectiveHeaderTextColor }}
              className="text-[14.5px] font-semibold tracking-tight leading-tight truncate max-w-[155px] block"
            >
              {renderIosEmojis(
                (contactName && contactName.trim() !== '')
                  ? contactName
                  : (isGroupChat ? 'Group Name' : 'Name')
              )}
            </h2>
            <span
              style={{ color: effectiveHeaderSecText }}
              className="text-[10.5px] font-normal leading-tight truncate max-w-[155px] -mt-0.5 opacity-90"
            >
              {renderIosEmojis(
                isGroupChat
                  ? ((groupParticipants || '').trim() !== '' ? groupParticipants : (language === 'id' ? 'Siti, Budi, Andi, Anda' : 'Siti, Budi, Andi, You'))
                  : ((statusText || '').trim() !== '' ? statusText : (data.isOnline !== false ? 'online' : 'offline'))
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Right Header Icons */}
      <div
        style={{ color: effectiveHeaderIconColor }}
        className="flex items-center space-x-3.5 pr-1.5"
      >
        <button type="button" className="hover:opacity-80 transition-opacity cursor-pointer">
          {isAndroid ? (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
            </svg>
          ) : (
            <svg className="w-5.5 h-5.5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="3" ry="3" />
            </svg>
          )}
        </button>
        <button type="button" className="hover:opacity-80 transition-opacity cursor-pointer">
          {isAndroid ? (
            <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57c.27-.27.35-.65.24-1.01A11.36 11.36 0 0 1 8.5 4.31c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-.99-1.01z" />
            </svg>
          ) : (
            <svg className="w-4.5 h-4.5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          )}
        </button>
        {isAndroid && (
          <button type="button" className="hover:opacity-80 transition-opacity cursor-pointer">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="12" cy="19" r="1.8" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
