import React from 'react';
import { InstagramLiveData, VerifiedType, CharacterPreset, InstagramLiveComment } from '../../../types';
import { CharacterSelector, ImageUploader, VerifiedSelector, SaveProfileButton } from '../../../components/FormControls';
import { Plus, Trash2, Radio, MessageSquare, Sparkles } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface Props {
  data: InstagramLiveData;
  onChange: (data: InstagramLiveData) => void;
  characters: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter?: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter?: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const InstagramLiveForm: React.FC<Props> = ({
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

  const handleChange = (field: keyof InstagramLiveData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleAddComment = (type: 'comment' | 'join') => {
    const newComment: InstagramLiveComment = {
      id: 'lc-' + Date.now(),
      type,
      username: '',
      avatar: '',
      content: '',
    };
    onChange({
      ...data,
      comments: [...data.comments, newComment],
    });
  };

  const handleUpdateComment = (id: string, field: keyof InstagramLiveComment, value: any) => {
    onChange({
      ...data,
      comments: data.comments.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    });
  };

  const handleDeleteComment = (id: string) => {
    onChange({
      ...data,
      comments: data.comments.filter((c) => c.id !== id),
    });
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200">
      {/* Quick Character Selection */}
      <CharacterSelector
        characters={characters || []}
        activeCharacterId={activeCharacterId}
        onSelect={onSelectCharacter}
        onSaveCurrent={onSaveCharacter || (() => {})}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      {/* Host Details */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
          {isId ? 'Profil Host Siaran Langsung' : 'Live Stream Host Profile'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isId ? 'Nama Pengguna Host' : 'Host Username'}
            </label>
            <input
              type="text"
              value={data.username || ''}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="username"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <VerifiedSelector
              value={data.verified || 'none'}
              onChange={(val) => handleChange('verified', val)}
              allowIg={true}
              onlyNoneAndBlue={true}
            />
          </div>
        </div>

        <ImageUploader
          label={isId ? 'Foto Profil Host' : 'Host Profile Picture'}
          value={data.avatar || ''}
          onChange={(val) => handleChange('avatar', val)}
        />
      </div>

      {/* Stream Metrics & Media */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
          {isId ? 'Metrik & Media Siaran Langsung' : 'Live Stream Metrics & Media'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isId ? 'Jumlah Penonton' : 'Viewer Count'}
            </label>
            <input
              type="text"
              value={data.viewerCount || ''}
              onChange={(e) => handleChange('viewerCount', e.target.value)}
              placeholder="80"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isId ? 'Animasi Emoji Melayang' : 'Floating Emojis Animation'}
            </label>
            <button
              type="button"
              onClick={() => handleChange('isAutoEmojiEnabled', !data.isAutoEmojiEnabled)}
              className={`w-full py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                data.isAutoEmojiEnabled !== false
                  ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {data.isAutoEmojiEnabled !== false
                  ? (isId ? 'Auto Emoji: AKTIF 🔥' : 'Auto Emojis: ON 🔥')
                  : (isId ? 'Auto Emoji: MATI' : 'Auto Emojis: OFF')}
              </span>
            </button>
          </div>
        </div>

        <ImageUploader
          label={isId ? 'Latar Belakang Kamera / Media Siaran' : 'Live Stream Camera / Media Background'}
          value={data.mediaImage || ''}
          onChange={(val) => handleChange('mediaImage', val)}
        />
      </div>

      {/* Live Comments & Join Activity */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
          {isId ? 'Komentar & Aktivitas Penonton Siaran' : 'Live Comments & Viewer Activity'}
        </h3>
        <div className="space-y-3">
          {data.comments.map((comment, index) => (
            <div
              key={comment.id}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                  {comment.type === 'join' ? (
                    <span className="text-purple-600 dark:text-purple-400 font-extrabold flex items-center space-x-1">
                      <Radio className="w-3 h-3" />
                      <span>{isId ? `Penonton Bergabung #${index + 1}` : `Viewer Joined #${index + 1}`}</span>
                    </span>
                  ) : (
                    <span className="text-purple-600 dark:text-purple-400 font-extrabold flex items-center space-x-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>{isId ? `Komentar #${index + 1}` : `Comment #${index + 1}`}</span>
                    </span>
                  )}
                </span>

                <button
                  type="button"
                  onClick={() => handleDeleteComment(comment.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  title={isId ? 'Hapus' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {isId ? 'Nama Pengguna' : 'Username'}
                  </label>
                  <input
                    type="text"
                    value={comment.username || ''}
                    onChange={(e) => handleUpdateComment(comment.id, 'username', e.target.value)}
                    placeholder={comment.type === 'join' ? 'viewer_user' : 'user_comment'}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {comment.type === 'comment' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {isId ? 'Isi Pesan Komentar' : 'Message Content'}
                    </label>
                    <input
                      type="text"
                      value={comment.content || ''}
                      onChange={(e) => handleUpdateComment(comment.id, 'content', e.target.value)}
                      placeholder={isId ? 'Semangat' : 'Semangat'}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>

              {comment.type === 'comment' && (
                <ImageUploader
                  label={isId ? 'Foto Profil Komentator' : 'Commenter Avatar'}
                  value={comment.avatar || ''}
                  onChange={(val) => handleUpdateComment(comment.id, 'avatar', val)}
                />
              )}
            </div>
          ))}

          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={() => handleAddComment('comment')}
              className="flex-1 py-2 px-3 rounded-lg border border-purple-600 bg-purple-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 hover:bg-purple-700 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isId ? '+ Tambah Komentar' : 'Add Comment'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddComment('join')}
              className="flex-1 py-2 px-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center space-x-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isId ? '+ Status Penonton Bergabung' : 'Add Viewer Status'}</span>
            </button>
          </div>
        </div>
      </div>

      <SaveProfileButton onSave={onSaveProfile} />
    </div>
  );
};
