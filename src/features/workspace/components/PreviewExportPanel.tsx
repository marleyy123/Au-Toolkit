import React from 'react';
import {
  Check,
  Download,
  Lock,
  Maximize2,
  RefreshCw,
  RotateCcw,
  Square,
  Unlock,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { PreviewRegistry } from '../../../export/PreviewRegistry';
import type { AppLanguage } from '../../../context/LanguageContext';
import type { UiTheme } from '../../../context/ThemeContext';
import type { PlatformTab } from '../../../types';

type MobileView = 'editor' | 'preview';

interface PreviewExportPanelProps {
  uiTheme: UiTheme;
  language: AppLanguage;
  mobileView: MobileView;
  activeTab: PlatformTab;
  currentPreviewData: any;
  currentFontCss: string;
  previewRef: React.RefObject<HTMLDivElement>;
  previewViewportRef: React.RefObject<HTMLDivElement>;
  exportScale: number;
  setExportScale: React.Dispatch<React.SetStateAction<number>>;
  isExporting: boolean;
  isExportingJpg: boolean;
  exportStatusText: string;
  exportError: string | null;
  downloadSuccess: boolean;
  downloadJpgSuccess: boolean;
  handleDownload: () => void;
  handleDownloadJpg: () => void;
  previewZoom: number;
  previewPan: { x: number; y: number };
  isPreviewLocked: boolean;
  isDraggingCanvas: boolean;
  setPreviewZoom: React.Dispatch<React.SetStateAction<number>>;
  setPreviewPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  handleToggleLockPreview: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleZoomReset: () => void;
  handlePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  handleMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleDoubleClickViewport: (event: React.MouseEvent<HTMLDivElement>) => void;
  cornerRadius: number;
  handleCornerRadiusChange: (radius: number) => void;
  handleResetActiveTabState: () => void;
  handleRegisteredPreviewChange: (updated: any) => void;
  handleRegisteredMessageText: (...args: any[]) => void;
  handleToggleTikTokFypLike: (...args: any[]) => void;
  handleToggleTikTokFypBookmark: (...args: any[]) => void;
  handleToggleTikTokFypFollow: (...args: any[]) => void;
}

export const PreviewExportPanel: React.FC<PreviewExportPanelProps> = ({
  uiTheme,
  language,
  mobileView,
  activeTab,
  currentPreviewData,
  currentFontCss,
  previewRef,
  previewViewportRef,
  exportScale,
  setExportScale,
  isExporting,
  isExportingJpg,
  exportStatusText,
  exportError,
  downloadSuccess,
  downloadJpgSuccess,
  handleDownload,
  handleDownloadJpg,
  previewZoom,
  previewPan,
  isPreviewLocked,
  isDraggingCanvas,
  setPreviewZoom,
  setPreviewPan,
  handleToggleLockPreview,
  handleZoomIn,
  handleZoomOut,
  handleZoomReset,
  handlePointerDown,
  handleMouseDown,
  handleDoubleClickViewport,
  cornerRadius,
  handleCornerRadiusChange,
  handleResetActiveTabState,
  handleRegisteredPreviewChange,
  handleRegisteredMessageText,
  handleToggleTikTokFypLike,
  handleToggleTikTokFypBookmark,
  handleToggleTikTokFypFollow,
}) => (
  <section
    id="preview-panel"
    className={`preview-column-panel dual-scroll-panel no-scrollbar scrollbar-none overscroll-y-contain lg:col-span-6 xl:col-span-7 space-y-6 lg:h-full lg:overflow-y-auto lg:pl-1 lg:pr-2 lg:pb-4 transition-all ${
      mobileView === 'editor' ? 'hidden lg:block' : 'block animate-in fade-in-50 duration-200'
    }`}
    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
  >
    <div className={`border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 transition-colors ${
      uiTheme === 'dark'
        ? 'bg-slate-900 border-slate-800 shadow-xl'
        : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div className="flex items-center space-x-3">
        <span className={`text-xs font-extrabold uppercase tracking-wider ${
          uiTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
        }`}>
          {language === 'id' ? 'Opsi Ekspor' : 'Export Options'}
        </span>
      </div>

      <div className="flex items-center space-x-2.5 sm:space-x-3 flex-wrap gap-y-2">
        <div className={`flex items-center border rounded-lg p-0.5 text-xs ${
          uiTheme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          {[1, 2, 3].map((scale) => (
            <button
              key={scale}
              type="button"
              onClick={() => setExportScale(scale)}
              title={
                scale === 1
                  ? (language === 'id' ? 'Resolusi asli' : 'Native resolution')
                  : scale === 2
                    ? (language === 'id' ? 'Resolusi 2x' : '2x resolution')
                    : (language === 'id' ? 'Kualitas tertinggi / resolusi 3x' : 'Highest quality / 3x resolution')
              }
              aria-label={
                scale === 1
                  ? '1x - Normal, native resolution'
                  : scale === 2
                    ? '2x - HD, 2x resolution'
                    : '3x - 4K, highest quality, 3x resolution'
              }
              className={`px-2.5 py-1.5 rounded-md font-bold transition-all cursor-pointer flex flex-col items-center leading-tight ${
                exportScale === scale
                  ? 'bg-purple-600 text-white shadow-xs'
                  : uiTheme === 'dark'
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{scale}x - {scale === 1 ? 'Normal' : scale === 2 ? 'HD' : '4K'}</span>
              <span className={`text-[9px] font-medium ${
                exportScale === scale
                  ? 'text-purple-100'
                  : uiTheme === 'dark' ? 'text-slate-500' : 'text-slate-500'
              }`}>
                {scale === 1
                  ? (language === 'id' ? 'Resolusi asli' : 'Native resolution')
                  : scale === 2
                    ? (language === 'id' ? 'Resolusi 2x' : '2x resolution')
                    : (language === 'id' ? 'Kualitas tertinggi / 3x' : 'Highest quality / 3x')}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isExporting || isExportingJpg}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            downloadSuccess
              ? 'bg-purple-700 text-white shadow-purple-700/20'
              : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-purple-600/20'
          }`}
          title={language === 'id' ? 'Unduh gambar PNG lossless resolusi tinggi' : 'Download lossless high-res PNG'}
        >
          {isExporting ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : downloadSuccess ? (
            <Check className="w-4 h-4 text-white" />
          ) : (
            <Download className="w-4 h-4 text-white" />
          )}
          <span>
            {isExporting
              ? (exportStatusText || 'Rendering...')
              : downloadSuccess
                ? (language === 'id' ? 'Tersimpan!' : 'Saved PNG!')
                : 'Download PNG'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleDownloadJpg}
          disabled={isExporting || isExportingJpg}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            downloadJpgSuccess
              ? 'bg-purple-700 text-white shadow-purple-700/20'
              : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-purple-600/20'
          }`}
          title={
            language === 'id'
              ? 'Unduh JPG ultra-tajam dengan kompresi minimal (optimal sebelum algoritma IG & TikTok)'
              : 'Download ultra-sharp JPG with minimal compression (optimal before IG & TikTok algorithms)'
          }
        >
          {isExportingJpg ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : downloadJpgSuccess ? (
            <Check className="w-4 h-4 text-white" />
          ) : (
            <Download className="w-4 h-4 text-white" />
          )}
          <span>
            {isExportingJpg
              ? (exportStatusText || 'Rendering...')
              : downloadJpgSuccess
                ? (language === 'id' ? 'Tersimpan!' : 'Saved JPG!')
                : 'Download JPG'}
          </span>
        </button>
      </div>
    </div>
    {exportError && (
      <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
        {exportError}
      </div>
    )}

    <div className={`border rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 transition-colors ${
      uiTheme === 'dark'
        ? 'bg-slate-900/90 border-slate-800 text-slate-200'
        : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
    }`}>
      <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5">
        <span className={`text-xs font-extrabold uppercase tracking-wider flex items-center space-x-1.5 ${
          uiTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
        }`}>
          <Maximize2 className="w-3.5 h-3.5 text-purple-500" />
          <span>Zoom View</span>
        </span>

        <button
          type="button"
          onClick={handleToggleLockPreview}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-black border transition-all cursor-pointer shadow-2xs ${
            isPreviewLocked
              ? 'btn-locked-amber bg-amber-400 hover:bg-amber-300 border-amber-500 text-black ring-2 ring-amber-400/50 shadow-amber-500/20 active:scale-95'
              : uiTheme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
          title={
            language === 'id'
              ? (isPreviewLocked ? 'Preview Terkunci: Posisi kotak tetap di tempat, scrolling halaman & chat lancar' : 'Preview Bebas Geser: Klik untuk mengunci posisi kotak')
              : (isPreviewLocked ? 'Preview Locked: Stays fixed in position, page & chat scroll normally' : 'Preview Unlocked: Free pan active. Click to lock')
          }
        >
          {isPreviewLocked ? (
            <Lock className="w-3.5 h-3.5 text-black stroke-[2.5]" />
          ) : (
            <Unlock className="w-3.5 h-3.5" />
          )}
          <span className={isPreviewLocked ? 'text-black font-black tracking-wide' : ''}>
            {isPreviewLocked ? 'Lock: ON' : 'Lock: OFF'}
          </span>
        </button>

        <div className={`flex items-center border rounded-lg p-0.5 text-xs ${
          uiTheme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          {[50, 75, 100, 125, 150, 200].map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => {
                setPreviewZoom(z);
                if (z === 75) setPreviewPan({ x: 0, y: 0 });
              }}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                previewZoom === z
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : uiTheme === 'dark'
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-slate-950 font-bold'
              }`}
            >
              {z === 75 ? 'Fit 75%' : `${z}%`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={previewZoom <= 40}
          title="Zoom Out (-10%)"
          className={`p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg border transition-all cursor-pointer ${
            previewZoom <= 40
              ? 'opacity-40 cursor-not-allowed border-transparent'
              : uiTheme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700 active:scale-95 border-slate-700 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 active:scale-95 border-slate-200 text-slate-700'
          }`}
        >
          <ZoomOut className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>

        <input
          type="range"
          min="40"
          max="200"
          step="5"
          value={previewZoom}
          onChange={(e) => setPreviewZoom(Number(e.target.value))}
          style={{ touchAction: 'none' }}
          className="w-24 sm:w-32 h-2 sm:h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600 touch-none"
        />

        <button
          type="button"
          onClick={handleZoomReset}
          title="Reset to 75% (Fit & Center)"
          className={`px-2.5 py-1.5 sm:py-1 min-h-[36px] rounded-lg text-xs font-mono font-bold border transition-all flex items-center space-x-1.5 cursor-pointer ${
            previewZoom === 75 && previewPan.x === 0 && previewPan.y === 0
              ? uiTheme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-white shadow-2xs'
                : 'bg-white border-slate-300 text-slate-900 shadow-2xs font-extrabold'
              : uiTheme === 'dark'
                ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-2xs font-extrabold active:scale-95'
                : 'bg-purple-100 border-purple-300 text-purple-900 shadow-2xs font-extrabold active:scale-95'
          }`}
        >
          <span className="font-extrabold tracking-tight">{previewZoom}%</span>
          {(previewZoom !== 75 || previewPan.x !== 0 || previewPan.y !== 0) && (
            <RotateCcw className="w-3 h-3 ml-0.5 text-purple-600 dark:text-purple-300" />
          )}
        </button>

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={previewZoom >= 200}
          title="Zoom In (+10%)"
          className={`p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg border transition-all cursor-pointer ${
            previewZoom >= 200
              ? 'opacity-40 cursor-not-allowed border-transparent'
              : uiTheme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700 active:scale-95 border-slate-700 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 active:scale-95 border-slate-200 text-slate-700'
          }`}
        >
          <ZoomIn className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>
    </div>

    <div className={`border rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 transition-colors ${
      uiTheme === 'dark'
        ? 'bg-slate-900/90 border-slate-800 text-slate-200'
        : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
    }`}>
      <div className="flex items-center space-x-2.5">
        <span className={`text-xs font-extrabold uppercase tracking-wider flex items-center space-x-1.5 ${
          uiTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
        }`}>
          <Square className="w-3.5 h-3.5 text-purple-500" />
          <span>Corner Radius</span>
        </span>

        <div className={`flex items-center border rounded-lg p-0.5 text-xs ${
          uiTheme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          {[0, 12, 24, 32, 40].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleCornerRadiusChange(r)}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                cornerRadius === r
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : uiTheme === 'dark'
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r === 0 ? '0px (Sharp)' : `${r}px`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="range"
          min="0"
          max="48"
          step="2"
          value={cornerRadius}
          onChange={(e) => handleCornerRadiusChange(Number(e.target.value))}
          className="w-24 sm:w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />

        <button
          type="button"
          onClick={() => handleCornerRadiusChange(0)}
          title="Reset Corner Radius to 0px"
          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black border transition-all flex items-center space-x-1 cursor-pointer shadow-xs ${
            cornerRadius === 0
              ? uiTheme === 'dark'
                ? 'bg-slate-800 border-slate-600 text-white'
                : 'bg-slate-100 border-slate-300 text-black'
              : uiTheme === 'dark'
                ? 'bg-purple-950 border-purple-500 text-white ring-1 ring-purple-500/40'
                : 'bg-purple-100 border-purple-400 text-black ring-1 ring-purple-400/40'
          }`}
        >
          <span className="font-black" style={{ color: uiTheme === 'dark' ? '#FFFFFF' : '#000000', fontWeight: 900 }}>
            {cornerRadius}px
          </span>
          {cornerRadius !== 0 && <RotateCcw className="w-3 h-3 ml-0.5 text-purple-700 dark:text-purple-300 stroke-[2.5]" />}
        </button>
      </div>
    </div>

    <div
      id="preview-viewport-container"
      ref={previewViewportRef}
      data-no-swipe="true"
      onPointerDown={handlePointerDown}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClickViewport}
      className={`border rounded-2xl p-2 sm:p-4 lg:p-8 flex flex-col items-center justify-start min-h-[500px] relative overflow-hidden backdrop-blur-xs transition-colors select-none ${
        isPreviewLocked
          ? 'cursor-default touch-pan-y'
          : (isDraggingCanvas ? 'cursor-grabbing touch-none' : 'cursor-grab touch-none')
      } ${
        uiTheme === 'dark'
          ? 'bg-slate-900/60 border-slate-800/80'
          : 'bg-slate-200/50 border-slate-200 shadow-inner'
      }`}
    >
      <div className={`absolute inset-0 [background-size:16px_16px] pointer-events-none ${
        uiTheme === 'dark'
          ? 'bg-[radial-gradient(#334155_1px,transparent_1px)] opacity-50'
          : 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] opacity-70'
      }`} />

      <div className="absolute top-3 right-3 z-30 pointer-events-auto flex flex-wrap items-center justify-end gap-1.5 max-w-[calc(100%-1.5rem)]">
        <div className={`flex items-center backdrop-blur-md border rounded-full p-0.5 shadow-md transition-colors ${
          uiTheme === 'dark'
            ? 'bg-slate-900/95 border-slate-700/90 text-slate-100 shadow-slate-950/40'
            : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-slate-300/40'
        }`}>
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={previewZoom <= 40}
            className={`w-7 h-7 flex items-center justify-center rounded-full active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer ${
              uiTheme === 'dark'
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-700 hover:text-black hover:bg-slate-100'
            }`}
            title="Zoom Out (-10%)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomReset}
            className={`px-2 py-0.5 font-mono text-[11px] font-extrabold transition-colors cursor-pointer rounded-full ${
              uiTheme === 'dark'
                ? 'text-purple-300 bg-purple-950/60 hover:text-white hover:bg-purple-900/70 border border-purple-800/40'
                : 'text-purple-800 bg-purple-50 hover:text-purple-950 hover:bg-purple-100/90 border border-purple-200'
            }`}
            title="Reset to 75%"
          >
            {previewZoom}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={previewZoom >= 200}
            className={`w-7 h-7 flex items-center justify-center rounded-full active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer ${
              uiTheme === 'dark'
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-700 hover:text-black hover:bg-slate-100'
            }`}
            title="Zoom In (+10%)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleToggleLockPreview}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all shadow-md cursor-pointer backdrop-blur-md active:scale-95 ${
            isPreviewLocked
              ? 'btn-locked-amber bg-amber-400 hover:bg-amber-300 border-2 border-amber-500 text-black ring-2 ring-amber-400/60 shadow-amber-500/30'
              : uiTheme === 'dark'
                ? 'bg-slate-900/95 hover:bg-slate-800 border border-slate-700 text-slate-200 shadow-slate-950/40'
                : 'bg-white/95 hover:bg-slate-50 border border-slate-300 text-slate-800 shadow-slate-300/30'
          }`}
          title={
            language === 'id'
              ? (isPreviewLocked ? 'Posisi Kotak Terkunci (Klik untuk bebas geser)' : 'Posisi Kotak Bebas Geser (Klik untuk kunci)')
              : (isPreviewLocked ? 'Position Locked (Click to unlock pan)' : 'Position Unlocked (Click to lock position)')
          }
        >
          {isPreviewLocked ? (
            <>
              <Lock className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              <span className="text-black font-black tracking-wide">{language === 'id' ? 'Terkunci' : 'Locked'}</span>
            </>
          ) : (
            <>
              <Unlock className={`w-3.5 h-3.5 ${uiTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} />
              <span className={`font-bold ${uiTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{language === 'id' ? 'Bebas Geser' : 'Unlocked'}</span>
            </>
          )}
        </button>

        {(previewZoom !== 75 || (!isPreviewLocked && (previewPan.x !== 0 || previewPan.y !== 0))) && (
          <button
            type="button"
            onClick={handleZoomReset}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all cursor-pointer backdrop-blur-md active:scale-95 ${
              uiTheme === 'dark'
                ? 'bg-slate-900/95 hover:bg-purple-950/90 border border-purple-800/80 text-purple-200 shadow-slate-950/40'
                : 'bg-white/95 hover:bg-purple-50 border border-purple-300 text-purple-800 shadow-slate-300/30'
            }`}
            title="Reset Zoom & Center Position"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-500" />
            <span className="font-bold">Reset View</span>
          </button>
        )}
      </div>

      <div className="w-full flex items-center justify-center relative z-10 mt-2 mb-auto">
        <div
          id="preview-canvas-container"
          data-preview-canvas="true"
          className={`py-2 flex flex-col items-center justify-center origin-top transition-transform ${
            isDraggingCanvas ? 'duration-0' : 'duration-100 ease-out'
          } global-preview-font-apply shrink-0 ${isPreviewLocked ? 'touch-pan-y' : 'touch-none'}`}
          style={{
            transform: `translate3d(${previewPan.x}px, ${previewPan.y}px, 0) scale(${previewZoom / 100})`,
            transformOrigin: 'top center',
            marginBottom: previewZoom < 100 ? `${(previewZoom - 100) * 3.5}px` : `${(previewZoom - 100) * 2}px`,
            '--selected-global-font': currentFontCss,
            fontFamily: currentFontCss,
          } as React.CSSProperties}
        >
          <ErrorBoundary compact onReset={handleResetActiveTabState}>
            <PreviewRegistry
              previewKey={activeTab}
              data={currentPreviewData}
              previewRef={previewRef}
              fontCss={currentFontCss}
              handlers={{
                onChange: handleRegisteredPreviewChange,
                onUpdateMessageText: handleRegisteredMessageText,
                onToggleLike: handleToggleTikTokFypLike,
                onToggleBookmark: handleToggleTikTokFypBookmark,
                onToggleFollow: handleToggleTikTokFypFollow,
              }}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  </section>
);

