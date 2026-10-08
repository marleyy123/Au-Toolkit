import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, getUserDocumentId, isFirestoreQuotaExhausted } from '../firebase';

export type DeviceSlot = 'mobile' | 'desktop';

export interface DeviceInfo {
  deviceId: string;
  deviceModel: string;
  deviceSlot: DeviceSlot;
  deviceLabel: string;
  userAgent: string;
  registeredAt: string;
  lastLoginAt: string;
  lastActive?: string;
}

export interface DeviceRegistryDoc {
  email: string;
  mobile?: DeviceInfo | null;
  desktop?: DeviceInfo | null;
  updatedAt: string;
}

/**
 * Detect whether current client is a mobile (handphone) or desktop (laptop/PC).
 */
export function detectDeviceSlot(): DeviceSlot {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'desktop';
  }

  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isSmallScreen = window.innerWidth <= 768;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isMobileUA || (hasTouch && isSmallScreen)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Generates an initial device fingerprint. Browser/environment changes can alter it;
 * existing persisted IDs must not be replaced by a newly computed fingerprint.
 * Combines screen resolution, color depth, OS platform, CPU concurrency, timezone, touch, and DPR.
 */
export function getPhysicalHardwareHash(slot: DeviceSlot): string {
  if (typeof window === 'undefined') return 'server';
  try {
    const screenInfo = `${window.screen?.width || 0}x${window.screen?.height || 0}x${window.screen?.colorDepth || 24}`;
    const nav = typeof navigator !== 'undefined' ? navigator : ({} as any);
    const platform = nav.platform || '';
    const cores = nav.hardwareConcurrency || 4;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const touch = nav.maxTouchPoints > 0 ? 'touch' : 'notouch';
    const dpr = Math.round((window.devicePixelRatio || 1) * 10) / 10;
    const raw = `${slot}_${platform}_${screenInfo}_${cores}_${tz}_${touch}_${dpr}`;

    let h = 0x811c9dc5;
    for (let i = 0; i < raw.length; i++) {
      h ^= raw.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  } catch {
    return 'hw_default';
  }
}

/**
 * Parses and returns a reliable, neutral device model label.
 * Strictly adheres to specifications:
 * - Never invents commercial brand models (e.g. Samsung A34, Lenovo, etc.)
 * - Uses reliable detection only:
 *   - "Samsung Android Device"
 *   - "Android Device"
 *   - "Windows Laptop"
 *   - "Mac Desktop"
 *   - "iPhone (iOS)" / "iPad (iOS)"
 *   - "Linux Desktop"
 */
export function getStableDeviceModel(slot?: DeviceSlot): string {
  const currentSlot = slot || detectDeviceSlot();

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const savedModel = localStorage.getItem('au_device_model');
      if (savedModel && savedModel.trim() !== '') {
        return savedModel.trim();
      }
    } catch {}
  }

  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return currentSlot === 'mobile' ? 'Android Device' : 'Windows Laptop';
  }

  const ua = navigator.userAgent || '';
  let detectedModel = '';

  if (currentSlot === 'mobile') {
    if (/iPhone/i.test(ua)) {
      detectedModel = 'iPhone (iOS)';
    } else if (/iPad/i.test(ua)) {
      detectedModel = 'iPad (iOS)';
    } else if (/Android/i.test(ua)) {
      if (/Samsung|SM-[A-Z0-9]/i.test(ua)) {
        detectedModel = 'Samsung Android Device';
      } else {
        detectedModel = 'Android Device';
      }
    } else {
      detectedModel = 'Mobile Device';
    }
  } else {
    // Desktop / Laptop detection
    if (/Windows/i.test(ua)) {
      detectedModel = 'Windows Laptop';
    } else if (/Macintosh|Mac OS/i.test(ua)) {
      detectedModel = 'Mac Desktop';
    } else if (/Linux/i.test(ua)) {
      detectedModel = 'Linux Desktop';
    } else {
      detectedModel = 'Windows Laptop';
    }
  }

  // Fallback check
  if (!detectedModel) {
    detectedModel = currentSlot === 'mobile' ? 'Android Device' : 'Windows Laptop';
  }

  // Save detected stable model in localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('au_device_model', detectedModel);
    } catch {}
  }

  return detectedModel;
}

/**
 * Human-friendly device label for UI display.
 */
export function getDeviceFriendlyLabel(slot: DeviceSlot): string {
  return getStableDeviceModel(slot);
}

let inMemoryDeviceId: string | null = null;

/**
 * Extracts the stable hardware signature from any device ID string.
 * Strips out browser-specific random suffixes, UUIDs, and legacy label separators.
 *
 * Supported formats:
 * - Clean stable format: "dev_desktop_hw_a5d42bc6" -> "dev_desktop_hw_a5d42bc6"
 * - Legacy format with browser suffix: "dev_desktop_hw_a5d42bc6_0103852bb389" -> "dev_desktop_hw_a5d42bc6"
 * - Legacy format with label: "dev_desktop_hw_a5d42bc6_0103852bb389 || Windows Laptop" -> "dev_desktop_hw_a5d42bc6"
 * - Mobile format: "dev_mobile_hw_7b31ef82_xxxxxxxxxxxx" -> "dev_mobile_hw_7b31ef82"
 */
