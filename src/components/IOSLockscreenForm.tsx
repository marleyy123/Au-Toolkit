import React from 'react';
import { IOSLockscreenData, LockscreenAppType, CharacterPreset, LockscreenNotificationMessage } from '../types';
import { CharacterSelector, ImageUploader, SaveProfileButton } from './FormControls';
import { Smartphone, Clock, MessageSquare, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  data: IOSLockscreenData;
  onChange: (updated: IOSLockscreenData) => void;
  characters: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const IOSLockscreenForm: React.FC<Props> = ({
  data,
  onChange,
  characters,
  activeCharacterId,
  onSaveCharacter,
  onSaveProfile,
  onSelectCharacter,
  onDeleteCharacter,
  onRenameCharacter,
}) => {
  const { language, t } = useLanguage();
  const isId = language === 'id';

  const updateField = <K extends keyof IOSLockscreenData>(key: K, value: IOSLockscreenData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const notificationList = data.notificationList && data.notificationList.length > 0
    ? data.notificationList
    : [
        {
          id: '1',
          appType: 'whatsapp' as LockscreenAppType,
          senderName: data.senderName || '',
          messageText: data.messageText || '',
          timeAgo: data.timeAgo || 'now',
          avatarUrl: data.avatarUrl || '',
        },
      ];

  const handleUpdateNotificationItem = (index: number, field: keyof LockscreenNotificationMessage, val: any) => {
    const updated = [...notificationList];
    updated[index] = { ...updated[index], [field]: val };
    
    if (index === 0) {
      if (field === 'senderName') updateField('senderName', val);
      if (field === 'messageText') updateField('messageText', val);
      if (field === 'timeAgo') updateField('timeAgo', val);
      if (field === 'avatarUrl') updateField('avatarUrl', val);
      if (field === 'appType') updateField('appType', val);
    }

    updateField('notificationList', updated);
  };

  // Insert NEW notification at the TOP of stack (index 0), exactly like native iOS
  const handleAddNotification = () => {
    const newId = Date.now().toString();
    const newNotification: LockscreenNotificationMessage = {
      id: newId,
      appType: 'whatsapp',
      senderName: '',
      messageText: '',
      timeAgo: 'now',
      avatarUrl: data.avatarUrl || '',
    };
    updateField('notificationList', [newNotification, ...notificationList]);
  };

  const handleDeleteNotification = (index: number) => {
    if (notificationList.length <= 1) return;
    const updated = notificationList.filter((_, i) => i !== index);
    updateField('notificationList', updated);
  };

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-200">
      {/* Quick AU Character Presets */}
      <CharacterSelector
        characters={characters}
        activeCharacterId={activeCharacterId}
        onSelect={onSelectCharacter}
        onSaveCurrent={onSaveCharacter}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      {/* 1. LOCKSCREEN HEADER CONFIGURATION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Smartphone className="w-3.5 h-3.5 text-purple-600" />
          <span>{isId ? 'Tampilan & Waktu Layar Kunci' : 'Lockscreen Appearance & Time'}</span>
        </h3>

        {/* Theme Mode & Header Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-bold block mb-1">
              {t('theme.mode', 'Theme Mode')}
            </label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => updateField('theme', 'light')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  (data.theme || 'light') === 'light'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t('theme.light', 'Light')}
              </button>
              <button
                type="button"
                onClick={() => updateField('theme', 'dark')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  data.theme === 'dark'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t('theme.dark', 'Dark')}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-bold block mb-1">
              {isId ? 'Judul Header' : 'Header Title'}
            </label>
            <input
              type="text"
              value={data.groupHeaderTitle || (isId ? 'Pusat Pemberitahuan' : 'Notification Center')}
              onChange={(e) => updateField('groupHeaderTitle', e.target.value)}
              placeholder={isId ? 'Pusat Pemberitahuan' : 'Notification Center'}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>
        </div>

        {/* Lockscreen Time & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{isId ? 'Waktu Layar Kunci' : 'Lockscreen Time'}</span>
            </label>
            <input
              type="text"
              value={data.lockscreenTime || '09:41'}
              onChange={(e) => updateField('lockscreenTime', e.target.value)}
              placeholder="09:41"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              {isId ? 'Tanggal Layar Kunci' : 'Lockscreen Date'}
            </label>
            <input
              type="text"
              value={data.lockscreenDate || (isId ? 'Minggu, 8 Desember' : 'Sunday, December 8')}
              onChange={(e) => updateField('lockscreenDate', e.target.value)}
              placeholder={isId ? 'Minggu, 8 Desember' : 'Sunday, December 8'}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* 2. STACKED NOTIFICATIONS LIST WITH PER-ITEM APP SELECTOR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
            <span>{isId ? 'Daftar Notifikasi Bertumpuk' : 'Stacked Notifications List'}</span>
          </h3>

          <button
            type="button"
            onClick={handleAddNotification}
            className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer transition-all shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isId ? '+ Tambah Notifikasi' : 'Add Notification'}</span>
          </button>
        </div>

        <div className="space-y-4">
          {notificationList.map((item, index) => (
            <div
              key={item.id || index}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 relative"
            >
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[11px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  {isId ? `Notifikasi #${index + 1}` : `Notification #${index + 1}`} {index === 0 && (isId ? '(Terbaru)' : '(Newest)')}
                </span>

                {notificationList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteNotification(index)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                    title={isId ? 'Hapus Notifikasi' : 'Delete Notification'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Per-Notification App Selector & Profile Photo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-700 dark:text-slate-300 font-bold block mb-1">
                    {isId ? 'Aplikasi' : 'App'}
                  </label>
                  <select
                    value={item.appType || 'whatsapp'}
                    onChange={(e) => handleUpdateNotificationItem(index, 'appType', e.target.value as LockscreenAppType)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">X / Twitter</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-700 dark:text-slate-300 font-bold block mb-1">
                    {t('common.time', 'Timestamp')}
                  </label>
                  <input
                    type="text"
                    value={item.timeAgo || (isId ? 'baru saja' : '2m ago')}
                    onChange={(e) => handleUpdateNotificationItem(index, 'timeAgo', e.target.value)}
                    placeholder={isId ? 'misal: baru saja, 2m lalu' : 'e.g. now, 2m ago, 1h ago'}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>
              </div>

              {/* Contact Name & Message Content */}
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-slate-700 dark:text-slate-300 font-bold block mb-1">
                    {isId ? 'Nama Kontak / Pengirim' : 'Contact / Sender Name'}
                  </label>
                  <input
                    type="text"
                    value={item.senderName || ''}
                    onChange={(e) => handleUpdateNotificationItem(index, 'senderName', e.target.value)}
                    placeholder="Alex"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-700 dark:text-slate-300 font-bold block mb-1">
                    {isId ? 'Isi Pesan' : 'Message Content'}
                  </label>
                  <input
                    type="text"
                    value={item.messageText || ''}
                    onChange={(e) => handleUpdateNotificationItem(index, 'messageText', e.target.value)}
                    placeholder={isId ? 'Kamu lagi luang malam ini? Ketemuan yuk!' : "Are you free tonight? Let's catch up!"}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Sender Profile Photo - Shown only for WhatsApp */}
                {(item.appType || 'whatsapp') === 'whatsapp' && (
                  <ImageUploader
                    label={isId ? 'Foto Profil Pengirim' : 'Sender Profile Photo'}
                    value={item.avatarUrl || ''}
                    onChange={(url) => handleUpdateNotificationItem(index, 'avatarUrl', url)}
                    onClear={() => handleUpdateNotificationItem(index, 'avatarUrl', '')}
                    aspectRatio="1:1"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. WALLPAPER & DISPLAY RATIO */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
          <span>{isId ? 'Wallpaper & Rasio Layar' : 'Wallpaper & Aspect Ratio'}</span>
        </h3>

        {/* Enable / Disable Wallpaper Checkbox */}
        <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-slate-700 dark:text-slate-300 font-semibold text-xs">
          <input
            type="checkbox"
            checked={data.showWallpaper !== false}
            onChange={(e) => updateField('showWallpaper', e.target.checked)}
            className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
          />
          <span>{isId ? 'Gunakan Gambar Wallpaper' : 'Use Wallpaper Image'}</span>
        </label>

        {data.showWallpaper !== false && (
          <ImageUploader
            label={isId ? 'Gambar Wallpaper Kustom' : 'Custom Wallpaper Image'}
            value={data.wallpaperImage || ''}
            onChange={(url) => updateField('wallpaperImage', url)}
            onClear={() => updateField('wallpaperImage', '')}
            aspectRatio="9:16"
          />
        )}

        {/* Aspect Ratio Buttons */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
            {t('common.aspectRatio', 'Canvas Aspect Ratio')}
          </label>
          <div className="flex space-x-2">
            {(['9:16', '4:5', '1:1'] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => updateField('aspectRatio', ratio)}
                className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  (data.aspectRatio || '9:16') === ratio
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {ratio === '9:16' ? (isId ? '9:16 (Cerita/Penuh)' : '9:16 (Story/Full)') : ratio === '4:5' ? (isId ? '4:5 (Postingan)' : '4:5 (Post)') : (isId ? '1:1 (Persegi)' : '1:1 (Square)')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {onSaveProfile && (
        <div className="pt-2">
          <SaveProfileButton onSave={onSaveProfile} />
        </div>
      )}
    </div>
  );
};
