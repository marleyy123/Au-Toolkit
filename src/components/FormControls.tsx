import React, { useRef, useState, useEffect } from 'react';
import { VerifiedType, CharacterPreset } from '../types';
import { User, Upload, Plus, Trash2, Image as ImageIcon, X, Crop, Loader2, Folder, Edit2, Check } from 'lucide-react';
import { DEFAULT_AVATAR } from '../data/defaultTemplates';
import { ImageCropperModal } from './ImageCropperModal';
import { UniversalFolderItem } from '../features/workspace/components/UniversalFolderItem';
import { compressAndReadAsDataURL } from '../utils/imageCompressor';
import {
  fileToBase64,
  readAndOptimizeImageFile,
  normalizeGoogleDriveUrl,
  isHtmlSnippet,
} from '../utils/imageHandler';
import {
  createSafeObjectURL,
  revokeSafeObjectURL,
  isBlobUrl,
  registerTransientImageUrl,
  resolvePersistentImageUrl,
  persistLocalImageBlob,
  bindPersistentImageObjectUrl,
  deleteLocalImageReference,
  getLocalMediaOwnerUid,
} from '../utils/imageManager';
import { registerOriginalImage } from '../utils/imageRegistry';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { auth, getStoredAuthUser } from '../firebase';

// Quick AU Characters / Folder Preset Selector Component
export interface CharacterSelectorProps {
  characters?: Array<{ id: string; name?: string; [key: string]: any }>;
  activeCharacterId?: string;
  onSelect?: (folder: any) => void;
  onSelectCharacter?: (folder: any) => void;
  onSaveCurrent?: () => void;
  onSaveCharacter?: () => void;
  onAddFolder?: () => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
  addLabel?: string;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  characters = [],
  activeCharacterId,
  onSelect,
  onSelectCharacter,
  onSaveCurrent,
  onSaveCharacter,
  onAddFolder,
  onDeleteCharacter,
  onRenameCharacter,
  addLabel,
}) => {
  const { language } = useLanguage();
  const { isDark } = useTheme();

  const labelText = addLabel ? addLabel.replace(/^\+\s*/, '') : 'Add Folder';

  // Normalized folders list guaranteed to contain at least Folder 1
  const folders = characters && characters.length > 0
    ? characters
    : [{ id: 'folder-1', name: 'Folder 1' }];

  const activeId = activeCharacterId || folders[0]?.id || 'folder-1';

  const handleAddFolder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const addFn = onAddFolder || onSaveCharacter || onSaveCurrent;
    if (addFn) {
      addFn();
    }
  };

  const handleItemSelect = (char: any) => {
    const selectFn = onSelectCharacter || onSelect;
    if (selectFn) {
      selectFn(char);
    }
  };

  return (
    <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} border rounded-xl p-3.5 shadow-xs mb-4 relative z-0 transition-colors`}>
      {/* Top Header: Title on Left, Standalone "+ Add Folder" Action Button on Right */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'} uppercase tracking-wider flex items-center space-x-1.5`}>
          <Folder className={`w-3.5 h-3.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          <span>{language === 'id' ? 'Preset Karakter AU' : 'Quick AU Characters'}</span>
        </span>

        {/* Clean "+ Add Folder" Button */}
        <button
          type="button"
          id="add-folder-button"
          title="+ Add Folder"
          onClick={handleAddFolder}
          aria-label="+ Add Folder"
          className="cursor-pointer text-xs bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold flex items-center space-x-1.5 transition-all border border-purple-500 px-3 py-1.5 rounded-lg active:scale-95 shadow-sm shrink-0 select-none"
        >
          <Plus className="w-3.5 h-3.5 shrink-0 text-white stroke-[2.5]" />
          <span>{labelText}</span>
        </button>
      </div>

      {/* Navigation Folder Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-0.5" role="tablist" data-no-swipe="true">
        {folders.map((char, charIdx) => (
          <UniversalFolderItem
            key={char.id || `folder-${charIdx}`}
            id={char.id || `folder-${charIdx}`}
            name={char.name}
            index={charIdx}
            isActive={char.id === activeId}
            isDark={isDark}
            language={language}
            totalFolders={folders.length}
            onSelect={() => handleItemSelect(char)}
            onRename={onRenameCharacter}
            onDelete={onDeleteCharacter}
          />
        ))}
      </div>
    </div>
  );
};

// Reusable Universal Architecture Aliases
export const UniversalFolderList = CharacterSelector;
export type UniversalFolderListProps = CharacterSelectorProps;

// Single Image File Uploader
interface ImageUploaderProps {
  label?: string;
  title?: string;
  value?: string;
  imageUrl?: string;
  currentImage?: string;
  aspectRatio?: string;
  placeholder?: string;
  onChange?: (url: string) => void;
  onImageChange?: (url: string) => void;
  aspectHint?: string;
  onClear?: () => void;
  forceAspect?: number;
  allow916?: boolean;
  cropShape?: 'round' | 'rect';
  skipCompression?: boolean;
  maxOutputDimension?: number;
  quality?: number;
  storageCategory?: 'avatars' | 'media';
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  title,
  value,
  imageUrl,
  currentImage,
  aspectRatio,
  placeholder,
  onChange,
  onImageChange,
  aspectHint,
  onClear,
  forceAspect,
  allow916 = true,
  cropShape,
  skipCompression = false,
  maxOutputDimension,
  quality,
  storageCategory,
}) => {
  const displayLabel = label || title || 'Image';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperSession, setCropperSession] = useState<{ id: string; src: string } | null>(null);
  const activeSessionRef = useRef<{ id: string; tempBlobUrl: string | null } | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadNotice, setUploadNotice] = useState('');
  const { isDark } = useTheme();
  const { language } = useLanguage();

  const currentValue = value !== undefined ? value : (imageUrl !== undefined ? imageUrl : (currentImage !== undefined ? currentImage : ''));
  const latestUpload = useRef({ onChange, onImageChange, currentValue });
  latestUpload.current = { onChange, onImageChange, currentValue };
  const uploadMounted = useRef(true);
  const displayedImage = pendingPreviewUrl || currentValue;
  const lowerLabel = displayLabel.toLowerCase();
  const isAvatarUpload =
    storageCategory === 'avatars' ||
    lowerLabel.includes('avatar') ||
    lowerLabel.includes('profile') ||
    lowerLabel.includes('profil') ||
    lowerLabel.includes('foto profil');
  const derivedCropShape: 'round' | 'rect' =
    cropShape ||
    (isAvatarUpload ||
    lowerLabel.includes('album art') ||
    lowerLabel.includes('music disc') ||
    lowerLabel.includes('disc') ||
    lowerLabel.includes('sound cover') ||
    lowerLabel.includes('soundcover') ||
    lowerLabel.includes('piringan')
      ? 'round'
      : 'rect');

  const validateImage = (image: Blob): string | null => {
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    if (!allowedTypes.has(image.type)) {
      return language === 'id'
        ? 'Format gambar tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.'
        : 'Unsupported image format. Use JPG, PNG, WebP, or GIF.';
    }
    if (image.size <= 0) {
      return language === 'id' ? 'File gambar kosong.' : 'The image file is empty.';
    }
    if (image.size > 15 * 1024 * 1024) {
      return language === 'id'
        ? 'Ukuran gambar maksimal 15 MB.'
        : 'The maximum image size is 15 MB.';
    }
    return null;
  };

  // Cleanup any uncommitted temporary object URLs on unmount
  useEffect(() => {
    uploadMounted.current = true;
    return () => {
      uploadMounted.current = false;
      if (activeSessionRef.current?.tempBlobUrl && isBlobUrl(activeSessionRef.current.tempBlobUrl)) {
        revokeSafeObjectURL(activeSessionRef.current.tempBlobUrl);
        activeSessionRef.current = null;
      }
    };
  }, []);

  const handleValueChange = (newUrl: string) => {
    // 1. Block raw HTML code strings (e.g. from copy-pasting HTML error pages or scripts)
    if (isHtmlSnippet(newUrl)) {
      console.warn('Blocked raw HTML input in ImageUploader');
      setUploadError(language === 'id' ? 'HTML tidak dapat digunakan sebagai URL gambar.' : 'HTML cannot be used as an image URL.');
      return;
    }

    // 2. Normalize Google Drive links so they don't produce broken HTML error pages
    const normalized = normalizeGoogleDriveUrl(newUrl);
    const lowerUrl = normalized.trim().toLowerCase();
    if (lowerUrl.startsWith('blob:') || lowerUrl.startsWith('data:') || lowerUrl.startsWith('file:')) {
      setUploadError(
        language === 'id'
          ? 'URL sementara tidak dapat disimpan. Unggah file agar tersimpan permanen.'
          : 'Temporary URLs cannot be saved. Upload the file for permanent storage.'
      );
      return;
    }

    setUploadError('');
    setUploadNotice('');
    if (onChange) onChange(normalized);
    if (onImageChange) onImageChange(normalized);
  };

  const handleOpenPicker = () => {
    if (isUploading) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Always reset input value so re-selecting the exact same file fires change event
    e.target.value = '';
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }
    setUploadError('');

    // Clean up any previous uncommitted temporary object URL
    if (activeSessionRef.current?.tempBlobUrl && isBlobUrl(activeSessionRef.current.tempBlobUrl)) {
      revokeSafeObjectURL(activeSessionRef.current.tempBlobUrl);
    }

    // 1. Instant 0ms browser-native Object URL for immediate preview and cropper display
    const instantUrl = createSafeObjectURL(file);
    if (!instantUrl) return;
    registerOriginalImage(instantUrl, file);

    const newSessionId = 'crop_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    activeSessionRef.current = { id: newSessionId, tempBlobUrl: instantUrl };

    // STRICT SEPARATION: Only set temporary cropper state.
    // DO NOT modify the main template! The main template remains unchanged until user clicks Apply.
    setCropperSession({ id: newSessionId, src: instantUrl });
  };

  const handleThumbnailClick = () => {
    if (isUploading) return;
    if (currentValue && currentValue.trim() !== '') {
      // Invalidate and clean up any previous temporary session
      if (activeSessionRef.current?.tempBlobUrl && isBlobUrl(activeSessionRef.current.tempBlobUrl)) {
        revokeSafeObjectURL(activeSessionRef.current.tempBlobUrl);
      }
      const newSessionId = 'crop_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      activeSessionRef.current = { id: newSessionId, tempBlobUrl: null };
      setCropperSession({ id: newSessionId, src: currentValue });
    } else {
      handleOpenPicker();
    }
  };

  const handleCancelCrop = () => {
    // STRICT CANCEL: Discard temporary state, revoke object URL, invalidate session.
    // The main template remains exactly as before!
    if (activeSessionRef.current?.tempBlobUrl && isBlobUrl(activeSessionRef.current.tempBlobUrl)) {
      revokeSafeObjectURL(activeSessionRef.current.tempBlobUrl);
    }
    activeSessionRef.current = null;
    setCropperSession(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyCrop = async (croppedUrl: string, sessionId?: string) => {
    // ASYNC RACE CONDITION SAFETY:
    // Only commit if the session is still active and matches the current session
    if (!activeSessionRef.current || (sessionId && activeSessionRef.current.id !== sessionId)) {
      return;
    }

    // Storage is intentionally unavailable for this release. Convert the crop
    // to a session-only object URL and commit it immediately to form/preview;
    // Firestore serialization restores the previous stable URL instead.
    setUploadError('');

    // Revoke the original draft object URL after the cropper has produced its
    // independent output.
    if (activeSessionRef.current.tempBlobUrl && isBlobUrl(activeSessionRef.current.tempBlobUrl)) {
      revokeSafeObjectURL(activeSessionRef.current.tempBlobUrl);
    }

    activeSessionRef.current = null;
    setCropperSession(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      const response = await fetch(croppedUrl);
      if (!response.ok) throw new Error('The cropped image could not be prepared.');
      const croppedBlob = await response.blob();
      if (!uploadMounted.current) return;
      const validationError = validateImage(croppedBlob);
      if (validationError) throw new Error(validationError);
      const localPreviewUrl = createSafeObjectURL(croppedBlob);
      if (!localPreviewUrl) throw new Error('The local image preview could not be created.');

      registerTransientImageUrl(localPreviewUrl, resolvePersistentImageUrl(currentValue));
      registerOriginalImage(localPreviewUrl, croppedBlob);
      setPendingPreviewUrl(localPreviewUrl);
      latestUpload.current.onChange?.(localPreviewUrl);
      latestUpload.current.onImageChange?.(localPreviewUrl);

      const uid = getLocalMediaOwnerUid() || auth.currentUser?.uid || getStoredAuthUser()?.uid || '';
      if (!uid) throw new Error(language === 'id' ? 'UID akun belum tersedia.' : 'The account UID is unavailable.');
      const activeTab = localStorage.getItem('au_last_active_tab') || 'workspace';
      const activeFolder = localStorage.getItem(`au_active_folder_${uid}_${activeTab}`) || 'folder-1';
      const context = `${activeTab}:${activeFolder}:${displayLabel}`;
      const persistentRef = await persistLocalImageBlob(uid, croppedBlob, context);
      bindPersistentImageObjectUrl(persistentRef, localPreviewUrl);
      registerOriginalImage(persistentRef, croppedBlob);
      if (uploadMounted.current && latestUpload.current.currentValue === localPreviewUrl) {
        latestUpload.current.onChange?.(persistentRef);
        latestUpload.current.onImageChange?.(persistentRef);
      }
      setPendingPreviewUrl('');
      setUploadNotice(
        language === 'id'
          ? 'Gambar tersimpan lokal untuk akun ini. Sinkronisasi antar-device menunggu Firebase Storage.'
          : 'Image saved locally for this account. Cross-device sync still requires Firebase Storage.'
      );
    } catch (error) {
      console.error('Local image preview failed:', error);
      const detail = error instanceof Error ? error.message : (language === 'id' ? 'Kesalahan tidak diketahui.' : 'Unknown error.');
      setUploadError(
        language === 'id'
          ? `Preview gambar gagal. Gambar sebelumnya tetap dipertahankan. ${detail}`
          : `Image preview failed. The previous image was kept. ${detail}`
      );
    }
  };

  const handleClear = () => {
    void deleteLocalImageReference(currentValue);
    if (isBlobUrl(currentValue)) {
      revokeSafeObjectURL(currentValue);
    }
    handleValueChange('');
    if (onClear) onClear();
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{displayLabel}</span>
        {aspectHint && <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{aspectHint}</span>}
      </div>

      <div className="flex items-center space-x-2">
        <div
          onClick={handleThumbnailClick}
          className={`relative group w-9 h-9 rounded-lg overflow-hidden border ${
            isDark ? 'border-slate-600 bg-slate-700/80 shadow-xs' : 'border-slate-200 bg-slate-100'
          } shrink-0 cursor-pointer`}
          title={
            displayedImage && displayedImage.trim() !== ''
              ? (language === 'id' ? 'Klik untuk Sesuaikan Posisi / Crop' : 'Click to Adjust Position / Crop')
              : (language === 'id' ? 'Klik untuk Unggah Gambar' : 'Click to Upload Image')
          }
        >
          {(displayedImage && displayedImage.trim() !== '') ? (
            <img
              src={displayedImage}
              alt={displayLabel}
              className="w-full h-full object-cover"
              onError={(event) => {
                if (event.currentTarget.src !== DEFAULT_AVATAR) event.currentTarget.src = DEFAULT_AVATAR;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <Upload className="w-4 h-4 opacity-50" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
            <Upload className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex-1 flex space-x-1.5 min-w-0">
          <input
            type="text"
            value={currentValue ?? ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={placeholder !== undefined ? placeholder : (language === 'id' ? 'Masukkan URL gambar...' : 'Enter image URL...')}
            className={`flex-1 ${isDark ? 'bg-slate-800 border-slate-650 text-slate-100 placeholder-slate-400 focus:bg-slate-750 focus:border-purple-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'} border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0 transition-colors`}
          />

          <button
            type="button"
            disabled={isUploading}
            onClick={handleOpenPicker}
            className="bg-purple-600 hover:bg-purple-700 !text-white text-white border border-purple-600 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 shrink-0 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            title={language === 'id' ? 'Pilih file dari perangkat' : 'Upload from device'}
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-white" />
            )}
            <span className="text-white">{isUploading ? (language === 'id' ? 'Mengunggah...' : 'Uploading...') : (language === 'id' ? 'Unggah' : 'Upload')}</span>
          </button>

          {(Boolean(onClear) || (currentValue && currentValue.trim() !== '')) && (
            <button
              type="button"
              disabled={isUploading}
              title={language === 'id' ? 'Hapus / Kosongkan Gambar' : 'Clear Image'}
              onClick={handleClear}
              className={`${isDark ? 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-800/80 text-rose-400' : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600'} border p-1.5 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-50`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onClick={(e) => {
            (e.target as HTMLInputElement).value = '';
          }}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {uploadError && (
        <p role="alert" className="text-[11px] leading-snug text-rose-600 dark:text-rose-400">
          {uploadError}
        </p>
      )}

      {uploadNotice && (
        <p role="status" className="text-[11px] leading-snug text-amber-600 dark:text-amber-400">
          {uploadNotice}
        </p>
      )}

      {cropperSession && (
        <ImageCropperModal
          isOpen={!!cropperSession}
          imageSrc={cropperSession.src}
          sessionId={cropperSession.id}
          onClose={handleCancelCrop}
          cropShape={derivedCropShape}
          forceAspect={forceAspect}
          allow916={allow916}
          maxOutputDimension={maxOutputDimension}
          quality={quality}
          onCropComplete={handleApplyCrop}
        />
      )}
    </div>
  );
};

// Multiple Images Grid Uploader for Twitter / IG Feed
interface MultiImageUploaderProps {
  label: string;
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  cropShape?: 'round' | 'rect';
  forceAspect?: number;
  allow916?: boolean;
}

export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
  label,
  images,
  onChange,
  maxImages = 4,
  cropShape = 'rect',
  forceAspect,
  allow916 = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSessionRef = useRef<{
    id: string;
    isNewUpload: boolean;
    targetIndex: number;
    tempBlobUrls: string[];
  } | null>(null);
  const [cropperModalState, setCropperModalState] = useState<{
    sessionId: string;
    src: string;
    queue: string[];
  } | null>(null);
  const { isDark } = useTheme();
  const { language } = useLanguage();
  const latestImages = useRef({ images, onChange });
  latestImages.current = { images, onChange };
  const uploadMounted = useRef(true);
  const commitImages = (updated: string[]) => {
    if (!uploadMounted.current) return;
    latestImages.current.images = updated;
    latestImages.current.onChange(updated);
  };

  // Cleanup temporary object URLs on unmount
  useEffect(() => {
    uploadMounted.current = true;
    return () => {
      uploadMounted.current = false;
      if (activeSessionRef.current?.tempBlobUrls) {
        activeSessionRef.current.tempBlobUrls.forEach((url) => {
          if (isBlobUrl(url)) revokeSafeObjectURL(url);
        });
        activeSessionRef.current = null;
      }
    };
  }, []);

  const handleOpenPicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) return;

    const toProcess = files.slice(0, remainingSlots);
    // Instant 0ms browser-native Object URLs for all chosen images
    const instantUrls: string[] = [];
    toProcess.forEach((file) => {
      const u = createSafeObjectURL(file);
      if (u) {
        registerOriginalImage(u, file);
        instantUrls.push(u);
      }
    });
    if (instantUrls.length === 0) return;

    // Invalidate any previous session and cleanup its URLs
    if (activeSessionRef.current?.tempBlobUrls) {
      activeSessionRef.current.tempBlobUrls.forEach((url) => {
        if (isBlobUrl(url)) revokeSafeObjectURL(url);
      });
    }

    const sessionId = 'multi_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    activeSessionRef.current = {
      id: sessionId,
      isNewUpload: true,
      targetIndex: -1,
      tempBlobUrls: instantUrls,
    };

    // STRICT SEPARATION: DO NOT update template images immediately!
    // Modal opens for cropping first image. Only Apply will add to template.
    setCropperModalState({
      sessionId,
      src: instantUrls[0],
      queue: instantUrls.slice(1),
    });
  };

  const handleEditExisting = (idx: number) => {
    if (idx < 0 || idx >= images.length) return;
    const existingSrc = images[idx];
    if (!existingSrc) return;

    // Invalidate any previous session and cleanup
    if (activeSessionRef.current?.tempBlobUrls) {
      activeSessionRef.current.tempBlobUrls.forEach((url) => {
        if (isBlobUrl(url)) revokeSafeObjectURL(url);
      });
    }

    const sessionId = 'multi_edit_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    activeSessionRef.current = {
      id: sessionId,
      isNewUpload: false,
      targetIndex: idx,
      tempBlobUrls: [],
    };

    setCropperModalState({
      sessionId,
      src: existingSrc,
      queue: [],
    });
  };

  const handleRemove = (idx: number) => {
    const targetUrl = images[idx];
    void deleteLocalImageReference(targetUrl);
    if (isBlobUrl(targetUrl)) {
      revokeSafeObjectURL(targetUrl);
    }
    const updated = images.filter((_, i) => i !== idx);
    onChange(updated);
  };

  const handleCancelCrop = () => {
    // STRICT CANCEL: Discard temporary files, revoke all temporary object URLs, close modal
    if (activeSessionRef.current?.tempBlobUrls) {
      activeSessionRef.current.tempBlobUrls.forEach((url) => {
        if (isBlobUrl(url)) revokeSafeObjectURL(url);
      });
    }
    activeSessionRef.current = null;
    setCropperModalState(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Main template images array is completely untouched!
  };

  const handleCropComplete = async (croppedUrl: string, sessionId?: string) => {
    const session = activeSessionRef.current;
    if (!session || (sessionId && session.id !== sessionId)) {
      return;
    }

    let croppedBlob: Blob;
    let localPreviewUrl: string;
    try {
      const response = await fetch(croppedUrl);
      if (!response.ok) throw new Error('The cropped image could not be prepared.');
      croppedBlob = await response.blob();
      if (!uploadMounted.current) return;
      localPreviewUrl = createSafeObjectURL(croppedBlob);
      if (!localPreviewUrl) throw new Error('The local image preview could not be created.');
      registerOriginalImage(localPreviewUrl, croppedBlob);
    } catch (error) {
      console.error('Local media preview failed:', error);
      return;
    }

    const uid = getLocalMediaOwnerUid() || auth.currentUser?.uid || getStoredAuthUser()?.uid || '';
    const activeTab = localStorage.getItem('au_last_active_tab') || 'workspace';
    const activeFolder = uid
      ? (localStorage.getItem(`au_active_folder_${uid}_${activeTab}`) || 'folder-1')
      : 'folder-1';
    const context = `${activeTab}:${activeFolder}:${label}:multi`;

    if (!session.isNewUpload) {
      // Editing existing image
      const idx = session.targetIndex;
      if (idx >= 0 && idx < images.length) {
        const oldUrl = images[idx];
        const updated = [...latestImages.current.images];
        updated[idx] = localPreviewUrl;
        commitImages(updated);
        try {
          if (!uid) throw new Error('The account UID is unavailable.');
          const persistentRef = await persistLocalImageBlob(uid, croppedBlob, context);
          bindPersistentImageObjectUrl(persistentRef, localPreviewUrl);
          registerTransientImageUrl(localPreviewUrl, persistentRef);
          registerOriginalImage(persistentRef, croppedBlob);
          const persisted = latestImages.current.images.map((image) => image === localPreviewUrl ? persistentRef : image);
          commitImages(persisted);
          void deleteLocalImageReference(oldUrl, uid);
          if (isBlobUrl(oldUrl)) revokeSafeObjectURL(oldUrl);
        } catch (error) {
          console.error('Local media persistence failed:', error);
        }
      }
      activeSessionRef.current = null;
      setCropperModalState(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // New upload flow: commit immediately for preview, then replace it with
    // an account-scoped stable IndexedDB reference for autosave/rehydration.
    const currentSrc = cropperModalState?.src;
    if (currentSrc && isBlobUrl(currentSrc)) {
      revokeSafeObjectURL(currentSrc);
    }

    const updated = [...latestImages.current.images, localPreviewUrl];
    commitImages(updated);
    try {
      if (!uid) throw new Error('The account UID is unavailable.');
      const persistentRef = await persistLocalImageBlob(uid, croppedBlob, context);
      bindPersistentImageObjectUrl(persistentRef, localPreviewUrl);
      registerTransientImageUrl(localPreviewUrl, persistentRef);
      registerOriginalImage(persistentRef, croppedBlob);
      commitImages(latestImages.current.images.map((image) => image === localPreviewUrl ? persistentRef : image));
    } catch (error) {
      console.error('Local media persistence failed:', error);
    }

    // If there are more images in queue, proceed to the next one
    if (cropperModalState && cropperModalState.queue.length > 0) {
      const nextSrc = cropperModalState.queue[0];
      const nextQueue = cropperModalState.queue.slice(1);
      const nextSessionId = 'multi_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

      activeSessionRef.current = {
        id: nextSessionId,
        isNewUpload: true,
        targetIndex: -1,
        tempBlobUrls: nextQueue.concat(nextSrc),
      };

      setCropperModalState({
        sessionId: nextSessionId,
        src: nextSrc,
        queue: nextQueue,
      });
    } else {
      activeSessionRef.current = null;
      setCropperModalState(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{label} ({images.length}/{maxImages})</span>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleOpenPicker}
            className="bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>{language === 'id' ? 'Unggah Media' : 'Upload Media'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {images.map((img, idx) => {
          if (!img || typeof img !== 'string' || img.trim() === '') return null;
          return (
            <div key={idx} className={`relative group aspect-square rounded-lg overflow-hidden border ${isDark ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-slate-100'}`}>
              <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
              <button
                type="button"
                title={language === 'id' ? 'Hapus gambar' : 'Delete image'}
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 bg-slate-900/80 text-white p-1 rounded-full opacity-90 hover:bg-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <button
                type="button"
                title={language === 'id' ? 'Crop & Sesuaikan' : 'Crop & Adjust'}
                onClick={() => handleEditExisting(idx)}
                className="absolute bottom-1 right-1 bg-slate-900/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-purple-600 transition-opacity cursor-pointer"
              >
                <Crop className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={handleOpenPicker}
            className={`aspect-square rounded-lg border-2 border-dashed ${isDark ? 'border-slate-600 hover:border-purple-400 bg-slate-800/90 hover:bg-slate-750 text-slate-300 hover:text-purple-300 shadow-sm' : 'border-slate-300 hover:border-purple-500 bg-slate-50 hover:bg-purple-50/50 text-slate-400 hover:text-purple-600'} flex flex-col items-center justify-center transition-colors cursor-pointer`}
          >
            <ImageIcon className={`w-4 h-4 mb-1 ${isDark ? 'text-slate-300 group-hover:text-purple-300' : 'text-slate-400 group-hover:text-purple-600'}`} />
            <span className="text-[10px] font-bold">{language === 'id' ? 'Tambah Media' : 'Add Media'}</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onClick={(e) => {
          (e.target as HTMLInputElement).value = '';
        }}
        onChange={handleAddFiles}
        className="hidden"
      />

      {cropperModalState && (
        <ImageCropperModal
          isOpen={!!cropperModalState}
          imageSrc={cropperModalState.src}
          sessionId={cropperModalState.sessionId}
          cropShape={cropShape}
          forceAspect={forceAspect}
          allow916={allow916}
          onClose={handleCancelCrop}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};

// Verified Badge Selector
interface VerifiedSelectorProps {
  value: VerifiedType;
  onChange: (val: VerifiedType) => void;
  allowIg?: boolean;
  onlyNoneAndBlue?: boolean;
}

export const VerifiedSelector: React.FC<VerifiedSelectorProps> = ({
  value,
  onChange,
  allowIg = false,
}) => {
  const isBlue = value === 'blue' || value === 'ig-blue';
  const { isDark } = useTheme();
  const { language } = useLanguage();

  return (
    <div className="space-y-1">
      <label className={`text-xs ${isDark ? 'text-slate-200' : 'text-slate-700'} font-semibold block`}>
        {language === 'id' ? 'Lencana Verifikasi' : 'Verified Badge'}
      </label>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange('none')}
          className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
            value === 'none'
              ? 'bg-purple-600 border-purple-600 text-white font-bold shadow-xs'
              : isDark
              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          {language === 'id' ? 'Tanpa Lencana' : 'No Badge'}
        </button>

        <button
          type="button"
          onClick={() => onChange(allowIg ? 'ig-blue' : 'blue')}
          className={`px-2.5 py-1 text-xs rounded-lg border transition-all flex items-center space-x-1.5 cursor-pointer ${
            isBlue
              ? 'bg-purple-600 border-purple-600 text-white font-bold shadow-xs'
              : isDark
              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#1d9bf0] shrink-0" />
          <span>{language === 'id' ? 'Centang Biru' : 'Blue Verified'}</span>
        </button>
      </div>
    </div>
  );
};

// Global "Save This Folder" Primary Button (Hidden: real-time automatic cloud/local sync active)
export const SaveProfileButton: React.FC<{ onSave?: () => void; onSaveProfile?: () => void; label?: string }> = () => {
  return null;
};
