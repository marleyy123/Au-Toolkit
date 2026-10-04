import React, { useState, useEffect } from 'react';
import { WhatsAppChatData, WhatsAppChatMessage, CharacterPreset } from '../../../types';
import { CharacterSelector, ImageUploader, SaveProfileButton } from '../../../components/FormControls';
import { toHexForPicker } from '../../../utils/colorUtils';
import { WHATSAPP_CHAT_PRESETS, WhatsAppPresetTheme } from '../../../data/whatsappPresets';
import { Plus, Trash2, ArrowUp, ArrowDown, Check, CheckCheck, Sun, Moon, Smile, Image as ImageIcon, MessageSquare, Layout, Sliders, Palette, Maximize2, RotateCcw, Phone, Video, Calendar, Bookmark, BookmarkPlus, Sparkles, Mail, Smartphone, ShieldAlert, Ban } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { auth } from '../../../firebase';
import { isWhatsAppMessageDivider, resolveWhatsAppGroupSenders } from '../messageSenders';
import {
  readPersistentUserAssets,
  subscribePersistentUserAssets,
  updatePersistentUserAsset,
} from '../../../utils/userAssets';

interface Props {
  data: WhatsAppChatData;
  onChange: (updated: WhatsAppChatData) => void;
  characters: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

const SAMPLE_STICKERS = [
  { name: 'Cat Smile', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png' },
  { name: 'Laughing Dog', url: 'https://cdn-icons-png.flaticon.com/512/616/616408.png' },
  { name: 'Heart Bear', url: 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png' },
  { name: 'Cool Duck', url: 'https://cdn-icons-png.flaticon.com/512/3069/3069172.png' },
];

const getWaUserStorageKey = () => {
  try {
    const email = localStorage.getItem('au_user_email');
    if (email && email.trim()) {
      return `au_toolkit_wa_saved_custom_themes_${email.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
    }
    const rawUser = localStorage.getItem('au_auth_user') || localStorage.getItem('au_account_user') || localStorage.getItem('au_firebase_auth_user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?.email) {
        return `au_toolkit_wa_saved_custom_themes_${parsed.email.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
      }
      if (parsed?.uid) {
        return `au_toolkit_wa_saved_custom_themes_${parsed.uid.replace(/[^a-z0-9_]/g, '_')}`;
      }
    }
  } catch {}
  try {
    const code = localStorage.getItem('au_access_code');
    if (code && code.trim()) {
      return `au_toolkit_wa_saved_custom_themes_${code.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
    }
  } catch {}
  return 'au_toolkit_wa_saved_custom_themes_device';
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

export const WhatsAppChatForm: React.FC<Props> = ({
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
  const { isDark: isEditorDark } = useTheme();
  const { t, isId } = useLanguage();
  const updateField = <K extends keyof WhatsAppChatData>(key: K, value: WhatsAppChatData[K]) => {
    onChange({ ...data, [key]: value });
  };

  // State for active / clicked action divider buttons
  const [activeActionBtn, setActiveActionBtn] = useState<'date_divider' | 'unread_divider' | null>(null);
  const [openSenderNameIds, setOpenSenderNameIds] = useState<Record<string, boolean>>({});
  const [openReplyBoxIds, setOpenReplyBoxIds] = useState<Record<string, boolean>>({});

  // Custom Saved Themes State (Isolated per user account / device)
  const [savedCustomThemes, setSavedCustomThemes] = useState<WhatsAppPresetTheme[]>(() => {
    try {
      return readPersistentUserAssets(auth.currentUser?.uid, auth.currentUser?.email).whatsappCustomThemes;
    } catch (e) {
      return [];
    }
  });
  const [newThemeName, setNewThemeName] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => subscribePersistentUserAssets((assets) => {
    setSavedCustomThemes(assets.whatsappCustomThemes);
  }), []);

  // Safe collapsible accordion state for Theme Customization panel
  const [isThemeCustomizationOpen, setIsThemeCustomizationOpen] = useState<boolean>(() => {
    try {
      return Boolean(data?.useCustomColors ?? false);
    } catch {
      return false;
    }
  });

  // Keep accordion state synchronized with external data.useCustomColors updates
  useEffect(() => {
    try {
      if (data && typeof data.useCustomColors === 'boolean') {
        setIsThemeCustomizationOpen(data.useCustomColors);
      }
    } catch (err) {
      console.warn('Safe sync theme customization state warning:', err);
    }
  }, [data?.useCustomColors]);

  // Safe toggle handler for "Enable Theme Customization" checkbox
  const handleToggleThemeCustomization = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      if (!data || typeof onChange !== 'function') return;

      const panel = document.getElementById('customization-panel');
      const savedPanelScroll = panel ? panel.scrollTop : 0;
      const savedWinScroll = window.scrollY || document.documentElement.scrollTop || 0;

      const nextState = !isThemeCustomizationOpen;
      setIsThemeCustomizationOpen(nextState);

      const current = data;
      if (nextState) {
        const presetsList = Array.isArray(WHATSAPP_CHAT_PRESETS) ? WHATSAPP_CHAT_PRESETS : [];
        const classicPreset =
          presetsList.find((p) => p?.id === 'wa-classic-light') ||
          presetsList[0] ||
          null;

        onChange({
          ...current,
          useCustomColors: true,
          activeThemePreset: current.activeThemePreset || classicPreset?.id || 'wa-classic-light',
          chatBgColor: current.chatBgColor || classicPreset?.chatBgColor || '#efeae2',
          senderBubbleColor: current.senderBubbleColor || classicPreset?.senderBubbleColor || '#d9fdd3',
          receiverBubbleColor: current.receiverBubbleColor || classicPreset?.receiverBubbleColor || '#ffffff',
          barBgColor: current.barBgColor || current.inputBgColor || classicPreset?.inputBgColor || '#f0f2f5',
          inputBgColor: current.inputBgColor || classicPreset?.inputBgColor || '#f0f2f5',
          cameraBgColor: current.cameraBgColor || classicPreset?.cameraBgColor || '#008069',
          cameraIconColor: current.cameraIconColor || classicPreset?.cameraIconColor || '#ffffff',
          iconColor: current.iconColor || classicPreset?.iconColor || '#008069',
          headerBgColor: current.headerBgColor || classicPreset?.headerBgColor || '#f0f2f5',
          headerTextColor: current.headerTextColor || classicPreset?.headerTextColor || '#111b21',
          mainTextColor: current.mainTextColor || classicPreset?.mainTextColor || '#111b21',
          secondaryTextColor: current.secondaryTextColor || classicPreset?.secondaryTextColor || '#667781',
          timestampColor: current.timestampColor || classicPreset?.timestampColor || '#667781',
          missedCallCircleBg: current.missedCallCircleBg || classicPreset?.missedCallCircleBg || '#ffffff',
          theme: current.theme || 'light',
        });
      } else {
        onChange({
          ...current,
          useCustomColors: false,
        });
      }

      // Restore scroll positions across animation frames to prevent jump / scrolling
      requestAnimationFrame(() => {
        if (panel && panel.scrollTop !== savedPanelScroll) {
          panel.scrollTop = savedPanelScroll;
        }
        if ((window.scrollY || document.documentElement.scrollTop) !== savedWinScroll) {
          window.scrollTo(0, savedWinScroll);
        }
      });
    } catch (err) {
      console.error('Safe toggle theme customization error:', err);
    }
  };

  // Save Current Colors as Custom Theme Preset
  const handleSaveCustomTheme = () => {
    const trimmed = newThemeName.trim();
    if (!trimmed) return;

    const newPreset: WhatsAppPresetTheme = {
      id: 'custom-' + Date.now(),
      name: trimmed,
      description: 'User saved custom theme',
      chatBgColor: data?.chatBgColor || '#efeae2',
      senderBubbleColor: data?.senderBubbleColor || '#d9fdd3',
      receiverBubbleColor: data?.receiverBubbleColor || '#ffffff',
      inputBgColor: data?.inputBgColor || data?.barBgColor || '#f0f2f5',
      cameraBgColor: data?.cameraBgColor || '#008069',
      cameraIconColor: data?.cameraIconColor || '#ffffff',
      iconColor: data?.iconColor || '#008069',
      headerBgColor: data?.headerBgColor || data?.barBgColor || '#f0f2f5',
      headerTextColor: data?.headerTextColor || data?.mainTextColor || '#111b21',
      mainTextColor: data?.mainTextColor || '#111b21',
      secondaryTextColor: data?.secondaryTextColor || '#667781',
      timestampColor: data?.timestampColor || data?.secondaryTextColor || '#8696a0',
      missedCallCircleBg: data?.missedCallCircleBg || (data?.theme === 'dark' ? '#323739' : '#ffffff'),
      theme: data?.theme || 'light',
    };

    const currentThemes = Array.isArray(savedCustomThemes) ? savedCustomThemes : [];
    const updated = [newPreset, ...currentThemes];
    setSavedCustomThemes(updated);
    try {
      updatePersistentUserAsset(auth.currentUser?.uid, auth.currentUser?.email, 'whatsappCustomThemes', updated);
    } catch (e) {}

    setNewThemeName('');
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
    updateField('activeThemePreset', newPreset.id);
  };

  const handleDeleteCustomTheme = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentThemes = Array.isArray(savedCustomThemes) ? savedCustomThemes : [];
    const filtered = currentThemes.filter((t) => t && t.id !== id);
    setSavedCustomThemes(filtered);
    try {
      updatePersistentUserAsset(auth.currentUser?.uid, auth.currentUser?.email, 'whatsappCustomThemes', filtered);
    } catch (err) {}
  };

  const handleApplyPreset = (preset?: WhatsAppPresetTheme) => {
    if (!preset || !data) return;
    try {
      if (typeof onChange !== 'function') return;
      onChange({
        ...data,
        useCustomColors: true,
        activeThemePreset: preset.id || 'wa-classic-light',
        chatBgColor: preset.chatBgColor || '#efeae2',
        senderBubbleColor: preset.senderBubbleColor || '#d9fdd3',
        receiverBubbleColor: preset.receiverBubbleColor || '#ffffff',
        barBgColor: preset.inputBgColor || '#f0f2f5',
        inputBgColor: preset.inputBgColor || '#f0f2f5',
        cameraBgColor: preset.cameraBgColor || '#008069',
        cameraIconColor: preset.cameraIconColor || '#ffffff',
        iconColor: preset.iconColor || '#008069',
        headerBgColor: preset.headerBgColor || '#f0f2f5',
        headerTextColor: preset.headerTextColor || '#111b21',
        mainTextColor: preset.mainTextColor || '#111b21',
        secondaryTextColor: preset.secondaryTextColor || '#667781',
        timestampColor: preset.timestampColor || preset.secondaryTextColor || '#667781',
        missedCallCircleBg: preset.missedCallCircleBg || (preset.theme === 'dark' ? '#323739' : '#ffffff'),
        theme: preset.theme || data?.theme || 'light',
      });
      setIsThemeCustomizationOpen(true);
    } catch (err) {
      console.error('Error applying preset safely:', err);
    }
  };

  // Add Message
  const handleAddMessage = (sender: 'incoming' | 'outgoing', type: 'text' | 'image' | 'sticker' = 'text') => {
    const lastMessage = data.isGroupChat ? resolveWhatsAppGroupSenders(data.messages || []).at(-1) : undefined;
    const previous = lastMessage && !isWhatsAppMessageDivider(lastMessage) ? lastMessage : undefined;
    const newMessage: WhatsAppChatMessage = {
      id: 'wa-msg-' + Date.now(),
      sender,
      type,
      text: type === 'text' ? '' : '',
      imageUrl: '',
      imageUrls: type === 'image' ? [''] : [],
      stickerUrl: type === 'sticker' ? SAMPLE_STICKERS[0].url : '',
      time: '',
      isRead: true,
      senderName: sender === 'incoming' && previous?.sender === 'incoming' ? previous.senderName : undefined,
      senderColor: sender === 'incoming' && previous?.sender === 'incoming' ? previous.senderColor : undefined,
    };
    updateField('messages', [...(data.messages || []), newMessage]);
  };

  // Update Message
  const handleUpdateMessage = (index: number, updatedField: Partial<WhatsAppChatMessage>) => {
    const updatedMsgs = [...(data.messages || [])];
    updatedMsgs[index] = { ...updatedMsgs[index], ...updatedField };
    updateField('messages', updatedMsgs);
  };

  // Delete Message
  const handleRemoveMessage = (index: number) => {
    const updatedMsgs = (data.messages || []).filter((_, i) => i !== index);
    updateField('messages', updatedMsgs);
  };

  // Reorder Messages
  const handleMoveMessage = (index: number, direction: 'up' | 'down') => {
    const messages = [...(data.messages || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= messages.length) return;
    const temp = messages[index];
    messages[index] = messages[targetIndex];
    messages[targetIndex] = temp;
    updateField('messages', messages);
  };

  return (
    <div className="space-y-4 text-slate-800">
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

      {/* 1. CONTACT INFO, CONTENT & THEME */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Contact Info & Chat Header</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              {data.isGroupChat ? 'Group Name' : 'Contact Name'}
            </label>
            <input
              type="text"
              value={data.contactName || ''}
              onChange={(e) => updateField('contactName', e.target.value)}
              placeholder={data.isGroupChat ? 'Group Name' : 'Name'}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              {data.isGroupChat ? 'Group Participants (Comma-separated)' : 'Contact Status'}
            </label>
            <input
              type="text"
              value={data.isGroupChat ? (data.groupParticipants ?? '') : (data.statusText ?? '')}
              onChange={(e) => {
                if (data.isGroupChat) {
                  updateField('groupParticipants', e.target.value);
                } else {
                  updateField('statusText', e.target.value);
                }
              }}
              placeholder={data.isGroupChat ? 'Siti, Budi, Andi, You' : (data.isOnline !== false ? 'online' : 'offline')}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Is Group Chat Toggle */}
        <div className="pt-1">
          <label className="flex items-center space-x-2.5 cursor-pointer bg-slate-50 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors select-none">
            <input
              type="checkbox"
              checked={!!data.isGroupChat}
              onChange={(e) => {
                const checked = e.target.checked;
                const panel = document.getElementById('customization-panel');
                const st = panel ? panel.scrollTop : 0;
                updateField('isGroupChat', checked);
                requestAnimationFrame(() => {
                  if (panel && panel.scrollTop !== st) panel.scrollTop = st;
                });
              }}
              className="rounded text-purple-600 focus:ring-0 w-4 h-4 cursor-pointer accent-purple-600"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 block">Is Group Chat? (Mode Chat Grup)</span>
              <span className="text-[10px] text-slate-500 block">Tampilkan daftar anggota di subtitle header & nama pengirim berwarna di tiap pesan masuk</span>
            </div>
          </label>
        </div>

        {/* Contact Profile Picture */}
        <ImageUploader
          label="Contact Profile Picture (Avatar)"
          value={data.contactAvatar || ''}
          onChange={(url) => updateField('contactAvatar', url)}
          onClear={() => updateField('contactAvatar', '')}
        />

        {/* Aspect Ratio, Device OS & Theme */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1 flex items-center space-x-1">
              <Layout className="w-3.5 h-3.5 text-purple-600" />
              <span>Container Aspect Ratio</span>
            </label>
            <div className="flex space-x-1.5">
              {(['1:1', '4:5', '9:16'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => updateField('aspectRatio', ratio)}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    (data.aspectRatio || '4:5') === ratio
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Theme Mode {data.useCustomColors && <span className="text-amber-600 font-normal text-[10px]">(Kustom)</span>}
            </label>
            <div className="flex space-x-1.5">
              {(['light', 'dark'] as const).map((t) => {
                const isDisabled = !!data.useCustomColors;
                const isSelected = !isDisabled && data.theme === t;
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => updateField('theme', t)}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center space-x-1.5 transition-all ${
                      isDisabled
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50'
                        : isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs cursor-pointer'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer'
                    }`}
                  >
                    {t === 'light' ? (
                      <>
                        <Sun className="w-3.5 h-3.5" />
                        <span>Light</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-3.5 h-3.5" />
                        <span>Dark</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upload Chat Wallpaper (Crisp / Sharp / HD) */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <ImageUploader
            label="Upload Chat Wallpaper (Custom Background Image - HD / Tajam)"
            value={data.chatWallpaper || ''}
            onChange={(url) => updateField('chatWallpaper', url)}
            onClear={() => updateField('chatWallpaper', '')}
            aspectHint="Full Container Background (Tajam & Jernih)"
            allow916={true}
            skipCompression={true}
            maxOutputDimension={2560}
            quality={0.96}
          />
        </div>

        {/* Toggle Options */}
        <div className="pt-1 space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!data.showInputBar}
              onChange={(e) => {
                const checked = e.target.checked;
                const panel = document.getElementById('customization-panel');
                const st = panel ? panel.scrollTop : 0;
                updateField('showInputBar', checked);
                requestAnimationFrame(() => {
                  if (panel && panel.scrollTop !== st) panel.scrollTop = st;
                });
              }}
              className="rounded text-purple-600 focus:ring-0 w-4 h-4 accent-purple-600 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-700">Show Bottom Input Bar</span>
          </label>

          {!!data.showInputBar && (
            <div className="pt-1">
              <label className="text-xs text-slate-700 font-semibold block mb-1">
                Bottom Bar Input Text / Draft Message
              </label>
              <input
                type="text"
                value={data.inputText || ''}
                onChange={(e) => updateField('inputText', e.target.value)}
                placeholder="Type draft message here..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
            </div>
          )}
        </div>

        {/* Message Spacing & Roundness Controls */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-purple-600" />
            <span>Layout & Spacing Controls (Jarak & Kelengkungan)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
              <label htmlFor="wa-bubble-width" className="flex justify-between items-center text-xs font-semibold text-slate-700">
                <span>{isId ? 'Lebar Bubble' : 'Bubble Width'}</span>
                <span className="font-mono text-purple-700">{data.bubbleWidthPercent ?? 94}%</span>
              </label>
              <input id="wa-bubble-width" type="range" min={50} max={94} step={1}
                value={data.bubbleWidthPercent ?? 94}
                onChange={(e) => updateField('bubbleWidthPercent', Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
              <label htmlFor="wa-message-font-size" className="flex justify-between items-center text-xs font-semibold text-slate-700">
                <span>{isId ? 'Ukuran Teks Pesan' : 'Message Text Size'}</span>
                <span className="font-mono text-purple-700">{data.messageFontSize ?? 15}px</span>
              </label>
              <input id="wa-message-font-size" type="range" min={11} max={18} step={1}
                value={data.messageFontSize ?? 15}
                onChange={(e) => updateField('messageFontSize', Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer" />
            </div>
            {/* Same Sender Gap */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Same Sender Gap</span>
                <span className="font-mono text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-bold text-[11px]">
                  {data.sameSenderGap ?? 3}px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={24}
                step={1}
                value={data.sameSenderGap ?? 3}
                onChange={(e) => updateField('sameSenderGap', parseInt(e.target.value, 10))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">Antar bubble pengirim sama</p>
            </div>

            {/* Different Sender Gap */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Different Sender Gap</span>
                <span className="font-mono text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-bold text-[11px]">
                  {data.differentSenderGap ?? 12}px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={48}
                step={1}
                value={data.differentSenderGap ?? 12}
                onChange={(e) => updateField('differentSenderGap', parseInt(e.target.value, 10))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">Pemisah pesan masuk/keluar</p>
            </div>

            {/* Bubble Roundness */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Bubble Roundness</span>
                <span className="font-mono text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-bold text-[11px]">
                  {data.bubbleRoundness ?? 12}px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={data.bubbleRoundness ?? 12}
                onChange={(e) => updateField('bubbleRoundness', parseInt(e.target.value, 10))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">Kelengkungan sudut (0-30px)</p>
            </div>
          </div>
        </div>

        {/* Custom Theme Mode Toggle & Color Presets */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
              <Palette className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Chat Theme Presets & Color Customization</span>
            </h4>
            <button
              type="button"
              id="whatsapp-enable-custom-theme-toggle"
              role="switch"
              aria-checked={isThemeCustomizationOpen}
              onClick={handleToggleThemeCustomization}
              className="inline-flex items-center space-x-2.5 cursor-pointer px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all select-none shadow-xs shrink-0"
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${
                  isThemeCustomizationOpen
                    ? 'bg-purple-600 border border-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-500 hover:border-purple-500'
                }`}
              >
                {isThemeCustomizationOpen && <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />}
              </div>
              <span className="text-xs font-bold leading-none text-slate-900 dark:text-white whitespace-nowrap">
                Enable Theme Customization
              </span>
            </button>
          </div>

          {isThemeCustomizationOpen && (
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 space-y-4 transition-all">
              {/* Built-in & User Saved Presets in one unified list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Theme Presets
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {(WHATSAPP_CHAT_PRESETS || []).length + savedCustomThemes.length} pilihan
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {/* System Presets (Intact & never overwritten) */}
                  {(WHATSAPP_CHAT_PRESETS || []).map((preset) => {
                    if (!preset) return null;
                    const isSelected = data?.activeThemePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-purple-700 text-white shadow-xs scale-105 ring-2 ring-purple-300'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        <span>{preset.name}</span>
                      </button>
                    );
                  })}

                  {/* User-Specific Saved Custom Presets automatically included in Theme Presets */}
                  {savedCustomThemes.map((theme) => {
                    if (!theme || !theme.id) return null;
                    const isSelected = data?.activeThemePreset === theme.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => handleApplyPreset(theme)}
                        className={`group inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-700 text-white border-purple-700 shadow-xs scale-105 ring-2 ring-purple-300'
                            : 'bg-white dark:bg-slate-800 border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                        }`}
                        title={theme.name}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Bookmark className="w-3 h-3 text-purple-500" />
                        )}
                        <span>{theme.name}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustomTheme(theme.id, e)}
                          className="ml-1 p-0.5 rounded hover:bg-red-500 hover:text-white text-current transition-colors opacity-60 hover:opacity-100 cursor-pointer"
                          title="Hapus preset kustom"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save Current Theme Box */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <BookmarkPlus className="w-3.5 h-3.5 text-purple-600" />
                  <span>Save Current Custom Theme</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                    placeholder="Nama preset kustom (misal: Sunset)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveCustomTheme();
                      }
                    }}
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Preset kustom berhasil disimpan dan ditambahkan ke Theme Presets!</span>
                  </p>
                )}
              </div>

              {/* Fine-tune Individual Visual Color Elements with editable & clearable inputs */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Fine-tune individual visual color elements (Editable & Clearable):
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      updateField('useCustomColors', false);
                      updateField('chatBgColor', '');
                      updateField('senderBubbleColor', '');
                      updateField('receiverBubbleColor', '');
                      updateField('inputBgColor', '');
                      updateField('barBgColor', '');
                      updateField('cameraIconColor', '');
                      updateField('iconColor', '');
                      updateField('headerBgColor', '');
                      updateField('headerTextColor', '');
                      updateField('mainTextColor', '');
                      updateField('secondaryTextColor', '');
                      updateField('timestampColor', '');
                      updateField('missedCallCircleBg', '');
                    }}
                    className="text-[10px] text-slate-400 hover:text-red-500 transition-colors font-mono cursor-pointer"
                  >
                    Reset All Colors
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. Chat Canvas Background */}
                  <ColorInputRow
                    label="Chat Canvas Background"
                    value={data?.chatBgColor}
                    defaultHex={data?.theme === 'dark' ? '#0b141a' : '#efeae2'}
                    onChange={(val) => {
                      updateField('useCustomColors', true);
                      updateField('chatBgColor', val);
                    }}
                    onClear={() => {
                      updateField('useCustomColors', true);
                      updateField('chatBgColor', '');
                    }}
                  />

                  {/* 2. Sender Bubble (Me) */}
                  <ColorInputRow
                    label="Sender Bubble (Me)"
                    value={data?.senderBubbleColor}
                    defaultHex={data?.theme === 'dark' ? '#005C4B' : '#d9fdd3'}
                    onChange={(val) => {
                      updateField('useCustomColors', true);
                      updateField('senderBubbleColor', val);
                    }}
                    onClear={() => {
                      updateField('useCustomColors', true);
                      updateField('senderBubbleColor', '');
                    }}
                  />

                  {/* 3. Receiver Bubble (You) */}
                  <ColorInputRow
                    label="Receiver Bubble (You)"
                    value={data?.receiverBubbleColor}
                    defaultHex={data?.theme === 'dark' ? '#202c33' : '#ffffff'}
                    onChange={(val) => {
                      updateField('useCustomColors', true);
                      updateField('receiverBubbleColor', val);
                    }}
                    onClear={() => {
                      updateField('useCustomColors', true);
                      updateField('receiverBubbleColor', '');
                    }}
                  />

                  {/* 4. Input Bar Background */}
                  <ColorInputRow
                    label="Input Bar Background"
                    value={data?.inputBgColor || data?.barBgColor}
                    defaultHex={data?.theme === 'dark' ? '#1c1c1e' : '#f0f2f5'}
                    onChange={(val) => {
                      updateField('useCustomColors', true);
                      updateField('inputBgColor', val);
                      updateField('barBgColor', val);
                    }}
                    onClear={() => {
                      updateField('useCustomColors', true);
                      updateField('inputBgColor', '');
                      updateField('barBgColor', '');
                    }}
                  />

                  {/* 5. Camera Icon Color */}
                  <ColorInputRow
                    label="Camera Icon Color"
                    value={data?.cameraIconColor}
                    defaultHex="#ffffff"
                    onChange={(val) => {
                      updateField('useCustomColors', true);
                      updateField('cameraIconColor', val);
                    }}
                    onClear={() => {
                      updateField('useCustomColors', true);
                      updateField('cameraIconColor', '');
                    }}
                  />

                  {/* 6. Action Icons */}
                  <ColorInputRow
                    label="Action Icons"
                    value={data?.iconColor}
                    defaultHex="#008069"
                    onChange={(val) => {
                      updateField('useCustomColors', true);
                      updateField('iconColor', val);
                    }}
                    onClear={() => {
                      updateField('useCustomColors', true);
                      updateField('iconColor', '');
                    }}
                  />

                  {/* 7. Header Bar Background */}
                  <ColorInputRow
                    label="Header Bar Background"
                    value={data?.headerBgColor || data?.barBgColor}
                    defaultHex={data?.theme === 'dark' ? '#1c1c1e' : '#f0f2f5'}
                    onChange={(val) => {
                      updateField('useCustomColors', true);
                      updateField('headerBgColor', val);
                    }}
                    onClear={() => {
                      updateField('useCustomColors', true);
                      updateField('headerBgColor', '');
                    }}
                  />

                  {/* 8. Header Text Color */}
                  <ColorInputRow
                    label="Header Text Color"
                    value={data?.headerTextColor || data?.mainTextColor}
                    defaultHex={data?.theme === 'dark' ? '#ffffff' : '#111b21'}
                    onChange={(val) => {
                      updateField('useCustomColors', true);
                      updateField('headerTextColor', val);
                    }}
                    onClear={() => {
                      updateField('useCustomColors', true);
                      updateField('headerTextColor', '');
                    }}
                  />

                  {/* 9. Main Message Text Color */}
                  <ColorInputRow
                    label="Main Message Text Color"
                    value={data?.mainTextColor}
                    defaultHex={data?.theme === 'dark' ? '#ffffff' : '#111b21'}
                    onChange={(val) => {
                      updateField('useCustomColors', true);
                      updateField('mainTextColor', val);
                    }}
                    onClear={() => {
                      updateField('useCustomColors', true);
                      updateField('mainTextColor', '');
                    }}
                  />

                  {/* 10. Secondary Text Color (Subtitles & Meta) */}
                  <ColorInputRow
                    label="Secondary Text Color"
                    value={data?.secondaryTextColor}
                    defaultHex={data?.theme === 'dark' ? '#8696a0' : '#667781'}
                    onChange={(val) => {
                      updateField('useCustomColors', true);
                      updateField('secondaryTextColor', val);
                    }}
                    onClear={() => {
                      updateField('useCustomColors', true);
                      updateField('secondaryTextColor', '');
                    }}
                  />

                  {/* 11. Timestamp / Jam Chat Text Color */}
                  <ColorInputRow
                    label="Timestamp Text Color"
                    value={data?.timestampColor || data?.secondaryTextColor}
                    defaultHex={data?.theme === 'dark' ? '#8696a0' : '#667781'}
                    onChange={(val) => {
                      updateField('useCustomColors', true);
                      updateField('timestampColor', val);
                    }}
                    onClear={() => {
                      updateField('useCustomColors', true);
                      updateField('timestampColor', '');
                    }}
                  />

                  {/* 12. Missed Call Circle Background */}
                  <ColorInputRow
                    label="Missed Call Circle Background"
                    value={data?.missedCallCircleBg}
                    defaultHex={data?.theme === 'dark' ? '#323739' : '#f0f2f5'}
                    onChange={(val) => {
                      updateField('useCustomColors', true);
                      updateField('missedCallCircleBg', val);
                    }}
                    onClear={() => {
                      updateField('useCustomColors', true);
                      updateField('missedCallCircleBg', '');
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. CHAT MESSAGES LIST */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleAddMessage('incoming', 'text')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:bg-purple-600 active:text-white text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 border border-slate-200 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isId ? 'Kamu (Kiri)' : 'You (Left)'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddMessage('outgoing', 'text')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:bg-purple-600 active:text-white text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 border border-slate-200 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isId ? 'Aku (Kanan)' : 'Me (Right)'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddMessage('incoming', 'image')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:bg-purple-600 active:text-white text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 border border-slate-200 shadow-2xs cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>{isId ? 'Foto (Kiri)' : 'Photo (Left)'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddMessage('outgoing', 'image')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:bg-purple-600 active:text-white text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 border border-slate-200 shadow-2xs cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isId ? 'Foto (Kanan)' : 'Photo (Right)'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const newMessage: WhatsAppChatMessage = {
                  id: 'wa-sys-' + Date.now(),
                  sender: 'system',
                  type: 'system',
                  text: 'You blocked this contact.',
                  systemAction: 'blocked',
                  systemGap: 12,
                  time: '',
                };
                updateField('messages', [...(data.messages || []), newMessage]);
              }}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-purple-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 shadow-xs cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{isId ? 'Pesan Sistem (Blocked)' : 'System Notice'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddMessage('incoming', 'sticker')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:bg-purple-600 active:text-white text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 border border-slate-200 shadow-2xs cursor-pointer"
            >
              <Smile className="w-3.5 h-3.5" />
              <span>{isId ? 'Stiker' : 'Sticker'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveActionBtn('date_divider');
                setTimeout(() => setActiveActionBtn(null), 1200);
                const newMessage: WhatsAppChatMessage = {
                  id: 'wa-date-' + Date.now(),
                  sender: 'system',
                  type: 'date_divider',
                  text: isId ? 'Hari ini' : 'Today',
                  time: '',
                };
                updateField('messages', [...(data.messages || []), newMessage]);
              }}
              className={`px-2.5 py-1.5 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1 shadow-xs cursor-pointer active:scale-95 ${
                activeActionBtn === 'date_divider'
                  ? 'bg-purple-600 ring-2 ring-purple-400 shadow-purple-200 dark:shadow-purple-950'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-purple-600'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isId ? 'Pemisah Tanggal' : 'Date Divider'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveActionBtn('unread_divider');
                setTimeout(() => setActiveActionBtn(null), 1200);
                const newMessage: WhatsAppChatMessage = {
                  id: 'wa-unread-' + Date.now(),
                  sender: 'system',
                  type: 'unread_divider',
                  text: isId ? '1 PESAN BELUM DIBACA' : '1 UNREAD MESSAGE',
                  unreadDividerStyle: data.unreadDividerStyle || 'banner',
                  unreadDividerGap: data.unreadDividerGap ?? 14,
                  unreadDividerPadding: data.unreadDividerPadding ?? 4.5,
                  time: '',
                };
                updateField('messages', [...(data.messages || []), newMessage]);
              }}
              className={`px-2.5 py-1.5 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1 shadow-xs cursor-pointer active:scale-95 ${
                activeActionBtn === 'unread_divider'
                  ? 'bg-purple-600 ring-2 ring-purple-400 shadow-purple-200 dark:shadow-purple-950'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-purple-600'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{isId ? 'Pesan Belum Dibaca' : 'Unread Divider'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const newMessage: WhatsAppChatMessage = {
                  id: 'wa-msg-' + Date.now(),
                  sender: 'incoming',
                  type: 'missed_voice_call',
                  text: isId ? 'Panggilan suara tak terjawab' : 'Missed voice call',
                  time: '',
                  senderName: data.isGroupChat ? 'Siti' : undefined,
                  senderColor: '#E542A3',
                };
                updateField('messages', [...(data.messages || []), newMessage]);
              }}
              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 shadow-xs cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{isId ? 'Panggilan Suara' : 'Missed Voice'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const newMessage: WhatsAppChatMessage = {
                  id: 'wa-msg-' + Date.now(),
                  sender: 'incoming',
                  type: 'missed_video_call',
                  text: isId ? 'Panggilan video tak terjawab' : 'Missed video call',
                  time: '',
                  senderName: data.isGroupChat ? 'Budi' : undefined,
                  senderColor: '#2196F3',
                };
                updateField('messages', [...(data.messages || []), newMessage]);
              }}
              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 shadow-xs cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span>{isId ? 'Panggilan Video' : 'Missed Video'}</span>
            </button>
          </div>
        </div>

        {/* Message Items List */}
        <div className="space-y-3">
          {(data.messages || []).length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-xs font-medium">
              No messages added yet. Click the buttons above to add text, photo, sticker, date divider, or missed call blocks.
            </div>
          ) : (
            data.messages.map((msg, index) => {
              const isOutgoing = msg.sender === 'outgoing' || msg.sender === 'me';
              const msgType = msg.type || (msg.stickerUrl ? 'sticker' : msg.imageUrl ? 'image' : 'text');

              if (msgType === 'date_divider') {
                return (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-xl border bg-purple-50/40 dark:bg-purple-950/20 border-purple-200/70 dark:border-purple-900/40 transition-all shadow-xs wa-date-divider-card"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b border-purple-200/50 dark:border-purple-900/40">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-md bg-purple-600 text-white shadow-2xs flex items-center space-x-1 tracking-wide shrink-0">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          <span>#{index + 1} DATE DIVIDER</span>
                        </span>
                        <span className="text-[11.5px] text-purple-900 dark:text-purple-200 font-bold">
                          {isId ? 'Pemisah Tanggal Chat' : 'Chat Date Divider'}
                        </span>
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center space-x-1.5 shrink-0 ml-auto bg-purple-100/80 dark:bg-slate-800 p-1 rounded-lg border border-purple-300 dark:border-purple-700 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleMoveMessage(index, 'up')}
                          disabled={index === 0}
                          className="w-7 h-7 flex items-center justify-center text-purple-900 dark:text-purple-100 bg-white dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-900/70 border border-purple-200 dark:border-purple-600 disabled:opacity-35 disabled:hover:bg-white dark:disabled:hover:bg-slate-700 disabled:cursor-not-allowed cursor-pointer rounded-md transition-all shadow-2xs"
                          title="Move Up"
                        >
                          <ArrowUp className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveMessage(index, 'down')}
                          disabled={index === data.messages.length - 1}
                          className="w-7 h-7 flex items-center justify-center text-purple-900 dark:text-purple-100 bg-white dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-900/70 border border-purple-200 dark:border-purple-600 disabled:opacity-35 disabled:hover:bg-white dark:disabled:hover:bg-slate-700 disabled:cursor-not-allowed cursor-pointer rounded-md transition-all shadow-2xs"
                          title="Move Down"
                        >
                          <ArrowDown className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMessage(index)}
                          className="w-7 h-7 flex items-center justify-center text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-white dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-purple-200 dark:border-purple-600 cursor-pointer rounded-md transition-all shadow-2xs"
                          title="Delete Divider"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-900 dark:text-slate-100 font-bold block mb-1">
                        Date Divider Text (e.g. Today / Hari Ini / Yesterday / 24 August 2024)
                      </label>
                      <input
                        type="text"
                        value={msg.text || ''}
                        onChange={(e) => handleUpdateMessage(index, { text: e.target.value })}
                        placeholder="Today"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                      />
                    </div>

                    {/* Date Divider Gap Slider inside Card Container */}
                    <div className="pt-2.5 mt-2.5 border-t border-purple-200 dark:border-purple-800/70 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-black dark:text-black text-xs">
                          {isId ? 'Date Divider Gap (Spasi Atas/Bawah)' : 'Date Divider Gap (Top/Bottom Spacing)'}
                        </span>
                        <span className="font-mono text-black dark:text-black bg-slate-100 dark:bg-slate-200 px-2 py-0.5 rounded font-bold text-xs border border-slate-300 dark:border-slate-400 shadow-none">
                          {msg.dateDividerGap ?? data.dateDividerGap ?? 12}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={48}
                        step={1}
                        value={msg.dateDividerGap ?? data.dateDividerGap ?? 12}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          const updatedMsgs = [...(data.messages || [])];
                          updatedMsgs[index] = { ...updatedMsgs[index], dateDividerGap: val };
                          onChange({
                            ...data,
                            dateDividerGap: val,
                            messages: updatedMsgs,
                          });
                        }}
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                      <p className="text-[11px] text-black dark:text-black font-medium">
                        {isId ? 'Jarak spasi pemisah tanggal chat' : 'Top & bottom spacing for date divider'}
                      </p>
                    </div>
                  </div>
                );
              }

              // Unread Divider Card in Messages list
              if (msgType === 'unread_divider') {
                return (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-xl border bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 transition-all shadow-xs wa-unread-divider-card"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b border-purple-200 dark:border-purple-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-md bg-purple-600 text-white shadow-2xs flex items-center space-x-1 tracking-wide shrink-0">
                          <Mail className="w-3.5 h-3.5 mr-1" />
                          <span>#{index + 1} UNREAD DIVIDER</span>
                        </span>
                        <span className="text-[11.5px] text-purple-900 dark:text-purple-200 font-bold">
                          {msg.unreadDividerStyle === 'pill' ? (isId ? 'Gaya Pil Ramping' : 'Slim Pill Style') : (isId ? 'Gaya Banner Ramping' : 'Slim Banner Style')}
                        </span>
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center space-x-1.5 shrink-0 ml-auto bg-purple-100/80 dark:bg-slate-800 p-1 rounded-lg border border-purple-300 dark:border-purple-700 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleMoveMessage(index, 'up')}
                          disabled={index === 0}
                          className="w-7 h-7 flex items-center justify-center text-purple-900 dark:text-purple-100 bg-white dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-900/70 border border-purple-200 dark:border-purple-600 disabled:opacity-35 disabled:hover:bg-white dark:disabled:hover:bg-slate-700 disabled:cursor-not-allowed cursor-pointer rounded-md transition-all shadow-2xs"
                          title="Move Up"
                        >
                          <ArrowUp className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveMessage(index, 'down')}
                          disabled={index === data.messages.length - 1}
                          className="w-7 h-7 flex items-center justify-center text-purple-900 dark:text-purple-100 bg-white dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-900/70 border border-purple-200 dark:border-purple-600 disabled:opacity-35 disabled:hover:bg-white dark:disabled:hover:bg-slate-700 disabled:cursor-not-allowed cursor-pointer rounded-md transition-all shadow-2xs"
                          title="Move Down"
                        >
                          <ArrowDown className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMessage(index)}
                          className="w-7 h-7 flex items-center justify-center text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-white dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-purple-200 dark:border-purple-600 cursor-pointer rounded-md transition-all shadow-2xs"
                          title="Delete Divider"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-slate-950 dark:text-white font-bold block mb-1">
                          {isId ? 'Teks Indikator (e.g. 1 UNREAD MESSAGE / 1 PESAN BELUM DIBACA)' : 'Indicator Text (e.g. 1 UNREAD MESSAGE)'}
                        </label>
                        <input
                          type="text"
                          value={msg.text || ''}
                          onChange={(e) => handleUpdateMessage(index, { text: e.target.value })}
                          placeholder={isId ? '1 PESAN BELUM DIBACA' : '1 UNREAD MESSAGE'}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 uppercase tracking-wide font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[11px] font-bold text-slate-950 dark:text-white">
                            {isId ? 'Gaya:' : 'Style:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateMessage(index, { unreadDividerStyle: 'banner' })}
                            className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-all border cursor-pointer ${
                              (msg.unreadDividerStyle || 'banner') === 'banner'
                                ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-purple-50'
                            }`}
                          >
                            Banner
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateMessage(index, { unreadDividerStyle: 'pill' })}
                            className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-all border cursor-pointer ${
                              msg.unreadDividerStyle === 'pill'
                                ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-purple-50'
                            }`}
                          >
                            Pill
                          </button>
                        </div>

                        <div className="flex items-center space-x-1">
                          {['1 UNREAD MESSAGE', '2 UNREAD MESSAGES', '1 PESAN BELUM DIBACA'].map((quick) => (
                            <button
                              key={quick}
                              type="button"
                              onClick={() => handleUpdateMessage(index, { text: quick })}
                              className="text-[9.5px] px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-purple-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md cursor-pointer"
                            >
                              {quick}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Unread Divider Gap Slider inside Card Container */}
                      <div className="pt-2.5 mt-2.5 border-t border-purple-200 dark:border-purple-800/70 space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-black dark:text-black text-xs">
                            {isId ? 'Unread Divider Gap (Spasi Atas/Bawah)' : 'Unread Divider Gap (Top/Bottom Spacing)'}
                          </span>
                          <span className="font-mono text-black dark:text-black bg-slate-100 dark:bg-slate-200 px-2 py-0.5 rounded font-bold text-xs border border-slate-300 dark:border-slate-400 shadow-none">
                            {msg.unreadDividerGap ?? data.unreadDividerGap ?? 14}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={2}
                          max={48}
                          step={1}
                          value={msg.unreadDividerGap ?? data.unreadDividerGap ?? 14}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            const updatedMsgs = [...(data.messages || [])];
                            updatedMsgs[index] = { ...updatedMsgs[index], unreadDividerGap: val };
                            onChange({
                              ...data,
                              unreadDividerGap: val,
                              messages: updatedMsgs,
                            });
                          }}
                          className="w-full accent-purple-600 cursor-pointer"
                        />
                        <p className="text-[11px] font-medium text-black dark:text-black">
                          {isId ? 'Jarak spasi vertikal atas & bawah simetris di sekitar divider' : 'Symmetrical vertical spacing above and below this divider'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              // System Message Notice Card (Blocked / Unblocked / Custom Gap)
              if (msgType === 'system') {
                const currentGap = typeof msg.systemGap === 'number' ? msg.systemGap : 12;
                return (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-xl border-2 bg-amber-50 dark:bg-slate-900 border-amber-400 dark:border-amber-600 shadow-sm transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-amber-300 dark:border-amber-700/80">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-md bg-amber-600 text-white shadow-2xs flex items-center space-x-1 tracking-wide shrink-0">
                          <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                          <span>#{index + 1} SYSTEM NOTICE</span>
                        </span>
                        <span className="text-xs text-amber-950 dark:text-amber-200 font-bold">
                          {isId ? 'Pemberitahuan Sistem (Blocked / Unblock / Enkripsi)' : 'System Notice'}
                        </span>
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center space-x-1.5 shrink-0 ml-auto bg-amber-100 dark:bg-slate-800 p-1 rounded-lg border border-amber-300 dark:border-amber-700 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleMoveMessage(index, 'up')}
                          disabled={index === 0}
                          className="w-7 h-7 flex items-center justify-center text-amber-950 dark:text-amber-100 bg-white dark:bg-slate-700 hover:bg-amber-200/70 dark:hover:bg-amber-900/70 border border-amber-300 dark:border-amber-600 disabled:opacity-35 disabled:hover:bg-white dark:disabled:hover:bg-slate-700 disabled:cursor-not-allowed cursor-pointer rounded-md transition-all shadow-2xs"
                          title="Move Up"
                        >
                          <ArrowUp className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveMessage(index, 'down')}
                          disabled={index === data.messages.length - 1}
                          className="w-7 h-7 flex items-center justify-center text-amber-950 dark:text-amber-100 bg-white dark:bg-slate-700 hover:bg-amber-200/70 dark:hover:bg-amber-900/70 border border-amber-300 dark:border-amber-600 disabled:opacity-35 disabled:hover:bg-white dark:disabled:hover:bg-slate-700 disabled:cursor-not-allowed cursor-pointer rounded-md transition-all shadow-2xs"
                          title="Move Down"
                        >
                          <ArrowDown className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMessage(index)}
                          className="w-7 h-7 flex items-center justify-center text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-white dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-amber-300 dark:border-amber-600 cursor-pointer rounded-md transition-all shadow-2xs"
                          title="Delete System Message"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Presets */}
                      <div>
                        <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block mb-1.5">
                          {isId ? 'Pilih Template Pesan Sistem Cepat:' : 'Quick Presets:'}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateMessage(index, {
                              text: 'You blocked this contact.',
                              systemAction: 'blocked',
                            })}
                            className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 border border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/60 cursor-pointer transition-colors shadow-2xs"
                          >
                            You blocked this contact.
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateMessage(index, {
                              text: 'You unblocked this contact.',
                              systemAction: 'unblocked',
                            })}
                            className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 border border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/60 cursor-pointer transition-colors shadow-2xs"
                          >
                            You unblocked this contact.
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateMessage(index, {
                              text: 'Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them. Tap to learn more.',
                              systemAction: 'encrypted',
                            })}
                            className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 border border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/60 cursor-pointer transition-colors shadow-2xs"
                          >
                            End-to-end Encrypted
                          </button>
                        </div>
                      </div>

