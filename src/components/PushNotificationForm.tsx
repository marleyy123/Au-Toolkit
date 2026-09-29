import React from 'react';
import {
  PushNotificationData,
  NotificationAppPlatform,
  NotificationThemePreset,
  NotificationItem,
  CharacterPreset,
} from '../types';
import { ImageUploader, CharacterSelector } from './FormControls';
import { toHexForPicker } from '../utils/colorUtils';
import { useLanguage } from '../context/LanguageContext';
import {
  Bell,
  Sliders,
  Palette,
  Layout,
  Sparkles,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';

interface Props {
  data: PushNotificationData;
  onChange: (updated: PushNotificationData) => void;
  characters?: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter?: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter?: (char: CharacterPreset) => void;
  onDeleteCharacter?: (charId: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

// 5 supported social platforms with squircle badges
const PLATFORM_OPTIONS: { id: NotificationAppPlatform; name: string; appName: string }[] = [
  { id: 'whatsapp', name: 'WhatsApp', appName: 'WHATSAPP' },
  { id: 'instagram', name: 'Instagram', appName: 'INSTAGRAM' },
  { id: 'tiktok', name: 'TikTok', appName: 'TIKTOK' },
  { id: 'x', name: 'X (Twitter)', appName: 'X' },
  { id: 'line', name: 'LINE', appName: 'LINE' },
];

const THEME_OPTIONS: { id: NotificationThemePreset; name: string }[] = [
  { id: 'glass-light', name: 'iOS Frosted Glass Light' },
  { id: 'glass-dark', name: 'iOS Frosted Glass Dark' },
  { id: 'solid-white', name: 'Solid Pure White' },
  { id: 'solid-dark', name: 'Solid Pure Dark' },
  { id: 'custom', name: 'Custom Accent Colors' },
];

export const PushNotificationForm: React.FC<Props> = ({
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
  const { language, isId } = useLanguage();

  const updateField = <K extends keyof PushNotificationData>(
    key: K,
    value: PushNotificationData[K]
  ) => {
    onChange({ ...data, [key]: value });
  };

  const handlePlatformSelect = (plat: NotificationAppPlatform) => {
    const meta = PLATFORM_OPTIONS.find((p) => p.id === plat);
    onChange({
      ...data,
      platform: plat,
      appName: meta?.appName || 'APP',
      iconPlatform: plat,
    });
  };

  // Quick Notification Text Templates for Instagram, TikTok, and X
  const applyTemplate = (templateType: string) => {
    let text = '';

    switch (templateType) {
      case 'ig-follow':
        text = 'started following you.';
        break;
      case 'ig-like':
        text = 'liked your post.';
        break;
      case 'ig-comment':
        text = 'commented: "keren banget! 🔥"';
        break;
      case 'ig-mention':
        text = 'mentioned you in a story.';
        break;
      case 'ig-dm':
        text = 'sent you a message.';
        break;
      case 'tt-follow':
        text = 'started following you.';
        break;
      case 'tt-like':
        text = 'liked your video.';
        break;
      case 'tt-comment':
        text = 'commented: "mantap abis! 🙌"';
        break;
      case 'tt-dm':
        text = 'sent you a message.';
        break;
      case 'x-reply':
        text = 'replied: "setuju banget sama ini!"';
        break;
      case 'x-like':
        text = 'liked your post';
        break;
      case 'x-repost':
        text = 'Reposted your post';
        break;
      case 'x-dm':
        text = 'sent you a Direct Message';
        break;
      default:
        text = '';
    }

    if (text) {
      updateField('messageText', text);
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Quick Character Presets */}
      <CharacterSelector
        characters={characters || []}
        activeCharacterId={activeCharacterId}
        onSelectCharacter={onSelectCharacter}
        onSaveCharacter={onSaveCharacter}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      {/* 1. Platform & App Icon Selection */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Bell className="w-3.5 h-3.5 text-purple-600" />
          <span>{language === 'id' ? 'Platform Aplikasi' : 'App Platform'}</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PLATFORM_OPTIONS.map((plat) => {
            const isSelected = data.platform === plat.id;
            return (
              <button
                key={plat.id}
                type="button"
                onClick={() => handlePlatformSelect(plat.id)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  isSelected
                    ? 'bg-purple-700 text-white border-purple-700 shadow-xs scale-102'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{plat.name}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-2.5 border-t border-slate-100 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                {language === 'id' ? 'Tulisan Nama Aplikasi di Banner' : 'App Platform Label on Banner'}
              </span>
              <span className="text-[11px] text-slate-500">
                {language === 'id' ? 'Tampilkan label aplikasi atau sembunyikan seluruhnya' : 'Show or hide the app label'}
              </span>
            </div>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
              <button type="button" onClick={() => updateField('showAppName', true)} className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${(data.showAppName !== false) ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
                {language === 'id' ? 'Pakai Tulisan' : 'Show Text'}
              </button>
              <button type="button" onClick={() => updateField('showAppName', false)} className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${(data.showAppName === false) ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
                {language === 'id' ? 'Tanpa Tulisan' : 'No Text'}
              </button>
            </div>
          </div>

          {data.showAppName !== false && (
            <div className="flex flex-wrap gap-1.5">
              {['WHATSAPP', 'INSTAGRAM', 'TIKTOK', 'TWITTER', 'X', 'LINE'].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => updateField('appName', label)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${String(data.appName || '').toUpperCase() === label ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                >
                  {label === 'WHATSAPP' ? 'WhatsApp' : label.charAt(0) + label.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Notification Suggestions (Editable free-form) */}
        {data.platform !== 'whatsapp' && data.platform !== 'line' && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold text-slate-700">
                {language === 'id' ? 'Pancingan Teks Notifikasi (Bebas Diedit)' : 'Quick Message Suggestions (Freely Editable)'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {data.platform === 'instagram' && (
                <>
                  <button
                    type="button"
                    onClick={() => applyTemplate('ig-follow')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 cursor-pointer"
                  >
                    + started following you
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('ig-like')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 cursor-pointer"
                  >
                    + liked your post
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('ig-comment')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 cursor-pointer"
                  >
                    + commented
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('ig-mention')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 cursor-pointer"
                  >
                    + mentioned you
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('ig-dm')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 cursor-pointer"
                  >
                    + sent a message
                  </button>
                </>
              )}

              {data.platform === 'tiktok' && (
                <>
                  <button
                    type="button"
                    onClick={() => applyTemplate('tt-follow')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    + started following you
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('tt-like')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    + liked your video
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('tt-comment')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    + commented on video
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('tt-dm')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    + sent you a message
                  </button>
                </>
              )}

              {data.platform === 'x' && (
                <>
                  <button
                    type="button"
                    onClick={() => applyTemplate('x-reply')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-100 cursor-pointer"
                  >
                    + replied on your post
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('x-like')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-100 cursor-pointer"
                  >
                    + liked your post
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('x-repost')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-100 cursor-pointer"
                  >
                    + Reposted your post
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('x-dm')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-100 cursor-pointer"
                  >
                    + sent you a Direct Message
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Sender Identity & Notification Content */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Sliders className="w-3.5 h-3.5 text-purple-600" />
          <span>{language === 'id' ? 'Detail Pesan Notifikasi' : 'Notification Content'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              {language === 'id' ? 'Nama Pengirim / Akun' : 'Sender Name / Account'}
            </label>
            <input
              type="text"
              value={data.senderName || ''}
              onChange={(e) => updateField('senderName', e.target.value)}
              placeholder="Alex"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              {language === 'id' ? 'Waktu / Timestamp' : 'Timestamp'}
            </label>
            <input
              type="text"
              value={data.timestamp || ''}
              onChange={(e) => updateField('timestamp', e.target.value)}
              placeholder="now, 2m ago, 10:45"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-700 font-semibold block mb-1">
            {language === 'id' ? 'Isi Pesan Notifikasi' : 'Message Text'}
          </label>
          <textarea
            rows={2}
            value={data.messageText || ''}
            onChange={(e) => updateField('messageText', e.target.value)}
            placeholder="Hello"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        {/* Sender photo or app-icon mode */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <label className="text-xs text-slate-800 font-bold block">
                {language === 'id' ? 'Ikon Notifikasi / Foto Profil' : 'Notification Icon / Avatar'}
              </label>
              <span className="text-[11px] text-slate-500">
                {language === 'id' ? 'Pakai foto profil atau ikon aplikasi' : 'Use a profile photo or app icon'}
              </span>
            </div>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
              <button type="button" onClick={() => updateField('avatarMode', 'photo')} className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 ${(data.avatarMode || (data.avatarUrl ? 'photo' : 'app-icon')) === 'photo' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'}`}>
                <ImageIcon className="w-3.5 h-3.5" /> {language === 'id' ? 'Foto Profil' : 'Profile Photo'}
              </button>
              <button type="button" onClick={() => onChange({ ...data, avatarMode: 'app-icon', iconPlatform: data.iconPlatform || data.platform || 'whatsapp' })} className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 ${(data.avatarMode || (data.avatarUrl ? 'photo' : 'app-icon')) === 'app-icon' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'}`}>
                <Sparkles className="w-3.5 h-3.5" /> {language === 'id' ? 'Ikon Aplikasi' : 'App Icon'}
              </button>
            </div>
          </div>

          {(data.avatarMode || (data.avatarUrl ? 'photo' : 'app-icon')) === 'photo' ? (
            <ImageUploader value={data.avatarUrl || ''} onChange={(url) => updateField('avatarUrl', url)} title={language === 'id' ? 'Unggah Foto Profil' : 'Upload Avatar'} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PLATFORM_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateField('iconPlatform', item.id)}
                  className={`p-2 rounded-xl border text-[11px] font-bold transition-all ${(data.iconPlatform || data.platform) === item.id ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Background Wallpaper Upload & Aspect Ratio */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
          <span>{language === 'id' ? 'Latar Belakang & Rasio Kanvas' : 'Background & Canvas Aspect Ratio'}</span>
        </h3>

        {/* User Wallpaper Upload */}
        <div>
          <label className="text-xs text-slate-700 font-semibold block mb-1">
            {language === 'id' ? 'Unggah Gambar Latar Belakang' : 'Upload Wallpaper / Background Image'}
          </label>
          <ImageUploader
            value={data.customWallpaperUrl || ''}
            onChange={(url) => updateField('customWallpaperUrl', url)}
            title="Upload Background Image"
          />
        </div>

        {/* Aspect Ratio Selector */}
        <div className="pt-2 border-t border-slate-100">
          <label className="text-xs text-slate-700 font-semibold block mb-1.5">
            {language === 'id' ? 'Pilihan Rasio Kanvas' : 'Canvas Aspect Ratio'}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: '1:1', label: '1:1 Square' },
              { id: '4:5', label: '4:5 Post' },
              { id: '9:16', label: '9:16 Story' },
              { id: 'auto', label: 'Compact' },
            ].map((ratio) => (
              <button
                key={ratio.id}
                type="button"
                onClick={() => updateField('aspectRatio', ratio.id as any)}
                className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  (data.aspectRatio || 'auto') === ratio.id
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </div>

        {/* Banner Width Slider */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-slate-700 font-semibold">
              {language === 'id' ? 'Lebar Banner Notifikasi' : 'Banner Width'}
            </label>
            <span className="text-xs font-bold text-purple-700">{data.bannerWidthPercent || 94}%</span>
          </div>
          <input
            type="range"
            min={60}
            max={100}
            value={data.bannerWidthPercent || 94}
            onChange={(e) => updateField('bannerWidthPercent', parseInt(e.target.value, 10))}
            className="w-full accent-purple-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-medium">
            <span>60% (Compact)</span>
            <span>94% (Standard)</span>
            <span>100% (Full Edge)</span>
          </div>
        </div>

        {/* Vertical Position (Y-Axis Offset) Slider & Quick Presets */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <label className="text-xs text-slate-700 font-semibold block">
                {language === 'id' ? 'Posisi Vertikal Banner (Y-Axis Offset)' : 'Vertical Position (Y-Axis Offset)'}
              </label>
              <span className="text-[10px] text-slate-500">
                {language === 'id' ? 'Geser banner ke atas atau ke bawah pada background' : 'Shift banner up or down on background wallpaper'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              {data.verticalOffset !== undefined ? data.verticalOffset : 12}%
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={85}
            step={1}
            value={data.verticalOffset !== undefined ? data.verticalOffset : 12}
            onChange={(e) => updateField('verticalOffset', parseInt(e.target.value, 10))}
            className="w-full accent-purple-600 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>0% (Top)</span>
            <span>45% (Middle)</span>
            <span>85% (Bottom)</span>
          </div>

          {/* Quick Position Presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {[
              { label: language === 'id' ? 'Top (Atas)' : 'Top', value: 6 },
              { label: language === 'id' ? 'Upper-Mid' : 'Upper-Mid', value: 20 },
              { label: language === 'id' ? 'Center (Tengah)' : 'Center', value: 42 },
              { label: language === 'id' ? 'Lower-Mid' : 'Lower-Mid', value: 62 },
              { label: language === 'id' ? 'Bottom (Bawah)' : 'Bottom', value: 78 },
            ].map((preset, pIdx) => {
              const isActive = (data.verticalOffset !== undefined ? data.verticalOffset : 12) === preset.value;
              return (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => updateField('verticalOffset', preset.value)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Banner Appearance & Stacking */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Palette className="w-3.5 h-3.5 text-purple-600" />
          <span>{language === 'id' ? 'Gaya Tampilan Banner' : 'Banner Visual Theme'}</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {THEME_OPTIONS.map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => updateField('theme', th.id)}
              className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                (data.theme || 'glass-light') === th.id
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs font-bold'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {th.name}
            </button>
          ))}
        </div>

        {/* Stacked notification cards count */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                {language === 'id' ? 'Tumpukan Notifikasi (Stacking)' : 'Stacked Notifications'}
              </span>
              <span className="text-[11px] text-slate-500">
                {language === 'id' ? 'Tampilkan 1, 2, atau 3 banner bertumpuk' : 'Show 1, 2, or 3 banners stacked'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[1, 2, 3].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => updateField('notificationStackCount', count as any)}
                className={`w-7 h-7 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  (data.notificationStackCount || 1) === count
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-notification customization & platform ordering when stack count > 1 */}
        {(data.notificationStackCount || 1) > 1 && (
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {language === 'id' ? 'Kombinasi & Urutan Platform Notifikasi' : 'Platform Combination & Order'}
              </span>
            </div>

            {/* Quick combination presets */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'WA + IG', plats: ['whatsapp', 'instagram'] },
                { label: 'IG + WA', plats: ['instagram', 'whatsapp'] },
                { label: 'WA + WA', plats: ['whatsapp', 'whatsapp'] },
                { label: 'IG + IG', plats: ['instagram', 'instagram'] },
                { label: 'WA + IG + TikTok', plats: ['whatsapp', 'instagram', 'tiktok'] },
                { label: 'IG + WA + X', plats: ['instagram', 'whatsapp', 'x'] },
              ].map((combo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const nextPlat = combo.plats[0] as NotificationAppPlatform;
                    const nextAdditionals: NotificationItem[] = [
                      {
                        id: 'notif-2',
                        senderName: combo.plats[1] === 'instagram' ? 'Sarah' : combo.plats[1] === 'tiktok' ? 'TikTok Updates' : 'Dimas',
                        messageText: combo.plats[1] === 'instagram' ? 'Mentioned you in a story' : 'lagi dimana sekarang?',
                        timestamp: '2m ago',
                        avatarUrl: '',
                        platform: (combo.plats[1] || 'whatsapp') as NotificationAppPlatform,
                      },
                      {
                        id: 'notif-3',
                        senderName: combo.plats[2] === 'tiktok' ? 'TikTok' : combo.plats[2] === 'x' ? 'Elon Musk' : 'Jessica',
                        messageText: combo.plats[2] === 'x' ? 'New notification on X' : 'Check this out! 🔥',
                        timestamp: '5m ago',
                        avatarUrl: '',
                        platform: (combo.plats[2] || 'whatsapp') as NotificationAppPlatform,
                      },
                    ];
                    onChange({
                      ...data,
                      platform: nextPlat,
                      notificationStackCount: Math.min(3, Math.max(data.notificationStackCount || 1, combo.plats.length)) as 1 | 2 | 3,
                      additionalNotifications: nextAdditionals,
                    });
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md border border-purple-200 transition-colors"
                >
                  {combo.label}
                </button>
              ))}
            </div>

            {/* Notification Slot 2 */}
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>{language === 'id' ? 'Banner 2' : 'Banner 2'}</span>
                <select
                  value={data.additionalNotifications?.[0]?.platform || data.platform || 'whatsapp'}
                  onChange={(e) => {
                    const existing0 = data.additionalNotifications?.[0] || { id: 'notif-2', senderName: '', messageText: '', timestamp: '2m ago', avatarUrl: '', platform: 'whatsapp' as NotificationAppPlatform };
                    const existing1 = data.additionalNotifications?.[1] || { id: 'notif-3', senderName: '', messageText: '', timestamp: '5m ago', avatarUrl: '', platform: 'whatsapp' as NotificationAppPlatform };
                    const newAdd: NotificationItem[] = [{ ...existing0, platform: e.target.value as NotificationAppPlatform }, existing1];
                    updateField('additionalNotifications', newAdd);
                  }}
                  className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="x">X (Twitter)</option>
                  <option value="line">LINE</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Sender name"
                  value={data.additionalNotifications?.[0]?.senderName || ''}
                  onChange={(e) => {
                    const existing0 = data.additionalNotifications?.[0] || { id: 'notif-2', senderName: '', messageText: '', timestamp: '2m ago', avatarUrl: '', platform: 'whatsapp' as NotificationAppPlatform };
                    const existing1 = data.additionalNotifications?.[1] || { id: 'notif-3', senderName: '', messageText: '', timestamp: '5m ago', avatarUrl: '', platform: 'whatsapp' as NotificationAppPlatform };
                    const newAdd: NotificationItem[] = [{ ...existing0, senderName: e.target.value }, existing1];
                    updateField('additionalNotifications', newAdd);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                />
                <input
                  type="text"
                  placeholder="Timestamp (e.g. 2m ago)"
                  value={data.additionalNotifications?.[0]?.timestamp || ''}
                  onChange={(e) => {
                    const existing0 = data.additionalNotifications?.[0] || { id: 'notif-2', senderName: '', messageText: '', timestamp: '2m ago', avatarUrl: '', platform: 'whatsapp' as NotificationAppPlatform };
                    const existing1 = data.additionalNotifications?.[1] || { id: 'notif-3', senderName: '', messageText: '', timestamp: '5m ago', avatarUrl: '', platform: 'whatsapp' as NotificationAppPlatform };
                    const newAdd: NotificationItem[] = [{ ...existing0, timestamp: e.target.value }, existing1];
                    updateField('additionalNotifications', newAdd);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                />
              </div>
              <input
                type="text"
                placeholder="Message text"
                value={data.additionalNotifications?.[0]?.messageText || ''}
                onChange={(e) => {
                  const existing0 = data.additionalNotifications?.[0] || { id: 'notif-2', senderName: '', messageText: '', timestamp: '2m ago', avatarUrl: '', platform: 'whatsapp' as NotificationAppPlatform };
                  const existing1 = data.additionalNotifications?.[1] || { id: 'notif-3', senderName: '', messageText: '', timestamp: '5m ago', avatarUrl: '', platform: 'whatsapp' as NotificationAppPlatform };
                  const newAdd: NotificationItem[] = [{ ...existing0, messageText: e.target.value }, existing1];
                  updateField('additionalNotifications', newAdd);
                }}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
              />
            </div>

            {/* Notification Slot 3 (if stack >= 3) */}
            {(data.notificationStackCount || 1) >= 3 && (
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>{language === 'id' ? 'Banner 3' : 'Banner 3'}</span>
                  <select
                    value={data.additionalNotifications?.[1]?.platform || data.platform || 'whatsapp'}
                    onChange={(e) => {
                      const existing0 = data.additionalNotifications?.[0] || { id: 'notif-2', senderName: '', messageText: '', timestamp: '2m ago', avatarUrl: '', platform: 'whatsapp' as NotificationAppPlatform };
                      const existing1 = data.additionalNotifications?.[1] || { id: 'notif-3', senderName: '', messageText: '', timestamp: '5m ago', avatarUrl: '', platform: 'whatsapp' as NotificationAppPlatform };
                      const newAdd: NotificationItem[] = [existing0, { ...existing1, platform: e.target.value as NotificationAppPlatform }];
                      updateField('additionalNotifications', newAdd);
                    }}
                    className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="x">X (Twitter)</option>
                    <option value="line">LINE</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Sender name"
                    value={data.additionalNotifications?.[1]?.senderName || ''}
                    onChange={(e) => {
                      const existing0 = data.additionalNotifications?.[0] || { id: 'notif-2', senderName: '', messageText: '', timestamp: '2m ago', avatarUrl: '', platform: 'whatsapp' as NotificationAppPlatform };
                      const existing1 = data.additionalNotifications?.[1] || { id: 'notif-3', senderName: '', messageText: '', timestamp: '5m ago', avatarUrl: '', platform: 'whatsapp' as NotificationAppPlatform };
                      const newAdd: NotificationItem[] = [existing0, { ...existing1, senderName: e.target.value }];
                      updateField('additionalNotifications', newAdd);
                    }}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Timestamp (e.g. 5m ago)"
                    value={data.additionalNotifications?.[1]?.timestamp || ''}
                    onChange={(e) => {
                      const existing0 = data.additionalNotifications?.[0] || { id: 'notif-2', senderName: '', messageText: '', timestamp: '2m ago', avatarUrl: '', platform: 'whatsapp' as NotificationAppPlatform };
                      const existing1 = data.additionalNotifications?.[1] || { id: 'notif-3', senderName: '', messageText: '', timestamp: '5m ago', avatarUrl: '', platform: 'whatsapp' as NotificationAppPlatform };
                      const newAdd: NotificationItem[] = [existing0, { ...existing1, timestamp: e.target.value }];
                      updateField('additionalNotifications', newAdd);
                    }}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Message text"
                  value={data.additionalNotifications?.[1]?.messageText || ''}
                  onChange={(e) => {
                    const existing0 = data.additionalNotifications?.[0] || { id: 'notif-2', senderName: '', messageText: '', timestamp: '2m ago', avatarUrl: '', platform: 'whatsapp' as NotificationAppPlatform };
                    const existing1 = data.additionalNotifications?.[1] || { id: 'notif-3', senderName: '', messageText: '', timestamp: '5m ago', avatarUrl: '', platform: 'whatsapp' as NotificationAppPlatform };
                    const newAdd: NotificationItem[] = [existing0, { ...existing1, messageText: e.target.value }];
                    updateField('additionalNotifications', newAdd);
                  }}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
