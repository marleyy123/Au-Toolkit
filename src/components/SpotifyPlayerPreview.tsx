import React, { useRef, useState } from 'react';
import { SpotifyData, SpotifyTheme } from '../types';
import { Music2 } from 'lucide-react';
import { renderEmojiText } from '../utils/emojiUtils';

interface Props {
  data: SpotifyData;
  onUpdate?: (data: Partial<SpotifyData>) => void;
  onChange?: (data: SpotifyData) => void;
  previewRef?: React.RefObject<HTMLDivElement>;
}

export const SpotifyPlayerPreview: React.FC<Props> = ({ data, onUpdate, onChange, previewRef }) => {
  const safeData = data || ({} as Partial<SpotifyData>);
  const {
    songTitle,
    artistName,
    albumName,
    coverUrl,
    totalDuration,
    currentTime,
    progressPercent,
    isPlaying,
    theme = 'dark',
    cardWidth = 380,
    deviceName = 'iPhone',
    volumePercent = 75,
  } = safeData as any;

  const localRef = useRef<HTMLDivElement>(null);
  const targetRef = previewRef || localRef;
  const [editingField, setEditingField] = useState<'title' | 'artist' | 'device' | null>(null);

  const handleUpdate = (patch: Partial<SpotifyData>) => {
    if (onUpdate) {
      onUpdate(patch);
    }
    if (onChange) {
      onChange({ ...(safeData as SpotifyData), ...patch });
    }
  };

  // Convert time "m:ss" or "m.ss" to seconds
  const parseTimeToSeconds = (timeStr: string): number => {
    const parts = (timeStr || '0.00').replace(':', '.').split('.');
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10) || 0;
      const secs = parseInt(parts[1], 10) || 0;
      return mins * 60 + secs;
    }
    return 0;
  };

  // Convert seconds to formatted time string with configurable separator (default '.')
  const formatSecondsToTime = (totalSecs: number, separator = '.'): string => {
    const s = Math.max(0, Math.floor(totalSecs));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}${separator}${secs < 10 ? '0' : ''}${secs}`;
  };

  // Scrubber click handler to jump progress
  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercent = Math.min(100, Math.max(0, Math.round((clickX / rect.width) * 100)));
    const totalSecs = parseTimeToSeconds(effectiveTotalDuration);
    const currentSecs = Math.round((newPercent / 100) * totalSecs);

    handleUpdate({
      progressPercent: newPercent,
      currentTime: formatSecondsToTime(currentSecs, timeSep),
    });
  };

  // Volume slider click handler
  const handleVolumeBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercent = Math.min(100, Math.max(0, Math.round((clickX / rect.width) * 100)));
    handleUpdate({
      volumePercent: newPercent,
    });
  };

  const hasCover = Boolean(coverUrl && coverUrl.trim() !== '');
  const cleanCover = coverUrl || '';
  const widthPx = Math.max(300, Math.min(480, cardWidth || 380));

  // Effective fallback texts so live preview shows defaults when inputs are empty/placeholders
  const effectiveSongTitle = songTitle?.trim() || 'Hati-Hati di Jalan';
  const effectiveArtistName = artistName?.trim() || 'Tulus';
  const effectiveDeviceName = deviceName?.trim() || 'iPhone';
  const effectiveCurrentTime = currentTime?.trim() || '1.15';
  const effectiveTotalDuration = totalDuration?.trim() || '2.36';

  // Format separator: prefer ':' if user explicitly inputted a colon, otherwise default to '.'
  const timeSep = (effectiveCurrentTime.includes(':') || effectiveTotalDuration.includes(':')) ? ':' : '.';

  // Remaining duration calculation
  const totalSecs = parseTimeToSeconds(effectiveTotalDuration);
  const curSecs = parseTimeToSeconds(effectiveCurrentTime);
  const remainingSecs = Math.max(0, totalSecs - curSecs);
  const displayRemaining = `-${formatSecondsToTime(remainingSecs, timeSep)}`;

  // Subtitle text: if albumName exists show "Artist — Album", otherwise "Artist"
  const displayArtist = effectiveArtistName;
  const subtitleText = albumName ? `${displayArtist} — ${albumName}` : displayArtist;

  // Active theme configuration: Dark, Pastel Pink, Pastel Blue
  const activeTheme: SpotifyTheme = (theme === 'pink' || theme === 'blue') ? theme : 'dark';

  const themeDictionary = {
    dark: {
      cardBg: 'bg-[#0b1325]/85 border-white/10 text-white shadow-2xl shadow-black/60',
      gradientBg: 'from-[#132240] to-[#0b1325]',
      overlayBg: 'bg-black/45 backdrop-blur-md',
      coverBorder: 'border-white/10 bg-neutral-900/60 shadow-2xl',
      titleText: 'text-white',
      titleBorder: 'border-white',
      subtitleText: 'text-white/70',
      subtitleBorder: 'border-white/60',
      deviceText: 'text-white/50 hover:text-white/70',
      airplayIcon: 'text-white/90',
      trackBar: 'bg-white/25',
      fillBar: 'bg-white',
      scrubKnob: 'bg-white shadow-md',
      timeText: 'text-white/60',
      controlButtons: 'text-white hover:text-white/80',
      playButtonWrap: 'p-2 cursor-pointer transition-transform active:scale-95 text-white hover:text-white/80',
      speakerIcon: 'text-white/70 hover:text-white',
    },
    pink: {
      cardBg: 'bg-gradient-to-b from-[#fdf2f8]/95 via-[#fce7f3]/95 to-[#fed7e2]/95 border-pink-200/80 text-[#4c0519] shadow-xl shadow-pink-200/40',
      gradientBg: 'from-[#fdf2f8] via-[#fce7f3] to-[#fed7e2]',
      overlayBg: 'bg-pink-100/30 backdrop-blur-md',
      coverBorder: 'border-pink-200/70 bg-pink-100/50 shadow-xl shadow-pink-200/40',
      titleText: 'text-[#4c0519]',
      titleBorder: 'border-[#be185d]',
      subtitleText: 'text-[#881337]/80',
      subtitleBorder: 'border-[#be185d]/60',
      deviceText: 'text-[#9d174d]/75 hover:text-[#881337]',
      airplayIcon: 'text-[#881337]/85',
      trackBar: 'bg-pink-200/90',
      fillBar: 'bg-gradient-to-r from-pink-400 to-rose-400',
      scrubKnob: 'bg-white border border-pink-300 shadow-md',
      timeText: 'text-[#9d174d]/75',
      controlButtons: 'text-[#881337] hover:text-[#4c0519]',
      playButtonWrap: 'p-2 cursor-pointer transition-transform active:scale-95 text-[#881337] hover:text-[#4c0519]',
      speakerIcon: 'text-[#881337]/80 hover:text-[#4c0519]',
    },
    blue: {
      cardBg: 'bg-gradient-to-b from-[#f0f9ff]/95 via-[#e0f2fe]/95 to-[#dbeafe]/95 border-blue-200/80 text-[#0f172a] shadow-xl shadow-blue-200/40',
      gradientBg: 'from-[#f0f9ff] via-[#e0f2fe] to-[#dbeafe]',
      overlayBg: 'bg-blue-100/30 backdrop-blur-md',
      coverBorder: 'border-blue-200/70 bg-blue-100/50 shadow-xl shadow-blue-200/40',
      titleText: 'text-[#0f172a]',
      titleBorder: 'border-[#2563eb]',
      subtitleText: 'text-[#1e3a8a]/80',
      subtitleBorder: 'border-[#2563eb]/60',
      deviceText: 'text-[#2563eb]/75 hover:text-[#1e3a8a]',
      airplayIcon: 'text-[#1e3a8a]/85',
      trackBar: 'bg-blue-200/90',
      fillBar: 'bg-gradient-to-r from-blue-400 to-sky-400',
      scrubKnob: 'bg-white border border-blue-300 shadow-md',
      timeText: 'text-[#2563eb]/75',
      controlButtons: 'text-[#1e3a8a] hover:text-[#0f172a]',
      playButtonWrap: 'p-2 cursor-pointer transition-transform active:scale-95 text-[#1e3a8a] hover:text-[#0f172a]',
      speakerIcon: 'text-[#1e3a8a]/80 hover:text-[#0f172a]',
    },
  };
  const themeStyles = themeDictionary[activeTheme] || themeDictionary.dark;

  const volume = volumePercent !== undefined ? volumePercent : 75;

  return (
    <div
      ref={targetRef}
      id="preview-target"
      style={{
        width: `${widthPx}px`,
        maxWidth: '100%',
      }}
      className={`mx-auto rounded-[32px] select-none relative overflow-hidden transition-all p-5 sm:p-6 flex flex-col justify-between backdrop-blur-2xl border ${themeStyles.cardBg}`}
    >
      {/* Background Effect for Frosted Blur Glass Style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 rounded-[32px]">
        {hasCover ? (
          <img
            src={cleanCover}
            alt=""
            className={`w-full h-full object-cover scale-150 blur-3xl filter ${
              activeTheme === 'dark' ? 'opacity-35' : 'opacity-20 mix-blend-multiply'
            }`}
            crossOrigin="anonymous"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-b ${themeStyles.gradientBg}`} />
        )}
        <div className={`absolute inset-0 ${themeStyles.overlayBg}`} />
      </div>

      {/* 1. ALBUM COVER ART WITH INTEGRATED SPOTIFY BADGE */}
      <div className="relative w-full mb-4 flex justify-center items-center">
        <div className={`relative w-full aspect-square rounded-2xl overflow-hidden z-10 border flex items-center justify-center ${themeStyles.coverBorder}`}>
          {hasCover ? (
            <img
              src={cleanCover}
              alt={songTitle || 'Hati-Hati di Jalan'}
              className="w-full h-full object-cover transition-transform duration-500"
              crossOrigin="anonymous"
            />
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center p-6 ${activeTheme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>
              <Music2 className="w-16 h-16 stroke-[1.5]" />
            </div>
          )}

          {/* Subtle gloss reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/10 pointer-events-none" />

          {/* Spotify Badge at Bottom Right: Black Rounded Square ("Kotak Tumpul") with Enlarged Green Spotify Icon */}
          <div className="absolute bottom-3 right-3 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-black/90 border border-white/15 flex items-center justify-center shadow-xl z-20">
            <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 fill-[#1DB954]">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.627.627 0 0 1-.86.208c-2.355-1.439-5.318-1.764-8.81-.966a.627.627 0 1 1-.28-1.222c3.818-.872 7.098-.5 9.742 1.12.302.185.394.577.208.86zm1.226-2.723a.786.786 0 0 1-1.08.26c-2.695-1.656-6.804-2.135-9.992-1.167a.786.786 0 1 1-.462-1.502c3.642-1.107 8.188-.574 11.274 1.328.349.214.46.66.26 1.081zm.105-2.836C14.69 8.878 9.387 8.7 6.305 9.636a.944.944 0 0 1-.557-1.802c3.542-1.074 9.404-.863 13.14 1.355.424.251.564.799.312 1.223a.943.943 0 0 1-1.282.453z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. DEVICE CONTEXT & TRACK TITLE / ARTIST + AIRPLAY ICON */}
      <div className="w-full mb-3">
        {/* Device Name Label (Default "iPhone") */}
        {editingField === 'device' ? (
          <input
            type="text"
            autoFocus
            value={deviceName || ''}
            onFocus={(e) => {
              if (e.target.value) e.target.select();
            }}
            onBlur={() => setEditingField(null)}
            onChange={(e) => handleUpdate({ deviceName: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditingField(null);
            }}
            placeholder="iPhone"
            className={`text-xs font-semibold bg-transparent border-b ${themeStyles.titleBorder} focus:outline-none tracking-tight py-0.5 mb-1 ${themeStyles.deviceText}`}
          />
        ) : (
          <p
            onClick={() => setEditingField('device')}
            className={`text-xs font-semibold tracking-tight cursor-pointer transition-colors mb-1 min-h-[1rem] ${themeStyles.deviceText}`}
            title="Click to edit device label"
          >
            {renderEmojiText(effectiveDeviceName)}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex-1 min-w-0">
            {/* Song Title (Default "Hati-Hati di Jalan") */}
            {editingField === 'title' ? (
              <input
                type="text"
                autoFocus
                value={songTitle || ''}
                onFocus={(e) => {
                  if (e.target.value) e.target.select();
                }}
                onBlur={() => setEditingField(null)}
                onChange={(e) => handleUpdate({ songTitle: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditingField(null);
                }}
                placeholder="Hati-Hati di Jalan"
                className={`w-full text-xl sm:text-2xl font-bold bg-transparent border-b ${themeStyles.titleBorder} focus:outline-none tracking-tight py-0.5 leading-tight ${themeStyles.titleText}`}
              />
            ) : (
              <h2
                onClick={() => setEditingField('title')}
                className={`text-xl sm:text-2xl font-bold tracking-tight truncate cursor-pointer hover:opacity-90 min-h-[1.75rem] leading-tight ${themeStyles.titleText}`}
                title="Click to edit title"
              >
                {renderEmojiText(effectiveSongTitle)}
              </h2>
            )}

            {/* Artist Subtitle (Default "Tulus") */}
            {editingField === 'artist' ? (
              <input
                type="text"
                autoFocus
                value={artistName || ''}
                onFocus={(e) => {
                  if (e.target.value) e.target.select();
                }}
                onBlur={() => setEditingField(null)}
                onChange={(e) => handleUpdate({ artistName: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditingField(null);
                }}
                placeholder="Tulus"
                className={`w-full text-sm font-medium bg-transparent border-b ${themeStyles.subtitleBorder} focus:outline-none tracking-tight py-0.5 mt-0.5 ${themeStyles.subtitleText}`}
              />
            ) : (
              <p
                onClick={() => setEditingField('artist')}
                className={`text-sm sm:text-base font-medium truncate mt-0.5 cursor-pointer hover:opacity-90 min-h-[1.25rem] ${themeStyles.subtitleText}`}
                title="Click to edit artist"
              >
                {renderEmojiText(subtitleText)}
              </p>
            )}
          </div>

          {/* iOS AirPlay Audio Route Icon */}
          <div className={`shrink-0 p-1.5 ${themeStyles.airplayIcon}`} title="AirPlay Audio">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              {/* Rounded Triangle at bottom */}
              <path
                d="M 11.1 12.6 L 7.3 18.8 C 6.7 19.7 7.3 20.6 8.3 20.6 L 15.7 20.6 C 16.7 20.6 17.3 19.7 16.7 18.8 L 12.9 12.6 C 12.5 12.0 11.5 12.0 11.1 12.6 Z"
                fill="currentColor"
              />
              {/* Arc 1: Innermost concentric wave arching over the apex */}
              <path
                d="M 8.65 13.28 A 3.8 3.8 0 1 1 15.35 13.28"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              {/* Arc 2: Middle concentric wave */}
              <path
                d="M 6.63 14.60 A 6.2 6.2 0 1 1 17.37 14.60"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              {/* Arc 3: Outermost concentric wave */}
              <path
                d="M 5.04 16.55 A 8.6 8.6 0 1 1 18.96 16.55"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. PROGRESS BAR (INTERACTIVE SCRUBBER) */}
      <div className="w-full space-y-1 my-2">
        <div
          onClick={handleScrubberClick}
          className={`w-full h-1.5 rounded-full cursor-pointer relative group transition-all ${themeStyles.trackBar}`}
          title="Click to scrub position"
        >
          <div
            className={`h-full rounded-full transition-all ${themeStyles.fillBar}`}
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>

        {/* Time Labels: Elapsed on Left, Remaining on Right matching reference */}
        <div className={`flex justify-between text-xs font-medium tracking-tight pt-0.5 min-h-[1.2rem] ${themeStyles.timeText}`}>
          <span>{effectiveCurrentTime}</span>
          <span>{displayRemaining}</span>
        </div>
      </div>

      {/* 4. PLAYER CONTROLS: EXACTLY 3 ICONS (PREVIOUS, PLAY/PAUSE, NEXT) */}
      <div className="flex items-center justify-center gap-10 sm:gap-14 my-2.5 w-full">
        {/* Previous Track / Rewind */}
        <button
          type="button"
          onClick={() => {
            handleUpdate({
              currentTime: timeSep === '.' ? '0.00' : '0:00',
              progressPercent: 0,
            });
          }}
          className={`p-2 cursor-pointer transition-transform active:scale-90 ${themeStyles.controlButtons}`}
          title="Previous Track"
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-9 sm:h-9 fill-current">
            <path d="m11 5-9 7 9 7V5zm11 0-9 7 9 7V5z" />
          </svg>
        </button>

        {/* Big Play / Pause Button with Pastel Pill/Circle Accent */}
        <button
          type="button"
          onClick={() => handleUpdate({ isPlaying: !isPlaying })}
          className={themeStyles.playButtonWrap}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" className="w-9 h-9 sm:w-10 sm:h-10 fill-current">
              <rect x="5.5" y="4.5" width="4.5" height="15" rx="1.5" />
              <rect x="14" y="4.5" width="4.5" height="15" rx="1.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-9 h-9 sm:w-10 sm:h-10 fill-current translate-x-0.5">
              <path d="M7 4.5v15l13-7.5z" />
            </svg>
          )}
        </button>

        {/* Next Track / Fast-Forward */}
        <button
          type="button"
          onClick={() => {
            handleUpdate({
              currentTime: timeSep === '.' ? '0.00' : '0:00',
              progressPercent: 0,
            });
          }}
          className={`p-2 cursor-pointer transition-transform active:scale-90 ${themeStyles.controlButtons}`}
          title="Next Track"
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-9 sm:h-9 fill-current">
            <path d="m13 19 9-7-9-7v14zm-11 0 9-7-9-7v14z" />
          </svg>
        </button>
      </div>

      {/* 5. SPEAKER / VOLUME SLIDER BAR (Follows reference image layout) */}
      <div className="flex items-center gap-3 w-full px-1.5 mt-2 pb-1">
        {/* Speaker Low Volume Icon with small wave arc */}
        <button
          type="button"
          onClick={() => handleUpdate({ volumePercent: 0 })}
          className={`p-1 -ml-1 ${themeStyles.speakerIcon} transition-colors cursor-pointer shrink-0`}
          title="Low Volume"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-current">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Interactive Volume Track with Scrubber Knob */}
        <div
          onClick={handleVolumeBarClick}
          className="flex-1 h-5 cursor-pointer relative group transition-all flex items-center"
          title={`Volume: ${volume}%`}
        >
          {/* Track background */}
          <div className={`w-full h-1 rounded-full ${themeStyles.trackBar} relative overflow-hidden`}>
            {/* Active filled volume */}
            <div
              className={`h-full rounded-full ${themeStyles.fillBar} transition-all`}
              style={{ width: `${volume}%` }}
            />
          </div>
          {/* Knob handle circle */}
          <div
            className={`w-4 h-4 rounded-full ${themeStyles.scrubKnob} absolute -translate-x-1/2 transition-transform scale-100 group-hover:scale-125`}
            style={{ left: `${volume}%` }}
          />
        </div>

        {/* Speaker High Volume Icon */}
        <button
          type="button"
          onClick={() => handleUpdate({ volumePercent: 100 })}
          className={`p-1 -mr-1 ${themeStyles.speakerIcon} transition-colors cursor-pointer shrink-0`}
          title="Max Volume"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-current">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};
