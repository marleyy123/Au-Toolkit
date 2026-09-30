import React from 'react';
import { FormRegistry } from '../../../export/FormRegistry';
import { CharacterPreset, AUFolder, PlatformTab } from '../../../types';
import { GlobalFontManager, FontOptionKey } from '../../../components/GlobalFontManager';
import { UiTheme } from '../../../context/ThemeContext';

interface EditorFormPanelProps {
  uiTheme: UiTheme;
  language: 'id' | 'en';
  mobileView: 'editor' | 'preview';
  globalFont: FontOptionKey;
  customFontName: string;
  activeTab: PlatformTab;
  formData: any;
  characters: Array<CharacterPreset | AUFolder>;
  activeCharacterId: string;
  onSelectFont: (font: FontOptionKey) => void;
  onCustomFontUploaded: (fontName: string) => void;
  onFormChange: (updated: any) => void;
  onSaveCharacter: () => void;
  onSaveProfile: () => void;
  onSelectCharacter: (character: CharacterPreset | AUFolder) => void;
  onDeleteCharacter: (id: string) => void;
  onRenameCharacter: (id: string, name: string) => void;
}

export const EditorFormPanel: React.FC<EditorFormPanelProps> = ({
  uiTheme,
  language,
  mobileView,
  globalFont,
  customFontName,
  activeTab,
  formData,
  characters,
  activeCharacterId,
  onSelectFont,
  onCustomFontUploaded,
  onFormChange,
  onSaveCharacter,
  onSaveProfile,
  onSelectCharacter,
  onDeleteCharacter,
  onRenameCharacter,
}) => (
  <section
    id="customization-panel"
    className={`customization-editor-panel dual-scroll-panel no-scrollbar scrollbar-none overscroll-y-contain lg:col-span-6 xl:col-span-5 space-y-4 lg:h-full lg:overflow-y-auto lg:pr-3 lg:pb-4 transition-all ${
      mobileView === 'preview' ? 'hidden lg:block' : 'block animate-in fade-in-50 duration-200'
    }`}
    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
  >
    <div className={`flex items-center justify-between pb-2 border-b ${
      uiTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
    }`}>
      <div>
        <h2 className={`text-sm font-bold uppercase tracking-wider ${
          uiTheme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>{language === 'id' ? 'Panel Kustomisasi' : 'Customization Panel'}</h2>
        <p className={`text-xs ${
          uiTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>{language === 'id' ? 'Edit detail karakter, konten & metrik secara real-time' : 'Edit character details, content & metrics in real-time'}</p>
      </div>
    </div>

    <GlobalFontManager
      selectedFont={globalFont}
      onSelectFont={onSelectFont}
      customFontName={customFontName}
      onCustomFontUploaded={onCustomFontUploaded}
    />

    <FormRegistry
      activeTab={activeTab}
      data={formData}
      onChange={onFormChange}
      characters={characters}
      activeCharacterId={activeCharacterId}
      onSaveCharacter={onSaveCharacter}
      onSaveProfile={onSaveProfile}
      onSelectCharacter={onSelectCharacter}
      onDeleteCharacter={onDeleteCharacter}
      onRenameCharacter={onRenameCharacter}
    />
  </section>
);
