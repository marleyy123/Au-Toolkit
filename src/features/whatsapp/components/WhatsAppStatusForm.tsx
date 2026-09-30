import React, { useRef } from 'react';
import { WhatsAppStatusData, CharacterPreset } from '../../../types';
import { CharacterSelector, ImageUploader, SaveProfileButton } from '../../../components/FormControls';
import { Layout, Palette, Image as ImageIcon, Type, Sliders, MessageSquare } from 'lucide-react';
import { toHexForPicker } from '../../../utils/colorUtils';
import { useLanguage } from '../../../context/LanguageContext';
import { FontSelectorDropdown, getFontFamilyCss } from '../../../components/FontSelectorDropdown';

interface Props {
  data: WhatsAppStatusData;
  onChange: (updated: WhatsAppStatusData) => void;
  characters: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

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

export const WhatsAppStatusForm: React.FC<Props> = ({
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

  const updateField = <K extends keyof WhatsAppStatusData>(key: K, value: WhatsAppStatusData[K]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Quick Character Presets */}
      <CharacterSelector
        characters={characters}
        activeCharacterId={activeCharacterId}
        onSelect={onSelectCharacter}
        onSaveCurrent={onSaveCharacter}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      {/* 1. Header & Contact Details */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {language === 'id' ? 'Info Kontak & Header Status' : 'Contact Info & Status Header'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              {language === 'id' ? 'Nama Kontak' : 'Contact Name'}
            </label>
            <input
              type="text"
              value={data.contactName || ''}
              onChange={(e) => updateField('contactName', e.target.value)}
              placeholder="Name"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              {language === 'id' ? 'Waktu / Timestamp' : 'Timestamp / Time Ago'}
            </label>
            <input
              type="text"
              value={data.timestamp || ''}
              onChange={(e) => updateField('timestamp', e.target.value)}
              placeholder={language === 'id' ? 'Hari ini, 11.45' : 'Today, 11.45'}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Contact Avatar */}
        <ImageUploader
          label={language === 'id' ? 'Foto Profil Kontak (Avatar)' : 'Contact Profile Picture (Avatar)'}
          value={data.contactAvatar || ''}
          onChange={(url) => updateField('contactAvatar', url)}
          onClear={() => updateField('contactAvatar', '')}
        />

        {/* Progress Bar Segments Count & Active Index & Line Progress */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              {language === 'id' ? 'Total Segmen Story' : 'Total Story Segments'} ({data.progressSegmentsCount || 3})
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={data.progressSegmentsCount || 3}
              onChange={(e) => updateField('progressSegmentsCount', parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              {language === 'id' ? 'Segmen Aktif' : 'Active Segment'} (#{data.activeSegmentIndex || 1})
            </label>
            <input
              type="range"
              min={1}
              max={data.progressSegmentsCount || 3}
              value={Math.min(data.activeSegmentIndex || 1, data.progressSegmentsCount || 3)}
              onChange={(e) => updateField('activeSegmentIndex', parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              {language === 'id' ? 'Progress Garis Aktif' : 'Line Progress'} ({data.activeSegmentProgress !== undefined ? data.activeSegmentProgress : 60}%)
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
      </div>

      {/* 2. Content Type Selector (Text vs Image) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {language === 'id' ? 'Tipe Konten Status' : 'Status Content Type'}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => updateField('contentType', 'text')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 border transition-all cursor-pointer ${
              data.contentType === 'text'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>{language === 'id' ? 'Status Teks' : 'Text Status'}</span>
          </button>

          <button
            type="button"
            onClick={() => updateField('contentType', 'image')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 border transition-all cursor-pointer ${
              data.contentType === 'image'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>{language === 'id' ? 'Foto / Media Status' : 'Photo / Media Status'}</span>
          </button>
        </div>

        {/* Text Status Editor */}
        {data.contentType === 'text' && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">
                {language === 'id' ? 'Pesan Teks Status' : 'Status Text Message'}
              </label>
              <textarea
                rows={4}
                value={data.statusText || ''}
                onChange={(e) => updateField('statusText', e.target.value)}
                placeholder="Type status message here..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white resize-y"
              />
            </div>

            {/* Background Color Presets & Picker */}
            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1 flex items-center space-x-1">
                <Palette className="w-3.5 h-3.5 text-purple-600" />
                <span>{language === 'id' ? 'Warna Latar Belakang' : 'Background Color Presets'}</span>
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {WA_STATUS_BG_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => updateField('textBgColor', preset.color)}
                    style={{ backgroundColor: preset.color }}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer shadow-2xs ${
                      data.textBgColor === preset.color
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
                    title="Custom Color"
                  />
                  <span className="text-[11px] text-slate-500 font-mono">
                    {data.textBgColor || '#1B4D3E'}
                  </span>
                </div>
              </div>
            </div>

            {/* Font Family & Weight Dropdown with Custom Font Upload */}
            <div className="pt-2 border-t border-slate-100">
              <FontSelectorDropdown
                fontStyle={data.fontStyle as any}
                fontWeight={data.fontWeight}
                customFontName={data.customFontName}
                customFontUrl={data.customFontUrl}
                onFontChange={(updates) => {
                  const newFontStyle = updates.fontStyle !== undefined ? updates.fontStyle : data.fontStyle;
                  const newCustomName = updates.customFontName !== undefined ? updates.customFontName : data.customFontName;
                  const newCustomUrl = updates.customFontUrl !== undefined ? updates.customFontUrl : data.customFontUrl;
                  const computedFontCss = getFontFamilyCss(newFontStyle, newCustomName, newCustomUrl);
                  
                  onChange({
                    ...data,
                    ...updates as any,
                    textStatusFont: computedFontCss,
                  });
                }}
              />
            </div>

            {/* Font Size & Line Height Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-700 font-semibold">
                    {language === 'id' ? 'Ukuran Font' : 'Font Size'}
                  </label>
                  <span className="text-xs font-bold text-purple-700">{data.fontSize || 26}px</span>
                </div>
                <input
                  type="range"
                  min={14}
                  max={48}
                  value={data.fontSize || 26}
                  onChange={(e) => updateField('fontSize', parseInt(e.target.value, 10))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-700 font-semibold">
                    {language === 'id' ? 'Jarak Baris (Line Height)' : 'Line Height'}
                  </label>
                  <span className="text-xs font-bold text-purple-700">{data.lineHeight || 1.35}</span>
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

        {/* Image Status Editor */}
        {data.contentType === 'image' && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <ImageUploader
              label={language === 'id' ? 'Unggah Foto / Media Status' : 'Upload Status Photo / Media'}
              value={data.mediaImage || ''}
              onChange={(url) => updateField('mediaImage', url)}
              onClear={() => updateField('mediaImage', '')}
              aspectHint={language === 'id' ? 'Rasio 9:16 Portrait direkomendasikan' : '9:16 Portrait recommended'}
            />

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">
                {language === 'id' ? 'Teks Keterangan Foto (Opsional)' : 'Photo Caption (Optional)'}
              </label>
              <input
                type="text"
                value={data.captionText || ''}
                onChange={(e) => updateField('captionText', e.target.value)}
                placeholder="Add caption to photo..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Layout & Viewers Settings */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {language === 'id' ? 'Pengaturan Tampilan & Penonton' : 'Display & Viewers Controls'}
        </h3>

        {/* Aspect Ratio */}
        <div>
          <label className="text-xs text-slate-700 font-semibold block mb-1 flex items-center space-x-1">
            <Layout className="w-3.5 h-3.5 text-purple-600" />
            <span>{language === 'id' ? 'Rasio Aspek Kontainer' : 'Container Aspect Ratio'}</span>
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
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Elements: Exclusive selection between Reply and Viewer Count */}
        <div className="pt-1 space-y-1.5">
          <label className="text-xs text-slate-700 font-semibold block">
            {language === 'id' ? 'Gaya Kontrol Bawah' : 'Bottom Control Style'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onChange({ ...data, showReply: true, showViewCount: false });
              }}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                data.showReply !== false && data.showViewCount === false
                  ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                  data.showReply !== false && data.showViewCount === false ? 'border-purple-600 bg-purple-600' : 'border-slate-400'
                }`}>
                  {data.showReply !== false && data.showViewCount === false && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-xs font-bold text-slate-800">{language === 'id' ? 'Balas (Reply)' : 'Reply'}</span>
              </div>
              <span className="text-[10.5px] text-slate-500 block mt-1 ml-5.5">
                {language === 'id' ? 'Tampilkan panah geser atas & tombol Balas' : 'Show swipe up arrow & Reply button'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onChange({ ...data, showReply: false, showViewCount: true });
              }}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                data.showViewCount !== false && data.showReply === false
                  ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                  data.showViewCount !== false && data.showReply === false ? 'border-purple-600 bg-purple-600' : 'border-slate-400'
                }`}>
                  {data.showViewCount !== false && data.showReply === false && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-xs font-bold text-slate-800">{language === 'id' ? 'Jumlah Penonton (View Count)' : 'Viewer Count'}</span>
              </div>
              <span className="text-[10.5px] text-slate-500 block mt-1 ml-5.5">
                {language === 'id' ? 'Tampilkan ikon mata & angka penonton' : 'Show eye icon & view count'}
              </span>
            </button>
          </div>
        </div>

        {/* Status Viewers Count */}
        {data.showViewCount !== false && data.showReply === false && (
          <div className="pt-1">
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              {language === 'id' ? 'Jumlah Penonton' : 'Viewer Count'}
            </label>
            <input
              type="text"
              value={data.viewCount !== undefined ? data.viewCount : '12'}
              onChange={(e) => updateField('viewCount', e.target.value)}
              placeholder="12"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>
        )}
      </div>

      <SaveProfileButton onSave={onSaveProfile} />
    </div>
  );
};
