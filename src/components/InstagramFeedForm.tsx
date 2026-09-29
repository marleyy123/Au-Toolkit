import React from 'react';
import { InstagramFeedData, InstagramComment, InstagramReposter, CharacterPreset } from '../types';
import { CharacterSelector, ImageUploader, MultiImageUploader, VerifiedSelector, SaveProfileButton } from './FormControls';
import { Plus, Trash2, Heart, Moon, Sun, Lock, Music, MapPin, Repeat2, Users } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  data: InstagramFeedData;
  onChange: (updated: InstagramFeedData) => void;
  characters: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const InstagramFeedForm: React.FC<Props> = ({
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

  const updateField = <K extends keyof InstagramFeedData>(key: K, value: InstagramFeedData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const handleAddComment = () => {
    const newComment: InstagramComment = {
      id: 'ig-c-' + Date.now(),
      username: '',
      avatar: '',
      content: '',
      timestamp: '1h',
      likes: '0',
      isLiked: false,
    };
    updateField('comments', [...(data.comments || []), newComment]);
  };

  const handleUpdateComment = (index: number, updatedField: Partial<InstagramComment>) => {
    const updatedComments = [...(data.comments || [])];
    updatedComments[index] = { ...updatedComments[index], ...updatedField };
    updateField('comments', updatedComments);
  };

  const handleRemoveComment = (index: number) => {
    const updatedComments = (data.comments || []).filter((_, i) => i !== index);
    updateField('comments', updatedComments);
  };

  const handleAddReposter = () => {
    const newReposter: InstagramReposter = {
      id: `rep-${Date.now()}`,
      avatar: '',
      username: '',
    };
    updateField('reposters', [...(data.reposters || []), newReposter]);
  };

  const handleUpdateReposter = (index: number, updatedField: Partial<InstagramReposter>) => {
    const updated = [...(data.reposters || [])];
    updated[index] = { ...updated[index], ...updatedField };
    updateField('reposters', updated);
  };

  const handleRemoveReposter = (index: number) => {
    updateField('reposters', (data.reposters || []).filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-200">
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

      {/* 1. Profile Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {isId ? 'Profil Instagram' : 'Instagram Profile'}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">
              {isId ? 'Nama Pengguna' : 'Username'}
            </label>
            <input
              type="text"
              value={data.username || ''}
              onChange={(e) => updateField('username', e.target.value)}
              placeholder="username"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
            />
          </div>

          <VerifiedSelector
            value={data.verified || 'none'}
            onChange={(val) => updateField('verified', val)}
            allowIg={true}
          />
        </div>

        <ImageUploader
          label={isId ? 'Foto Profil Avatar' : 'Profile Picture Avatar'}
          value={data.avatar || ''}
          onChange={(url) => updateField('avatar', url)}
        />

        {/* Subtitle Header Controls (Location vs Music) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isId ? 'Subjudul Header (Lokasi / Musik)' : 'Header Subtitle (Location / Music)'}
            </label>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {isId ? 'Pilih salah satu' : 'Select one option'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onChange({
                ...data,
                showLocation: false,
                showMusic: false,
                subtitleMode: 'none',
              })}
              className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all text-center cursor-pointer ${
                (data.subtitleMode === 'none' || (!data.showLocation && !data.showMusic && !data.locationText && !data.musicText && !data.location && !data.audioTrack))
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {isId ? 'Tidak ada' : 'None'}
            </button>

            <button
              type="button"
              onClick={() => onChange({
                ...data,
                showLocation: true,
                showMusic: false,
                subtitleMode: 'location',
                locationText: data.locationText || data.location || '',
                location: data.locationText || data.location || '',
              })}
              className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                data.subtitleMode === 'location' || (data.showLocation && !data.showMusic)
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>{isId ? 'Lokasi' : 'Location'}</span>
            </button>

            <button
              type="button"
              onClick={() => onChange({
                ...data,
                showMusic: true,
                showLocation: false,
                subtitleMode: 'music',
                musicText: data.musicText || data.audioTrack || '',
                audioTrack: data.musicText || data.audioTrack || '',
              })}
              className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                data.subtitleMode === 'music' || (data.showMusic && !data.showLocation)
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Music className="w-3 h-3" />
              <span>{isId ? 'Musik' : 'Music'}</span>
            </button>
          </div>

          {/* Subtitle Input Text Fields */}
          {(data.subtitleMode === 'location' || data.showLocation || (data.location && data.subtitleMode !== 'music' && data.subtitleMode !== 'none')) && (
            <div className="pt-1">
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-rose-500" />
                <span>{isId ? 'Nama Lokasi' : 'Location Name'}</span>
              </label>
              <input
                type="text"
                value={data.locationText !== undefined ? data.locationText : (data.location || '')}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange({
                    ...data,
                    locationText: val,
                    location: val,
                    showLocation: true,
                    showMusic: false,
                    subtitleMode: 'location',
                  });
                }}
                placeholder="New York, USA"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
              />
            </div>
          )}

          {(data.subtitleMode === 'music' || data.showMusic || (data.audioTrack && data.subtitleMode !== 'location' && data.subtitleMode !== 'none')) && (
            <div className="pt-1">
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center space-x-1">
                <Music className="w-3 h-3 text-fuchsia-500" />
                <span>{isId ? 'Judul Lagu & Artis (Teks Musik)' : 'Song Title & Artist (Music Text)'}</span>
              </label>
              <input
                type="text"
                value={data.musicText !== undefined ? data.musicText : (data.audioTrack || '')}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange({
                    ...data,
                    musicText: val,
                    audioTrack: val,
                    showMusic: true,
                    showLocation: false,
                    subtitleMode: 'music',
                  });
                }}
                placeholder="Artist • Song Title"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. Media & Caption */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {isId ? 'Media Postingan & Keterangan' : 'Post Media & Caption'}
        </h3>

        <div className="flex items-center justify-between">
          <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
            {isId ? 'Rasio Aspek' : 'Aspect Ratio'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(['1:1', '4:5', '9:16', '16:9'] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => updateField('aspectRatio', ratio)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                  data.aspectRatio === ratio
                    ? 'bg-purple-600 border-purple-600 text-white font-bold shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        <MultiImageUploader
          label={isId ? 'Foto Carousel' : 'Carousel Photos'}
          images={data.mediaImages || []}
          onChange={(imgs) => updateField('mediaImages', imgs)}
          maxImages={10}
          forceAspect={
            data.aspectRatio === '1:1' ? 1 :
            data.aspectRatio === '4:5' ? 4 / 5 :
            data.aspectRatio === '9:16' ? 9 / 16 :
            data.aspectRatio === '16:9' ? 16 / 9 : undefined
          }
        />

        <div>
          <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold mb-1 block">
            {isId ? 'Keterangan (Caption)' : 'Caption'}
          </label>
          <textarea
            rows={3}
            value={data.caption || ''}
            onChange={(e) => updateField('caption', e.target.value)}
            placeholder={isId ? 'Tulis keterangan postingan...' : 'Write a caption...'}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed resize-y"
          />
        </div>
      </div>

      {/* 3. Likes, Comments & Timestamp */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {isId ? 'Interaksi Postingan' : 'Post Engagement'}
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">
              {isId ? 'Disukai Oleh (Username)' : 'Liked By Username'}
            </label>
            <input
              type="text"
              value={data.likedByUsername || ''}
              onChange={(e) => updateField('likedByUsername', e.target.value)}
              placeholder="Jungkook"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">
              {isId ? 'Jumlah Suka (Likes)' : 'Likes Count'}
            </label>
            <input
              type="text"
              value={data.likesCount || ''}
              onChange={(e) => updateField('likesCount', e.target.value)}
              placeholder="2.000"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">
              {isId ? 'Jumlah Total Komentar' : 'Total Comments Count'}
            </label>
            <input
              type="text"
              value={data.commentsCount || ''}
              onChange={(e) => updateField('commentsCount', e.target.value)}
              placeholder="1.8K"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">
              {isId ? 'Jumlah Repost' : 'Repost Count'}
            </label>
            <input
              type="text"
              value={data.repostCount === '6.135' ? '' : (data.repostCount || '')}
              onChange={(e) => updateField('repostCount', e.target.value)}
              placeholder="6.135"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
            />
          </div>

          <div className="col-span-2">
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">
              {isId ? 'Keterangan Waktu Lalu' : 'Time Ago Line'}
            </label>
            <input
              type="text"
              value={data.timestamp || ''}
              onChange={(e) => updateField('timestamp', e.target.value)}
              placeholder={isId ? '1 jam yang lalu' : '1 hour ago'}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 font-semibold">
            <input
              type="checkbox"
              checked={data.isLikedByMe}
              onChange={(e) => updateField('isLikedByMe', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span>{isId ? 'Disukai oleh saya' : 'Liked by me'}</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 font-semibold">
            <input
              type="checkbox"
              checked={data.isSavedByMe}
              onChange={(e) => updateField('isSavedByMe', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span>{isId ? 'Disimpan oleh saya' : 'Saved by me'}</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 font-semibold">
            <input
              type="checkbox"
              checked={data.showRepostCount !== false}
              onChange={(e) => updateField('showRepostCount', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span>{isId ? 'Tampilkan angka repost' : 'Show repost count'}</span>
          </label>
        </div>
      </div>

      {/* 4. Instagram Repost Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center space-x-1.5">
            <Repeat2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {isId ? 'Fitur Instagram Repost' : 'Instagram Repost Feature'}
            </h3>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-300 font-semibold text-xs">
            <input
              type="checkbox"
              checked={data.showRepost !== false}
              onChange={(e) => updateField('showRepost', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span>{isId ? 'Tampilkan Repost' : 'Show Repost'}</span>
          </label>
        </div>

        {data.showRepost !== false && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-500" />
                  <span>{isId ? 'Akun yang Repost (Avatar)' : 'Reposter Accounts (Avatars)'}</span>
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {isId ? 'Tampil di kiri bawah media gambar dengan bubble notes & badge ungu' : 'Displayed at bottom-left of media with bubble notes & purple badge'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={data.showRepostBubbleNotes !== false}
                    onChange={(e) => updateField('showRepostBubbleNotes', e.target.checked)}
                    className="rounded text-purple-600 focus:ring-0 accent-purple-600"
                  />
                  <span>Bubble Notes</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddReposter}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold px-2 py-1 rounded-md flex items-center space-x-1 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isId ? 'Tambah Akun Repost' : 'Add Reposter'}</span>
                </button>
              </div>
            </div>

            {(data.reposters || []).length > 0 ? (
              <div className="space-y-2.5">
                {(data.reposters || []).map((reposter, index) => (
                  <div key={reposter.id || index} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {isId ? `Akun Repost #${index + 1}` : `Reposter #${index + 1}`}
                        {index === (data.reposters?.length || 0) - 1 && (
                          <span className="ml-1.5 text-[10px] text-purple-600 dark:text-purple-400 font-normal">
                            ({isId ? 'badge ungu' : 'purple badge'})
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveReposter(index)}
                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                        title={isId ? 'Hapus reposter' : 'Remove reposter'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium block">
                            Bubble Notes
                          </label>
                          <span className="text-[9.5px] text-slate-400 dark:text-slate-500 italic">
                            {isId ? 'Placeholder langsung tampil di preview' : 'Placeholder appears on preview'}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={['reposter', 'reposter1', 'reposter2'].includes((reposter.username || '').toLowerCase()) ? '' : (reposter.username || '')}
                          onChange={(e) => handleUpdateReposter(index, { username: e.target.value })}
                          placeholder={isId ? 'Catatan...' : 'Note...'}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 mt-0.5"
                        />
                      </div>
                      <ImageUploader
                        label={isId ? 'Foto Profil Reposter' : 'Reposter Profile Image'}
                        value={reposter.avatar || ''}
                        onChange={(avatar) => handleUpdateReposter(index, { avatar })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2.5 text-xs text-slate-400 dark:text-slate-500 italic border border-dashed border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
                {isId ? 'Belum ada akun repost. Klik "+ Tambah Akun Repost" untuk menambahkan avatar.' : 'No reposters added. Click "+ Add Reposter" to add avatars.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Theme Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {isId ? 'Mode Tema Postingan' : 'Theme Mode'}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => updateField('theme', 'light')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              data.theme === 'light'
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>{isId ? 'Terang (Light)' : 'Light'}</span>
          </button>

          <button
            type="button"
            onClick={() => updateField('theme', 'dark')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              data.theme === 'dark'
                ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>{isId ? 'Gelap (Dark)' : 'Dark'}</span>
          </button>
        </div>
      </div>

      {/* 6. Fake Comments Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isId ? 'Komentar Teratas' : 'Top Comments'}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {isId ? 'Komentar palsu yang tampil di postingan' : 'Fake comments shown on post'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddComment}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center space-x-1 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isId ? '+ Tambah Komentar' : 'Add Comment'}</span>
          </button>
        </div>

        {data.comments && data.comments.length > 0 ? (
          <div className="space-y-3">
            {data.comments.map((comment, index) => (
              <div key={comment.id} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2 relative">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isId ? `Komentar #${index + 1}` : `Comment #${index + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveComment(index)}
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title={isId ? 'Hapus' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={comment.username || ''}
                    onChange={(e) => handleUpdateComment(index, { username: e.target.value })}
                    placeholder="username"
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    value={comment.content || ''}
                    onChange={(e) => handleUpdateComment(index, { content: e.target.value })}
                    placeholder={isId ? 'Isi komentar...' : 'Is my lyrics quiz here'}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3 text-xs text-slate-400 dark:text-slate-500 italic border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
            {isId ? 'Belum ada komentar yang ditambahkan.' : 'No fake comments added yet.'}
          </div>
        )}
      </div>

      <SaveProfileButton onSave={onSaveProfile} />
    </div>
  );
};
