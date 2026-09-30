import React, { useState } from 'react';
import {
  InstagramDMInboxData,
  InstagramDMInboxNote,
  InstagramDMInboxConversation,
  CharacterPreset,
  VerifiedType,
} from '../../../types';
import { CharacterSelector, ImageUploader } from '../../../components/FormControls';
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  MessageCircle,
  Sparkles,
  MoveUp,
  MoveDown,
  Sun,
  Moon,
  Music,
  Camera,
  Check,
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface InstagramDMInboxFormProps {
  data: InstagramDMInboxData;
  onChange: (data: InstagramDMInboxData) => void;
  characters?: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter?: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter?: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const InstagramDMInboxForm: React.FC<InstagramDMInboxFormProps> = ({
  data,
  onChange,
  characters = [],
  activeCharacterId,
  onSaveCharacter,
  onSaveProfile,
  onSelectCharacter,
  onDeleteCharacter,
  onRenameCharacter,
}) => {
  const { language, t } = useLanguage();
  const isId = language === 'id';
  const [activeTabSection, setActiveTabSection] = useState<'general' | 'notes' | 'conversations'>('general');

  // Add Note
  const handleAddNote = () => {
    const newNote: InstagramDMInboxNote = {
      id: `note-${Date.now()}`,
      username: '',
      avatar: '',
      noteText: '',
      isYourNote: false,
      isOnline: false,
    };
    onChange({
      ...data,
      notes: [...(data.notes || []), newNote],
    });
  };

  // Update Note
  const handleUpdateNote = (id: string, updates: Partial<InstagramDMInboxNote>) => {
    onChange({
      ...data,
      notes: (data.notes || []).map((note) =>
        note.id === id ? { ...note, ...updates } : note
      ),
    });
  };

  // Delete Note
  const handleDeleteNote = (id: string) => {
    onChange({
      ...data,
      notes: (data.notes || []).filter((note) => note.id !== id),
    });
  };

  // Add Conversation
  const handleAddConversation = () => {
    const newConv: InstagramDMInboxConversation = {
      id: `conv-${Date.now()}`,
      username: '',
      avatar: '',
      lastMessageSnippet: '',
      hasUnread: false,
      showCameraIcon: false,
    };
    onChange({
      ...data,
      conversations: [...(data.conversations || []), newConv],
    });
  };

  // Update Conversation
  const handleUpdateConversation = (id: string, updates: Partial<InstagramDMInboxConversation>) => {
    onChange({
      ...data,
      conversations: (data.conversations || []).map((conv) =>
        conv.id === id ? { ...conv, ...updates } : conv
      ),
    });
  };

  // Delete Conversation
  const handleDeleteConversation = (id: string) => {
    onChange({
      ...data,
      conversations: (data.conversations || []).filter((conv) => conv.id !== id),
    });
  };

  // Reorder Conversations
  const handleMoveConversation = (index: number, direction: 'up' | 'down') => {
    const convs = [...(data.conversations || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= convs.length) return;
    const temp = convs[index];
    convs[index] = convs[targetIndex];
    convs[targetIndex] = temp;
    onChange({ ...data, conversations: convs });
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200">
      {/* Character Preset Quick Bar */}
      <CharacterSelector
        characters={characters}
        activeCharacterId={activeCharacterId}
        onSelect={onSelectCharacter}
        onSaveCurrent={onSaveCharacter}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      {/* Sub-Navigation Section Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 pb-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveTabSection('general')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
            activeTabSection === 'general'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isId ? 'Akun & Tata Letak' : 'Account & Layout'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabSection('notes')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
            activeTabSection === 'notes'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>{isId ? `Baris Catatan (${data.notes?.length || 0})` : `Notes Row (${data.notes?.length || 0})`}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabSection('conversations')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
            activeTabSection === 'conversations'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{isId ? `Pesan Masuk (${data.conversations?.length || 0})` : `Inbox Messages (${data.conversations?.length || 0})`}</span>
        </button>
      </div>

      {/* 1. GENERAL TAB */}
      {activeTabSection === 'general' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isId ? 'Nama Pengguna Akun (Header Atas)' : 'Account Username (Top Header)'}
              </label>
              <input
                type="text"
                value={data.accountUsername || ''}
                onChange={(e) => onChange({ ...data, accountUsername: e.target.value })}
                placeholder="username"
                className="w-full px-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* Requests Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isId ? 'Teks Label Permintaan' : 'Requests Label Text'}
              </label>
              <input
                type="text"
                value={data.requestsCountText || ''}
                onChange={(e) => onChange({ ...data, requestsCountText: e.target.value })}
                placeholder={isId ? 'Permintaan' : 'Requests'}
                className="w-full px-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* Search Placeholder */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isId ? 'Placeholder Kolom Pencarian' : 'Search Input Placeholder'}
              </label>
              <input
                type="text"
                value={data.searchPlaceholder || ''}
                onChange={(e) => onChange({ ...data, searchPlaceholder: e.target.value })}
                placeholder={isId ? 'Cari atau tanya Meta AI' : 'Search or ask Meta AI'}
                className="w-full px-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* User Bottom Avatar (URL or File Upload) */}
            <div>
              <ImageUploader
                label={isId ? 'Foto Profil (Bilah Navigasi Bawah)' : 'Profile Avatar (Bottom Nav Bar)'}
                value={data.userAvatar || ''}
                onChange={(url) => onChange({ ...data, userAvatar: url })}
                onClear={() => onChange({ ...data, userAvatar: '' })}
              />
            </div>
          </div>

          {/* Theme & Aspect Ratio Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isId ? 'Tema Instagram DM' : 'Instagram DM Theme'}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...data, theme: 'light' })}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    (data.theme || 'light') === 'light'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>{t('theme.light', 'Light Mode')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...data, theme: 'dark' })}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    data.theme === 'dark'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>{t('theme.dark', 'Dark Mode')}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('common.aspectRatio', 'Screen Aspect Ratio')}
              </label>
              <div className="flex items-center gap-2">
                {(['4:5', '9:16', '1:1'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => onChange({ ...data, aspectRatio: ratio })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      (data.aspectRatio || '4:5') === ratio
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. NOTES ROW MANAGER */}
      {activeTabSection === 'notes' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showNotesToggle"
                checked={data.showNotes !== false}
                onChange={(e) => onChange({ ...data, showNotes: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded-sm focus:ring-purple-500 accent-purple-600 cursor-pointer"
              />
              <label htmlFor="showNotesToggle" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                {isId ? 'Tampilkan Baris Catatan di Atas' : 'Show Notes Row at Top'}
              </label>
            </div>

            <button
              type="button"
              onClick={handleAddNote}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isId ? '+ Tambah Catatan' : 'Add Note'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {data.notes && data.notes.map((note, nIdx) => (
              <div
                key={note.id || nIdx}
                className="p-3.5 rounded-2xl border bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isId ? `Catatan #${nIdx + 1}` : `Note #${nIdx + 1}`}
                    </span>
                    <label className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!note.isYourNote}
                        onChange={(e) => handleUpdateNote(note.id, { isYourNote: e.target.checked })}
                        className="w-3.5 h-3.5 text-purple-600 rounded-sm accent-purple-600"
                      />
                      <span>{isId ? 'Catatan Kamu (Akun Utama)' : 'Your Note (Main Account)'}</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title={isId ? 'Hapus Catatan' : 'Delete Note'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Username / Subtitle */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {isId ? 'Nama Pengguna / Label' : 'Username / Label'}
                    </label>
                    <input
                      type="text"
                      value={note.username || ''}
                      onChange={(e) => handleUpdateNote(note.id, { username: e.target.value })}
                      placeholder={note.isYourNote ? (isId ? 'Catatan Anda' : 'Your note') : 'username'}
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Thought Text */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {isId ? 'Teks Balon Pikiran' : 'Thought Bubble Text'}
                    </label>
                    <input
                      type="text"
                      value={note.noteText || ''}
                      onChange={(e) => handleUpdateNote(note.id, { noteText: e.target.value })}
                      placeholder={nIdx === 0 ? (isId ? 'Halo' : 'Hello') : 'Good vibes'}
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Profile Avatar Upload */}
                  <div className="sm:col-span-2">
                    <ImageUploader
                      label={isId ? 'Foto Profil (Avatar)' : 'Profile Picture (Avatar)'}
                      value={note.avatar || ''}
                      onChange={(url) => handleUpdateNote(note.id, { avatar: url })}
                      onClear={() => handleUpdateNote(note.id, { avatar: '' })}
                    />
                  </div>

                  {/* Location Status */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {isId ? 'Status Lokasi' : 'Location Status'}
                    </label>
                    <input
                      type="text"
                      value={note.locationStatus || ''}
                      onChange={(e) => handleUpdateNote(note.id, { locationStatus: e.target.value })}
                      placeholder={isId ? 'Lokasi mati' : 'Location off'}
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Music: Song Title */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {isId ? 'Musik: Judul Lagu' : 'Music: Song Title'}
                    </label>
                    <input
                      type="text"
                      value={note.songTitle || ''}
                      onChange={(e) => handleUpdateNote(note.id, { songTitle: e.target.value })}
                      placeholder="Pelangi"
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Music: Artist Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {isId ? 'Musik: Nama Artis' : 'Music: Artist Name'}
                    </label>
                    <input
                      type="text"
                      value={note.artistName || ''}
                      onChange={(e) => handleUpdateNote(note.id, { artistName: e.target.value })}
                      placeholder="HIVI!"
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Online Status Toggle */}
                <div className="flex items-center space-x-2 pt-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!note.isOnline}
                      onChange={(e) => handleUpdateNote(note.id, { isOnline: e.target.checked })}
                      className="w-3.5 h-3.5 text-purple-600 rounded-sm accent-purple-600"
                    />
                    <span>{isId ? 'Tampilkan Titik Hijau Online' : 'Show Green Online Indicator'}</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CONVERSATIONS / MESSAGES MANAGER */}
      {activeTabSection === 'conversations' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isId ? `Riwayat Obrolan Kotak Masuk (${data.conversations?.length || 0})` : `Inbox Chat History (${data.conversations?.length || 0})`}
            </span>

            <button
              type="button"
              onClick={handleAddConversation}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isId ? '+ Tambah Baris Pesan' : 'Add Message Row'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {data.conversations && data.conversations.map((conv, cIdx) => (
              <div
                key={conv.id || cIdx}
                className="p-3.5 rounded-2xl border bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isId ? `Pesan #${cIdx + 1}` : `Message #${cIdx + 1}`}
                    </span>
                    {conv.username && (
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold truncate max-w-[140px]">
                        ({conv.username})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      disabled={cIdx === 0}
                      onClick={() => handleMoveConversation(cIdx, 'up')}
                      className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                      title={isId ? 'Pindah ke Atas' : 'Move Up'}
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={cIdx === (data.conversations?.length || 0) - 1}
                      onClick={() => handleMoveConversation(cIdx, 'down')}
                      className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                      title={isId ? 'Pindah ke Bawah' : 'Move Down'}
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteConversation(conv.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors ml-1 cursor-pointer"
                      title={isId ? 'Hapus Pesan' : 'Delete Message'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Username / Display Name */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {isId ? 'Nama Kontak / Username' : 'Contact Name / Username'}
                    </label>
                    <input
                      type="text"
                      value={conv.username || ''}
                      onChange={(e) => handleUpdateConversation(conv.id, { username: e.target.value })}
                      placeholder="username"
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Verified Badge */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {isId ? 'Lencana Terverifikasi' : 'Verified Badge'}
                    </label>
                    <select
                      value={conv.verified || 'none'}
                      onChange={(e) => handleUpdateConversation(conv.id, { verified: e.target.value as VerifiedType })}
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="none">{isId ? 'Tanpa Lencana' : 'No Badge'}</option>
                      <option value="ig-blue">{isId ? 'Centang Biru Instagram' : 'Instagram Blue Checkmark'}</option>
                    </select>
                  </div>

                  {/* Contact Avatar Upload */}
                  <div className="sm:col-span-2">
                    <ImageUploader
                      label={isId ? 'Foto Profil Kontak (Avatar)' : 'Contact Profile Picture (Avatar)'}
                      value={conv.avatar || ''}
                      onChange={(url) => handleUpdateConversation(conv.id, { avatar: url })}
                      onClear={() => handleUpdateConversation(conv.id, { avatar: '' })}
                    />
                  </div>

                  {/* Time Ago */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t('common.time', 'Time / Timestamp')}
                    </label>
                    <input
                      type="text"
                      value={conv.timeAgo || ''}
                      onChange={(e) => handleUpdateConversation(conv.id, { timeAgo: e.target.value })}
                      placeholder={isId ? '1j / Senin / 14j' : '1h / Monday / 14h'}
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Action Text (e.g. Reply?) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {isId ? 'Teks Aksi Biru (misal: Balas?)' : 'Blue Action Text (e.g. Reply?)'}
                    </label>
                    <input
                      type="text"
                      value={conv.actionText || ''}
                      onChange={(e) => handleUpdateConversation(conv.id, { actionText: e.target.value })}
                      placeholder={isId ? 'Balas?' : 'Reply?'}
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Message Snippet */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {isId ? 'Cuplikan Pesan Terakhir' : 'Last Message Snippet'}
                    </label>
                    <input
                      type="text"
                      value={conv.lastMessageSnippet || ''}
                      onChange={(e) => handleUpdateConversation(conv.id, { lastMessageSnippet: e.target.value })}
                      placeholder={isId ? 'Tulis teks pesan di sini' : 'Your text goes here'}
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Draft Prefix */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {isId ? 'Label Pesan Draf' : 'Draft Message Label'}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!!conv.isDraft}
                        onChange={(e) => handleUpdateConversation(conv.id, { isDraft: e.target.checked })}
                        className="w-3.5 h-3.5 text-purple-600 rounded-sm accent-purple-600"
                      />
                      <input
                        type="text"
                        disabled={!conv.isDraft}
                        value={conv.draftText || (isId ? 'Draf: ' : 'Draft: ')}
                        onChange={(e) => handleUpdateConversation(conv.id, { draftText: e.target.value })}
                        placeholder={isId ? 'Draf: ' : 'Draft: '}
                        className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Toggles */}
                <div className="flex items-center gap-4 pt-1 flex-wrap">
                  <label className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!conv.hasUnread}
                      onChange={(e) => handleUpdateConversation(conv.id, { hasUnread: e.target.checked })}
                      className="w-3.5 h-3.5 text-purple-600 rounded-sm accent-purple-600"
                    />
                    <span>{isId ? 'Belum Dibaca (Titik Biru)' : 'Unread (Blue Dot)'}</span>
                  </label>

                  <label className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!conv.hasStoryRing}
                      onChange={(e) => handleUpdateConversation(conv.id, { hasStoryRing: e.target.checked })}
                      className="w-3.5 h-3.5 text-purple-600 rounded-sm accent-purple-600"
                    />
                    <span>{isId ? 'Lingkaran Cerita Instagram' : 'Instagram Story Ring'}</span>
                  </label>

                  <label className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={conv.showCameraIcon === true}
                      onChange={(e) => handleUpdateConversation(conv.id, { showCameraIcon: e.target.checked })}
                      className="w-3.5 h-3.5 text-purple-600 rounded-sm accent-purple-600"
                    />
                    <span>{isId ? 'Ikon Balas Cepat Kamera' : 'Quick Camera Reply Icon'}</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
