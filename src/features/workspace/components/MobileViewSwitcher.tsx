import React from 'react';
import { Eye, PictureInPicture2 } from 'lucide-react';
import type { AppLanguage } from '../../../context/LanguageContext';
import type { UiTheme } from '../../../context/ThemeContext';

type MobileView = 'editor' | 'preview';

interface MobileViewSwitcherProps {
  uiTheme: UiTheme;
  language: AppLanguage;
  mobileView: MobileView;
  setMobileView: React.Dispatch<React.SetStateAction<MobileView>>;
  isMobileFloatingPreviewOpen: boolean;
  setMobileFloatingPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const MobileViewSwitcher: React.FC<MobileViewSwitcherProps> = ({
  uiTheme,
  language,
  mobileView,
  setMobileView,
  isMobileFloatingPreviewOpen,
  setMobileFloatingPreviewOpen,
}) => (
  <div className={`lg:hidden shrink-0 max-w-7xl mx-auto w-full flex items-center gap-2 pt-2 mt-2 border-t ${
    uiTheme === 'dark' ? 'border-slate-800/80' : 'border-slate-200/80'
  }`}>
    <button
      type="button"
      onClick={() => setMobileView('editor')}
      className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl text-center transition-all cursor-pointer shadow-xs flex items-center justify-center space-x-1.5 ${
        mobileView === 'editor'
          ? 'bg-purple-600 text-white shadow-purple-500/25'
          : uiTheme === 'dark'
          ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
      }`}
      title={language === 'id' ? 'Tampilkan Form Input (Geser layar ke kiri/kanan untuk beralih cepat)' : 'Show Form Input (Swipe screen left/right to toggle)'}
    >
      <span>{language === 'id' ? 'Form Input' : 'Form Input'}</span>
    </button>
    <button
      type="button"
      onClick={() => setMobileView('preview')}
      className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl text-center flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs ${
        mobileView === 'preview'
          ? 'bg-purple-600 text-white shadow-purple-500/25'
          : uiTheme === 'dark'
          ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
      }`}
      title={language === 'id' ? 'Tampilkan Pratinjau Langsung (Geser layar ke kiri/kanan untuk beralih cepat)' : 'Show Live Preview (Swipe screen left/right to toggle)'}
    >
      <Eye className="w-3.5 h-3.5 shrink-0" />
      <span>{language === 'id' ? 'Pratinjau Langsung' : 'Live Preview'}</span>
    </button>
    <button
      type="button"
      onClick={() => {
        setMobileFloatingPreviewOpen(!isMobileFloatingPreviewOpen);
        if (!isMobileFloatingPreviewOpen) setMobileView('editor');
      }}
      className={`shrink-0 py-2 px-3 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 ${
        isMobileFloatingPreviewOpen
          ? 'bg-purple-600 text-white shadow-purple-500/25'
          : uiTheme === 'dark'
            ? 'bg-slate-800/80 text-slate-300 hover:text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
      title={language === 'id' ? 'Buka/tutup Floating Live Preview' : 'Toggle Floating Live Preview'}
      aria-pressed={isMobileFloatingPreviewOpen}
    >
      <PictureInPicture2 className="w-3.5 h-3.5" />
    </button>
  </div>
);

