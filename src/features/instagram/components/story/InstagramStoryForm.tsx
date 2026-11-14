import React from 'react';
import { InstagramStoryData, CharacterPreset } from '../../../../types';
import { CharacterSelector, ImageUploader, VerifiedSelector, SaveProfileButton } from '../../../../components/FormControls';
import { Moon, Sun, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';

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

      {/* Repost Story Mode */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {isId ? 'Mode Repost Cerita' : 'Repost Story Mode'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {isId ? 'Tampilkan cerita sebagai kartu repost akun lain dengan latar warna' : 'Display story as repost card from another account with background'}
            </p>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl text-purple-700 font-bold text-xs shadow-2xs">
            <input
              type="checkbox"
              checked={!!data.isRepost}
              onChange={(e) => updateField('isRepost', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 w-4 h-4 accent-purple-600"
            />
            <span>{isId ? 'Aktifkan Repost' : 'Enable Repost'}</span>
          </label>
        </div>

        {data.isRepost && (
          <div className="space-y-3.5 pt-3 border-t border-slate-100">
            {/* 1. Info Akun yang Direpost (Repost Account Info) */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                {isId ? 'Info Akun yang Direpost' : 'Repost Account Info'}
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-700 font-semibold block">{isId ? 'Username' : 'Username'}</label>
                  <input
                    type="text"
                    value={data.repostUsername || ''}
                    onChange={(e) => updateField('repostUsername', e.target.value)}
                    placeholder="username"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block">{isId ? 'Waktu Cerita' : 'Time Ago'}</label>
                  <input
                    type="text"
                    value={data.repostTimeAgo || ''}
                    onChange={(e) => updateField('repostTimeAgo', e.target.value)}
                    placeholder="2h"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
                  />
                </div>
              </div>

              <ImageUploader
                label={isId ? 'Foto Profil' : 'Avatar'}
                value={data.repostAvatar || ''}
                onChange={(url) => updateField('repostAvatar', url)}
              />

              <div className="pt-1">
                <label className="text-xs text-slate-700 font-semibold block mb-1">
                  {isId ? 'Centang Biru' : 'Verified Badge'}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('repostVerified', 'none')}
                    className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      (!data.repostVerified || data.repostVerified === 'none')
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isId ? 'Tanpa Centang' : 'None'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('repostVerified', 'ig-blue')}
                    className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      data.repostVerified === 'ig-blue'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    <span>Blue Verified</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Media Cerita Repost */}
            <div className="space-y-2">
              <ImageUploader
                label={isId ? 'Foto / Media Kartu Repost (Ukuran 9:16)' : 'Repost Card Photo / Media (9:16 Ratio)'}
                value={data.repostMedia || ''}
                onChange={(url) => updateField('repostMedia', url)}
                aspectHint={isId ? 'Vertikal 9:16 (Format Story Instagram)' : '9:16 Vertical (Instagram Story Format)'}
              />
            </div>

            {/* 3. Warna Dasar Latar Belakang Luar (Outer Story Basic Color) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  {isId ? 'Warna Dasar Latar Belakang Luar' : 'Outer Story Basic Color'}
                </label>
                <span className="text-[11px] font-mono font-bold text-slate-500">
                  {data.repostBgColor || '#000000'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {[
                  { name: isId ? 'Hitam' : 'Black', hex: '#000000' },
                  { name: isId ? 'Putih' : 'White', hex: '#FFFFFF' },
                  { name: 'Pink', hex: '#FF69B4' },
                  { name: isId ? 'Soft Pink' : 'Soft Pink', hex: '#FBCFE8' },
                  { name: isId ? 'Abu-abu' : 'Gray', hex: '#6B7280' },
                  { name: isId ? 'Abu Terang' : 'Light Gray', hex: '#E5E7EB' },
                  { name: isId ? 'Biru Pastel' : 'Pastel Blue', hex: '#93C5FD' },
                  { name: isId ? 'Ungu Pastel' : 'Pastel Purple', hex: '#C4B5FD' },
                  { name: isId ? 'Krem / Beige' : 'Beige', hex: '#F5E6D3' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => updateField('repostBgColor', c.hex)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      (data.repostBgColor || '#000000').toLowerCase() === c.hex.toLowerCase()
                        ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-500/30 text-purple-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs inline-block shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
                <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="color"
                    value={data.repostBgColor || '#000000'}
                    onChange={(e) => updateField('repostBgColor', e.target.value)}
                    className="w-4 h-4 p-0 border-0 rounded cursor-pointer bg-transparent"
                  />
                  <span className="text-[11px] text-slate-600">{isId ? 'Pilih Warna...' : 'Custom...'}</span>
                </label>
              </div>
            </div>

            {/* 4. Ukuran Kartu Repost (Repost Card Size) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  {isId ? 'Ukuran Kartu Repost' : 'Repost Card Size'}
                </label>
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {data.repostSizePercent ?? 78}% {Number(data.repostSizePercent ?? 78) >= 100 ? (isId ? '(Layar Penuh / Full)' : '(Full Screen)') : ''}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="1"
                value={data.repostSizePercent ?? 78}
                onChange={(e) => updateField('repostSizePercent', Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 mb-2"
              />
              <div className="flex items-center justify-between gap-1.5">
                {[
                  { label: isId ? 'Kompak (65%)' : 'Compact (65%)', val: 65 },
                  { label: isId ? 'Standar (78%)' : 'Standard (78%)', val: 78 },
                  { label: isId ? 'Besar (90%)' : 'Large (90%)', val: 90 },
                  { label: isId ? 'Penuh (100%)' : 'Full (100%)', val: 100 },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => updateField('repostSizePercent', s.val)}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                      (data.repostSizePercent ?? 78) === s.val
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Kelengkungan Sudut Kartu Repost (Repost Card Corner Radius) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  {isId ? 'Kelengkungan Sudut Kartu Repost' : 'Repost Card Corner Radius'}
                </label>
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {data.repostCornerRadius ?? 24}px {(data.repostCornerRadius ?? 24) === 0 ? (isId ? '(Kotak / Bersudut)' : '(Square / Sharp)') : ''}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="36"
                step="2"
                value={data.repostCornerRadius ?? 24}
                onChange={(e) => updateField('repostCornerRadius', Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 mb-2"
              />
              <div className="flex items-center justify-between gap-1.5">
                {[
                  { label: isId ? 'Kotak (0px)' : 'Square (0px)', val: 0 },
                  { label: isId ? 'Sedikit (12px)' : 'Subtle (12px)', val: 12 },
                  { label: isId ? 'Standar (24px)' : 'Standard (24px)', val: 24 },
                  { label: isId ? 'Tumpul (32px)' : 'Rounded (32px)', val: 32 },
                ].map((r) => (
                  <button
                    key={r.val}
                    type="button"
                    onClick={() => updateField('repostCornerRadius', r.val)}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                      (data.repostCornerRadius ?? 24) === r.val
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Question Box / Text Box Sticker */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {isId ? 'Stiker Kotak Pertanyaan (Question Box)' : 'Question Box Sticker'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {isId ? 'Stiker interaktif tanya jawab dengan foto profil dan pengatur posisi' : 'Interactive Q&A sticker with avatar and position sliders'}
            </p>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-amber-700 font-bold text-xs shadow-2xs">
            <input
              type="checkbox"
              checked={!!data.showQuestionBox}
              onChange={(e) => updateField('showQuestionBox', e.target.checked)}
              className="rounded text-amber-600 focus:ring-0 w-4 h-4 accent-amber-600"
            />
            <span>{isId ? 'Aktifkan Stiker' : 'Enable Sticker'}</span>
          </label>
        </div>

        {data.showQuestionBox && (
          <div className="space-y-4 pt-3 border-t border-amber-200/80">
            {/* Mode Selector: Tanya (Ask) atau Jawaban (Answer) */}
            <div className="grid grid-cols-2 gap-2 bg-amber-100/50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => updateField('questionBoxMode', 'ask')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  data.questionBoxMode !== 'answer'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-900 hover:bg-amber-200/50'
                }`}
              >
                {isId ? 'Mode 1: Kotak Tanya (Ask)' : 'Mode 1: Ask Sticker'}
              </button>
              <button
                type="button"
                onClick={() => updateField('questionBoxMode', 'answer')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  data.questionBoxMode === 'answer'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-900 hover:bg-amber-200/50'
                }`}
              >
                {isId ? 'Mode 2: Jawaban (Answer)' : 'Mode 2: Answer Card'}
              </button>
            </div>

            {/* Foto Profil di Atas Stiker (Setengah di luar, setengah di dalam) */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    {isId ? 'Foto Profil di Atas Stiker' : 'Profile Picture on Sticker'}
                  </label>
                  <p className="text-[11px] text-slate-500">
                    {isId ? 'Setengah melingkar di luar, setengah di dalam kotak' : 'Half outside, half inside top edge'}
                  </p>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-bold text-xs shadow-2xs">
                  <input
                    type="checkbox"
                    checked={data.showQuestionBoxAvatar !== false}
                    onChange={(e) => updateField('showQuestionBoxAvatar', e.target.checked)}
                    className="rounded text-amber-600 focus:ring-0 accent-amber-600"
                  />
                  <span>{isId ? 'Aktif' : 'Enabled'}</span>
                </label>
              </div>

              {data.showQuestionBoxAvatar !== false && (
                <div className="pt-1">
                  <ImageUploader
                    label={isId ? 'Foto Profil Stiker (Opsional - default foto akun)' : 'Sticker Avatar (Optional - defaults to profile avatar)'}
                    value={data.questionBoxAvatar || ''}
                    onChange={(url) => updateField('questionBoxAvatar', url)}
                    aspectHint={isId ? '1:1 Persegi' : '1:1 Square'}
                  />
                </div>
              )}
            </div>

            {/* Teks Pertanyaan (Question Text - Bagian Atas) — Kata 'Prompt' Sudah Dihapus */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                {isId ? 'Teks Pertanyaan (Bagian Atas)' : 'Question Text (Top Part)'}
              </label>
              <input
                type="text"
                value={data.questionBoxPrompt || ''}
                onChange={(e) => updateField('questionBoxPrompt', e.target.value)}
                placeholder="Ask me a question"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {[
                  'Ask me a question',
                  'Ask me anything!',
                  'Q&A Time ✨',
                  'Drop song recommendations 🎵',
                  'Send me a message',
                ].map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    onClick={() => updateField('questionBoxPrompt', promptText)}
                    className="px-2 py-0.5 text-[10.5px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>

            {/* MODE TANYA (ASK) */}
            {data.questionBoxMode !== 'answer' && (
              <div className="space-y-3.5">
                {/* Draf Balasan di Kotak Teks (Draft Response in Text Box) */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    {isId ? 'Draf Balasan di Kotak Teks' : 'Draft Response in Text Box'}
                  </label>
                  <input
                    type="text"
                    value={data.questionBoxResponseText || ''}
                    onChange={(e) => updateField('questionBoxResponseText', e.target.value)}
                    placeholder={data.questionBoxPlaceholder || 'Type something...'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                {/* Warna Kotak Pertanyaan (Question Box Color) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      {isId ? 'Warna Kotak Pertanyaan' : 'Question Box Color'}
                    </label>
                    <span className="text-[11px] font-mono font-bold text-slate-500">
                      {data.questionBoxBgColor || '#FFFFFF'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {[
                      { id: 'white', name: isId ? 'Putih' : 'White', hex: '#FFFFFF' },
                      { id: 'dark', name: isId ? 'Hitam' : 'Black', hex: '#1C1C1E' },
                      { id: 'blue', name: isId ? 'Biru' : 'Blue', hex: '#0095F6' },
                      { id: 'purple', name: isId ? 'Ungu' : 'Purple', hex: '#8B5CF6' },
                      { id: 'pink', name: 'Pink', hex: '#EC4899' },
                    ].map((th) => {
                      const isActive = (data.questionBoxBgColor || '#FFFFFF').toUpperCase() === th.hex.toUpperCase();
                      return (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => {
                            updateField('questionBoxTheme', th.id as any);
                            updateField('questionBoxBgColor', th.hex);
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/40 text-amber-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs inline-block shrink-0"
                            style={{ backgroundColor: th.hex }}
                          />
                          <span>{th.name}</span>
                        </button>
                      );
                    })}
                    <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                      <input
                        type="color"
                        value={data.questionBoxBgColor || '#FFFFFF'}
                        onChange={(e) => {
                          updateField('questionBoxTheme', 'custom');
                          updateField('questionBoxBgColor', e.target.value);
                        }}
                        className="w-4 h-4 p-0 border-0 rounded cursor-pointer bg-transparent"
                      />
                      <span className="text-[11px] text-slate-600">{isId ? 'Kustom...' : 'Custom...'}</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* MODE JAWABAN (ANSWER) */}
            {data.questionBoxMode === 'answer' && (
              <div className="space-y-3.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  {isId ? 'Konten Kartu Jawaban' : 'Answer Card Content'}
                </span>
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">
                    {isId ? 'Username Penanya (Opsional)' : 'Questioner Username (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={data.questionBoxAnswerUser || ''}
                    onChange={(e) => updateField('questionBoxAnswerUser', e.target.value)}
                    placeholder="@username"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">
                    {isId ? 'Teks Jawaban Pengguna' : 'Answer Text'}
                  </label>
                  <input
                    type="text"
                    value={data.questionBoxAnswerText || ''}
                    onChange={(e) => updateField('questionBoxAnswerText', e.target.value)}
                    placeholder="Can you share your skincare routine?"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">
                    {isId ? 'Warna Bagian Jawaban (Bawah)' : 'Answer Card Color (Bottom)'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={data.questionBoxAnswerBgColor || '#FFFFFF'}
                      onChange={(e) => updateField('questionBoxAnswerBgColor', e.target.value)}
                      className="w-8 h-8 p-0 border border-slate-200 rounded cursor-pointer bg-transparent"
                    />
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {data.questionBoxAnswerBgColor || '#FFFFFF'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Garis Pengatur Posisi Stiker (Sticker Position Line Sliders) */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    {isId ? 'Garis Pengatur Posisi Stiker' : 'Sticker Position Line Sliders'}
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {isId ? 'Bisa pakai garis geser di bawah atau langsung sentuh/drag di layar preview' : 'Use lines below or drag directly on preview'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateField('questionBoxX', 50);
                    updateField('questionBoxY', 50);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white border border-slate-200 hover:border-amber-400 text-slate-700 rounded-lg shadow-2xs hover:bg-amber-50 cursor-pointer"
                >
                  {isId ? '↺ Posisikan ke Tengah' : '↺ Reset to Center'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 mb-1">
                    <span>{isId ? 'Garis Horizontal (Kiri - Kanan)' : 'Horizontal Line (X)'}</span>
                    <span className="font-mono text-amber-700 font-black">{data.questionBoxX ?? 50}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="1"
                    value={data.questionBoxX ?? 50}
                    onChange={(e) => updateField('questionBoxX', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 mb-1">
                    <span>{isId ? 'Garis Vertikal (Atas - Bawah)' : 'Vertical Line (Y)'}</span>
                    <span className="font-mono text-amber-700 font-black">{data.questionBoxY ?? 50}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="1"
                    value={data.questionBoxY ?? 50}
                    onChange={(e) => updateField('questionBoxY', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>
              </div>
            </div>

            {/* Ukuran Kotak Pertanyaan (Question Box Size) */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    {isId ? 'Ukuran Kotak Pertanyaan (Bebas Dikecilkan / Dibesarkan)' : 'Question Box Size (Freely Resize Scale)'}
                  </label>
                </div>
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {data.questionBoxScale ?? 100}%
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="160"
                step="1"
                value={data.questionBoxScale ?? 100}
                onChange={(e) => updateField('questionBoxScale', Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600 mb-1"
              />
              <div className="flex items-center justify-between gap-1.5">
                {[
                  { label: isId ? 'Kecil (65%)' : 'Small (65%)', val: 65 },
                  { label: isId ? 'Kompak (85%)' : 'Compact (85%)', val: 85 },
                  { label: isId ? 'Standar (100%)' : 'Standard (100%)', val: 100 },
                  { label: isId ? 'Besar (120%)' : 'Large (120%)', val: 120 },
                  { label: isId ? 'Ekstra (140%)' : 'Extra (140%)', val: 140 },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => updateField('questionBoxScale', s.val)}
                    className={`flex-1 py-1 text-[10.5px] font-bold rounded-lg border transition-all cursor-pointer ${
                      (data.questionBoxScale ?? 100) === s.val
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
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

