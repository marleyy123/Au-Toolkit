import React, { useState } from 'react';
import { TikTokLiveMediaControls } from './TikTokLiveMediaControls';
import { Select } from '../../../../components/ui/Select';
import { TikTokLiveData, TikTokLiveComment, TikTokLiveProduct, CharacterPreset } from '../../../../types';
import { CharacterSelector, ImageUploader } from '../../../../components/FormControls';
import { Plus, Trash2, Tag, MessageSquare, Settings, Users, Radio, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';

interface Props {
  data: TikTokLiveData;
  onChange: (data: TikTokLiveData) => void;
  characters: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter?: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter?: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const TikTokLiveForm: React.FC<Props> = ({
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
  const [activeActivityType, setActiveActivityType] = useState<'comment' | 'join' | 'like' | null>(null);

  const updateField = <K extends keyof TikTokLiveData>(field: K, value: TikTokLiveData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const handleAddComment = (type: 'comment' | 'join' | 'like') => {
    const newId = 'tlc-' + Date.now();
    let newItem: TikTokLiveComment;

    if (type === 'join') {
      newItem = {
        id: newId,
        type: 'join',
        username: '',
        content: '',
      };
    } else if (type === 'like') {
      newItem = {
        id: newId,
        type: 'like',
        username: '',
        content: '',
      };
    } else {
      newItem = {
        id: newId,
        type: 'comment',
        username: '',
        content: '',
        avatar: '',
        levelBadge: '14',
        levelColor: 'blue',
        subBadge: '11',
      };
    }

    updateField('comments', [...(data.comments || []), newItem]);
  };

  const handleUpdateComment = (id: string, updates: Partial<TikTokLiveComment>) => {
    const updated = (data.comments || []).map((c) => (c.id === id ? { ...c, ...updates } : c));
    updateField('comments', updated);
  };

  const handleDeleteComment = (id: string) => {
    updateField('comments', (data.comments || []).filter((c) => c.id !== id));
  };

  // Product management helpers
  const products: TikTokLiveProduct[] =
    data.products && data.products.length > 0
      ? data.products
      : [
          {
            id: 'prod-1',
            image: '',
            title: '',
            price: '',
            originalPrice: '',
            discount: '',
            subtitle: '',
            hotBadge: '',
            buttonText: '',
          },
        ];

  const activeProductId = data.activeProductId || products[0]?.id || 'prod-1';
  const activeProduct = products.find((p) => p.id === activeProductId) || products[0];

  const handleUpdateProduct = (id: string, updates: Partial<TikTokLiveProduct>) => {
    const updated = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    updateField('products', updated);
  };

  const handleAddProduct = () => {
    const newId = 'prod-' + Date.now();
    const newProduct: TikTokLiveProduct = {
      id: newId,
      image: '',
      title: '',
      price: '',
      originalPrice: '',
      discount: '',
      subtitle: '',
      hotBadge: '',
      buttonText: '',
    };
    const nextList = [...products, newProduct];
    onChange({
      ...data,
      products: nextList,
      activeProductId: newId,
      showProductCard: true,
      cartItemCount: String(nextList.length),
    });
  };

  const handleDeleteProduct = (id: string) => {
    if (products.length <= 1) return;
    const nextList = products.filter((p) => p.id !== id);
    const nextActiveId = activeProductId === id ? nextList[0].id : activeProductId;
    onChange({
      ...data,
      products: nextList,
      activeProductId: nextActiveId,
      cartItemCount: String(nextList.length),
    });
  };

  // Keep controlled inputs faithful to the saved values.
  const hostUsernameValue = data.username || '';
  const hostJoinValue = data.joinButtonText || '';
  const viewerCountValue = data.viewerCount || '';
  const likeCountValue = data.likeCount || '';
  const dailyRankingValue = data.dailyRankingText || '';
  const newRoundValue = data.newRoundText || '';
  const commentPlaceholderValue = data.commentPlaceholder || '';

  // Empty fields use input placeholders instead of stored sample content.
  const productTitleValue = activeProduct.title || '';
  const productPriceValue = activeProduct.price || '';
  const productOriginalPriceValue = activeProduct.originalPrice || '';
  const productDiscountValue = activeProduct.discount || '';
  const productSubtitleValue = activeProduct.subtitle || '';
  const productHotBadgeValue = activeProduct.hotBadge || '';
  const productButtonTextValue = activeProduct.buttonText || '';

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-200">
      {/* Folder Preset Selector */}
      <CharacterSelector
        characters={characters || []}
        activeCharacterId={activeCharacterId}
        onSelectCharacter={onSelectCharacter}
        onSaveCharacter={onSaveProfile || onSaveCharacter}
        onAddFolder={onSaveCharacter}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel={isId ? 'Tambah Folder' : 'Add Folder'}
      />

      {/* 1. Live Media & Host Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Radio className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isId ? '1. Media LIVE & Profil Host' : '1. LIVE Media & Host Profile'}
          </h3>
        </div>

        {/* Live Media Upload */}
        <div className="space-y-2">
          <TikTokLiveMediaControls data={data} onChange={onChange} />
        </div>

        {/* Host Avatar & Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <ImageUploader
              label={isId ? 'Foto Profil Host' : 'Host Profile Photo'}
              value={data.avatarUrl || ''}
              onChange={(img) => updateField('avatarUrl', img)}
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                {isId ? 'Username Host' : 'Host Username'}
              </label>
              <input
                type="text"
                value={hostUsernameValue}
                onChange={(e) => updateField('username', e.target.value)}
                placeholder="username"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                {isId ? 'Jumlah Likes' : 'Likes Count'}
              </label>
              <input
                type="text"
                value={likeCountValue}
                onChange={(e) => updateField('likeCount', e.target.value)}
                placeholder="33.6K"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Viewer Count & Join Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
              {isId ? 'Jumlah Viewer (Pojok Kanan Atas)' : 'Viewer Count (Top Right)'}
            </label>
            <input
              type="text"
              value={viewerCountValue}
              onChange={(e) => updateField('viewerCount', e.target.value)}
              placeholder="12"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {isId ? 'Tombol Host ("Join")' : 'Host Button ("Join")'}
              </label>
              <input
                type="checkbox"
                checked={data.showJoinButton !== false}
                onChange={(e) => updateField('showJoinButton', e.target.checked)}
                className="rounded text-purple-600 accent-purple-600"
              />
            </div>
            <input
              type="text"
              value={hostJoinValue}
              onChange={(e) => updateField('joinButtonText', e.target.value)}
              placeholder="Join"
              disabled={data.showJoinButton === false}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Viewers Avatars Manager */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {isId ? 'Avatar Penonton Teratas (#1, #2, #3)' : 'Top Viewer Avatars (#1, #2, #3 Supporters)'}
                </label>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                  {isId
                    ? 'Avatar lingkaran & badge peringkat penonton di samping kanan host.'
                    : 'Circular avatars & rank number badges displayed next to the host avatar.'}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {(data.viewers || []).length > 0 && (
                <button
                  type="button"
                  onClick={() => updateField('viewers', [])}
                  className="bg-white hover:bg-red-50 text-red-600 border border-red-300 shadow-xs px-2.5 py-1.5 rounded-lg shrink-0 select-none active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer w-full min-w-[125px]"
                  title={isId ? 'Hapus semua penonton (Clear All)' : 'Clear all viewer avatars'}
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span className="text-xs font-bold text-red-600">Clear All</span>
                </button>
              )}
              {(data.viewers || []).length < 6 && (
                <button
                  type="button"
                  onClick={() => {
                    const currentViewers = Array.isArray(data.viewers) ? data.viewers : [];
                    const nextNum = currentViewers.length + 1;
                    const newViewer = {
                      id: 'v-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                      avatar: '',
                      badge: nextNum === 1 ? '10+' : nextNum === 2 ? '7' : `${Math.floor(Math.random() * 8) + 1}`,
                    };
                    updateField('viewers', [...currentViewers, newViewer]);
                  }}
                  className="text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer flex items-center justify-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 shrink-0 select-none active:scale-95 transition-all w-full min-w-[125px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isId ? 'Tambah Penonton' : 'Add Top Viewer'}</span>
                </button>
              )}
            </div>
          </div>

          {(!data.viewers || data.viewers.length === 0) ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-2">
                {isId ? 'Tidak ada avatar penonton teratas (tidak muncul di preview).' : 'No top viewer avatars (hidden from preview).'}
              </p>
              <button
                type="button"
                onClick={() => {
                  updateField('viewers', [
                    { id: 'v-' + Date.now() + '-1', avatar: '', badge: '' },
                    { id: 'v-' + Date.now() + '-2', avatar: '', badge: '' },
                  ]);
                }}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                {isId ? '+ Tambah Penonton Default (#1 Gold & #2 Blue)' : '+ Add Default Viewers (#1 Gold & #2 Blue)'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(data.viewers || []).map((viewer, idx) => {
                const defaultBadge = idx === 0 ? '10+' : idx === 1 ? '7' : `${idx + 1}`;
                const badgeInputValue = viewer.badge || '';
                const displayBadgePreview = (viewer.badge && viewer.badge.trim() !== '') ? viewer.badge : defaultBadge;

                return (
                  <div
                    key={viewer.id || idx}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col justify-between space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span
                          className={`w-5 h-5 rounded-full text-[10px] font-mono flex items-center justify-center font-extrabold shadow-2xs ${
                            idx === 0
                              ? 'bg-amber-400 text-amber-950'
                              : idx === 1
                              ? 'bg-cyan-500 text-white'
                              : 'bg-purple-600 text-white'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <span>
                          {idx === 0
                            ? (isId ? 'Penonton #1 (Gold)' : 'Viewer #1 (Gold)')
                            : idx === 1
                            ? (isId ? 'Penonton #2 (Cyan)' : 'Viewer #2 (Cyan)')
                            : (isId ? `Penonton #${idx + 1}` : `Viewer #${idx + 1}`)}
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = (data.viewers || []).filter((_, i) => i !== idx);
                          updateField('viewers', updated);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                        title={isId ? `Hapus Penonton #${idx + 1}` : `Delete Viewer #${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[10px]">{isId ? 'Hapus' : 'Delete'}</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <ImageUploader
                          label={isId ? `Foto Profil Penonton #${idx + 1}` : `Viewer #${idx + 1} Profile Picture`}
                          value={viewer.avatar || ''}
                          onChange={(img) => {
                            const updated = (data.viewers || []).map((v, i) =>
                              i === idx ? { ...v, avatar: img } : v
                            );
                            updateField('viewers', updated);
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              {isId ? 'Badge Rank' : 'Rank Badge'}
                            </label>
                            <span className="text-[10px] text-slate-400">
                              {isId ? 'Preview: ' + defaultBadge : 'Preview: ' + defaultBadge}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={badgeInputValue}
                            onChange={(e) => {
                              const updated = (data.viewers || []).map((v, i) =>
                                i === idx ? { ...v, badge: e.target.value } : v
                              );
                              updateField('viewers', updated);
                            }}
                            placeholder={defaultBadge}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                          />
                        </div>

                        {/* Instant Visual Badge Preview */}
                        <div className="flex flex-col items-center justify-center shrink-0 min-w-[65px] pt-1">
                          <span className="text-[9.5px] text-slate-400 mb-1 font-medium">Badge Preview</span>
                          <span
                            className={`text-[9px] font-black rounded-full px-2 py-0.5 leading-none shadow-xs whitespace-nowrap ${
                              idx === 0
                                ? 'bg-amber-400 text-black ring-1 ring-amber-300'
                                : idx === 1
                                ? 'bg-cyan-500 text-white ring-1 ring-cyan-300'
                                : 'bg-purple-600 text-white ring-1 ring-purple-300'
                            }`}
                          >
                            {displayBadgePreview}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Top Badges (Daily Ranking / Shopping Ranking & New Round) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isId ? '2. Badge Atas (Ranking & New Round)' : '2. Top Badges (Ranking & New Round)'}
          </h3>
        </div>

        {/* Top Badges (Ranking & New Round) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isId ? 'Badge Kiri (Ranking)' : 'Left Badge (Ranking)'}
              </label>
              <input
                type="checkbox"
                checked={data.showDailyRanking !== false}
                onChange={(e) => updateField('showDailyRanking', e.target.checked)}
                className="rounded text-purple-600 accent-purple-600"
              />
            </div>
            <input
              type="text"
              value={dailyRankingValue}
              onChange={(e) => updateField('dailyRankingText', e.target.value)}
              placeholder="Shopping Ranking"
              disabled={data.showDailyRanking === false}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50"
            />
            {/* Quick Icon Selector & Presets in English */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-slate-400 font-medium">Icon:</span>
              {(['bag', 'fire', 'heart', 'star'] as const).map((iconKey) => {
                const activeIcon = data.rankingBadgeIcon || (dailyRankingValue === 'Daily Ranking' ? 'fire' : 'bag');
                const isSelected = activeIcon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => updateField('rankingBadgeIcon', iconKey)}
                    className={`px-2 py-0.5 text-xs rounded-md transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-xs font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {iconKey === 'bag' ? '🛍️ Shopping' : iconKey === 'fire' ? '🔥 Daily' : iconKey === 'heart' ? '❤️ Favorite' : '⭐ Star'}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isId ? 'Badge Kanan (New Round 🎆)' : 'Right Badge (New Round 🎆)'}
              </label>
              <input
                type="checkbox"
                checked={data.showNewRound !== false}
                onChange={(e) => updateField('showNewRound', e.target.checked)}
                className="rounded text-purple-600 accent-purple-600"
              />
            </div>
            <input
              type="text"
              value={newRoundValue}
              onChange={(e) => updateField('newRoundText', e.target.value)}
              placeholder="New Round"
              disabled={data.showNewRound === false}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Quick Ranking Preset Buttons - Longer and Wider than the text, Side-by-side on desktop */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...data,
                  dailyRankingText: 'Shopping Ranking',
                  rankingBadgeIcon: 'bag',
                  showDailyRanking: true,
                });
              }}
              className="flex-1 min-w-[200px] text-xs sm:text-sm font-bold px-8 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-amber-950 border-2 border-amber-600 rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2 text-center whitespace-nowrap"
            >
              + 🛍️ Shopping Ranking
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...data,
                  dailyRankingText: 'Daily Ranking',
                  rankingBadgeIcon: 'fire',
                  showDailyRanking: true,
                });
              }}
              className="flex-1 min-w-[200px] text-xs sm:text-sm font-bold px-8 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white border-2 border-rose-600 rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2 text-center whitespace-nowrap"
            >
              + 🔥 Daily Ranking
            </button>
          </div>
        </div>
      </div>

      {/* 3. Comments & Activity Messages */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isId ? '3. Komentar & Aktivitas LIVE' : '3. LIVE Comments & Activity'}
            </h3>
          </div>

          {/* Quick Add Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setActiveActivityType('comment');
                handleAddComment('comment');
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs border ${
                activeActivityType === 'comment'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-purple-300'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isId ? 'Komentar' : 'Comment'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveActivityType('join');
                handleAddComment('join');
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs border ${
                activeActivityType === 'join'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-purple-300'
              }`}
            >
              <Plus className="w-3 h-3" />
              <span>{isId ? 'Joined' : 'Joined'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveActivityType('like');
                handleAddComment('like');
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs border ${
                activeActivityType === 'like'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-purple-300'
              }`}
            >
              <Plus className="w-3 h-3" />
              <span>{isId ? 'Liked' : 'Liked'}</span>
            </button>
          </div>
        </div>

        {/* Comment Items List */}
        <div className="space-y-3">
          {(!data.comments || data.comments.length === 0) && (
            <div className="text-center py-6 text-slate-400 text-xs italic">
              {isId ? 'Belum ada komentar. Klik tombol di atas untuk menambah komentar atau aktivitas.' : 'No comments added yet. Click buttons above to add.'}
            </div>
          )}

          {data.comments &&
            data.comments.map((item, index) => {
              const itemUserValue = item.username || '';
              const itemContentValue = item.content || '';
              const joinContentValue = item.content || '';
              const likeContentValue = item.content || '';

              return (
                <div
                  key={item.id || index}
                  className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-[11px] font-mono flex items-center justify-center shadow-xs shrink-0">
                        #{index + 1}
                      </span>
                      <span className="font-bold text-black dark:text-black">
                        {item.type === 'join'
                          ? `Activity: Joined #${index + 1}`
                          : item.type === 'like'
                          ? `Activity: Liked #${index + 1}`
                          : 'User Comment'}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteComment(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                      title={isId ? 'Hapus' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {item.type === 'comment' ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                            Username
                          </label>
                          <input
                            type="text"
                            value={itemUserValue}
                            onChange={(e) => handleUpdateComment(item.id, { username: e.target.value })}
                            placeholder="username"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                            {isId ? 'Badge Level & Sub' : 'Level & Sub Badge'}
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={item.levelBadge || ''}
                              onChange={(e) => handleUpdateComment(item.id, { levelBadge: e.target.value })}
                              placeholder="14"
                              title="Level"
                              className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none"
                            />
                            <Select
                              value={item.levelColor || 'blue'}
                              onValueChange={(value) => handleUpdateComment(item.id, { levelColor: value as TikTokLiveComment['levelColor'] })}
                              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 text-xs outline-none"
                            >
                              <option value="blue">Biru</option>
                              <option value="orange">Oranye</option>
                              <option value="purple">Ungu</option>
                            </Select>
                            <input
                              type="text"
                              value={item.subBadge || ''}
                              onChange={(e) => handleUpdateComment(item.id, { subBadge: e.target.value })}
                              placeholder="Sub: 11"
                              title="Sub badge (e.g. 11)"
                              className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                            {isId ? 'Teks Komentar' : 'Comment Content'}
                          </label>
                          <input
                            type="text"
                            value={itemContentValue}
                            onChange={(e) => handleUpdateComment(item.id, { content: e.target.value })}
                            placeholder="Hello! ✨"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <ImageUploader
                            label={isId ? 'Foto Profil (Opsional)' : 'Avatar (Optional)'}
                            value={item.avatar || ''}
                            onChange={(img) => handleUpdateComment(item.id, { avatar: img })}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          value={itemUserValue}
                          onChange={(e) => handleUpdateComment(item.id, { username: e.target.value })}
                          placeholder="username"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                          {isId ? 'Teks Aktivitas' : 'Activity Text'}
                        </label>
                        <input
                          type="text"
                          value={item.type === 'join' ? joinContentValue : likeContentValue}
                          onChange={(e) => handleUpdateComment(item.id, { content: e.target.value })}
                          placeholder={item.type === 'join' ? 'joined' : 'liked the LIVE'}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* 4. LIVE SHOPPING / YELLOW CART (TikTok Shop) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isId ? '4. LIVE Shopping / Keranjang Kuning (TikTok Shop)' : '4. LIVE Shopping / Yellow Cart (TikTok Shop)'}
            </h3>
          </div>
        </div>

        {/* Master Toggles: Yellow Cart & Product Card (Distinct Yellow & Red Box Containers) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Yellow Cart Bag Toggle - VIBRANT YELLOW BOX CONTAINER */}
          <div className="p-3.5 bg-yellow-400/20 dark:bg-yellow-500/25 border-2 border-yellow-400 dark:border-yellow-400 rounded-2xl space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-xs font-bold text-yellow-950 dark:text-yellow-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(data.showYellowCart)}
                  onChange={(e) => updateField('showYellowCart', e.target.checked)}
                  className="rounded text-amber-500 accent-amber-500"
                />
                <span>{isId ? 'Tampilkan Keranjang Kuning' : 'Show Yellow Cart'}</span>
              </label>
              <span className="text-[10px] font-black bg-yellow-400 text-yellow-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                Yellow Cart
              </span>
            </div>

            {data.showYellowCart && (
              <div className="space-y-2 pt-1.5 border-t border-yellow-400/50 dark:border-yellow-400/40">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-yellow-950 dark:text-yellow-100 block mb-1">
                      {isId ? 'Jumlah Item (Badge)' : 'Cart Item Count'}
                    </label>
                    <input
                      type="text"
                      value={data.cartItemCount || ''}
                      onChange={(e) => updateField('cartItemCount', e.target.value)}
                      placeholder="6"
                      className="w-full bg-white dark:bg-slate-900 border border-yellow-400/80 dark:border-yellow-500/80 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-yellow-500 font-semibold"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center space-x-1.5 text-[11px] font-semibold text-yellow-950 dark:text-yellow-200 pb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.showCartBadge !== false}
                        onChange={(e) => updateField('showCartBadge', e.target.checked)}
                        className="rounded text-amber-500 accent-amber-500"
                      />
                      <span>{isId ? 'Badge Angka' : 'Count Badge'}</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Card Toggle - VIBRANT RED BOX CONTAINER */}
          <div className="p-3.5 bg-red-400/20 dark:bg-red-500/25 border-2 border-red-500 dark:border-red-500 rounded-2xl space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(data.showProductCard)}
                  onChange={(e) => updateField('showProductCard', e.target.checked)}
                  className="rounded text-red-600 accent-red-600 cursor-pointer"
                />
                <span className="text-slate-900 dark:text-slate-100 font-bold">Show Product Card</span>
              </label>
              <span className="text-[10px] font-black bg-red-400 dark:bg-red-500 text-black dark:text-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                Product Card
              </span>
            </div>

            <p className="text-[11px] text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
              Shopping product card overlay above the bottom bar with Buy button and Hot badge.
            </p>
          </div>
        </div>

        {/* Product Details Form (Multi-product support) */}
        {(data.showProductCard || data.showYellowCart) && (
          <div className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-800">
            {/* Products Header & Add Button */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isId ? 'Daftar Produk Belanja' : 'Shopping Products List'} ({products.length})
              </label>
              <button
                type="button"
                onClick={handleAddProduct}
                className="text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer flex items-center gap-1 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800"
              >
                <Plus className="w-3 h-3" />
                <span>{isId ? 'Tambah Produk' : 'Add Product'}</span>
              </button>
            </div>

            {/* Product Tabs (if multiple products) */}
            {products.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {products.map((prod, pIdx) => {
                  const isActive = prod.id === activeProductId;
                  return (
                    <div
                      key={prod.id}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer shrink-0 transition-all ${
                        isActive
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 text-purple-700 dark:text-purple-300 shadow-xs ring-1 ring-purple-400'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                      onClick={() => updateField('activeProductId', prod.id)}
                    >
                      <span>#{pIdx + 1} {prod.title ? prod.title.slice(0, 15) + '...' : 'Produk'}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                      )}
                      {products.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(prod.id);
                          }}
                          className="ml-1 text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer"
                          title="Hapus produk"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Active Product Form Fields */}
            {activeProduct && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                <div className="space-y-1 pb-1.5 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] font-bold flex items-center justify-center shadow-xs shrink-0"
                        title={isId ? 'Sedang aktif di preview' : 'Active in preview'}
                      >
                        ✓
                      </span>
                      <span className="text-xs font-bold text-black dark:text-black">
                        {isId ? 'Produk Aktif di Preview' : 'Active Product in Preview'}
                      </span>
                    </span>
                    <span className="text-[10px] font-bold bg-red-500 dark:bg-red-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                      {isId ? 'Ditampilkan di Layar' : 'Displayed on Screen'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 pl-7 leading-normal">
                    {isId
                      ? 'Bulatan centang ungu ini menandakan bahwa kartu produk ini yang sedang aktif dan ditampilkan di layar preview TikTok LIVE.'
                      : 'This purple checkmark circle indicates that this product card is currently active and displayed on the TikTok LIVE preview screen.'}
                  </p>
                </div>

                {/* Product Image Uploader */}
                <div>
                  <ImageUploader
                    label={isId ? 'Foto Produk (Product Image)' : 'Product Image'}
                    value={activeProduct.image || ''}
                    onChange={(img) => handleUpdateProduct(activeProduct.id, { image: img })}
                  />
                </div>

                {/* Product Title */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {isId ? 'Judul Produk (Product Title)' : 'Product Title'}
                  </label>
                  <input
                    type="text"
                    value={productTitleValue}
                    onChange={(e) => handleUpdateProduct(activeProduct.id, { title: e.target.value })}
                    placeholder="Kaos Polos Motif Bergaris New Lo..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                {/* Prices & Discount Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {isId ? 'Harga Utama (Price)' : 'Product Price'}
                    </label>
                    <input
                      type="text"
                      value={productPriceValue}
                      onChange={(e) => handleUpdateProduct(activeProduct.id, { price: e.target.value })}
                      placeholder="Rp16.476"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {isId ? 'Harga Coret (Original Price)' : 'Original Price'}
                    </label>
                    <input
                      type="text"
                      value={productOriginalPriceValue}
                      onChange={(e) => handleUpdateProduct(activeProduct.id, { originalPrice: e.target.value })}
                      placeholder="Rp19.850"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {isId ? 'Diskon (Discount %)' : 'Discount %'}
                    </label>
                    <input
                      type="text"
                      value={productDiscountValue}
                      onChange={(e) => handleUpdateProduct(activeProduct.id, { discount: e.target.value })}
                      placeholder="-17%"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none text-[#fe2c55] font-normal"
                    />
                  </div>
                </div>

                {/* Subtitle, Hot Badge & Button Text */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {isId ? 'Subjudul (Subtitle)' : 'Product Subtitle'}
                    </label>
                    <input
                      type="text"
                      value={productSubtitleValue}
                      onChange={(e) => handleUpdateProduct(activeProduct.id, { subtitle: e.target.value })}
                      placeholder="Try before you buy"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none text-amber-700 dark:text-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {isId ? 'Badge Hot (🔥 Hot Badge)' : 'Hot Badge'}
                    </label>
                    <input
                      type="text"
                      value={productHotBadgeValue}
                      onChange={(e) => handleUpdateProduct(activeProduct.id, { hotBadge: e.target.value })}
                      placeholder="Hot 205"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {isId ? 'Teks Tombol (Button Text)' : 'Button Text'}
                    </label>
                    <input
                      type="text"
                      value={productButtonTextValue}
                      onChange={(e) => handleUpdateProduct(activeProduct.id, { buttonText: e.target.value })}
                      placeholder="Buy"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Bottom Controls & Reaction Hearts */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isId ? '5. Kontrol Bawah & Floating Hearts' : '5. Bottom Bar Controls & Floating Hearts'}
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
              {isId ? 'Placeholder Kolom Ketik' : 'Comment Placeholder'}
            </label>
            <input
              type="text"
              value={commentPlaceholderValue}
              onChange={(e) => updateField('commentPlaceholder', e.target.value)}
              placeholder="Add comment..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* Floating Hearts Controls (Adjust count: few, medium, many) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.showFloatingHearts !== false}
                  onChange={(e) => updateField('showFloatingHearts', e.target.checked)}
                  className="rounded text-purple-600 accent-purple-600"
                />
                <span>{isId ? 'Floating Reaction Hearts' : 'Floating Reaction Hearts'}</span>
              </label>

              {data.showFloatingHearts !== false && (
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  {data.floatingHeartsCount ?? 6} hearts
                </span>
              )}
            </div>

            {data.showFloatingHearts !== false && (
              <div className="space-y-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500">
                    {isId ? 'Atur Jumlah Hati:' : 'Hearts Count:'}
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={data.floatingHeartsCount ?? 6}
                    onChange={(e) => updateField('floatingHeartsCount', Number(e.target.value))}
                    className="flex-1 accent-purple-600 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateField('floatingHeartsCount', 2)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer border ${
                      (data.floatingHeartsCount ?? 6) <= 3
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs font-bold'
                        : 'bg-white text-slate-800 border-slate-200 dark:bg-white dark:text-slate-800 dark:border-slate-300 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    Few (2)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('floatingHeartsCount', 6)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer border ${
                      (data.floatingHeartsCount ?? 6) > 3 && (data.floatingHeartsCount ?? 6) <= 7
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs font-bold'
                        : 'bg-white text-slate-800 border-slate-200 dark:bg-white dark:text-slate-800 dark:border-slate-300 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    Medium (6)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('floatingHeartsCount', 10)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer border ${
                      (data.floatingHeartsCount ?? 6) > 7
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs font-bold'
                        : 'bg-white text-slate-800 border-slate-200 dark:bg-white dark:text-slate-800 dark:border-slate-300 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    Many (10)
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={data.showGuestButton !== false}
                onChange={(e) => updateField('showGuestButton', e.target.checked)}
                className="rounded text-purple-600 accent-purple-600"
              />
              <span className="truncate">{isId ? 'Guest' : 'Guest'}</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={data.showRoseButton !== false}
                onChange={(e) => updateField('showRoseButton', e.target.checked)}
                className="rounded text-purple-600 accent-purple-600"
              />
              <span className="truncate">{isId ? 'Rose' : 'Rose'}</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={data.showGiftButton !== false}
                onChange={(e) => updateField('showGiftButton', e.target.checked)}
                className="rounded text-purple-600 accent-purple-600"
              />
              <span className="truncate">{isId ? 'Gift' : 'Gift'}</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={data.showShareButton !== false}
                onChange={(e) => updateField('showShareButton', e.target.checked)}
                className="rounded text-purple-600 accent-purple-600"
              />
              <span className="truncate">{isId ? 'Share' : 'Share'}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
