import React, { useRef, useState } from 'react';
import { NotesData, CharacterPreset, NotesImageItem } from '../types';
import { toHexForPicker } from '../utils/colorUtils';
import { useLanguage } from '../context/LanguageContext';
import { CharacterSelector } from './FormControls';
import { compressAndReadAsDataURL } from '../utils/imageCompressor';
import { ImageCropperModal } from './ImageCropperModal';
import {
  createSafeObjectURL,
  revokeSafeObjectURL,
  isBlobUrl,
} from '../utils/imageManager';
import {
  FileText,
  Type,
  Palette,
  Layout,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Image as ImageIcon,
  Upload,
  Trash2,
  Move,
  Maximize2,
  Crop,
  RotateCcw,
  Sliders,
  Check,
  Sparkles,
  Plus,
  Square,
  Circle,
} from 'lucide-react';

interface Props {
  data: NotesData;
  onChange: (updated: NotesData) => void;
  characters?: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter?: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter?: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

// Rich selection of independent fonts for Notes
const NOTES_FONT_OPTIONS = [
  { id: 'montserrat', label: 'Montserrat', family: 'Montserrat, sans-serif' },
  { id: 'poppins', label: 'Poppins', family: 'Poppins, sans-serif' },
  { id: 'inter', label: 'Inter', family: 'Inter, sans-serif' },
  { id: 'plus-jakarta-sans', label: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif" },
  { id: 'playfair-display', label: 'Playfair Display', family: "'Playfair Display', serif" },
  { id: 'cinzel', label: 'Cinzel (Serif Elegance)', family: 'Cinzel, serif' },
  { id: 'caveat', label: 'Caveat (Handwriting)', family: 'Caveat, cursive' },
  { id: 'oswald', label: 'Oswald (Condensed)', family: 'Oswald, sans-serif' },
  { id: 'courier-new', label: 'Courier / Typewriter', family: "'Courier New', monospace" },
  { id: 'outfit', label: 'Outfit', family: 'Outfit, sans-serif' },
  { id: 'lora', label: 'Lora (Editorial)', family: 'Lora, serif' },
  { id: 'cormorant-garamond', label: 'Cormorant Garamond', family: "'Cormorant Garamond', serif" },
  { id: 'dancing-script', label: 'Dancing Script', family: "'Dancing Script', cursive" },
  { id: 'roboto-mono', label: 'Roboto Mono', family: "'Roboto Mono', monospace" },
  { id: 'default', label: 'System Default', family: 'system-ui, sans-serif' },
];

const POPULAR_BG_SWATCHES = [
  { label: 'White', color: '#FFFFFF' },
  { label: 'Cream', color: '#FDFBF7' },
  { label: 'Soft Yellow', color: '#FEF9C3' },
  { label: 'Lavender', color: '#FAF5FF' },
  { label: 'Sage Mint', color: '#F0FDF4' },
  { label: 'Blush Peach', color: '#FFF1F2' },
  { label: 'Sky Mist', color: '#F0F9FF' },
  { label: 'Slate Dark', color: '#18181B' },
  { label: 'OLED Black', color: '#000000' },
];

const POPULAR_TEXT_SWATCHES = [
  { label: 'Charcoal', color: '#18181B' },
  { label: 'Deep Stone', color: '#292524' },
  { label: 'Midnight Blue', color: '#0F172A' },
  { label: 'Emerald Dark', color: '#064E3B' },
  { label: 'Burgundy', color: '#881337' },
  { label: 'Deep Purple', color: '#3B0764' },
  { label: 'Warm Bronze', color: '#78350F' },
  { label: 'Clean White', color: '#FFFFFF' },
  { label: 'Soft Gray', color: '#D4D4D8' },
];

const OUTLINE_COLOR_SWATCHES = [
  { label: 'White', color: '#FFFFFF' },
  { label: 'Black', color: '#000000' },
  { label: 'Pastel Yellow', color: '#FEF08A' },
  { label: 'Pastel Purple', color: '#E9D5FF' },
  { label: 'Warm Amber', color: '#F59E0B' },
  { label: 'Soft Rose', color: '#FFE4E6' },
  { label: 'Sky Blue', color: '#BAE6FD' },
  { label: 'Sage Mint', color: '#BBF7D0' },
];

export const NotesForm: React.FC<Props> = ({
  data,
  onChange,
  characters,
  activeCharacterId,
  onSaveCharacter,
  onSelectCharacter,
  onDeleteCharacter,
  onRenameCharacter,
}) => {
  const { language } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [cropperSession, setCropperSession] = useState<{ id: string; src: string } | null>(null);
  const activeCropSessionRef = useRef<{ id: string; targetImageId: string } | null>(null);

  const updateField = <K extends keyof NotesData>(key: K, value: NotesData[K]) => {
    onChange({ ...data, [key]: value });
  };

  // Normalize images from either data.images or data.imageUrl with layout support
  const getNormalizedImages = (): NotesImageItem[] => {
    if (data.images && data.images.length > 0) {
      return data.images.map((img) => ({
        ...img,
        layout: img.layout || data.imageLayout || 'wrap-right',
      }));
    }
    if (data.imageUrl && data.imageUrl.trim() !== '') {
      return [
        {
          id: 'img-1',
          url: data.imageUrl,
          x: data.imageX ?? 90,
          y: data.imageY ?? 200,
          width: data.imageWidth ?? 150,
          height: data.imageHeight,
          hasOutline: data.imageHasOutline ?? false,
          outlineWidth: data.imageOutlineWidth ?? 0,
          outlineColor: data.imageOutlineColor ?? '#FFFFFF',
          borderRadius: data.imageBorderRadius ?? 8,
          rotation: data.imageRotation ?? 0,
          shadow: false,
          layout: data.imageLayout || 'wrap-right',
        },
      ];
    }
    return [];
  };

  const images = getNormalizedImages();
  const activeImage = images.find((img) => img.id === selectedImageId) || images[0] || null;

  const commitImagesUpdate = (newImages: NotesImageItem[]) => {
    const primary = newImages[0];
    onChange({
      ...data,
      images: newImages,
      imageUrl: primary?.url || '',
      imageX: primary?.x,
      imageY: primary?.y,
      imageWidth: primary?.width,
      imageHeight: primary?.height,
      imageHasOutline: primary?.hasOutline,
      imageOutlineWidth: primary?.outlineWidth,
      imageOutlineColor: primary?.outlineColor,
      imageBorderRadius: primary?.borderRadius,
      imageRotation: primary?.rotation,
      imageLayout: primary?.layout ?? data.imageLayout,
    });
  };

  const processAndAddImage = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const instantUrl = createSafeObjectURL(file);
      const currentList = getNormalizedImages();
      const newImage: NotesImageItem = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        url: instantUrl,
        x: Math.round((380 - 150) / 2),
        y: Math.min(180 + currentList.length * 24, 380),
        width: 150,
        height: undefined,
        hasOutline: false,
        outlineWidth: 0,
        outlineColor: '#FFFFFF',
        borderRadius: 8,
        rotation: 0,
        shadow: false,
        layout: data.imageLayout || 'wrap-right',
      };
      const updated = [...currentList, newImage];
      commitImagesUpdate(updated);
      setSelectedImageId(newImage.id);

      // In background, compress and persist durable Data URL
      compressAndReadAsDataURL(file, { maxSizeMB: 0.25, maxWidthOrHeight: 1200 })
        .then((dataUrl) => {
          if (dataUrl) {
            const fresh = getNormalizedImages().map((img) =>
              img.id === newImage.id ? { ...img, url: dataUrl } : img
            );
            commitImagesUpdate(fresh);
            revokeSafeObjectURL(instantUrl);
          }
        })
        .catch((e) => console.warn('Background compression fallback:', e));
    } catch (err) {
      console.error('Failed to add image:', err);
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAndAddImage(file);
    e.target.value = '';
  };

