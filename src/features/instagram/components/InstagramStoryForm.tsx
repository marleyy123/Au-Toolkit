import React from 'react';
import { InstagramStoryData, CharacterPreset } from '../../../types';
import { CharacterSelector, ImageUploader, VerifiedSelector, SaveProfileButton } from '../../../components/FormControls';
import { Moon, Sun, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface Props {
  data: InstagramStoryData;
  onChange: (updated: InstagramStoryData) => void;
  characters: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const InstagramStoryForm: React.FC<Props> = ({
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
  const { t, isId } = useLanguage();
  const updateField = <K extends keyof InstagramStoryData>(key: K, value: InstagramStoryData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const storyCount = data.storyCount ?? 4;
  const activeStoryIndex = data.activeStoryIndex ?? 1;

  return (
    <div className="space-y-4 text-slate-800">
      {/* Quick Character Presets */}
      <CharacterSelector
        characters={characters}
        activeCharacterId={activeCharacterId}
        onSelect={onSelectCharacter}
        onSaveCurrent={onSaveCharacter}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      {/* 1. User Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{isId ? 'Header Cerita' : 'Story Header'}</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-700 font-semibold block">{isId ? 'Nama Pengguna' : 'Username'}</label>
            <input
              type="text"
              value={data.username || ''}
              onChange={(e) => updateField('username', e.target.value)}
              placeholder="username"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-semibold block">{isId ? 'Lencana Waktu Berlalu' : 'Time Ago Badge'}</label>
            <input
              type="text"
              value={data.timeAgo || ''}
              onChange={(e) => updateField('timeAgo', e.target.value)}
              placeholder="1h"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white mt-1"
            />
          </div>
        </div>

        <ImageUploader
          label={isId ? 'Foto Profil Avatar' : 'Profile Picture Avatar'}
          value={data.avatar || ''}
          onChange={(url) => updateField('avatar', url)}
        />

        <VerifiedSelector
          value={data.verified || 'none'}
          onChange={(val) => updateField('verified', val)}
          allowIg={true}
        />

        {/* Music Track Indicator inputs */}
        <div className="pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-800 block mb-1.5">
            {isId ? 'Indikator Musik / Lagu (Di Bawah Nama Pengguna)' : 'Music Indicator / Audio Track (Under Username)'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={data.musicArtist ?? ''}
              onChange={(e) => updateField('musicArtist', e.target.value)}
              placeholder={isId ? 'Nama Artis' : 'Artist Name'}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
            <input
              type="text"
              value={data.musicTitle ?? ''}
              onChange={(e) => updateField('musicTitle', e.target.value)}
              placeholder={isId ? 'Judul Lagu' : 'Song Title'}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* 3. Story Media */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{isId ? 'Foto / Latar Cerita' : 'Story Photo / Backdrop'}</h3>

        <ImageUploader
          label={isId ? 'Foto Utama Cerita' : 'Story Main Photo'}
          value={data.mediaImage || ''}
          onChange={(url) => updateField('mediaImage', url)}
          aspectHint={isId ? 'Vertikal 9:16 (Resolusi HD Penuh)' : '9:16 Vertical (Full HD Native)'}
          skipCompression={true}
        />
      </div>

      {/* 4. Display & Line Story Settings */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{isId ? 'Bilah Kemajuan Cerita & Garis' : 'Story Progress Bar & Lines'}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Number of Story Lines */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              {isId ? 'Jumlah Garis Cerita' : 'Number of Story Lines'}
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={storyCount}
              onChange={(e) => {
                const val = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                updateField('storyCount', val);
                if (activeStoryIndex > val) updateField('activeStoryIndex', val);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              placeholder="4"
            />
          </div>

          {/* Active Story Line Index */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              {isId ? 'Indeks Garis Aktif' : 'Active Line Index'}
            </label>
            <input
              type="number"
              min={1}
              max={storyCount}
              value={Math.min(activeStoryIndex, storyCount)}
              onChange={(e) => {
                const val = Math.max(1, Math.min(storyCount, parseInt(e.target.value) || 1));
                updateField('activeStoryIndex', val);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              placeholder="1"
            />
          </div>

          {/* Active Line Progress (%) */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              {isId ? 'Kemajuan Garis (%)' : 'Line Progress (%)'}
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={data.activeStoryProgress ?? 50}
              onChange={(e) => {
                const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                updateField('activeStoryProgress', val);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              placeholder="50"
            />
          </div>
        </div>

        {/* Quick presets for activeStoryProgress */}
        <div className="flex items-center space-x-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-500">{isId ? 'Preset Cepat:' : 'Quick Presets:'}</span>
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => updateField('activeStoryProgress', pct)}
              className={`px-2 py-0.5 text-[11px] font-bold rounded border transition-all cursor-pointer ${
                (data.activeStoryProgress ?? 50) === pct
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 text-xs pt-2">
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-semibold">
            <input
              type="checkbox"
              checked={!!data.isCloseFriends}
              onChange={(e) => updateField('isCloseFriends', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span className="text-xs">{isId ? 'Teman Dekat' : 'Close Friends'}</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-semibold">
            <input
              type="checkbox"
              checked={data.showReplyBar}
              onChange={(e) => updateField('showReplyBar', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span>{isId ? 'Tampilkan Bilah Bawah "Kirim pesan..."' : 'Show Bottom "Send message..." Bar'}</span>
          </label>
        </div>
      </div>

      {/* 5. Story Reply */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{isId ? 'Balasan Cerita' : 'Story Reply'}</h3>
            <p className="text-[11px] text-slate-500 font-medium">{isId ? 'Tampilan penuh balasan cerita dengan reaksi cepat dan keyboard iOS' : 'Full story reply view with quick reaction and iOS keyboard'}</p>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl text-purple-700 font-bold text-xs shadow-2xs">
            <input
              type="checkbox"
              checked={!!data.isStoryReplyMode}
              onChange={(e) => updateField('isStoryReplyMode', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 w-4 h-4 accent-purple-600"
            />
            <span>{isId ? 'Aktifkan Balasan Cerita' : 'Enable Story Reply'}</span>
          </label>
        </div>

        {data.isStoryReplyMode && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            {/* Reply Message Input */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                {isId ? 'Teks Pesan Balasan ("Kirim pesan...")' : 'Reply Message Text ("Send message...")'}
              </label>
              <input
                type="text"
                value={data.replyMessageText ?? ''}
                onChange={(e) => updateField('replyMessageText', e.target.value)}
                placeholder="Your text goes here..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
            </div>

            {/* Checkboxes: Quick Reaction Emoji & iOS Keyboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700 font-semibold text-xs">
                <input
                  type="checkbox"
                  checked={data.showQuickReactions !== false}
                  onChange={(e) => updateField('showQuickReactions', e.target.checked)}
                  className="rounded text-purple-600 focus:ring-0 accent-purple-600"
                />
                <span>{isId ? 'Tampilkan Emoji Reaksi Cepat (Kisi 6)' : 'Show Quick Reaction Emojis (6 Grid)'}</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700 font-semibold text-xs">
                <input
                  type="checkbox"
                  checked={data.showKeyboard !== false}
                  onChange={(e) => updateField('showKeyboard', e.target.checked)}
                  className="rounded text-purple-600 focus:ring-0 accent-purple-600"
                />
                <span>{isId ? 'Tampilkan Mockup Keyboard iOS' : 'Show iOS Keyboard Mockup'}</span>
              </label>
            </div>

            {/* Keyboard Theme */}
            {data.showKeyboard !== false && (
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  {isId ? 'Mode Tema' : 'Theme Mode'}
                </label>
                <div className="flex space-x-2">
                  {(['light', 'dark'] as ('light' | 'dark')[]).map((kTheme) => (
                    <button
                      key={kTheme}
                      type="button"
                      onClick={() => updateField('keyboardTheme', kTheme)}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                        (data.keyboardTheme || data.theme || 'dark') === kTheme
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {kTheme === 'light' ? (
                        <>
                          <Sun className="w-3.5 h-3.5" />
                          <span>{isId ? 'Terang' : 'Light'}</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-3.5 h-3.5" />
                          <span>{isId ? 'Gelap' : 'Dark'}</span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Comment Overlay on Story (Sticker Comment) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{isId ? 'Balasan Cerita / Overlay Komentar (Stiker)' : 'Story Reply / Comment Overlay (Sticker)'}</h3>
          <label className="flex items-center space-x-2 cursor-pointer bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg text-purple-700 font-bold text-xs">
            <input
              type="checkbox"
              checked={!!data.showCommentOverlay}
              onChange={(e) => updateField('showCommentOverlay', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span>{isId ? 'Aktifkan Balasan/Komentar Cerita' : 'Enable Story Reply/Comment'}</span>
          </label>
        </div>

        {data.showCommentOverlay && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {isId ? 'Teks Balasan / Komentar Cerita' : 'Story Reply / Comment Text'}
                </label>
                <input
                  type="text"
                  value={data.commentOverlayText ?? ''}
                  onChange={(e) => updateField('commentOverlayText', e.target.value)}
                  placeholder="Your text goes here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {isId ? 'Warna Gelembung Obrolan' : 'Chat Bubble Color'}
                </label>
                <div className="flex items-center space-x-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => updateField('commentOverlayBubbleColor', 'light')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      data.commentOverlayBubbleColor === 'light'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-white border border-slate-300 inline-block" />
                    <span>{isId ? 'Putih (#FFFFFF)' : 'White (#FFFFFF)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateField('commentOverlayBubbleColor', 'dark')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      (data.commentOverlayBubbleColor || 'dark') === 'dark'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-[#262626] border border-neutral-600 inline-block" />
                    <span>{isId ? 'Gelap (#262626)' : 'Dark (#262626)'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {isId ? 'Avatar & Jumlah Komentator (Tumpukan Avatar)' : 'Commenter Avatars & Count (Avatar Stack)'}
                </label>
                {(data.commentOverlayAvatars || []).some((a) => a && a.trim() !== '') && (
                  <button
                    type="button"
                    onClick={() => updateField('commentOverlayAvatars', [])}
                    className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isId ? 'Hapus Semua Avatar' : 'Clear All Avatars'}</span>
                  </button>
                )}
              </div>

              {/* Quick Count selector */}
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-[11px] font-medium text-slate-500">{isId ? 'Jumlah Avatar:' : 'Avatar Count:'}</span>
                {[1, 2, 3].map((count) => {
                  const currentLen = (data.commentOverlayAvatars || []).length || 1;
                  const isSelected = currentLen === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        const current = [...(data.commentOverlayAvatars || [])];
                        if (current.length < count) {
                          while (current.length < count) current.push('');
                        } else {
                          current.splice(count);
                        }
                        updateField('commentOverlayAvatars', current);
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {count} Avatar{count > 1 ? (isId ? '' : 's') : ''}
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-500 mb-2">
                {isId
                  ? 'Unggah foto profil komentator. Jika dikosongkan atau dihapus, avatar abu-abu default akan ditampilkan.'
                  : 'Upload commenter profile photo. If left empty or deleted, default grey avatar will be shown.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {Array.from({ length: Math.max(1, Math.min(3, (data.commentOverlayAvatars || []).length || 1)) }).map((_, idx) => (
                  <ImageUploader
                    key={idx}
                    label={`Avatar ${idx + 1}`}
                    value={(data.commentOverlayAvatars || [])[idx] || ''}
                    onChange={(url) => {
                      const newAvatars = [...(data.commentOverlayAvatars || [])];
                      newAvatars[idx] = url;
                      updateField('commentOverlayAvatars', newAvatars);
                    }}
                    onClear={() => {
                      const newAvatars = [...(data.commentOverlayAvatars || [])];
                      newAvatars[idx] = '';
                      updateField('commentOverlayAvatars', newAvatars);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <SaveProfileButton onSave={onSaveProfile} />
    </div>
  );
};

