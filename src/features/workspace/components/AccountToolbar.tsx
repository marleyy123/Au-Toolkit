import React from 'react';
import { KeyRound, Loader2, LogOut, Moon, RotateCcw, Sun, Languages } from 'lucide-react';
import type { AppLanguage } from '../../../context/LanguageContext';
import type { UiTheme } from '../../../context/ThemeContext';

interface AccountToolbarProps {
  uiTheme: UiTheme;
  language: AppLanguage;
  authUser: any;
  isLoggingOut: boolean;
  toggleLanguage: () => void;
  handleToggleTheme: () => void;
  handleLogout: () => void;
  setIsPasswordModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsResetConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AccountToolbar: React.FC<AccountToolbarProps> = ({
  uiTheme,
  language,
  authUser,
  isLoggingOut,
  toggleLanguage,
  handleToggleTheme,
  handleLogout,
  setIsPasswordModalOpen,
  setIsResetConfirmOpen,
}) => (
  <div className="flex max-w-full flex-col items-start gap-1.5 shrink-0">
    <div className="flex max-w-full flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={toggleLanguage}
        className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all border cursor-pointer shrink-0 ${
          uiTheme === 'dark'
            ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700 shadow-xs'
            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 shadow-xs'
        }`}
        title={`Switch language (${language === 'en' ? 'English' : 'Bahasa Indonesia'})`}
      >
        <Languages className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span>{language === 'en' ? 'EN' : 'ID'}</span>
      </button>

      <button
        type="button"
        id="global-theme-indicator-btn"
        onClick={handleToggleTheme}
        className={`px-3 py-1.5 rounded-xl font-medium text-xs flex items-center space-x-1.5 transition-all border cursor-pointer shrink-0 select-none ${
          uiTheme === 'dark'
            ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:border-purple-500/70 shadow-xs'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-amber-400/70 shadow-xs'
        }`}
        title={
          uiTheme === 'dark'
            ? (language === 'en' ? 'Editor Theme: Dark (Click to switch to Light Mode)' : 'Tema Editor: Dark (Klik untuk beralih ke Light Mode)')
            : (language === 'en' ? 'Editor Theme: Light (Click to switch to Dark Mode)' : 'Tema Editor: Light (Klik untuk beralih ke Dark Mode)')
        }
      >
        {uiTheme === 'dark' ? (
          <>
            <Moon className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20 shrink-0" />
            <span className="font-medium text-slate-200">Dark</span>
          </>
        ) : (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
            <span className="font-medium text-slate-700">Light</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => setIsResetConfirmOpen(true)}
        className={`lg:hidden px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all border cursor-pointer shrink-0 shadow-2xs ${
          uiTheme === 'dark'
            ? 'bg-rose-950/50 text-rose-300 border-rose-900/80 hover:bg-rose-900/70 hover:text-white'
            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
        }`}
        title={language === 'id' ? 'Reset Total (Bersihkan seluruh data & cache)' : 'Hard Reset (Clear all data & cache)'}
      >
        <RotateCcw className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span>{language === 'id' ? 'Reset Total' : 'Hard Reset'}</span>
      </button>
    </div>

    <div className="flex max-w-full items-center gap-1.5 relative">
      <div className={`flex max-w-full flex-wrap items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs ${
        uiTheme === 'dark'
          ? 'bg-purple-950/40 text-purple-200 border-purple-800/60'
          : 'bg-purple-50 text-purple-800 border-purple-200 shadow-xs'
      }`}>
        {authUser?.photoURL && authUser.photoURL.trim() !== '' ? (
          <img
            src={authUser.photoURL.trim()}
            alt={authUser.displayName || 'User'}
            className="w-4 h-4 rounded-full object-cover shrink-0 ring-1 ring-purple-400"
          />
        ) : (
          <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
            {(authUser?.displayName || authUser?.email || localStorage.getItem('au_user_email') || 'A').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex min-w-0 flex-col text-left leading-tight">
          <span className="font-bold text-[11px] truncate max-w-[85px] sm:max-w-[120px]" title={authUser?.email || localStorage.getItem('au_user_email') || ''}>
            {authUser?.displayName || authUser?.email?.split('@')[0] || (localStorage.getItem('au_user_email') || '').split('@')[0] || 'Member'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsPasswordModalOpen(true)}
          className={`ml-1 px-2.5 py-1 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all border cursor-pointer select-none active:scale-95 shadow-2xs ${
            uiTheme === 'dark'
              ? 'bg-slate-800 text-slate-200 border-slate-700 hover:border-purple-500 hover:text-purple-300'
              : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:text-purple-700'
          }`}
          title={language === 'id' ? 'Ubah password akun' : 'Change account password'}
        >
          <KeyRound className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Password</span>
        </button>
        <button
          type="button"
          id="btn-account-logout"
          disabled={isLoggingOut}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
          }}
          className={`ml-1 px-2.5 py-1 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all border cursor-pointer select-none active:scale-95 shadow-2xs ${
            uiTheme === 'dark'
              ? 'bg-rose-950/60 text-rose-300 border-rose-800/80 hover:bg-rose-900 hover:text-white'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:text-rose-900'
          }`}
          title={language === 'id' ? 'Keluar dari akun Anda' : 'Log out from your account'}
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500 shrink-0" />
              <span>{language === 'id' ? 'Keluar...' : 'Logging out...'}</span>
            </>
          ) : (
            <>
              <LogOut className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Log Out</span>
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

