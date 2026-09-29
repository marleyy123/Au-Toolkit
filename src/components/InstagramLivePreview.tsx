import React, { useState, useEffect } from 'react';
import { InstagramLiveData } from '../types';
import { InstagramVerifiedBadge, LiveOptionsIcon, LiveQuestionIcon, LiveEyeIcon, InstagramSendIcon, InstagramHeartIcon } from './Icons';
import { ChevronDown, X } from 'lucide-react';
import { DEFAULT_AVATAR } from '../data/defaultTemplates';
import { AppleHeartEmoji, renderFormattedTextWithAppleEmojis } from '../utils/emojiUtils';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  data: InstagramLiveData;
  previewRef?: React.RefObject<HTMLDivElement>;
}

interface FloatingEmoji {
  id: number;
  symbol: string;
  left: number; // percentage 0-80
  scale: number;
}

export const InstagramLivePreview: React.FC<Props> = ({ data, previewRef }) => {
  const safeData = data || ({} as Partial<InstagramLiveData>);
  const { language } = useLanguage();
  const isId = language === 'id';
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);

  // Automatic spawner for floating live emojis (Love / Hearts only)
  useEffect(() => {
    if (safeData.isAutoEmojiEnabled === false) return;

    const symbols = ['❤️'];

    const interval = setInterval(() => {
      const newEmoji: FloatingEmoji = {
        id: Date.now() + Math.random(),
        symbol: symbols[0],
        left: Math.floor(Math.random() * 50), // horizontal spread in right area
        scale: 0.8 + Math.random() * 0.4,
      };

      setEmojis((prev) => [...prev.slice(-15), newEmoji]);
    }, 450);

    return () => clearInterval(interval);
  }, [safeData.isAutoEmojiEnabled]);

  // Clean up old emojis after animation completes
  useEffect(() => {
    if (emojis.length === 0) return;
    const timer = setTimeout(() => {
      setEmojis((prev) => prev.filter((e) => Date.now() - e.id < 2200));
    }, 2200);
    return () => clearTimeout(timer);
  }, [emojis]);

  return (
    <div className="flex justify-center w-full">
      {/* Embedded style block for floatUp keyframe animation */}
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0px) scale(0.8);
            opacity: 1;
          }
          50% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(-160px) scale(1.2);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: floatUp 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>

      {/* Main Container: Mobile viewport with dynamic corner radius */}
      <div
        ref={previewRef}
        id="preview-target"
        style={{
          borderRadius: 'var(--preview-corner-radius, 0px)',
        }}
        className="w-[380px] min-w-[380px] max-w-[380px] mx-auto aspect-[9/16] bg-slate-950 relative overflow-hidden shadow-2xl flex flex-col justify-between text-white select-none shrink-0"
      >
        {/* Background Live Stream Media / Gradient */}
        {safeData.mediaImage && safeData.mediaImage.trim() !== '' ? (
          <img
            src={safeData.mediaImage.trim()}
            alt="Live Stream"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900 via-slate-900 to-black z-0 flex items-center justify-center">
            {/* Ambient Live Glow */}
            <div className="w-64 h-64 rounded-full bg-rose-600/20 blur-3xl" />
          </div>
        )}

        {/* Dark Vignette Overlay for crisp UI text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-10" />

        {/* Top Header Layer (No status bar) */}
        <div className="relative z-20 w-full flex flex-col pt-3">
          {/* Header Bar */}
          <div className="px-3.5 py-1.5 flex items-center justify-between">
            {/* Kiri: Foto profil, username, verified badge, panah bawah */}
            <div className="flex items-center space-x-2">
              <img
                src={(safeData.avatar && safeData.avatar.trim() !== '') ? safeData.avatar : DEFAULT_AVATAR}
                alt={safeData.username || 'Avatar'}
                className="w-9 h-9 rounded-full object-cover border border-white/20 shadow-sm shrink-0"
              />
              <div className="flex items-center space-x-1">
                <span className="font-bold text-white text-sm tracking-tight drop-shadow-sm">
                  {renderFormattedTextWithAppleEmojis(safeData.username || 'username')}
                </span>
                {safeData.verified === 'ig-blue' && (
                  <InstagramVerifiedBadge className="w-3.5 h-3.5" />
                )}
                <ChevronDown className="w-4 h-4 text-white/80 shrink-0" />
              </div>
            </div>

            {/* Kanan: Badge LIVE, Viewers Count, Tombol X */}
            <div className="flex items-center space-x-2">
              {/* Badge Merah LIVE */}
              <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white font-extrabold text-[11px] tracking-wide px-2 py-0.5 rounded-xs uppercase shadow-sm">
                LIVE
              </div>

              {/* Viewer Count */}
              <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-sm flex items-center space-x-1.5 text-white text-xs font-semibold">
                <LiveEyeIcon className="w-3.5 h-3.5 text-white" />
                <span>{safeData.viewerCount || '80'}</span>
              </div>

              {/* Close Icon X */}
              <button className="p-1 text-white hover:opacity-80 transition-opacity">
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Area Interaksi Bawah (Flex Column Overlay) */}
        <div className="relative z-20 w-full mt-auto flex flex-col">
          {/* Middle Floating Emojis & Comments Section */}
          <div className="relative w-full px-4 pb-2 flex items-end justify-between min-h-[180px]">
            {/* Daftar Komentar (Kiri) */}
            <div className="flex-1 max-w-[75%] space-y-2 flex flex-col justify-end max-h-[180px] overflow-hidden pointer-events-none z-10">
              {safeData.comments && safeData.comments.length > 0 ? (
                safeData.comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-2">
                    {comment.type === 'join' ? (
                      <div className="text-white/90 text-xs font-medium drop-shadow-md">
                        <span className="font-bold text-white">
                          {renderFormattedTextWithAppleEmojis(comment.username || 'viewer_user')}
                        </span> {isId ? 'bergabung' : 'joined'}
                      </div>
                    ) : (
                      <div className="flex items-start space-x-2 bg-black/20 backdrop-blur-xs px-2 py-1 rounded-xl max-w-full">
                        <img
                          src={(comment.avatar && comment.avatar.trim() !== '') ? comment.avatar : DEFAULT_AVATAR}
                          alt={comment.username || 'user'}
                          className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                        />
                        <div className="text-xs leading-tight flex flex-col">
                          <span className="font-bold text-white">
                            {renderFormattedTextWithAppleEmojis(comment.username || 'user_comment')}
                          </span>
                          <span className="text-white/95 font-normal drop-shadow-sm mt-0.5">
                            {renderFormattedTextWithAppleEmojis(comment.content || 'Semangat')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-white/70 text-xs font-medium">{isId ? 'Belum ada komentar' : 'No comments yet'}</div>
              )}
            </div>

            {/* Floating Emojis Container (Kanan - Love Emojis Only) */}
            <div className="absolute right-2 bottom-16 w-12 h-64 pointer-events-none z-20 overflow-visible flex flex-col items-center justify-end">
              {emojis.map((emoji) => (
                <div
                  key={emoji.id}
                  className="absolute bottom-0 animate-float-up select-none"
                  style={{
                    left: `${emoji.left}%`,
                    transform: `scale(${emoji.scale})`,
                  }}
                >
                  <AppleHeartEmoji className="w-8 h-8 object-contain drop-shadow-md select-none pointer-events-none" />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center space-x-2 w-full">
            {/* Kiri: Input teks kapsul */}
            <div className="flex-1 bg-transparent border border-white/40 rounded-full px-3.5 py-2 text-xs text-white placeholder-white/70 flex items-center">
              <span className="text-white/80 font-normal">{isId ? 'Tambahkan komentar...' : 'Add a comment...'}</span>
            </div>

            {/* Kanan: Jejeran 4 Ikon (Tiga titik, Q&A, Pesawat Kertas, Hati) */}
            <div className="flex items-center space-x-2 text-white shrink-0">
              {/* 1. Tiga Titik Horizontal */}
              <button className="p-1 hover:opacity-80 transition-opacity">
                <LiveOptionsIcon className="w-6 h-6 text-white" />
              </button>

              {/* 2. Q&A (Tanda tanya dalam lingkaran) */}
              <button className="p-1 hover:opacity-80 transition-opacity">
                <LiveQuestionIcon className="w-6 h-6 text-white" />
              </button>

              {/* 3. Pesawat Kertas (Share) */}
              <button className="p-1 hover:opacity-80 transition-opacity">
                <InstagramSendIcon className="w-6 h-6 text-white" />
              </button>

              {/* 4. Hati (Love/Like) */}
              <button className="p-1 hover:opacity-80 transition-opacity">
                <InstagramHeartIcon className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

