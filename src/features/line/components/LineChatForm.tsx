import React, { useEffect, useState, useRef } from 'react';
import { LineChatData, LineChatMessage, LineMessageType, CharacterPreset, LineThemePreset } from '../../../types';
import { CharacterSelector, ImageUploader, SaveProfileButton } from '../../../components/FormControls';
import { PinAuthModal } from '../../../features/auth/components/PinAuthModal';
import { useLanguage } from '../../../context/LanguageContext';
import { formatLineTimestamp, getLineCurrentTime } from './LineChatPreview';
import {
  CustomLineSticker,
  INITIAL_GDRIVE_STICKERS,
  DEFAULT_GDRIVE_FOLDER_URL,
  parseGoogleDriveOrImageUrl,
  fetchGoogleDriveFolderStickers,
  parseBatchStickerUrls,
  extractGoogleDriveFolderId,
} from '../../../utils/stickerUtils';
import { toHexForPicker } from '../../../utils/colorUtils';
import {
  createSafeObjectURL,
  revokeSafeObjectURL,
  isBlobUrl,
} from '../../../utils/imageManager';
import { auth } from '../../../firebase';
import { uploadMediaAsset } from '../../../utils/storageService';
import {
  readPersistentUserAssets,
  subscribePersistentUserAssets,
  updatePersistentUserAsset,
} from '../../../utils/userAssets';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Palette,
  Check,
  PhoneCall,
  PhoneMissed,
  Video,
  Smile,
  Sliders,
  Link as LinkIcon,
  FolderOpen,
  RefreshCw,
  Upload,
  Sparkles,
  ExternalLink,
  Info,
  Lock,
  Unlock,
  Ban,
} from 'lucide-react';

const LINE_THEME_PRESETS_FORM: {
  id: LineThemePreset;
  name: string;
  chatWallpaperColor: string;
  headerCustomBgColor: string;
  headerTextColor: string;
  senderBubbleColor: string;
  receiverBubbleColor: string;
  senderTextColor: string;
  receiverTextColor: string;
  actionIconsColor: string;
  bottomIconsColor?: string;
  timestampColor?: string;
  bottomBarBgColor?: string;
  inputBgColor?: string;
  inputBorderColor?: string;
  inputTextColor?: string;
}[] = [
  {
    id: 'classic-sky',
    name: 'Classic Sky',
    chatWallpaperColor: '#82A2C6',
    headerCustomBgColor: '#263147',
    headerTextColor: '#FFFFFF',
    senderBubbleColor: '#06C755',
    receiverBubbleColor: '#FFFFFF',
    senderTextColor: '#1F2937',
    receiverTextColor: '#1F2937',
    actionIconsColor: '#64748B',
    bottomIconsColor: '#64748B',
    timestampColor: '#64748B',
    bottomBarBgColor: '#FFFFFF',
    inputBgColor: '#F3F4F6',
    inputBorderColor: '#E5E7EB',
    inputTextColor: '#1F2937',
  },
  {
    id: 'soft-sage',
    name: 'Soft Sage',
    chatWallpaperColor: '#EDF7F2',
    headerCustomBgColor: '#FFFFFF',
    headerTextColor: '#166534',
    senderBubbleColor: '#20C76A',
    receiverBubbleColor: '#FFFFFF',
    senderTextColor: '#FFFFFF',
    receiverTextColor: '#334155',
    actionIconsColor: '#166534',
    bottomIconsColor: '#278653',
    timestampColor: '#78908A',
    bottomBarBgColor: '#E3EEE9',
    inputBgColor: '#FFFFFF',
    inputBorderColor: '#C9D9D2',
    inputTextColor: '#334155',
  },
  {
    id: 'wine',
    name: 'Wine',
    chatWallpaperColor: '#2A0F1A',
    headerCustomBgColor: '#4A1728',
    headerTextColor: '#FFF1F4',
    senderBubbleColor: '#8F294B',
    receiverBubbleColor: '#5A2639',
    senderTextColor: '#FFFFFF',
    receiverTextColor: '#FFF4F6',
    actionIconsColor: '#FFD4DF',
    bottomIconsColor: '#F2A9BC',
    timestampColor: '#D9AAB8',
    bottomBarBgColor: '#24141C',
    inputBgColor: '#35212B',
    inputBorderColor: '#70505D',
    inputTextColor: '#FFF1F4',
  },
  {
    id: 'peach-cream',
    name: 'Peach Cream',
    chatWallpaperColor: '#FFF3EC',
    headerCustomBgColor: '#FFF9F5',
    headerTextColor: '#8F4F42',
    senderBubbleColor: '#F29A83',
    receiverBubbleColor: '#FFFFFF',
    senderTextColor: '#FFFFFF',
    receiverTextColor: '#5F4A45',
    actionIconsColor: '#A65D4E',
    bottomIconsColor: '#A65D4E',
    timestampColor: '#A98A80',
    bottomBarBgColor: '#F5E5DC',
    inputBgColor: '#FFFFFF',
    inputBorderColor: '#E6CCC2',
    inputTextColor: '#5F4A45',
  },
  {
    id: 'pastel-pink',
    name: 'Pastel Pink',
    chatWallpaperColor: '#FFF0F5',
    headerCustomBgColor: '#FFFFFF',
    headerTextColor: '#DB2777',
    senderBubbleColor: '#FB7185',
    receiverBubbleColor: '#FFFFFF',
    senderTextColor: '#FFFFFF',
    receiverTextColor: '#1F2937',
    actionIconsColor: '#DB2777',
    bottomIconsColor: '#DB2777',
    timestampColor: '#94A3B8',
    bottomBarBgColor: '#FFFFFF',
    inputBgColor: '#FFF1F6',
    inputBorderColor: '#F9A8D4',
    inputTextColor: '#1F2937',
  },
  {
    id: 'pastel-purple',
    name: 'Ungu Pastel',
    chatWallpaperColor: '#F5F3FF',
    headerCustomBgColor: '#FFFFFF',
    headerTextColor: '#6D28D9',
    senderBubbleColor: '#A78BFA',
    receiverBubbleColor: '#FFFFFF',
    senderTextColor: '#FFFFFF',
    receiverTextColor: '#1F2937',
    actionIconsColor: '#7C3AED',
    bottomIconsColor: '#7C3AED',
    timestampColor: '#94A3B8',
    bottomBarBgColor: '#FFFFFF',
    inputBgColor: '#F5F3FF',
    inputBorderColor: '#C4B5FD',
    inputTextColor: '#1F2937',
  },
  {
    id: 'pastel-blue',
    name: 'Biru Pastel',
    chatWallpaperColor: '#F0F9FF',
    headerCustomBgColor: '#FFFFFF',
    headerTextColor: '#0369A1',
    senderBubbleColor: '#38BDF8',
    receiverBubbleColor: '#FFFFFF',
    senderTextColor: '#FFFFFF',
    receiverTextColor: '#1F2937',
    actionIconsColor: '#0284C7',
    bottomIconsColor: '#0284C7',
    timestampColor: '#94A3B8',
    bottomBarBgColor: '#FFFFFF',
    inputBgColor: '#F0F9FF',
    inputBorderColor: '#7DD3FC',
    inputTextColor: '#1F2937',
  },
  {
    id: 'blue-gutter',
    name: 'Midnight Blue',
    chatWallpaperColor: '#0F172A',
    headerCustomBgColor: '#263147',
    headerTextColor: '#60A5FA',
    senderBubbleColor: '#2563EB',
    receiverBubbleColor: '#1E293B',
    senderTextColor: '#FFFFFF',
    receiverTextColor: '#F8FAFC',
    actionIconsColor: '#60A5FA',
    bottomIconsColor: '#60A5FA',
    timestampColor: '#94A3B8',
    bottomBarBgColor: '#0F172A',
    inputBgColor: 'rgba(255, 255, 255, 0.12)',
    inputBorderColor: '#1E293B',
    inputTextColor: '#F8FAFC',
  },
  {
    id: 'dark',
    name: 'Dark Obsidian',
    chatWallpaperColor: '#18181B',
    headerCustomBgColor: '#27272A',
    headerTextColor: '#E4E4E7',
    senderBubbleColor: '#06C755',
    receiverBubbleColor: '#27272A',
    senderTextColor: '#FFFFFF',
    receiverTextColor: '#F4F4F5',
    actionIconsColor: '#06C755',
    bottomIconsColor: '#06C755',
    timestampColor: '#71717A',
    bottomBarBgColor: '#18181B',
    inputBgColor: '#27272A',
    inputBorderColor: '#3F3F46',
    inputTextColor: '#F4F4F5',
  },
];

