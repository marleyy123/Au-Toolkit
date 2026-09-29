import React, { useState } from 'react';
import { auth } from '../firebase';
import { SpotifyData, SpotifyTheme, CharacterPreset } from '../types';
import { ImageUploader, CharacterSelector, SaveProfileButton } from './FormControls';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  Sparkles,
  Music2,
  Play,
  Pause,
  Sliders,
  Palette,
  Disc,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Volume2,
  Volume1,
} from 'lucide-react';

interface Props {
  data: SpotifyData;
  onChange: (updated: SpotifyData) => void;
  previewRef?: React.RefObject<HTMLDivElement>;
  characters?: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter?: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter?: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const SpotifyPlayerForm: React.FC<Props> = ({
  data,
  onChange,
  previewRef,
  characters,
  activeCharacterId,
  onSaveCharacter,
  onSaveProfile,
  onSelectCharacter,
  onDeleteCharacter,
  onRenameCharacter,
}) => {
  const { language } = useLanguage();
  const { isDark } = useTheme();
  const isId = language === 'id';

  const [inputUrl, setInputUrl] = useState(data?.spotifyUrl || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: '' });

  // Update helper
  const updateField = <K extends keyof SpotifyData>(field: K, value: SpotifyData[K]) => {
    onChange({
      ...((data || {}) as SpotifyData),
      [field]: value,
    });
  };

  // Enforce card style is always 'blur' and theme is one of dark | pink | blue
  React.useEffect(() => {
    if (!data) return;
    let needsUpdate = false;
    const patch: Partial<SpotifyData> = {};

    if (data.style !== 'blur') {
      patch.style = 'blur';
      needsUpdate = true;
    }
    if (!['dark', 'pink', 'blue'].includes(data.theme)) {
      patch.theme = 'dark';
      needsUpdate = true;
    }
    if (data.volumePercent === undefined) {
      patch.volumePercent = 75;
      needsUpdate = true;
    }

    if (needsUpdate) {
      onChange({
        ...data,
        ...patch,
      });
    }
  }, [data?.style, data?.theme, data?.volumePercent]);

