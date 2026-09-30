import React from 'react';
import { TikTokFypData, CharacterPreset } from '../../../types';
import { CharacterSelector, ImageUploader, SaveProfileButton } from '../../../components/FormControls';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Image as ImageIcon,
  MapPin,
  FileText,
  Repeat,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Music2,
  Compass,
} from 'lucide-react';

interface Props {
  data: TikTokFypData;
  onChange: (updated: TikTokFypData) => void;
  characters?: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter?: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter?: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const TikTokFypForm: React.FC<Props> = ({
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
  const updateField = <K extends keyof TikTokFypData>(
    key: K,
    value: TikTokFypData[K]
  ) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Quick Character / Folder Presets */}
      <CharacterSelector
        characters={characters || []}
        activeCharacterId={activeCharacterId}
        onSelect={onSelectCharacter || (() => {})}
        onSaveCurrent={onSaveCharacter || (() => {})}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      {/* 1. Post Media & Creator Profile */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <ImageIcon className="w-4 h-4 text-purple-500" />
          <span>Post Media & Creator Info</span>
        </h3>

        {/* Media Background Image */}
        <ImageUploader
          label="TikTok Post Media / Video Frame"
          currentImage={data.mediaImage}
          onImageChange={(newImg) => updateField('mediaImage', newImg)}
          aspectRatio="9:16"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Creator Avatar */}
          <ImageUploader
            label="Avatar"
            currentImage={data.avatarUrl}
            onImageChange={(newImg) => updateField('avatarUrl', newImg)}
            aspectRatio="1:1"
          />

          <div className="space-y-3">
            {/* Unified Clean Name Field */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Name
              </label>
              <input
                type="text"
                value={data.displayName !== undefined && data.displayName !== '' ? data.displayName : (data.username || '')}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange({
                    ...data,
                    displayName: val,
                    username: val.replace(/^@/, ''),
                  });
                }}
                placeholder="Name"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium"
              />
            </div>

            {/* Post Time & Location */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Post Time
                </label>
                <input
                  type="text"
                  value={data.postTime || ''}
                  onChange={(e) => updateField('postTime', e.target.value)}
                  placeholder="4h ago"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>City</span>
                </label>
                <input
                  type="text"
                  value={data.locationText || ''}
                  onChange={(e) => updateField('locationText', e.target.value)}
                  placeholder="Sleman"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>
            </div>
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
                <span className="text-xs font-bold text-slate-800 block">Verified Badge</span>
                <span className="text-[11px] text-slate-500 block">Show verified badge next to name</span>
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

        {/* Caption */}
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center space-x-1">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Caption & Hashtags</span>
          </label>
          <textarea
            rows={2}
            value={data.caption || ''}
            onChange={(e) => updateField('caption', e.target.value)}
            placeholder="Your text goes here..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
        </div>
      </div>

      {/* 2. Sound / Music Details */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Music2 className="w-4 h-4 text-purple-500" />
          <span>Sound / Music Track</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Music Name
            </label>
            <input
              type="text"
              value={data.soundName || ''}
              onChange={(e) => updateField('soundName', e.target.value)}
              placeholder="original sound - music"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          <ImageUploader
            label="Music Disc Album Art"
            currentImage={data.soundCover || ''}
            onImageChange={(newImg) => updateField('soundCover', newImg)}
            aspectRatio="1:1"
            forceAspect={1}
            cropShape="round"
          />
        </div>
      </div>

      {/* 3. Repost Status Indicator */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Repeat className="w-4 h-4 text-purple-500" />
          <span>Repost Label</span>
        </h3>

        {/* Toggle Reposted */}
        <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700 font-semibold text-xs">
          <input
            type="checkbox"
            checked={!!data.showReposted}
            onChange={(e) => updateField('showReposted', e.target.checked)}
            className="rounded text-purple-600 focus:ring-0"
          />
          <span>Show Repost Label</span>
        </label>

        {!!data.showReposted && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Repost Account Name
              </label>
              <input
                type="text"
                value={data.repostedByText || ''}
                onChange={(e) => updateField('repostedByText', e.target.value)}
                placeholder="Name"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                The account name that reposted this video (displayed with repost icon).
              </span>
            </div>

            <ImageUploader
              label="Repost Account Avatar"
              currentImage={data.repostedByAvatar || ''}
              onImageChange={(newImg) => updateField('repostedByAvatar', newImg)}
              aspectRatio="1:1"
            />
          </div>
        )}
      </div>

      {/* 4. Engagement Counters & Interactions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Heart className="w-4 h-4 text-rose-500" />
          <span>Engagement Metrics</span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Likes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center space-x-1">
              <Heart className="w-3 h-3 text-rose-500" />
              <span>Likes Count</span>
            </label>
            <input
              type="text"
              value={data.likesCount || ''}
              onChange={(e) => updateField('likesCount', e.target.value)}
              placeholder="245.8K"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium"
            />
            <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={!!data.isLiked}
                onChange={(e) => updateField('isLiked', e.target.checked)}
                className="rounded text-purple-600 focus:ring-0 accent-purple-600"
              />
              <span>Liked (Red Heart)</span>
            </label>
          </div>

          {/* Comments */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center space-x-1">
              <MessageCircle className="w-3 h-3 text-purple-500" />
              <span>Comments Count</span>
            </label>
            <input
              type="text"
              value={data.commentsCount || ''}
              onChange={(e) => updateField('commentsCount', e.target.value)}
              placeholder="1,842"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium"
            />
          </div>

          {/* Bookmarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center space-x-1">
              <Bookmark className="w-3 h-3 text-amber-500" />
              <span>Bookmarks Count</span>
            </label>
            <input
              type="text"
              value={data.bookmarksCount || ''}
              onChange={(e) => updateField('bookmarksCount', e.target.value)}
              placeholder="12.5K"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium"
            />
            <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={!!data.isBookmarked}
                onChange={(e) => updateField('isBookmarked', e.target.checked)}
                className="rounded text-purple-600 focus:ring-0 accent-purple-600"
              />
              <span>Saved / Bookmarked (Yellow)</span>
            </label>
          </div>

          {/* Shares */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center space-x-1">
              <Share2 className="w-3 h-3 text-purple-500" />
              <span>Shares Count</span>
            </label>
            <input
              type="text"
              value={data.sharesCount || ''}
              onChange={(e) => updateField('sharesCount', e.target.value)}
              placeholder="3,219"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium"
            />
          </div>
        </div>

        {/* Follow state */}
        <div className="pt-1">
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700 font-semibold text-xs">
            <input
              type="checkbox"
              checked={!!data.isFollowed}
              onChange={(e) => updateField('isFollowed', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span>Followed (Hide Red Plus Icon on Avatar)</span>
          </label>
        </div>
      </div>

      {/* 5. Navigation Tab Selection */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Compass className="w-4 h-4 text-slate-500" />
          <span>Active Top Navigation Tab</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => updateField('activeNavTab', 'foryou')}
            className={`py-2 px-3 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
              data.activeNavTab === 'foryou' || !data.activeNavTab
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            For You
          </button>

          <button
            type="button"
            onClick={() => updateField('activeNavTab', 'following')}
            className={`py-2 px-3 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
              data.activeNavTab === 'following'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Following
          </button>

          <button
            type="button"
            onClick={() => updateField('activeNavTab', 'friends')}
            className={`py-2 px-3 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
              data.activeNavTab === 'friends'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Friends
          </button>

          <button
            type="button"
            onClick={() => updateField('activeNavTab', 'location')}
            className={`py-2 px-3 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
              data.activeNavTab === 'location'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Location ({data.locationText || 'Sleman'})
          </button>
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
