import React, { useState, useRef, useEffect } from 'react';
import { Folder, Edit2, Check, X } from 'lucide-react';

export interface UniversalFolderItemProps {
  id: string;
  name?: string;
  index: number;
  isActive: boolean;
  isDark: boolean;
  language?: string;
  totalFolders: number;
  onSelect: () => void;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
}

export const UniversalFolderItem: React.FC<UniversalFolderItemProps> = ({
  id,
  name,
  index,
  isActive,
  isDark,
  language = 'en',
  totalFolders,
  onSelect,
  onRename,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const defaultLabel = name && name.trim() !== '' ? name.trim() : `Folder ${index + 1}`;
  const [editingName, setEditingName] = useState(defaultLabel);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep local editing name in sync when prop name changes externally while not editing
  useEffect(() => {
    if (!isEditing) {
      setEditingName(defaultLabel);
    }
  }, [name, isEditing, defaultLabel]);

  // Focus and select input text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartRename = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation();
    if ('preventDefault' in e) e.preventDefault();
    if (!onRename) return;
    setEditingName(defaultLabel);
    setIsEditing(true);
  };

  const handleConfirmRename = (e?: React.MouseEvent | React.KeyboardEvent | React.FocusEvent) => {
    if (e && 'stopPropagation' in e) {
      e.stopPropagation();
      if ('preventDefault' in e) e.preventDefault();
    }
    const clean = editingName.trim();
    setIsEditing(false);
    if (clean && clean !== defaultLabel && onRename) {
      onRename(id, clean);
    } else {
      setEditingName(defaultLabel);
    }
  };

  const handleCancelRename = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingName(defaultLabel);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirmRename(e);
    } else if (e.key === 'Escape') {
      handleCancelRename(e);
    }
  };

  return (
    <div
      id={`universal-folder-item-${id || index}`}
      data-no-swipe="true"
      onClick={(e) => {
        if (!isEditing) {
          e.stopPropagation();
          onSelect();
        }
      }}
      className={`inline-flex items-center rounded-lg border transition-all select-none cursor-pointer ${
        isActive
          ? 'bg-purple-600 border-purple-600 text-white shadow-xs ring-2 ring-purple-400/50'
          : isDark
          ? 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 hover:border-purple-400 text-slate-200'
          : 'bg-slate-50 hover:bg-purple-50/80 border-slate-200 hover:border-purple-300 text-slate-700'
      }`}
    >
      {isEditing ? (
        /* Inline Rename Input & Action Buttons */
        <div
          id={`folder-inline-rename-form-${id || index}`}
          data-no-swipe="true"
          className="flex items-center gap-1 px-1.5 py-1"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Folder className="w-3.5 h-3.5 ml-0.5 mr-0.5 shrink-0 text-purple-300 dark:text-purple-400" />
          <input
            ref={inputRef}
            type="text"
            id={`folder-tab-input-${id || index}`}
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => handleConfirmRename()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label={language === 'id' ? 'Nama folder baru' : 'New folder name'}
            className="px-2 py-0.5 text-xs font-semibold rounded border border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 min-w-[70px] max-w-[130px] sm:min-w-[90px] sm:max-w-[150px]"
          />
          {/* Confirm Button */}
          <button
            type="button"
            id={`folder-tab-confirm-${id || index}`}
            title={language === 'id' ? 'Simpan nama folder (Enter)' : 'Save folder name (Enter)'}
            aria-label={language === 'id' ? 'Simpan' : 'Save'}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={handleConfirmRename}
            className="p-1 rounded-md transition-colors cursor-pointer text-emerald-300 hover:text-emerald-100 hover:bg-purple-700/80 active:scale-95"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
          {/* Cancel Button */}
          <button
            type="button"
            id={`folder-tab-cancel-${id || index}`}
            title={language === 'id' ? 'Batalkan (Esc)' : 'Cancel (Esc)'}
            aria-label={language === 'id' ? 'Batal' : 'Cancel'}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={handleCancelRename}
            className="p-1 rounded-md transition-colors cursor-pointer text-purple-200 hover:text-white hover:bg-purple-700/80 active:scale-95"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      ) : (
        /* Normal Folder Display */
        <>
          <button
            type="button"
            id={`folder-tab-btn-${id || index}`}
            role="tab"
            aria-selected={isActive}
            onDoubleClick={(e) => {
              if (onRename) handleStartRename(e);
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className={`cursor-pointer px-2.5 py-1.5 text-xs tracking-tight whitespace-nowrap font-bold transition-opacity flex items-center space-x-1.5 ${
              isActive ? 'text-white' : 'opacity-90 hover:opacity-100'
            }`}
          >
            <Folder className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white/90' : isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            <span>{defaultLabel}</span>
          </button>

          {/* Edit/Pencil Button — Small, clean, visible on every folder item */}
          {onRename && (
            <button
              type="button"
              id={`folder-tab-rename-${id || index}`}
              title={language === 'id' ? `Ganti nama ${defaultLabel}` : `Rename ${defaultLabel}`}
              aria-label={language === 'id' ? `Ganti nama ${defaultLabel}` : `Rename ${defaultLabel}`}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => {
                e.stopPropagation();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleStartRename}
              className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                isActive
                  ? 'text-purple-200 hover:text-white hover:bg-purple-700/80'
                  : isDark
                  ? 'text-slate-400 hover:text-purple-300 hover:bg-slate-700'
                  : 'text-slate-400 hover:text-purple-600 hover:bg-slate-200'
              } ${onDelete && totalFolders > 1 && index !== 0 ? 'mr-0.5' : 'mr-1.5'}`}
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}

          {/* Delete Button — Preserves first default folder */}
          {onDelete && totalFolders > 1 && index !== 0 && (
            <button
              type="button"
              id={`folder-tab-delete-${id || index}`}
              title={language === 'id' ? `Hapus ${defaultLabel}` : `Delete ${defaultLabel}`}
              aria-label={language === 'id' ? `Hapus ${defaultLabel}` : `Delete ${defaultLabel}`}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete(id);
              }}
              className={`mr-1.5 p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                isActive
                  ? 'text-purple-200 hover:text-white hover:bg-purple-700/80'
                  : 'text-slate-400 hover:text-rose-500 ' + (isDark ? 'hover:bg-rose-950/40' : 'hover:bg-rose-50')
              }`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </>
      )}
    </div>
  );
};
