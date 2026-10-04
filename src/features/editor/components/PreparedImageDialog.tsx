import React, {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Download, ExternalLink, Share2, X} from 'lucide-react';
import type {AppLanguage} from '../../../context/LanguageContext';

export function PreparedImageDialog({file, language, onClose}: {
  file: File | null; language: AppLanguage; onClose: () => void;
}) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setUrl(imageUrl); setError('');
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      // Safari may still be reading the file in a new tab or native share sheet.
      setTimeout(() => URL.revokeObjectURL(imageUrl), 60000);
    };
  }, [file]);
  if (!file) return null;
  const isId = language === 'id';
  const canShare = typeof navigator.canShare === 'function' && navigator.canShare({files: [file]});
  const share = async () => {
    setError(''); setSharing(true);
    try {
      await navigator.share({files: [file]});
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError(isId ? 'Gagal membagikan gambar.' : 'Could not share image.');
      }
    } finally {setSharing(false);}
  };
  return createPortal(
    <dialog ref={dialog} onCancel={onClose} aria-labelledby="prepared-image-title"
      className="m-auto w-[calc(100%_-_24px)] max-w-md max-h-[90dvh] overflow-auto rounded-lg border border-gray-200 bg-white p-4 text-gray-900 backdrop:bg-black/60">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 id="prepared-image-title" className="text-base font-bold">{isId ? 'Gambar siap' : 'Image ready'}</h2>
        <button type="button" onClick={onClose} disabled={sharing} aria-label={isId ? 'Tutup' : 'Close'} title={isId ? 'Tutup' : 'Close'} className="p-2"><X size={20}/></button>
      </div>
      {url && <img src={url} alt={isId ? 'Hasil ekspor' : 'Exported image'} className="w-full max-h-[55dvh] object-contain mb-4"/>}
      <div className="flex flex-wrap gap-2">
        {canShare && <button type="button" onClick={share} disabled={sharing} className="flex items-center gap-2 rounded-md bg-purple-600 px-3 py-2 text-sm text-white"><Share2 size={16}/>{isId ? 'Simpan / Bagikan' : 'Save / Share'}</button>}
        <a href={url} download={file.name} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><Download size={16}/>{isId ? 'Unduh' : 'Download'}</a>
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><ExternalLink size={16}/>{isId ? 'Buka gambar' : 'Open image'}</a>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </dialog>, document.body);
}
