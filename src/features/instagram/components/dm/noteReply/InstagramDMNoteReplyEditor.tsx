import { Trash2 } from 'lucide-react';
import { useId } from 'react';
import type { InstagramDMMessage } from '../../../../../types';
import { ImageUploader } from '../../../../../components/FormControls';
import { useLanguage } from '../../../../../context/LanguageContext';
import { clearNoteReply, hasNoteReply } from './noteReply';

interface Props {
  message: InstagramDMMessage;
  onChange: (patch: Partial<InstagramDMMessage>) => void;
}

export function InstagramDMNoteReplyEditor({ message, onChange }: Props) {
  const { isId } = useLanguage();
  const fieldId = useId();
  const enabled = hasNoteReply(message);
  const inputClass = 'w-full min-w-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500';
  const fields = [
    ['noteText', isId ? 'Teks Catatan' : 'Note Text'],
    ['noteSongTitle', isId ? 'Judul Lagu' : 'Song Title'],
    ['noteArtistName', isId ? 'Nama Artis' : 'Artist Name'],
    ['noteOwnerName', isId ? 'Nama Pemilik Catatan' : 'Note Owner Name'],
  ] as const;

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-3" data-note-reply-editor>
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={(event) => onChange(event.target.checked ? { isNoteReply: true } : clearNoteReply)} className="w-4 h-4 accent-purple-600" />
          {isId ? 'Balas Catatan (Reply to Notes)' : 'Reply to Notes'}
        </label>
        {enabled && <button type="button" onClick={() => onChange(clearNoteReply)} title={isId ? 'Hapus Catatan' : 'Clear Note'} aria-label={isId ? 'Hapus Catatan' : 'Clear Note'} className="p-1 text-red-500 hover:text-red-600"><Trash2 size={16} /></button>}
      </div>
      {enabled && <>
        {fields.map(([field, label]) => (
          <div key={field} className="text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1">
            <label htmlFor={`${fieldId}-${field}`} className="block">{label}</label>
            {field === 'noteText'
              ? <textarea id={`${fieldId}-${field}`} rows={2} value={message[field] || ''} onChange={(event) => onChange({ [field]: event.target.value })} className={`${inputClass} resize-y`} />
              : <input id={`${fieldId}-${field}`} type="text" value={message[field] || ''} onChange={(event) => onChange({ [field]: event.target.value })} className={inputClass} />}
          </div>
        ))}
        <ImageUploader label={isId ? 'Avatar Pemilik Catatan' : 'Note Owner Avatar'} value={message.noteOwnerAvatar || ''} onChange={(url) => onChange({ noteOwnerAvatar: url })} onClear={() => onChange({ noteOwnerAvatar: '' })} storageCategory="avatars" />
      </>}
    </div>
  );
}