                      {/* Custom text */}
                      <div>
                        <label className="text-xs text-slate-900 dark:text-slate-100 font-bold block mb-1">
                          {isId ? 'Teks Pesan Sistem' : 'System Message Text'}
                        </label>
                        <textarea
                          rows={2}
                          value={msg.text || ''}
                          onChange={(e) => handleUpdateMessage(index, { text: e.target.value })}
                          placeholder="You blocked this contact."
                          className="w-full bg-white dark:bg-slate-800 border border-amber-400 dark:border-amber-600 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y shadow-2xs"
                        />
                      </div>

                      {/* Flexible Spacing / Layout Gap Slider */}
                      <div className="pt-2 border-t border-amber-300 dark:border-amber-800">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {isId ? 'Jarak Spasi Atas & Bawah (Layout Gap)' : 'Vertical Layout Gap'}
                          </label>
                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-950 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                            {currentGap}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={2}
                          max={36}
                          step={1}
                          value={currentGap}
                          onChange={(e) => handleUpdateMessage(index, { systemGap: parseInt(e.target.value, 10) })}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                          <span>Rapat (2px)</span>
                          <span>Normal (12px)</span>
                          <span>Longgar (36px)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              const isDarkTheme = isEditorDark;
              const messageInputClass = isEditorDark
                ? 'w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors'
                : 'w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors';
              const singleLineInputClass = isEditorDark
                ? 'w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors'
                : 'w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors';
              const cardClass = isEditorDark
                ? (isOutgoing ? 'bg-purple-950/40 border-purple-900/60 text-slate-100' : 'bg-slate-900/90 border-slate-800 text-slate-100')
                : (isOutgoing ? 'bg-white border-purple-200/90 text-slate-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-900 shadow-2xs');
              const innerBoxClass = isEditorDark
                ? 'bg-slate-800/80 border-slate-700'
                : 'bg-slate-50/90 border-slate-200/80';
              const labelColorClass = isEditorDark ? 'text-slate-300' : 'text-slate-700';
              const hasSenderName = Boolean(msg.senderName?.trim());
              const isSenderNameChecked = openSenderNameIds[msg.id] ?? hasSenderName;
              const hasReplyQuote = Boolean(msg.showReplyQuote || msg.replyToSender?.trim() || msg.replyToText?.trim());
              const isReplyQuoteChecked = openReplyBoxIds[msg.id] ?? hasReplyQuote;

