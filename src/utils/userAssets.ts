export type PersistentUserAssetKind =
  | 'whatsappCustomThemes'
  | 'instagramDmCustomThemes'
  | 'lineCustomStickers';

export interface PersistentUserAssets {
  whatsappCustomThemes: any[];
  instagramDmCustomThemes: any[];
  lineCustomStickers: any[];
}

export const USER_ASSETS_SYNC_EVENT = 'au-user-assets-synced';

const EMPTY_ASSETS: PersistentUserAssets = {
  whatsappCustomThemes: [],
  instagramDmCustomThemes: [],
  lineCustomStickers: [],
};

const LEGACY_ASSETS_OWNER_KEY = 'au_persistent_user_assets_legacy_owner_uid';

const cleanIdentity = (value?: string | null): string =>
  String(value || '').trim().replace(/[^A-Za-z0-9_-]/g, '_') || 'anonymous';

export const getUserAssetsStorageKey = (uid?: string | null): string =>
  `au_persistent_user_assets_${cleanIdentity(uid)}`;

export const isStablePersistentAssetUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const url = value.trim();
  return /^https:\/\//i.test(url) && !/^(?:blob:|data:)/i.test(url);
};

export function normalizePersistentUserAssets(value: any): PersistentUserAssets {
  const whatsappCustomThemes = Array.isArray(value?.whatsappCustomThemes)
    ? value.whatsappCustomThemes.filter((item: any) => item && typeof item === 'object' && item.id)
    : [];
  const instagramDmCustomThemes = Array.isArray(value?.instagramDmCustomThemes)
    ? value.instagramDmCustomThemes.filter((item: any) => item && typeof item === 'object' && item.id)
    : [];
  const lineCustomStickers = Array.isArray(value?.lineCustomStickers)
    ? value.lineCustomStickers
        .filter((item: any) => item && item.id && isStablePersistentAssetUrl(item.url))
        .map((item: any) => ({
          id: String(item.id),
          name: String(item.name || 'Sticker'),
          url: String(item.url),
          ...(typeof item.dateAdded === 'number' ? { dateAdded: item.dateAdded } : {}),
        }))
    : [];
  return { whatsappCustomThemes, instagramDmCustomThemes, lineCustomStickers };
}

function parseArray(raw: string | null): any[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function readPersistentUserAssets(
  uid?: string | null,
  email?: string | null
): PersistentUserAssets {
  if (typeof localStorage === 'undefined') return { ...EMPTY_ASSETS };
  const stored = localStorage.getItem(getUserAssetsStorageKey(uid));
  if (stored) {
    try {
      return normalizePersistentUserAssets(JSON.parse(stored));
    } catch {}
  }

  const legacyEmail = String(email || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const cleanUid = cleanIdentity(uid);
  const claimedLegacyOwner = localStorage.getItem(LEGACY_ASSETS_OWNER_KEY);
  const canClaimUnscopedLegacyAssets = cleanUid !== 'anonymous' &&
    (!claimedLegacyOwner || claimedLegacyOwner === cleanUid);
  const migrated = normalizePersistentUserAssets({
    whatsappCustomThemes: parseArray(
      (legacyEmail && localStorage.getItem(`au_toolkit_wa_saved_custom_themes_${legacyEmail}`)) ||
      (canClaimUnscopedLegacyAssets ? localStorage.getItem('au_toolkit_wa_saved_custom_themes') : null)
    ),
    instagramDmCustomThemes: parseArray(
      legacyEmail ? localStorage.getItem(`au_toolkit_ig_saved_custom_themes_${legacyEmail}`) : null
    ),
    lineCustomStickers: parseArray(
      canClaimUnscopedLegacyAssets ? localStorage.getItem('au_line_custom_stickers') : null
    ),
  });
  if (canClaimUnscopedLegacyAssets && !claimedLegacyOwner) {
    localStorage.setItem(LEGACY_ASSETS_OWNER_KEY, cleanUid);
  }
  localStorage.setItem(getUserAssetsStorageKey(uid), JSON.stringify(migrated));
  return migrated;
}

export function persistUserAssets(
  uid: string | null | undefined,
  value: any,
  notify: boolean = true
): PersistentUserAssets {
  const normalized = normalizePersistentUserAssets(value);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(getUserAssetsStorageKey(uid), JSON.stringify(normalized));
    if (notify && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(USER_ASSETS_SYNC_EVENT, { detail: normalized }));
    }
  }
  return normalized;
}

export function updatePersistentUserAsset(
  uid: string | null | undefined,
  email: string | null | undefined,
  kind: PersistentUserAssetKind,
  value: any[]
): PersistentUserAssets {
  const current = readPersistentUserAssets(uid, email);
  return persistUserAssets(uid, { ...current, [kind]: value });
}

export function subscribePersistentUserAssets(
  callback: (assets: PersistentUserAssets) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (event: Event) => {
    callback(normalizePersistentUserAssets((event as CustomEvent).detail));
  };
  window.addEventListener(USER_ASSETS_SYNC_EVENT, listener);
  return () => window.removeEventListener(USER_ASSETS_SYNC_EVENT, listener);
}
