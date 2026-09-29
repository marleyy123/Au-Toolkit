import { auth } from '../firebase';

export interface CustomLineSticker {
  id: string;
  name: string;
  url: string;
  category?: string;
  dateAdded?: number;
}

export const DEFAULT_GDRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1fDEyhTTsz7LV6x6EgZbQqNWePAz6sRkw?usp=drive_link';
export const DEFAULT_GDRIVE_FOLDER_ID = '1fDEyhTTsz7LV6x6EgZbQqNWePAz6sRkw';

/**
 * Initial transparent PNG stickers converted directly from the user's Google Drive folder.
 * (Zero dummy/sample stickers).
 */
export const INITIAL_GDRIVE_STICKERS: CustomLineSticker[] = [
  {
    id: 'stk-1AcRxKonToi6zVwcnrd3VcGwKvmxS2KLK',
    name: 'Stiker 1',
    url: 'https://lh3.googleusercontent.com/d/1AcRxKonToi6zVwcnrd3VcGwKvmxS2KLK',
    dateAdded: 1,
  },
  {
    id: 'stk-1AcePJLi98Vbv0HY39m-cmM3SZ1ay0KAi',
    name: 'Stiker 2',
    url: 'https://lh3.googleusercontent.com/d/1AcePJLi98Vbv0HY39m-cmM3SZ1ay0KAi',
    dateAdded: 2,
  },
  {
    id: 'stk-1WkdmyCOaN0GVqKdOdKKsin6JLUwFoe7p',
    name: 'Stiker 3',
    url: 'https://lh3.googleusercontent.com/d/1WkdmyCOaN0GVqKdOdKKsin6JLUwFoe7p',
    dateAdded: 3,
  },
  {
    id: 'stk-1EAPyMA18hgpH0JHZUawGkG3wdlULaVuv',
    name: 'Stiker 4',
    url: 'https://lh3.googleusercontent.com/d/1EAPyMA18hgpH0JHZUawGkG3wdlULaVuv',
    dateAdded: 4,
  },
  {
    id: 'stk-1RhGk_y4DTsDzGu45CUPZlwt6YMNWexec',
    name: 'Stiker 5',
    url: 'https://lh3.googleusercontent.com/d/1RhGk_y4DTsDzGu45CUPZlwt6YMNWexec',
    dateAdded: 5,
  },
  {
    id: 'stk-1h0U9JOGygncy3pou0aOC8kW0qaPu9-Gu',
    name: 'Stiker 6',
    url: 'https://lh3.googleusercontent.com/d/1h0U9JOGygncy3pou0aOC8kW0qaPu9-Gu',
    dateAdded: 6,
  },
  {
    id: 'stk-13tUe_iC9TpbIACL8JdDnjreurfWURGXE',
    name: 'Stiker 7',
    url: 'https://lh3.googleusercontent.com/d/13tUe_iC9TpbIACL8JdDnjreurfWURGXE',
    dateAdded: 7,
  },
];

/**
 * Extracts a Google Drive Folder ID from various URL formats.
 */
export function extractGoogleDriveFolderId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // 1. Match /folders/FOLDER_ID
  const matchFolders = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (matchFolders && matchFolders[1]) return matchFolders[1];

  // 2. Match ?id=FOLDER_ID or &id=FOLDER_ID (where url contains folder or open)
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1] && (trimmed.includes('folder') || trimmed.includes('open'))) {
    return matchId[1];
  }

  // 3. Match /drive/u/0/folders/FOLDER_ID
  const matchUFolders = trimmed.match(/\/drive\/u\/\d+\/folders\/([a-zA-Z0-9_-]+)/);
  if (matchUFolders && matchUFolders[1]) return matchUFolders[1];

  // 4. Raw folder ID if 25+ alphanumeric characters without dots or slashes
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes('.')) {
    return trimmed;
  }

  return null;
}

/**
 * Converts a Google Drive file link, sharing link, or file ID into a direct
 * embeddable image URL (lh3.googleusercontent.com).
 * Passes through normal image URLs (PNG, WebP, SVG, JPG, etc.) and data URLs.
 */
export function parseGoogleDriveOrImageUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // If it's a folder URL, return as is or handle separately
  if (trimmed.includes('/folders/')) {
    return trimmed;
  }

  // 1. Google Drive /file/d/FILE_ID/view...
  const gDriveFileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gDriveFileMatch && gDriveFileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${gDriveFileMatch[1]}`;
  }

  // 2. Google Drive ?id=FILE_ID or &id=FILE_ID
  const gDriveIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (gDriveIdMatch && gDriveIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${gDriveIdMatch[1]}`;
  }

  // 3. googleusercontent.com/d/FILE_ID
  const gDriveLh3Match = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (gDriveLh3Match && gDriveLh3Match[1]) {
    return `https://lh3.googleusercontent.com/d/${gDriveLh3Match[1]}`;
  }

  // 4. Google Drive uc?export=download&id=FILE_ID or similar
  const gDriveUcMatch = trimmed.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (gDriveUcMatch && gDriveUcMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${gDriveUcMatch[1]}`;
  }

  // 5. Bare Google Drive alphanumeric ID (25+ characters)
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes('.')) {
    return `https://lh3.googleusercontent.com/d/${trimmed}`;
  }

  return trimmed;
}

/**
 * Fetches all image files from a public Google Drive folder and converts them
 * into transparent sticker items.
 */
export async function fetchGoogleDriveFolderStickers(
  folderUrlOrId: string
): Promise<CustomLineSticker[]> {
  const folderId = extractGoogleDriveFolderId(folderUrlOrId) || folderUrlOrId.trim();
  if (!folderId) return [];

  try {
    const headers: Record<string, string> = {};
    const idToken = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }
    const res = await fetch(`/api/gdrive-folder?folderId=${encodeURIComponent(folderId)}`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.stickers && Array.isArray(data.stickers) && data.stickers.length > 0) {
        return data.stickers;
      }
    }
  } catch (err) {
    console.warn('API fetch for GDrive folder failed, using fallback:', err);
  }

  // Fallback for default folder if network/offline
  if (folderId === DEFAULT_GDRIVE_FOLDER_ID) {
    return INITIAL_GDRIVE_STICKERS;
  }

  return [];
}

/**
 * Parses batch input of image/Google Drive URLs.
 * Supports:
 * - One URL per line
 * - "Sticker Name | https://drive.google.com/..."
 * - "Sticker Name: https://..."
 * - Multiple space-separated or comma-separated URLs
 */
export function parseBatchStickerUrls(inputText: string): CustomLineSticker[] {
  if (!inputText || typeof inputText !== 'string') return [];
  const lines = inputText.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
  const results: CustomLineSticker[] = [];

  lines.forEach((line, idx) => {
    let name = `Sticker ${results.length + 1}`;
    let rawUrl = line;

    // Check for "Name | URL"
    if (line.includes('|')) {
      const parts = line.split('|');
      if (parts.length >= 2) {
        name = parts[0].trim() || name;
        rawUrl = parts.slice(1).join('|').trim();
      }
    }
    // Check for "Name: URL"
    else if (line.includes(': http') || line.includes(': https')) {
      const colonIdx = line.indexOf(': http');
      name = line.substring(0, colonIdx).trim() || name;
      rawUrl = line.substring(colonIdx + 2).trim();
    }
    // Check for "Name - URL"
    else if (line.includes(' - ') && !line.startsWith('http')) {
      const parts = line.split(' - ');
      if (parts.length >= 2) {
        name = parts[0].trim() || name;
        rawUrl = parts.slice(1).join(' - ').trim();
      }
    }

    // Handle space/comma-separated multiple URLs on the same line
    const urlMatches = rawUrl.match(/(https?:\/\/[^\s,]+)/g);
    if (urlMatches && urlMatches.length > 1) {
      urlMatches.forEach((u, subIdx) => {
        const parsedUrl = parseGoogleDriveOrImageUrl(u);
        if (parsedUrl) {
          results.push({
            id: `stk-${Date.now()}-${idx}-${subIdx}-${Math.random().toString(36).substring(2, 6)}`,
            name: `Sticker ${results.length + 1}`,
            url: parsedUrl,
            dateAdded: Date.now(),
          });
        }
      });
      return;
    }

    const parsedUrl = parseGoogleDriveOrImageUrl(rawUrl);
    if (parsedUrl) {
      if (
        name.startsWith('Sticker ') &&
        parsedUrl.startsWith('http') &&
        !parsedUrl.includes('googleusercontent')
      ) {
        const pathPart = parsedUrl.split('?')[0];
        const filename = pathPart.split('/').pop()?.replace(/\.[^/.]+$/, '');
        if (filename && filename.length > 1 && filename.length < 25) {
          name = decodeURIComponent(filename).replace(/[-_]/g, ' ');
        }
      }

      results.push({
        id: `stk-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        url: parsedUrl,
        dateAdded: Date.now(),
      });
    }
  });

  return results;
}
