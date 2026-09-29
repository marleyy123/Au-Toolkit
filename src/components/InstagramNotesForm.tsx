import React from 'react';
import { InstagramNotesData, InstagramNoteItem, CharacterPreset } from '../types';
import { ImageUploader, CharacterSelector, SaveProfileButton } from './FormControls';
import { Plus, Trash2, MessageSquare, Music } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  data: InstagramNotesData;
  onChange: (data: InstagramNotesData) => void;
  characters?: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter?: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter?: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const InstagramNotesForm: React.FC<Props> = ({
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
  const notes = data.notes || [];

  const handleAddNote = () => {
    const newNote: InstagramNoteItem = {
      id: 'note-' + Date.now(),
      text: '',
      songTitle: '',
      artistName: '',
      avatarUrl: '',
      username: '',
      isYourNote: false,
      isOnline: true,
      showLocationOff: false,
    };
    onChange({
      ...data,
      notes: [...notes, newNote],
    });
  };

  const handleUpdateNote = (id: string, field: keyof InstagramNoteItem, value: any) => {
    onChange({
      ...data,
      notes: notes.map((n) => (n.id === id ? { ...n, [field]: value } : n)),
    });
  };

  const handleDeleteNote = (id: string) => {
    if (notes.length <= 1) {
      alert('At least 1 Note is required.');
      return;
    }
    onChange({
      ...data,
      notes: notes.filter((n) => n.id !== id),
    });
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200">
      {/* Quick Character Preset Selector */}
      <CharacterSelector
        characters={characters || []}
        activeCharacterId={activeCharacterId}
        onSelect={onSelectCharacter}
        onSaveCurrent={() => {
          if (onSaveCharacter) onSaveCharacter();
        }}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      {/* Theme Options */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{t('theme.mode', 'Theme Mode')}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{isId ? 'Pilih tema wadah catatan' : 'Select Notes container theme'}</span>
        </div>
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => onChange({ ...data, theme: 'light' })}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              data.theme === 'light'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300 inline-block" />
            <span>{t('theme.light', 'Light')}</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...data, theme: 'dark' })}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              (data.theme || 'dark') === 'dark'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#121212] border border-neutral-600 inline-block" />
            <span>{t('theme.dark', 'Dark')}</span>
          </button>
        </div>
      </div>

      {/* Notes List Editor */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              {isId ? `Catatan Instagram (${notes.length})` : `Instagram Notes (${notes.length})`}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleAddNote}
            className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isId ? '+ Tambah Catatan' : 'Add Note'}</span>
          </button>
        </div>

        <div className="space-y-4">
          {notes.map((note, index) => (
            <div
              key={note.id}
              className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/80 dark:bg-slate-800/60 space-y-3 relative group"
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-[11px] font-bold">
                    {index + 1}
                  </span>
                  {note.isYourNote ? (isId ? 'Catatan Kamu' : 'Your Note') : `@${note.username || 'user'}`}
                </span>

                <button
                  type="button"
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors p-1 cursor-pointer"
                  title={isId ? 'Hapus catatan' : 'Delete note'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Music Attachment Section (Song Title & Artist) */}
              <div className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Music className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isId ? 'Lampiran Musik' : 'Music Attachment'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      {isId ? 'Judul Lagu' : 'Song Title'}
                    </label>
                    <input
                      type="text"
                      value={note.songTitle || ''}
                      onChange={(e) => handleUpdateNote(note.id, 'songTitle', e.target.value)}
                      placeholder="Pelangi"
                      className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      {isId ? 'Nama Artis' : 'Artist Name'}
                    </label>
                    <input
                      type="text"
                      value={note.artistName || ''}
                      onChange={(e) => handleUpdateNote(note.id, 'artistName', e.target.value)}
                      placeholder="HIVI!"
                      className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Teks Note (Note Bubble Text) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isId ? 'Teks Catatan (Balon Pikiran)' : 'Note Text (Custom Thought)'}
                </label>
                <input
                  type="text"
                  value={note.text || ''}
                  onChange={(e) => handleUpdateNote(note.id, 'text', e.target.value)}
                  placeholder={index === 0 ? (isId ? 'Halo' : 'Hello') : (isId ? 'Bagikan pemikiran...' : 'Share a thought...')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Username & Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isId ? 'Nama Pengguna / Label' : 'Username / Label'}
                  </label>
                  <input
                    type="text"
                    value={note.username || ''}
                    disabled={note.isYourNote}
                    onChange={(e) => handleUpdateNote(note.id, 'username', e.target.value)}
                    placeholder={note.isYourNote ? (isId ? 'Catatan Anda' : 'Your note') : 'username'}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isId ? 'Opsi & Status Catatan' : 'Note Options & Status'}
                  </label>
                  <div className="flex flex-wrap items-center gap-3 pt-0.5">
                    <label className="inline-flex items-center cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={note.isYourNote}
                        onChange={(e) =>
                          handleUpdateNote(note.id, 'isYourNote', e.target.checked)
                        }
                        className="rounded-xs border-slate-300 text-purple-600 focus:ring-purple-500 accent-purple-600 w-3.5 h-3.5 mr-1.5"
                      />
                      {isId ? 'Catatan Kamu?' : 'Is Your Note?'}
                    </label>

                    <label className="inline-flex items-center cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={note.isOnline}
                        onChange={(e) =>
                          handleUpdateNote(note.id, 'isOnline', e.target.checked)
                        }
                        className="rounded-xs border-slate-300 text-purple-600 focus:ring-purple-500 accent-purple-600 w-3.5 h-3.5 mr-1.5"
                      />
                      {isId ? 'Status Online' : 'Online Status'}
                    </label>
                  </div>
                </div>
              </div>

              {note.isYourNote && (
                <div className="pt-1">
                  <label className="inline-flex items-center cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={note.showLocationOff ?? true}
                      onChange={(e) =>
                        handleUpdateNote(note.id, 'showLocationOff', e.target.checked)
                      }
                      className="rounded-xs border-slate-300 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5 mr-1.5"
                    />
                    {isId ? 'Tampilkan label "Lokasi mati"' : 'Show "Location off" label'}
                  </label>
                </div>
              )}

              {/* Profile Avatar Upload */}
              <ImageUploader
                label={isId ? 'Foto Profil Avatar' : 'Profile Picture Avatar'}
                value={note.avatarUrl || ''}
                onChange={(val) => handleUpdateNote(note.id, 'avatarUrl', val)}
              />
            </div>
          ))}
        </div>
      </div>

      <SaveProfileButton onSave={onSaveProfile} />
    </div>
  );
};