  // Convert time string "m:ss" or "m.ss" to seconds
  const parseTimeToSeconds = (timeStr: string): number => {
    const parts = (timeStr || '0.00').replace(':', '.').split('.');
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10) || 0;
      const secs = parseInt(parts[1], 10) || 0;
      return mins * 60 + secs;
    }
    return 0;
  };

  // Convert seconds to "m.ss" (or "m:ss" based on separator)
  const formatSecondsToTime = (totalSecs: number, separator = '.'): string => {
    const s = Math.max(0, Math.floor(totalSecs));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}${separator}${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle progress slider change
  const handleProgressSlider = (percent: number) => {
    const totalSecs = parseTimeToSeconds(data.totalDuration || '2.36');
    const currentSecs = Math.round((percent / 100) * totalSecs);
    const sep = (data.totalDuration?.includes(':') || data.currentTime?.includes(':')) ? ':' : '.';
    onChange({
      ...data,
      progressPercent: percent,
      currentTime: formatSecondsToTime(currentSecs, sep),
    });
  };

  // Handle Spotify URL link generation
  const handleGenerateFromLink = async () => {
    const cleanUrl = inputUrl.trim();
    if (!cleanUrl) {
      setGenerateStatus({
        type: 'error',
        message: isId ? 'Silakan masukkan tautan lagu Spotify terlebih dahulu' : 'Please enter a Spotify track link first',
      });
      return;
    }

    setIsGenerating(true);
    setGenerateStatus({ type: 'idle', message: '' });

    try {
      // 1. Query server-side proxy
      const headers: Record<string, string> = {};
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }
      const response = await fetch(`/api/spotify-track?url=${encodeURIComponent(cleanUrl)}`, { headers });
      if (response.ok) {
        const json = await response.json();
        if (json.success) {
          onChange({
            ...data,
            spotifyUrl: cleanUrl,
            songTitle: json.songTitle || data.songTitle || 'Hati-Hati di Jalan',
            artistName: json.artistName || data.artistName || 'Tulus',
            albumName: json.albumName || json.songTitle || data.albumName,
            coverUrl: json.coverUrl || data.coverUrl,
            totalDuration: json.duration || data.totalDuration || '2:36',
            currentTime: '0:00',
            progressPercent: 0,
            isPlaying: true,
          });

          setGenerateStatus({
            type: 'success',
            message: isId ? 'Lagu Spotify berhasil dimuat!' : 'Spotify track loaded successfully!',
          });
          setIsGenerating(false);
          return;
        }
      }

      // 2. Client-side fallback if server fails
      const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        const rawTitle = oembedData.title || '';
        const author = oembedData.author_name || '';
        const thumb = (oembedData.thumbnail_url || '').replace('ab67616d00001e02', 'ab67616d0000b273');

        onChange({
          ...data,
          spotifyUrl: cleanUrl,
          songTitle: rawTitle || data.songTitle || 'Hati-Hati di Jalan',
          artistName: author || data.artistName || 'Tulus',
          albumName: rawTitle || data.albumName,
          coverUrl: thumb || data.coverUrl,
          totalDuration: data.totalDuration || '2:36',
        });

        setGenerateStatus({
          type: 'success',
          message: isId ? 'Data lagu berhasil dimuat!' : 'Song data loaded successfully!',
        });
        setIsGenerating(false);
        return;
      }

      // 3. Fallback notice
      setGenerateStatus({
        type: 'error',
        message: isId
          ? 'Tidak dapat memuat otomatis dari link ini. Silakan sesuaikan judul, artis & cover secara manual di bawah.'
          : 'Could not fetch track automatically. Please customize song title, artist & cover manually below.',
      });
    } catch (err) {
      console.warn('Spotify generate error:', err);
      setGenerateStatus({
        type: 'error',
        message: isId
          ? 'Koneksi ke Spotify terbatas. Anda dapat mengisi judul, artis, dan cover di form bawah.'
          : 'Direct link preview unavailable. You can freely edit title, artist, and cover in the form below.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const inputBgClass = isDark
    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-purple-500'
    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-500';

  const sectionHeaderClass = `text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b ${
    isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-200'
  }`;

  // Theme presets list
  const themePresets: { id: SpotifyTheme; name: string; bgStyle: string; borderStyle: string }[] = [
    {
      id: 'dark',
      name: isId ? 'Dark' : 'Dark',
      bgStyle: 'bg-[#0b1325]',
      borderStyle: 'border-slate-600',
    },
    {
      id: 'pink',
      name: isId ? 'Pastel Pink' : 'Pastel Pink',
      bgStyle: 'bg-gradient-to-br from-[#fce7f3] to-[#fed7e2]',
      borderStyle: 'border-pink-300',
    },
    {
      id: 'blue',
      name: isId ? 'Pastel Blue' : 'Pastel Blue',
      bgStyle: 'bg-gradient-to-br from-[#eff6ff] to-[#dbeafe]',
      borderStyle: 'border-blue-300',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Folder / Slot Presets Management */}
      {characters && characters.length > 0 && (
        <CharacterSelector
          characters={characters}
          activeCharacterId={activeCharacterId}
          onSelect={onSelectCharacter}
          onSaveCurrent={onSaveCharacter}
          onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
          addLabel="+ Add Folder"
        />
      )}

      {onSaveProfile && (
        <SaveProfileButton onSaveProfile={onSaveProfile} />
      )}

      {/* 1. SPOTIFY LINK INPUT & GENERATE */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            <span className="w-5 h-5 rounded-full bg-[#1DB954] flex items-center justify-center text-black shrink-0 shadow-xs">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.627.627 0 0 1-.86.208c-2.355-1.439-5.318-1.764-8.81-.966a.627.627 0 1 1-.28-1.222c3.818-.872 7.098-.5 9.742 1.12.302.185.394.577.208.86zm1.226-2.723a.786.786 0 0 1-1.08.26c-2.695-1.656-6.804-2.135-9.992-1.167a.786.786 0 1 1-.462-1.502c3.642-1.107 8.188-.574 11.274 1.328.349.214.46.66.26 1.081zm.105-2.836C14.69 8.878 9.387 8.7 6.305 9.636a.944.944 0 0 1-.557-1.802c3.542-1.074 9.404-.863 13.14 1.355.424.251.564.799.312 1.223a.943.943 0 0 1-1.282.453z" />
              </svg>
            </span>
            <span>{isId ? 'Impor Tautan Lagu Spotify' : 'Import Spotify Song Link'}</span>
          </label>
          <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Auto Fetch
          </span>
        </div>

        <p className={`text-[11px] mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {isId
            ? 'Tempelkan tautan lagu Spotify lalu tekan tombol Generate untuk memuat judul, artis, dan cover art otomatis.'
            : 'Paste a Spotify track link then click Generate to fetch song title, artist, and cover art automatically.'}
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGenerateFromLink();
                }
              }}
              placeholder="https://open.spotify.com/track/..."
              className={`w-full text-xs rounded-xl px-3 py-2.5 border focus:outline-none focus:ring-2 focus:ring-purple-500 ${inputBgClass}`}
            />
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateFromLink}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-purple-600/20 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isId ? 'Memproses...' : 'Processing...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate</span>
              </>
            )}
          </button>
        </div>

        {/* Generate Status Message */}
        {generateStatus.message && (
          <div
            className={`mt-2.5 p-2.5 rounded-xl text-xs flex items-start gap-2 ${
              generateStatus.type === 'success'
                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            {generateStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-purple-500" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span className="flex-1 leading-relaxed">{generateStatus.message}</span>
          </div>
        )}
      </div>

      {/* 2. CARD THEME SELECTION: DARK, PINK, BLUE */}
      <div className="space-y-3">
        <h3 className={sectionHeaderClass}>
          <Palette className="w-3.5 h-3.5 text-purple-500" />
          <span>{isId ? 'Pilihan Tema Card' : 'Card Theme Options'}</span>
        </h3>

        {/* 3 Theme Options: Dark, Pink, Blue */}
        <div className="grid grid-cols-3 gap-2">
          {themePresets.map((preset) => {
            const isSelected = data.theme === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => updateField('theme', preset.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center gap-1.5 relative ${
                  isSelected
                    ? 'border-purple-500 ring-2 ring-purple-500/30 shadow-sm'
                    : isDark
                    ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                {/* Theme Color Preview Swatch */}
                <div className={`w-8 h-8 rounded-lg ${preset.bgStyle} border ${preset.borderStyle} shadow-inner flex items-center justify-center`}>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <span className={`text-xs font-bold text-center ${isSelected ? 'text-purple-600 dark:text-purple-400' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Card Width */}
        <div className="pt-2">
          <div className="flex justify-between items-center mb-1">
            <label className={`text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {isId ? 'Lebar Kartu' : 'Card Width'}: {data.cardWidth || 380}px
            </label>
            <span className="text-[10px] text-slate-400">Default 380px</span>
          </div>
          <input
            type="range"
            min={300}
            max={460}
            step={10}
            value={data.cardWidth || 380}
            onChange={(e) => updateField('cardWidth', parseInt(e.target.value, 10))}
            className="w-full accent-purple-600 cursor-pointer mt-1"
          />
        </div>
      </div>

      {/* 3. ALBUM COVER ART UPLOAD (With URL placeholder) */}
      <div className="space-y-3">
        <h3 className={sectionHeaderClass}>
          <Disc className="w-3.5 h-3.5 text-purple-500" />
          <span>{isId ? 'Cover Art Album' : 'Album Cover Art'}</span>
        </h3>

        <ImageUploader
          label={isId ? 'Unggah / Ganti Cover Album' : 'Upload / Replace Album Cover'}
          value={data.coverUrl || ''}
          onChange={(url) => updateField('coverUrl', url)}
          aspectHint="1:1 Square"
          cropShape="rect"
          forceAspect={1}
          placeholder={isId ? 'https://example.com/cover.jpg atau tautan gambar...' : 'https://example.com/cover.jpg or image URL...'}
        />
      </div>

      {/* 4. TRACK INFO & DEVICE LABEL */}
      <div className="space-y-3">
        <h3 className={sectionHeaderClass}>
          <Music2 className="w-3.5 h-3.5 text-purple-500" />
          <span>{isId ? 'Detail Lagu' : 'Track Information'}</span>
        </h3>

        <div className="space-y-2.5">
          {/* Device Context / Label (Default "iPhone") */}
          <div>
            <label className={`text-[11px] font-semibold flex items-center gap-1 mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Smartphone className="w-3 h-3 text-purple-500" />
              <span>{isId ? 'Label Perangkat' : 'Device Label'}</span>
            </label>
            <input
              type="text"
              value={data.deviceName ?? ''}
              onChange={(e) => updateField('deviceName', e.target.value)}
              onFocus={(e) => {
                if (e.target.value) e.target.select();
              }}
              placeholder="iPhone"
              className={`w-full text-xs rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-purple-500 ${inputBgClass}`}
            />
          </div>

          {/* Song Title (Default "Hati-Hati di Jalan") */}
          <div>
            <label className={`text-[11px] font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {isId ? 'Judul Lagu (Song Title)' : 'Song Title'}
            </label>
            <input
              type="text"
              value={data.songTitle ?? ''}
              onChange={(e) => updateField('songTitle', e.target.value)}
              onFocus={(e) => {
                if (e.target.value) e.target.select();
              }}
              placeholder="Hati-Hati di Jalan"
              className={`w-full text-xs rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-purple-500 ${inputBgClass}`}
            />
          </div>

          {/* Artist Name (Default "Tulus") */}
          <div>
            <label className={`text-[11px] font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {isId ? 'Nama Penyanyi / Artis (Artist Name)' : 'Artist Name'}
            </label>
            <input
              type="text"
              value={data.artistName ?? ''}
              onChange={(e) => updateField('artistName', e.target.value)}
              onFocus={(e) => {
                if (e.target.value) e.target.select();
              }}
              placeholder="Tulus"
              className={`w-full text-xs rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-purple-500 ${inputBgClass}`}
            />
          </div>

          {/* Note: Album Name input has been completely removed from the form as requested */}
        </div>
      </div>

      {/* 5. PROGRESS BAR & DURATION CONTROLS */}
      <div className="space-y-3">
        <h3 className={sectionHeaderClass}>
          <Clock className="w-3.5 h-3.5 text-purple-500" />
          <span>{isId ? 'Durasi & Posisi Pemutaran' : 'Progress & Duration'}</span>
        </h3>

        <div className="space-y-3">
          {/* Progress Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {isId ? 'Posisi Progress' : 'Scrubber Progress'}: {data?.progressPercent ?? 48}%
              </span>
              <span className="text-[11px] text-purple-500 dark:text-purple-400 font-bold">
                {data?.currentTime || '1.15'} / {data?.totalDuration || '2.36'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={data?.progressPercent ?? 48}
              onChange={(e) => handleProgressSlider(parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Current Elapsed Time (Default "1.15") */}
            <div>
              <label className={`text-[11px] font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {isId ? 'Waktu Berjalan (Current Time)' : 'Current Elapsed Time'}
              </label>
              <input
                type="text"
                value={data.currentTime ?? ''}
                onChange={(e) => updateField('currentTime', e.target.value)}
                onFocus={(e) => {
                  if (e.target.value) e.target.select();
                }}
                placeholder="1.15"
                className={`w-full text-xs rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-purple-500 ${inputBgClass}`}
              />
            </div>

            {/* Total Duration (Default "2.36") */}
            <div>
              <label className={`text-[11px] font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {isId ? 'Total Durasi Lagu (Total Time)' : 'Total Duration'}
              </label>
              <input
                type="text"
                value={data.totalDuration ?? ''}
                onChange={(e) => updateField('totalDuration', e.target.value)}
                onFocus={(e) => {
                  if (e.target.value) e.target.select();
                }}
                placeholder="2.36"
                className={`w-full text-xs rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-purple-500 ${inputBgClass}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. PLAYBACK CONTROLS & SPEAKER VOLUME SLIDER */}
      <div className="space-y-3">
        <h3 className={sectionHeaderClass}>
          <Sliders className="w-3.5 h-3.5 text-purple-500" />
          <span>{isId ? 'Kontrol Pemutar & Volume' : 'Player Controls & Volume'}</span>
        </h3>

        <div className="space-y-3">
          {/* Speaker Volume Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <label className={`font-semibold flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Volume2 className="w-3.5 h-3.5 text-purple-500" />
                <span>{isId ? 'Pengatur Volume Speaker' : 'Speaker Volume Slider'}</span>
              </label>
              <span className="text-[11px] font-bold text-purple-500 dark:text-purple-400">
                {data?.volumePercent !== undefined ? data.volumePercent : 75}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Volume1 className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={data?.volumePercent !== undefined ? data.volumePercent : 75}
                onChange={(e) => updateField('volumePercent', parseInt(e.target.value, 10))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <Volume2 className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            </div>
          </div>

          {/* Play/Pause Button Toggle */}
          <button
            type="button"
            onClick={() => updateField('isPlaying', !data.isPlaying)}
            className={`w-full p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              data.isPlaying
                ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400 shadow-xs'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {data.isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{data.isPlaying ? (isId ? 'Status: Sedang Memutar (Playing)' : 'Status: Playing') : (isId ? 'Status: Dijeda (Paused)' : 'Status: Paused')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