interface Props {
  data: LineChatData;
  onChange: (updated: LineChatData) => void;
  characters: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const LineChatForm: React.FC<Props> = ({
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
  const { t, isId } = useLanguage();
  const [stickerSenderRole, setStickerSenderRole] = useState<'outgoing' | 'incoming'>('outgoing');
  const [isSyncingGDrive, setIsSyncingGDrive] = useState(false);
  const [gdriveSyncStatus, setGdriveSyncStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customStickers, setCustomStickers] = useState<CustomLineSticker[]>(() => {
    try {
      const saved = readPersistentUserAssets(auth.currentUser?.uid, auth.currentUser?.email).lineCustomStickers;
      if (saved.length > 0) {
        const existingUrls = new Set(saved.map((s: CustomLineSticker) => s.url));
        const missing = INITIAL_GDRIVE_STICKERS.filter((s) => !existingUrls.has(s.url));
        return [...saved, ...missing];
      }
    } catch {}
    return INITIAL_GDRIVE_STICKERS;
  });

  useEffect(() => subscribePersistentUserAssets((assets) => {
    const existingUrls = new Set(assets.lineCustomStickers.map((sticker: CustomLineSticker) => sticker.url));
    const missing = INITIAL_GDRIVE_STICKERS.filter((sticker) => !existingUrls.has(sticker.url));
    setCustomStickers([...assets.lineCustomStickers, ...missing]);
  }), []);

  const [directStickerUrl, setDirectStickerUrl] = useState('');
  const [directStickerName, setDirectStickerName] = useState('');
  const [batchStickerText, setBatchStickerText] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showStickerManager, setShowStickerManager] = useState(false);
  const [isStickerAdminUnlocked, setIsStickerAdminUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const stickerClickCountRef = useRef<number>(0);
  const stickerClickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStickerIconClick = () => {
    stickerClickCountRef.current += 1;
    if (stickerClickTimerRef.current) {
      clearTimeout(stickerClickTimerRef.current);
    }
    if (stickerClickCountRef.current >= 3) {
      stickerClickCountRef.current = 0;
      if (!isStickerAdminUnlocked) {
        setShowPinModal(true);
      } else {
        setShowStickerManager((prev) => !prev);
      }
    } else {
      stickerClickTimerRef.current = setTimeout(() => {
        stickerClickCountRef.current = 0;
      }, 600);
    }
  };

  const handleUpdateCustomStickers = (
    updater: CustomLineSticker[] | ((prev: CustomLineSticker[]) => CustomLineSticker[])
  ) => {
    setCustomStickers((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        updatePersistentUserAsset(auth.currentUser?.uid, auth.currentUser?.email, 'lineCustomStickers', next);
      } catch (err) {
        console.warn('Storage limit reached for custom stickers');
      }
      return next;
    });
  };

  const handleAddDirectSticker = () => {
    if (!directStickerUrl.trim()) return;
    const parsedUrl = parseGoogleDriveOrImageUrl(directStickerUrl.trim());
    if (!parsedUrl) return;
    const newStk: CustomLineSticker = {
      id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: directStickerName.trim() || `Stiker ${customStickers.length + 1}`,
      url: parsedUrl,
      dateAdded: Date.now(),
    };
    handleUpdateCustomStickers([newStk, ...customStickers]);
    setDirectStickerUrl('');
    setDirectStickerName('');
  };

  const handleImportBatchUrls = () => {
    if (!batchStickerText.trim()) return;
    const parsed = parseBatchStickerUrls(batchStickerText);
    if (parsed.length > 0) {
      handleUpdateCustomStickers([...parsed, ...customStickers]);
      setBatchStickerText('');
      setShowBatchModal(false);
    }
  };

  const handleResetDefaultStickers = () => {
    handleUpdateCustomStickers(INITIAL_GDRIVE_STICKERS);
  };

  const handleSyncGoogleDrive = async (folderUrlOrId?: string) => {
    const targetUrl = folderUrlOrId?.trim() || DEFAULT_GDRIVE_FOLDER_URL;
    setIsSyncingGDrive(true);
    setGdriveSyncStatus('Menghubungkan ke Google Drive...');
    try {
      const fetched = await fetchGoogleDriveFolderStickers(targetUrl);
      if (fetched.length > 0) {
        handleUpdateCustomStickers(fetched);
        setGdriveSyncStatus(`Berhasil sinkron ${fetched.length} stiker transparan!`);
      } else {
        setGdriveSyncStatus('Tidak ada file gambar ditemukan pada folder tersebut.');
      }
    } catch (err) {
      console.error(err);
      setGdriveSyncStatus('Gagal sinkronisasi folder Google Drive.');
    } finally {
      setIsSyncingGDrive(false);
      setTimeout(() => setGdriveSyncStatus(null), 3500);
    }
  };

  const handleUploadLocalStickers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 1. Instant 0ms Object URLs for local stickers
    const newItems: { item: CustomLineSticker; file: File }[] = [];
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const instantUrl = createSafeObjectURL(file);
      const item: CustomLineSticker = {
        id: `local-stk-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url: instantUrl,
      };
      newItems.push({ item, file });
    }

    if (newItems.length > 0) {
      // Blob URLs are preview-only and never persisted. Stable Firebase URLs replace them.
      setCustomStickers((prev) => [...newItems.map((entry) => entry.item), ...prev]);
      const firebaseUser = auth.currentUser;
      if (!firebaseUser?.uid) {
        newItems.forEach(({ item }) => revokeSafeObjectURL(item.url));
        setCustomStickers((prev) => prev.filter((sticker) => !newItems.some(({ item }) => item.id === sticker.id)));
        setGdriveSyncStatus(isId ? 'Login diperlukan untuk menyimpan stiker.' : 'Sign in is required to save stickers.');
      } else {
        Promise.all(newItems.map(async ({ item, file }) => {
          const uploaded = await uploadMediaAsset(file, firebaseUser.uid, 'stickers');
          if (!uploaded.downloadURL.startsWith('https://')) {
            throw new Error('Firebase Storage did not return a stable sticker URL.');
          }
          return { ...item, url: uploaded.downloadURL, dateAdded: Date.now() };
        }))
          .then((uploadedItems) => {
            handleUpdateCustomStickers([...uploadedItems, ...customStickers]);
          })
          .catch((error) => {
            console.warn('Sticker upload failed:', error);
            setCustomStickers(customStickers);
            setGdriveSyncStatus(isId ? 'Upload stiker gagal. Coba lagi.' : 'Sticker upload failed. Please try again.');
          })
          .finally(() => newItems.forEach(({ item }) => revokeSafeObjectURL(item.url)));
      }
    }

    e.target.value = '';
  };

  const handleDeleteSticker = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const target = customStickers.find((s) => s.id === id);
    if (target && isBlobUrl(target.url)) {
      revokeSafeObjectURL(target.url);
    }
    const updated = customStickers.filter((s) => s.id !== id);
    handleUpdateCustomStickers(updated);
  };

  const updateField = <K extends keyof LineChatData>(key: K, value: LineChatData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const updateFields = (fields: Partial<LineChatData>) => {
    onChange({ ...data, ...fields });
  };

  const handleApplyThemePreset = (presetId: LineThemePreset) => {
    const targetId =
      presetId === 'soft-red'
        ? 'wine'
        : presetId === 'yellow-green'
        ? 'soft-sage'
        : presetId;
    const preset =
      LINE_THEME_PRESETS_FORM.find((p) => p.id === targetId) ||
      LINE_THEME_PRESETS_FORM.find((p) => p.id === presetId);
    if (!preset) {
      updateField('themePreset', 'custom');
      return;
    }
    onChange({
      ...data,
      themePreset: preset.id,
      chatWallpaperColor: preset.chatWallpaperColor,
      headerCustomBgColor: preset.headerCustomBgColor,
      headerTextColor: preset.headerTextColor,
      senderBubbleColor: preset.senderBubbleColor,
      receiverBubbleColor: preset.receiverBubbleColor,
      senderTextColor: preset.senderTextColor,
      receiverTextColor: preset.receiverTextColor,
      actionIconsColor: preset.actionIconsColor,
      plusButtonColor: preset.bottomIconsColor || preset.actionIconsColor,
      timestampColor: preset.timestampColor || '',
      bottomBarBgColor: preset.bottomBarBgColor || '',
      inputBgColor: preset.inputBgColor || '',
      inputBorderColor: preset.inputBorderColor || '',
      inputTextColor: preset.inputTextColor || '',
      useCustomColors: true,
    });
  };

  // Add Message
  const handleAddMessage = (
    sender: 'incoming' | 'outgoing',
    type: LineMessageType = 'text'
  ) => {
    const newMessage: LineChatMessage = {
      id: 'line-msg-' + Date.now(),
      sender,
      type,
      text: '',
      imageUrl: '',
      stickerUrl: '', // Initial state empty/null by default (no automatic preselection)
      time: getLineCurrentTime(),
      isRead: true,
      readText: data.readTextLabel || 'read',
    };
    updateField('messages', [...(data.messages || []), newMessage]);
  };

  // Update Message
  const handleUpdateMessage = (index: number, updatedField: Partial<LineChatMessage>) => {
    const updatedMsgs = [...(data.messages || [])];
    updatedMsgs[index] = { ...updatedMsgs[index], ...updatedField };
    updateField('messages', updatedMsgs);
  };

  // Remove Message
  const handleRemoveMessage = (index: number) => {
    const updatedMsgs = (data.messages || []).filter((_, i) => i !== index);
    updateField('messages', updatedMsgs);
  };

  // Move Message (Reorder)
  const handleMoveMessage = (index: number, direction: 'up' | 'down') => {
    const msgs = [...(data.messages || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= msgs.length) return;
    const temp = msgs[index];
    msgs[index] = msgs[targetIndex];
    msgs[targetIndex] = temp;
    updateField('messages', msgs);
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* AU Character Preset Selector */}
      <CharacterSelector
        characters={characters}
        activeCharacterId={activeCharacterId}
        onSelect={onSelectCharacter}
        onSaveCurrent={onSaveCharacter}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      {/* 1. CONTACT INFO & HEADER STRUCTURE */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {isId ? 'Header LINE & Detail Kontak' : 'LINE Header & Contact Details'}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              {isId ? 'Nama Kontak (Mendukung emoji)' : 'Contact Name (Supports emojis)'}
            </label>
            <input
              type="text"
              value={data.contactName || ''}
              onChange={(e) => updateField('contactName', e.target.value)}
              placeholder={isId ? 'Nama' : 'Name'}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          {/* Contact Avatar Image Uploader */}
          <ImageUploader
            label={isId ? 'Foto Profil Kontak (Avatar)' : 'Contact Profile Picture (Avatar)'}
            value={data.contactAvatar || ''}
            onChange={(url) => updateField('contactAvatar', url)}
            onClear={() => updateField('contactAvatar', '')}
          />
        </div>
      </div>

      {/* 2. GLOBAL LAYOUT & SPACING CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-purple-600" />
            <span>{isId ? 'Kontrol Tata Letak & Spasi' : 'Layout & Spacing Controls'}</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Same Sender Gap */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">{isId ? 'Jarak Pengirim Sama' : 'Same Sender Gap'}</label>
              <span className="text-xs font-mono font-bold text-purple-600">{data.sameSenderGap ?? 14}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              value={data.sameSenderGap ?? 14}
              onChange={(e) => updateField('sameSenderGap', parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Different Sender Gap */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">{isId ? 'Jarak Pengirim Beda' : 'Different Sender Gap'}</label>
              <span className="text-xs font-mono font-bold text-purple-600">{data.differentSenderGap ?? 18}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={data.differentSenderGap ?? 18}
              onChange={(e) => updateField('differentSenderGap', parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Bubble Rounds */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">{isId ? 'Kebulatan Balon' : 'Bubble Rounds'}</label>
              <span className="text-xs font-mono font-bold text-purple-600">{data.bubbleRoundness ?? 18}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={data.bubbleRoundness ?? 18}
              onChange={(e) => updateField('bubbleRoundness', parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Bottom Input Bar Toggle */}
        <div className="pt-2 border-t border-slate-100">
          <label className="flex items-center space-x-2.5 cursor-pointer bg-slate-50 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={data.showInputBar !== false}
              onChange={(e) => updateField('showInputBar', e.target.checked)}
              className="rounded text-purple-600 accent-purple-600 focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 block">{isId ? 'Tampilkan Bilah Input Bawah' : 'Show Bottom Input Bar'}</span>
              <span className="text-[10px] text-slate-500 block">{isId ? 'Tampilkan bilah pengetikan pesan di bagian bawah' : 'Display message typing bar at bottom'}</span>
            </div>
          </label>
        </div>

        <div>
          <label className="text-xs text-slate-700 font-semibold block mb-1">
            {isId ? 'Teks Draf / Placeholder' : 'Draft / Placeholder Text'}
          </label>
          <input
            type="text"
            value={data.inputPlaceholder || ''}
            onChange={(e) => updateField('inputPlaceholder', e.target.value)}
            placeholder={isId ? 'Pesan' : 'Message'}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
        </div>
      </div>

      {/* 3. THEME PRESETS & ADVANCED COLOR CUSTOMIZATION */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Palette className="w-3.5 h-3.5 text-purple-600" />
          <span>{isId ? 'Preset Tema & Kustomisasi Warna' : 'Theme Presets & Color Customization'}</span>
        </h3>

        {/* Theme Presets */}
        <div>
          <label className="text-xs text-slate-700 font-semibold block mb-1.5">{isId ? 'Pilih Preset Warna' : 'Select Color Preset'}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LINE_THEME_PRESETS_FORM.map((p) => {
              const isSelected =
                data.themePreset === p.id ||
                (p.id === 'wine' && data.themePreset === 'soft-red') ||
                (p.id === 'soft-sage' && data.themePreset === 'yellow-green');
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyThemePreset(p.id)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-1 ring-purple-500'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[11px] font-bold text-slate-800 truncate">{p.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-purple-600 shrink-0" />}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: p.chatWallpaperColor }} title="Canvas" />
                    <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: p.senderBubbleColor }} title="Send Bubble" />
                    <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: p.receiverBubbleColor }} title="Receive Bubble" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Color Pickers */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <h4 className="text-[11px] font-bold uppercase text-slate-500">{isId ? 'Sesuaikan Warna Kustom' : 'Fine-Tune Custom Colors'}</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Canvas / Background Color */}
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">{isId ? 'Kanvas / Latar Belakang' : 'Canvas / Background'}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={toHexForPicker(data.chatWallpaperColor || '#82A2C6')}
                  onChange={(e) => {
                    updateFields({
                      chatWallpaperColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-8 h-8 rounded-md cursor-pointer border"
                />
                <input
                  type="text"
                  value={data.chatWallpaperColor || '#82A2C6'}
                  onChange={(e) => {
                    updateFields({
                      chatWallpaperColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            {/* Header Card Background */}
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">{isId ? 'Latar Header' : 'Header Background'}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={toHexForPicker(data.headerCustomBgColor || '#F3F4F6')}
                  onChange={(e) => {
                    updateFields({
                      headerCustomBgColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-8 h-8 rounded-md cursor-pointer border"
                />
                <input
                  type="text"
                  value={data.headerCustomBgColor || '#F3F4F6'}
                  onChange={(e) => {
                    updateFields({
                      headerCustomBgColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            {/* Header Text Color */}
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">{isId ? 'Warna Teks Header' : 'Header Text Color'}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={toHexForPicker(data.headerTextColor || '#0F172A')}
                  onChange={(e) => {
                    updateFields({
                      headerTextColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-8 h-8 rounded-md cursor-pointer border"
                />
                <input
                  type="text"
                  value={data.headerTextColor || '#0F172A'}
                  onChange={(e) => {
                    updateFields({
                      headerTextColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            {/* Send Bubble Color */}
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">{isId ? 'Balon Kirim - SAYA (KANAN)' : 'Send Bubble - ME (RIGHT)'}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={toHexForPicker(data.senderBubbleColor || '#20C76A')}
                  onChange={(e) => {
                    updateFields({
                      senderBubbleColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-8 h-8 rounded-md cursor-pointer border"
                />
                <input
                  type="text"
                  value={data.senderBubbleColor || '#20C76A'}
                  onChange={(e) => {
                    updateFields({
                      senderBubbleColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            {/* Sent Text Color */}
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">{isId ? 'Warna Teks Kirim (SAYA)' : 'Sent Text Color (ME)'}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={toHexForPicker(data.senderTextColor || '#FFFFFF')}
                  onChange={(e) => {
                    updateFields({
                      senderTextColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-8 h-8 rounded-md cursor-pointer border"
                />
                <input
                  type="text"
                  value={data.senderTextColor || ''}
                  placeholder="#FFFFFF"
                  onChange={(e) => {
                    updateFields({
                      senderTextColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            {/* Receive Bubble Color */}
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">{isId ? 'Balon Terima - KAMU (KIRI)' : 'Receive Bubble - YOU (LEFT)'}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={toHexForPicker(data.receiverBubbleColor || '#FFFFFF')}
                  onChange={(e) => {
                    updateFields({
                      receiverBubbleColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-8 h-8 rounded-md cursor-pointer border"
                />
                <input
                  type="text"
                  value={data.receiverBubbleColor || '#FFFFFF'}
                  onChange={(e) => {
                    updateFields({
                      receiverBubbleColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            {/* Receive Text Color */}
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">{isId ? 'Warna Teks Terima (KAMU)' : 'Receive Text Color (YOU)'}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={toHexForPicker(data.receiverTextColor || '#334155')}
                  onChange={(e) => {
                    updateFields({
                      receiverTextColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-8 h-8 rounded-md cursor-pointer border"
                />
                <input
                  type="text"
                  value={data.receiverTextColor || ''}
                  placeholder="#334155"
                  onChange={(e) => {
                    updateFields({
                      receiverTextColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            {/* Action Icons Color (Header) */}
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">{isId ? 'Ikon Aksi Header (Cari, Panggilan, Menu)' : 'Header Action Icons (Search, Call, Menu)'}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={toHexForPicker(data.actionIconsColor || '#166534')}
                  onChange={(e) => {
                    updateFields({
                      actionIconsColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-8 h-8 rounded-md cursor-pointer border"
                />
                <input
                  type="text"
                  value={data.actionIconsColor || ''}
                  placeholder="#166534"
                  onChange={(e) => {
                    updateFields({
                      actionIconsColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            {/* Bottom Bar Icons: Plus, Camera, Gallery, Mic */}
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">{isId ? 'Ikon Bilah Bawah (+ / Kamera / Galeri / Mic)' : 'Bottom Bar Icons (+ / Camera / Gallery / Mic)'}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={toHexForPicker(data.plusButtonColor || data.actionIconsColor || '#278653')}
                  onChange={(e) => {
                    updateFields({
                      plusButtonColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-8 h-8 rounded-md cursor-pointer border"
                />
                <input
                  type="text"
                  value={data.plusButtonColor || ''}
                  placeholder="#278653"
                  onChange={(e) => {
                    updateFields({
                      plusButtonColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            {/* Timestamp & Read Status Text Color */}
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">{isId ? 'Warna Waktu & Dibaca' : 'Timestamp & Read Color'}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={toHexForPicker(data.timestampColor || '#78908A')}
                  onChange={(e) => {
                    updateFields({
                      timestampColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-8 h-8 rounded-md cursor-pointer border"
                />
                <input
                  type="text"
                  value={data.timestampColor || ''}
                  placeholder="#78908A"
                  onChange={(e) => {
                    updateFields({
                      timestampColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            {/* Bottom Bar Background */}
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">{isId ? 'Latar Bilah Bawah (Bottom Bar)' : 'Bottom Bar Background'}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={toHexForPicker(data.bottomBarBgColor || '#E3EEE9')}
                  onChange={(e) => {
                    updateFields({
                      bottomBarBgColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-8 h-8 rounded-md cursor-pointer border"
                />
                <input
                  type="text"
                  value={data.bottomBarBgColor || ''}
                  placeholder="#E3EEE9"
                  onChange={(e) => {
                    updateFields({
                      bottomBarBgColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            {/* Input Box Pill Background */}
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">{isId ? 'Latar Kotak Ketik Pesan' : 'Message Input Background'}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={toHexForPicker(data.inputBgColor || '#FFFFFF')}
                  onChange={(e) => {
                    updateFields({
                      inputBgColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-8 h-8 rounded-md cursor-pointer border"
                />
                <input
                  type="text"
                  value={data.inputBgColor || ''}
                  placeholder="#FFFFFF"
                  onChange={(e) => {
                    updateFields({
                      inputBgColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            {/* Input Box Border Color */}
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">{isId ? 'Garis Tepi Kotak Ketik' : 'Input Border Color'}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={toHexForPicker(data.inputBorderColor || '#C9D9D2')}
                  onChange={(e) => {
                    updateFields({
                      inputBorderColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-8 h-8 rounded-md cursor-pointer border"
                />
                <input
                  type="text"
                  value={data.inputBorderColor || ''}
                  placeholder="#C9D9D2"
                  onChange={(e) => {
                    updateFields({
                      inputBorderColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            {/* Input Text Color */}
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">{isId ? 'Warna Teks Ketik Pesan' : 'Input Message Text Color'}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={toHexForPicker(data.inputTextColor || '#334155')}
                  onChange={(e) => {
                    updateFields({
                      inputTextColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-8 h-8 rounded-md cursor-pointer border"
                />
                <input
                  type="text"
                  value={data.inputTextColor || ''}
                  placeholder="#334155"
                  onChange={(e) => {
                    updateFields({
                      inputTextColor: e.target.value,
                      themePreset: 'custom',
                      useCustomColors: true,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">{isId ? 'Label Status Dibaca' : 'Read Status Label'}</label>
              <input
                type="text"
                value={data.readTextLabel || 'read'}
                onChange={(e) => updateField('readTextLabel', e.target.value)}
                placeholder="e.g. read"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold block mb-1">{isId ? 'Rasio Aspek' : 'Aspect Ratio'}</label>
              <select
                value={data.aspectRatio || '9:16'}
                onChange={(e) => updateField('aspectRatio', e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              >
                <option value="9:16">9:16 ({isId ? 'Layar Penuh Ponsel' : 'Phone Fullscreen'})</option>
                <option value="4:5">4:5 ({isId ? 'Kartu Instagram' : 'Instagram Card'})</option>
                <option value="1:1">1:1 ({isId ? 'Persegi' : 'Square'})</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3.5. LINE STICKER COLLECTION (PIN Protected via Triple-Click on Sticker Icon) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleStickerIconClick}
              className="p-1 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer select-none focus:outline-none"
              title={isId ? 'Koleksi Stiker LINE' : 'LINE Sticker Collection'}
            >
              <Smile className="w-4 h-4 text-purple-600" />
            </button>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              {isId ? 'Koleksi Stiker LINE' : 'LINE Sticker Collection'} ({customStickers.length})
            </h3>
          </div>

          {isStickerAdminUnlocked && (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-full text-[10px] font-bold">
                <Unlock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>{isId ? 'Admin Terbuka' : 'Admin Unlocked'}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsStickerAdminUnlocked(false);
                  setShowStickerManager(false);
                }}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer border border-slate-200 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                {isId ? 'Kunci Kembali' : 'Lock Again'}
              </button>
            </div>
          )}
        </div>

        {/* Quick Preview of Stickers - Wraps cleanly without horizontal scrolling */}
        <div className="flex flex-wrap items-center gap-2 py-1">
          {customStickers.map((stk) => (
            <div
              key={stk.id}
              className="group relative w-12 h-12 shrink-0 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center hover:border-purple-300 transition-colors cursor-pointer"
              title={stk.name}
              onClick={() => {
                const newMessage: LineChatMessage = {
                  id: 'line-msg-' + Date.now(),
                  sender: 'incoming',
                  type: 'sticker',
                  text: '',
                  imageUrl: '',
                  stickerUrl: stk.url,
                  time: getLineCurrentTime(),
                  isRead: true,
                  readText: data.readTextLabel || 'read',
                };
                updateField('messages', [...(data.messages || []), newMessage]);
              }}
            >
              <img
                src={stk.url}
                alt={stk.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.opacity = '0.3';
                }}
              />
              {isStickerAdminUnlocked && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteSticker(stk.id, e)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                  title={isId ? 'Hapus stiker dari koleksi' : 'Delete sticker from collection'}
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}

          {isStickerAdminUnlocked && (
            <button
              type="button"
              onClick={() => setShowStickerManager((prev) => !prev)}
              className="w-12 h-12 shrink-0 rounded-lg border border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 text-slate-400 hover:text-purple-600 flex flex-col items-center justify-center text-[10px] font-bold transition-all cursor-pointer"
              title={isId ? 'Tambah Stiker Baru' : 'Add New Sticker'}
            >
              <Plus className="w-4 h-4" />
              <span>{isId ? 'Tambah' : 'Add'}</span>
            </button>
          )}
        </div>

        {/* Expanded Sticker Manager Panel (PIN Protected) */}
        {isStickerAdminUnlocked && showStickerManager && (
          <div className="pt-3 border-t border-slate-100 space-y-4">
            {/* 1. Add Single Direct Image Link */}
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 space-y-2.5">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
                <span>{isId ? 'Tambah Stiker via Tautan Gambar Langsung' : 'Add Sticker via Direct Image URL'}</span>
              </span>
              <p className="text-[11px] text-slate-500">
                {isId
                  ? 'Mendukung tautan gambar langsung (PNG transparan, WebP, JPG, tautan bagikan Google Drive, Discord CDN, Imgur).'
                  : 'Supports direct image links (transparent PNG, WebP, JPG, Google Drive share links, Discord CDN, Imgur).'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={directStickerName}
                  onChange={(e) => setDirectStickerName(e.target.value)}
                  placeholder={isId ? 'Nama Stiker' : 'Sticker Name'}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <input
                  type="text"
                  value={directStickerUrl}
                  onChange={(e) => setDirectStickerUrl(e.target.value)}
                  placeholder={isId ? 'https://... (URL Gambar Langsung)' : 'https://... (Direct Image URL)'}
                  className="sm:col-span-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleAddDirectSticker}
                  disabled={!directStickerUrl.trim()}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isId ? 'Tambahkan ke Koleksi' : 'Add to Collection'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBatchModal(!showBatchModal)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold underline decoration-slate-300 cursor-pointer"
                >
                  {showBatchModal
                    ? (isId ? 'Tutup Tautan Massal' : 'Close Batch Links')
                    : (isId ? 'Tempel Banyak URL (Massal)' : 'Paste Multiple URLs (Batch)')}
                </button>
              </div>

              {/* Batch URLs Textarea */}
              {showBatchModal && (
                <div className="pt-2 space-y-2">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    {isId
                      ? 'Daftar Tautan Gambar (1 link per baris atau format `Nama - URL`):'
                      : 'Image Links List (1 link per line or `Name - URL` format):'}
                  </label>
                  <textarea
                    rows={4}
                    value={batchStickerText}
                    onChange={(e) => setBatchStickerText(e.target.value)}
                    placeholder={isId
                      ? `https://example.com/sticker1.png\nStiker Lucu - https://example.com/sticker2.webp`
                      : `https://example.com/sticker1.png\nCute Sticker - https://example.com/sticker2.webp`}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleImportBatchUrls}
                    disabled={!batchStickerText.trim()}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    {isId ? 'Impor Semua Tautan' : 'Import All Links'}
                  </button>
                </div>
              )}
            </div>

            {/* 2. Upload Local Images or Reset */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadLocalStickers}
                  accept="image/png,image/webp,image/jpeg,image/gif"
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span>{isId ? 'Unggah Stiker dari Perangkat' : 'Upload Stickers from Device'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetDefaultStickers}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                {isId ? 'Reset ke Koleksi Bawaan' : 'Reset to Default Collection'}
              </button>
            </div>
          </div>
        )}

        <PinAuthModal
          isOpen={showPinModal}
          onClose={() => setShowPinModal(false)}
          onSuccess={() => {
            setIsStickerAdminUnlocked(true);
            setShowStickerManager(true);
          }}
        />
      </div>

      {/* 4. MESSAGES FLOW CONTROLLER */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            {isId ? 'Pesan Chat' : 'Chat Messages'} ({data.messages?.length || 0})
          </h3>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* + YOU (LEFT) */}
            <button
              type="button"
              onClick={() => handleAddMessage('incoming', 'text')}
              className="px-2.5 py-1.5 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 active:bg-purple-600 active:text-white text-[11px] font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer border border-slate-200 hover:border-purple-300 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>{isId ? 'Kamu (Kiri)' : 'You (Left)'}</span>
            </button>

            {/* + ME (RIGHT) */}
            <button
              type="button"
              onClick={() => handleAddMessage('outgoing', 'text')}
              className="px-2.5 py-1.5 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 active:bg-purple-600 active:text-white text-[11px] font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer border border-slate-200 hover:border-purple-300 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>{isId ? 'Saya (Kanan)' : 'Me (Right)'}</span>
            </button>

            {/* STICKER */}
            <button
              type="button"
              onClick={() => handleAddMessage('incoming', 'sticker')}
              className="px-2.5 py-1.5 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 active:bg-purple-600 active:text-white text-[11px] font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer border border-slate-200 hover:border-purple-300 shadow-2xs"
            >
              <Smile className="w-3.5 h-3.5 text-slate-500" />
              <span>{isId ? 'Stiker' : 'Sticker'}</span>
            </button>
          </div>
        </div>

        {/* Message List */}
        <div className="space-y-3 pt-1">
          {(!data.messages || data.messages.length === 0) ? (
            <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              {isId
                ? 'Belum ada pesan dalam alur obrolan. Klik + Kamu (Kiri), + Saya (Kanan), atau pilih Stiker di atas.'
                : 'No messages in chat flow yet. Click + You (Left), + Me (Right), or pick a Sticker above.'}
            </div>
          ) : (
            data.messages.map((msg, index) => {
              const isOutgoing = msg.sender === 'outgoing';
              const rawType = msg.type || (msg.stickerUrl ? 'sticker' : msg.imageUrl ? 'image' : 'text');
              const msgType = rawType;
              const isCall =
                msgType === 'voice_call' ||
                msgType === 'video_call' ||
                msgType === 'missed_voice_call' ||
                msgType === 'missed_video_call';

              return (
                <div
                  key={msg.id || index}
                  className={`p-3 rounded-xl border transition-all ${
                    isOutgoing ? 'bg-purple-50/20 border-purple-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-2 flex-wrap gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-slate-200 shadow-2xs shrink-0">
                        #{index + 1}
                      </span>

                      {/* Sender Role Segmented Buttons: YOU (LEFT) & ME (RIGHT) */}
                      <div className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 shadow-2xs shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateMessage(index, { sender: 'incoming' })}
                          className={`text-[11px] px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                            !isOutgoing
                              ? 'bg-purple-600 text-white shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900 font-medium'
                          }`}
                        >
                          {isId ? 'KAMU (KIRI)' : 'YOU (LEFT)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateMessage(index, { sender: 'outgoing' })}
                          className={`text-[11px] px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                            isOutgoing
                              ? 'bg-purple-600 text-white shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900 font-medium'
                          }`}
                        >
                          {isId ? 'SAYA (KANAN)' : 'ME (RIGHT)'}
                        </button>
                      </div>

                      {/* Type Selector */}
                      <select
                        value={msgType}
                        onChange={(e) =>
                          handleUpdateMessage(index, { type: e.target.value as any })
                        }
                        className="bg-white border border-slate-200 rounded-md px-2 py-0.5 text-xs font-medium focus:outline-none shrink-0"
                      >
                        <option value="text">{isId ? 'Pesan Teks' : 'Text Message'}</option>
                        <option value="image">{isId ? 'Lampiran Gambar' : 'Image Attachment'}</option>
                        <option value="sticker">{isId ? 'Elemen Stiker (1:1)' : 'Sticker Element (1:1)'}</option>
                      </select>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center space-x-1 shrink-0 ml-auto bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
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
                          const isNowRecalled = !(msg.isRecalled || msg.type === 'recalled');
                          handleUpdateMessage(index, {
                            isRecalled: isNowRecalled,
                            type: isNowRecalled ? 'recalled' : (msg.imageUrl ? 'image' : 'text'),
                          });
                        }}
                        className={`p-1.5 cursor-pointer rounded transition-colors ${
                          (msg.isRecalled || msg.type === 'recalled')
                            ? 'text-rose-600 bg-rose-100 dark:bg-rose-950/60 font-bold'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                        }`}
                        title={
                          (msg.isRecalled || msg.type === 'recalled')
                            ? (isId ? 'Batalkan Tarik Pesan' : 'Restore Message')
                            : (isId ? 'Tarik Pesan (Unsend / Recall)' : 'Unsend / Recall Message')
                        }
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMessage(index)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer rounded transition-colors ml-0.5"
                        title={isId ? 'Hapus Pesan' : 'Delete Message'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Input Fields based on Message Type */}
                  {msgType === 'text' && (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={msg.text || ''}
                        onChange={(e) => handleUpdateMessage(index, { text: e.target.value })}
                        placeholder={msg.sender === 'incoming' ? (isId ? 'Hai apa kabar! 😊' : 'Hey there! 😊') : (isId ? 'Bisa ngobrol sekarang?' : 'Free to catch up now?')}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-y"
                      />
                    </div>
                  )}

                  {msgType === 'image' && (
                    <div className="space-y-2">
                      <ImageUploader
                        label={isId ? 'URL Gambar Pesan' : 'Message Image URL'}
                        value={msg.imageUrl || (msg.text?.startsWith('http') ? msg.text : '') || ''}
                        onChange={(url) => {
                          const existingCaption = msg.text && !msg.text.startsWith('http') && !msg.text.startsWith('data:') ? msg.text : '';
                          handleUpdateMessage(index, { imageUrl: url, text: existingCaption });
                        }}
                        onClear={() => handleUpdateMessage(index, { imageUrl: '', text: '' })}
                      />
                      <div>
                        <label className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block mb-1">
                          {isId ? 'Teks Keterangan Opsional' : 'Optional Caption Text'}
                        </label>
                        <input
                          type="text"
                          value={msg.text && !msg.text.startsWith('http') && !msg.text.startsWith('data:') ? msg.text : ''}
                          onChange={(e) => handleUpdateMessage(index, { text: e.target.value })}
                          placeholder={isId ? 'Tambahkan keterangan di bawah gambar (kosongkan jika tidak ada)' : 'Add caption below image (leave blank for none)'}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}

                  {msgType === 'sticker' && (
                    <div className="space-y-2 bg-slate-50/90 p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-800 font-bold flex items-center space-x-1.5">
                          <Smile className="w-4 h-4 text-purple-600" />
                          <span>{isId ? 'Koleksi Stiker' : 'Sticker Collection'}</span>
                        </label>
                        <span className="text-[10px] text-slate-500 font-medium">{isId ? '1:1 Transparan' : '1:1 Transparent'}</span>
                      </div>

                      {/* Clean Sticker Library Grid */}
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-lg">
                        {customStickers.map((stk) => {
                          const isSelected = Boolean(msg.stickerUrl && msg.stickerUrl.trim() === stk.url.trim());
                          return (
                            <button
                              key={stk.id}
                              type="button"
                              onClick={() => handleUpdateMessage(index, { stickerUrl: stk.url })}
                              className={`relative aspect-square rounded-lg p-1.5 border transition-all cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-500 shadow-xs'
                                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                              title={stk.name}
                            >
                              <img
                                src={stk.url}
                                alt={stk.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.opacity = '0.3';
                                }}
                              />
                              {isSelected && (
                                <div className="absolute top-1 right-1 bg-purple-600 text-white rounded-full p-0.5 shadow-xs">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Timestamp & Read Status Settings */}
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/60">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">{isId ? 'Waktu Kirim' : 'Timestamp'}</label>
                      <input
                        type="text"
                        value={formatLineTimestamp(msg.time) || ''}
                        onChange={(e) => handleUpdateMessage(index, { time: e.target.value.replace(/:/g, '.') })}
                        placeholder="16.34"
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                      />
                    </div>

                    {isOutgoing && (
                      <div className="flex items-center space-x-2 pt-3">
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={msg.isRead !== false}
                            onChange={(e) => handleUpdateMessage(index, { isRead: e.target.checked })}
                            className="rounded text-purple-600 focus:ring-0 w-3.5 h-3.5 accent-purple-600"
                          />
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                            {isId ? `Tampilkan "${msg.readText || data.readTextLabel || 'read'}"` : `Show "${msg.readText || data.readTextLabel || 'read'}"`}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Save Profile Button at Absolute Bottom */}
      <div className="pt-2">
        <SaveProfileButton onSave={onSaveProfile} />
      </div>
    </div>
  );
};
