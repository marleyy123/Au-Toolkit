import React from 'react';
import { TikTokProfileData, TikTokGridVideo, TikTokHighlight, CharacterPreset } from '../types';
import { CharacterSelector, ImageUploader, SaveProfileButton } from './FormControls';
import { Plus, Trash2, Moon, Sun, ShoppingBag, HelpCircle, Video, UserCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  data: TikTokProfileData;
  onChange: (updated: TikTokProfileData) => void;
  characters?: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter?: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter?: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const TikTokProfileForm: React.FC<Props> = ({
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

  const updateField = <K extends keyof TikTokProfileData>(
    key: K,
    value: TikTokProfileData[K]
  ) => {
    onChange({ ...data, [key]: value });
  };

  const handleAddVideo = () => {
    const newVid: TikTokGridVideo = {
      id: `tt-${Date.now()}`,
      thumbnail: '',
      views: '',
      isPinned: false,
    };
    updateField('videos', [...(data.videos || []), newVid]);
  };

  const handleUpdateVideo = (id: string, updatedVid: Partial<TikTokGridVideo>) => {
    const nextVideos = (data.videos || []).map((v) =>
      v.id === id ? { ...v, ...updatedVid } : v
    );
    updateField('videos', nextVideos);
  };

  const handleDeleteVideo = (id: string) => {
    const nextVideos = (data.videos || []).filter((v) => v.id !== id);
    updateField('videos', nextVideos);
  };

  const handleAddHighlight = () => {
    const newHl: TikTokHighlight = {
      id: `hl-${Date.now()}`,
      image: '',
      title: '',
    };
    updateField('highlights', [...(data.highlights || []), newHl]);
  };

  const handleUpdateHighlight = (id: string, updatedHl: Partial<TikTokHighlight>) => {
    const nextHls = (data.highlights || []).map((h) =>
      h.id === id ? { ...h, ...updatedHl } : h
    );
    updateField('highlights', nextHls);
  };

  const handleDeleteHighlight = (id: string) => {
    const nextHls = (data.highlights || []).filter((h) => h.id !== id);
    updateField('highlights', nextHls);
  };

  return (
    <div className="space-y-4">
      {/* Quick Character Presets */}
      <CharacterSelector
        characters={characters || []}
        activeCharacterId={activeCharacterId}
        onSelect={onSelectCharacter || (() => {})}
        onSaveCurrent={onSaveCharacter || (() => {})}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      {/* 1. Account Info Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {isId ? 'Informasi Profil' : 'Profile Information'}
        </h3>

        {/* Profile Avatar Image */}
        <ImageUploader
          label={isId ? 'Foto Profil' : 'Profile Picture'}
          currentImage={data.avatarUrl}
          onImageChange={(newImg) => updateField('avatarUrl', newImg)}
          aspectRatio="1:1"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Profile Name */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              {isId ? 'Nama' : 'Name'}
            </label>
            <input
              type="text"
              value={data.profileName || ''}
              onChange={(e) => updateField('profileName', e.target.value)}
              placeholder="Name"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          {/* Handle */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              {isId ? 'Nama Pengguna (@)' : 'Username Handle (@)'}
            </label>
            <input
              type="text"
              value={data.handle || ''}
              onChange={(e) => updateField('handle', e.target.value)}
              placeholder="@username"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          {/* Verified Badge Toggle */}
          <div className="sm:col-span-2 flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-[#20D5EC] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                  <path d="M10.2 16.2L5.8 11.8l1.4-1.4 3 3 6.6-6.6 1.4 1.4z" />
                </svg>
              </span>
              <div>
                <span className="text-xs font-bold text-slate-800 block">{isId ? 'Lencana Terverifikasi' : 'Verified Badge'}</span>
                <span className="text-[11px] text-slate-500 block">{isId ? 'Tampilkan lencana terverifikasi di samping @nama_pengguna' : 'Show verified badge next to @handle'}</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!data.isVerified}
                onChange={(e) => updateField('isVerified', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 2. Stats Bar Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {isId ? 'Statistik Profil' : 'Profile Statistics'}
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              {isId ? 'Mengikuti' : 'Following'}
            </label>
            <input
              type="text"
              value={data.followingCount || ''}
              onChange={(e) => updateField('followingCount', e.target.value)}
              placeholder="245"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              {isId ? 'Pengikut' : 'Followers'}
            </label>
            <input
              type="text"
              value={data.followersCount || ''}
              onChange={(e) => updateField('followersCount', e.target.value)}
              placeholder="12.8K"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              {isId ? 'Suka' : 'Likes'}
            </label>
            <input
              type="text"
              value={data.likesCount || ''}
              onChange={(e) => updateField('likesCount', e.target.value)}
              placeholder="489.2K"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* 3. Bio & Links Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {isId ? 'Bio & Tautan Eksternal' : 'Bio & External Links'}
        </h3>

        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">
            {isId ? 'Deskripsi Bio (Mendukung multi-baris)' : 'Bio Description (Multi-line supported)'}
          </label>
          <textarea
            rows={3}
            value={data.bio || ''}
            onChange={(e) => updateField('bio', e.target.value)}
            placeholder={isId ? 'Deskripsi bio...' : 'Bio description...'}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">
            {isId ? 'URL Tautan Situs Web' : 'Website Link URL'}
          </label>
          <input
            type="text"
            value={data.linkUrl || ''}
            onChange={(e) => updateField('linkUrl', e.target.value)}
            placeholder="https://linkhere.com"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
        </div>

        {/* Feature Toggles (Showcase, LIVE, Follow State) */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700 font-semibold text-xs">
            <input
              type="checkbox"
              checked={data.showOrders !== false}
              onChange={(e) => updateField('showOrders', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <ShoppingBag className="w-4 h-4 text-purple-600" />
            <span>{isId ? 'Etalase' : 'Showcase'}</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700 font-semibold text-xs">
            <input
              type="checkbox"
              checked={data.showQnA !== false}
              onChange={(e) => updateField('showQnA', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span>LIVE</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700 font-semibold text-xs">
            <input
              type="checkbox"
              checked={data.isFollowing === true}
              onChange={(e) => updateField('isFollowing', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <UserCheck className="w-4 h-4 text-purple-600" />
            <span>{isId ? 'Status: Mengikuti' : 'State: Following'}</span>
          </label>
        </div>
      </div>

      {/* 4. Story Highlights Manager */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer font-bold text-xs text-slate-800">
            <input
              type="checkbox"
              checked={data.showHighlights !== false}
              onChange={(e) => updateField('showHighlights', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>{isId ? 'Aktifkan Sorotan Cerita' : 'Enable Story Highlights'}</span>
          </label>

          {data.showHighlights !== false && (
            <button
              type="button"
              onClick={handleAddHighlight}
              className="text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isId ? 'Tambah Sorotan' : 'Add Highlight'}</span>
            </button>
          )}
        </div>

        {data.showHighlights !== false && (
          <div className="space-y-3 pt-1">
            {(data.highlights || []).map((hl, idx) => (
              <div
                key={hl.id || idx}
                className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {isId ? `Sorotan #${idx + 1}` : `Highlight #${idx + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteHighlight(hl.id)}
                    className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                    title={isId ? 'Hapus sorotan' : 'Remove highlight'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ImageUploader
                    label={isId ? 'Gambar Sorotan' : 'Highlight Image'}
                    currentImage={hl.image}
                    onImageChange={(newImg) =>
                      handleUpdateHighlight(hl.id, { image: newImg })
                    }
                    aspectRatio="1:1"
                  />

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {isId ? 'Judul Label Sorotan' : 'Highlight Label Title'}
                    </label>
                    <input
                      type="text"
                      value={hl.title || ''}
                      onChange={(e) =>
                        handleUpdateHighlight(hl.id, { title: e.target.value })
                      }
                      placeholder={`hl-${idx + 1}`}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            ))}
            {(!data.highlights || data.highlights.length === 0) && (
              <div className="text-center py-2 text-xs text-slate-400">
                {isId ? 'Belum ada sorotan. Klik "+ Tambah Sorotan" untuk membuatnya.' : 'No highlights added. Click "+ Add Highlight" to create one.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. UI Appearance Theme */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {isId ? 'Mode Tema' : 'Theme Mode'}
        </h3>

        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => updateField('theme', 'light')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 border cursor-pointer transition-all ${
              data.theme !== 'dark'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>{isId ? 'Terang' : 'Light'}</span>
          </button>

          <button
            type="button"
            onClick={() => updateField('theme', 'dark')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 border cursor-pointer transition-all ${
              data.theme === 'dark'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>{isId ? 'Gelap' : 'Dark'}</span>
          </button>
        </div>
      </div>

      {/* 6. Video Grid Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Video className="w-4 h-4 text-purple-600" />
              <span>{isId ? 'Thumbnail Kisi Video' : 'Video Grid Thumbnails'}</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              {isId
                ? 'Klik "+ Tambah Video" untuk menambahkan thumbnail video ke kisi profil.'
                : "Click '+ Add Video' to add video thumbnails to the profile grid."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddVideo}
            className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 px-2.5 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isId ? 'Tambah Video' : 'Add Video'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {(data.videos || []).map((vid, idx) => (
            <div
              key={vid.id || idx}
              className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {isId ? `Video #${idx + 1}` : `Video #${idx + 1}`}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteVideo(vid.id)}
                  className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                  title={isId ? 'Hapus video' : 'Remove video'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <ImageUploader
                label={isId ? 'Gambar Thumbnail' : 'Thumbnail Image'}
                currentImage={vid.thumbnail}
                onImageChange={(newImg) =>
                  handleUpdateVideo(vid.id, { thumbnail: newImg })
                }
                aspectRatio="1:1"
              />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                    {isId ? 'Jumlah Tayangan (cth. 1.3M, 858.0K)' : 'View Count (e.g. 1.3M, 858.0K)'}
                  </label>
                  <input
                    type="text"
                    value={vid.views || ''}
                    onChange={(e) =>
                      handleUpdateVideo(vid.id, { views: e.target.value })
                    }
                    placeholder="0"
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                  />
                </div>

                <div className="flex items-end pb-1">
                  <label className="flex items-center space-x-1.5 text-xs font-normal text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(vid.isPinned)}
                      onChange={(e) =>
                        handleUpdateVideo(vid.id, { isPinned: e.target.checked })
                      }
                      className="rounded text-purple-600 focus:ring-0 accent-purple-600"
                    />
                    <span>{isId ? 'Lencana Disematkan' : 'Pinned Badge'}</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Profile Button */}
      {onSaveProfile && (
        <div className="pt-2">
          <SaveProfileButton onSave={onSaveProfile} />
        </div>
      )}
    </div>
  );
};
