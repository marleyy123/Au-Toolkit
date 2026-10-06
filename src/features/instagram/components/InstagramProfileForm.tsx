import React, { useEffect, useRef } from 'react';
import { InstagramProfileData, InstagramHighlight, InstagramGridPost, CharacterPreset } from '../../../types';
import { CharacterSelector, ImageUploader, MultiImageUploader, VerifiedSelector, SaveProfileButton } from '../../../components/FormControls';
import { Plus, Trash2, Upload, Pin, Layers, Sparkles, Image as ImageIcon, Moon, Sun } from 'lucide-react';
import { compressAndReadAsDataURL } from '../../../utils/imageCompressor';
import {
  createSafeObjectURL,
  revokeSafeObjectURL,
  isBlobUrl,
  persistLocalImageBlob,
  getLocalMediaOwnerUid,
} from '../../../utils/imageManager';
import { auth, getStoredAuthUser } from '../../../firebase';
import { useLanguage } from '../../../context/LanguageContext';

interface Props {
  data: InstagramProfileData;
  onChange: (updated: InstagramProfileData) => void;
  characters?: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter?: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter?: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

const SAMPLE_POST_IMAGES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
];

export const InstagramProfileForm: React.FC<Props> = ({
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
  const fileInputMultipleRef = useRef<HTMLInputElement>(null);
  const latest = useRef({ data, onChange });
  latest.current = { data, onChange };
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const updateField = <K extends keyof InstagramProfileData>(key: K, value: InstagramProfileData[K]) => {
    const updated = { ...latest.current.data, [key]: value };
    latest.current.data = updated;
    latest.current.onChange(updated);
  };


  // Handle adding new Highlight
  const handleAddHighlight = () => {
    const newHighlight: InstagramHighlight = {
      id: 'hl-' + Date.now(),
      title: '',
      image: '',
    };
    latest.current.onChange({
      ...latest.current.data,
      highlights: [...(latest.current.data.highlights || []), newHighlight],
      showHighlights: true,
    });
  };

  // Handle updating single Highlight
  const handleUpdateHighlight = (index: number, updated: Partial<InstagramHighlight>) => {
    const updatedHighlights = [...(data.highlights || [])];
    updatedHighlights[index] = { ...updatedHighlights[index], ...updated };
    updateField('highlights', updatedHighlights);
  };

  // Handle removing Highlight
  const handleRemoveHighlight = (index: number) => {
    const updatedHighlights = (data.highlights || []).filter((_, i) => i !== index);
    updateField('highlights', updatedHighlights);
  };

  // Handle updating Grid Post
  const handleUpdateGridPost = (index: number, updated: Partial<InstagramGridPost>) => {
    const updatedPosts = [...(data.gridPosts || [])];
    updatedPosts[index] = { ...updatedPosts[index], ...updated };
    const validCount = updatedPosts.filter((p) => !!p.image).length;
    onChange({
      ...data,
      gridPosts: updatedPosts,
      postsCount: String(validCount),
    });
  };

  // Handle adding Grid Post (Prepends to start of array for instant live preview)
  const handleAddGridPost = () => {
    const newPost: InstagramGridPost = {
      id: 'gp-' + Date.now(),
      image: '',
    };
    const updatedPosts = [newPost, ...(data.gridPosts || [])];
    const validCount = updatedPosts.filter((p) => !!p.image).length;
    onChange({
      ...data,
      gridPosts: updatedPosts,
      postsCount: String(validCount),
    });
  };

  // Handle removing Grid Post
  const handleRemoveGridPost = (index: number) => {
    const postToRemove = (data.gridPosts || [])[index];
    if (postToRemove && isBlobUrl(postToRemove.image)) {
      revokeSafeObjectURL(postToRemove.image);
    }
    const updatedPosts = (data.gridPosts || []).filter((_, i) => i !== index);
    const validCount = updatedPosts.filter((p) => !!p.image).length;
    onChange({
      ...data,
      gridPosts: updatedPosts,
      postsCount: String(validCount),
    });
  };

  // Handle bulk upload grid posts
  const handleBulkUploadGridPosts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    // 1. Instant 0ms Object URLs for immediate responsiveness
    const newPosts: { id: string; image: string; file: File }[] = files.map((file) => ({
      id: 'gp-' + Math.random().toString(36).substring(2, 9),
      image: createSafeObjectURL(file),
      file,
    }));

    const updatedPosts = [...newPosts.map(({ id, image }) => ({ id, image })), ...(data.gridPosts || [])];
    const validCount = updatedPosts.filter((p) => !!p.image).length;
    onChange({
      ...data,
      gridPosts: updatedPosts,
      postsCount: String(validCount),
    });

    // 2. Asynchronously compress and persist in background
    latest.current.data = { ...data, gridPosts: updatedPosts, postsCount: String(validCount) };
    newPosts.forEach(({ id, image: blobUrl, file }) => {
      compressAndReadAsDataURL(file)
        .then(async (dataUrl) => {
          if (dataUrl) {
            const uid = getLocalMediaOwnerUid() || auth.currentUser?.uid || getStoredAuthUser()?.uid || '';
            const activeTab = localStorage.getItem('au_last_active_tab') || 'instagram-profile';
            const folder = localStorage.getItem(`au_active_folder_${uid}_${activeTab}`) || 'folder-1';
            const response = await fetch(dataUrl);
            const persistentRef = await persistLocalImageBlob(uid, await response.blob(), `${activeTab}:${folder}:grid`);
            const current = latest.current.data;
            if (!mounted.current || !current.gridPosts?.some((p) => p.id === id && p.image === blobUrl)) {
              revokeSafeObjectURL(blobUrl);
              return;
            }
            const updated = {
              ...current,
              gridPosts: current.gridPosts.map((p) => (p.id === id ? { ...p, image: persistentRef } : p)),
            };
            latest.current.data = updated;
            latest.current.onChange(updated);
            revokeSafeObjectURL(blobUrl);
          }
        })
        .catch((err) => console.warn('Background grid post compression error:', err));
    });

    e.target.value = '';
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Quick Preset Selector */}
      <CharacterSelector
        characters={characters || []}
        activeCharacterId={activeCharacterId}
        onSelect={onSelectCharacter}
        onSaveCurrent={onSaveCharacter || (() => {})}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      {/* Theme Mode Selector (Light / Dark) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-800 block">{isId ? 'Mode Tema' : 'Theme Mode'}</span>
          <span className="text-[10px] text-slate-500">{isId ? 'Pilih tampilan profil Instagram' : 'Select Instagram profile appearance'}</span>
        </div>
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => updateField('theme', 'light')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              data.theme === 'light'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>{isId ? 'Terang' : 'Light'}</span>
          </button>
          <button
            type="button"
            onClick={() => updateField('theme', 'dark')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              (data.theme || 'dark') === 'dark'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>{isId ? 'Gelap' : 'Dark'}</span>
          </button>
        </div>
      </div>

      {/* 1. Profile Header & Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{isId ? 'Detail Profil Utama' : 'Main Profile Details'}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">{isId ? 'Nama Pengguna' : 'Username'}</label>
            <input
              type="text"
              value={data.username || ''}
              onChange={(e) => updateField('username', e.target.value)}
              placeholder="username"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">{isId ? 'Nama' : 'Name'}</label>
            <input
              type="text"
              value={data.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Name"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white mt-1"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1 block">{isId ? 'Foto Profil (Avatar)' : 'Profile Picture (Avatar)'}</label>
          <ImageUploader
            value={data.avatar || ''}
            onChange={(url) => updateField('avatar', url)}
            aspectHint="1:1 Circle"
            storageCategory="avatars"
          />
        </div>

        <div>
          <VerifiedSelector
            value={data.verified || 'none'}
            onChange={(val) => updateField('verified', val)}
            onlyNoneAndBlue={true}
          />
        </div>

        {/* Numeric Stats */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div>
            <label className="text-[11px] font-semibold text-slate-600">{isId ? 'Postingan' : 'Posts'}</label>
            <input
              type="text"
              value={data.postsCount || ''}
              onChange={(e) => updateField('postsCount', e.target.value)}
              placeholder="12"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-0.5"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600">{isId ? 'Pengikut' : 'Followers'}</label>
            <input
              type="text"
              value={data.followersCount || ''}
              onChange={(e) => updateField('followersCount', e.target.value)}
              placeholder="12K"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-0.5"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600">{isId ? 'Mengikuti' : 'Following'}</label>
            <input
              type="text"
              value={data.followingCount || ''}
              onChange={(e) => updateField('followingCount', e.target.value)}
              placeholder="120"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-0.5"
            />
          </div>
        </div>

        {/* Bio & Link */}
        <div>
          <label className="text-xs font-semibold text-slate-700">{isId ? 'Teks Bio' : 'Bio Text'}</label>
          <textarea
            rows={3}
            value={data.bio || ''}
            onChange={(e) => updateField('bio', e.target.value)}
            placeholder={isId ? 'Deskripsi bio...' : 'Bio description...'}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1 resize-y leading-relaxed"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700">{isId ? 'Situs Web / Tautan' : 'Website / Link'}</label>
          <input
            type="text"
            value={data.website || ''}
            onChange={(e) => updateField('website', e.target.value)}
            placeholder="https://linkhere.com"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
          />
        </div>
      </div>

      {/* 2. Action Buttons & Follow Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{isId ? 'Tombol Aksi & Status Mengikuti' : 'Action Buttons & Follow Status'}</h3>

        {/* Follow status toggle */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
          <div>
            <span className="text-xs font-bold text-slate-800 block">{isId ? 'Status Mengikuti' : 'Follow Status'}</span>
            <span className="text-[10px] text-slate-500">{isId ? 'Alihkan apakah Anda mengikuti profil ini' : 'Toggle whether you are following this profile'}</span>
          </div>
          <button
            type="button"
            onClick={() => updateField('isFollowing', !data.isFollowing)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              data.isFollowing
                ? 'bg-slate-200 text-slate-800 border border-slate-300'
                : 'bg-[#0095f6] text-white hover:bg-[#1877f2]'
            }`}
          >
            {data.isFollowing ? (isId ? 'Mengikuti (Aktif)' : 'Following (Active)') : (isId ? 'Ikuti (Tombol Biru)' : 'Follow (Blue Button)')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">
              {isId ? 'Teks Tombol Utama' : 'Primary Button Text'} <span className="font-normal text-slate-500">({isId ? 'Ikuti / Mengikuti' : 'Follow / Following'})</span>
            </label>
            <input
              type="text"
              value={data.followButtonText || ''}
              onChange={(e) => updateField('followButtonText', e.target.value)}
              placeholder={data.isFollowing ? (isId ? 'Mengikuti' : 'Following') : (isId ? 'Ikuti' : 'Follow')}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">{isId ? 'Teks Tombol Sekunder' : 'Secondary Button Text'}</label>
            <input
              type="text"
              value={data.messageButtonText || ''}
              onChange={(e) => updateField('messageButtonText', e.target.value)}
              placeholder={isId ? 'Pesan' : 'Message'}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
            />
          </div>
        </div>
      </div>

      {/* 3. Optional Badges & Mutual Friends */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{isId ? 'Lencana & Tautan Sosial' : 'Badges & Social Links'}</h3>

        <div className="space-y-2">
          {/* Show Reels Tab Toggle */}
          <div className="space-y-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.showReelsTab !== false}
                onChange={(e) => updateField('showReelsTab', e.target.checked)}
                className="rounded text-purple-600 focus:ring-0 accent-purple-600"
              />
              <span className="text-xs font-semibold text-slate-700">{isId ? 'Tampilkan Tab Reels' : 'Show Reels Tab'}</span>
            </label>
          </div>

          {/* Music Badge Toggle (2-Column Input) */}
          <div className="space-y-2 pt-1 border-t border-slate-100 mt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.showMusicBadge}
                onChange={(e) => updateField('showMusicBadge', e.target.checked)}
                className="rounded text-purple-600 focus:ring-0 accent-purple-600"
              />
              <span className="text-xs font-semibold text-slate-700">{isId ? 'Tampilkan Lencana Musik Profil' : 'Show Profile Music Badge'}</span>
            </label>
            {data.showMusicBadge && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 mt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {isId ? 'Judul Lagu' : 'Song Title'} <span className="font-normal text-slate-500">({isId ? 'Tebal' : 'Bold'})</span>
                  </label>
                  <input
                    type="text"
                    value={data.musicTitle || ''}
                    onChange={(e) => updateField('musicTitle', e.target.value)}
                    placeholder="e.g. Birds of a Feather"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {isId ? 'Nama Artis' : 'Artist Name'} <span className="font-normal text-slate-500">({isId ? 'Biasa' : 'Regular'})</span>
                  </label>
                  <input
                    type="text"
                    value={data.musicArtist || ''}
                    onChange={(e) => updateField('musicArtist', e.target.value)}
                    placeholder="e.g. Billie Eilish"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mutual Friends Toggle */}
          <div className="space-y-2 pt-1 border-t border-slate-100 mt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.showMutualFriends}
                onChange={(e) => updateField('showMutualFriends', e.target.checked)}
                className="rounded text-purple-600 focus:ring-0 accent-purple-600"
              />
              <span className="text-xs font-semibold text-slate-700">{isId ? 'Tampilkan Teman Bersama ("Diikuti oleh")' : 'Show Mutual Friends ("Followed by")'}</span>
            </label>
            {data.showMutualFriends && (
              <div className="space-y-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3 mt-1">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    {isId ? 'Diikuti oleh' : 'Followed by'} <span className="font-normal text-slate-500">({isId ? 'Nama Pengguna / Deskripsi' : 'Usernames / Description'})</span>
                  </label>
                  <input
                    type="text"
                    value={data.mutualFriendsText || ''}
                    onChange={(e) => updateField('mutualFriendsText', e.target.value)}
                    placeholder="e.g. jennie, taehyung, and 12 others"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Avatar Stack Photos (Up to 3 Photos with Crop & Adjust) */}
                <div className="pt-1">
                  <MultiImageUploader
                    label={isId ? 'Avatar Teman Bersama' : 'Mutual Friend Avatars'}
                    images={data.mutualFriendsAvatars || []}
                    onChange={(urls) => updateField('mutualFriendsAvatars', urls)}
                    maxImages={3}
                    cropShape="round"
                    forceAspect={1}
                    allow916={false}
                  />
                  {(data.mutualFriendsAvatars || []).length === 0 && (
                    <span className="text-[10px] text-slate-400 italic block mt-1">
                      {isId
                        ? 'Belum ada foto avatar (akan menampilkan lingkaran default di preview)'
                        : 'No avatar photos added (will display default placeholder circles in preview)'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Highlights (Sorotan) Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{isId ? 'Sorotan Profil' : 'Profile Highlights'}</h3>
            <p className="text-[11px] text-slate-500">{isId ? 'Unggah gambar & teks untuk lingkaran sorotan cerita' : 'Upload images & text for story highlight circles'}</p>
          </div>
          <button
            type="button"
            onClick={handleAddHighlight}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isId ? 'Tambah Sorotan' : 'Add Highlights'}</span>
          </button>
        </div>

        {/* Highlights Item List */}
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={data.showHighlights !== false}
            onChange={(event) => updateField('showHighlights', event.target.checked)}
            className="h-4 w-4 accent-purple-600"
          />
          {isId ? 'Tampilkan sorotan' : 'Show highlights'}
        </label>
        <div className="space-y-3 pt-1">
          {data.highlights && data.highlights.length > 0 ? (
            data.highlights.map((hl, idx) => (
              <div key={hl.id || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 relative">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-xs font-bold text-slate-700">
                    {isId ? `Sorotan #${idx + 1}` : `Highlight #${idx + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveHighlight(idx)}
                    className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold">{isId ? 'Judul / Label Emoji' : 'Title / Emoji Label'}</label>
                    <input
                      type="text"
                      value={hl.title ?? ''}
                      onChange={(e) => handleUpdateHighlight(idx, { title: e.target.value })}
                      placeholder={`Highlight ${idx + 1}`}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 mt-0.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <ImageUploader
                      label={isId ? 'Gambar Sampul Sorotan' : 'Highlight Cover Image'}
                      value={hl.image || ''}
                      onChange={(url) => handleUpdateHighlight(idx, { image: url })}
                      cropShape="round"
                      aspectHint="Crop & Adjust"
                      allow916={true}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              {isId
                ? 'Belum ada sorotan. Klik "Tambah Sorotan" di atas untuk membuat lingkaran sorotan!'
                : 'No highlights added. Click "Add Highlights" above to create highlight circles!'}
            </div>
          )}
        </div>
      </div>

      {/* 4. Post Grid Form (Multiple Files & Individual Boxes) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{isId ? 'Foto Kisi Postingan' : 'Post Grid Photos'}</h3>
            <p className="text-[11px] text-slate-500">{isId ? 'Unggah foto untuk mengisi kotak kisi profil' : 'Upload photos to fill the profile grid boxes'}</p>
          </div>
          <button
            type="button"
            onClick={handleAddGridPost}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isId ? 'Tambah Postingan' : 'Add Post'}</span>
          </button>
        </div>

        {/* Bulk Multiple File Upload Button */}
        <div className="bg-purple-50/60 border border-purple-200/80 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-purple-600" />
            <div>
              <div className="text-xs font-bold text-purple-950">{isId ? 'Unggah Massal Foto Kisi' : 'Bulk Upload Grid Photos'}</div>
              <div className="text-[10px] text-purple-700">{isId ? 'Pilih beberapa gambar sekaligus' : 'Select multiple images at once'}</div>
            </div>
          </div>

          <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 !text-white text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5 !text-white text-white shrink-0" />
            <span className="!text-white text-white font-bold">{isId ? 'Pilih File' : 'Select Files'}</span>
            <input
              id="input-grid-multiple-files"
              type="file"
              accept="image/*"
              multiple
              onChange={handleBulkUploadGridPosts}
              className="hidden"
            />
          </label>
        </div>

        {/* Grid Box List */}
        <div className="space-y-3 pt-1">
          {data.gridPosts && data.gridPosts.length > 0 ? (
            data.gridPosts.map((post, idx) => (
              <div key={post.id || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 relative">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-700">
                      {isId ? `Postingan #${idx + 1}` : `Post #${idx + 1}`}
                    </span>
                    {post.isPinned && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-normal px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                        <Pin className="w-2.5 h-2.5 rotate-45" />
                        <span>{isId ? 'Disematkan' : 'Pinned'}</span>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveGridPost(idx)}
                    className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <ImageUploader
                    label={isId ? 'Foto Kisi' : 'Grid Photo'}
                    value={post.image || ''}
                    onChange={(img) => handleUpdateGridPost(idx, { image: img })}
                    cropShape="rect"
                    forceAspect={1}
                    allow916={true}
                  />

                  <div className="flex items-center space-x-4 pt-1">
                    <label className="flex items-center space-x-1.5 cursor-pointer text-xs text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={!!post.isPinned}
                        onChange={(e) => handleUpdateGridPost(idx, { isPinned: e.target.checked })}
                        className="rounded text-purple-600 focus:ring-0 accent-purple-600 cursor-pointer"
                      />
                      <span>{isId ? 'Sematkan' : 'Pin'}</span>
                    </label>

                    <label className="flex items-center space-x-1.5 cursor-pointer text-xs text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={!!post.isCarousel}
                        onChange={(e) => handleUpdateGridPost(idx, { isCarousel: e.target.checked })}
                        className="rounded text-purple-600 focus:ring-0 accent-purple-600 cursor-pointer"
                      />
                      <span>{isId ? 'Korsel' : 'Carousel'}</span>
                    </label>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              {isId
                ? 'Belum ada item kisi. Klik "+ Tambah Postingan" atau "Pilih File" untuk mengisi kisi postingan!'
                : 'No grid items added. Click "+ Add Box" or "Select Files" to fill the post grid!'}
            </div>
          )}
        </div>
      </div>

      <SaveProfileButton onSave={onSaveProfile} />
    </div>
  );
};
