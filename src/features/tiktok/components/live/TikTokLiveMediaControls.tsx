import { useEffect, useRef, useState } from 'react';
import type { TikTokLiveData } from '../../../../types';
import { ImageUploader } from '../../../../components/FormControls';
import { useLanguage } from '../../../../context/LanguageContext';
import { getLocalMediaOwnerUid, persistLocalImageBlob } from '../../../../utils/imageManager';

export function TikTokLiveMediaControls({ data, onChange }: { data: TikTokLiveData; onChange: (data: TikTokLiveData) => void }) {
  const { isId } = useLanguage();
  const latest = useRef({ data, onChange });
  latest.current = { data, onChange };
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const video = data.liveMediaType === 'video';
  const update = (url: string, type: 'image' | 'video') => latest.current.onChange({ ...latest.current.data, liveMediaUrl: url, liveMediaType: type });

  return <div className="space-y-3">
    <ImageUploader label={isId ? 'Foto latar LIVE' : 'LIVE background photo'} value={video ? '' : data.liveMediaUrl}
      onChange={url => update(url, /\.(mp4|webm)(?:[?#]|$)/i.test(url) || url.startsWith('data:video/') ? 'video' : 'image')} onClear={() => update('', 'image')} forceAspect={9 / 16} />
    <label className="block text-xs font-semibold space-y-1">
      <span>{isId ? 'Video latar LIVE (MP4/WebM, maks. 15 MB)' : 'LIVE background video (MP4/WebM, max. 15 MB)'}</span>
      <input type="file" accept="video/mp4,video/webm" disabled={busy} className="block w-full text-xs" onChange={async event => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        if (!['video/mp4', 'video/webm'].includes(file.type) || file.size <= 0 || file.size > 15 * 1024 * 1024) {
          setError(isId ? 'Gunakan video MP4/WebM maksimal 15 MB.' : 'Use an MP4/WebM video up to 15 MB.');
          return;
        }
        setBusy(true); setError('');
        const uid = getLocalMediaOwnerUid();
        const originalSource = latest.current.data.liveMediaUrl;
        const tab = localStorage.getItem('au_last_active_tab') || 'tiktok-live';
        const folderKey = `au_active_folder_${uid}_${tab}`;
        const folder = localStorage.getItem(folderKey) || 'folder-1';
        try {
          const ref = await persistLocalImageBlob(uid, file, `${tab}:${folder}:live-video`);
          if (mounted.current && uid === getLocalMediaOwnerUid() && latest.current.data.liveMediaUrl === originalSource
            && (localStorage.getItem(folderKey) || 'folder-1') === folder) update(ref, 'video');
        } catch {
          if (mounted.current) setError(isId ? 'Video gagal disimpan. Coba lagi.' : 'The video could not be saved. Try again.');
        } finally { if (mounted.current) setBusy(false); }
      }} />
    </label>
    {busy && <p role="status" className="text-xs">{isId ? 'Menyimpan video…' : 'Saving video…'}</p>}
    {video && <button type="button" onClick={() => update('', 'image')} className="text-xs font-semibold text-red-600">{isId ? 'Hapus video' : 'Remove video'}</button>}
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    <p className="text-[11px] text-slate-500 dark:text-slate-400">{isId ? 'Media tersimpan lokal di browser ini. Ekspor video menghasilkan gambar dari frame yang sedang tampil.' : 'Media is saved locally in this browser. Video exports capture the currently displayed frame as an image.'}</p>
  </div>;
}
