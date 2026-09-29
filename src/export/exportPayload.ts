import type { PlatformTab } from '../types';
import { getOriginalImage } from '../utils/imageRegistry';
import {
  getLocalMediaOwnerUid,
  resolveLocalImageReference,
} from '../utils/imageManager';
import {
  detectDeviceSlot,
  getDeviceFriendlyLabel,
  getOrCreateDeviceId,
} from '../utils/deviceAuthService';

export type ExportImageFormat = 'png' | 'jpeg';

export interface ExportFontFacePayload {
  family: string;
  dataUrl: string;
}

export interface NativeExportPayload {
  version: 1;
  previewKey: PlatformTab;
  data: unknown;
  fontCss: string;
  fontFaces: ExportFontFacePayload[];
  canonicalWidth: number;
  canonicalHeight: number;
  ratio: '1:1' | '4:5' | '9:16' | 'component';
  scale: 1 | 2 | 3;
  format: ExportImageFormat;
  quality: number;
  backgroundColor: string;
  device: {
    deviceType: 'mobile' | 'desktop';
    deviceId: string;
    deviceLabel: string;
  };
}

interface PreparedNativeExportRequest {
  formData: FormData;
  payload: NativeExportPayload;
}

const LOCAL_MEDIA_PREFIX = 'au-local-media://';
const INTERNAL_MEDIA_PREFIX = 'https://au-toolkit-export.local/media/';

function ratioForDimensions(width: number, height: number): NativeExportPayload['ratio'] {
  if (width === 380 && height === 380) return '1:1';
  if (width === 380 && height === 475) return '4:5';
  if (width === 380 && height === 676) return '9:16';
  return 'component';
}

function readCustomFontFaces(fontCss: string): ExportFontFacePayload[] {
  try {
    const raw = localStorage.getItem('global_custom_fonts_list');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry) => {
        const family = String(entry?.family || '');
        return family && fontCss.includes(family) && /^data:font\//i.test(String(entry?.dataUrl || ''));
      })
      .map((entry) => ({
        family: String(entry.family),
        dataUrl: String(entry.dataUrl),
      }));
  } catch {
    return [];
  }
}

async function blobForMediaSource(source: string): Promise<Blob | null> {
  let resolvedSource = source;
  if (source.startsWith(LOCAL_MEDIA_PREFIX)) {
    resolvedSource = await resolveLocalImageReference(source, getLocalMediaOwnerUid());
  }

  const original = getOriginalImage(resolvedSource || source)?.source;
  if (typeof Blob !== 'undefined' && original instanceof Blob) return original;
  if (typeof original === 'string') resolvedSource = original;

  if (!/^(?:blob:|data:image\/)/i.test(resolvedSource)) return null;
  try {
    const response = await fetch(resolvedSource);
    if (!response.ok) return null;
    return await response.blob();
  } catch {
    return null;
  }
}

async function replaceLocalMediaDeep(
  value: unknown,
  files: Array<{ id: string; blob: Blob }>,
  seen: WeakMap<object, unknown>
): Promise<unknown> {
  if (typeof value === 'string') {
    if (!/^(?:blob:|data:image\/|au-local-media:\/\/)/i.test(value)) return value;
    const blob = await blobForMediaSource(value);
    if (!blob) throw new Error('Media lokal tidak dapat dibaca untuk export.');
    const id = `media-${files.length + 1}-${crypto.randomUUID?.() || Date.now()}`;
    files.push({ id, blob });
    return `${INTERNAL_MEDIA_PREFIX}${encodeURIComponent(id)}`;
  }

  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);

  if (Array.isArray(value)) {
    const output: unknown[] = [];
    seen.set(value, output);
    for (const item of value) output.push(await replaceLocalMediaDeep(item, files, seen));
    return output;
  }

  const output: Record<string, unknown> = {};
  seen.set(value, output);
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    output[key] = await replaceLocalMediaDeep(nested, files, seen);
  }
  return output;
}

export async function prepareNativeExportRequest(args: {
  previewKey: PlatformTab;
  data: unknown;
  fontCss: string;
  canonicalWidth: number;
  canonicalHeight: number;
  scale: number;
  format: ExportImageFormat;
  quality: number;
  backgroundColor: string;
}): Promise<PreparedNativeExportRequest> {
  const files: Array<{ id: string; blob: Blob }> = [];
  const data = await replaceLocalMediaDeep(args.data, files, new WeakMap());
  const scale = Math.min(3, Math.max(1, Math.round(args.scale))) as 1 | 2 | 3;
  const slot = detectDeviceSlot();
  const payload: NativeExportPayload = {
    version: 1,
    previewKey: args.previewKey,
    data,
    fontCss: args.fontCss,
    fontFaces: readCustomFontFaces(args.fontCss),
    canonicalWidth: args.canonicalWidth,
    canonicalHeight: args.canonicalHeight,
    ratio: ratioForDimensions(args.canonicalWidth, args.canonicalHeight),
    scale,
    format: args.format,
    quality: Math.min(1, Math.max(0.8, args.quality)),
    backgroundColor: args.backgroundColor,
    device: {
      deviceType: slot,
      deviceId: getOrCreateDeviceId(),
      deviceLabel: getDeviceFriendlyLabel(slot),
    },
  };

  const formData = new FormData();
  formData.append('payload', JSON.stringify(payload));
  for (const file of files) {
    formData.append('media', file.blob, file.id);
  }
  return { formData, payload };
}

export const INTERNAL_EXPORT_MEDIA_PREFIX = INTERNAL_MEDIA_PREFIX;
