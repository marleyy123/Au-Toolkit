/**
 * Ensures a color string has a leading '#' if it is a 3, 6, or 8 digit hex code,
 * so that inline CSS styles (e.g. style={{ color: 'ffffff' }}) render correctly as '#ffffff'.
 */
export const normalizeColor = (col: string | undefined): string | undefined => {
  if (!col) return undefined;
  const trimmed = col.trim();
  if (/^[0-9A-Fa-f]{3,8}$/.test(trimmed)) {
    return `#${trimmed}`;
  }
  return trimmed;
};

/**
 * Ensures a valid 7-character hex code for HTML <input type="color">,
 * which requires a valid '#RRGGBB' format.
 */
export const toHexForPicker = (val: string | undefined | null, defaultHex: string = '#ffffff'): string => {
  const safeDefault = (typeof defaultHex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(defaultHex))
    ? defaultHex
    : '#ffffff';

  if (!val || typeof val !== 'string') return safeDefault;
  let s = val.trim();
  if (!s.startsWith('#')) s = '#' + s;
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s;
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  return safeDefault;
};
