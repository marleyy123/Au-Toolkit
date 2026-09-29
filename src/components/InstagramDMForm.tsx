import React, { useEffect, useState } from 'react';
import {
  InstagramDMData,
  InstagramDMMessage,
  CharacterPreset,
} from '../types';
import { ImageUploader, CharacterSelector, SaveProfileButton } from './FormControls';
import { INSTAGRAM_DM_PRESETS, InstagramDMPreset } from '../data/instagramPresets';
import { toHexForPicker } from '../utils/colorUtils';
import { renderIosEmojis } from '../utils/emojiUtils';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { auth } from '../firebase';
import {
  readPersistentUserAssets,
  subscribePersistentUserAssets,
  updatePersistentUserAsset,
} from '../utils/userAssets';
import {
  MessageSquare,
  Plus,
  Trash2,
  Moon,
  Sun,
  Palette,
  Check,
  Layout,
  Users,
  Sliders,
  Sparkles,
  Bookmark,
  BookmarkPlus,
  RotateCcw,
  Ban,
} from 'lucide-react';

const getIgUserStorageKey = () => {
  try {
    const email = localStorage.getItem('au_user_email');
    if (email && email.trim()) {
      return `au_toolkit_ig_saved_custom_themes_${email.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
    }
    const rawUser = localStorage.getItem('au_auth_user') || localStorage.getItem('au_account_user') || localStorage.getItem('au_firebase_auth_user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?.email) {
        return `au_toolkit_ig_saved_custom_themes_${parsed.email.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
      }
      if (parsed?.uid) {
        return `au_toolkit_ig_saved_custom_themes_${parsed.uid.replace(/[^a-z0-9_]/g, '_')}`;
      }
    }
  } catch {}
  try {
    const code = localStorage.getItem('au_access_code');
    if (code && code.trim()) {
      return `au_toolkit_ig_saved_custom_themes_${code.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
    }
  } catch {}
  return 'au_toolkit_ig_saved_custom_themes_device';
};

interface ColorInputRowProps {
  label: string;
  value?: string;
  defaultHex: string;
  onChange: (val: string) => void;
  onClear: () => void;
}

const ColorInputRow: React.FC<ColorInputRowProps> = ({
  label,
  value,
  defaultHex,
  onChange,
  onClear,
}) => {
  const currentVal = value ?? '';
  const isFilled = Boolean(currentVal.trim());

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
          {label}
        </label>
        {isFilled && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] text-slate-400 hover:text-red-500 transition-colors font-mono cursor-pointer px-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Kosongkan warna"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={toHexForPicker(currentVal, defaultHex)}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 cursor-pointer shrink-0 p-0 bg-transparent"
        />
        <div className="relative flex-1">
          <input
            type="text"
            value={currentVal}
            placeholder={defaultHex}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-2 pr-7 py-1 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {isFilled && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-0.5 rounded cursor-pointer transition-colors"
              title="Kosongkan / Clear"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface Props {
  data: InstagramDMData;
  onChange: (data: InstagramDMData) => void;
  characters?: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter?: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter?: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const InstagramDMForm: React.FC<Props> = ({
  data,
  onChange,
  characters = [],
  activeCharacterId,
  onSaveCharacter,
  onSaveProfile,
  onSelectCharacter,
  onDeleteCharacter,
  onRenameCharacter,
}) => {
  const { t, isId } = useLanguage();
  const { isDark: isEditorDark } = useTheme();
  const updateField = <K extends keyof InstagramDMData>(
    field: K,
    value: InstagramDMData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  const colorMode = data.outgoingColorMode || 'blue-purple';
  const isCustomThemeActive = Boolean(data.useCustomTheme);

  // User-isolated Saved Custom Themes for IG
  const [savedCustomThemes, setSavedCustomThemes] = useState<InstagramDMPreset[]>(() => {
    try {
      return readPersistentUserAssets(auth.currentUser?.uid, auth.currentUser?.email).instagramDmCustomThemes;
    } catch (e) {
      return [];
    }
  });
  const [newThemeName, setNewThemeName] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => subscribePersistentUserAssets((assets) => {
    setSavedCustomThemes(assets.instagramDmCustomThemes);
  }), []);

  const handleSaveCustomTheme = () => {
    const trimmed = newThemeName.trim();
    if (!trimmed) return;

    const newPreset: InstagramDMPreset = {
      id: 'ig-custom-' + Date.now(),
      name: trimmed,
      description: 'Custom Saved Theme',
      bgGradient: data.customBgColor || (data.theme === 'light' ? '#fafafa' : '#000000'),
      outgoingBg: data.customOutgoingBg || '#a855f7',
      incomingBg: data.customIncomingBg || '#262626',
      headerBg: data.customHeaderBg || '#000000',
      pillBg: data.customPillBg || '#262626',
      iconColor: data.customIconColor || '#ffffff',
      textColor: data.customTextColor || '#ffffff',
      secondaryTextColor: data.customSecondaryTextColor || '#a3a3a3',
      cameraBg: data.customCameraBg || '#0095f6',
      cameraIconColor: data.customCameraIconColor || '#ffffff',
      themeMode: data.theme || 'dark',
    };

    const updated = [newPreset, ...savedCustomThemes];
    setSavedCustomThemes(updated);
    try {
      updatePersistentUserAsset(auth.currentUser?.uid, auth.currentUser?.email, 'instagramDmCustomThemes', updated);
    } catch (e) {}

    setNewThemeName('');
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
    updateField('activeThemePreset', newPreset.id);
    updateField('activeThemeName', newPreset.name);
  };

  const handleDeleteCustomTheme = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedCustomThemes.filter((t) => t.id !== id);
    setSavedCustomThemes(filtered);
    try {
      updatePersistentUserAsset(auth.currentUser?.uid, auth.currentUser?.email, 'instagramDmCustomThemes', filtered);
    } catch (err) {}
  };

  const handleResetColors = () => {
    updateField('customBgColor', '');
    updateField('customOutgoingBg', '');
    updateField('customIncomingBg', '');
    updateField('customCameraBg', '');
    updateField('customCameraIconColor', '');
    updateField('customIconColor', '');
    updateField('customPillBg', '');
    updateField('customHeaderBg', '');
    updateField('customHeaderTextColor', '');
    updateField('customTextColor', '');
    updateField('customSecondaryTextColor', '');
  };

  const handleApplyPresetTheme = (presetId: string, customPreset?: InstagramDMPreset) => {
    const preset = customPreset || INSTAGRAM_DM_PRESETS.find((p) => p.id === presetId) || INSTAGRAM_DM_PRESETS[0];

    onChange({
      ...data,
      activeThemePreset: preset.id,
      activeThemeName: preset.name,
      useCustomTheme: true,
      customBgColor: preset.bgGradient,
      customOutgoingBg: preset.outgoingBg,
      customIncomingBg: preset.incomingBg,
      customHeaderBg: preset.headerBg,
      customHeaderTextColor: preset.textColor,
      customIconColor: preset.iconColor,
      customCameraBg: preset.cameraBg || '#0095f6',
      customCameraIconColor: preset.cameraIconColor || '#ffffff',
      customTextColor: preset.textColor,
      customSecondaryTextColor: preset.secondaryTextColor,
      customPillBg: preset.pillBg,
      theme: preset.themeMode || 'dark',
    });
  };

  const handleToggleCustomTheme = (enabled: boolean) => {
    if (enabled) {
      handleApplyPresetTheme(data.activeThemePreset || 'toy-story');
    } else {
      updateField('useCustomTheme', false);
    }
  };

  const handleAddMessageWithSender = (sender: 'incoming' | 'outgoing') => {
    const newMessage: InstagramDMMessage = {
      id: `dm-${Date.now()}`,
      sender,
      senderName: data.isGroupChat ? (sender === 'incoming' ? 'username' : undefined) : undefined,
      text: '',
    };
    onChange({
      ...data,
      messages: [...(data.messages || []), newMessage],
    });
  };

  const handleAddMessage = () => {
    handleAddMessageWithSender('incoming');
  };

  const handleUpdateMessage = (
    id: string,
    updated: Partial<InstagramDMMessage>
  ) => {
    const updatedMessages = (data.messages || []).map((msg) =>
      msg.id === id ? { ...msg, ...updated } : msg
    );
    onChange({ ...data, messages: updatedMessages });
  };

  const handleDeleteMessage = (id: string) => {
    const filtered = (data.messages || []).filter((msg) => msg.id !== id);
    onChange({ ...data, messages: filtered });
  };

  return (
    <div className="space-y-6">
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

      {/* 1. Account Info & UI Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <span>Direct Message Account Settings</span>
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={data.username || ''}
              onChange={(e) => updateField('username', e.target.value)}
              placeholder="username"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-normal"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={data.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Name"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <ImageUploader
          label="Header Profile Picture"
          value={data.avatar || ''}
          onChange={(url) => updateField('avatar', url)}
        />

        <ImageUploader
          label="Custom Chat Wallpaper (HD / Tajam & Bebas Blur)"
          value={data.customWallpaper || ''}
          onChange={(url) => updateField('customWallpaper', url)}
          onClear={() => updateField('customWallpaper', '')}
          aspectHint="Full Container Background (Tajam & Jernih)"
          allow916={true}
          skipCompression={true}
          maxOutputDimension={2560}
          quality={0.96}
        />

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Verified Badge
            </label>
            <select
              value={data.verified === 'none' || !data.verified ? 'none' : 'ig-blue'}
              onChange={(e) => updateField('verified', e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="none">None</option>
              <option value="ig-blue">Instagram Blue Verified</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                {t('theme.mode')}
              </label>
              {isCustomThemeActive && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  Custom Theme Mode
                </span>
              )}
            </div>
            <div className={`flex rounded-lg overflow-hidden border border-slate-200 bg-slate-100 p-1 transition-all ${
              isCustomThemeActive ? 'opacity-40 pointer-events-none grayscale' : ''
            }`}>
              <button
                type="button"
                disabled={isCustomThemeActive}
                onClick={() => updateField('theme', 'light')}
                className={`flex-1 py-1 text-xs font-medium rounded-md flex items-center justify-center space-x-1 transition-all ${
                  data.theme === 'light' && !isCustomThemeActive
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                } ${isCustomThemeActive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{t('theme.light')}</span>
              </button>
              <button
                type="button"
                disabled={isCustomThemeActive}
                onClick={() => updateField('theme', 'dark')}
                className={`flex-1 py-1 text-xs font-medium rounded-md flex items-center justify-center space-x-1 transition-all ${
                  data.theme === 'dark' && !isCustomThemeActive
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                } ${isCustomThemeActive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{t('theme.dark')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Status */}
        <div className="pt-2 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-xs font-normal text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={data.isActiveNow ?? false}
                onChange={(e) => updateField('isActiveNow', e.target.checked)}
                className="rounded border-slate-300 bg-white text-purple-600 focus:ring-0 accent-purple-600"
              />
              <span>Active Status (Green Dot)</span>
            </label>
            <span className="text-[11px] text-slate-500 font-normal">Header Sub-text</span>
          </div>

          <div>
            <input
              type="text"
              value={data.activeStatusText || ''}
              onChange={(e) => updateField('activeStatusText', e.target.value)}
              placeholder="e.g. Active now, Active 2h ago"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-normal"
            />
          </div>

          {/* Quick status suggestion pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['Active now', 'Active 15m ago', 'Active 1h ago', 'Active 2h ago', 'Active yesterday'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  onChange({
                    ...data,
                    isActiveNow: status === 'Active now',
                    activeStatusText: status,
                  });
                }}
                className={`px-2 py-0.5 text-[10px] font-normal rounded-md border transition-all cursor-pointer ${
                  data.activeStatusText === status
                    ? 'bg-purple-100 text-purple-700 border-purple-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Card at top of chat feed */}
        <div className="pt-3 border-t border-slate-200 space-y-3">
          <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showProfileCard === true}
              onChange={(e) => updateField('showProfileCard', e.target.checked)}
              className="rounded border-slate-300 bg-white text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span>Show Profile Card at Top of Chat Feed</span>
          </label>

          {data.showProfileCard === true && (
            <div className="space-y-2.5 pl-5 border-l-2 border-purple-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Followers Count
                  </label>
                  <input
                    type="text"
                    value={data.followersCount || ''}
                    onChange={(e) => updateField('followersCount', e.target.value)}
                    placeholder="e.g. 1.2K"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Posts Count
                  </label>
                  <input
                    type="text"
                    value={data.postsCount || ''}
                    onChange={(e) => updateField('postsCount', e.target.value)}
                    placeholder="e.g. 42"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Relationship Status Subtitle
                </label>
                <select
                  value={data.profileSubtitle || "You don't follow each other on Instagram"}
                  onChange={(e) => updateField('profileSubtitle', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="You don't follow each other on Instagram">
                    You don't follow each other on Instagram
                  </option>
                  <option value="You follow each other on Instagram">
                    You follow each other on Instagram
                  </option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Aspect Ratio & Group Chat Mode */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
          <Layout className="w-4 h-4 text-purple-600" />
          <span>Container & Chat Modes</span>
        </h3>

        {/* Container Aspect Ratio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Container Aspect Ratio
            </label>
            <div className="flex rounded-lg overflow-hidden border border-slate-200 bg-slate-100 p-1 gap-1">
              {(['1:1', '4:5', '9:16'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => updateField('aspectRatio', ratio)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    (data.aspectRatio || '4:5') === ratio
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Group Chat Mode */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={data.isGroupChat ?? false}
              onChange={(e) => updateField('isGroupChat', e.target.checked)}
              className="rounded border-slate-300 bg-white text-purple-600 focus:ring-0 w-4 h-4 accent-purple-600"
            />
            <span className="flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Group Chat Mode</span>
            </span>
          </label>

          {data.isGroupChat && (
            <div className="space-y-1.5 pl-6 pt-1 animate-fadeIn">
              <label className="block text-[11px] font-semibold text-slate-700">
                Group Members / Subtitle
              </label>
              <input
                type="text"
                value={data.groupMembers || ''}
                onChange={(e) => updateField('groupMembers', e.target.value)}
                placeholder="username, username, username"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-[10px] text-slate-500">
                List of group member names shown below the header.
              </p>
            </div>
          )}
        </div>

        {/* Message Request Mode */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                {isId ? 'Teks Placeholder Input Bawah' : 'Bottom Input Placeholder / Text'}
              </label>
              <div className="flex items-center gap-1">
                {['❤️', '😂', '🔥', '✨', '💬'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => updateField('bottomInputText', `${data.bottomInputText ?? ''}${emoji}`)}
                    className="hover:scale-125 transition-transform cursor-pointer px-0.5 text-xs inline-flex items-center"
                    title={`Insert ${emoji}`}
                  >
                    {renderIosEmojis(emoji)}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={data.bottomInputText ?? ''}
              onChange={(e) => updateField('bottomInputText', e.target.value)}
              placeholder={isId ? 'Pesan...' : 'Message...'}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center space-x-2 text-[11px] font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={data.showSeenStatus !== false}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const lastOutgoingIndex = (data.messages || []).reduce(
                    (lastIndex, message, messageIndex) => message.sender === 'outgoing' ? messageIndex : lastIndex,
                    -1,
                  );
                  const messages = (data.messages || []).map((message, messageIndex) =>
                    messageIndex === lastOutgoingIndex ? { ...message, showSeen: checked } : message,
                  );
                  onChange({ ...data, showSeenStatus: checked, messages });
                }}
                className="rounded border-slate-300 bg-white text-purple-600 focus:ring-0 w-3.5 h-3.5 accent-purple-600 cursor-pointer"
              />
              <span>{isId ? 'Tampilkan status dilihat' : 'Show seen status'}</span>
            </label>
            {data.showSeenStatus !== false && (
              <input
                type="text"
                value={data.seenText === 'Seen 56m ago' || data.seenText === 'Dilihat 56m lalu' ? '' : (data.seenText ?? '')}
                onChange={(e) => {
                  const value = e.target.value;
                  const lastOutgoingIndex = (data.messages || []).reduce(
                    (lastIndex, message, messageIndex) => message.sender === 'outgoing' ? messageIndex : lastIndex,
                    -1,
                  );
                  const messages = (data.messages || []).map((message, messageIndex) =>
                    messageIndex === lastOutgoingIndex ? { ...message, showSeen: true, seenText: value } : message,
                  );
                  onChange({ ...data, showSeenStatus: true, seenText: value, messages });
                }}
                placeholder="Seen 56m ago"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            )}
          </div>

          <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showMessageRequestPrompt ?? false}
              onChange={(e) => updateField('showMessageRequestPrompt', e.target.checked)}
              className="rounded border-slate-300 bg-white text-purple-600 focus:ring-0 w-4 h-4 accent-purple-600"
            />
            <span>Show Message Request</span>
          </label>
        </div>
      </div>

      {/* 3. Layout & Spacing Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-purple-600" />
          <span>Layout & Spacing Controls</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Same Sender Gap */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-slate-700">
                Same Sender Gap
              </label>
              <span className="text-xs font-bold text-purple-600">
                {data.sameSenderGap ?? 0}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="1"
              value={data.sameSenderGap ?? 0}
              onChange={(e) => updateField('sameSenderGap', parseInt(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">
              Gap between consecutive messages from the same sender
            </span>
          </div>

          {/* Different Sender Gap */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-slate-700">
                Different Sender Gap
              </label>
              <span className="text-xs font-bold text-purple-600">
                {data.differentSenderGap ?? 6}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={data.differentSenderGap ?? 6}
              onChange={(e) => updateField('differentSenderGap', parseInt(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">
              Gap between incoming/outgoing sender turns
            </span>
          </div>

          {/* Bubble Roundness */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-slate-700">
                Bubble Roundness
              </label>
              <span className="text-xs font-bold text-purple-600">
                {data.bubbleRoundness ?? 22}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={data.bubbleRoundness ?? 22}
              onChange={(e) => updateField('bubbleRoundness', parseInt(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">
              Corner radius of message bubbles (0-30px)
            </span>
          </div>
        </div>

        <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer pt-2 border-t border-slate-100">
          <input
            type="checkbox"
            checked={data.showTimestamps !== false}
            onChange={(e) => updateField('showTimestamps', e.target.checked)}
            className="rounded border-slate-300 bg-white text-purple-600 focus:ring-0 w-4 h-4 accent-purple-600"
          />
          <span>{isId ? 'Tampilkan Timestamp Pesan' : 'Show Message Timestamps'}</span>
        </label>
      </div>

      {/* 4. Unified Theme & Color Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center space-x-2">
            <Palette className="w-4 h-4 text-purple-600" />
            <span>Chat Theme Presets & Color Customization</span>
          </h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isCustomThemeActive ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}>
            {isCustomThemeActive ? 'Custom Mode Enabled' : 'Base Mode (Dark/Light)'}
          </span>
        </div>

        {/* Master Switch for Custom Theme Mode */}
        <div className={`p-3 rounded-xl flex items-center justify-between transition-colors ${
          isEditorDark
            ? 'bg-slate-800/80 border border-slate-700'
            : 'bg-slate-50/90 border border-slate-200 shadow-2xs'
        }`}>
          <div>
            <label htmlFor="custom-theme-master-toggle" className={`text-xs font-bold flex items-center space-x-2 cursor-pointer ${
              isEditorDark ? 'text-slate-100' : 'text-slate-800'
            }`}>
              <span>Enable Custom Theme Mode (Master Switch)</span>
            </label>
            <p className={`text-[11px] mt-0.5 ${
              isEditorDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Enable custom theme presets and manual color customization below.
            </p>
          </div>
          <input
            id="custom-theme-master-toggle"
            type="checkbox"
            checked={isCustomThemeActive}
            onChange={(e) => handleToggleCustomTheme(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0 accent-purple-600"
          />
        </div>

        {/* Custom Theme Settings Panel (Only shown when master switch is on) */}
        {isCustomThemeActive && (
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
          {/* Preset Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Theme Presets
            </label>
            {/* Quick Preset Badges */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {INSTAGRAM_DM_PRESETS.map((preset) => {
                const isSelected = isCustomThemeActive && (data.activeThemePreset || 'minion') === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={!isCustomThemeActive}
                    onClick={() => handleApplyPresetTheme(preset.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-purple-700 text-white shadow-xs scale-105 ring-2 ring-purple-300'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    } ${!isCustomThemeActive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Saved Custom Themes Section */}
          {savedCustomThemes.length > 0 && (
            <div className="pt-2 border-t border-purple-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-purple-600" />
                  <span>Tema Buatan Saya (Saved Custom Themes)</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {savedCustomThemes.length} preset
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {savedCustomThemes.map((theme) => {
                  const isSelected = isCustomThemeActive && data.activeThemePreset === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => handleApplyPresetTheme(theme.id, theme)}
                      className={`group inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                          : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-50'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                      <span>{theme.name}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomTheme(theme.id, e)}
                        className="ml-1 p-0.5 rounded hover:bg-black/20 text-current transition-colors opacity-70 hover:opacity-100"
                        title="Hapus tema"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save Current Theme Box */}
          <div className="pt-2 border-t border-purple-100 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <BookmarkPlus className="w-3.5 h-3.5 text-purple-600" />
              <span>Save Current Custom Theme</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                placeholder="Theme name (e.g., Neon Dreams)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveCustomTheme();
                  }
                }}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={handleSaveCustomTheme}
                disabled={!newThemeName.trim()}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <span>Save Preset</span>
              </button>
            </div>
            {saveSuccessMsg && (
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Theme successfully saved as custom preset!</span>
              </p>
            )}
          </div>

          {/* Custom Color Pickers Grid */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Fine-tune individual visual color elements:
                </p>
                <button
                  type="button"
                  onClick={handleResetColors}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition-colors cursor-pointer px-2 py-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800"
                  title="Reset semua kustomisasi warna ke default tema"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All Colors</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Chat Canvas Background */}
                <ColorInputRow
                  label="Chat Canvas Background"
                  value={data.customBgColor}
                  defaultHex={data.theme === 'light' ? '#fafafa' : '#000000'}
                  onChange={(val) => {
                    updateField('useCustomTheme', true);
                    updateField('customBgColor', val);
                  }}
                  onClear={() => updateField('customBgColor', '')}
                />

                {/* 2. Sender Bubble (Outgoing) */}
                <ColorInputRow
                  label="Sender Bubble (ME (RIGHT))"
                  value={data.customOutgoingBg}
                  defaultHex="#a855f7"
                  onChange={(val) => {
                    updateField('useCustomTheme', true);
                    updateField('customOutgoingBg', val);
                  }}
                  onClear={() => updateField('customOutgoingBg', '')}
                />

                {/* 3. Receiver Bubble (Incoming) */}
                <ColorInputRow
                  label="Receiver Bubble (YOU (LEFT))"
                  value={data.customIncomingBg}
                  defaultHex="#262626"
                  onChange={(val) => {
                    updateField('useCustomTheme', true);
                    updateField('customIncomingBg', val);
                  }}
                  onClear={() => updateField('customIncomingBg', '')}
                />

                {/* 4. Camera Button Background */}
                <ColorInputRow
                  label="Camera Button Background"
                  value={data.customCameraBg}
                  defaultHex="#0095f6"
                  onChange={(val) => {
                    updateField('useCustomTheme', true);
                    updateField('customCameraBg', val);
                  }}
                  onClear={() => updateField('customCameraBg', '')}
                />

                {/* 5. Camera Icon Color */}
                <ColorInputRow
                  label="Camera Icon Color"
                  value={data.customCameraIconColor}
                  defaultHex="#ffffff"
                  onChange={(val) => {
                    updateField('useCustomTheme', true);
                    updateField('customCameraIconColor', val);
                  }}
                  onClear={() => updateField('customCameraIconColor', '')}
                />

                {/* 6. Action Icons (+, Mic, Gallery, Sticker) */}
                <ColorInputRow
                  label="Action Icons (+, Mic, Gallery, Sticker)"
                  value={data.customIconColor}
                  defaultHex="#ffffff"
                  onChange={(val) => {
                    updateField('useCustomTheme', true);
                    updateField('customIconColor', val);
                  }}
                  onClear={() => updateField('customIconColor', '')}
                />

                {/* 7. Input Bar Background */}
                <ColorInputRow
                  label="Input Bar Background"
                  value={data.customPillBg}
                  defaultHex={data.theme === 'light' ? '#efefef' : '#262626'}
                  onChange={(val) => {
                    updateField('useCustomTheme', true);
                    updateField('customPillBg', val);
                  }}
                  onClear={() => updateField('customPillBg', '')}
                />

                {/* 8. Header Bar Background */}
                <ColorInputRow
                  label="Header Bar Background"
                  value={data.customHeaderBg}
                  defaultHex={data.theme === 'light' ? '#ffffff' : '#000000'}
                  onChange={(val) => {
                    updateField('useCustomTheme', true);
                    updateField('customHeaderBg', val);
                  }}
                  onClear={() => updateField('customHeaderBg', '')}
                />

                {/* 9. Header Text Color */}
                <ColorInputRow
                  label="Header Text Color"
                  value={data.customHeaderTextColor}
                  defaultHex={data.theme === 'light' ? '#000000' : '#ffffff'}
                  onChange={(val) => {
                    updateField('useCustomTheme', true);
                    updateField('customHeaderTextColor', val);
                  }}
                  onClear={() => updateField('customHeaderTextColor', '')}
                />

                {/* 10. Main Message Text Color */}
                <ColorInputRow
                  label="Main Message Text Color"
                  value={data.customTextColor}
                  defaultHex="#ffffff"
                  onChange={(val) => {
                    updateField('useCustomTheme', true);
                    updateField('customTextColor', val);
                  }}
                  onClear={() => updateField('customTextColor', '')}
                />

                {/* 11. Secondary Text Color */}
                <div className="sm:col-span-2">
                  <ColorInputRow
                    label="Secondary Text Color (Timestamps & Subtitles)"
                    value={data.customSecondaryTextColor}
                    defaultHex="#a3a3a3"
                    onChange={(val) => {
                      updateField('useCustomTheme', true);
                      updateField('customSecondaryTextColor', val);
                    }}
                    onClear={() => updateField('customSecondaryTextColor', '')}
                  />
                </div>
              </div>
            </div>
          </div>
      </div>
    )}
  </div>

      {/* 5. Message List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Chat Messages ({data.messages?.length || 0})
          </h3>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleAddMessageWithSender('incoming')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:bg-purple-600 active:text-white text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isId ? 'KAMU (KIRI)' : 'YOU (LEFT)'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddMessageWithSender('outgoing')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:bg-purple-600 active:text-white text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isId ? 'AKU (KANAN)' : 'ME (RIGHT)'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {(data.messages || []).map((msg, index) => {
            const isOutgoing = msg.sender === 'outgoing';
            const lastOutgoingIndex = (data.messages || []).reduce(
              (lastIndex, message, messageIndex) => message.sender === 'outgoing' ? messageIndex : lastIndex,
              -1,
            );
            const isLastOutgoing = index === lastOutgoingIndex;
            const isSeenChecked = isOutgoing && (msg.showSeen !== undefined
              ? msg.showSeen
              : data.showSeenStatus !== false && isLastOutgoing);
            const rawSeenText = msg.seenText !== undefined && msg.seenText !== '' ? msg.seenText : (data.seenText ?? '');
            const seenInputValue = rawSeenText === 'Seen 56m ago' || rawSeenText === 'Dilihat 56m lalu' ? '' : rawSeenText;
            const isDarkTheme = isEditorDark;
            const cardBgClass = isEditorDark
              ? 'p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3 relative group'
              : 'p-3 bg-white border border-slate-200 rounded-xl space-y-3 relative group shadow-2xs';
            const innerCardBgClass = isEditorDark
              ? 'bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 space-y-2'
              : 'bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80 space-y-2';
            const inputClass = isEditorDark
              ? 'w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-colors'
              : 'w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-colors';
            const textareaClass = isEditorDark
              ? 'w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors'
              : 'w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 transition-colors';
            const labelClass = isEditorDark ? 'text-slate-300' : 'text-slate-700';

            return (
              <div
                key={msg.id}
                data-sync-theme={isDarkTheme ? 'dark' : 'light'}
                className={cardBgClass}
              >
                <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2 ${isDarkTheme ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-bold ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>
                      {isId ? 'Pesan' : 'Message'} #{index + 1}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        isOutgoing
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      {isOutgoing ? (isId ? 'AKU (KANAN)' : 'ME (RIGHT)') : (isId ? 'KAMU (KIRI)' : 'YOU (LEFT)')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 ml-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const isNowRecalled = !msg.isRecalled;
                        handleUpdateMessage(msg.id, {
                          isRecalled: isNowRecalled,
                        });
                      }}
                      className={`p-1.5 cursor-pointer rounded-lg transition-colors ${
                        msg.isRecalled
                          ? 'text-rose-600 bg-rose-100 dark:bg-rose-950/60 font-bold'
                          : isDarkTheme
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title={
                        msg.isRecalled
                          ? (isId ? 'Batalkan Tarik Pesan' : 'Restore Message')
                          : (isId ? 'Tarik Pesan (Unsend / Recall)' : 'Unsend / Recall Message')
                      }
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(msg.id)}
                      className={`p-1.5 transition-colors cursor-pointer rounded-lg ${isDarkTheme ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/30' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                      title={isId ? 'Hapus Pesan' : 'Delete Message'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${labelClass}`}>
                      {isId ? 'Tipe Pengirim' : 'Sender Type'}
                    </label>
                    <div className={`flex rounded-lg overflow-hidden border p-0.5 ${
                      isDarkTheme ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
                    }`}>
                      <button
                        type="button"
                        onClick={() => handleUpdateMessage(msg.id, { sender: 'incoming', isThemeChange: false, isSystemMessage: false })}
                        className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-colors ${
                          !isOutgoing
                            ? 'bg-purple-600 text-white'
                            : isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {isId ? 'KAMU (KIRI)' : 'YOU (LEFT)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateMessage(msg.id, { sender: 'outgoing', isThemeChange: false, isSystemMessage: false })}
                        className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-colors ${
                          isOutgoing
                            ? 'bg-purple-600 text-white'
                            : isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {isId ? 'AKU (KANAN)' : 'ME (RIGHT)'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${labelClass}`}>
                      {isId ? 'Waktu / Jam' : 'Timestamp'}
                    </label>
                    <input
                      type="text"
                      value={msg.time || ''}
                      onChange={(e) =>
                        handleUpdateMessage(msg.id, { time: e.target.value })
                      }
                      placeholder="12:00"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Group Chat Sender Details for Incoming Message */}
                {!isOutgoing && data.isGroupChat && (
                  <div className={`grid grid-cols-2 gap-2 p-2.5 rounded-lg border transition-colors ${
                    isEditorDark
                      ? 'bg-slate-800/80 border-slate-700'
                      : 'bg-slate-50/80 border-slate-200/80'
                  }`}>
                    <div>
                      <label className={`block text-[10px] font-semibold mb-1 ${
                        isEditorDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        Sender Name (Group Chat)
                      </label>
                      <input
                        type="text"
                        value={msg.senderName || ''}
                        onChange={(e) =>
                          handleUpdateMessage(msg.id, { senderName: e.target.value })
                        }
                        placeholder="username"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-semibold mb-1 ${
                        isEditorDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        Sender Name Color
                      </label>
                      <input
                        type="color"
                        value={msg.senderColor || '#ec4899'}
                        onChange={(e) =>
                          handleUpdateMessage(msg.id, { senderColor: e.target.value })
                        }
                        className="w-full h-7 rounded border border-slate-300 dark:border-slate-700 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Message Text */}
                <div>
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <label className={`block text-[11px] font-semibold ${labelClass}`}>
                      {isId ? 'Teks Pesan' : 'Message Text'}
                    </label>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {['❤️', '😂', '😮', '😍', '😢', '👏', '🔥', '✨', '👍', '🥹'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleUpdateMessage(msg.id, { text: `${msg.text || ''}${emoji}` })}
                          className="hover:scale-125 transition-transform cursor-pointer px-0.5 text-xs inline-flex items-center"
                          title={`Insert ${emoji}`}
                        >
                          {renderIosEmojis(emoji)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={msg.text || ''}
                    onChange={(e) =>
                      handleUpdateMessage(msg.id, { text: e.target.value })
                    }
                    placeholder={isId ? 'Kirim pesan...' : 'Send a message'}
                    className={textareaClass}
                  />
                </div>

                {isOutgoing && (
                  <div className={`p-2 rounded-lg border space-y-1.5 ${isEditorDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <label className={`flex items-center gap-2 text-[11px] font-semibold cursor-pointer ${labelClass}`}>
                      <input
                        type="checkbox"
                        checked={isSeenChecked}
                        onChange={(e) => handleUpdateMessage(msg.id, { showSeen: e.target.checked })}
                        className="rounded border-slate-300 text-purple-600 focus:ring-0 w-3.5 h-3.5 accent-purple-600 cursor-pointer"
                      />
                      <span>{isId ? 'Tampilkan status dilihat' : 'Show seen status'}</span>
                    </label>
                    {isSeenChecked && (
                      <input
                        type="text"
                        value={seenInputValue}
                        onChange={(e) => {
                          const value = e.target.value;
                          const messages = (data.messages || []).map((message) =>
                            message.id === msg.id ? { ...message, showSeen: true, seenText: value } : message,
                          );
                          onChange({ ...data, seenText: value, messages });
                        }}
                        placeholder="Seen 56m ago"
                        className={inputClass}
                      />
                    )}
                  </div>
                )}

                {/* Reaction Emoji for this message */}
                <div className={`p-2 rounded-lg border ${isEditorDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <label className={`text-[11px] font-semibold ${labelClass}`}>
                      {isId ? 'Reaksi Emoji Pesan:' : 'Message Reaction:'}
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['❤️', '😂', '😮', '😍', '😢', '👏', '🔥'].map((emoji) => {
                        const isSelected = msg.reactionEmoji === emoji || (emoji === '❤️' && msg.isLiked && !msg.reactionEmoji);
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleUpdateMessage(msg.id, isSelected
                              ? { reactionEmoji: '', isLiked: false }
                              : { reactionEmoji: emoji, isLiked: emoji === '❤️' })}
                            className={`px-2 py-0.5 text-xs rounded-full border transition-all cursor-pointer inline-flex items-center ${
                              isSelected
                                ? 'bg-purple-600/20 border-purple-500 font-bold scale-105 shadow-2xs'
                                : isDarkTheme
                                  ? 'bg-slate-900 border-slate-700 hover:bg-slate-700 text-slate-200'
                                  : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            {renderIosEmojis(emoji)}
                          </button>
                        );
                      })}
                      {(msg.reactionEmoji || msg.isLiked) && (
                        <button
                          type="button"
                          onClick={() => handleUpdateMessage(msg.id, { reactionEmoji: '', isLiked: false })}
                          className="text-[10px] text-red-500 hover:text-red-700 font-semibold ml-1 cursor-pointer"
                        >
                          {isId ? 'Hapus' : 'Clear'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reply Feature (Pick Message to Reply from Dropdown) */}
                <div className={innerCardBgClass}>
                  <div className="flex items-center justify-between">
                    <label className={`block text-[11px] font-bold ${isEditorDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Reply Quote Box
                    </label>
                    {(msg.showReplyQuote || msg.replyToText || msg.replyToSender) && (
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateMessage(msg.id, {
                            showReplyQuote: false,
                            replyToMessageId: '',
                            replyToText: '',
                            replyToSender: '',
                          })
                        }
                        className="text-[10px] text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                      >
                        Clear Reply
                      </button>
                    )}
                  </div>

                  <div>
                    <label className={`block text-[10px] font-semibold mb-1 ${isEditorDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Pick Message to Reply
                    </label>
                    <select
                      value={(() => {
                        if (msg.replyToMessageId) {
                          const foundIndex = (data.messages || []).findIndex((message) => message.id === msg.replyToMessageId);
                          if (foundIndex >= 0) return String(foundIndex);
                        }
                        if (msg.replyToText) {
                          const foundIndex = (data.messages || []).findIndex(
                            (message, messageIndex) => messageIndex !== index && (message.text === msg.replyToText || (message.imageUrl && msg.replyToText?.includes('Photo'))),
                          );
                          if (foundIndex >= 0) return String(foundIndex);
                        }
                        return '';
                      })()}
                      onChange={(e) => {
                        const selectedIdx = parseInt(e.target.value, 10);
                        const messagesList = data.messages || [];
                        if (!isNaN(selectedIdx) && messagesList[selectedIdx]) {
                          const targetMsg = messagesList[selectedIdx];
                          const replyText = targetMsg.text || (targetMsg.imageUrl ? '📷 Photo' : 'Message');
                          const isTargetOutgoing = targetMsg.sender === 'outgoing';
                          const senderLabel = isTargetOutgoing ? 'You replied' : 'Replied to you';
                          handleUpdateMessage(msg.id, {
                            showReplyQuote: true,
                            replyToMessageId: targetMsg.id,
                            replyToText: replyText,
                            replyToSender: senderLabel,
                          });
                        } else {
                          handleUpdateMessage(msg.id, {
                            showReplyQuote: false,
                            replyToMessageId: '',
                            replyToText: '',
                            replyToSender: '',
                          });
                        }
                      }}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="" disabled hidden>{isId ? '-- Pilih pesan dari obrolan ini --' : '-- Select a message from this chat --'}</option>
                      {(data.messages || [])
                        .map((m, mIdx) => ({ m, mIdx }))
                        .filter(({ mIdx }) => mIdx !== index)
                        .map(({ m, mIdx }) => {
                          const senderLabel = m.sender === 'outgoing' ? (isId ? 'AKU (KANAN)' : 'ME (RIGHT)') : (isId ? 'KAMU (KIRI)' : 'YOU (LEFT)');
                          const previewText = m.text || (m.imageUrl ? (isId ? '[Foto]' : '[Photo]') : `${isId ? 'Pesan' : 'Message'} #${mIdx + 1}`);
                          return (
                            <option key={m.id || mIdx} value={mIdx}>
                              #{mIdx + 1} ({senderLabel}): {previewText.slice(0, 35)}
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  {(msg.replyToText || msg.replyToSender) && (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className={`block text-[10px] font-semibold mb-1 ${isEditorDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Reply Header / Sender Label
                          </label>
                          <input
                            type="text"
                            value={msg.replyToSender || ''}
                            onChange={(e) =>
                              handleUpdateMessage(msg.id, { replyToSender: e.target.value })
                            }
                            placeholder="You replied"
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={`block text-[10px] font-semibold mb-1 ${isEditorDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Quoted Message Text
                          </label>
                          <input
                            type="text"
                            value={msg.replyToText || ''}
                            onChange={(e) =>
                              handleUpdateMessage(msg.id, { replyToText: e.target.value })
                            }
                            placeholder="Quoted text..."
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {/* Reply Colors */}
                      <div className={`pt-1.5 border-t space-y-1.5 ${isEditorDark ? 'border-slate-700' : 'border-slate-200/80'}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className={`block text-[10px] font-semibold mb-1 ${isEditorDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              Warna Garis Vertikal (Bar Color)
                            </label>
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="color"
                                value={msg.replyBarColor || '#888888'}
                                onChange={(e) => handleUpdateMessage(msg.id, { replyBarColor: e.target.value })}
                                className="w-6 h-6 rounded cursor-pointer border border-slate-300 dark:border-slate-600 p-0 shrink-0"
                              />
                              <input
                                type="text"
                                value={msg.replyBarColor || ''}
                                onChange={(e) => handleUpdateMessage(msg.id, { replyBarColor: e.target.value })}
                                placeholder="Auto / Default"
                                className={`flex-1 font-mono text-[11px] ${inputClass} py-0.5`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={`block text-[10px] font-semibold mb-1 ${isEditorDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              Warna Teks Balasan (Sender Color)
                            </label>
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="color"
                                value={msg.replySenderColor || '#888888'}
                                onChange={(e) => handleUpdateMessage(msg.id, { replySenderColor: e.target.value })}
                                className="w-6 h-6 rounded cursor-pointer border border-slate-300 dark:border-slate-600 p-0 shrink-0"
                              />
                              <input
                                type="text"
                                value={msg.replySenderColor || ''}
                                onChange={(e) => handleUpdateMessage(msg.id, { replySenderColor: e.target.value })}
                                placeholder="Auto / Default"
                                className={`flex-1 font-mono text-[11px] ${inputClass} py-0.5`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Presets */}
                        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                          <span className={`text-[10px] font-medium ${isEditorDark ? 'text-slate-400' : 'text-slate-600'}`}>Presets:</span>
                          {[
                            { name: 'Neutral Gray', hex: '#64748b' },
                            { name: 'Sky Blue', hex: '#0284c7' },
                            { name: 'Purple', hex: '#8b5cf6' },
                            { name: 'Pink', hex: '#ec4899' },
                            { name: 'WhatsApp Green', hex: '#25D366' },
                            { name: 'Amber', hex: '#f59e0b' },
                          ].map((preset) => (
                            <button
                              key={preset.hex}
                              type="button"
                              onClick={() => handleUpdateMessage(msg.id, { replyBarColor: preset.hex, replySenderColor: preset.hex })}
                              style={{ backgroundColor: preset.hex }}
                              className="w-4 h-4 rounded-full border border-black/20 hover:scale-125 transition-transform cursor-pointer"
                              title={preset.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Story Reply Feature Inputs */}
                <div className={`p-2.5 rounded-lg border space-y-2 transition-colors ${
                  isEditorDark
                    ? 'bg-slate-800/80 border-slate-700'
                    : 'bg-slate-50/80 border border-slate-200/80'
                }`}>
                  <label className={`flex items-center space-x-2 text-xs font-bold cursor-pointer ${
                    isEditorDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    <input
                      type="checkbox"
                      checked={msg.isStoryReply ?? false}
                      onChange={(e) => handleUpdateMessage(msg.id, { isStoryReply: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-0 w-4 h-4 accent-purple-600 cursor-pointer"
                    />
                    <span>Story Reply Message</span>
                  </label>
                  {(msg.isStoryReply || msg.storyReplyImageUrl) && (
                    <ImageUploader
                      label="Replied Story Image (9:16)"
                      value={msg.storyReplyImageUrl || ''}
                      onChange={(url) => handleUpdateMessage(msg.id, { storyReplyImageUrl: url, isStoryReply: true })}
                    />
                  )}
                </div>

                {/* Optional Image Attachment */}
                <div className="space-y-2">
                  <ImageUploader
                    label="Attached Image"
                    value={msg.imageUrl || ''}
                    onChange={(url) => handleUpdateMessage(msg.id, { imageUrl: url })}
                  />
                </div>

                {/* Multiple Photo Stack */}
                <div className={`p-2.5 rounded-lg border space-y-2 transition-colors ${
                  isEditorDark
                    ? 'bg-slate-800/80 border-slate-700'
                    : 'bg-slate-50/80 border-slate-200/80'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className={`text-xs font-bold ${labelClass}`}>
                        {isId ? 'Tumpukan Foto' : 'Photo Stack'}
                      </p>
                      <p className={`text-[10px] ${isEditorDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {isId ? 'Tambahkan 2–4 foto untuk tampilan bertumpuk.' : 'Add 2–4 photos for the stacked-photo layout.'}
                      </p>
                    </div>
                    {(msg.photoStack?.length || 0) < 4 && (
                      <button
                        type="button"
                        onClick={() => {
                          const current = msg.photoStack || [];
                          const next = current.length === 0 ? ['', ''] : [...current, ''];
                          handleUpdateMessage(msg.id, { photoStack: next, photoCount: next.length });
                        }}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-purple-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-purple-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {isId ? 'Tambah Foto' : 'Add Photo'}
                      </button>
                    )}
                  </div>

                  {(msg.photoStack || []).map((photo, photoIndex) => (
                    <div key={`${msg.id}-photo-${photoIndex}`} className="relative rounded-lg border border-slate-200/80 dark:border-slate-700 p-2">
                      <ImageUploader
                        label={`${isId ? 'Foto' : 'Photo'} ${photoIndex + 1}`}
                        value={photo}
                        onChange={(url) => {
                          const next = [...(msg.photoStack || [])];
                          next[photoIndex] = url;
                          handleUpdateMessage(msg.id, { photoStack: next, photoCount: next.length });
                        }}
                        onClear={() => {
                          const remaining = (msg.photoStack || []).filter((_, indexToKeep) => indexToKeep !== photoIndex);
                          const next = remaining.length >= 2 ? remaining : [];
                          handleUpdateMessage(msg.id, {
                            photoStack: next,
                            photoCount: next.length,
                          });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const remaining = (msg.photoStack || []).filter((_, indexToKeep) => indexToKeep !== photoIndex);
                          const next = remaining.length >= 2 ? remaining : [];
                          handleUpdateMessage(msg.id, { photoStack: next, photoCount: next.length });
                        }}
                        className="absolute right-2 top-2 rounded-md p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title={isId ? 'Hapus foto' : 'Remove photo'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Profile Button */}
      <SaveProfileButton onSave={onSaveProfile} />
    </div>
  );
};
