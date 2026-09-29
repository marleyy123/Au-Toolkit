import React, { useState, useEffect } from 'react';
import {
  X,
  Flag,
  CheckCircle2,
  EyeOff,
  RotateCcw,
  SlidersHorizontal,
  Search,
  Sparkles,
  Info,
  ShieldCheck,
} from 'lucide-react';
import {
  DEFAULT_FEATURE_FLAGS,
  getFeatureFlags,
  setFeatureFlag,
  resetFeatureFlags,
  FeatureStatus,
  FeatureFlagDefinition,
} from '../config/featureFlags';
import { PlatformGroup } from '../types';

interface FeatureFlagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiTheme?: 'light' | 'dark';
}

export const FeatureFlagManagerModal: React.FC<FeatureFlagManagerModalProps> = ({
  isOpen,
  onClose,
  uiTheme = 'light',
}) => {
  const [flags, setFlags] = useState<Record<string, FeatureStatus>>(getFeatureFlags());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'LIVE' | 'HIDDEN'>('all');

  useEffect(() => {
    const handleUpdate = () => {
      setFlags(getFeatureFlags());
    };
    window.addEventListener('feature_flags_updated', handleUpdate);
    return () => window.removeEventListener('feature_flags_updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const handleToggle = (key: string) => {
    const current = flags[key] || 'LIVE';
    const nextStatus: FeatureStatus = current === 'LIVE' ? 'HIDDEN' : 'LIVE';
    setFeatureFlag(key, nextStatus);
    setFlags((prev) => ({ ...prev, [key]: nextStatus }));
  };

  const handleEnableAll = () => {
    Object.keys(DEFAULT_FEATURE_FLAGS).forEach((key) => {
      setFeatureFlag(key, 'LIVE');
    });
    setFlags(getFeatureFlags());
  };

  const handleResetDefaults = () => {
    resetFeatureFlags();
    setFlags(getFeatureFlags());
  };

  // Filter list
  const flagKeys = Object.keys(DEFAULT_FEATURE_FLAGS);
  const filteredKeys = flagKeys.filter((key) => {
    const def = DEFAULT_FEATURE_FLAGS[key];
    const currentStatus = flags[key] || 'LIVE';

    const matchesSearch =
      def.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      def.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      def.key.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategoryFilter === 'all' || def.category === selectedCategoryFilter;

    const matchesStatus =
      selectedStatusFilter === 'all' || currentStatus === selectedStatusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalCount = flagKeys.length;
  const liveCount = flagKeys.filter((k) => (flags[k] || 'LIVE') === 'LIVE').length;
  const hiddenCount = totalCount - liveCount;

  const isDark = uiTheme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className={`w-full max-w-3xl rounded-2xl shadow-2xl border overflow-hidden transition-all flex flex-col max-h-[90vh] ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-slate-50/80'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 flex items-center justify-center font-bold">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-extrabold tracking-tight">Feature Flag Manager</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  DEV / ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kontrol modul & fitur yang tampil di menu navigasi utama penggunamu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200/60 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Developer Guide Banner */}
        <div className={`px-6 py-3 border-b flex items-start space-x-3 shrink-0 text-xs ${
          isDark ? 'bg-purple-950/40 border-purple-900/50 text-purple-200' : 'bg-purple-50/80 border-purple-100 text-purple-900'
        }`}>
          <Info className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">
              Sistem Toggle Fitur (LIVE vs HIDDEN):
            </p>
            <p className="text-[11.5px] opacity-90">
              Fitur bertanda <span className="font-bold text-purple-600 dark:text-purple-400">LIVE</span> akan muncul di menu utama. Fitur bertanda <span className="font-bold text-amber-600 dark:text-amber-400">HIDDEN</span> disembunyikan sepenuhnya dari navigasi pengguna, cocok untuk mengembangkan modul baru di background.
            </p>
          </div>
        </div>

        {/* Controls & Filter Bar */}
        <div className={`p-4 border-b space-y-3 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
        }`}>
          {/* Stats Badges & Bulk Action */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                <span>{liveCount} Fitur LIVE</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center space-x-1.5">
                <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                <span>{hiddenCount} Fitur HIDDEN</span>
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <button
                type="button"
                onClick={handleEnableAll}
                className="px-2.5 py-1 rounded-lg font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Aktifkan Semua</span>
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer flex items-center space-x-1 ${
                  isDark
                    ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="Reset ke status bawaan file konfigurasi (src/config/featureFlags.ts)"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Default</span>
              </button>
            </div>
          </div>

          {/* Search Input & Select Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama fitur..."
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-lg border font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="all">Semua Modul / Kategori</option>
              <option value="x">X (Twitter)</option>
              <option value="instagram">Instagram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="tiktok">TikTok</option>
              <option value="ios">iOS Lockscreen</option>
              <option value="line">LINE</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className={`w-full px-3 py-1.5 rounded-lg border font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="all">Semua Status (LIVE + HIDDEN)</option>
              <option value="LIVE">Hanya Status LIVE</option>
              <option value="HIDDEN">Hanya Status HIDDEN</option>
            </select>
          </div>
        </div>

        {/* Flags List */}
        <div className="p-6 overflow-y-auto space-y-3 grow">
          {filteredKeys.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <SlidersHorizontal className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">Tidak ada fitur yang cocok dengan pencarian.</p>
            </div>
          ) : (
            filteredKeys.map((key) => {
              const def = DEFAULT_FEATURE_FLAGS[key];
              const currentStatus = flags[key] || 'LIVE';
              const isLive = currentStatus === 'LIVE';

              return (
                <div
                  key={key}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                    isLive
                      ? isDark
                        ? 'bg-slate-800/50 border-slate-700/80 hover:border-purple-500/50'
                        : 'bg-white border-slate-200 hover:border-purple-300 shadow-2xs'
                      : isDark
                        ? 'bg-slate-950/40 border-amber-900/30 opacity-75 hover:opacity-100'
                        : 'bg-amber-50/30 border-amber-200/80 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-0.5 grow min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm truncate">{def.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase shrink-0 ${
                          def.type === 'category'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {def.type === 'category' ? 'MODUL UTAMA' : `TAB ${def.category.toUpperCase()}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {def.description}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      Key: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{key}</code>
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-md flex items-center space-x-1 ${
                        isLive
                          ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800'
                          : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {isLive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>LIVE</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>HIDDEN</span>
                        </>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggle(key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isLive ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      title={`Klik untuk mengubah status menjadi ${isLive ? 'HIDDEN' : 'LIVE'}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isLive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between text-xs shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-slate-50/80'
          }`}
        >
          <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            <span>Semua perubahan tersimpan secara real-time.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