              return (
                <div
                  key={msg.id}
                  data-sync-theme={isDarkTheme ? 'dark' : 'light'}
                  className={`p-3.5 rounded-xl border transition-all ${cardClass}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md shrink-0 bg-purple-600 text-white">
                        #{index + 1} {isOutgoing ? (isId ? 'AKU (KANAN)' : 'ME (RIGHT)') : (isId ? 'KAMU (KIRI)' : 'YOU (LEFT)')}
                      </span>

                      {/* Sender Toggle Buttons */}
                      <div className="inline-flex border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-white dark:bg-slate-800 text-[10px] font-bold shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateMessage(index, { sender: 'incoming' })}
                          className={`px-2.5 py-1 cursor-pointer transition-colors ${
                            !isOutgoing ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {isId ? 'KAMU (KIRI)' : 'YOU (LEFT)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateMessage(index, { sender: 'outgoing' })}
                          className={`px-2.5 py-1 cursor-pointer transition-colors ${
                            isOutgoing ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {isId ? 'AKU (KANAN)' : 'ME (RIGHT)'}
                        </button>
                      </div>

                      {/* Type Toggle Selector: Text | Image | Sticker | Missed Voice | Missed Video */}
                      <div className="flex flex-wrap border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-white dark:bg-slate-800 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => handleUpdateMessage(index, { type: 'text' })}
                          className={`px-2 py-1 flex items-center space-x-1 cursor-pointer transition-colors ${
                            msgType === 'text' ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{isId ? 'Teks' : 'Text'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateMessage(index, { type: 'image' })}
                          className={`px-2 py-1 flex items-center space-x-1 cursor-pointer transition-colors ${
                            msgType === 'image' ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <ImageIcon className="w-3 h-3" />
                          <span>{isId ? 'Foto' : 'Photo'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateMessage(index, { type: 'sticker' })}
                          className={`px-2 py-1 flex items-center space-x-1 cursor-pointer transition-colors ${
                            msgType === 'sticker' ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <Smile className="w-3 h-3" />
                          <span>{isId ? 'Stiker' : 'Sticker'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateMessage(index, { type: 'missed_voice_call' })}
                          className={`px-2 py-1 flex items-center space-x-1 cursor-pointer transition-colors ${
                            msgType === 'missed_voice_call' ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <Phone className="w-3 h-3" />
                          <span>{isId ? 'Suara' : 'Missed Voice'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateMessage(index, { type: 'missed_video_call' })}
                          className={`px-2 py-1 flex items-center space-x-1 cursor-pointer transition-colors ${
                            msgType === 'missed_video_call' ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <Video className="w-3 h-3" />
                          <span>{isId ? 'Video' : 'Missed Video'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center space-x-1 shrink-0 ml-auto bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleMoveMessage(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-30 cursor-pointer rounded transition-colors"
                        title={isId ? 'Pindah ke Atas' : 'Move Up'}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveMessage(index, 'down')}
                        disabled={index === data.messages.length - 1}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-30 cursor-pointer rounded transition-colors"
                        title={isId ? 'Pindah ke Bawah' : 'Move Down'}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const isNowRecalled = !(msg.isRecalled || msg.status === 'recalled' || msg.type === 'recalled');
                          handleUpdateMessage(index, {
                            isRecalled: isNowRecalled,
                            status: isNowRecalled ? 'recalled' : (isOutgoing ? 'read' : undefined),
                            type: isNowRecalled ? 'recalled' : (msg.imageUrl ? 'image' : 'text'),
                          });
                        }}
                        className={`p-1.5 cursor-pointer rounded transition-colors ${
                          (msg.isRecalled || msg.status === 'recalled' || msg.type === 'recalled')
                            ? 'text-rose-600 bg-rose-100 dark:bg-rose-950/60 font-bold'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                        }`}
                        title={
                          (msg.isRecalled || msg.status === 'recalled' || msg.type === 'recalled')
                            ? (isId ? 'Batalkan Tarik Pesan' : 'Restore Message')
                            : (isId ? 'Tarik Pesan (Pesan Dihapus / Recall)' : 'Recall / Delete Message')
                        }
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveMessage(index);
                        }}
                        className="p-1.5 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer rounded transition-colors"
                        title={isId ? 'Hapus Pesan' : 'Delete Message'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Message Field Inputs according to type */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex flex-wrap items-center gap-3 pb-0.5">
                      {(!isOutgoing || data.isGroupChat) && (
                        <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isSenderNameChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setOpenSenderNameIds((prev) => ({ ...prev, [msg.id]: checked }));
                              handleUpdateMessage(index, { showSenderName: checked });
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer w-3.5 h-3.5"
                          />
                          <Plus className="w-3 h-3 -mr-0.5" />
                          <span>Sender Name</span>
                        </label>
                      )}
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isReplyQuoteChecked}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setOpenReplyBoxIds((prev) => ({ ...prev, [msg.id]: checked }));
                            handleUpdateMessage(index, checked
                              ? { showReplyQuote: true }
                              : { showReplyQuote: false, replyToMessageId: '', replyToSender: '', replyToText: '' });
                          }}
                          className="rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer w-3.5 h-3.5"
                        />
                        <Plus className="w-3 h-3 -mr-0.5" />
                        <span>Reply Quote Box</span>
                      </label>
                    </div>

                    {/* SENDER NAME & COLOR (Only visible when enabled) */}
                    {(!isOutgoing || data.isGroupChat) && isSenderNameChecked && (
                      <div className={`p-2.5 rounded-lg border space-y-2 ${innerBoxClass}`}>
                        <label className={`text-[11px] font-semibold block ${labelColorClass}`}>
                          {isId ? 'Tampilan Nama Pengirim' : 'Sender Name Display'}
                          <select
                            value={msg.showSenderName === undefined ? 'auto' : msg.showSenderName ? 'always' : 'hidden'}
                            onChange={(e) => handleUpdateMessage(index, {
                              showSenderName: e.target.value === 'auto' ? undefined : e.target.value === 'always',
                            })}
                            className={`${singleLineInputClass} mt-1`}
                          >
                            <option value="auto">{isId ? 'Otomatis' : 'Automatic'}</option>
                            <option value="always">{isId ? 'Selalu tampil' : 'Always show'}</option>
                            <option value="hidden">{isId ? 'Sembunyikan' : 'Hide'}</option>
                          </select>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className={`text-[11px] font-semibold block mb-0.5 ${labelColorClass}`}>
                              Sender Name (Nama Pengirim)
                            </label>
                            <input
                              type="text"
                              value={msg.senderName || ''}
                              onChange={(e) => handleUpdateMessage(index, { senderName: e.target.value })}
                              placeholder="e.g. Siti / Budi"
                              className={singleLineInputClass}
                            />
                          </div>

                          <div>
                            <label className={`text-[11px] font-semibold block mb-0.5 ${labelColorClass}`}>
                              Sender Name Color
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={toHexForPicker(msg.senderColor, '#e542a3')}
                                onChange={(e) => handleUpdateMessage(index, { senderColor: e.target.value })}
                                className="w-7 h-7 rounded cursor-pointer border border-slate-300 p-0 shrink-0"
                              />
                              <input
                                type="text"
                                value={msg.senderColor ?? ''}
                                placeholder="#e542a3"
                                onChange={(e) => handleUpdateMessage(index, { senderColor: e.target.value })}
                                className={`w-24 ${singleLineInputClass} font-mono`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Color Presets */}
                        <div>
                          <span className={`text-[10px] font-bold block mb-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                            Preset Warna Member WA Group:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { name: 'Pink', hex: '#e542a3' },
                              { name: 'Blue', hex: '#2196f3' },
                              { name: 'Teal', hex: '#26a69a' },
                              { name: 'Orange', hex: '#ff9800' },
                              { name: 'Purple', hex: '#ab47bc' },
                              { name: 'Green', hex: '#4caf50' },
                              { name: 'Deep Orange', hex: '#ff5722' },
                              { name: 'Cyan', hex: '#00bcd4' },
                            ].map((c) => (
                              <button
                                key={c.hex}
                                type="button"
                                onClick={() => handleUpdateMessage(index, { senderColor: c.hex })}
                                style={{ backgroundColor: c.hex }}
                                className="w-5 h-5 rounded-full border border-black/20 shadow-xs cursor-pointer hover:scale-110 transition-transform"
                                title={c.name}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TEXT TYPE */}
                    {msgType === 'text' && (
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className={`text-[11px] font-semibold block ${labelColorClass}`}>
                            Message Text (Supports iOS Emojis)
                          </label>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                            {isId ? 'Bubble Chat: Pindah baris tiap 33 karakter' : 'Chat Bubble: Wraps at 33 chars'}
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          value={msg.text || ''}
                          onChange={(e) => handleUpdateMessage(index, { text: e.target.value })}
                          placeholder={!isOutgoing ? (isId ? 'Pesan masuk (kiri)' : 'Received message (left)') : 'Read a message'}
                          className={messageInputClass}
                        />
                      </div>
                    )}

                    {/* MISSED CALL TYPES */}
                    {(msgType === 'missed_voice_call' || msgType === 'missed_video_call') && (
                      <div>
                        <label className={`text-[11px] font-semibold block mb-0.5 ${labelColorClass}`}>
                          Missed Call Text Line
                        </label>
                        <input
                          type="text"
                          value={msg.text || (msgType === 'missed_video_call' ? 'Missed video call' : 'Missed voice call')}
                          onChange={(e) => handleUpdateMessage(index, { text: e.target.value })}
                          placeholder={msgType === 'missed_video_call' ? 'Missed video call' : 'Missed voice call'}
                          className={singleLineInputClass}
                        />
                      </div>
                    )}

                    {/* IMAGE TYPE (Single or Multi-Photo Album Grid) */}
                    {msgType === 'image' && (
                      <div className="space-y-3 p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div>
                          <label htmlFor={`wa-photo-width-${msg.id}`} className={`flex items-center justify-between text-[11px] font-semibold mb-1 ${labelColorClass}`}>
                            <span>{isId ? 'Ukuran Foto' : 'Photo Size'}</span>
                            <span className="font-mono">{msg.photoWidth ?? 260}px</span>
                          </label>
                          <input id={`wa-photo-width-${msg.id}`} type="range" min={120} max={260} step={10}
                            value={msg.photoWidth ?? 260}
                            onChange={(e) => handleUpdateMessage(index, { photoWidth: Number(e.target.value) })}
                            className="w-full accent-purple-600 cursor-pointer" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className={`text-[11px] font-semibold ${labelColorClass}`}>
                              {isId ? 'Daftar Foto / Gambar' : 'Photos / Media List'}
                            </label>
                            <span className="text-[10px] text-purple-600 font-bold">
                              {((msg.imageUrls && msg.imageUrls.length > 0) ? msg.imageUrls.length : (msg.imageUrl ? 1 : 0))} {isId ? 'foto' : 'photo(s)'}
                            </span>
                          </div>

                          {/* Primary or First Image */}
                          <ImageUploader
                            label={isId ? 'Foto Utama (Foto #1)' : 'Primary Photo (Photo #1)'}
                            value={((msg.imageUrls && msg.imageUrls[0]) || msg.imageUrl || '')}
                            onChange={(url) => {
                              const currentUrls = msg.imageUrls && msg.imageUrls.length > 0 ? [...msg.imageUrls] : [msg.imageUrl || ''];
                              currentUrls[0] = url;
                              handleUpdateMessage(index, { imageUrl: url, imageUrls: currentUrls });
                            }}
                            onClear={() => {
                              const currentUrls = msg.imageUrls && msg.imageUrls.length > 0 ? [...msg.imageUrls] : [''];
                              currentUrls[0] = '';
                              handleUpdateMessage(index, { imageUrl: '', imageUrls: currentUrls });
                            }}
                            skipCompression={true}
                            maxOutputDimension={2048}
                            quality={0.95}
                          />
                        </div>

                        {/* Extra Multi-Photos list (Photo #2, #3, #4, ...) */}
                        {Boolean(msg.imageUrls && msg.imageUrls.length > 1) && (
                          <div className="space-y-2">
                            {(msg.imageUrls?.slice(1) || []).map((extraUrl, extraIdx) => (
                              <div key={extraIdx} className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                <ImageUploader
                                  label={`${isId ? 'Foto Tambahan' : 'Extra Photo'} #${extraIdx + 2}`}
                                  value={extraUrl}
                                  onChange={(url) => {
                                    const newUrls = [...(msg.imageUrls || [])];
                                    newUrls[extraIdx + 1] = url;
                                    handleUpdateMessage(index, { imageUrls: newUrls });
                                  }}
                                  onClear={() => {
                                    const newUrls = [...(msg.imageUrls || [])];
                                    newUrls.splice(extraIdx + 1, 1);
                                    handleUpdateMessage(index, { imageUrls: newUrls });
                                  }}
                                  skipCompression={true}
                                  maxOutputDimension={2048}
                                  quality={0.95}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Button to Add More Photos to Grid */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const currentUrls = msg.imageUrls && msg.imageUrls.length > 0
                                ? [...msg.imageUrls]
                                : [msg.imageUrl || ''];
                              currentUrls.push('');
                              handleUpdateMessage(index, {
                                imageUrls: currentUrls,
                                imageUrl: currentUrls[0] || '',
                              });
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{isId ? 'Tambah Foto ke Album' : 'Add Photo to Album'}</span>
                          </button>
                        </div>

                        {/* Counter "+N" (misal: +15) */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-1">
                            <label className={`text-[11px] font-semibold ${labelColorClass}`}>
                              {isId ? 'Teks Counter "+N" (Contoh: +15)' : 'Counter Badge "+N" (e.g. +15)'}
                            </label>
                            <span className="text-[10px] text-slate-400">
                              {isId ? 'Opsional: overlay foto ke-4' : 'Optional 4th photo overlay'}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={msg.extraPhotosText || ''}
                            onChange={(e) => handleUpdateMessage(index, { extraPhotosText: e.target.value })}
                            placeholder="+15"
                            className={singleLineInputClass}
                          />
                        </div>

                        {/* Caption */}
                        <div>
                          <label className={`text-[11px] font-semibold block mb-0.5 ${labelColorClass}`}>
                            {isId ? 'Keterangan Foto (Caption Opsional)' : 'Photo Caption (Optional)'}
                          </label>
                          <input
                            type="text"
                            value={msg.text || ''}
                            onChange={(e) => handleUpdateMessage(index, { text: e.target.value })}
                            placeholder={isId ? 'Ketik keterangan foto jika ada...' : 'Type photo caption if any...'}
                            className={singleLineInputClass}
                          />
                        </div>
                      </div>
                    )}

                    {/* STICKER TYPE */}
                    {msgType === 'sticker' && (
                      <div className="space-y-2">
                        <ImageUploader
                          label="Upload / Enter Sticker Image URL (Transparent PNG)"
                          value={msg.stickerUrl ?? ''}
                          onChange={(url) => handleUpdateMessage(index, { stickerUrl: url })}
                          onClear={() => handleUpdateMessage(index, { stickerUrl: '' })}
                          forceAspect={1}
                          aspectHint="1:1 Fixed Square Ratio"
                        />

                        {/* Quick Sticker Preset Selection */}
                        <div>
                          <label className={`text-[10px] font-bold block mb-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                            Quick Sticker Presets:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {SAMPLE_STICKERS.map((stk, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleUpdateMessage(index, { stickerUrl: stk.url });
                                }}
                                className={`p-1 border rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                                  isDarkTheme
                                    ? 'border-slate-700 bg-slate-800 hover:border-purple-500'
                                    : 'border-slate-200 bg-white hover:bg-purple-50 hover:border-purple-500'
                                }`}
                              >
                                <img src={stk.url} alt={stk.name} className="w-6 h-6 object-contain" />
                                <span className={`text-[10px] font-medium pr-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>{stk.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timestamp & Read Status Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className={`text-[11px] font-semibold block mb-0.5 ${labelColorClass}`}>
                          Timestamp (e.g. "12.00")
                        </label>
                        <input
                          type="text"
                          value={msg.time || ''}
                          onChange={(e) => handleUpdateMessage(index, { time: e.target.value })}
                          placeholder="12.00"
                          className={singleLineInputClass}
                        />
                      </div>

                      {/* Read Status Selector for Outgoing */}
                      {isOutgoing && (
                        <div>
                          <label className={`text-[11px] font-semibold block mb-0.5 ${labelColorClass}`}>
                            Read Status
                          </label>
                          <div className={`flex border rounded-lg overflow-hidden text-[10px] font-bold ${
                            isDarkTheme ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
                          }`}>
                            <button
                              type="button"
                              onClick={() => handleUpdateMessage(index, { status: 'sent', isRead: false })}
                              className={`flex-1 py-1 px-1.5 flex items-center justify-center space-x-1 cursor-pointer transition-colors ${
                                (msg.status === 'sent')
                                  ? 'bg-purple-600 text-white font-bold shadow-xs'
                                  : isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                              }`}
                              title={isId ? 'Terkirim (Centang 1 Abu-abu)' : 'Sent (Single gray check)'}
                            >
                              <Check className="w-3 h-3" />
                              <span>{isId ? 'Terkirim (✓)' : 'Sent (✓)'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateMessage(index, { status: 'delivered', isRead: false })}
                              className={`flex-1 py-1 px-1.5 flex items-center justify-center space-x-1 cursor-pointer transition-colors border-l border-r ${
                                isDarkTheme ? 'border-slate-700' : 'border-slate-200'
                              } ${
                                (msg.status === 'delivered' || (!msg.status && msg.isRead === false))
                                  ? 'bg-purple-600 text-white font-bold shadow-xs'
                                  : isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                              }`}
                              title={isId ? 'Diterima (Centang 2 Abu-abu)' : 'Delivered (Double gray check)'}
                            >
                              <CheckCheck className="w-3 h-3 text-current" />
                              <span>{isId ? 'Diterima (✓✓)' : 'Delivered (✓✓)'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateMessage(index, { status: 'read', isRead: true, isRecalled: false, type: msg.type === 'recalled' ? 'text' : msg.type })}
                              className={`flex-1 py-1 px-1.5 flex items-center justify-center space-x-1 cursor-pointer transition-colors ${
                                (msg.status === 'read' || (!msg.status && msg.isRead !== false && !msg.isRecalled))
                                  ? 'bg-purple-600 text-white font-bold shadow-xs'
                                  : isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                              }`}
                              title={isId ? 'Dibaca (Centang 2 Biru)' : 'Read (Double blue check)'}
                            >
                              <CheckCheck className="w-3 h-3 text-current" />
                              <span>{isId ? 'Dibaca (✓✓)' : 'Read (✓✓)'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateMessage(index, { status: 'recalled', isRecalled: true, type: 'recalled' })}
                              className={`flex-1 py-1 px-1.5 flex items-center justify-center space-x-1 cursor-pointer transition-colors border-l ${
                                isDarkTheme ? 'border-slate-700' : 'border-slate-200'
                              } ${
                                (msg.status === 'recalled' || msg.type === 'recalled' || msg.isRecalled)
                                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                                  : isDarkTheme ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                              }`}
                              title={isId ? 'Ditarik / Dihapus untuk Semua' : 'Recalled / Deleted'}
                            >
                              <Ban className="w-3 h-3" />
                              <span>{isId ? 'Ditarik (🚫)' : 'Recalled (🚫)'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Recalled Status for Incoming */}
                      {!isOutgoing && (
                        <div>
                          <label className={`text-[11px] font-semibold block mb-0.5 ${labelColorClass}`}>
                            Status Pesan Masuk
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const isNowRecalled = !(msg.isRecalled || msg.status === 'recalled' || msg.type === 'recalled');
                              handleUpdateMessage(index, {
                                isRecalled: isNowRecalled,
                                status: isNowRecalled ? 'recalled' : undefined,
                                type: isNowRecalled ? 'recalled' : (msg.imageUrl ? 'image' : 'text'),
                              });
                            }}
                            className={`w-full py-1 px-2 text-[11px] font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                              (msg.isRecalled || msg.status === 'recalled' || msg.type === 'recalled')
                                ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-300'
                                : isDarkTheme
                                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Ban className="w-3 h-3" />
                            <span>
                              {(msg.isRecalled || msg.status === 'recalled' || msg.type === 'recalled')
                                ? (isId ? '🚫 Ditarik Pengirim ("Pesan ini telah dihapus")' : '🚫 Recalled by Sender')
                                : (isId ? 'Tandai sebagai Ditarik / Dihapus' : 'Mark as Recalled / Deleted')}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* REPLY QUOTE BOX (Only visible when enabled) */}
                    {isReplyQuoteChecked && (
                    <div className={`p-2.5 rounded-lg border space-y-2 ${innerBoxClass}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold block ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>
                          Reply Quote Box
                        </span>
                        {(msg.showReplyQuote || msg.replyToSender || msg.replyToText) && (
                          <button
                            type="button"
                            onClick={() => handleUpdateMessage(index, { replyToMessageId: '', replyToSender: '', replyToText: '' })}
                            className="text-[10px] text-rose-500 hover:text-rose-400 font-semibold cursor-pointer"
                          >
                            Clear Quote
                          </button>
                        )}
                      </div>

                      {/* Dropdown to Pick from Existing Messages in Chat */}
                      <div>
                        <label className={`text-[10.5px] font-medium block mb-0.5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                          Pick Message to Reply from Chat:
                        </label>
                        <select
                          value={msg.replyToMessageId
                            ? (() => {
                                const foundIdx = data.messages.findIndex((item) => item.id === msg.replyToMessageId);
                                return foundIdx >= 0 ? String(foundIdx) : '';
                              })()
                            : ''}
                          onChange={(e) => {
                            const selectedIdx = parseInt(e.target.value, 10);
                            if (!isNaN(selectedIdx) && data.messages[selectedIdx]) {
                              const targetMsg = data.messages[selectedIdx];
                              const senderLabel = targetMsg.sender === 'outgoing' || targetMsg.sender === 'me'
                                ? ''
                                : (targetMsg.senderName?.trim() || data.contactName?.trim() || '');
                              const textPreview = targetMsg.text?.trim()
                                ? targetMsg.text
                                : (targetMsg.imageUrl ? (isId ? '📷 Foto' : '📷 Photo') : targetMsg.stickerUrl ? (isId ? '🌟 Stiker' : '🌟 Sticker') : '');
                              handleUpdateMessage(index, {
                                showReplyQuote: true,
                                replyToMessageId: targetMsg.id,
                                replyToSender: senderLabel,
                                replyToText: textPreview,
                              });
                            }
                          }}
                          className={`w-full ${singleLineInputClass} cursor-pointer`}
                        >
                          <option value="" disabled hidden>{isId ? '-- Pilih pesan dari obrolan ini --' : '-- Select a message from this chat --'}</option>
                          {data.messages
                            .map((m, mIdx) => ({ m, mIdx }))
                            .filter(({ mIdx }) => mIdx !== index && data.messages[mIdx].type !== 'date_divider' && data.messages[mIdx].type !== 'unread_divider')
                            .map(({ m, mIdx }) => {
                              const sLabel = m.sender === 'outgoing' || m.sender === 'me' ? (isId ? 'Kamu' : 'You') : (m.senderName || data.contactName || (isId ? 'Kontak' : 'Contact'));
                              const preview = m.text || (m.imageUrl ? (isId ? '📷 Foto' : '📷 Photo') : m.stickerUrl ? (isId ? '🌟 Stiker' : '🌟 Sticker') : (isId ? 'Pesan' : 'Message'));
                              return (
                                <option key={m.id} value={mIdx}>
                                  #{mIdx + 1} [{sLabel}]: {preview.length > 40 ? preview.substring(0, 40) + '...' : preview}
                                </option>
                              );
                            })}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className={`text-[10.5px] font-medium block mb-0.5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                            Reply Sender Name (Nama Kontak)
                          </label>
                          <input
                            type="text"
                            value={(msg.replyToSender === 'Contact' || msg.replyToSender === 'Kontak' || msg.replyToSender === 'You' || msg.replyToSender === 'Kamu') ? '' : (msg.replyToSender || '')}
                            onChange={(e) => handleUpdateMessage(index, { showReplyQuote: true, replyToSender: e.target.value })}
                            placeholder={data.contactName?.trim() || (isId ? 'Kontak' : 'Contact')}
                            className={singleLineInputClass}
                          />
                        </div>

                        <div>
                          <label className={`text-[10.5px] font-medium block mb-0.5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                            Quoted Text (Teks yang Dibalas)
                          </label>
                          <input
                            type="text"
                            value={(msg.replyToText === 'Message' || msg.replyToText === 'Pesan') ? '' : (msg.replyToText || '')}
                            onChange={(e) => handleUpdateMessage(index, { showReplyQuote: true, replyToText: e.target.value })}
                            placeholder={isId ? 'Pesan' : 'Message'}
                            className={singleLineInputClass}
                          />
                        </div>
                      </div>

                      {/* Reply Box Custom Colors (Bar Color & Sender Name Color) */}
                      <div className={`pt-1.5 border-t space-y-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200/80'}`}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Vertical Bar Color */}
                            <div>
                              <label className={`text-[10.5px] font-semibold block mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                                Warna Garis Vertikal (Bar Color)
                              </label>
                              <div className="flex items-center space-x-1.5">
                                <input
                                  type="color"
                                  value={toHexForPicker(msg.replyBarColor, data.useCustomColors && data.iconColor ? data.iconColor : '#25D366')}
                                  onChange={(e) => handleUpdateMessage(index, { replyBarColor: e.target.value })}
                                  className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0 shrink-0"
                                />
                                <input
                                  type="text"
                                  value={msg.replyBarColor ?? ''}
                                  onChange={(e) => handleUpdateMessage(index, { replyBarColor: e.target.value })}
                                  placeholder={data.useCustomColors && data.iconColor ? data.iconColor : '#25D366'}
                                  className={`flex-1 font-mono text-[11px] ${singleLineInputClass} px-2 py-0.5`}
                                />
                              </div>
                            </div>

                            {/* Reply Contact Name Color */}
                            <div>
                              <label className={`text-[10.5px] font-semibold block mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                                Warna Nama Kontak (Sender Color)
                              </label>
                              <div className="flex items-center space-x-1.5">
                                <input
                                  type="color"
                                  value={toHexForPicker(msg.replySenderColor, msg.replyBarColor || (data.useCustomColors && data.iconColor ? data.iconColor : '#25D366'))}
                                  onChange={(e) => handleUpdateMessage(index, { replySenderColor: e.target.value })}
                                  className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0 shrink-0"
                                />
                                <input
                                  type="text"
                                  value={msg.replySenderColor ?? ''}
                                  onChange={(e) => handleUpdateMessage(index, { replySenderColor: e.target.value })}
                                  placeholder={msg.replyBarColor || (data.useCustomColors && data.iconColor ? data.iconColor : '#25D366')}
                                  className={`flex-1 font-mono text-[11px] ${singleLineInputClass} px-2 py-0.5`}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Quick Swatches for Reply Bar & Text */}
                          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                            <span className="text-[10px] text-slate-500 font-medium">Presets:</span>
                            {[
                              { name: 'WhatsApp Green', hex: '#25D366' },
                              { name: 'Sky Blue', hex: '#0284c7' },
                              { name: 'Purple', hex: '#8b5cf6' },
                              { name: 'Pink', hex: '#e542a3' },
                              { name: 'Amber', hex: '#f59e0b' },
                              { name: 'Rose', hex: '#f43f5e' },
                              { name: 'Slate', hex: '#64748b' },
                            ].map((preset) => (
                              <button
                                key={preset.hex}
                                type="button"
                                onClick={() => handleUpdateMessage(index, { replyBarColor: preset.hex, replySenderColor: preset.hex })}
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
                </div>
              );
            })
          )}
        </div>
      </div>

      <SaveProfileButton onSave={onSaveProfile} />
    </div>
  );
};