export function extractStableDeviceSignature(rawId: string | null | undefined): string {
  if (!rawId) return '';
  let id = String(rawId).trim().toLowerCase();
  if (id.includes('||')) {
    id = id.split('||')[0].trim();
  }

  // Look for hardware hash pattern: hw_<hex>
  const hwMatch = id.match(/hw_([a-f0-9]{6,16})/);
  if (hwMatch) {
    const isMobile = id.includes('mobile') || id.includes('handphone');
    const slot: DeviceSlot = isMobile ? 'mobile' : 'desktop';
    return `dev_${slot}_hw_${hwMatch[1]}`;
  }

  return id;
}

/**
 * Extracts just the raw hardware hash (e.g. 'a5d42bc6') from any device ID string.
 */
export function extractHardwareHash(rawId: string | null | undefined): string {
  if (!rawId) return '';
  const match = String(rawId).toLowerCase().match(/hw_([a-f0-9]{6,16})/);
  return match ? match[1] : '';
}

/**
 * Get or generate persistent unique device ID.
 * Reuses the saved identity for this browser and device slot. Different browsers
 * and private windows may have separate storage and require an admin device reset.
 *
 * Does NOT generate or append random browser/installation suffixes.
 * Automatically migrates any legacy device IDs found in localStorage.
 */
export function getOrCreateDeviceId(targetSlot?: DeviceSlot): string {
  if (typeof window === 'undefined') {
    return 'temp_device_node';
  }

  const slot = targetSlot || detectDeviceSlot();
  const normalizeSavedId = (value: string | null | undefined): string => {
    const id = extractStableDeviceSignature(value);
    return id.startsWith(`dev_${slot}_`) && id.length >= 12 ? id : '';
  };

  // 1. Check in-memory variable (prevents any regeneration within same window lifecycle)
  let stableId = normalizeSavedId(inMemoryDeviceId);

  // 2. Check window global cache
  stableId ||= normalizeSavedId((window as any).__au_persistent_device_id);

  // 3. Read and normalize persistent localStorage
  try {
    if (window.localStorage) {
      stableId ||= normalizeSavedId(localStorage.getItem(`au_device_id_${slot}`));
      stableId ||= normalizeSavedId(localStorage.getItem('au_device_id'));
    }
  } catch {}

  stableId ||= `dev_${slot}_hw_${getPhysicalHardwareHash(slot)}`;
  try {
    localStorage.setItem(`au_device_id_${slot}`, stableId);
    localStorage.setItem('au_device_id', stableId);
  } catch {}

  inMemoryDeviceId = stableId;
  try {
    (window as any).__au_persistent_device_id = stableId;
  } catch {}

  return stableId;
}

/**
 * Validates if current device matches registered device identity.
 * Evaluates exact match, physical hardware signature match,
 * and stable hardware hash comparison (for cross-browser compatibility).
 *
 * If the stable hardware signature matches (e.g. 'a5d42bc6'), it treats it as
 * the SAME registered device even if a legacy stored ID contains a trailing
 * browser-specific suffix.
 */
export function isSamePhysicalDevice(currentDeviceId: string, currentLabel: string, registeredDevice: string | null | undefined): boolean {
  if (!registeredDevice || !currentDeviceId) return false;
  const parts = registeredDevice.split('||');
  const storedId = parts[0].trim().toLowerCase();
  const storedLabel = parts.length > 1 ? parts.slice(1).join('||').trim().toLowerCase() : '';

  const c = currentDeviceId.trim().toLowerCase();
  const reg = registeredDevice.trim().toLowerCase();
  const lbl = (currentLabel || '').trim().toLowerCase();

  // 1. Exact match with stored ID or full registered string
  if (c === storedId || c === reg) return true;

  // 2. Stable hardware signature match (e.g. dev_desktop_hw_a5d42bc6)
  const stableCurrent = extractStableDeviceSignature(c);
  const stableStored = extractStableDeviceSignature(storedId) || extractStableDeviceSignature(reg);
  if (stableCurrent && stableStored && stableCurrent === stableStored) {
    return true;
  }

  // 3. Hardware hash match (same physical computer in Chrome / Edge / Safari / Firefox)
  const currentHash = extractHardwareHash(c);
  const registeredHash = extractHardwareHash(storedId) || extractHardwareHash(reg);
  if (currentHash && registeredHash && currentHash === registeredHash) {
    return true;
  }

  // 4. Substring containment on technical IDs
  if (storedId.length >= 12 && c.length >= 12) {
    if (c.includes(storedId) || storedId.includes(c)) return true;
  }

  // 5. Label fallback ONLY if registered string was pure label (no technical ID)
  if (!storedId.startsWith('dev_') && !storedId.includes('hw_') && lbl && lbl.length > 5) {
    if (storedLabel.includes(lbl) || lbl.includes(storedLabel) || reg.includes(lbl) || lbl.includes(reg)) {
      return true;
    }
  }

  return false;
}

