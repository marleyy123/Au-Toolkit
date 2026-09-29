import React, { useRef, useState, useEffect } from 'react';
import { Type, Upload, Check, RefreshCw, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type FontOptionKey = string;

export interface CustomFontItem {
  id: string;
  fileName: string;
  family: string;
  cssValue: string;
  dataUrl: string;
}

export interface FontOption {
  key: string;
  label: string;
  cssValue: string;
  category: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    key: 'ios',
    label: 'iOS Default (San Francisco)',
    cssValue: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    category: 'System',
  },
  {
    key: 'poppins',
    label: 'Poppins',
    cssValue: "'Poppins', sans-serif",
    category: 'Google Fonts',
  },
  {
    key: 'montserrat',
    label: 'Montserrat',
    cssValue: "'Montserrat', sans-serif",
    category: 'Google Fonts',
  },
  {
    key: 'inter',
    label: 'Inter',
    cssValue: "'Inter', sans-serif",
    category: 'Google Fonts',
  },
  {
    key: 'plus-jakarta',
    label: 'Plus Jakarta Sans',
    cssValue: "'Plus Jakarta Sans', sans-serif",
    category: 'Google Fonts',
  },
  {
    key: 'playfair',
    label: 'Playfair Display',
    cssValue: "'Playfair Display', serif",
    category: 'Serif / Editorial',
  },
  {
    key: 'cinzel',
    label: 'Cinzel (Classical Serif)',
    cssValue: "'Cinzel', serif",
    category: 'Serif / Editorial',
  },
  {
    key: 'caveat',
    label: 'Caveat (Handwritten)',
    cssValue: "'Caveat', cursive, sans-serif",
    category: 'Casual / Handwritten',
  },
  {
    key: 'comic',
    label: 'Comic Sans MS',
    cssValue: "'Comic Sans MS', 'Comic Neue', cursive, sans-serif",
    category: 'Casual / Handwritten',
  },
  {
    key: 'courier',
    label: 'Courier Prime (Typewriter)',
    cssValue: "'Courier Prime', monospace",
    category: 'Monospace',
  },
  {
    key: 'oswald',
    label: 'Oswald (Condensed Bold)',
    cssValue: "'Oswald', sans-serif",
    category: 'Display',
  },
];

export function injectGlobalCustomFonts(customFonts?: CustomFontItem[]) {
  if (typeof document === 'undefined') return;
  try {
    let fonts = customFonts;
    if (!fonts || fonts.length === 0) {
      const savedList = localStorage.getItem('global_custom_fonts_list');
      if (savedList) {
        fonts = JSON.parse(savedList);
      }
    }
    if (!fonts || fonts.length === 0) return;

    let styleEl = document.getElementById('global-custom-fonts-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'global-custom-fonts-style';
      document.head.appendChild(styleEl);
    }

    const cssRules = fonts
      .map(
        (f) => `
        @font-face {
          font-family: '${f.family}';
          src: url('${f.dataUrl}');
          font-display: swap;
        }
      `
      )
      .join('\n');

    styleEl.textContent = cssRules;
  } catch (e) {
    console.warn('Failed to inject global custom fonts', e);
  }
}

export function getFontCssValue(key: string, customFontsList?: CustomFontItem[]): string {
  const builtin = FONT_OPTIONS.find((f) => f.key === key);
  if (builtin) return builtin.cssValue;

  if (customFontsList && customFontsList.length > 0) {
    const found = customFontsList.find((f) => f.id === key || f.family === key);
    if (found) return found.cssValue;
    if (key === 'custom') return customFontsList[customFontsList.length - 1].cssValue;
  }

  if (typeof window !== 'undefined') {
    try {
      const savedList = localStorage.getItem('global_custom_fonts_list');
      if (savedList) {
        const list: CustomFontItem[] = JSON.parse(savedList);
        const found = list.find((f) => f.id === key || f.family === key);
        if (found) return found.cssValue;
        if (key === 'custom' && list.length > 0) return list[list.length - 1].cssValue;
      }
    } catch (e) {}
  }

  if (key === 'custom') {
    return "'UploadedCustomFont', sans-serif";
  }

  return FONT_OPTIONS[0].cssValue;
}

