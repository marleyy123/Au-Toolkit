import React from 'react';
import { WhatsAppViewersData, WhatsAppViewerItem, CharacterPreset } from '../types';
import { ImageUploader, SaveProfileButton, CharacterSelector } from './FormControls';
import { Plus, Trash2, ArrowUp, ArrowDown, Layout, Sun, Moon, Image, Type, Palette } from 'lucide-react';
import { toHexForPicker } from '../utils/colorUtils';
import { FontSelectorDropdown } from './FontSelectorDropdown';
import { useLanguage } from '../context/LanguageContext';

const WA_STATUS_BG_PRESETS = [
  { name: 'Emerald', color: '#1B4D3E' },
  { name: 'Wine', color: '#5B1E31' },
  { name: 'Navy Blue', color: '#1E3A8A' },
  { name: 'Royal Purple', color: '#4C1D95' },
  { name: 'Warm Brown', color: '#78350F' },
  { name: 'Crimson Red', color: '#991B1B' },
  { name: 'Sunset Amber', color: '#B45309' },
  { name: 'Dark Slate', color: '#18181B' },
  { name: 'Teal', color: '#0F766E' },
  { name: 'Rose', color: '#BE185D' },
];

interface Props {
  data: WhatsAppViewersData;
  onChange: (updated: WhatsAppViewersData) => void;
  onSaveProfile?: () => void;
  characters?: CharacterPreset[];
  activeCharacterId?: string | null;
  onSaveCharacter?: () => void;
  onSelectCharacter?: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const WhatsAppViewersForm: React.FC<Props> = ({
  data,
  onChange,
  onSaveProfile,
  characters,
  activeCharacterId,
  onSaveCharacter,
  onSelectCharacter,
  onDeleteCharacter,
  onRenameCharacter,
}) => {
  const { language, t } = useLanguage();
  const isId = language === 'id';

  const updateField = <K extends keyof WhatsAppViewersData>(key: K, value: WhatsAppViewersData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const handleAddViewer = () => {
    const newViewer: WhatsAppViewerItem = {
      id: 'vw-' + Date.now(),
      name: '',
      avatar: '',
      time: isId ? 'hari ini 1.43 AM' : 'Today 1.43 AM',
      hasRing: false,
      isLiked: false,
    };
    const updatedViewers = [...(data.viewers || []), newViewer];
    onChange({
      ...data,
      viewers: updatedViewers,
      viewCount: String(updatedViewers.length),
    });
  };

  const handleClearViewers = () => {
    onChange({
      ...data,
      viewers: [],
      viewCount: '0',
    });
  };

  const handleUpdateViewer = (index: number, partial: Partial<WhatsAppViewerItem>) => {
    const updated = [...(data.viewers || [])];
    updated[index] = { ...updated[index], ...partial };
    onChange({ ...data, viewers: updated });
  };

  const handleRemoveViewer = (index: number) => {
    const updated = [...(data.viewers || [])];
    updated.splice(index, 1);
    onChange({
      ...data,
      viewers: updated,
      viewCount: String(updated.length),
    });
  };

  const handleMoveViewer = (index: number, direction: 'up' | 'down') => {
    const updated = [...(data.viewers || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange({ ...data, viewers: updated });
  };

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-200">
      {/* 0. Character Slots */}
      <CharacterSelector
        characters={characters || []}
        activeCharacterId={activeCharacterId || undefined}
        onSelect={onSelectCharacter}
        onSaveCurrent={onSaveCharacter}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      {/* 1. STATUS HEADER & BACKGROUND MEDIA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {isId ? 'Info Status & Media Latar' : 'Status Header & Background Media'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              {isId ? 'Nama Status' : 'Status Name'}
            </label>
            <input
              type="text"
              value={data.contactName || ''}
              onChange={(e) => updateField('contactName', e.target.value)}
              placeholder="My Status"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              {t('common.time', 'Timestamp')}
            </label>
            <input
              type="text"
              value={data.timestamp || ''}
              onChange={(e) => updateField('timestamp', e.target.value)}
              placeholder={isId ? '2m lalu / Hari ini, 10:45' : '2m ago / Today, 10:45'}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Profile Picture */}
        <ImageUploader
          label={isId ? 'Foto Profil (Avatar)' : 'Profile Picture (Avatar)'}
          value={data.contactAvatar || ''}
          onChange={(url) => updateField('contactAvatar', url)}
          onClear={() => updateField('contactAvatar', '')}
        />

        {/* Progress Bar Segments Count, Active Index & Line Progress */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              {isId ? `Total Segmen (${data.progressSegmentsCount || 1})` : `Total Segments (${data.progressSegmentsCount || 1})`}
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={data.progressSegmentsCount || 1}
              onChange={(e) => updateField('progressSegmentsCount', parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              {isId ? `Segmen Aktif (#${data.activeSegmentIndex || 1})` : `Active Segment (#${data.activeSegmentIndex || 1})`}
            </label>
            <input
              type="range"
              min={1}
              max={data.progressSegmentsCount || 1}
              value={Math.min(data.activeSegmentIndex || 1, data.progressSegmentsCount || 1)}
              onChange={(e) => updateField('activeSegmentIndex', parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              {isId ? `Progres Segmen (${data.activeSegmentProgress !== undefined ? data.activeSegmentProgress : 60}%)` : `Segment Progress (${data.activeSegmentProgress !== undefined ? data.activeSegmentProgress : 60}%)`}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={data.activeSegmentProgress !== undefined ? data.activeSegmentProgress : 60}
              onChange={(e) => updateField('activeSegmentProgress', parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Content Type Selector */}
        <div>
          <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
            {isId ? 'Tipe Konten Status' : 'Status Content Type'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => updateField('contentType', 'image')}
              className={`py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                (data.contentType || 'image') === 'image'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Image className="w-3.5 h-3.5" />
              <span>{isId ? 'Foto / Gambar' : 'Photo / Image'}</span>
            </button>
            <button
              type="button"
              onClick={() => updateField('contentType', 'text')}
              className={`py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                data.contentType === 'text'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>{isId ? 'Teks Warna' : 'Color Text'}</span>
            </button>
          </div>
        </div>

        {/* Content Type Conditional Inputs */}
        {(data.contentType || 'image') === 'image' ? (
          <div className="space-y-3 pt-1">
            <ImageUploader
              label={isId ? 'Foto Latar Status' : 'Status Background Photo'}
              value={data.mediaImage || ''}
              onChange={(url) => updateField('mediaImage', url)}
              onClear={() => updateField('mediaImage', '')}
              aspectHint={isId ? 'Foto latar status' : 'Status background image'}
            />
            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                {isId ? 'Keterangan Foto (Opsional)' : 'Photo Caption (Optional)'}
              </label>
              <input
                type="text"
                value={data.captionText || ''}
                onChange={(e) => updateField('captionText', e.target.value)}
                placeholder={isId ? 'Tambahkan keterangan...' : 'Add a caption...'}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                {isId ? 'Pesan Teks Status' : 'Status Text Message'}
              </label>
              <textarea
                value={data.statusText || ''}
                onChange={(e) => updateField('statusText', e.target.value)}
                placeholder={isId ? 'Ketik pesan status Anda di sini...' : 'Type your status text here...'}
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
              />
            </div>

            {/* Background Color Presets & Picker */}
            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1 flex items-center space-x-1">
                <Palette className="w-3.5 h-3.5 text-purple-600" />
                <span>{t('common.backgroundColor', 'Background Color')}</span>
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {WA_STATUS_BG_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => updateField('textBgColor', preset.color)}
                    style={{ backgroundColor: preset.color }}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer shadow-2xs ${
                      (data.textBgColor || '#1B4D3E') === preset.color
                        ? 'border-purple-600 scale-110 ring-2 ring-purple-300'
                        : 'border-white hover:scale-105'
                    }`}
                    title={preset.name}
                  />
                ))}

                {/* Custom Color Input */}
                <div className="flex items-center space-x-1.5 pl-2">
                  <input
                    type="color"
                    value={toHexForPicker(data.textBgColor || '#1B4D3E')}
                    onChange={(e) => updateField('textBgColor', e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                    title={isId ? 'Warna Kustom' : 'Custom Color'}
                  />
                  <span className="text-[11px] text-slate-500 font-mono">
                    {data.textBgColor || '#1B4D3E'}
                  </span>
                </div>
              </div>
            </div>

            {/* Font Family & Weight Dropdown with Custom Font Upload */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <FontSelectorDropdown
                fontStyle={data.fontStyle as any}
                fontWeight={data.fontWeight}
                customFontName={data.customFontName}
                customFontUrl={data.customFontUrl}
                onFontChange={(updates) => onChange({ ...data, ...updates as any })}
              />
            </div>

            {/* Font Size & Line Height Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{t('common.fontSize', 'Font Size')}</label>
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-400">{data.fontSize || 24}px</span>
                </div>
                <input
                  type="range"
                  min={14}
                  max={48}
                  value={data.fontSize || 24}
                  onChange={(e) => updateField('fontSize', parseInt(e.target.value, 10))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{t('common.lineHeight', 'Line Height')}</label>
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-400">{data.lineHeight || 1.35}</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={2.4}
                  step={0.05}
                  value={data.lineHeight || 1.35}
                  onChange={(e) => updateField('lineHeight', parseFloat(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. BOTTOM SHEET & VIEWERS SETTINGS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {isId ? 'Pengaturan Penonton & Lembar Bawah' : 'Bottom Sheet & Viewer Settings'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              {isId ? 'Jumlah Penonton (Viewer Count)' : 'Viewer Count'}
            </label>
            <input
              type="text"
              value={data.viewCount !== undefined ? data.viewCount : ''}
              onChange={(e) => updateField('viewCount', e.target.value)}
              placeholder="124"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
            />
            <p className="text-[10.5px] text-slate-400 mt-1">
              {isId ? 'Format bahasa Inggris otomatis: contoh "124 views"' : 'Automatically formatted in English: e.g. "124 views"'}
            </p>
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              {isId ? 'Kustomisasi Label (Opsional, Default: "views")' : 'Custom Label (Optional, Default: "views")'}
            </label>
            <input
              type="text"
              value={data.viewedByLabel !== undefined ? data.viewedByLabel : ''}
              onChange={(e) => updateField('viewedByLabel', e.target.value)}
              placeholder="views"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Theme & Aspect Ratio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1 flex items-center space-x-1">
              <span>{t('theme.mode', 'Theme Mode')}</span>
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => updateField('theme', 'light')}
                className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
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
                className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                  (data.theme || 'light') === 'dark'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{t('theme.dark', 'Dark')}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1 flex items-center space-x-1">
              <Layout className="w-3.5 h-3.5 text-purple-600" />
              <span>{t('common.aspectRatio', 'Aspect Ratio')}</span>
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
                  {ratio}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. VIEWERS LIST */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 gap-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {isId ? 'Daftar Penonton' : 'Viewers List'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isId ? 'Kelola kontak yang telah melihat status ini' : 'Manage contacts who viewed this status'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleAddViewer}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isId ? '+ Tambah Penonton' : 'Add Viewer'}</span>
            </button>
          </div>
        </div>

        {/* Viewers Cards */}
        <div className="space-y-2.5">
          {(data.viewers || []).length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs font-medium space-y-1">
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                {isId ? 'Status saat ini memiliki 0 penonton ("Belum ada yang melihat")' : 'Status currently has 0 viewers ("No views yet")'}
              </p>
              <p className="text-[11px]">
                {isId ? 'Klik "+ Tambah Penonton" untuk menambahkan kontak.' : 'Click "Add Viewer" to add contacts who viewed your status.'}
              </p>
            </div>
          ) : (
            data.viewers.map((viewer, index) => (
              <div
                key={viewer.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5 transition-all shadow-2xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-200/80 dark:border-slate-700">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 shrink-0">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[130px]">
                      {viewer.name && viewer.name.trim() !== '' ? viewer.name : (isId ? 'Nama' : 'Name')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 ml-auto bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => handleMoveViewer(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-30 cursor-pointer rounded transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveViewer(index, 'down')}
                      disabled={index === data.viewers.length - 1}
                      className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-30 cursor-pointer rounded transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveViewer(index)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer rounded transition-colors"
                      title="Delete Viewer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Dua Checkbox Terpisah: 1) Status Ring, 2) Like (Love Hijau) - Light/Bright Style */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5 pb-1">
                  {/* Checkbox Ring */}
                  <label
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                      viewer.hasRing
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(viewer.hasRing)}
                      onChange={(e) => handleUpdateViewer(index, { hasRing: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-0 accent-[#25D366] cursor-pointer"
                    />
                    <span className="flex items-center space-x-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-[#25D366] inline-block shrink-0" />
                      <span className="font-semibold text-slate-800">{isId ? 'Ring Status' : 'Status Ring'}</span>
                    </span>
                  </label>

                  {/* Checkbox Like */}
                  <label
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                      viewer.isLiked
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(viewer.isLiked)}
                      onChange={(e) => handleUpdateViewer(index, { isLiked: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-0 accent-[#25D366] cursor-pointer"
                    />
                    <span className="flex items-center space-x-1.5">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#25D366] stroke-[#25D366] stroke-1 shrink-0">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span className="font-semibold text-slate-800">{isId ? 'Like (Love Hijau)' : 'Like (Green Love)'}</span>
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                      {isId ? 'Nama Penonton' : 'Viewer Name'}
                    </label>
                    <input
                      type="text"
                      value={viewer.name || ''}
                      onChange={(e) => handleUpdateViewer(index, { name: e.target.value })}
                      placeholder={isId ? 'Nama' : 'Name'}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                      {isId ? 'Waktu Dilihat (Hari & Jam)' : 'Viewed Time (Day & Time)'}
                    </label>
                    <input
                      type="text"
                      value={viewer.time || ''}
                      onChange={(e) => handleUpdateViewer(index, { time: e.target.value })}
                      placeholder={isId ? 'Contoh: hari ini 1.43 AM' : 'e.g. Today 1.43 AM'}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Avatar Uploader */}
                <ImageUploader
                  label={isId ? 'Foto Profil Penonton' : 'Viewer Profile Picture'}
                  value={viewer.avatar || ''}
                  onChange={(url) => handleUpdateViewer(index, { avatar: url })}
                  onClear={() => handleUpdateViewer(index, { avatar: '' })}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <SaveProfileButton onSave={onSaveProfile} />
    </div>
  );
};