  const handleReplaceImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeImage) return;
    try {
      const instantUrl = createSafeObjectURL(file);
      const oldUrl = activeImage.url;
      if (isBlobUrl(oldUrl)) {
        revokeSafeObjectURL(oldUrl);
      }
      updateActiveImage({ url: instantUrl });

      // In background, compress and update durable Data URL
      compressAndReadAsDataURL(file, { maxSizeMB: 0.25, maxWidthOrHeight: 1200 })
        .then((dataUrl) => {
          if (dataUrl) {
            updateActiveImage({ url: dataUrl });
            revokeSafeObjectURL(instantUrl);
          }
        })
        .catch((e) => console.warn('Background compression error:', e));
    } catch (err) {
      console.error('Failed to replace image:', err);
    }
    e.target.value = '';
  };

  const updateActiveImage = (patch: Partial<NotesImageItem>) => {
    if (!activeImage) return;
    const updated = images.map((img) => (img.id === activeImage.id ? { ...img, ...patch } : img));
    commitImagesUpdate(updated);
  };

  const handleDeleteActiveImage = () => {
    if (!activeImage) return;
    if (isBlobUrl(activeImage.url)) {
      revokeSafeObjectURL(activeImage.url);
    }
    const updated = images.filter((img) => img.id !== activeImage.id);
    commitImagesUpdate(updated);
    setSelectedImageId(updated[0]?.id || null);
  };

  const handleFormatText = (prefix: string, suffix: string, defaultPlaceholder: string) => {
    const textarea = textareaRef.current;
    const currentText = data.bodyText || '';
    if (!textarea) {
      updateField('bodyText', currentText ? `${currentText} ${prefix}${defaultPlaceholder}${suffix}` : `${prefix}${defaultPlaceholder}${suffix}`);
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;

    if (start !== end) {
      const selected = currentText.substring(start, end);
      const newText = currentText.substring(0, start) + prefix + selected + suffix + currentText.substring(end);
      updateField('bodyText', newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    } else {
      const newText = currentText.substring(0, start) + prefix + defaultPlaceholder + suffix + currentText.substring(end);
      updateField('bodyText', newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + defaultPlaceholder.length);
      }, 0);
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Quick AU Character Presets */}
      <CharacterSelector
        characters={characters || []}
        activeCharacterId={activeCharacterId}
        onSelect={onSelectCharacter}
        onSaveCurrent={onSaveCharacter}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      {/* 1. Main Note Content */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            <span>{language === 'id' ? 'Isi Teks Catatan (Note Text)' : 'Note Body Text'}</span>
          </h3>

          {/* Text Formatting Toolbar: Bold & Italic */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => handleFormatText('**', '**', 'teks tebal')}
              className="px-2 py-1 rounded text-xs font-bold text-slate-700 hover:bg-white hover:text-purple-700 hover:shadow-xs transition-all flex items-center space-x-1 cursor-pointer"
              title={language === 'id' ? 'Tebal (**teks**)' : 'Bold (**text**)'}
            >
              <Bold className="w-3.5 h-3.5" />
              <span className="text-[11px]">Bold</span>
            </button>
            <button
              type="button"
              onClick={() => handleFormatText('*', '*', 'teks miring')}
              className="px-2 py-1 rounded text-xs font-medium italic text-slate-700 hover:bg-white hover:text-purple-700 hover:shadow-xs transition-all flex items-center space-x-1 cursor-pointer"
              title={language === 'id' ? 'Miring (*teks*)' : 'Italic (*text*)'}
            >
              <Italic className="w-3.5 h-3.5" />
              <span className="text-[11px]">Italic</span>
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-700 font-semibold block mb-1 flex items-center justify-between">
            <span>{language === 'id' ? 'Tuliskan Pesan / Teks Catatan' : 'Write Note Content'}</span>
            <span className="text-[10px] text-slate-400 font-normal">
              Gunakan **tebal** atau *miring*
            </span>
          </label>
          <textarea
            ref={textareaRef}
            rows={6}
            value={data.bodyText || ''}
            onChange={(e) => updateField('bodyText', e.target.value)}
            placeholder="Type your note text here..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white resize-y font-normal leading-relaxed"
          />
        </div>
      </div>

      {/* 2. Photo / Image Handling & Customization Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
            <span>{language === 'id' ? 'Foto & Gambar di Catatan' : 'Note Photo & Image Customization'}</span>
          </h3>

          {images.length > 0 && (
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              {images.length} {language === 'id' ? 'Foto' : 'Image(s)'}
            </span>
          )}
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onClick={(e) => {
            (e.target as HTMLInputElement).value = '';
          }}
          onChange={handleImageFileSelect}
        />
        <input
          ref={replaceFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onClick={(e) => {
            (e.target as HTMLInputElement).value = '';
          }}
          onChange={handleReplaceImageSelect}
        />

        {/* Image Upload Dropzone */}
        {images.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingFile(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processAndAddImage(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDraggingFile
                ? 'border-purple-500 bg-purple-50 scale-[1.01]'
                : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'
            }`}
          >
            <div className="w-11 h-11 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              {language === 'id' ? 'Klik atau Tarik Foto / Gambar ke Sini' : 'Click or Drag & Drop Image Here'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {language === 'id'
                ? 'Mendukung JPG, PNG, GIF, WebP. Bisa digeser bebas (drag & drop), diatur besar-kecil, & diberi outline.'
                : 'Supports JPG, PNG, WebP. Freely draggable, resizable with custom outline.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Multiple Images Selector Strip + Add Another Button */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImageId(img.id)}
                  className={`relative shrink-0 w-12 h-12 rounded-lg border-2 overflow-hidden transition-all cursor-pointer ${
                    activeImage?.id === img.id
                      ? 'border-purple-600 ring-2 ring-purple-400/40 scale-105 shadow-xs'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={`Note item ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0.5 right-0.5 bg-black/75 text-[9px] font-mono text-white px-1 rounded">
                    #{idx + 1}
                  </span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50 flex flex-col items-center justify-center text-slate-500 hover:text-purple-600 transition-all cursor-pointer"
                title={language === 'id' ? 'Tambah Foto Lain' : 'Add Another Image'}
              >
                <Plus className="w-4 h-4" />
                <span className="text-[9px] font-bold mt-0.5">Tambah</span>
              </button>
            </div>

            {activeImage && (
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 space-y-4">
                {/* Active Image Header & Action Buttons */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    <span className="text-xs font-black text-slate-800">
                      {language === 'id' ? 'Pengaturan Foto Aktif' : 'Active Image Settings'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Crop Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!activeImage) return;
                        const newSessionId = 'notes_crop_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
                        activeCropSessionRef.current = { id: newSessionId, targetImageId: activeImage.id };
                        setCropperSession({ id: newSessionId, src: activeImage.url });
                      }}
                      className="px-2 py-1 rounded-md text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs flex items-center space-x-1 transition-all cursor-pointer"
                      title={language === 'id' ? 'Pangkas / Sesuaikan Foto' : 'Crop Image'}
                    >
                      <Crop className="w-3 h-3 text-purple-600" />
                      <span>Crop</span>
                    </button>

                    {/* Replace Button */}
                    <button
                      type="button"
                      onClick={() => replaceFileInputRef.current?.click()}
                      className="px-2 py-1 rounded-md text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs flex items-center space-x-1 transition-all cursor-pointer"
                      title={language === 'id' ? 'Ganti Foto' : 'Replace Image'}
                    >
                      <Upload className="w-3 h-3 text-blue-600" />
                      <span>{language === 'id' ? 'Ganti' : 'Replace'}</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={handleDeleteActiveImage}
                      className="px-2 py-1 rounded-md text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 shadow-xs flex items-center space-x-1 transition-all cursor-pointer"
                      title={language === 'id' ? 'Hapus Foto Ini' : 'Delete Image'}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{language === 'id' ? 'Hapus' : 'Delete'}</span>
                    </button>
                  </div>
                </div>

                {/* 2a. Jarak Spacing Foto ke Teks (Image & Text Spacing) */}
                <div className="space-y-3 bg-purple-50/60 border border-purple-200/90 rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-800 font-bold flex items-center space-x-1.5">
                      <Layout className="w-3.5 h-3.5 text-purple-600" />
                      <span>{language === 'id' ? 'Jarak Spasi Foto & Teks (Spacing)' : 'Spacing between Image & Text'}</span>
                    </label>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {language === 'id' ? 'Auto-Wrap Aktif' : 'Auto-Wrap Active'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {language === 'id'
                      ? 'Foto dapat digeser bebas ke mana saja di pratinjau tanpa batas area. Teks secara otomatis menyingkir dan menyesuaikan ruang di sekitar foto sesuai jarak spasi di bawah ini.'
                      : 'Drag the photo anywhere freely without boundary limits. Text automatically parts and flows around the photo respecting the spacing below.'}
                  </p>

                  {/* Jarak / Spacing Antara Foto & Teks */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-slate-800 font-bold flex items-center space-x-1">
                        <span>{language === 'id' ? 'Spacing between Image & Text' : 'Spacing between Image & Text'}</span>
                      </label>
                      <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                        {data.imageSpacing ?? 14}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      step={2}
                      value={data.imageSpacing ?? 14}
                      onChange={(e) => updateField('imageSpacing', parseInt(e.target.value, 10))}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>0px (Menempel)</span>
                      <span>14px (Standar)</span>
                      <span>24px (Leluasa)</span>
                      <span>40px (Maksimal)</span>
                    </div>
                  </div>
                </div>

                {/* 2b. Resize (Besar / Kecil) Free Transform Controls */}
                <div className="space-y-3">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 flex items-start space-x-2 text-[11px] text-purple-950 leading-relaxed">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">
                        {language === 'id' ? 'Interaktif Gaya Canva:' : 'Canva-Style Free Transform:'}
                      </span>{' '}
                      {language === 'id'
                        ? 'Tarik tepi samping untuk memanjangkan ke kanan/kiri, tarik tepi bawah/atas untuk memanjangkan ke bawah/atas, atau tarik bulatan sudut di pratinjau untuk resize bebas.'
                        : 'Drag the side edge handles to stretch horizontally, top/bottom handles to stretch vertically, or corner dots to resize freely.'}
                    </div>
                  </div>

                  {/* Lebar Foto (Width) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-slate-800 font-bold flex items-center space-x-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>{language === 'id' ? 'Lebar Foto (Width)' : 'Image Width'}</span>
                      </label>
                      <span className="text-xs font-mono font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                        {activeImage.width}px ({Math.round((activeImage.width / 380) * 100)}%)
                      </span>
                    </div>

                    <input
                      type="range"
                      min={40}
                      max={380}
                      step={5}
                      value={activeImage.width}
                      onChange={(e) => updateActiveImage({ width: parseInt(e.target.value, 10) })}
                      className="w-full accent-purple-600 cursor-pointer"
                    />

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Kecil', width: 110 },
                        { label: 'Sedang', width: 150 },
                        { label: 'Besar', width: 200 },
                        { label: 'Penuh (Max)', width: 324 },
                      ].map((p) => (
                        <button
                          key={p.width}
                          type="button"
                          onClick={() => updateActiveImage({ width: p.width })}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                            activeImage.width === p.width
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {p.label} ({p.width}px)
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tinggi Foto (Height) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-slate-800 font-bold flex items-center space-x-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>{language === 'id' ? 'Tinggi Foto (Height)' : 'Image Height'}</span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                          {activeImage.height ? `${activeImage.height}px` : 'Auto'}
                        </span>
                        {activeImage.height !== undefined && (
                          <button
                            type="button"
                            onClick={() => updateActiveImage({ height: undefined })}
                            className="text-[10px] text-purple-600 hover:underline font-bold"
                          >
                            Reset Auto
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      type="range"
                      min={40}
                      max={500}
                      step={5}
                      value={activeImage.height || Math.round(activeImage.width * 0.75)}
                      onChange={(e) => updateActiveImage({ height: parseInt(e.target.value, 10) })}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 2c. Drag & Position Helper & Coordinates */}
                <div className="space-y-2 pt-2 border-t border-slate-200/80">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-800 font-bold flex items-center space-x-1.5">
                      <Move className="w-3.5 h-3.5 text-purple-600" />
                      <span>{language === 'id' ? 'Atur Posisi (Drag & Drop Bebas)' : 'Free Position (Drag & Drop)'}</span>
                    </label>
                    <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      X: {activeImage.x}px | Y: {activeImage.y}px
                    </span>
                  </div>

                  {/* Drag and Drop Friendly Guidance */}
                  <div className="bg-purple-50/80 border border-purple-200 rounded-lg p-2.5 flex items-start space-x-2 text-[11px] text-purple-900 leading-relaxed">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <span>
                      {language === 'id'
                        ? 'Geser foto langsung di layar pratinjau catatan tanpa batasan area (bebas hingga ke sudut atau tepi luar kotak). Teks di sekitarnya akan otomatis menyingkir rapi secara real-time.'
                        : 'Drag the photo directly on the preview canvas without boundary limits (freely to corners or outer edges). Text automatically wraps and avoids the photo in real-time.'}
                    </span>
                  </div>

                  {/* Quick Alignment Preset Buttons */}
                  <div className="grid grid-cols-5 gap-1 pt-1">
                    {[
                      { label: 'Kiri Atas', x: 0, y: 0 },
                      { label: 'Kanan Atas', x: Math.max(0, 380 - activeImage.width), y: 0 },
                      { label: 'Tengah Atas', x: Math.max(0, Math.round((380 - activeImage.width) / 2)), y: 0 },
                      { label: 'Tengah', x: Math.max(0, Math.round((380 - activeImage.width) / 2)), y: 140 },
                      { label: 'Kanan Bawah', x: Math.max(0, 380 - activeImage.width), y: 280 },
                    ].map((align) => (
                      <button
                        key={align.label}
                        type="button"
                        onClick={() => updateActiveImage({ x: align.x, y: align.y })}
                        className="py-1 px-1 bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50 text-slate-700 hover:text-purple-900 rounded text-[10px] font-bold text-center transition-all cursor-pointer"
                      >
                        {align.label}
                      </button>
                    ))}
                  </div>

                  {/* Manual Coordinate Sliders */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5 text-slate-600">
                        <span>Posisi X</span>
                        <span className="font-mono font-bold">{activeImage.x}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={380}
                        value={activeImage.x}
                        onChange={(e) => updateActiveImage({ x: parseInt(e.target.value, 10) })}
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5 text-slate-600">
                        <span>Posisi Y</span>
                        <span className="font-mono font-bold">{activeImage.y}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={800}
                        value={activeImage.y}
                        onChange={(e) => updateActiveImage({ y: parseInt(e.target.value, 10) })}
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* 2c. Outline / Border Customization (Toggle, Ketebalan, Warna) */}
                <div className="space-y-3 pt-2 border-t border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-800 font-bold flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeImage.hasOutline !== false}
                        onChange={(e) => updateActiveImage({ hasOutline: e.target.checked })}
                        className="w-4 h-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
                      />
                      <span>{language === 'id' ? 'Aktifkan Outline (Garis Tepi Foto)' : 'Enable Image Outline (Border)'}</span>
                    </label>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeImage.hasOutline !== false
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {activeImage.hasOutline !== false ? 'AKTIF' : 'OFF'}
                    </span>
                  </div>

                  {activeImage.hasOutline !== false && (
                    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3">
                      {/* Outline Thickness Slider */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs text-slate-700 font-semibold">
                            {language === 'id' ? 'Ketebalan Garis Tepi (Outline Width)' : 'Outline Thickness'}
                          </label>
                          <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {activeImage.outlineWidth || 4}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={20}
                          value={activeImage.outlineWidth || 4}
                          onChange={(e) => updateActiveImage({ outlineWidth: parseInt(e.target.value, 10) })}
                          className="w-full accent-purple-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                          <span>1px (Tipis)</span>
                          <span>4px (Standar)</span>
                          <span>10px (Tebal)</span>
                          <span>20px (Polaroid)</span>
                        </div>
                      </div>

                      {/* Outline Color Picker & Swatches */}
                      <div>
                        <label className="text-xs text-slate-700 font-semibold block mb-1">
                          {language === 'id' ? 'Warna Garis Tepi (Outline Color)' : 'Outline Color'}
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={toHexForPicker(activeImage.outlineColor || '#FFFFFF')}
                            onChange={(e) => updateActiveImage({ outlineColor: e.target.value })}
                            className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={activeImage.outlineColor || '#FFFFFF'}
                            onChange={(e) => updateActiveImage({ outlineColor: e.target.value })}
                            placeholder="#FFFFFF"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                          />
                        </div>

                        {/* Quick Swatches */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {OUTLINE_COLOR_SWATCHES.map((swatch) => (
                            <button
                              key={swatch.color}
                              type="button"
                              onClick={() => updateActiveImage({ outlineColor: swatch.color })}
                              title={swatch.label}
                              className={`w-6 h-6 rounded-md border transition-all cursor-pointer ${
                                (activeImage.outlineColor || '#FFFFFF').toUpperCase() === swatch.color.toUpperCase()
                                  ? 'ring-2 ring-purple-500 scale-110 border-transparent shadow-xs'
                                  : 'border-slate-300 hover:scale-105'
                              }`}
                              style={{ backgroundColor: swatch.color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2d. Corner Radius (Bentuk Sudut) & Rotation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                  {/* Corner Radius */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-slate-700 font-semibold">
                        {language === 'id' ? 'Kelengkungan Sudut' : 'Corner Radius'}
                      </label>
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {activeImage.borderRadius ?? 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={activeImage.borderRadius ?? 0}
                      onChange={(e) => updateActiveImage({ borderRadius: parseInt(e.target.value, 10) })}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                    <div className="flex space-x-1 mt-1">
                      {[
                        { label: 'Kotak (0)', rad: 0 },
                        { label: 'Rounded (12)', rad: 12 },
                        { label: 'Super (24)', rad: 24 },
                      ].map((r) => (
                        <button
                          key={r.rad}
                          type="button"
                          onClick={() => updateActiveImage({ borderRadius: r.rad })}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                            (activeImage.borderRadius ?? 0) === r.rad
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rotation */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-slate-700 font-semibold">
                        {language === 'id' ? 'Kemiringan (Rotasi)' : 'Rotation'}
                      </label>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {activeImage.rotation || 0}°
                        </span>
                        {activeImage.rotation !== 0 && (
                          <button
                            type="button"
                            onClick={() => updateActiveImage({ rotation: 0 })}
                            className="text-[10px] text-purple-600 hover:underline font-bold"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={-45}
                      max={45}
                      value={activeImage.rotation || 0}
                      onChange={(e) => updateActiveImage({ rotation: parseInt(e.target.value, 10) })}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>-45°</span>
                      <span>0° (Tegak)</span>
                      <span>+45°</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Independent Typography & Text Alignment */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Type className="w-3.5 h-3.5 text-purple-600" />
          <span>{language === 'id' ? 'Tipografi & Perataan Teks' : 'Font & Typography Settings'}</span>
        </h3>

        {/* Font Style */}
        <div>
          <label className="text-xs text-slate-700 font-semibold block mb-1">
            {language === 'id' ? 'Font Style' : 'Font Style'}
          </label>
          <select
            value={data.fontStyle || 'montserrat'}
            onChange={(e) => updateField('fontStyle', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer font-medium"
          >
            {NOTES_FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size & Line Height */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-700 font-semibold">
                {language === 'id' ? 'Font Size' : 'Font Size'}
              </label>
              <span className="text-xs font-bold text-purple-700">{data.fontSize || 16}px</span>
            </div>
            <input
              type="range"
              min={11}
              max={36}
              value={data.fontSize || 16}
              onChange={(e) => updateField('fontSize', parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-700 font-semibold">
                {language === 'id' ? 'Line Height' : 'Line Height'}
              </label>
              <span className="text-xs font-bold text-purple-700">{data.lineHeight || 1.65}</span>
            </div>
            <input
              type="range"
              min={1.1}
              max={2.6}
              step={0.05}
              value={data.lineHeight || 1.65}
              onChange={(e) => updateField('lineHeight', parseFloat(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Text Alignment */}
        <div className="pt-2 border-t border-slate-100">
          <label className="text-xs text-slate-700 font-semibold block mb-1">
            {language === 'id' ? 'Perataan Teks (Alignment)' : 'Text Alignment'}
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => updateField('textAlign', 'left')}
              className={`py-1.5 flex items-center justify-center space-x-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                (data.textAlign || 'left') === 'left'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Left</span>
            </button>
            <button
              type="button"
              onClick={() => updateField('textAlign', 'center')}
              className={`py-1.5 flex items-center justify-center space-x-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                data.textAlign === 'center'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
              <span>Center</span>
            </button>
            <button
              type="button"
              onClick={() => updateField('textAlign', 'right')}
              className={`py-1.5 flex items-center justify-center space-x-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                data.textAlign === 'right'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <AlignRight className="w-3.5 h-3.5" />
              <span>Right</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Full Color Customization */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Palette className="w-3.5 h-3.5 text-purple-600" />
          <span>{language === 'id' ? 'Kustomisasi Warna Tanpa Batas' : 'Full Color Customization'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Background Color */}
          <div className="space-y-2">
            <label className="text-xs text-slate-700 font-semibold block">
              {language === 'id' ? 'Warna Latar Belakang (Background)' : 'Background Color'}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={toHexForPicker(data.customBgColor || '#FFFFFF')}
                onChange={(e) => updateField('customBgColor', e.target.value)}
                className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={data.customBgColor || '#FFFFFF'}
                onChange={(e) => updateField('customBgColor', e.target.value)}
                placeholder="#FFFFFF"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
              />
            </div>

            {/* Quick Palette Swatches */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {POPULAR_BG_SWATCHES.map((swatch) => (
                <button
                  key={swatch.color}
                  type="button"
                  onClick={() => updateField('customBgColor', swatch.color)}
                  title={swatch.label}
                  className={`w-6 h-6 rounded-md border transition-all cursor-pointer ${
                    (data.customBgColor || '#FFFFFF').toUpperCase() === swatch.color.toUpperCase()
                      ? 'ring-2 ring-purple-500 scale-110 border-transparent shadow-xs'
                      : 'border-slate-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch.color }}
                />
              ))}
            </div>
          </div>

          {/* Text Color */}
          <div className="space-y-2">
            <label className="text-xs text-slate-700 font-semibold block">
              {language === 'id' ? 'Warna Teks (Text Color)' : 'Text Color'}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={toHexForPicker(data.customTextColor || '#18181B')}
                onChange={(e) => updateField('customTextColor', e.target.value)}
                className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={data.customTextColor || '#18181B'}
                onChange={(e) => updateField('customTextColor', e.target.value)}
                placeholder="#18181B"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
              />
            </div>

            {/* Quick Text Swatches */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {POPULAR_TEXT_SWATCHES.map((swatch) => (
                <button
                  key={swatch.color}
                  type="button"
                  onClick={() => updateField('customTextColor', swatch.color)}
                  title={swatch.label}
                  className={`w-6 h-6 rounded-md border transition-all cursor-pointer ${
                    (data.customTextColor || '#18181B').toUpperCase() === swatch.color.toUpperCase()
                      ? 'ring-2 ring-purple-500 scale-110 border-transparent shadow-xs'
                      : 'border-slate-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch.color }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Canvas Aspect Ratio */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Layout className="w-3.5 h-3.5 text-purple-600" />
          <span>{language === 'id' ? 'Rasio Kanvas Ekspor' : 'Canvas Aspect Ratio'}</span>
        </h3>

        <div className="grid grid-cols-4 gap-2">
          {[
            { id: '9:16', label: '9:16 (Story)' },
            { id: '4:5', label: '4:5 (Post)' },
            { id: '1:1', label: '1:1 (Square)' },
            { id: 'auto', label: 'Compact / Auto' },
          ].map((ratio) => (
            <button
              key={ratio.id}
              type="button"
              onClick={() => updateField('aspectRatio', ratio.id as any)}
              className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                (data.aspectRatio || '4:5') === ratio.id
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {ratio.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image Cropper Modal */}
      {cropperSession && (
        <ImageCropperModal
          isOpen={!!cropperSession}
          imageSrc={cropperSession.src}
          sessionId={cropperSession.id}
          onClose={() => {
            activeCropSessionRef.current = null;
            setCropperSession(null);
          }}
          onCropComplete={(croppedDataUrl, sessionId) => {
            const session = activeCropSessionRef.current;
            if (!session || (sessionId && session.id !== sessionId)) return;
            const targetId = session.targetImageId;
            activeCropSessionRef.current = null;
            setCropperSession(null);

            const updated = images.map((img) => {
              if (img.id === targetId) {
                if (isBlobUrl(img.url)) {
                  revokeSafeObjectURL(img.url);
                }
                return { ...img, url: croppedDataUrl };
              }
              return img;
            });
            commitImagesUpdate(updated);
          }}
          cropShape="rect"
          allow916={true}
        />
      )}
    </div>
  );
};
