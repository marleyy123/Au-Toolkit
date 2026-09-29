import React from 'react';
import { TwitterPostData, ReplyItem, CharacterPreset } from '../types';
import { CharacterSelector, ImageUploader, MultiImageUploader, VerifiedSelector, SaveProfileButton } from './FormControls';
import { Plus, Trash2, Heart, MessageSquare, Repeat, Bookmark, Eye, Smartphone, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  data: TwitterPostData;
  onChange: (updated: TwitterPostData) => void;
  characters: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const TwitterForm: React.FC<Props> = ({
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
  const { isDark: isEditorDark } = useTheme();
  const { t, isId } = useLanguage();
  const updateField = <K extends keyof TwitterPostData>(key: K, value: TwitterPostData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const handleAddReply = () => {
    const newReply: ReplyItem = {
      id: 'rep-' + Date.now(),
      name: '',
      handle: '',
      avatar: '',
      verified: 'none',
      content: '',
      timestamp: '',
      likes: '',
      isLiked: false,
      retweets: '',
      isRetweeted: false,
      bookmarks: '',
      isBookmarked: false,
    };
    updateField('replies', [...(data.replies || []), newReply]);
  };

  const handleUpdateReply = (index: number, updatedField: Partial<ReplyItem>) => {
    const updatedReplies = [...(data.replies || [])];
    updatedReplies[index] = { ...updatedReplies[index], ...updatedField };
    updateField('replies', updatedReplies);
  };

  const handleRemoveReply = (index: number) => {
    const updatedReplies = (data.replies || []).filter((_, i) => i !== index);
    updateField('replies', updatedReplies);
  };

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

      {/* 1. Profile Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{isId ? 'Identitas Pengguna & Profil' : 'User Identity & Profile'}</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-700 font-semibold block">{isId ? 'Nama Tampilan' : 'Display Name'}</label>
            <input
              type="text"
              value={data.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Name"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-semibold block">{isId ? 'Nama Pengguna / Handle' : 'Username / Handle'}</label>
            <div className="relative mt-1">
              <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">@</span>
              <input
                type="text"
                value={(data.handle || '').replace(/^@/, '')}
                onChange={(e) => updateField('handle', (e.target.value || '').replace(/^@/, ''))}
                placeholder="username"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <ImageUploader
          label="Profile Picture Avatar"
          value={data.avatar || ''}
          onChange={(url) => updateField('avatar', url)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <VerifiedSelector
            value={data.verified}
            onChange={(val) => updateField('verified', val)}
            onlyNoneAndBlue={true}
          />

          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-700 font-semibold">
            <input
              type="checkbox"
              checked={!!data.isLocked}
              onChange={(e) => updateField('isLocked', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span className="text-xs">{isId ? 'Akun Privat (Ikon Gembok)' : 'Private Account (Lock Icon)'}</span>
          </label>
        </div>
      </div>

      {/* 2. Tweet Content & Attachments */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{isId ? 'Konten Tweet & Media' : 'Post Content & Media'}</h3>

        <div>
          <div className="flex justify-between items-center text-xs text-slate-700 font-semibold mb-1">
            <span>{isId ? 'Membalas ke (Opsional)' : 'Replying To (Optional)'}</span>
            <span className="text-[10px] text-slate-400">{isId ? 'Kosongkan jika bukan balasan' : 'Leave blank if top-level tweet'}</span>
          </div>
          <input
            type="text"
            value={data.replyingTo || ''}
            onChange={(e) => updateField('replyingTo', e.target.value)}
            placeholder="e.g. username (without @)"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="text-xs text-slate-700 font-semibold mb-1 block">{isId ? 'Teks Tweet' : 'Tweet Text'}</label>
          <textarea
            rows={3}
            value={data.content || ''}
            onChange={(e) => updateField('content', e.target.value)}
            placeholder="Your text goes here..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white leading-relaxed resize-y"
          />
        </div>

        <MultiImageUploader
          label={isId ? 'Lampiran Media (Maks 4 Gambar)' : 'Attached Media (Up to 4 Images)'}
          images={data.mediaImages || []}
          onChange={(imgs) => updateField('mediaImages', imgs)}
          maxImages={4}
        />

        <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-semibold w-max mt-2">
          <input
            type="checkbox"
            checked={data.showPlayButton ?? false}
            onChange={(e) => updateField('showPlayButton', e.target.checked)}
            className="rounded text-purple-600 focus:ring-0 accent-purple-600"
          />
          <span className="text-xs">{isId ? 'Tampilkan Ikon Tombol Putar Video' : 'Show Video Play Button Icon'}</span>
        </label>
      </div>

      {/* 2b. Quote Tweet Box Settings */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{isId ? 'Pengaturan Tweet Kutipan' : 'Quote Tweet Settings'}</h3>
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-slate-700 font-semibold">
            <input
              type="checkbox"
              checked={!!data.showQuoteTweet}
              onChange={(e) => updateField('showQuoteTweet', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span className="text-xs">{isId ? 'Aktifkan Tweet Kutipan' : 'Enable Quote Tweet'}</span>
          </label>
        </div>

        {data.showQuoteTweet && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-700 font-semibold block">Quote Name</label>
                <input
                  type="text"
                  value={data.quoteTweetName || ''}
                  onChange={(e) => updateField('quoteTweetName', e.target.value)}
                  placeholder="Name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block">Quote Handle & Date</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input
                    type="text"
                    value={(data.quoteTweetHandle || '').replace(/^@/, '')}
                    onChange={(e) => updateField('quoteTweetHandle', (e.target.value || '').replace(/^@/, ''))}
                    placeholder="username"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    value={data.quoteTweetDate || ''}
                    onChange={(e) => updateField('quoteTweetDate', e.target.value)}
                    placeholder="15/07/26"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <VerifiedSelector
              value={data.quoteTweetVerified || 'none'}
              onChange={(val) => updateField('quoteTweetVerified', val)}
            />

            <ImageUploader
              label="Quote Profile Avatar"
              value={data.quoteTweetAvatar || ''}
              onChange={(url) => updateField('quoteTweetAvatar', url)}
            />

            <div>
              <label className="text-xs text-slate-700 font-semibold mb-1 block">Quote Tweet Text</label>
              <textarea
                rows={2}
                value={data.quoteTweetContent || ''}
                onChange={(e) => updateField('quoteTweetContent', e.target.value)}
                placeholder="Quote tweet content..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <MultiImageUploader
              label="Quote Attached Images (Grid 2-col)"
              images={data.quoteTweetImages || []}
              onChange={(imgs) => updateField('quoteTweetImages', imgs)}
              maxImages={2}
            />

            <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-semibold w-max">
              <input
                type="checkbox"
                checked={data.quoteTweetShowPlayButton ?? true}
                onChange={(e) => updateField('quoteTweetShowPlayButton', e.target.checked)}
                className="rounded text-purple-600 focus:ring-0 accent-purple-600"
              />
              <span className="text-xs">Show Video Play Button Icon</span>
            </label>
          </div>
        )}
      </div>

      {/* 3. Date, Time & Metadata */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{isId ? 'Waktu & Perangkat Klien' : 'Timestamp & Client Device'}</h3>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-slate-700 font-semibold">{isId ? 'Waktu' : 'Time'}</label>
            <input
              type="text"
              value={data.time || ''}
              onChange={(e) => updateField('time', e.target.value)}
              placeholder="11:24 AM"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-semibold">{isId ? 'Tanggal' : 'Date'}</label>
            <input
              type="text"
              value={data.date || ''}
              onChange={(e) => updateField('date', e.target.value)}
              placeholder="Jul 26, 2026"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 font-semibold">{isId ? 'Perangkat Klien' : 'Client Device'}</label>
            <input
              type="text"
              value={data.clientApp || ''}
              onChange={(e) => updateField('clientApp', e.target.value)}
              placeholder="Twitter for iPhone"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white mt-1"
            />
          </div>
        </div>
      </div>

      {/* 4. Engagement Metrics & States */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{isId ? 'Statistik Interaksi' : 'Engagement Stats'}</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-slate-500 font-semibold">{isId ? 'Posting Ulang / Retweet' : 'Reposts / Retweets'}</label>
            <input
              type="text"
              value={data.retweets || ''}
              onChange={(e) => updateField('retweets', e.target.value)}
              placeholder="6K"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1 font-semibold"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-500 font-semibold">{isId ? 'Suka' : 'Likes'}</label>
            <input
              type="text"
              value={data.likes || ''}
              onChange={(e) => updateField('likes', e.target.value)}
              placeholder="40K"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1 font-semibold"
            />
          </div>
        </div>

        {/* Interaction Toggles */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-700 font-semibold">
            <input
              type="checkbox"
              checked={!!data.isLikedByMe}
              onChange={(e) => updateField('isLikedByMe', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600 cursor-pointer"
            />
            <span>{isId ? 'Disukai oleh saya' : 'Liked by me'}</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-700 font-semibold">
            <input
              type="checkbox"
              checked={!!data.isRetweetedByMe}
              onChange={(e) => updateField('isRetweetedByMe', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600 cursor-pointer"
            />
            <span>{isId ? 'Diposting ulang oleh saya' : 'Reposted by me'}</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-700 font-semibold">
            <input
              type="checkbox"
              checked={!!(data.isBookmarkedByMe || data.isSavedByMe)}
              onChange={(e) => {
                const isChecked = e.target.checked;
                onChange({
                  ...data,
                  isBookmarkedByMe: isChecked,
                  isSavedByMe: isChecked,
                });
              }}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600 cursor-pointer"
            />
            <span>{isId ? 'Disimpan oleh saya' : 'Saved by me'}</span>
          </label>
        </div>
      </div>

      {/* 5. Theme Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{isId ? 'Mode Tema' : 'Theme Mode'}</h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => updateField('theme', 'light')}
            className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 transition-all ${
              data.theme === 'light' ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>{isId ? 'Terang' : 'Light'}</span>
          </button>

          <button
            type="button"
            onClick={() => updateField('theme', 'dim')}
            className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 transition-all ${
              data.theme === 'dim' ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>{isId ? 'Biru Redup' : 'Dim Blue'}</span>
          </button>

          <button
            type="button"
            onClick={() => updateField('theme', 'dark')}
            className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 transition-all ${
              data.theme === 'dark' ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>{isId ? 'Gelap Pekat' : 'Lights Out'}</span>
          </button>
        </div>
      </div>

      {/* 6. Fake Reply Threading Editor for AU Stories */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{isId ? 'Balasan X (Twitter)' : 'Reply X (Twitter)'}</h3>
            <p className="text-[10px] text-slate-400">{isId ? 'Tambahkan balasan karakter di bawah tweet utama' : 'Add character replies below the main tweet'}</p>
          </div>
          <button
            type="button"
            onClick={handleAddReply}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center space-x-1 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isId ? 'Tambah Balasan' : 'Add Reply'}</span>
          </button>
        </div>

        {data.replies && data.replies.length > 0 ? (
          <div className="space-y-3">
            {data.replies.map((reply, index) => {
              const isDarkTheme = isEditorDark;
              const inputClass = isDarkTheme
                ? 'bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500'
                : 'bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500';
              const fullInputClass = isDarkTheme
                ? 'w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500'
                : 'w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500';
              const textareaClass = isDarkTheme
                ? 'w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500'
                : 'w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500';
              const labelClass = isDarkTheme ? 'text-slate-400' : 'text-slate-500';

              return (
                <div
                  key={reply.id}
                  data-sync-theme={isDarkTheme ? 'dark' : 'light'}
                  className={`rounded-xl p-3 space-y-2 relative border transition-all ${
                    isDarkTheme ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`flex items-center justify-between border-b pb-2 ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className={`text-xs font-bold ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>{isId ? 'Balasan' : 'Reply'} #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveReply(index)}
                      className={`transition-colors ${isDarkTheme ? 'text-slate-400 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={reply.name || ''}
                      onChange={(e) => handleUpdateReply(index, { name: e.target.value })}
                      placeholder="Name"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={reply.handle ? reply.handle.replace(/^@/, '') : ''}
                      onChange={(e) => handleUpdateReply(index, { handle: e.target.value.replace(/^@/, '') })}
                      placeholder="username"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={reply.replyingTo || ''}
                      onChange={(e) => handleUpdateReply(index, { replyingTo: e.target.value })}
                      placeholder={`Replying to: @${data.handle || 'username'}`}
                      className={inputClass}
                    />
                    <select
                      value={reply.verified === 'blue' ? 'blue' : 'none'}
                      onChange={(e) => handleUpdateReply(index, { verified: e.target.value as any })}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="none">{isId ? 'Tanpa Lencana' : 'No Badge'}</option>
                      <option value="blue">{isId ? 'Verifikasi Biru' : 'Blue Verified'}</option>
                    </select>
                  </div>

                  <ImageUploader
                    label="Avatar"
                    value={reply.avatar}
                    onChange={(url) => handleUpdateReply(index, { avatar: url })}
                  />

                  <textarea
                    rows={2}
                    value={reply.content || ''}
                    onChange={(e) => handleUpdateReply(index, { content: e.target.value })}
                    placeholder="Your text goes here..."
                    className={textareaClass}
                  />

                  {/* Reply Metrics: Time, Likes, Reposts, Saves */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className={`text-[10px] font-semibold block mb-0.5 ${labelClass}`}>{isId ? 'Waktu' : 'Time'}</label>
                      <input
                        type="text"
                        value={reply.timestamp || ''}
                        onChange={(e) => handleUpdateReply(index, { timestamp: e.target.value })}
                        placeholder="12m"
                        className={fullInputClass}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] font-semibold block mb-0.5 ${labelClass}`}>{isId ? 'Suka' : 'Likes'}</label>
                      <input
                        type="text"
                        value={reply.likes || ''}
                        onChange={(e) => handleUpdateReply(index, { likes: e.target.value })}
                        placeholder="40K"
                        className={fullInputClass}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] font-semibold block mb-0.5 ${labelClass}`}>{isId ? 'Posting Ulang' : 'Reposts'}</label>
                      <input
                        type="text"
                        value={reply.retweets || ''}
                        onChange={(e) => handleUpdateReply(index, { retweets: e.target.value })}
                        placeholder="6K"
                        className={fullInputClass}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] font-semibold block mb-0.5 ${labelClass}`}>{isId ? 'Disimpan' : 'Saves / Bookmarks'}</label>
                      <input
                        type="text"
                        value={reply.bookmarks || ''}
                        onChange={(e) => handleUpdateReply(index, { bookmarks: e.target.value })}
                        placeholder="1K"
                        className={fullInputClass}
                      />
                    </div>
                  </div>

                  {/* Status Toggles: Liked, Repost, Save */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Liked Checkbox */}
                    <label className={`flex items-center space-x-1.5 cursor-pointer text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                      reply.isLiked
                        ? isDarkTheme ? 'bg-purple-950/60 border-purple-800 text-purple-300' : 'bg-purple-50 border-purple-300 text-purple-700 shadow-2xs'
                        : isDarkTheme ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={!!reply.isLiked}
                        onChange={(e) => handleUpdateReply(index, { isLiked: e.target.checked })}
                        className="rounded text-purple-600 focus:ring-0 cursor-pointer accent-purple-600"
                      />
                      <span>{isId ? 'Disukai' : 'Liked'}</span>
                    </label>

                    {/* Repost Checkbox */}
                    <label className={`flex items-center space-x-1.5 cursor-pointer text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                      reply.isRetweeted
                        ? isDarkTheme ? 'bg-purple-950/60 border-purple-800 text-purple-300' : 'bg-purple-50 border-purple-300 text-purple-700 shadow-2xs'
                        : isDarkTheme ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={!!reply.isRetweeted}
                        onChange={(e) => handleUpdateReply(index, { isRetweeted: e.target.checked })}
                        className="rounded text-purple-600 focus:ring-0 cursor-pointer accent-purple-600"
                      />
                      <span>{isId ? 'Posting Ulang' : 'Repost'}</span>
                    </label>

                    {/* Save Checkbox */}
                    <label className={`flex items-center space-x-1.5 cursor-pointer text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                      reply.isBookmarked
                        ? isDarkTheme ? 'bg-purple-950/60 border-purple-800 text-purple-300' : 'bg-purple-50 border-purple-300 text-purple-700 shadow-2xs'
                        : isDarkTheme ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={!!reply.isBookmarked}
                        onChange={(e) => handleUpdateReply(index, { isBookmarked: e.target.checked })}
                        className="rounded text-purple-600 focus:ring-0 cursor-pointer accent-purple-600"
                      />
                      <span>{isId ? 'Simpan' : 'Save'}</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            {isId ? 'Belum ada balasan. Klik "Tambah Balasan" untuk membuat percakapan Twitter/X!' : 'No replies added yet. Click "Add Reply" to create a conversation x twitter!'}
          </div>
        )}
      </div>

      <SaveProfileButton onSave={onSaveProfile} />
    </div>
  );
};
