import React, { useRef } from 'react';
import { Type, Upload, Trash2, Sliders } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface FontSelectorProps {
  fontStyle?: string;
  fontWeight?: string;
  customFontName?: string;
  customFontUrl?: string;
  onFontChange: (updates: {
    fontStyle?: string;
    fontWeight?: string;
    customFontName?: string;
    customFontUrl?: string;
  }) => void;
  label?: string;
  compact?: boolean;
}

export const BUILT_IN_FONTS = [
  { id: 'default', label: 'SF Pro / System Default', css: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  { id: 'montserrat', label: 'Montserrat', css: '"Montserrat", sans-serif' },
  { id: 'inter', label: 'Inter', css: '"Inter", sans-serif' },
  { id: 'poppins', label: 'Poppins', css: '"Poppins", sans-serif' },
  { id: 'jakarta', label: 'Plus Jakarta Sans', css: '"Plus Jakarta Sans", sans-serif' },
  { id: 'playfair', label: 'Playfair Display (Serif)', css: '"Playfair Display", Georgia, serif' },
  { id: 'cinzel', label: 'Cinzel (Decorative Serif)', css: '"Cinzel", serif' },
  { id: 'caveat', label: 'Caveat (Aesthetic Handwriting)', css: '"Caveat", cursive, sans-serif' },
  { id: 'oswald', label: 'Oswald (Bold Condensed)', css: '"Oswald", sans-serif' },
  { id: 'serif', label: 'Georgia (Classic Serif)', css: 'Georgia, serif' },
  { id: 'courier', label: 'Courier Prime (Typewriter)', css: '"Courier Prime", "Courier New", monospace' },
  { id: 'comic', label: 'Comic Neue (Casual)', css: '"Comic Neue", cursive, sans-serif' },
];

export const FONT_WEIGHTS = [
  { id: 'normal', label: 'Normal (400)', value: 400 },
  { id: 'medium', label: 'Medium (500)', value: 500 },
  { id: 'semibold', label: 'Semi Bold (600)', value: 600 },
  { id: 'bold', label: 'Bold (700)', value: 700 },
  { id: 'extrabold', label: 'Extra Bold (800)', value: 800 },
];

export function getFontFamilyCss(fontStyle?: string, customFontName?: string, customFontUrl?: string): string {
  // If explicitly selected custom font or fontStyle equals customFontName
  if ((fontStyle === 'custom' || (customFontName && fontStyle === customFontName)) && customFontName) {
    return `"${customFontName}", sans-serif`;
  }

  if (fontStyle) {
    const raw = fontStyle.trim();
    const lower = raw.toLowerCase();

    // Check exact id match in built-ins
    const exact = BUILT_IN_FONTS.find((f) => f.id.toLowerCase() === lower);
    if (exact) return exact.css;

    // Check aliases and partial names
    if (lower === 'caveat' || lower === 'script' || lower === 'handwriting' || lower.includes('caveat')) {
      return '"Caveat", cursive, sans-serif';
    }
    if (lower === 'cinzel' || lower.includes('cinzel')) {
      return '"Cinzel", serif';
    }
    if (lower === 'playfair' || lower.includes('playfair')) {
      return '"Playfair Display", Georgia, serif';
    }
    if (lower === 'montserrat' || lower.includes('montserrat')) {
      return '"Montserrat", sans-serif';
    }
    if (lower === 'inter' || lower.includes('inter')) {
      return '"Inter", sans-serif';
    }
    if (lower === 'poppins' || lower.includes('poppins')) {
      return '"Poppins", sans-serif';
    }
    if (lower === 'jakarta' || lower.includes('jakarta')) {
      return '"Plus Jakarta Sans", sans-serif';
    }
    if (lower === 'oswald' || lower === 'heavy' || lower.includes('oswald')) {
      return '"Oswald", sans-serif';
    }
    if (lower === 'courier' || lower === 'typewriter' || lower === 'monospace' || lower.includes('courier')) {
      return '"Courier Prime", "Courier New", monospace';
    }
    if (lower === 'comic' || lower === 'casual' || lower.includes('comic')) {
      return '"Comic Neue", cursive, sans-serif';
    }
    if (lower === 'serif' || lower === 'georgia') {
      return 'Georgia, serif';
    }
    if (lower === 'default' || lower === 'sans') {
      return '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif';
    }

    // Direct font family fallback
    return `"${raw}", sans-serif`;
  }

  // Fallback to custom font if available and fontStyle is not set
  if (customFontUrl && customFontName) {
    return `"${customFontName}", sans-serif`;
  }

  return '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif';
}

export function getFontWeightNumber(fontWeight?: string): number {
  switch (fontWeight) {
    case 'normal':
    case '400':
      return 400;
    case 'medium':
    case '500':
      return 500;
    case 'semibold':
    case '600':
      return 600;
    case 'bold':
    case '700':
      return 700;
    case 'extrabold':
    case '800':
      return 800;
    default:
      return 600;
  }
}

export const FontSelectorDropdown: React.FC<FontSelectorProps> = ({
  fontStyle = 'default',
  fontWeight = 'semibold',
  customFontName = '',
  customFontUrl = '',
  onFontChange,
  label,
  compact = false,
}) => {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__upload_custom__') {
      fileInputRef.current?.click();
      return;
    }

    if (value === '__custom_active__') {
      onFontChange({ fontStyle: 'custom' });
      return;
    }

    onFontChange({
      fontStyle: value,
      // Keep custom font in memory, but set fontStyle to selected
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onFontChange({
          customFontName: cleanName,
          customFontUrl: dataUrl,
          fontStyle: 'custom',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomFont = () => {
    onFontChange({
      customFontName: '',
      customFontUrl: '',
      fontStyle: 'default',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Determine current select value
  const selectValue = customFontUrl && (fontStyle === 'custom' || fontStyle === customFontName)
    ? '__custom_active__'
    : fontStyle || 'default';

  return (
    <div className={`space-y-2.5 ${compact ? 'text-xs' : ''}`}>
      {/* Hidden file input for font upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Font Family Dropdown */}
        <div>
          <label className="text-xs text-slate-700 font-semibold flex items-center justify-between mb-1">
            <span className="flex items-center space-x-1">
              <Type className="w-3.5 h-3.5 text-purple-600" />
              <span>{label || (language === 'id' ? 'Jenis Huruf (Font)' : 'Font Family')}</span>
            </span>
          </label>

          <select
            value={selectValue}
            onChange={handleSelectChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white cursor-pointer shadow-2xs"
          >
            {customFontName && customFontUrl && (
              <optgroup label={language === 'id' ? 'Font Kustom Diunggah' : 'Custom Uploaded Font'}>
                <option value="__custom_active__">
                  ✦ {customFontName} (Custom)
                </option>
              </optgroup>
            )}

            <optgroup label={language === 'id' ? 'Pilihan Font Standar' : 'Standard Font Styles'}>
              {BUILT_IN_FONTS.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </optgroup>

            <optgroup label={language === 'id' ? 'Kustomisasi Font' : 'Custom Font Upload'}>
              <option value="__upload_custom__" className="text-purple-600 font-bold">
                📁 {language === 'id' ? '+ Unggah Font Kustom (.ttf, .otf, .woff)...' : '+ Upload Custom Font (.ttf, .otf, .woff)...'}
              </option>
            </optgroup>
          </select>
        </div>

        {/* Font Weight Dropdown */}
        <div>
          <label className="text-xs text-slate-700 font-semibold flex items-center space-x-1 mb-1">
            <Sliders className="w-3.5 h-3.5 text-purple-600" />
            <span>{language === 'id' ? 'Ketebalan Font' : 'Font Weight'}</span>
          </label>

          <select
            value={fontWeight || 'semibold'}
            onChange={(e) => onFontChange({ fontWeight: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white cursor-pointer shadow-2xs"
          >
            {FONT_WEIGHTS.map((fw) => (
              <option key={fw.id} value={fw.id}>
                {fw.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Custom Font Badge with Clear button */}
      {customFontName && customFontUrl && (
        <div className="flex items-center justify-between bg-purple-50 border border-purple-200 text-purple-800 rounded-lg px-2.5 py-1 text-xs">
          <div className="flex items-center space-x-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
            <span className="font-semibold truncate">
              {language === 'id' ? 'Font Aktif:' : 'Active Font:'} {customFontName}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemoveCustomFont}
            className="text-purple-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer shrink-0"
            title={language === 'id' ? 'Hapus font kustom' : 'Remove custom font'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