export interface DeviceAuthResult {
  success: boolean;
  deviceSlot: DeviceSlot;
  deviceModel: string;
  deviceLabel: string;
  isDeviceLocked?: boolean;
  errorMessage?: string;
  message?: string;
  reason?: 'DEVICE_MISMATCH' | 'ERROR';
  existingDeviceName?: string;
}

/**
 * Verify and register device for user.
 * The authoritative device validation (Column R for Mobile, Column S for Desktop)
 * is performed via the Google Apps Script Web App backend.
 * This function persists and synchronizes the authorized device in Firestore and localStorage.
 */
export async function verifyAndRegisterDevice(userOrId: string | { email?: string | null; uid?: string | null }): Promise<DeviceAuthResult> {
  const userDocId = getUserDocumentId(userOrId);
  const slot = detectDeviceSlot();
  const deviceId = getOrCreateDeviceId();
  const deviceModel = getStableDeviceModel(slot);
  const deviceLabel = deviceModel;

  const localRegKey = `au_device_registered_${userDocId}_${slot}`;
  const now = new Date().toISOString();

  try {
    localStorage.setItem(localRegKey, deviceId);
    localStorage.setItem('au_device_slot', slot);
    localStorage.setItem('au_device_label', deviceLabel);
    localStorage.setItem('au_device_model', deviceModel);
  } catch {}

  // Sync with Firestore device registry document
  try {
    if (!isFirestoreQuotaExhausted()) {
      const deviceDocRef = doc(db, 'users', userDocId, 'devices', slot);
      const newDeviceInfo: DeviceInfo = {
        deviceId,
        deviceModel,
        deviceSlot: slot,
        deviceLabel,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        registeredAt: now,
        lastLoginAt: now,
        lastActive: now,
      };
      await setDoc(deviceDocRef, newDeviceInfo, { merge: true });
    }
  } catch (e) {
    console.warn('Firestore device sync note:', e);
  }

  return {
    success: true,
    deviceSlot: slot,
    deviceModel,
    deviceLabel,
    isDeviceLocked: true,
  };
}

/**
 * Subscribe to current device slot session.
 */
export function subscribeDeviceSlotSession(
  userOrId: string | { email?: string | null; uid?: string | null },
  onReplaced: (newDeviceLabel: string) => void
): () => void {
  const userDocId = getUserDocumentId(userOrId);
  const slot = detectDeviceSlot();
  const currentDeviceId = getOrCreateDeviceId();

  if (isFirestoreQuotaExhausted()) return () => {};

  try {
    const deviceDocRef = doc(db, 'users', userDocId, 'devices', slot);
    let initialCheck = true;

    const unsubscribe = onSnapshot(
      deviceDocRef,
      (snapshot) => {
        if (initialCheck) {
          initialCheck = false;
          return;
        }
        if (snapshot.exists()) {
          const data = snapshot.data() as DeviceInfo;
          if (data && data.deviceId && !isSamePhysicalDevice(currentDeviceId, '', data.deviceId)) {
            const newLabel = data.deviceModel || data.deviceLabel || (slot === 'mobile' ? 'Handphone lain' : 'Laptop lain');
            onReplaced(newLabel);
          }
        }
      },
      (err) => {
        console.warn('Device slot listener notice:', err);
      }
    );

    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Reset registered device slot for a user (admin or user requested reset).
 */
export async function resetDeviceSlot(userOrId: string | { email?: string | null; uid?: string | null }, slot?: DeviceSlot): Promise<boolean> {
  const userDocId = getUserDocumentId(userOrId);

  try {
    if (slot) {
      const ref = doc(db, 'users', userDocId, 'devices', slot);
      await setDoc(ref, { deviceId: null, deviceModel: null, deviceLabel: null, resetAt: new Date().toISOString() }, { merge: true });
      localStorage.removeItem(`au_device_registered_${userDocId}_${slot}`);
    } else {
      const mobRef = doc(db, 'users', userDocId, 'devices', 'mobile');
      const dskRef = doc(db, 'users', userDocId, 'devices', 'desktop');
      await setDoc(mobRef, { deviceId: null, deviceModel: null, deviceLabel: null, resetAt: new Date().toISOString() }, { merge: true });
      await setDoc(dskRef, { deviceId: null, deviceModel: null, deviceLabel: null, resetAt: new Date().toISOString() }, { merge: true });
      localStorage.removeItem(`au_device_registered_${userDocId}_mobile`);
      localStorage.removeItem(`au_device_registered_${userDocId}_desktop`);
    }
    return true;
  } catch (e) {
    console.warn('Device reset notice:', e);
    return false;
  }
}
