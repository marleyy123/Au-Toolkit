import React, { useRef, useState } from 'react';
import { InstagramOwnProfileData, InstagramHighlight, InstagramGridPost, CharacterPreset } from '../types';
import { CharacterSelector, ImageUploader, VerifiedSelector, SaveProfileButton } from './FormControls';
import {
  Plus,
  Trash2,
  Upload,
  Pin,
  Layers,
  Video,
  ArrowUp,
  ArrowDown,
  Moon,
  Sun,
  Image as ImageIcon,
  Eye,
} from 'lucide-react';
import { ImageCropperModal } from './ImageCropperModal';
import { createSafeObjectURL } from '../utils/imageManager';
import { registerOriginalImage } from '../utils/imageRegistry';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  data: InstagramOwnProfileData;
  onChange: (updated: InstagramOwnProfileData) => void;
  characters?: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter?: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter?: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const InstagramOwnProfileForm: React.FC<Props> = ({
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
  const { isId } = useLanguage();
  const fileInputMultipleRef = useRef<HTMLInputElement>(null);
  const [bulkCropSession, setBulkCropSession] = useState<{
    sessionId: string;
    src: string;
    queue: string[];
  } | null>(null);

  const updateField = <K extends keyof InstagramOwnProfileData>(
    key: K,
    value: InstagramOwnProfileData[K]
  ) => {
    onChange({ ...data, [key]: value });
  };

  // Highlights management
  const handleAddHighlight = () => {
    const newHighlight: InstagramHighlight = {
      id: 'hl-' + Date.now(),
      title: `Highlight ${(data.highlights?.length || 0) + 1}`,
      image: '',
    };
    updateField('highlights', [...(data.highlights || []), newHighlight]);
  };

  const handleUpdateHighlight = (index: number, updatedFields: Partial<InstagramHighlight>) => {
    const list = [...(data.highlights || [])];
    if (index >= 0 && index < list.length) {
      list[index] = { ...list[index], ...updatedFields };
      updateField('highlights', list);
    }
  };

  const handleRemoveHighlight = (index: number) => {
    const list = [...(data.highlights || [])];
    list.splice(index, 1);
    updateField('highlights', list);
  };

  const handleMoveHighlight = (index: number, direction: 'up' | 'down') => {
    const list = [...(data.highlights || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    updateField('highlights', list);
  };

  // Post Grid management for active tab
  const activeTab = data.activeTab || 'grid';

  const getActiveTabPosts = (): InstagramGridPost[] => {
    if (activeTab === 'reels') return data.reelsPosts || [];
    if (activeTab === 'tagged') return data.taggedPosts || [];
    return data.gridPosts || [];
  };

  const updateActiveTabPosts = (posts: InstagramGridPost[]) => {
    if (activeTab === 'reels') {
      updateField('reelsPosts', posts);
    } else if (activeTab === 'tagged') {
      updateField('taggedPosts', posts);
    } else {
      updateField('gridPosts', posts);
    }
  };

  const handleAddPost = () => {
    const isReels = activeTab === 'reels';
    const currentPosts = getActiveTabPosts();
    const newPost: InstagramGridPost = {
      id: 'post-' + Date.now(),
      image: '',
      isPinned: false,
      isCarousel: false,
      isVideo: isReels,
      viewersCount: isReels ? '1.2K' : undefined,
    };
    updateActiveTabPosts([...currentPosts, newPost]);
  };

  const handleUpdatePost = (index: number, updatedFields: Partial<InstagramGridPost>) => {
    const currentPosts = [...getActiveTabPosts()];
    if (index >= 0 && index < currentPosts.length) {
      currentPosts[index] = { ...currentPosts[index], ...updatedFields };
      updateActiveTabPosts(currentPosts);
    }
  };

  const handleRemovePost = (index: number) => {
    const currentPosts = [...getActiveTabPosts()];
    currentPosts.splice(index, 1);
    updateActiveTabPosts(currentPosts);
  };

  const handleMovePost = (index: number, direction: 'up' | 'down') => {
    const currentPosts = [...getActiveTabPosts()];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentPosts.length) return;
    const temp = currentPosts[index];
    currentPosts[index] = currentPosts[targetIndex];
    currentPosts[targetIndex] = temp;
    updateActiveTabPosts(currentPosts);
  };

  const handleBulkUploadGridPosts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (files.length === 0) return;

    const urls: string[] = [];
    files.forEach((file) => {
      const u = createSafeObjectURL(file);
      if (u) {
        registerOriginalImage(u, file);
        urls.push(u);
      }
    });

    if (urls.length === 0) return;

    const sessionId = 'crop_bulk_' + Date.now();
    setBulkCropSession({
      sessionId,
      src: urls[0],
      queue: urls.slice(1),
    });
  };

  const handleBulkCropComplete = (croppedUrl: string) => {
    if (!bulkCropSession) return;
    const isReels = activeTab === 'reels';
    const currentPosts = [...getActiveTabPosts()];
    currentPosts.push({
      id: 'post-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      image: croppedUrl,
      isPinned: false,
      isCarousel: false,
      isVideo: isReels,
      viewersCount: isReels ? '1.2K' : undefined,
    });
    updateActiveTabPosts(currentPosts);

    if (bulkCropSession.queue.length > 0) {
      setBulkCropSession({
        sessionId: 'crop_bulk_' + Date.now(),
        src: bulkCropSession.queue[0],
        queue: bulkCropSession.queue.slice(1),
      });
    } else {
      setBulkCropSession(null);
    }
  };

  const handleBulkCropCancel = () => {
    if (!bulkCropSession) return;
    if (bulkCropSession.queue.length > 0) {
      setBulkCropSession({
        sessionId: 'crop_bulk_' + Date.now(),
        src: bulkCropSession.queue[0],
        queue: bulkCropSession.queue.slice(1),
      });
    } else {
      setBulkCropSession(null);
    }
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* AU Character Presets Header */}
      {characters && (
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-2.5">
          <CharacterSelector
            characters={characters}
            activeCharacterId={activeCharacterId}
            onSelect={onSelectCharacter}
            onSelectCharacter={onSelectCharacter}
            onSaveCurrent={onSaveProfile || onSaveCharacter}
            onSaveCharacter={onSaveCharacter}
            onDeleteCharacter={onDeleteCharacter}
            onRenameCharacter={onRenameCharacter}
            addLabel={isId ? '+ Folder Baru' : '+ New Folder'}
          />
          {onSaveProfile && (
            <div className="pt-1 flex justify-end">
              <SaveProfileButton onSave={onSaveProfile} />
            </div>
          )}
        </div>
      )}

      {/* 1. Theme Mode */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {isId ? 'Mode Tema (Theme Mode)' : 'Theme Mode'}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => updateField('theme', 'light')}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              data.theme === 'light'
                ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-300" />
            <span>Light Mode ({isId ? 'Default' : 'Default'})</span>
          </button>
          <button
            type="button"
            onClick={() => updateField('theme', 'dark')}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              data.theme === 'dark'
                ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Moon className="w-4 h-4 text-purple-200" />
            <span>Dark Mode</span>
          </button>
        </div>
      </div>

      {/* 2. Instagram Profile Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {isId ? 'Header Profil Instagram' : 'Instagram Profile Header'}
        </h3>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            {isId ? 'Username Akun' : 'Account Username'}{' '}
            <span className="font-normal text-slate-500">(@)</span>
          </label>
          <input
            type="text"
            value={data.username || ''}
            onChange={(e) => updateField('username', e.target.value)}
            placeholder="janerubyjane"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
          />
        </div>

        {/* Account Privacy (Public / Private) */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            {isId ? 'Privasi Akun' : 'Account Privacy'}
          </label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => updateField('isPrivate', false)}
              className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                !data.isPrivate
                  ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{isId ? 'Publik' : 'Public'}</span>
            </button>
            <button
              type="button"
              onClick={() => updateField('isPrivate', true)}
              className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                data.isPrivate
                  ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>Private</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showNotificationDot !== false}
              onChange={(e) => updateField('showNotificationDot', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span className="text-xs font-medium text-slate-700">
              {isId ? 'Titik Merah Notifikasi Header' : 'Header Red Notification Dot'}
            </span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showDropdownArrow !== false}
              onChange={(e) => updateField('showDropdownArrow', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span className="text-xs font-medium text-slate-700">
              {isId ? 'Ikon Chevron Dropdown' : 'Dropdown Chevron Arrow'}
            </span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showCreateButton !== false}
              onChange={(e) => updateField('showCreateButton', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span className="text-xs font-medium text-slate-700">
              {isId ? 'Ikon Tambah (+) Kiri Atas' : 'Top Left Plus (+) Button'}
            </span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showMenuButton !== false}
              onChange={(e) => updateField('showMenuButton', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span className="text-xs font-medium text-slate-700">
              {isId ? 'Menu Hamburger (3 Garis)' : 'Hamburger Menu (3 Lines)'}
            </span>
          </label>
        </div>
      </div>

      {/* 3. Profile Information (Avatar, Stats, Bio) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {isId ? 'Informasi Profil' : 'Profile Information'}
        </h3>

        {/* Profile Picture Uploader */}
        <div>
          <ImageUploader
            label={isId ? 'Foto Profil' : 'Profile Photo'}
            value={data.avatar || ''}
            onChange={(url) => updateField('avatar', url)}
            cropShape="round"
            aspectHint="1:1 Circle"
          />
        </div>

        {/* Avatar Ring & Add Button Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(data.hasStoryRing)}
              onChange={(e) => updateField('hasStoryRing', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span className="text-xs font-medium text-slate-700">
              {isId ? 'Cincin Cerita Gradasi (Story Ring)' : 'Gradient Story Ring'}
            </span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showAddAvatarBadge !== false}
              onChange={(e) => updateField('showAddAvatarBadge', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span className="text-xs font-medium text-slate-700">
              {isId ? 'Tombol Tambah Foto Biru (+)' : 'Blue (+) Add Avatar Button'}
            </span>
          </label>
        </div>

        {/* Display Name & Verified Badge */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {isId ? 'Nama Tampilan' : 'Display Name'}
            </label>
            <input
              type="text"
              value={data.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Name"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
            />
          </div>
          <div>
            <VerifiedSelector
              value={data.verified}
              onChange={(val) => updateField('verified', val)}
              allowIg={true}
            />
          </div>
        </div>

        {/* Stats Row: Posts, Followers, Following */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div>
            <label className="text-[11px] font-semibold text-slate-600">
              {isId ? 'Postingan' : 'Posts'}
            </label>
            <input
              type="text"
              value={data.postsCount || ''}
              onChange={(e) => updateField('postsCount', e.target.value)}
              placeholder="0"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-0.5 font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-600">
              {isId ? 'Pengikut' : 'Followers'}
            </label>
            <input
              type="text"
              value={data.followersCount || ''}
              onChange={(e) => updateField('followersCount', e.target.value)}
              placeholder="0"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-0.5 font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-600">
              {isId ? 'Mengikuti' : 'Following'}
            </label>
            <input
              type="text"
              value={data.followingCount || ''}
              onChange={(e) => updateField('followingCount', e.target.value)}
              placeholder="0"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-0.5 font-bold"
            />
          </div>
        </div>

        {/* Biography & Website Link */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            {isId ? 'Teks Bio (Multiline, Mention @, Tag #, Emoji)' : 'Bio Text (Multiline, Mention @, Tag #, Emoji)'}
          </label>
          <textarea
            rows={3}
            value={data.bio || ''}
            onChange={(e) => updateField('bio', e.target.value)}
            placeholder={isId ? 'Deskripsi bio profil...' : 'Profile bio description...'}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y leading-relaxed"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            {isId ? 'Tautan Situs Web' : 'Website Link'}
          </label>
          <input
            type="text"
            value={data.website || ''}
            onChange={(e) => updateField('website', e.target.value)}
            placeholder="https://linktr.ee/example"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* 4. Instagram Notes on Profile Photo */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {isId ? 'Instagram Notes di Foto Profil' : 'Instagram Notes on Profile Picture'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isId
                ? 'Bubble pikiran melayang di atas foto profil'
                : 'Floating thought bubble above profile picture'}
            </p>
          </div>
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(data.showNotes)}
              onChange={(e) => updateField('showNotes', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span className="text-xs font-bold text-slate-800">{isId ? 'Aktifkan' : 'Enable'}</span>
          </label>
        </div>

        {data.showNotes && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isId ? 'Teks Catatan / Notes' : 'Notes Text'}{' '}
                <span className="font-normal text-slate-500">
                  ({isId ? 'Otomatis bungkus rapi per 20 karakter' : 'Auto natural wrap'})
                </span>
              </label>
              <input
                type="text"
                value={data.notesText || ''}
                onChange={(e) => updateField('notesText', e.target.value)}
                placeholder={isId ? 'Ketik catatan...' : 'Type note...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  {isId ? 'Warna Background Bubble (Opsional)' : 'Bubble Background Color (Optional)'}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={data.notesBgColor || (data.theme === 'dark' ? '#262626' : '#ffffff')}
                    onChange={(e) => updateField('notesBgColor', e.target.value)}
                    className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={data.notesBgColor || ''}
                    onChange={(e) => updateField('notesBgColor', e.target.value)}
                    placeholder={data.theme === 'dark' ? '#262626 (Default)' : '#ffffff (Default)'}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  {isId ? 'Warna Teks Notes (Opsional)' : 'Notes Text Color (Optional)'}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={data.notesTextColor || (data.theme === 'dark' ? '#ffffff' : '#0f172a')}
                    onChange={(e) => updateField('notesTextColor', e.target.value)}
                    className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={data.notesTextColor || ''}
                    onChange={(e) => updateField('notesTextColor', e.target.value)}
                    placeholder={data.theme === 'dark' ? '#ffffff (Default)' : '#0f172a (Default)'}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Profile Music Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {isId ? 'Musik Profil' : 'Profile Music'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isId ? 'Pill musik visual dengan ikon play' : 'Visual profile music pill with play icon'}
            </p>
          </div>
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(data.showMusic)}
              onChange={(e) => updateField('showMusic', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span className="text-xs font-bold text-slate-800">{isId ? 'Aktifkan' : 'Enable'}</span>
          </label>
        </div>

        {data.showMusic && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                {isId ? 'Judul Lagu' : 'Song Title'}
              </label>
              <input
                type="text"
                value={data.musicTitle || ''}
                onChange={(e) => updateField('musicTitle', e.target.value)}
                placeholder="e.g. Birds of a Feather"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                {isId ? 'Nama Artis' : 'Artist Name'}
              </label>
              <input
                type="text"
                value={data.musicArtist || ''}
                onChange={(e) => updateField('musicArtist', e.target.value)}
                placeholder="e.g. Billie Eilish"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 6. Professional Dashboard */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {isId ? 'Dashboard Profesional' : 'Professional Dashboard'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isId
                ? 'Kotak metrik dashboard untuk profil kreator'
                : 'Creator metrics dashboard preview'}
            </p>
          </div>
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(data.showDashboard)}
              onChange={(e) => updateField('showDashboard', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span className="text-xs font-bold text-slate-800">{isId ? 'Aktifkan' : 'Enable'}</span>
          </label>
        </div>

        {data.showDashboard && (
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  {isId ? 'Judul Dashboard' : 'Dashboard Title'}
                </label>
                <input
                  type="text"
                  value={data.dashboardTitle || ''}
                  onChange={(e) => updateField('dashboardTitle', e.target.value)}
                  placeholder="Your dashboard"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  {isId ? 'Indikator Pertumbuhan (Opsional)' : 'Growth Indicator (Optional)'}
                </label>
                <input
                  type="text"
                  value={data.dashboardGrowth || ''}
                  onChange={(e) => updateField('dashboardGrowth', e.target.value)}
                  placeholder="+14.2%"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                {isId ? 'Teks Tampilan / Views' : 'Views / Reach Text'}
              </label>
              <input
                type="text"
                value={data.dashboardViews || ''}
                onChange={(e) => updateField('dashboardViews', e.target.value)}
                placeholder="12k views in the last 30 days"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
              />
            </div>
          </div>
        )}
      </div>

      {/* 7. Profile Action Buttons */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {isId ? 'Tombol Aksi Profil' : 'Profile Action Buttons'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.showEditProfile !== false}
                onChange={(e) => updateField('showEditProfile', e.target.checked)}
                className="rounded text-purple-600 focus:ring-0 accent-purple-600"
              />
              <span className="text-xs font-bold text-slate-800">
                {isId ? 'Tombol Edit Profil' : 'Edit Profile Button'}
              </span>
            </label>
            {data.showEditProfile !== false && (
              <input
                type="text"
                value={data.editProfileText || ''}
                onChange={(e) => updateField('editProfileText', e.target.value)}
                placeholder="Edit profile"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900"
              />
            )}
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.showShareProfile !== false}
                onChange={(e) => updateField('showShareProfile', e.target.checked)}
                className="rounded text-purple-600 focus:ring-0 accent-purple-600"
              />
              <span className="text-xs font-bold text-slate-800">
                {isId ? 'Tombol Bagikan Profil' : 'Share Profile Button'}
              </span>
            </label>
            {data.showShareProfile !== false && (
              <input
                type="text"
                value={data.shareProfileText || ''}
                onChange={(e) => updateField('shareProfileText', e.target.value)}
                placeholder="Share profile"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900"
              />
            )}
          </div>
        </div>
        <label className="flex items-center space-x-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={data.showAddPerson !== false}
            onChange={(e) => updateField('showAddPerson', e.target.checked)}
            className="rounded text-purple-600 focus:ring-0 accent-purple-600"
          />
          <span className="text-xs font-medium text-slate-700">
            {isId ? 'Tampilkan Ikon Tombol Tambah Kontak (Orang+)' : 'Show Add Contact Button (Person+)'}
          </span>
        </label>
      </div>

      {/* 8. Story Highlights (Sorotan) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {isId ? 'Sorotan Cerita (Story Highlights)' : 'Story Highlights'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isId
                ? 'Lingkaran sorotan dengan cover dan tombol New (+)'
                : 'Highlight circles with covers and New button'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddHighlight}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isId ? 'Tambah Sorotan' : 'Add Highlight'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-4 pt-1">
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showHighlights !== false}
              onChange={(e) => updateField('showHighlights', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span className="text-xs font-medium text-slate-700">
              {isId ? 'Tampilkan Bagian Sorotan' : 'Show Highlights Section'}
            </span>
          </label>
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showNewHighlightButton !== false}
              onChange={(e) => updateField('showNewHighlightButton', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span className="text-xs font-medium text-slate-700">
              {isId ? 'Tombol "New" (+)' : '"New" (+) Button'}
            </span>
          </label>
        </div>

        {/* Highlight Items List */}
        {data.showHighlights !== false && (
          <div className="space-y-3 pt-2">
            {data.highlights && data.highlights.length > 0 ? (
              data.highlights.map((hl, idx) => (
                <div
                  key={hl.id || idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 relative"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-xs font-bold text-slate-700">
                      {isId ? `Sorotan #${idx + 1}` : `Highlight #${idx + 1}`}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleMoveHighlight(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveHighlight(idx, 'down')}
                        disabled={idx === (data.highlights?.length || 1) - 1}
                        title="Move Down"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(idx)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-slate-600 font-semibold">
                        {isId ? 'Judul Sorotan' : 'Highlight Title'}
                      </label>
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
                        label={isId ? 'Foto Sampul Sorotan' : 'Highlight Cover Image'}
                        value={hl.image || ''}
                        onChange={(url) => handleUpdateHighlight(idx, { image: url })}
                        cropShape="round"
                        aspectHint="1:1 Circle"
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                {isId
                  ? 'Belum ada sorotan kustom. Klik "Tambah Sorotan" di atas.'
                  : 'No custom highlights yet. Click "Add Highlight" above.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 9. Post Grid (Grid 3 Kolom & Tab Visual) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {isId ? 'Kisi Postingan & Tab Visual' : 'Post Grid & Visual Tabs'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isId
                ? 'Pilih tab tampilan yang ingin diekspor & kelola gambar'
                : 'Select active tab to export & manage photos'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddPost}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isId ? 'Tambah Postingan' : 'Add Post'}</span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => updateField('activeTab', 'grid')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'grid'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Posts Grid
          </button>
          <button
            type="button"
            onClick={() => updateField('activeTab', 'reels')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reels'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Reels / Video (9:16)
          </button>
          <button
            type="button"
            onClick={() => updateField('activeTab', 'tagged')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tagged'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tagged
          </button>
        </div>

        {/* Aspect Ratio Selector for Profile Feed (Active in Grid / Tagged tab) */}
        {activeTab !== 'reels' && (
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700">
                {isId ? 'Rasio Aspek Grid Feed' : 'Feed Grid Aspect Ratio'}
              </span>
              <span className="text-[10px] text-slate-500">
                {isId ? '(Tampilan Kisi Feed & Tag)' : '(Feed & Tagged Grid)'}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => updateField('gridAspectRatio', '4:5')}
                className={`px-2.5 py-1 text-xs rounded-lg border font-bold transition-all cursor-pointer ${
                  (data.gridAspectRatio || '4:5') === '4:5'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                4:5 ({isId ? 'Standar' : 'Default'})
              </button>
              <button
                type="button"
                onClick={() => updateField('gridAspectRatio', '1:1')}
                className={`px-2.5 py-1 text-xs rounded-lg border font-bold transition-all cursor-pointer ${
                  data.gridAspectRatio === '1:1'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                1:1 ({isId ? 'Persegi' : 'Square'})
              </button>
            </div>
          </div>
        )}

        {/* Bulk Multiple File Upload Button with Crop & Adjust */}
        <div className="bg-purple-50/60 border border-purple-200/80 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-purple-600" />
            <div>
              <div className="text-xs font-bold text-purple-950">
                {isId ? 'Unggah Foto dengan Crop & Adjust' : 'Upload Photos with Crop & Adjust'}
              </div>
              <div className="text-[10px] text-purple-700">
                {isId
                  ? `Pilih foto, potong sesuai rasio (${activeTab === 'reels' ? '9:16' : '4:5, 1:1, 3:4'})`
                  : `Select photos, crop with ratios (${activeTab === 'reels' ? '9:16' : '4:5, 1:1, 3:4'})`}
              </div>
            </div>
          </div>
          <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 !text-white text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5 !text-white text-white shrink-0" />
            <span className="!text-white text-white font-bold">{isId ? 'Pilih File' : 'Select Files'}</span>
            <input
              ref={fileInputMultipleRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleBulkUploadGridPosts}
              className="hidden"
            />
          </label>
        </div>

        {/* Posts List for Active Tab */}
        <div className="space-y-3 pt-1">
          {getActiveTabPosts().length > 0 ? (
            getActiveTabPosts().map((post, idx) => (
              <div
                key={post.id || idx}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 relative"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-xs font-bold text-slate-700">
                    {isId ? `Postingan #${idx + 1}` : `Post #${idx + 1}`}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleMovePost(idx, 'up')}
                      disabled={idx === 0}
                      title="Move Up"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMovePost(idx, 'down')}
                      disabled={idx === getActiveTabPosts().length - 1}
                      title="Move Down"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePost(idx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <ImageUploader
                    label={isId ? 'Thumbnail Foto' : 'Photo Thumbnail'}
                    value={post.image || ''}
                    onChange={(url) => handleUpdatePost(idx, { image: url })}
                    cropShape="rect"
                    initialAspect={
                      activeTab === 'reels'
                        ? 9 / 16
                        : (data.gridAspectRatio || '4:5') === '1:1'
                        ? 1
                        : 4 / 5
                    }
                    aspectHint={activeTab === 'reels' ? '9:16' : '4:5, 1:1, 3:4'}
                    allow916={activeTab === 'reels'}
                  />

                  {/* Badges Toggle (Carousel, Video, Pinned, Viewers) */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleUpdatePost(idx, { isCarousel: !post.isCarousel })}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                        post.isCarousel
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>Carousel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const nextIsVideo = !post.isVideo;
                        handleUpdatePost(idx, {
                          isVideo: nextIsVideo,
                          viewersCount:
                            nextIsVideo && !post.viewersCount ? '1.2K' : post.viewersCount,
                        });
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                        post.isVideo
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Video className="w-3 h-3" />
                      <span>Video/Reel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdatePost(idx, { isPinned: !post.isPinned })}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                        post.isPinned
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Pin className="w-3 h-3 rotate-45" />
                      <span>Pinned</span>
                    </button>

                    {/* Viewers Toggle Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const isCurrentlyActive = Boolean(
                          post.showViewers ||
                            post.isVideo ||
                            (post.viewersCount && post.viewersCount.trim() !== '')
                        );
                        const nextShow = !isCurrentlyActive;
                        handleUpdatePost(idx, {
                          showViewers: nextShow,
                          viewersCount: nextShow
                            ? post.viewersCount && post.viewersCount.trim() !== ''
                              ? post.viewersCount
                              : '1.000'
                            : '',
                        });
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                        post.showViewers ||
                        post.isVideo ||
                        (post.viewersCount && post.viewersCount.trim() !== '')
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>{isId ? 'Tanda Viewers' : 'Viewers'}</span>
                    </button>
                  </div>

                  {/* Viewers Input (Bebas atur angka viewers, contoh 1.000) */}
                  {(activeTab === 'reels' ||
                    post.isVideo ||
                    post.showViewers ||
                    (post.viewersCount !== undefined && post.viewersCount.trim() !== '')) && (
                    <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-2.5 space-y-1.5 mt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-purple-950 flex items-center space-x-1.5">
                          <Eye className="w-3.5 h-3.5 text-purple-600" />
                          <span>
                            {isId
                              ? 'Tanda Viewers (Ikon Mata & Jumlah Penonton)'
                              : 'Viewers Count (Eye Icon)'}
                          </span>
                        </label>
                        {/* Quick preset buttons */}
                        <div className="flex items-center space-x-1">
                          {['1.000', '5.4K', '12.5K', '100K'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() =>
                                handleUpdatePost(idx, { viewersCount: preset, showViewers: true })
                              }
                              className="text-[10px] px-1.5 py-0.5 rounded bg-white hover:bg-purple-100 border border-purple-200 text-purple-800 font-semibold cursor-pointer"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={post.viewersCount !== undefined ? post.viewersCount : ''}
                          onChange={(e) =>
                            handleUpdatePost(idx, { viewersCount: e.target.value, showViewers: true })
                          }
                          placeholder={isId ? 'contoh: 1.000 atau 12.4K' : 'e.g. 1.000 or 12.4K'}
                          className="w-full bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                        />
                      </div>
                      <p className="text-[10px] text-purple-700">
                        {isId
                          ? 'Ikon mata dan jumlah viewers akan muncul di pojok kiri bawah foto postingan pada preview.'
                          : 'Eye icon and viewer count will appear in the bottom-left corner of the post in preview.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-5 text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              {isId
                ? 'Belum ada postingan di tab ini. Klik "Tambah Postingan" atau "Pilih File" di atas.'
                : 'No posts in this tab yet. Click "Add Post" or "Select Files" above.'}
            </div>
          )}
        </div>
      </div>

      {/* Modal Crop & Adjust for Post Uploads */}
      {bulkCropSession && (
        <ImageCropperModal
          isOpen={true}
          imageSrc={bulkCropSession.src}
          cropShape="rect"
          initialAspect={
            activeTab === 'reels'
              ? 9 / 16
              : (data.gridAspectRatio || '4:5') === '1:1'
              ? 1
              : 4 / 5
          }
          allow916={activeTab === 'reels'}
          onClose={handleBulkCropCancel}
          onCropComplete={handleBulkCropComplete}
          sessionId={bulkCropSession.sessionId}
        />
      )}
    </div>
  );
};
