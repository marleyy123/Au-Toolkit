import React from 'react';
import { RotateCcw } from 'lucide-react';
import { AuBrand } from '../../../components/AuBrand';
import type { AppLanguage } from '../../../context/LanguageContext';
import type { UiTheme } from '../../../context/ThemeContext';
import type { PlatformGroup, PlatformTab } from '../../../types';
import { AccountToolbar } from './AccountToolbar';
import { MobileViewSwitcher } from './MobileViewSwitcher';
import { PlatformCategoryNav } from './PlatformCategoryNav';
import { SubFeatureNavigation } from './SubFeatureNavigation';

type MobileView = 'editor' | 'preview';

interface AppHeaderProps {
  uiTheme: UiTheme;
  language: AppLanguage;
  activeCategory: PlatformGroup;
  activeTab: PlatformTab;
  mobileView: MobileView;
  isMobileFloatingPreviewOpen: boolean;
  authUser: any;
  isLoggingOut: boolean;
  toggleLanguage: () => void;
  handleToggleTheme: () => void;
  handleLogout: () => void;
  setActiveCategory: React.Dispatch<React.SetStateAction<PlatformGroup>>;
  setActiveTab: React.Dispatch<React.SetStateAction<PlatformTab>>;
  setMobileView: React.Dispatch<React.SetStateAction<MobileView>>;
  setMobileFloatingPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPasswordModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsResetConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  uiTheme,
  language,
  activeCategory,
  activeTab,
  mobileView,
  isMobileFloatingPreviewOpen,
  authUser,
  isLoggingOut,
  toggleLanguage,
  handleToggleTheme,
  handleLogout,
  setActiveCategory,
  setActiveTab,
  setMobileView,
  setMobileFloatingPreviewOpen,
  setIsPasswordModalOpen,
  setIsResetConfirmOpen,
}) => (
  <header className={`au-editor-header shrink-0 sticky top-0 z-40 backdrop-blur-md border-b py-2.5 sm:py-3 transition-colors ${
    uiTheme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200 shadow-xs'
  }`}>
    <div className="w-full flex flex-col gap-1.5">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 items-center space-x-3 pt-0.5">
          <AuBrand className="au-editor-brand-mark shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className={`font-extrabold text-base lg:text-lg tracking-tight leading-tight ${
                uiTheme === 'dark' ? 'bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent' : 'text-slate-900'
              }`}>
                AU Toolkit
              </h1>
            </div>
            <p className={`text-[11px] hidden sm:block leading-tight ${
              uiTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Fake social media generator for Alternate Universe writers & storytellers
            </p>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-col lg:flex-row items-start gap-2.5">
          <div className="flex w-full min-w-0 flex-col items-start gap-1.5 lg:flex-1">
            <PlatformCategoryNav
              uiTheme={uiTheme}
              activeCategory={activeCategory}
              activeTab={activeTab}
              setActiveCategory={setActiveCategory}
              setActiveTab={setActiveTab}
              setMobileView={setMobileView}
            />

            <div className="hidden lg:flex items-center">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all border-0 cursor-pointer shrink-0 bg-red-600 text-white hover:bg-red-700 shadow-sm"
                title={language === 'id' ? 'Reset Total (Bersihkan seluruh data & cache)' : 'Hard Reset (Clear all data & cache)'}
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>{language === 'id' ? 'Reset Total' : 'Hard Reset'}</span>
              </button>
            </div>
          </div>

          <AccountToolbar
            uiTheme={uiTheme}
            language={language}
            authUser={authUser}
            isLoggingOut={isLoggingOut}
            toggleLanguage={toggleLanguage}
            handleToggleTheme={handleToggleTheme}
            handleLogout={handleLogout}
            setIsPasswordModalOpen={setIsPasswordModalOpen}
            setIsResetConfirmOpen={setIsResetConfirmOpen}
          />
        </div>
      </div>
    </div>

    <SubFeatureNavigation
      uiTheme={uiTheme}
      language={language}
      activeCategory={activeCategory}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      setMobileView={setMobileView}
    />

    <MobileViewSwitcher
      uiTheme={uiTheme}
      language={language}
      mobileView={mobileView}
      setMobileView={setMobileView}
      isMobileFloatingPreviewOpen={isMobileFloatingPreviewOpen}
      setMobileFloatingPreviewOpen={setMobileFloatingPreviewOpen}
    />
  </header>
);

