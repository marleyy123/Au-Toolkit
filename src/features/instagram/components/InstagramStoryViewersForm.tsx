import React from 'react';
import { InstagramStoryViewersData, InstagramStoryViewerItem, CharacterPreset } from '../../../types';
import { CharacterSelector, ImageUploader, SaveProfileButton } from '../../../components/FormControls';
import { Plus, Trash2, Heart, Users } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface Props {
  data: InstagramStoryViewersData;
  onChange: (updated: InstagramStoryViewersData) => void;
  characters: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const InstagramStoryViewersForm: React.FC<Props> = ({
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
  const { language } = useLanguage();
  const isId = language === 'id';

  const updateField = <K extends keyof InstagramStoryViewersData>(key: K, value: InstagramStoryViewersData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const storyImages =
    data.storyImages && data.storyImages.length > 0
      ? data.storyImages
      : (data.storyImage ? [data.storyImage] : ['']);
  const activeSlideIndex = Math.min(data.activeSlideIndex ?? 0, Math.max(0, storyImages.length - 1));

  const handleSelectActiveSlide = (index: number) => {
    onChange({
      ...data,
      activeSlideIndex: index,
      storyImage: storyImages[index] || storyImages[0],
    });
  };

  const handleUpdateSlideImage = (index: number, url: string) => {
    const updatedImages = [...storyImages];
    updatedImages[index] = url;
    onChange({
      ...data,
      storyImages: updatedImages,
      storyImage: index === activeSlideIndex ? url : data.storyImage,
    });
  };

  const handleAddSlide = () => {
    const defaultNewImage = '';
    const updatedImages = [...storyImages, defaultNewImage];
    const newActiveIndex = updatedImages.length - 1;
    onChange({
      ...data,
      storyImages: updatedImages,
      activeSlideIndex: newActiveIndex,
      storyImage: defaultNewImage,
    });
  };

  const handleDeleteSlide = (index: number) => {
    if (storyImages.length <= 1) return; // Keep at least 1 slide
    const updatedImages = storyImages.filter((_, i) => i !== index);
    const newActiveIndex = Math.min(activeSlideIndex, updatedImages.length - 1);
    onChange({
      ...data,
      storyImages: updatedImages,
      activeSlideIndex: newActiveIndex,
      storyImage: updatedImages[newActiveIndex],
    });
  };

  const handleAddViewer = () => {
    const newViewer: InstagramStoryViewerItem = {
      id: `v-${Date.now()}`,
      username: '',
      avatar: '',
      likedStory: false,
    };

    const newViewers = [...data.viewers, newViewer];
    onChange({
      ...data,
      viewers: newViewers,
      viewerCount: String(newViewers.length),
    });
  };

  const handleUpdateViewer = (id: string, updatedFields: Partial<InstagramStoryViewerItem>) => {
    const newViewers = data.viewers.map((v) =>
      v.id === id ? { ...v, ...updatedFields } : v
    );
    onChange({ ...data, viewers: newViewers });
  };

  const handleDeleteViewer = (id: string) => {
    const newViewers = data.viewers.filter((v) => v.id !== id);
    onChange({
      ...data,
      viewers: newViewers,
      viewerCount: String(newViewers.length),
    });
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

      {/* 1. Main Story Settings & Theme */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {isId ? 'Pengaturan Penonton Cerita' : 'Story Viewers Settings'}
        </h3>

        {/* Theme selector */}
        <div>
          <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
            {isId ? 'Mode Tema' : 'Theme Mode'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => updateField('theme', 'light')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                data.theme !== 'dark'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {isId ? 'Terang' : 'Light'}
            </button>
            <button
              type="button"
              onClick={() => updateField('theme', 'dark')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                data.theme === 'dark'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {isId ? 'Gelap' : 'Dark'}
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-700 dark:text-slate-300 font-bold">
              {isId ? `Slide Cerita (${storyImages.length})` : `Story Slides (${storyImages.length})`}
            </label>
            <button
              type="button"
              onClick={handleAddSlide}
              className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shrink-0 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>{isId ? 'Tambah Slide' : 'Add Slide'}</span>
            </button>
          </div>

          {/* Slide selector pills */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            {storyImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectActiveSlide(idx)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  idx === activeSlideIndex
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{`Slide ${idx + 1}`}</span>
              </button>
            ))}
          </div>

          {/* Active slide editor card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isId ? `Pengaturan Slide ${activeSlideIndex + 1}` : `Slide ${activeSlideIndex + 1} Settings`}
              </span>
              {storyImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteSlide(activeSlideIndex)}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center space-x-1 cursor-pointer"
                  title={isId ? 'Hapus slide ini' : 'Delete this slide'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isId ? 'Hapus Slide' : 'Delete Slide'}</span>
                </button>
              )}
            </div>

            <ImageUploader
              label={isId ? `Gambar Slide ${activeSlideIndex + 1}` : `Slide ${activeSlideIndex + 1} Image`}
              value={storyImages[activeSlideIndex] || ''}
              imageUrl={storyImages[activeSlideIndex] || ''}
              onChange={(url) => handleUpdateSlideImage(activeSlideIndex, url)}
              onImageChange={(url) => handleUpdateSlideImage(activeSlideIndex, url)}
              aspectHint={isId ? 'Vertikal 9:16 (Resolusi HD Penuh)' : '9:16 Vertical (Full HD Native)'}
              skipCompression={true}
            />
          </div>
        </div>

        <div className="pt-1">
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">
              {isId ? 'Jumlah Total Penonton' : 'Total Viewers Count'}
            </label>
            <input
              type="text"
              value={data.viewerCount || ''}
              onChange={(e) => onChange({ ...data, viewerCount: e.target.value })}
              placeholder="18"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
            />
          </div>
        </div>
      </div>

      {/* 2. Dynamic Viewers List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>{isId ? `Daftar Penonton (${data.viewers?.length || 0})` : `Viewers List (${data.viewers?.length || 0})`}</span>
          </h3>

          <button
            type="button"
            onClick={handleAddViewer}
            className="flex items-center space-x-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isId ? '+ Tambah Penonton' : 'Add Viewer Status'}</span>
          </button>
        </div>

        <div className="space-y-3">
          {data.viewers && data.viewers.length > 0 ? (
            data.viewers.map((viewer, index) => (
              <div
                key={viewer.id}
                className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">
                    {isId ? `Penonton #${index + 1}` : `Viewer #${index + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteViewer(viewer.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title={isId ? 'Hapus Penonton' : 'Delete Viewer'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {isId ? 'Nama Pengguna' : 'Username'}
                    </label>
                    <input
                      type="text"
                      value={viewer.username || ''}
                      onChange={(e) =>
                        handleUpdateViewer(viewer.id, { username: e.target.value })
                      }
                      placeholder={`user_${index + 1}`}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <ImageUploader
                    label={isId ? 'Foto Profil Avatar' : 'Avatar URL'}
                    value={viewer.avatar || ''}
                    imageUrl={viewer.avatar || ''}
                    onImageChange={(url) =>
                      handleUpdateViewer(viewer.id, { avatar: url })
                    }
                    onChange={(url) =>
                      handleUpdateViewer(viewer.id, { avatar: url })
                    }
                  />
                </div>

                {/* Liked Story Toggle */}
                <div className="pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-slate-700 dark:text-slate-300 font-semibold text-xs">
                    <input
                      type="checkbox"
                      checked={viewer.likedStory === true}
                      onChange={(e) =>
                        handleUpdateViewer(viewer.id, {
                          likedStory: e.target.checked,
                        })
                      }
                      className="rounded text-rose-600 focus:ring-0 accent-rose-600"
                    />
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <span>{isId ? 'Menyukai Cerita (Tampilkan Ikon Hati Merah)' : 'Liked Story (Show Red Heart Badge)'}</span>
                  </label>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-500">
              {isId ? 'Belum ada penonton. Klik "+ Tambah Penonton" untuk menambah.' : 'No viewers added. Click "+ Add Viewer" to populate the list.'}
            </div>
          )}
        </div>
      </div>

      {/* Save Profile Button */}
      {onSaveProfile && <SaveProfileButton onSave={onSaveProfile} />}
    </div>
  );
};
