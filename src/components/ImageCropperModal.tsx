import React, { useState, useEffect, useRef } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { Crop, X, Check, RotateCw, RotateCcw, Circle, Square, ZoomIn, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { canvasToDataUrlAsync, createCircularCropDataUrl } from '../utils/imageManager';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string, sessionId?: string) => void;
  cropShape?: 'round' | 'rect';
  forceAspect?: number;
  allow916?: boolean;
  maxOutputDimension?: number;
  quality?: number;
  sessionId?: string;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  cropShape: initialCropShape = 'rect',
  forceAspect,
  allow916 = true,
  maxOutputDimension,
  quality,
  sessionId,
}) => {
  const { language } = useLanguage();
  const isId = language === 'id';

  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const [zoom, setZoom] = useState<number>(1);
  const [shape, setShape] = useState<'round' | 'rect'>(initialCropShape);
  const [isCropperReady, setIsCropperReady] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(
    forceAspect !== undefined ? forceAspect : initialCropShape === 'round' ? 1 : undefined
  );

  const rafZoomId = useRef<number | null>(null);
  const isZoomingRaf = useRef<boolean>(false);
  const initCropperRef = useRef<() => void>(() => {});

  const isLocal = !imageSrc || imageSrc.startsWith('blob:') || imageSrc.startsWith('data:');

  // Track component mounted status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (rafZoomId.current !== null) {
        cancelAnimationFrame(rafZoomId.current);
      }
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, []);

  // Define Cropper initialization logic
  const initCropper = () => {
    if (!imageRef.current || !isMountedRef.current) return;

    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }

    const currentAspect =
      shape === 'round'
        ? 1
        : forceAspect !== undefined
        ? forceAspect
        : aspectRatio !== undefined
        ? aspectRatio
        : NaN;

    const cropper = new Cropper(imageRef.current, {
      aspectRatio: currentAspect,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.9,
      responsive: true,
      restore: false,
      checkCrossOrigin: !isLocal,
      checkOrientation: true,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      zoomOnTouch: true,
      zoomOnWheel: true,
      minContainerWidth: 280,
      minContainerHeight: 280,
      ready() {
        if (isMountedRef.current) {
          setIsCropperReady(true);
          setZoom(1);
        }
      },
      zoom(e) {
        if (e.detail && typeof e.detail.ratio === 'number') {
          const clamped = Math.max(1, Math.min(3, e.detail.ratio));
          // Throttle React state updates using requestAnimationFrame for smooth 60fps
          if (!isZoomingRaf.current) {
            isZoomingRaf.current = true;
            requestAnimationFrame(() => {
              if (isMountedRef.current) {
                setZoom(clamped);
              }
              isZoomingRaf.current = false;
            });
          }
        }
      },
    });

    cropperRef.current = cropper;
  };

  initCropperRef.current = initCropper;

  // Initialize and update CropperJS instance when modal opens or image changes
  useEffect(() => {
    if (!isOpen || !imageSrc) {
      setIsCropperReady(false);
      return;
    }

    setIsCropperReady(false);

    // If image is already fully loaded in DOM, initialize immediately; otherwise wait for onLoad event
    const imgEl = imageRef.current;
    if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
      initCropper();
    }

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
      setIsCropperReady(false);
    };
  }, [isOpen, imageSrc]);

  // Handle aspect ratio change
  const handleSetAspect = (newAspect: number | undefined) => {
    setAspectRatio(newAspect);
    if (cropperRef.current) {
      cropperRef.current.setAspectRatio(newAspect !== undefined ? newAspect : NaN);
    }
  };

  // Handle shape change
  const handleSetShape = (newShape: 'round' | 'rect') => {
    setShape(newShape);
    if (cropperRef.current) {
      if (newShape === 'round') {
        cropperRef.current.setAspectRatio(1);
      } else {
        const aspect = forceAspect !== undefined ? forceAspect : aspectRatio !== undefined ? aspectRatio : NaN;
        cropperRef.current.setAspectRatio(aspect);
      }
    }
  };

  // Handle zoom slider with RAF batching for 60fps fluidity
  const handleZoomSlider = (newZoom: number) => {
    setZoom(newZoom);
    if (rafZoomId.current !== null) {
      cancelAnimationFrame(rafZoomId.current);
    }
    rafZoomId.current = requestAnimationFrame(() => {
      if (cropperRef.current) {
        cropperRef.current.zoomTo(newZoom);
      }
    });
  };

  // Handle rotate 90 degrees
  const handleRotate = () => {
    if (cropperRef.current) {
      cropperRef.current.rotate(90);
    }
  };

  // Handle reset crop & position
  const handleReset = () => {
    if (cropperRef.current) {
      cropperRef.current.reset();
      setZoom(1);
    }
  };

  // Handle apply / complete crop asynchronously without blocking UI thread
  const handleApply = async () => {
    if (!cropperRef.current || isApplying) return;
    setIsApplying(true);

    try {
      const maxDim = maxOutputDimension || 2048;
      const croppedCanvas = cropperRef.current.getCroppedCanvas({
        maxWidth: maxDim,
        maxHeight: maxDim,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });

      if (!croppedCanvas) {
        setIsApplying(false);
        return;
      }

      let finalDataUrl = '';
      if (shape === 'round') {
        // High-definition circular crop with smooth antialiased clipping
        const diameter = Math.min(1080, croppedCanvas.width, croppedCanvas.height);
        finalDataUrl = await createCircularCropDataUrl(croppedCanvas, diameter);
      } else {
        const outQuality = quality !== undefined ? quality : 0.94;
        finalDataUrl = await canvasToDataUrlAsync(croppedCanvas, 'image/jpeg', outQuality);
      }

      if (finalDataUrl && isMountedRef.current) {
        onCropComplete(finalDataUrl, sessionId);
      }
    } catch (e) {
      console.error('Error cropping image with CropperJS:', e);
    } finally {
      if (isMountedRef.current) {
        setIsApplying(false);
      }
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fadeIn select-none">
      <style>{`
        .cropper-modal {
          background-color: rgba(2, 6, 23, 0.7) !important;
        }
        .cropper-container {
          will-change: transform;
        }
        .cropper-view-box,
        .cropper-face,
        .cropper-crop-box,
        .cropper-canvas img {
          will-change: transform;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        .cropper-view-box {
          outline: 2.5px solid #a855f7 !important;
          outline-color: #a855f7 !important;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.35) !important;
          position: relative;
        }
        .cropper-line {
          background-color: #a855f7 !important;
          opacity: 0.8 !important;
        }
        /* Corner handles: Circular white gems with subtle purple border */
        .cropper-point.point-se,
        .cropper-point.point-sw,
        .cropper-point.point-ne,
        .cropper-point.point-nw {
          width: 11px !important;
          height: 11px !important;
          background-color: #ffffff !important;
          border: 1.5px solid #a855f7 !important;
          border-radius: 50% !important;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.8) !important;
          opacity: 1 !important;
        }
        /* Side handles: Sleek purple pills */
        .cropper-point.point-e,
        .cropper-point.point-w {
          width: 4px !important;
          height: 14px !important;
          background-color: #c084fc !important;
          border-radius: 2px !important;
          opacity: 0.95 !important;
          margin-top: -7px !important;
        }
        .cropper-point.point-s,
        .cropper-point.point-n {
          width: 14px !important;
          height: 4px !important;
          background-color: #c084fc !important;
          border-radius: 2px !important;
          opacity: 0.95 !important;
          margin-left: -7px !important;
        }
        .cropper-dashed {
          border-color: rgba(255, 255, 255, 0.35) !important;
        }
        .cropper-center::before,
        .cropper-center::after {
          background-color: rgba(255, 255, 255, 0.6) !important;
        }
        /* Circle guide inside crop frame when Circle mask is selected */
        .cropper-circle-guide .cropper-view-box::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid #a855f7;
          pointer-events: none;
          z-index: 2;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        #crop-adjust-modal-title,
        .cropper-modal-title {
          color: #ffffff !important;
        }
      `}</style>

      <div className="bg-[#0B1120] border border-[#1E293B] rounded-2xl w-full max-w-xl shadow-2xl shadow-black/80 flex flex-col max-h-[94vh] sm:max-h-[88vh] overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3 border-b border-[#1E293B] bg-[#0B1120] shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#1E1B4B]/80 border border-[#4338CA]/40 text-[#C084FC]">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="crop-adjust-modal-title"
                style={{ color: '#ffffff' }}
                className="cropper-modal-title text-sm sm:text-base font-bold text-white !text-white tracking-tight"
              >
                Crop & Adjust Image
              </h3>
              <p className="text-[11px] text-slate-400">
                Drag corner/side handles freely or choose aspect ratio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
            title={isId ? 'Tutup' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Cropper Area with Checkerboard Background */}
        <div
          className={`relative w-full flex-1 min-h-[200px] h-[240px] sm:h-[300px] md:h-[340px] max-h-[46vh] bg-[#090D16] flex items-center justify-center overflow-hidden ${
            shape === 'round' ? 'cropper-circle-guide' : ''
          }`}
          style={{
            backgroundImage: `
              linear-gradient(45deg, #1E293B 25%, transparent 25%),
              linear-gradient(-45deg, #1E293B 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #1E293B 75%),
              linear-gradient(-45deg, transparent 75%, #1E293B 75%)
            `,
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
            backgroundColor: '#0F172A',
          }}
        >
          {/* Instant pre-mount working preview so there is never a blank screen */}
          {!isCropperReady && (
            <img
              src={imageSrc}
              alt="Instant preview"
              className="max-w-full max-h-full object-contain absolute inset-0 m-auto pointer-events-none"
            />
          )}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Source for cropping"
            className="max-w-full max-h-full block opacity-0"
            crossOrigin={isLocal ? undefined : 'anonymous'}
            onLoad={() => {
              if (isMountedRef.current && !cropperRef.current) {
                initCropperRef.current?.();
              }
            }}
            onError={() => {
              if (imageRef.current && imageRef.current.crossOrigin) {
                imageRef.current.removeAttribute('crossorigin');
                imageRef.current.src = imageSrc;
              }
            }}
          />
        </div>

        {/* Modal Controls / Zoom & Shape Toolbar */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-t border-[#1E293B] bg-[#0B1120] flex flex-col gap-2.5 text-xs shrink-0">
          
          {/* Zoom Slider */}
          <div className="flex items-center space-x-3 w-full">
            <div className="flex items-center space-x-1.5 text-slate-200 text-xs font-medium shrink-0">
              <ZoomIn className="w-4 h-4 text-purple-400" />
              <span>Zoom</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              aria-label="Zoom"
              onChange={(e) => handleZoomSlider(Number(e.target.value))}
              className="w-full h-1.5 bg-[#1E293B] rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <span className="text-xs font-bold text-slate-200 w-9 text-right shrink-0">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Mask & Shape Toolbar */}
          <div className="flex flex-col items-stretch justify-between gap-2 min-w-0 sm:flex-row sm:items-center">
            {/* Left side: Mask Toggles + Aspect Ratios grouped together */}
            <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2 overflow-hidden sm:flex-row sm:items-center sm:gap-0 sm:space-x-2">
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-xs font-semibold text-slate-400 mr-0.5">Mask:</span>
                <button
                  type="button"
                  onClick={() => handleSetShape('round')}
                  className={`px-3 py-1 rounded-full font-bold text-xs border transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                    shape === 'round'
                      ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30'
                      : 'bg-transparent border-[#334155] text-slate-300 hover:text-white hover:bg-[#1E293B]'
                  }`}
                >
                  <Circle className={`w-3.5 h-3.5 ${shape === 'round' ? 'fill-current' : ''}`} />
                  <span>Circle</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetShape('rect')}
                  className={`px-3 py-1 rounded-full font-bold text-xs border transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                    shape === 'rect'
                      ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30'
                      : 'bg-transparent border-[#334155] text-slate-300 hover:text-white hover:bg-[#1E293B]'
                  }`}
                >
                  <Square className={`w-3.5 h-3.5 ${shape === 'rect' ? 'fill-current' : ''}`} />
                  <span>Rectangle</span>
                </button>
              </div>

              {/* Aspect Ratio Buttons positioned right next to Rectangle button */}
              {shape === 'rect' && (
                <div className="flex w-full min-w-0 flex-nowrap items-center space-x-1 overflow-x-auto border-t border-[#1E293B] pt-1.5 pb-0.5 scrollbar-none touch-pan-x sm:w-auto sm:border-t-0 sm:border-l sm:py-0.5 sm:pl-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetAspect(undefined)}
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      aspectRatio === undefined
                        ? 'bg-purple-600 border-purple-500 text-white shadow-xs'
                        : 'bg-[#1E293B] border-[#334155] text-slate-300 hover:text-white hover:bg-[#334155]'
                    }`}
                  >
                    Free
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAspect(1)}
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      aspectRatio === 1
                        ? 'bg-purple-600 border-purple-500 text-white shadow-xs'
                        : 'bg-[#1E293B] border-[#334155] text-slate-300 hover:text-white hover:bg-[#334155]'
                    }`}
                  >
                    1:1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAspect(4 / 5)}
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      aspectRatio === 4 / 5
                        ? 'bg-purple-600 border-purple-500 text-white shadow-xs'
                        : 'bg-[#1E293B] border-[#334155] text-slate-300 hover:text-white hover:bg-[#334155]'
                    }`}
                  >
                    4:5
                  </button>
                  {allow916 && (
                    <button
                      type="button"
                      onClick={() => handleSetAspect(9 / 16)}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                        aspectRatio === 9 / 16
                          ? 'bg-purple-600 border-purple-500 text-white shadow-xs'
                          : 'bg-[#1E293B] border-[#334155] text-slate-300 hover:text-white hover:bg-[#334155]'
                      }`}
                    >
                      9:16
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSetAspect(16 / 9)}
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      aspectRatio === 16 / 9
                        ? 'bg-purple-600 border-purple-500 text-white shadow-xs'
                        : 'bg-[#1E293B] border-[#334155] text-slate-300 hover:text-white hover:bg-[#334155]'
                    }`}
                  >
                    16:9
                  </button>
                </div>
              )}
            </div>

            {/* Right side: Reset & Rotate Buttons */}
            <div className="ml-auto flex shrink-0 items-center space-x-1.5">
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-xl bg-[#1E293B] border border-[#334155] text-slate-300 hover:text-white hover:bg-[#334155] transition-colors flex items-center justify-center cursor-pointer"
                title={isId ? 'Reset Posisi & Zoom' : 'Reset Position & Zoom'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 rounded-xl bg-[#1E293B] border border-[#334155] text-slate-300 hover:text-white hover:bg-[#334155] transition-colors flex items-center justify-center cursor-pointer"
                title={isId ? 'Putar 90°' : 'Rotate 90°'}
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer Action Buttons */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-[#1E293B] bg-[#0B1120] flex items-center justify-end space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1E293B]/70 hover:bg-[#1E293B] active:bg-[#334155] border border-[#334155] hover:border-slate-500 text-slate-200 hover:text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isApplying}
            onClick={handleApply}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:opacity-75 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isId ? 'Memproses...' : 'Applying...'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Apply / Crop</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
