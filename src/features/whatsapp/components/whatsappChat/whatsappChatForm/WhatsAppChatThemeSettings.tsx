import React, { useState, useEffect } from 'react';
import { WhatsAppChatData } from '../../../../../types';
import { toHexForPicker } from '../../../../../utils/colorUtils';
import { WHATSAPP_CHAT_PRESETS, WhatsAppPresetTheme } from '../../../../../data/whatsappPresets';
import { Trash2, Check, Palette, Bookmark, BookmarkPlus } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';
import { auth } from '../../../../../firebase';
import { readPersistentUserAssets, subscribePersistentUserAssets, updatePersistentUserAsset } from '../../../../../utils/userAssets';
import type { ChatSectionProps } from './whatsAppChatFormTypes';
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
export const WhatsAppChatThemeSettings: React.FC<ChatSectionProps> = ({ data, onChange }) => {
  const { t, isId } = useLanguage();
  const updateField = <K extends keyof WhatsAppChatData>(key: K, value: WhatsAppChatData[K]) => {
    onChange({ ...data, [key]: value });
  };
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
    } catch (e) { }

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
    } catch (err) { }
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

  return (
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
            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${isThemeCustomizationOpen
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${isSelected
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
                    className={`group inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${isSelected
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
  );
};
