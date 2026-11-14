import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface Props {
  isOutgoing: boolean;
  canMoveUp: boolean;
  canMoveDown?: boolean;
  onMoveUp: () => void;
  onMoveDown?: () => void;
  onToggleSide: () => void;
  theme?: 'dark' | 'light';
  platform?: 'whatsapp' | 'instagram' | 'tiktok' | 'line';
}

export const ChatBubbleShiftControls: React.FC<Props> = ({
  isOutgoing,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onToggleSide,
}) => {
  return (
    <div
      data-html2canvas-ignore="true"
      className="chat-shift-controls pointer-events-none select-none print:hidden"
    >
      {/* Kontrol Bulat Ungu: Panah ke Kiri, Panah ke Kanan, Panah ke Atas, Panah ke Bawah */}
      <div
        className={`absolute z-40 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-150 flex items-center gap-1.5 pointer-events-auto ${
          isOutgoing ? '-top-3.5 right-1' : '-top-3.5 left-1'
        }`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {/* Bulatan Ungu: Panah ke Kiri (Pindah ke sisi Kiri / Penerima) */}
        <button
          type="button"
          disabled={!isOutgoing}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isOutgoing) onToggleSide();
          }}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md transition-all border border-white/20 ${
            isOutgoing
              ? 'bg-purple-600 hover:bg-purple-500 hover:scale-110 active:scale-95 cursor-pointer'
              : 'bg-purple-900/40 text-purple-300/40 border-purple-700/30 opacity-40 cursor-not-allowed'
          }`}
          title={isOutgoing ? 'Pindah ke Kiri (Penerima)' : 'Pesan sudah di sisi kiri'}
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.8]" />
        </button>

        {/* Bulatan Ungu: Panah ke Kanan (Pindah ke sisi Kanan / Pengirim) */}
        <button
          type="button"
          disabled={isOutgoing}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isOutgoing) onToggleSide();
          }}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md transition-all border border-white/20 ${
            !isOutgoing
              ? 'bg-purple-600 hover:bg-purple-500 hover:scale-110 active:scale-95 cursor-pointer'
              : 'bg-purple-900/40 text-purple-300/40 border-purple-700/30 opacity-40 cursor-not-allowed'
          }`}
          title={!isOutgoing ? 'Pindah ke Kanan (Pengirim)' : 'Pesan sudah di sisi kanan'}
        >
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.8]" />
        </button>

        {/* Bulatan Ungu: Panah ke Atas (Geser Urutan ke Atas) */}
        <button
          type="button"
          disabled={!canMoveUp}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (canMoveUp) onMoveUp();
          }}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md transition-all border border-white/20 ${
            canMoveUp
              ? 'bg-purple-600 hover:bg-purple-500 hover:scale-110 active:scale-95 cursor-pointer'
              : 'bg-purple-900/40 text-purple-300/40 border-purple-700/30 opacity-40 cursor-not-allowed'
          }`}
          title={canMoveUp ? 'Geser ke Atas' : 'Sudah di paling atas'}
        >
          <ArrowUp className="w-3.5 h-3.5 stroke-[2.8]" />
        </button>

        {/* Bulatan Ungu: Panah ke Bawah (Geser Urutan ke Bawah) */}
        <button
          type="button"
          disabled={!canMoveDown}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (canMoveDown && onMoveDown) onMoveDown();
          }}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md transition-all border border-white/20 ${
            canMoveDown
              ? 'bg-purple-600 hover:bg-purple-500 hover:scale-110 active:scale-95 cursor-pointer'
              : 'bg-purple-900/40 text-purple-300/40 border-purple-700/30 opacity-40 cursor-not-allowed'
          }`}
          title={canMoveDown ? 'Geser ke Bawah' : 'Sudah di paling bawah'}
        >
          <ArrowDown className="w-3.5 h-3.5 stroke-[2.8]" />
        </button>
      </div>
    </div>
  );
};
