import React from 'react';
import { TikTokFeedLiveData, CharacterPreset } from '../types';
import { CharacterSelector, ImageUploader, SaveProfileButton } from './FormControls';
import { useLanguage } from '../context/LanguageContext';
import { Radio, MapPin, User, FileText, Repeat } from 'lucide-react';

interface Props {
  data: TikTokFeedLiveData;
  onChange: (updated: TikTokFeedLiveData) => void;
  characters?: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter?: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter?: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const TikTokFeedLiveForm: React.FC<Props> = ({
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
  const updateField = <K extends keyof TikTokFeedLiveData>(
    key: K,
    value: TikTokFeedLiveData[K]
  ) => {
    onChange({ ...data, [key]: value });
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

      {/* 1. Live Background & Broadcaster Details */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Radio className="w-4 h-4 text-red-500" />
          <span>LIVE Broadcast Background</span>
        </h3>

        {/* Live Background Image */}
        <ImageUploader
          label="LIVE Broadcast Background Image"
          currentImage={data.liveImage}
          onImageChange={(newImg) => updateField('liveImage', newImg)}
          aspectRatio="9:16"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Broadcaster Username */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Broadcaster Username
            </label>
            <input
              type="text"
              value={data.username || ''}
              onChange={(e) => updateField('username', e.target.value)}
              placeholder="username"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          {/* Location Name */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Location Name</span>
            </label>
            <input
              type="text"
              value={data.locationText || ''}
              onChange={(e) => updateField('locationText', e.target.value)}
              placeholder="City"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Caption */}
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center space-x-1">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>LIVE Title / Caption Description</span>
          </label>
          <textarea
            rows={2}
            value={data.caption || ''}
            onChange={(e) => updateField('caption', e.target.value)}
            placeholder="Your text goes here"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
        </div>
      </div>

      {/* 2. Navigation Settings */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Active Feed Navigation Tab
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => updateField('activeNavTab', 'foryou')}
            className={`py-2 px-3 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
              data.activeNavTab === 'foryou' || !data.activeNavTab
                ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
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
                ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
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
                ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
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
                ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Location
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
