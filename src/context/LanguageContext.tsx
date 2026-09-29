import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'en' | 'id';

interface Translations {
  [key: string]: {
    en: string;
    id: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Global & Navigation
  'app.title': { en: 'AU Toolkit', id: 'AU Toolkit' },
  'app.subtitle': {
    en: 'Fake social media generator for Alternate Universe writers & storytellers',
    id: 'Generator media sosial palsu untuk penulis & pembuat konten Alternate Universe',
  },
  'theme.light': { en: 'Light', id: 'Terang' },
  'theme.dark': { en: 'Dark', id: 'Gelap' },
  'theme.lightTheme': { en: 'Light', id: 'Terang' },
  'theme.darkTheme': { en: 'Dark', id: 'Gelap' },
  'theme.mode': { en: 'Theme Mode', id: 'Mode Tema' },
  'theme.dimBlue': { en: 'Dim Blue', id: 'Biru Redup' },
  'theme.lightsOut': { en: 'Lights Out', id: 'Hitam Pekat' },
  'language.en': { en: 'English', id: 'English' },
  'language.id': { en: 'Bahasa Indonesia', id: 'Bahasa Indonesia' },
  'language.select': { en: 'Language', id: 'Bahasa' },

  // Tabs & Feature Navigation
  'tab.twitter': { en: 'Twitter / X', id: 'Twitter / X' },
  'tab.instagram': { en: 'Instagram', id: 'Instagram' },
  'tab.whatsapp': { en: 'WhatsApp', id: 'WhatsApp' },
  'tab.tiktok': { en: 'TikTok', id: 'TikTok' },
  'tab.notes': { en: 'Notes', id: 'Catatan' },
  'tab.lockscreen': { en: 'iOS Lockscreen', id: 'Layar Kunci iOS' },
  'tab.pushNotification': { en: 'Push Notification', id: 'Notifikasi Melayang' },

  // Sub-tabs
  'subtab.post': { en: 'Post / Tweet', id: 'Postingan / Tweet' },
  'subtab.dm': { en: 'Direct Message', id: 'Pesan Langsung (DM)' },
  'subtab.profile': { en: 'Profile', id: 'Profil' },
  'subtab.feed': { en: 'Feed Post', id: 'Postingan Feed' },
  'subtab.feedComments': { en: 'Feed Comments', id: 'Komentar Feed' },
  'subtab.storyReply': { en: 'Story Reply', id: 'Balasan Cerita' },
  'subtab.storyViewers': { en: 'Story Viewers', id: 'Penonton Cerita' },
  'subtab.activity': { en: 'Activity / Notif', id: 'Aktivitas / Notif' },
  'subtab.igNotes': { en: 'IG Notes', id: 'Catatan IG' },
  'subtab.live': { en: 'Live Stream', id: 'Siaran Langsung' },
  'subtab.inbox': { en: 'DM Inbox', id: 'Kotak Masuk DM' },
  'subtab.chat': { en: 'Chat', id: 'Obrolan' },
  'subtab.call': { en: 'Audio/Video Call', id: 'Panggilan Suara/Video' },
  'subtab.status': { en: 'Status Story', id: 'Status Cerita' },
  'subtab.statusViewers': { en: 'Status Viewers', id: 'Penonton Status' },
  'subtab.fyp': { en: 'FYP Feed', id: 'Beranda FYP' },
  'subtab.feedLive': { en: 'Live Stream', id: 'Siaran Langsung' },

  // Export & Live Preview
  'export.options': { en: 'Export Options', id: 'Opsi Ekspor' },
  'export.downloadPng': { en: 'Download PNG', id: 'Unduh PNG' },
  'export.downloadJpg': { en: 'Download JPG', id: 'Unduh JPG' },
  'export.downloadZip': { en: 'Download as .zip file', id: 'Download as .zip file' },
  'export.preparingZip': { en: 'Preparing ZIP...', id: 'Menyiapkan ZIP...' },
  'export.savedZip': { en: 'Saved ZIP!', id: 'ZIP Tersimpan!' },
  'export.savedPng': { en: 'Saved PNG!', id: 'PNG Tersimpan!' },
  'export.savedJpg': { en: 'Saved JPG!', id: 'JPG Tersimpan!' },
  'export.copyImage': { en: 'Copy Image', id: 'Salin Gambar' },
  'export.copied': { en: 'Copied!', id: 'Tersalin!' },
  'export.generating': { en: 'Generating...', id: 'Memproses...' },
  'export.scale': { en: 'Resolution', id: 'Resolusi' },
  'export.zoom': { en: 'Zoom View', id: 'Perbesaran' },
  'export.roundedCorners': { en: 'Device Mockup Corners', id: 'Sudut Lengkung Mockup' },
  'export.highQuality': { en: 'High Quality PNG', id: 'PNG Kualitas Tinggi' },
  
  // Common & Buttons
  'common.save': { en: 'Save Profile & Settings', id: 'Simpan Profil & Pengaturan' },
  'common.saveFolder': { en: 'Save This Folder', id: 'Simpan Folder Ini' },
  'common.senderType': { en: 'Sender Type', id: 'Tipe Pengirim' },
  'common.incoming': { en: 'Incoming', id: 'Pesan Masuk' },
  'common.outgoing': { en: 'Outgoing', id: 'Pesan Keluar' },
  'common.message': { en: 'Message', id: 'Pesan' },
  'common.messages': { en: 'Messages', id: 'Pesan' },
  'common.time': { en: 'Time', id: 'Waktu' },
  'common.date': { en: 'Date', id: 'Tanggal' },
  'common.preview': { en: 'Live Preview', id: 'Pratinjau Langsung' },
  'common.formInput': { en: 'Form Input', id: 'Form Input' },
  'common.customizationPanel': { en: 'Customization Panel', id: 'Panel Kustomisasi' },
  'common.customizationSubtitle': { en: 'Edit character details, content & metrics in real-time', id: 'Edit detail karakter, konten & metrik secara real-time' },
  'common.resetAll': { en: 'Hard Reset Total', id: 'Reset Total Semua Data' },
  'common.resetConfirm': { en: 'Are you sure you want to hard reset all data?', id: 'Apakah Anda yakin ingin mereset total seluruh data dan cache?' },
  'common.addMessage': { en: '+ Add Message', id: '+ Tambah Pesan' },
  'common.addComment': { en: '+ Add Comment', id: '+ Tambah Komentar' },
  'common.username': { en: 'Username', id: 'Nama Pengguna' },
  'common.name': { en: 'Display Name', id: 'Nama Tampilan' },
  'common.avatar': { en: 'Profile Avatar', id: 'Foto Profil' },
  'common.verifiedBadge': { en: 'Verified Badge', id: 'Lencana Verifikasi' },
  'common.none': { en: 'None', id: 'Tidak Ada' },
  'common.blue': { en: 'Blue', id: 'Biru' },
  'common.gold': { en: 'Gold', id: 'Emas' },
  'common.activeNow': { en: 'Active Now Indicator', id: 'Indikator Aktif Sekarang' },
  'common.mediaImage': { en: 'Media / Photo', id: 'Foto / Media' },
  'common.uploadPhoto': { en: 'Upload Photo', id: 'Unggah Foto' },
  'common.uploadMedia': { en: 'Upload Media', id: 'Unggah Media' },
  'common.addMedia': { en: 'Add Media', id: 'Tambah Media' },
  'common.remove': { en: 'Remove', id: 'Hapus' },
  'common.settings': { en: 'Settings', id: 'Pengaturan' },
  'common.enableCustomTheme': { en: 'Enable Custom Theme Mode (Master Switch)', id: 'Aktifkan Mode Tema Kustom (Sakelar Utama)' },
  'common.themePresets': { en: 'Theme Presets', id: 'Preset Tema' },
  'common.themePresetsAndColors': { en: 'Chat Theme Presets & Color Customization', id: 'Preset Tema Obrolan & Kustomisasi Warna' },
  'common.fineTuneColors': { en: 'Fine-tune individual visual color elements', id: 'Sesuaikan elemen warna visual secara individual' },
  'common.delete': { en: 'Delete', id: 'Hapus' },
  'common.cancel': { en: 'Batal', id: 'Batal' },
  'common.export': { en: 'Export PNG', id: 'Ekspor PNG' },
  'common.copy': { en: 'Copy Image', id: 'Salin Gambar' },
  'common.characterPresets': { en: 'Character Presets', id: 'Preset Karakter' },
  'common.addCharacter': { en: '+ Add Character', id: '+ Tambah Karakter' },
  'common.aspectRatio': { en: 'Aspect Ratio', id: 'Rasio Aspek' },
  'common.containerAspectRatio': { en: 'Container Aspect Ratio', id: 'Rasio Aspek Wadah' },
  'story.aspectRatio': { en: 'Container Aspect Ratio', id: 'Rasio Aspek Wadah' },
  'common.square': { en: 'Square (1:1)', id: 'Persegi (1:1)' },
  'common.portrait': { en: 'Portrait (4:5)', id: 'Potret (4:5)' },
  'common.story': { en: 'Story/Reels (9:16)', id: 'Cerita/Reels (9:16)' },
  'common.you': { en: 'YOU (LEFT)', id: 'KAMU (KIRI)' },
  'common.me': { en: 'ME (RIGHT)', id: 'AKU (KANAN)' },
  'common.youShort': { en: 'You', id: 'Kamu' },
  'common.meShort': { en: 'Me', id: 'Aku' },
  'common.left': { en: 'Left', id: 'Kiri' },
  'common.right': { en: 'Right', id: 'Kanan' },
  'common.fontFamily': { en: 'Font Family', id: 'Jenis Huruf' },
  'common.fontSize': { en: 'Font Size', id: 'Ukuran Huruf' },
  'common.fontWeight': { en: 'Font Weight', id: 'Ketebalan Huruf' },
  'common.lineHeight': { en: 'Line Height', id: 'Jarak Baris' },
  'common.align': { en: 'Alignment', id: 'Perataan' },
  'common.color': { en: 'Color', id: 'Warna' },
  'common.backgroundColor': { en: 'Background Color', id: 'Warna Latar' },
  'common.textColor': { en: 'Text Color', id: 'Warna Teks' },
  'common.viewers': { en: 'Viewers', id: 'Penonton' },
  'common.addViewer': { en: '+ Add Viewer', id: '+ Tambah Penonton' },
  'common.callDuration': { en: 'Call Duration', id: 'Durasi Panggilan' },
  'common.callStatus': { en: 'Call Status', id: 'Status Panggilan' },
  'common.endCall': { en: 'End Call', id: 'Akhiri Panggilan' },
  
  // Story Viewers
  'storyViewers.title': { en: 'Story Viewers', id: 'Penonton Cerita' },
  'storyViewers.viewers': { en: 'Viewers', id: 'Penonton' },
  'storyViewers.slideCount': { en: 'Active Slide', id: 'Slide Aktif' },
  
  // Story Reply
  'storyReply.placeholder': { en: 'Your text goes here...', id: 'Teks Anda di sini...' },
  'storyReply.sendMessage': { en: 'Send message...', id: 'Kirim pesan...' },
  'storyReply.quickReactions': { en: 'Quick Reactions', id: 'Reaksi Cepat' },
  
  // Instagram Activity / Notifications
  'activity.notifications': { en: 'Notifications', id: 'Notifikasi' },
  'activity.followRequests': { en: 'Follow requests', id: 'Permintaan mengikuti' },
  'activity.followRequestsSubtext': { en: 'Approve or ignore requests', id: 'Setujui atau abaikan permintaan' },
  'activity.startedFollowing': { en: 'started following you.', id: 'mulai mengikuti Anda.' },
  'activity.requestedFollow': { en: 'requested to follow you.', id: 'meminta untuk mengikuti Anda.' },
  'activity.likedPhoto': { en: 'liked your photo.', id: 'menyukai foto Anda.' },
  'activity.commentedPost': { en: 'commented on your post:', id: 'mengomentari postingan Anda:' },
  'activity.mentionedPhoto': { en: 'mentioned you in a photo:', id: 'menyebut Anda dalam foto:' },
  'activity.defaultComment': { en: 'Awesome post! 🔥', id: 'Postingan keren! 🔥' },
  'activity.defaultMention': { en: '@you check this out!', id: '@kamu lihat ini!' },
  'activity.confirm': { en: 'Confirm', id: 'Konfirmasi' },
  'activity.delete': { en: 'Delete', id: 'Hapus' },
  'activity.follow': { en: 'Follow', id: 'Ikuti' },
  'activity.following': { en: 'Following', id: 'Mengikuti' },
  'activity.followBack': { en: 'Follow back', id: 'Ikuti balik' },
  'activity.section.new': { en: 'New', id: 'Baru' },
  'activity.section.today': { en: 'Today', id: 'Hari ini' },
  'activity.section.thisWeek': { en: 'This week', id: 'Minggu ini' },
  'activity.section.thisMonth': { en: 'This month', id: 'Bulan ini' },
  'activity.section.earlier': { en: 'Earlier', id: 'Sebelumnya' },

  // Instagram Feed
  'feed.likedBy': { en: 'Liked by', id: 'Disukai oleh' },
  'feed.and': { en: 'and', id: 'dan' },
  'feed.others': { en: 'others', id: 'lainnya' },
  'feed.viewAllComments': { en: 'View all comments', id: 'Lihat semua komentar' },
  'feed.addComment': { en: 'Add a comment...', id: 'Tambahkan komentar...' },
  'feed.justNow': { en: 'Just now', id: 'Baru saja' },
  'feed.hoursAgo': { en: 'hours ago', id: 'jam yang lalu' },
  'feed.daysAgo': { en: 'days ago', id: 'hari yang lalu' },

  // Instagram Profile
  'profile.posts': { en: 'posts', id: 'postingan' },
  'profile.followers': { en: 'followers', id: 'pengikut' },
  'profile.following': { en: 'following', id: 'mengikuti' },
  'profile.follow': { en: 'Follow', id: 'Ikuti' },
  'profile.followingBtn': { en: 'Following', id: 'Mengikuti' },
  'profile.message': { en: 'Message', id: 'Kirim Pesan' },
  'profile.editProfile': { en: 'Edit profile', id: 'Edit profil' },
  'profile.shareProfile': { en: 'Share profile', id: 'Bagikan profil' },
  'profile.contact': { en: 'Contact', id: 'Kontak' },

  // Instagram DM & Group Chat
  'dm.activeNow': { en: 'Active now', id: 'Aktif sekarang' },
  'dm.groupMembersPlaceholder': { en: 'username, username, username', id: 'username, username, username' },
  'dm.senderNamePlaceholder': { en: 'username', id: 'username' },
  'dm.messagePlaceholder': { en: 'Send a message', id: 'Kirim pesan...' },
  'dm.replyStory': { en: 'Replied to your story', id: 'Membalas cerita Anda' },
  'dm.youRepliedStory': { en: 'You replied to their story', id: 'Anda membalas cerita mereka' },
  'dm.viewProfile': { en: 'View profile', id: 'Lihat profil' },
  'dm.followers': { en: 'followers', id: 'pengikut' },
  'dm.posts': { en: 'posts', id: 'postingan' },

  // Twitter / X
  'twitter.reposts': { en: 'Reposts', id: 'Posting Ulang' },
  'twitter.quotes': { en: 'Quotes', id: 'Kutipan' },
  'twitter.likes': { en: 'Likes', id: 'Suka' },
  'twitter.bookmarks': { en: 'Bookmarks', id: 'Markah' },
  'twitter.views': { en: 'Views', id: 'Tayangan' },
  'twitter.replyingTo': { en: 'Replying to', id: 'Membalas ke' },
  'twitter.postYourReply': { en: 'Post your reply', id: 'Posting balasan Anda' },

  // TikTok Profile
  'tiktok.following': { en: 'Following', id: 'Mengikuti' },
  'tiktok.followers': { en: 'Followers', id: 'Pengikut' },
  'tiktok.likes': { en: 'Likes', id: 'Suka' },
  'tiktok.editProfile': { en: 'Edit profile', id: 'Edit profil' },
  'tiktok.shareProfile': { en: 'Share profile', id: 'Bagikan profil' },
  'tiktok.pinned': { en: 'Pinned', id: 'Disematkan' },

  // WhatsApp
  'wa.online': { en: 'online', id: 'online' },
  'wa.typing': { en: 'typing...', id: 'sedang mengetik...' },
  'wa.today': { en: 'Today', id: 'Hari ini' },
  'wa.yesterday': { en: 'Yesterday', id: 'Kemarin' },
  'wa.messagePlaceholder': { en: 'Message', id: 'Ketik pesan...' },
  'wa.unreadDivider': { en: 'Unread Message Divider', id: 'Pembatas Pesan Belum Dibaca' },
  'wa.unreadDefault': { en: '1 UNREAD MESSAGE', id: '1 PESAN BELUM DIBACA' },

  // iOS Lockscreen
  'lockscreen.notificationCenter': { en: 'Notification Center', id: 'Pusat Pemberitahuan' },
  'lockscreen.swipeUp': { en: 'Swipe up to open', id: 'Geser ke atas untuk membuka' },
  'lockscreen.pressHome': { en: 'Press Home to open', id: 'Tekan tombol Utama untuk membuka' },
};

interface LanguageContextType {
  language: AppLanguage;
  isId: boolean;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  isId: false,
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem('au_app_language');
      if (saved === 'en' || saved === 'id') return saved;
    } catch (e) {}
    return 'en';
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('au_app_language', lang);
    } catch (e) {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'id' : 'en');
  };

  const isId = language === 'id';

  const t = (key: string, fallback?: string): string => {
    if (TRANSLATIONS[key] && TRANSLATIONS[key][language]) {
      return TRANSLATIONS[key][language];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, isId, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
