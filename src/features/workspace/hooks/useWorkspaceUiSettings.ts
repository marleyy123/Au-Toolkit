import { useEffect, useState } from 'react';
import type { MutableRefObject } from 'react';
import {
  FONT_OPTIONS,
  getFontCssValue,
  injectGlobalCustomFonts,
  type FontOptionKey,
} from '../../../components/GlobalFontManager';
import type { UiTheme } from '../../../context/ThemeContext';

type UseWorkspaceUiSettingsArgs = {
  hasLocalUserEditsInSessionRef: MutableRefObject<boolean>;
  triggerCloudWorkspaceSyncRef: MutableRefObject<() => void>;
};

export function useWorkspaceUiSettings({
  hasLocalUserEditsInSessionRef,
  triggerCloudWorkspaceSyncRef,
}: UseWorkspaceUiSettingsArgs) {
  const [voucherCode, setVoucherCode] = useState<string>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlVoucher = urlParams.get('voucher') || urlParams.get('code');
      if (urlVoucher) return urlVoucher.trim();

      const saved = localStorage.getItem('au_voucher_code');
      if (saved) return saved.trim();

      const savedAccess = localStorage.getItem('au_access_code');
      if (savedAccess) return savedAccess.trim();
    } catch (e) {
      console.warn('Failed to initialize voucher code', e);
    }
    return 'default';
  });

  const [uiTheme, setUiTheme] = useState<UiTheme>(() => {
    try {
      const saved = localStorage.getItem('au_ui_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    return 'light';
  });

  const [globalFont, setGlobalFont] = useState<FontOptionKey>('ios');
  const [customFontName, setCustomFontName] = useState<string>('');
  const [cornerRadius, setCornerRadius] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('global_card_corner_radius');
      if (saved !== null) return parseInt(saved, 10) || 0;
    } catch (e) {}
    return 0;
  });

  const handleVoucherCodeChange = (newCode: string) => {
    setVoucherCode(newCode);
    try {
      localStorage.setItem('au_voucher_code', newCode);
    } catch (e) {
      console.warn('Failed to save voucher code to localStorage', e);
    }
  };

  const handleSetUiTheme = (newTheme: UiTheme) => {
    setUiTheme(newTheme);
    try {
      localStorage.setItem('au_ui_theme', newTheme);
    } catch (e) {}
    hasLocalUserEditsInSessionRef.current = true;
    setTimeout(() => triggerCloudWorkspaceSyncRef.current?.(), 100);
  };

  const handleToggleTheme = () => {
    hasLocalUserEditsInSessionRef.current = true;
    setUiTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('au_ui_theme', next);
      } catch (e) {}
      setTimeout(() => triggerCloudWorkspaceSyncRef.current?.(), 100);
      return next;
    });
  };

  const handleFontChange = (newFont: FontOptionKey) => {
    setGlobalFont(newFont);
    try {
      localStorage.setItem('global_app_font', newFont);
    } catch (e) {}
    triggerCloudWorkspaceSyncRef.current?.();
  };

  const handleCustomFontUploaded = (fileName: string) => {
    setCustomFontName(fileName);
    try {
      localStorage.setItem('global_custom_font_name', fileName);
    } catch (e) {}
    triggerCloudWorkspaceSyncRef.current?.();
  };

  const handleCornerRadiusChange = (newRadius: number) => {
    setCornerRadius(newRadius);
    try {
      localStorage.setItem('global_card_corner_radius', String(newRadius));
    } catch (e) {}
    triggerCloudWorkspaceSyncRef.current?.();
  };

  useEffect(() => {
    if (uiTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [uiTheme]);

  useEffect(() => {
    try {
      const savedFont = localStorage.getItem('global_app_font');
      if (savedFont && FONT_OPTIONS.some((font) => font.key === savedFont)) {
        setGlobalFont(savedFont as FontOptionKey);
      }
      const savedCustomFontName = localStorage.getItem('global_custom_font_name');
      if (savedCustomFontName) {
        setCustomFontName(savedCustomFontName);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    injectGlobalCustomFonts();
  }, []);

  const currentFontCss = getFontCssValue(globalFont);

  useEffect(() => {
    document.documentElement.style.setProperty('--selected-global-font', currentFontCss);
  }, [currentFontCss]);

  useEffect(() => {
    document.documentElement.style.setProperty('--preview-corner-radius', `${cornerRadius}px`);
  }, [cornerRadius]);

  return {
    voucherCode,
    handleVoucherCodeChange,
    uiTheme,
    setUiTheme,
    handleSetUiTheme,
    handleToggleTheme,
    globalFont,
    setGlobalFont,
    customFontName,
    setCustomFontName,
    cornerRadius,
    setCornerRadius,
    handleFontChange,
    handleCustomFontUploaded,
    handleCornerRadiusChange,
    currentFontCss,
  };
}
