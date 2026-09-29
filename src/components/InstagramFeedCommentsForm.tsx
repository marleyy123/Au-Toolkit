import React, { useState } from 'react';
import {
  InstagramFeedCommentsData,
  InstagramFeedCommentItem,
  InstagramFeedCommentReply,
  CharacterPreset,
} from '../types';
import { CharacterSelector, ImageUploader, VerifiedSelector, SaveProfileButton } from './FormControls';
import { useLanguage } from '../context/LanguageContext';
import {
  MessageSquare,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sun,
  Moon,
  CornerDownRight,
  Sparkles,
  Smile,
  Sliders,
  Pin,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DEFAULT_AVATAR } from '../data/defaultTemplates';

interface Props {
  data: InstagramFeedCommentsData;
  onChange: (updated: InstagramFeedCommentsData) => void;
  characters?: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter?: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter?: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const InstagramFeedCommentsForm: React.FC<Props> = ({
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

  const updateField = <K extends keyof InstagramFeedCommentsData>(
    key: K,
    value: InstagramFeedCommentsData[K]
  ) => {
    onChange({ ...data, [key]: value });
  };

  const handleAddComment = () => {
    const newComment: InstagramFeedCommentItem = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: '',
      avatar: '',
      verified: 'none',
      content: isId ? 'Keren banget kak! Sukses terus yaa 🙌' : 'This looks incredible! Keep it up 🙌',
      timestamp: '',
      likes: '',
      isLiked: false,
      isAuthor: false,
      isPinned: false,
      replies: [],
      showReplies: true,
    };
    updateField('comments', [...(data.comments || []), newComment]);
  };

  const handleUpdateComment = (index: number, updates: Partial<InstagramFeedCommentItem>) => {
    const next = [...(data.comments || [])];
    if (next[index]) {
      next[index] = { ...next[index], ...updates };
      updateField('comments', next);
    }
  };

  const handleDeleteComment = (index: number) => {
    const next = [...(data.comments || [])];
    next.splice(index, 1);
    updateField('comments', next);
  };

  const handleMoveComment = (index: number, direction: 'up' | 'down') => {
    const next = [...(data.comments || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx >= 0 && targetIdx < next.length) {
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      updateField('comments', next);
    }
  };

  const handleAddReply = (commentIndex: number) => {
    const next = [...(data.comments || [])];
    const comment = next[commentIndex];
    if (!comment) return;

    const newReply: InstagramFeedCommentReply = {
      id: `reply_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: '',
      avatar: '',
      verified: 'none',
      content: isId ? 'Terima kasih banyak! ❤️' : 'Thank you so much! ❤️',
      timestamp: '',
      likes: '',
      isLiked: false,
      isAuthor: false,
    };

    const currentReplies = comment.replies || [];
    comment.replies = [...currentReplies, newReply];
    comment.showReplies = true;
    updateField('comments', next);
  };

  const handleUpdateReply = (
    commentIndex: number,
    replyIndex: number,
    updates: Partial<InstagramFeedCommentReply>
  ) => {
    const next = [...(data.comments || [])];
    const comment = next[commentIndex];
    if (comment && comment.replies && comment.replies[replyIndex]) {
      comment.replies[replyIndex] = { ...comment.replies[replyIndex], ...updates };
      updateField('comments', next);
    }
  };

  const handleDeleteReply = (commentIndex: number, replyIndex: number) => {
    const next = [...(data.comments || [])];
    const comment = next[commentIndex];
    if (comment && comment.replies) {
      comment.replies.splice(replyIndex, 1);
      updateField('comments', next);
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Quick Character Presets */}
      <CharacterSelector
        characters={characters || []}
        activeCharacterId={activeCharacterId}
        onSelect={onSelectCharacter}
        onSaveCurrent={onSaveCharacter}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      {/* 1. Header & Sheet Layout Settings */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Sliders className="w-3.5 h-3.5 text-purple-600" />
          <span>{isId ? 'Pengaturan Tampilan Jendela Komentar' : 'Bottom Sheet Configuration'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isId ? 'Tema Warna' : 'Theme'}
            </label>
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => updateField('theme', 'light')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                  (data.theme || 'light') === 'light'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => updateField('theme', 'dark')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                  data.theme === 'dark'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isId ? 'Rasio Layar' : 'Aspect Ratio'}
            </label>
            <select
              value={data.aspectRatio || '9:16'}
              onChange={(e) => updateField('aspectRatio', e.target.value as any)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="9:16">9:16 (Vertical Story / Sheet)</option>
              <option value="4:5">4:5 (Instagram Post)</option>
              <option value="1:1">1:1 (Square)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Foto Header Postingan (Collapsible Post Image Header) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            {isId ? 'Foto Header Postingan (Media Post)' : 'Collapsible Post Image Header'}
          </h3>
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-semibold text-xs">
            <input
              type="checkbox"
              checked={data.showPostImage !== false}
              onChange={(e) => updateField('showPostImage', e.target.checked)}
              className="rounded text-purple-600 focus:ring-0 accent-purple-600"
            />
            <span>{isId ? 'Tampilkan Foto Postingan' : 'Show Post Header Photo'}</span>
          </label>
        </div>

        {data.showPostImage !== false && (
          <div className="space-y-3 pt-1">
            <p className="text-[11px] text-slate-500">
              {isId
                ? 'Foto postingan akan muncul di bagian atas jendela komentar dan otomatis tergulung (scroll up) saat komentar discroll ke atas.'
                : 'Post image header appears at the top and collapses/scrolls up smoothly as comments are scrolled.'}
            </p>

            <ImageUploader
              label={isId ? 'Unggah / URL Foto Postingan Utama' : 'Post Header Image'}
              placeholder="https://images.unsplash.com/... or upload file"
              value={data.postImage || ''}
              onChange={(url) => updateField('postImage', url)}
              onClear={() => updateField('postImage', '')}
            />
          </div>
        )}
      </div>

      {/* 3. Logged-in User & Quick Reaction Emojis */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {isId ? 'Pengaturan Bar Komentar Bawah & Reaksi Cepat' : 'Bottom Reply Bar & Quick Emojis'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-700 font-semibold block mb-1">
              {isId ? 'Placeholder Kolom Balasan' : 'Input Placeholder Text'}
            </label>
            <input
              type="text"
              value={data.inputPlaceholder || ''}
              onChange={(e) => updateField('inputPlaceholder', e.target.value)}
              placeholder={isId ? 'Tambahkan komentar...' : 'Add a comment...'}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <ImageUploader
            label={isId ? 'Foto Profil Kamu (Bawah)' : 'Your Avatar (Bottom Bar)'}
            value={data.userAvatar || ''}
            onChange={(url) => updateField('userAvatar', url)}
          />
        </div>
      </div>

      {/* 4. Comments Flow Controller */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
              <span>
                {isId ? 'Daftar Komentar' : 'Comments List'} ({data.comments?.length || 0})
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              {isId ? 'Kelola komentar, balasan bertingkat, jumlah suka, dan tagar' : 'Manage comments, nested replies, likes count, and tags'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddComment}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isId ? 'Tambah Komentar' : 'Add Comment'}</span>
          </button>
        </div>

        {/* Comments List */}
        <div className="space-y-3">
          {(!data.comments || data.comments.length === 0) ? (
            <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              {isId ? 'Belum ada komentar. Klik "+ Tambah Komentar" di atas untuk menambahkan komentar baru.' : 'No comments added yet. Click "+ Add Comment" above to start.'}
            </div>
          ) : (
            data.comments.map((comment, index) => (
              <div
                key={comment.id || index}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 transition-all"
              >
                {/* Comment Item Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-slate-200 shadow-2xs">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                      @{comment.username}
                    </span>
                  </div>

                  {/* Move & Delete Buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleMoveComment(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveComment(index, 'down')}
                      disabled={index === data.comments.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(index)}
                      className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer ml-1"
                      title="Delete Comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Comment Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={comment.username || ''}
                      onChange={(e) => handleUpdateComment(index, { username: e.target.value })}
                      placeholder="username"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                      {isId ? 'Waktu (e.g. 1h)' : 'Time (e.g. 1h)'}
                    </label>
                    <input
                      type="text"
                      value={comment.timestamp || ''}
                      onChange={(e) => handleUpdateComment(index, { timestamp: e.target.value })}
                      placeholder="1h"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                      {isId ? 'Jumlah Suka' : 'Likes Count'}
                    </label>
                    <input
                      type="text"
                      value={comment.likes || ''}
                      onChange={(e) => handleUpdateComment(index, { likes: e.target.value })}
                      placeholder="12"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <ImageUploader
                  label={isId ? 'Foto Profil Komentator' : 'Commenter Avatar'}
                  value={comment.avatar || ''}
                  onChange={(url) => handleUpdateComment(index, { avatar: url })}
                />

                {/* Comment Text */}
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                    {isId ? 'Teks Komentar' : 'Comment Text'}
                  </label>
                  <textarea
                    rows={2}
                    value={comment.content || ''}
                    onChange={(e) => handleUpdateComment(index, { content: e.target.value })}
                    placeholder="Type comment content... (mention @user or #hashtag)"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 resize-y"
                  />
                </div>

                  {/* Flags: Verified, Author, Pinned, Liked */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <label className="flex items-center space-x-1.5 cursor-pointer bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={comment.verified === 'ig-blue'}
                      onChange={(e) => handleUpdateComment(index, { verified: e.target.checked ? 'ig-blue' : 'none' })}
                      className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                    />
                    <span>Verified Badge</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={!!comment.isAuthor}
                      onChange={(e) => handleUpdateComment(index, { isAuthor: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                    />
                    <span>{isId ? 'Penulis Post' : 'Post Author'}</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={!!comment.isPinned}
                      onChange={(e) => handleUpdateComment(index, { isPinned: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                    />
                    <span className="flex items-center space-x-1">
                      <Pin className="w-3 h-3 rotate-45 text-slate-500" />
                      <span>{isId ? 'Sematkan' : 'Pinned'}</span>
                    </span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={!!comment.isLiked}
                      onChange={(e) => handleUpdateComment(index, { isLiked: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                    />
                    <span className="flex items-center space-x-1 text-purple-600 font-bold">
                      <Heart className="w-3 h-3 fill-purple-600 text-purple-600" />
                      <span>{isId ? 'Disukai' : 'Liked'}</span>
                    </span>
                  </label>
                </div>

                {/* Sub-Replies Section */}
                <div className="pt-2 border-t border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                      <CornerDownRight className="w-3 h-3 text-purple-600" />
                      <span>{isId ? 'Balasan Komentar' : 'Replies'} ({comment.replies?.length || 0})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddReply(index)}
                      className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10.5px] font-bold rounded transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isId ? 'Balas' : 'Reply'}</span>
                    </button>
                  </div>

                  {comment.replies && comment.replies.length > 0 && (
                    <div className="space-y-2 pl-3 border-l-2 border-purple-300 pt-1">
                      {comment.replies.map((reply, rIdx) => (
                        <div
                          key={reply.id || rIdx}
                          className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-600">
                              Reply #{rIdx + 1} (@{reply.username})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteReply(index, rIdx)}
                              className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                              title="Delete reply"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={reply.username || ''}
                              onChange={(e) => handleUpdateReply(index, rIdx, { username: e.target.value })}
                              placeholder="username"
                              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                            />
                            <input
                              type="text"
                              value={reply.timestamp || ''}
                              onChange={(e) => handleUpdateReply(index, rIdx, { timestamp: e.target.value })}
                              placeholder="1h"
                              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                            />
                            <input
                              type="text"
                              value={reply.likes || ''}
                              onChange={(e) => handleUpdateReply(index, rIdx, { likes: e.target.value })}
                              placeholder="12"
                              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                            />
                          </div>

                          <ImageUploader
                            label={isId ? 'Avatar Pembalas' : 'Reply Avatar'}
                            value={reply.avatar || ''}
                            onChange={(url) => handleUpdateReply(index, rIdx, { avatar: url })}
                          />

                          <textarea
                            rows={1}
                            value={reply.content || ''}
                            onChange={(e) => handleUpdateReply(index, rIdx, { content: e.target.value })}
                            placeholder="Type reply message..."
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-900 resize-y"
                          />

                          <div className="flex items-center space-x-2 pt-0.5">
                            <label className="flex items-center space-x-1 cursor-pointer text-[10.5px] font-semibold text-slate-600">
                              <input
                                type="checkbox"
                                checked={reply.verified === 'ig-blue'}
                                onChange={(e) => handleUpdateReply(index, rIdx, { verified: e.target.checked ? 'ig-blue' : 'none' })}
                                className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                              />
                              <span>Verified</span>
                            </label>
                            <label className="flex items-center space-x-1 cursor-pointer text-[10.5px] font-semibold text-slate-600">
                              <input
                                type="checkbox"
                                checked={!!reply.isAuthor}
                                onChange={(e) => handleUpdateReply(index, rIdx, { isAuthor: e.target.checked })}
                                className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                              />
                              <span>Author</span>
                            </label>
                            <label className="flex items-center space-x-1 cursor-pointer text-[10.5px] font-semibold text-purple-600">
                              <input
                                type="checkbox"
                                checked={!!reply.isLiked}
                                onChange={(e) => handleUpdateReply(index, rIdx, { isLiked: e.target.checked })}
                                className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                              />
                              <span>Liked</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Save Profile Button */}
      <div className="pt-2">
        <SaveProfileButton onSave={onSaveProfile} />
      </div>
    </div>
  );
};
