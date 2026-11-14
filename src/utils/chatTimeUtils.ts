/**
 * Standardisasi format jam chat menjadi "HH.MM" (mengubah ":" menjadi ".").
 */
export function formatChatTime(rawTime?: string | null, fallback = '12.00'): string {
  if (!rawTime || typeof rawTime !== 'string' || rawTime.trim() === '') {
    return fallback;
  }
  return rawTime.trim().replace(/:/g, '.');
}

/**
 * Mengambil jam dari bubble chat terakhir yang valid.
 * Digunakan saat user klik tombol "Tambah Pesan" / "Add Bubble",
 * sehingga pesan baru otomatis memakai jam yang sama dengan pesan sebelumnya.
 */
export function getLastMessageTime(messages?: any[] | null, fallback = '12.00'): string {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return fallback;
  }
  // Scan dari belakang untuk mendapatkan timestamp valid paling baru
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (
      m &&
      m.type !== 'unread_divider' &&
      m.type !== 'date_divider' &&
      m.type !== 'divider' &&
      m.type !== 'system' &&
      typeof m.time === 'string' &&
      m.time.trim() !== ''
    ) {
      return formatChatTime(m.time, fallback);
    }
  }
  return fallback;
}

/**
 * Cascading Auto-Time updater ("Auto Jam"):
 * - Memperbarui jam pesan pada `targetIndex`.
 * - Otomatis menurunkan (cascade) jam baru tersebut ke semua pesan di bawahnya (idx >= targetIndex).
 * - Melewati divider tanggal atau pemberitahuan sistem.
 * - Jika `forceAll` bernilai true, akan memperbarui seluruh pesan dalam obrolan.
 */
export function cascadeMessageTime<T extends { type?: string; time?: string; [key: string]: any }>(
  messages: T[],
  targetIndex: number,
  newTime: string,
  forceAll: boolean = false
): T[] {
  if (!messages || !Array.isArray(messages) || targetIndex < 0 || targetIndex >= messages.length) {
    return messages || [];
  }
  const cleanNewTime = formatChatTime(newTime, '12.00');
  return messages.map((msg, idx) => {
    // Abaikan pembatas tanggal / divider / unread
    if (
      msg.type === 'unread_divider' ||
      msg.type === 'date_divider' ||
      msg.type === 'divider' ||
      msg.type === 'system'
    ) {
      return msg;
    }
    // Jika forceAll atau posisi pesan ada di bawah targetIndex (termasuk targetIndex)
    if (forceAll || idx >= targetIndex) {
      return { ...msg, time: cleanNewTime };
    }
    return msg;
  });
}