interface Props {
  selectedFont: string;
  onSelectFont: (fontKey: string) => void;
  customFontName?: string;
  onCustomFontUploaded?: (fileName: string) => void;
}

export const GlobalFontManager: React.FC<Props> = ({
  selectedFont,
  onSelectFont,
  customFontName,
  onCustomFontUploaded,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customFonts, setCustomFonts] = useState<CustomFontItem[]>([]);

  useEffect(() => {
    try {
      let loaded: CustomFontItem[] = [];
      const savedList = localStorage.getItem('global_custom_fonts_list');
      if (savedList) {
        loaded = JSON.parse(savedList);
      } else {
        const savedName = localStorage.getItem('global_custom_font_name');
        const savedData = localStorage.getItem('global_custom_font_data');
        if (savedName && savedData) {
          loaded = [
            {
              id: 'custom_legacy',
              fileName: savedName,
              family: 'UploadedCustomFont',
              cssValue: "'UploadedCustomFont', sans-serif",
              dataUrl: savedData,
            },
          ];
          try {
            localStorage.setItem('global_custom_fonts_list', JSON.stringify(loaded));
          } catch (e) {}
        }
      }

      setCustomFonts(loaded);
      injectFontStyles(loaded);
    } catch (e) {
      console.warn('Failed to restore custom fonts list', e);
    }
  }, []);

  const injectFontStyles = (fonts: CustomFontItem[]) => {
    if (typeof document === 'undefined') return;
    let styleEl = document.getElementById('global-custom-fonts-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'global-custom-fonts-style';
      document.head.appendChild(styleEl);
    }

    const cssRules = fonts
      .map(
        (f) => `
        @font-face {
          font-family: '${f.family}';
          src: url('${f.dataUrl}');
          font-display: swap;
        }
      `
      )
      .join('\n');

    styleEl.textContent = cssRules;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = ['.ttf', '.otf', '.woff', '.woff2'];
    const fileName = file.name;
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

    if (!validExts.includes(ext)) {
      alert('Format file font tidak didukung. Harap unggah file .ttf, .otf, .woff, atau .woff2');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      if (!base64Data) return;

      try {
        const uniqueId = `custom_${Date.now()}`;
        const fontFamilyName = `CustomFont_${Date.now()}`;
        const newFontItem: CustomFontItem = {
          id: uniqueId,
          fileName,
          family: fontFamilyName,
          cssValue: `'${fontFamilyName}', sans-serif`,
          dataUrl: base64Data,
        };

        const updatedList = [
          ...customFonts.filter((f) => f.fileName !== fileName),
          newFontItem,
        ];

        setCustomFonts(updatedList);
        injectFontStyles(updatedList);

        try {
          localStorage.setItem('global_custom_fonts_list', JSON.stringify(updatedList));
          localStorage.setItem('global_custom_font_name', fileName);
        } catch (err) {
          console.warn('LocalStorage limit reached for font data', err);
        }

        if (onCustomFontUploaded) {
          onCustomFontUploaded(fileName);
        }

        onSelectFont(uniqueId);
      } catch (err) {
        console.error('Error loading custom font:', err);
        alert('Gagal memuat file font.');
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteFont = (fontId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedList = customFonts.filter((f) => f.id !== fontId);
    setCustomFonts(updatedList);
    injectFontStyles(updatedList);

    try {
      localStorage.setItem('global_custom_fonts_list', JSON.stringify(updatedList));
    } catch (err) {}

    if (selectedFont === fontId) {
      onSelectFont('ios');
    }
  };

  const currentCss = getFontCssValue(selectedFont, customFonts);

  const activeCustomFont = customFonts.find((f) => f.id === selectedFont) ||
    (selectedFont === 'custom' && customFonts.length > 0 ? customFonts[customFonts.length - 1] : undefined);

  const { isDark } = useTheme();

  return (
    <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} border rounded-xl p-3.5 space-y-3 shadow-xs transition-colors`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-700'} flex items-center space-x-1.5`}>
          <Type className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          <span>Global Typography Manager</span>
        </h3>
        <span className={`text-[10px] font-bold ${isDark ? 'text-purple-400 bg-purple-950/60 border-purple-900/50' : 'text-purple-600 bg-purple-50 border-purple-100'} px-2 py-0.5 rounded-full border`}>
          Semua Modul (Kecuali Teks Status WA)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Font Family Dropdown */}
        <div>
          <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'} block mb-1`}>
            Font Preset
          </label>
          <select
            value={activeCustomFont ? activeCustomFont.id : selectedFont}
            onChange={(e) => onSelectFont(e.target.value)}
            className={`w-full ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'} border rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors`}
          >
            <optgroup label="Default & Google Fonts">
              {FONT_OPTIONS.map((font) => (
                <option key={font.key} value={font.key}>
                  {font.label}
                </option>
              ))}
            </optgroup>

            {customFonts.length > 0 && (
              <optgroup label="Uploaded Custom Fonts">
                {customFonts.map((font) => (
                  <option key={font.id} value={font.id}>
                    Font: {font.fileName}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Custom Font Uploader */}
        <div>
          <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'} block mb-1`}>
            Upload Custom Font (.ttf, .otf, .woff)
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".ttf,.otf,.woff,.woff2"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-full py-1.5 px-3 ${isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'} border rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors`}
          >
            <Upload className={`w-3.5 h-3.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            <span className="truncate">
              {activeCustomFont
                ? `Active: ${activeCustomFont.fileName}`
                : customFonts.length > 0
                ? `+ Upload New Font (${customFonts.length} saved)`
                : 'Upload Font File (.ttf/.otf/.woff)...'}
            </span>
          </button>
        </div>
      </div>

      {/* Saved Custom Fonts Chips */}
      {customFonts.length > 0 && (
        <div className={`${isDark ? 'bg-slate-800 border-slate-700/60' : 'bg-slate-50 border-slate-200/60'} border rounded-lg p-2 text-xs space-y-1.5`}>
          <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider block`}>
            Saved Custom Fonts ({customFonts.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {customFonts.map((font) => {
              const isActive = (activeCustomFont?.id === font.id) || selectedFont === font.id;
              return (
                <div
                  key={font.id}
                  onClick={() => onSelectFont(font.id)}
                  className={`inline-flex items-center space-x-1.5 px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer border transition-colors ${
                    isActive
                      ? 'bg-purple-600 text-white border-purple-600'
                      : isDark
                      ? 'bg-slate-900 text-slate-200 border-slate-700 hover:border-purple-400 hover:text-purple-400'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:text-purple-600'
                  }`}
                >
                  <span className="truncate max-w-[120px]">{font.fileName}</span>
                  {isActive && <Check className="w-3 h-3 text-white shrink-0" />}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteFont(font.id, e)}
                    className={`p-0.5 rounded hover:bg-red-500 hover:text-white transition-colors ${
                      isActive ? 'text-purple-200' : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400'
                    }`}
                    title="Delete font"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Font Sample Preview Bar */}
      <div className={`${isDark ? 'bg-slate-800 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'} border rounded-lg p-2.5 flex items-center justify-between`}>
        <div className="flex-1 overflow-hidden pr-2">
          <span className={`text-[10px] font-extrabold uppercase ${isDark ? 'text-slate-400' : 'text-slate-400'} block tracking-wider`}>
            Pratinjau Font Aktif
          </span>
          <p
            className={`text-xs font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'} truncate mt-0.5`}
            style={{ fontFamily: currentCss }}
          >
            The quick brown fox jumps over the lazy dog (1234567890)
          </p>
        </div>

        {selectedFont !== 'ios' && (
          <button
            type="button"
            onClick={() => onSelectFont('ios')}
            className={`text-[11px] font-bold ${isDark ? 'text-slate-400 hover:text-purple-400' : 'text-slate-500 hover:text-purple-600'} flex items-center space-x-1 cursor-pointer shrink-0`}
            title="Reset ke font iOS Default"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset iOS</span>
          </button>
        )}
      </div>
    </div>
  );
};
