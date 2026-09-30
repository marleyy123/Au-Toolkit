import React from 'react';
import { WhatsAppCallData, CharacterPreset } from '../../../types';
import { CharacterSelector, ImageUploader, SaveProfileButton } from '../../../components/FormControls';
import { Phone, Clock, Layout, Volume2, MicOff, Video, Moon, Sun } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface Props {
  data: WhatsAppCallData;
  onChange: (updated: WhatsAppCallData) => void;
  characters: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const WhatsAppCallForm: React.FC<Props> = ({
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
  const { language, t } = useLanguage();
  const isId = language === 'id';

  const updateField = <K extends keyof WhatsAppCallData>(key: K, value: WhatsAppCallData[K]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-200">
      {/* Quick AU Character Presets */}
      <CharacterSelector
        characters={characters}
        activeCharacterId={activeCharacterId}
        onSelect={onSelectCharacter}
        onSaveCurrent={onSaveCharacter}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      {/* 1. CALL HEADER & CONTACT INFO */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center space-x-1.5">
          <Phone className="w-3.5 h-3.5 text-purple-600" />
          <span>{isId ? 'Info Kontak & Panggilan' : 'Call Header & Contact Info'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              {t('common.name', 'Display Name / Title')}
            </label>
            <input
              type="text"
              value={data.contactName || ''}
              onChange={(e) => updateField('contactName', e.target.value)}
              placeholder={isId ? 'cth. 🤍 atau Nama Kontak' : 'e.g. 🤍 or Contact Name'}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('common.callDuration', 'Call Duration')}</span>
            </label>
            <input
              type="text"
              value={data.callDuration || ''}
              onChange={(e) => updateField('callDuration', e.target.value)}
              placeholder="02:20:19"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
            />
          </div>
        </div>

        {/* Status Subtext Option */}
        <div>
          <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
            {isId ? 'Teks Status (Opsional)' : 'Status Subtext (Optional)'}
          </label>
          <input
            type="text"
            value={data.callStatusText || ''}
            onChange={(e) => updateField('callStatusText', e.target.value)}
            placeholder={isId ? 'cth. Terenkripsi secara end-to-end' : 'e.g. End-to-end encrypted (leave empty if not needed)'}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Contact Profile Picture */}
        <ImageUploader
          label={isId ? 'Foto Profil Kontak (Avatar Besar)' : 'Contact Profile Picture (Large Avatar)'}
          value={data.contactAvatar || ''}
          onChange={(url) => updateField('contactAvatar', url)}
          onClear={() => updateField('contactAvatar', '')}
          aspectRatio="1:1"
        />

        {/* Custom Call Wallpaper Background */}
        <ImageUploader
          label={isId ? 'Wallpaper Latar Panggilan (Opsional)' : 'Custom Call Wallpaper Background (Optional)'}
          value={data.callWallpaper || ''}
          onChange={(url) => updateField('callWallpaper', url)}
          onClear={() => updateField('callWallpaper', '')}
          aspectRatio="9:16"
        />
      </div>

      {/* 2. LAYOUT & ACTION BAR STATES */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center space-x-1.5">
          <Layout className="w-3.5 h-3.5 text-purple-600" />
          <span>{isId ? 'Pengaturan Tata Letak & Tombol Panggilan' : 'Layout & Action Bar Settings'}</span>
        </h3>

        {/* Aspect Ratio */}
        <div>
          <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
            {t('common.aspectRatio', 'Aspect Ratio')}
          </label>
          <div className="flex space-x-2">
            {(['9:16', '4:5', '1:1'] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => updateField('aspectRatio', ratio)}
                className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  (data.aspectRatio || '9:16') === ratio
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {ratio === '9:16' ? (isId ? '9:16 (Cerita/Penuh)' : '9:16 (Story/Full)') : ratio === '4:5' ? (isId ? '4:5 (Postingan)' : '4:5 (Post)') : (isId ? '1:1 (Persegi)' : '1:1 (Square)')}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Selector (Light / Dark Mode) */}
        <div>
          <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
            {t('theme.mode', 'Theme Mode')}
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => updateField('theme', 'light')}
              className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                data.theme === 'light'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>{t('theme.light', 'Light')}</span>
            </button>
            <button
              type="button"
              onClick={() => updateField('theme', 'dark')}
              className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                (data.theme || 'dark') === 'dark'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{t('theme.dark', 'Dark')}</span>
            </button>
          </div>
        </div>

        {/* Button State Controls */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-2">
            {isId ? 'Status Tombol Aksi Panggilan' : 'Call Action Bar Buttons State'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Speaker Toggle */}
            <button
              type="button"
              onClick={() => updateField('isSpeakerActive', !data.isSpeakerActive)}
              className={`p-2 rounded-lg border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                data.isSpeakerActive !== false
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                <span>{isId ? 'Speaker' : 'Speaker'}</span>
              </div>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                {data.isSpeakerActive !== false ? (isId ? 'AKTIF' : 'ON (White)') : (isId ? 'MATI' : 'OFF')}
              </span>
            </button>

            {/* Mute Toggle */}
            <button
              type="button"
              onClick={() => updateField('isMuted', !data.isMuted)}
              className={`p-2 rounded-lg border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                data.isMuted
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <MicOff className="w-3.5 h-3.5 text-amber-600" />
                <span>{isId ? 'Bisukan Mikrofon' : 'Mute Mic'}</span>
              </div>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                {data.isMuted ? (isId ? 'DIBISUKAN' : 'ON (Muted)') : (isId ? 'AKTIF' : 'OFF')}
              </span>
            </button>

            {/* Video Toggle */}
            <button
              type="button"
              onClick={() => updateField('isVideoActive', !data.isVideoActive)}
              className={`p-2 rounded-lg border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                data.isVideoActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <Video className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isId ? 'Panggilan Video' : 'Video Call'}</span>
              </div>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                {data.isVideoActive ? (isId ? 'AKTIF' : 'ON') : (isId ? 'MATI' : 'OFF')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {onSaveProfile && (
        <div className="pt-2">
          <SaveProfileButton onSave={onSaveProfile} />
        </div>
      )}
    </div>
  );
};

