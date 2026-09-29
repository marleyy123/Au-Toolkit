import React from 'react';
import { InstagramStoryReplyData, CharacterPreset } from '../types';
import { CharacterSelector, ImageUploader, SaveProfileButton } from './FormControls';
import { Sun, Moon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  data: InstagramStoryReplyData;
  onChange: (updated: InstagramStoryReplyData) => void;
  characters?: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter?: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter?: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const InstagramStoryReplyForm: React.FC<Props> = ({
  data,
  onChange,
  characters,
  activeCharacterId,
  onSaveCharacter,
  onSaveProfile,
  onSelectCharacter,
  onDeleteCharacter,
  onRenameCharacter,
}) => {
  const { language } = useLanguage();
  const isId = language === 'id';

  const updateField = <K extends keyof InstagramStoryReplyData>(
    key: K,
    value: InstagramStoryReplyData[K]
  ) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-200">
      {/* Quick Character Presets */}
      <CharacterSelector
        characters={characters || []}
        activeCharacterId={activeCharacterId}
        onSelect={onSelectCharacter}
        onSaveCurrent={onSaveCharacter}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      {/* Profile & Story Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {isId ? 'Info Akun & Cerita' : 'Account & Story Info'}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isId ? 'Nama Pengguna' : 'Username'}
            </label>
            <input
              type="text"
              value={data.username || ''}
              onChange={(e) => updateField('username', e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
              placeholder="ramadhniap_"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isId ? 'Tema Keyboard' : 'Keyboard Theme'}
            </label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => updateField('theme', 'light')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                  data.theme === 'light'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{isId ? 'Terang' : 'Light'}</span>
              </button>
              <button
                type="button"
                onClick={() => updateField('theme', 'dark')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                  (data.theme || 'dark') === 'dark'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{isId ? 'Gelap' : 'Dark'}</span>
              </button>
            </div>
          </div>
        </div>

        <ImageUploader
          label={isId ? 'Foto Profil Avatar' : 'Profile Picture Avatar'}
          value={data.avatarUrl || ''}
          onChange={(val) => updateField('avatarUrl', val)}
        />

        <ImageUploader
          label={isId ? 'Gambar Latar Cerita' : 'Story Background Image'}
          value={data.storyImageUrl || data.storyImage || data.backgroundImage || data.bgImage || ''}
          onChange={(val) => {
            updateField('storyImageUrl', val);
            updateField('storyImage', val);
          }}
          aspectHint={isId ? 'Vertikal 9:16 (Resolusi HD Penuh)' : '9:16 Vertical (Full HD Native)'}
          skipCompression={true}
        />
      </div>

      {/* Story Progress Bar Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {isId ? 'Pengaturan Indikator Progres Cerita' : 'Story Progress Bar Settings'}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isId ? 'Jumlah Garis Cerita (1 - 10)' : 'Number of Story Lines (1 - 10)'}
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={data.storySegmentsCount ?? 3}
              onChange={(e) => {
                const count = Math.max(1, Math.min(10, Number(e.target.value) || 1));
                const activeIdx = Math.min(data.activeSegmentIndex ?? 1, count);
                onChange({
                  ...data,
                  storySegmentsCount: count,
                  activeSegmentIndex: activeIdx,
                });
              }}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isId ? 'Indeks Garis Aktif' : 'Active Line Index'}
            </label>
            <input
              type="number"
              min={1}
              max={data.storySegmentsCount ?? 3}
              value={data.activeSegmentIndex ?? 1}
              onChange={(e) => {
                const max = data.storySegmentsCount ?? 3;
                const idx = Math.max(1, Math.min(max, Number(e.target.value) || 1));
                updateField('activeSegmentIndex', idx);
              }}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {isId ? 'Progres Garis Aktif (%)' : 'Active Line Progress (%)'}
            </label>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
              {data.activeSegmentProgress ?? 70}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={data.activeSegmentProgress ?? 70}
            onChange={(e) => updateField('activeSegmentProgress', Number(e.target.value))}
            className="w-full accent-purple-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Reply Message & Reactions Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {isId ? 'Pesan & Reaksi Cepat' : 'Message & Quick Reactions'}
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {isId ? 'Teks Balasan Cerita / Komentar' : 'Story Reply / Comment Text'}
          </label>
          <input
            type="text"
            value={data.messageText || ''}
            onChange={(e) => updateField('messageText', e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
            placeholder={isId ? 'Tulis teks pesan balasan...' : 'Your text goes here...'}
          />
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showQuickReactions ?? true}
              onChange={(e) => updateField('showQuickReactions', e.target.checked)}
              className="rounded-xs text-purple-600 focus:ring-purple-500 w-4 h-4 accent-purple-600"
            />
            <span>{isId ? 'Tampilkan Emoji Reaksi Cepat (Kotak 6)' : 'Show Quick Reaction Emojis (6 Grid)'}</span>
          </label>

          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showKeyboard ?? true}
              onChange={(e) => updateField('showKeyboard', e.target.checked)}
              className="rounded-xs text-purple-600 focus:ring-purple-500 w-4 h-4 accent-purple-600"
            />
            <span>{isId ? 'Tampilkan Mockup Keyboard iOS' : 'Show iOS Keyboard Mockup'}</span>
          </label>
        </div>
      </div>

      <SaveProfileButton onSave={onSaveProfile} />
    </div>
  );
};
