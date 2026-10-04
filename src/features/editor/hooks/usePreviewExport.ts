import { useState } from 'react';
import type { MouseEvent, RefObject } from 'react';
import type { AppLanguage } from '../../../context/LanguageContext';
import type { PlatformTab } from '../../../types';
import { findRegisteredExportElement, getRegisteredExportContext } from '../../../export/exportContext';
import {
  copyElementToClipboard,
  downloadElementAsJpg,
  downloadElementAsPng,
  exportPreviewToImage,
} from '../../../utils/exportUtils';

type UsePreviewExportArgs = {
  activeTab: PlatformTab;
  language: AppLanguage;
  previewRef: RefObject<HTMLDivElement>;
  getCurrentTabFormData: (tab: PlatformTab) => any;
  updateActiveFolderData: (tab: PlatformTab, updated: any) => void;
};

const getPreviewExportTarget = (previewRef: RefObject<HTMLDivElement>) => {
  if (previewRef.current && getRegisteredExportContext(previewRef.current)) {
    return previewRef.current;
  }

  return (
    findRegisteredExportElement(document.getElementById('preview-canvas-container') || document) ||
    findRegisteredExportElement()
  );
};

const getScaleSuffix = (scale: number) => (scale === 1 ? '1x' : scale === 2 ? '2x-HD' : '3x-4K');

export function usePreviewExport({
  activeTab,
  language,
  previewRef,
  getCurrentTabFormData,
  updateActiveFolderData,
}: UsePreviewExportArgs) {
  const [exportScale, setExportScale] = useState<number>(1);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExportingJpg, setIsExportingJpg] = useState<boolean>(false);
  const [exportStatusText, setExportStatusText] = useState<string>('');
  const [exportError, setExportError] = useState<string>('');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [downloadJpgSuccess, setDownloadJpgSuccess] = useState<boolean>(false);
  const [preparedImage, setPreparedImage] = useState<File | null>(null);

  const prepareAppleImage = async (target: HTMLElement, filename: string, scale: number, format: 'png' | 'jpeg') => {
    const isAppleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!isAppleMobile) return false;
    const result = await exportPreviewToImage({element: target, filename, scale, format, quality: 1,
      onProgress: setExportStatusText});
    if (!result.success || !result.blob) throw new Error('No image was produced.');
    setPreparedImage(new File([result.blob], result.filename, {type: format === 'png' ? 'image/png' : 'image/jpeg'}));
    setExportStatusText(language === 'id' ? 'Gambar siap' : 'Image ready');
    return true;
  };

  const flushCurrentFormData = () => {
    const currentFormData = getCurrentTabFormData(activeTab);
    if (currentFormData) {
      updateActiveFolderData(activeTab, currentFormData);
    }
  };

  const handleDownload = async (e?: MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    flushCurrentFormData();

    const targetElement = getPreviewExportTarget(previewRef);
    if (!targetElement) {
      setExportError(language === 'id' ? 'Preview tidak ditemukan untuk diekspor.' : 'Preview target was not found.');
      return;
    }
    setExportError('');
    setIsExporting(true);

    const effectiveScale = exportScale || 1;
    const scaleSuffix = getScaleSuffix(effectiveScale);
    setExportStatusText(language === 'id' ? `Menyiapkan ${scaleSuffix}...` : `Preparing ${scaleSuffix}...`);

    try {
      const filename = `AU-Toolkit-${activeTab}-${scaleSuffix}.png`;
      if (await prepareAppleImage(targetElement, filename, effectiveScale, 'png')) return;
      const success = await downloadElementAsPng(targetElement, filename, effectiveScale, (step) => {
        setExportStatusText(step);
      });
      if (success) {
        setDownloadSuccess(true);
        setExportStatusText(language === 'id' ? 'Tersimpan!' : 'Saved PNG!');
        setTimeout(() => {
          setDownloadSuccess(false);
          setExportStatusText('');
        }, 2500);
      }
    } catch (err) {
      console.warn('Export error caught:', err);
      const message = err instanceof Error ? err.message : String(err);
      setExportError(language === 'id' ? `Export gagal: ${message}` : `Export failed: ${message}`);
      setExportStatusText('');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadJpg = async (e?: MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    flushCurrentFormData();

    const targetElement = getPreviewExportTarget(previewRef);
    if (!targetElement) {
      setExportError(language === 'id' ? 'Preview tidak ditemukan untuk diekspor.' : 'Preview target was not found.');
      return;
    }
    setExportError('');
    setIsExportingJpg(true);

    const effectiveScale = exportScale || 1;
    const scaleSuffix = getScaleSuffix(effectiveScale);
    setExportStatusText(language === 'id' ? `Menyiapkan ${scaleSuffix} JPG...` : `Preparing ${scaleSuffix} JPG...`);

    try {
      const filename = `AU-Toolkit-${activeTab}-${scaleSuffix}.jpg`;
      if (await prepareAppleImage(targetElement, filename, effectiveScale, 'jpeg')) return;
      const success = await downloadElementAsJpg(targetElement, filename, effectiveScale, 1.0, (step) => {
        setExportStatusText(step);
      });
      if (success) {
        setDownloadJpgSuccess(true);
        setExportStatusText(language === 'id' ? 'Tersimpan!' : 'Saved JPG!');
        setTimeout(() => {
          setDownloadJpgSuccess(false);
          setExportStatusText('');
        }, 2500);
      }
    } catch (err) {
      console.warn('Export JPG error caught:', err);
      const message = err instanceof Error ? err.message : String(err);
      setExportError(language === 'id' ? `Export gagal: ${message}` : `Export failed: ${message}`);
      setExportStatusText('');
    } finally {
      setIsExportingJpg(false);
    }
  };

  const handleCopyClipboard = async (e?: MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    flushCurrentFormData();

    const targetElement = getPreviewExportTarget(previewRef);
    if (!targetElement) {
      setExportError(language === 'id' ? 'Preview tidak ditemukan untuk disalin.' : 'Preview target was not found.');
      return;
    }
    setExportError('');
    setIsExporting(true);

    try {
      const isStoryModule = activeTab === 'instagram-story' || activeTab === 'instagram-story-reply' || activeTab === 'instagram-story-viewers';
      const effectiveScale = isStoryModule ? Math.max(exportScale || 1, 3) : exportScale;
      const success = await copyElementToClipboard(targetElement, effectiveScale);
      if (success) {
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2500);
      }
    } catch (err) {
      console.warn('Copy to clipboard error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setExportError(language === 'id' ? `Gagal menyalin preview: ${message}` : `Failed to copy preview: ${message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    preparedImage,
    closePreparedImage: () => {setPreparedImage(null); setExportStatusText('');},
    exportScale,
    setExportScale,
    isExporting,
    isExportingJpg,
    exportStatusText,
    exportError,
    copiedSuccess,
    downloadSuccess,
    downloadJpgSuccess,
    handleDownload,
    handleDownloadJpg,
    handleCopyClipboard,
  };
}
