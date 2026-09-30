import React, { useRef, useState, useEffect } from 'react';
import { NotesData, NotesImageItem, NotesImageLayout } from '../../../types';
import { renderIosEmojis } from '../../../utils/emojiUtils';
import { getFontFamilyCss, getFontWeightNumber } from '../../../components/FontSelectorDropdown';
import { useLanguage } from '../../../context/LanguageContext';
import { Move } from 'lucide-react';

export function renderFormattedNoteContent(text: string): React.ReactNode {
  if (!text) return null;

  // Split by markdown bold/italic/strikethrough tokens
  const tokenRegex = /(\*\*\*[\s\S]+?\*\*\*|___[\s\S]+?___|\*\*[\s\S]+?\*\*|__[\s\S]+?__|(?<!\*)\*[^\s*][\s\S]*?\*(?!\*)|(?<!_)_[^\s_][\s\S]*?_(?!_)|~~[\s\S]+?~~|<b>[\s\S]+?<\/b>|<i>[\s\S]+?<\/i>|<s>[\s\S]+?<\/s>)/g;

  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (
      (part.startsWith('***') && part.endsWith('***') && part.length >= 6) ||
      (part.startsWith('___') && part.endsWith('___') && part.length >= 6)
    ) {
      const inner = part.slice(3, -3);
      return <strong key={index} className="font-bold italic">{renderIosEmojis(inner)}</strong>;
    }
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      const inner = part.slice(2, -2);
      return <strong key={index} className="font-bold">{renderIosEmojis(inner)}</strong>;
    }
    if (part.startsWith('<b>') && part.endsWith('</b>')) {
      const inner = part.slice(3, -4);
      return <strong key={index} className="font-bold">{renderIosEmojis(inner)}</strong>;
    }
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      const inner = part.slice(1, -1);
      return <em key={index} className="italic">{renderIosEmojis(inner)}</em>;
    }
    if (part.startsWith('<i>') && part.endsWith('</i>')) {
      const inner = part.slice(3, -4);
      return <em key={index} className="italic">{renderIosEmojis(inner)}</em>;
    }
    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return <del key={index}>{renderIosEmojis(inner)}</del>;
    }
    if (part.startsWith('<s>') && part.endsWith('</s>')) {
      const inner = part.slice(3, -4);
      return <del key={index}>{renderIosEmojis(inner)}</del>;
    }

    return <React.Fragment key={index}>{renderIosEmojis(part)}</React.Fragment>;
  });
}

interface Props {
  data: NotesData;
  previewRef?: React.RefObject<HTMLDivElement>;
  onChange?: (updated: NotesData) => void;
}

export const NotesPreview: React.FC<Props> = ({ data, previewRef, onChange }) => {
  const { language } = useLanguage();
  const internalContainerRef = useRef<HTMLDivElement | null>(null);

  // Combine parent previewRef with internalContainerRef
  const setCombinedRef = (node: HTMLDivElement | null) => {
    internalContainerRef.current = node;
    if (previewRef) {
      (previewRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  // Local transform tracking for 60fps immediate responsiveness
  type InteractionType =
    | 'move'
    | 'resize-e'
    | 'resize-w'
    | 'resize-s'
    | 'resize-n'
    | 'resize-se'
    | 'resize-sw'
    | 'resize-ne'
    | 'resize-nw';

  const [activeInteraction, setActiveInteraction] = useState<{
    id: string;
    type: InteractionType;
  } | null>(null);

  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const [localTransforms, setLocalTransforms] = useState<{
    [id: string]: { x: number; y: number; width: number; height?: number };
  }>({});

  const {
    bodyText = '',
    theme = 'clean-white',
    customBgColor,
    customTextColor,
    fontStyle = 'montserrat',
    fontWeight = 'normal',
    customFontName,
    customFontUrl,
    fontSize = 16,
    lineHeight = 1.65,
    textAlign = 'left',
    aspectRatio = '4:5',
  } = (data || {}) as any;

  // Background and text color resolution
  const getColors = () => {
    if (customBgColor || customTextColor) {
      return {
        bg: customBgColor || '#FFFFFF',
        text: customTextColor || '#18181B',
      };
    }

    switch (theme) {
      case 'dark-oled':
        return { bg: '#121212', text: '#F4F4F5' };
      case 'cream-paper':
        return { bg: '#FDFBF7', text: '#292524' };
      case 'yellow-pad':
        return { bg: '#FEF9C3', text: '#1C1917' };
      case 'lavender':
        return { bg: '#FAF5FF', text: '#3B0764' };
      case 'sage-mint':
        return { bg: '#F0FDF4', text: '#064E3B' };
      case 'peach-blush':
        return { bg: '#FFF1F2', text: '#881337' };
      case 'grid-ruled':
        return { bg: '#FAFAFA', text: '#18181B' };
      case 'clean-white':
      default:
        return { bg: '#FFFFFF', text: '#18181B' };
    }
  };

  const colors = getColors();

  // Aspect Ratio class
  const getAspectClass = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square min-h-[380px] flex flex-col items-start justify-start p-7';
      case '4:5':
        return 'aspect-[4/5] min-h-[460px] flex flex-col items-start justify-start p-7';
      case '9:16':
        return 'aspect-[9/16] min-h-[560px] flex flex-col items-start justify-start p-7';
      case 'auto':
      default:
        return 'min-h-[220px] h-auto flex flex-col items-start justify-start p-7';
    }
  };

  // Normalize images list with clean default style and layout
  const getNormalizedImages = (): NotesImageItem[] => {
    if (!data) return [];
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      return data.images.map((img) => ({
        ...img,
        layout: img.layout || data.imageLayout || 'wrap-right',
      }));
    }
    if (data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.trim() !== '') {
      return [
        {
          id: 'img-1',
          url: data.imageUrl,
          x: data.imageX ?? 90,
          y: data.imageY ?? 200,
          width: data.imageWidth ?? 150,
          height: data.imageHeight,
          hasOutline: data.imageHasOutline ?? false,
          outlineWidth: data.imageOutlineWidth ?? 0,
          outlineColor: data.imageOutlineColor ?? '#FFFFFF',
          borderRadius: data.imageBorderRadius ?? 8,
          rotation: data.imageRotation ?? 0,
          shadow: false,
          layout: data.imageLayout || 'wrap-right',
        },
      ];
    }
    return [];
  };

  const images = getNormalizedImages();

  // Switch image layout directly from preview
  const updateImageLayout = (id: string, newLayout: NotesImageLayout) => {
    if (!onChange) return;
    const currentList = getNormalizedImages();
    const updated = currentList.map((img) =>
      img.id === id ? { ...img, layout: newLayout } : img
    );
    const primary = updated[0];
    onChange({
      ...(data || {} as NotesData),
      images: updated,
      imageLayout: newLayout,
      imageUrl: primary?.url || '',
    });
  };

  // Commit updated transform (x, y, width, height) to parent state
  const commitTransformChange = (
    id: string,
    transform: { x: number; y: number; width: number; height?: number }
  ) => {
    if (!onChange) return;
    const currentList = getNormalizedImages();
    const updated = currentList.map((img) =>
      img.id === id
        ? {
            ...img,
            x: transform.x,
            y: transform.y,
            width: transform.width,
            height: transform.height,
          }
        : img
    );
    const primary = updated[0];
    onChange({
      ...data,
      images: updated,
      imageUrl: primary?.url || '',
      imageX: primary?.x,
      imageY: primary?.y,
      imageWidth: primary?.width,
      imageHeight: primary?.height,
      imageHasOutline: primary?.hasOutline,
      imageOutlineWidth: primary?.outlineWidth,
      imageOutlineColor: primary?.outlineColor,
      imageBorderRadius: primary?.borderRadius,
      imageRotation: primary?.rotation,
      imageLayout: primary?.layout ?? data.imageLayout,
    });
  };

  // Helper function to calculate new transform for all handle directions
  const computeTransform = (
    type: InteractionType,
    initialX: number,
    initialY: number,
    initialWidth: number,
    initialHeight: number,
    deltaX: number,
    deltaY: number
  ) => {
    let newX = initialX;
    let newY = initialY;
    let newWidth = initialWidth;
    let newHeight = initialHeight;

    switch (type) {
      case 'move':
        newX = Math.round(initialX + deltaX);
        newY = Math.round(initialY + deltaY);
        break;

      case 'resize-e': // Drag right edge horizontally
        newWidth = Math.max(30, Math.round(initialWidth + deltaX));
        break;

      case 'resize-w': // Drag left edge horizontally
        newWidth = Math.max(30, Math.round(initialWidth - deltaX));
        newX = Math.round(initialX + (initialWidth - newWidth));
        break;

      case 'resize-s': // Drag bottom edge vertically
        newHeight = Math.max(20, Math.round(initialHeight + deltaY));
        break;

      case 'resize-n': // Drag top edge vertically
        newHeight = Math.max(20, Math.round(initialHeight - deltaY));
        newY = Math.round(initialY + (initialHeight - newHeight));
        break;

      case 'resize-se': // Bottom-right corner (free 2D resize)
        newWidth = Math.max(30, Math.round(initialWidth + deltaX));
        newHeight = Math.max(20, Math.round(initialHeight + deltaY));
        break;

      case 'resize-sw': // Bottom-left corner
        newWidth = Math.max(30, Math.round(initialWidth - deltaX));
        newX = Math.round(initialX + (initialWidth - newWidth));
        newHeight = Math.max(20, Math.round(initialHeight + deltaY));
        break;

      case 'resize-ne': // Top-right corner
        newWidth = Math.max(30, Math.round(initialWidth + deltaX));
        newHeight = Math.max(20, Math.round(initialHeight - deltaY));
        newY = Math.round(initialY + (initialHeight - newHeight));
        break;

      case 'resize-nw': // Top-left corner
        newWidth = Math.max(30, Math.round(initialWidth - deltaX));
        newX = Math.round(initialX + (initialWidth - newWidth));
        newHeight = Math.max(20, Math.round(initialHeight - deltaY));
        newY = Math.round(initialY + (initialHeight - newHeight));
        break;
    }

    return { x: newX, y: newY, width: newWidth, height: newHeight };
  };

  // Interactive Drag & Resize with Mouse (Laptop / PC)
  const startInteraction = (
    e: React.MouseEvent,
    item: NotesImageItem,
    type: InteractionType
  ) => {
    if (e.button !== 0) return; // Left click only
    e.preventDefault();
    e.stopPropagation();

    setSelectedImageId(item.id);
    setActiveInteraction({ id: item.id, type });

    const container = internalContainerRef.current;
    const scale = container ? container.getBoundingClientRect().width / 380 : 1;

    const startClientX = e.clientX;
    const startClientY = e.clientY;

    const currentT = localTransforms[item.id] || {
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
    };

    const imgEl = document.getElementById(`note-image-${item.id}`);
    const initialHeight =
      currentT.height ?? (imgEl ? imgEl.offsetHeight : Math.round(currentT.width * 0.75));
    const initialX = currentT.x;
    const initialY = currentT.y;
    const initialWidth = currentT.width;

    let latest = {
      x: initialX,
      y: initialY,
      width: initialWidth,
      height: currentT.height ?? initialHeight,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaX = (moveEvent.clientX - startClientX) / scale;
      const deltaY = (moveEvent.clientY - startClientY) / scale;

      latest = computeTransform(
        type,
        initialX,
        initialY,
        initialWidth,
        initialHeight,
        deltaX,
        deltaY
      );

      setLocalTransforms((prev) => ({
        ...prev,
        [item.id]: latest,
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setActiveInteraction(null);
      commitTransformChange(item.id, latest);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Interactive Drag & Resize with Touch (Smartphone / Tablet)
  const startTouchInteraction = (
    e: React.TouchEvent,
    item: NotesImageItem,
    type: InteractionType
  ) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();

    const touch = e.touches[0];
    setSelectedImageId(item.id);
    setActiveInteraction({ id: item.id, type });

    const container = internalContainerRef.current;
    const scale = container ? container.getBoundingClientRect().width / 380 : 1;

    const startClientX = touch.clientX;
    const startClientY = touch.clientY;

    const currentT = localTransforms[item.id] || {
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
    };

    const imgEl = document.getElementById(`note-image-${item.id}`);
    const initialHeight =
      currentT.height ?? (imgEl ? imgEl.offsetHeight : Math.round(currentT.width * 0.75));
    const initialX = currentT.x;
    const initialY = currentT.y;
    const initialWidth = currentT.width;

    let latest = {
      x: initialX,
      y: initialY,
      width: initialWidth,
      height: currentT.height ?? initialHeight,
    };

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length !== 1) return;
      moveEvent.preventDefault(); // prevent scrolling while manipulating image
      const t = moveEvent.touches[0];
      const deltaX = (t.clientX - startClientX) / scale;
      const deltaY = (t.clientY - startClientY) / scale;

      latest = computeTransform(
        type,
        initialX,
        initialY,
        initialWidth,
        initialHeight,
        deltaX,
        deltaY
      );

      setLocalTransforms((prev) => ({
        ...prev,
        [item.id]: latest,
      }));
    };

    const handleTouchEnd = () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      setActiveInteraction(null);
      commitTransformChange(item.id, latest);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
  };

  const cleanBody = bodyText || '';
  const lines = cleanBody.split('\n');

  const CARD_WIDTH = 380;
  const PADDING = 28;

  const renderImageNode = (img: NotesImageItem) => {
    if (!img || !img.url || typeof img.url !== 'string' || img.url.trim() === '') {
      return null;
    }

    const currentTransform = localTransforms[img.id] || {
      x: img.x,
      y: img.y,
      width: img.width,
      height: img.height,
    };
    const posX = currentTransform.x;
    const posY = currentTransform.y;
    const posW = currentTransform.width;
    const posH = currentTransform.height;

    const isCurrentlyInteracting = activeInteraction?.id === img.id;
    const isSelected = selectedImageId === img.id || isCurrentlyInteracting;
    const spacing = data.imageSpacing ?? 14;
    const borderRadius = img.borderRadius !== undefined ? img.borderRadius : 8;

    // Full column break if wide enough
    const isWideBlock = posW >= 280;

    let floatSide: 'right' | 'left' = 'right';
    let floatStyle: React.CSSProperties = {};
    let spacerHeight = 0;

    if (isWideBlock) {
      floatStyle = {
        width: `${posW}px`,
        maxWidth: '100%',
        margin: `${Math.max(0, posY - PADDING)}px auto ${spacing}px auto`,
        clear: 'both',
        display: 'block',
      };
    } else {
      // Dynamic float exclusion: Determine side based on image center X relative to card center (190px)
      const imageCenterX = posX + posW / 2;
      floatSide = imageCenterX >= CARD_WIDTH / 2 ? 'right' : 'left';

      if (floatSide === 'right') {
        const rightOffset = (CARD_WIDTH - PADDING) - (posX + posW);
        floatStyle = {
          float: 'right',
          clear: 'right',
          width: `${posW}px`,
          maxWidth: '100%',
          marginLeft: `${spacing}px`,
          marginRight: `${rightOffset}px`,
          marginBottom: `${spacing}px`,
          shapeOutside: `inset(0 round ${borderRadius}px)`,
        };
      } else {
        const leftOffset = posX - PADDING;
        floatStyle = {
          float: 'left',
          clear: 'left',
          width: `${posW}px`,
          maxWidth: '100%',
          marginLeft: `${leftOffset}px`,
          marginRight: `${spacing}px`,
          marginBottom: `${spacing}px`,
          shapeOutside: `inset(0 round ${borderRadius}px)`,
        };
      }

      if (posY > PADDING) {
        spacerHeight = Math.round(posY - PADDING);
      } else if (posY < PADDING) {
        floatStyle.marginTop = `${posY - PADDING}px`;
      }
    }

    const imageElement = (
      <div
        id={`note-image-${img.id}`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedImageId(img.id);
        }}
        onMouseDown={(e) => startInteraction(e, img, 'move')}
        onTouchStart={(e) => startTouchInteraction(e, img, 'move')}
        className={`relative group select-none cursor-move touch-none z-20 ${
          isWideBlock ? 'block w-full' : ''
        }`}
        style={{
          ...floatStyle,
          height: posH ? `${posH}px` : 'auto',
          transform: `rotate(${img.rotation || 0}deg)`,
          transformOrigin: 'center center',
          filter: img.shadow ? 'drop-shadow(0 6px 14px rgba(0,0,0,0.18))' : 'none',
        }}
      >
        {/* The Actual Image with Clean Style & Rounded Corners */}
        <img
          src={img.url}
          alt="Notes attachment"
          draggable={false}
          className={`w-full ${posH ? 'h-full object-cover' : 'h-auto'} block select-none pointer-events-none`}
          style={{
            borderRadius: `${borderRadius}px`,
            border:
              Boolean(img.hasOutline) && (img.outlineWidth ?? 0) > 0
                ? `${img.outlineWidth}px solid ${img.outlineColor || '#FFFFFF'}`
                : 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Real-time Dimensions & Position Badge while Interacting */}
        {isCurrentlyInteracting && (
          <div
            data-html2canvas-ignore="true"
            className="absolute -top-7 left-1/2 -translate-x-1/2 bg-purple-700 text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-lg pointer-events-none flex items-center space-x-1.5 whitespace-nowrap z-50 animate-in fade-in"
          >
            <span>{posW}px × {posH || Math.round(posW * 0.75)}px</span>
            <span className="opacity-60">•</span>
            <span>X:{posX} Y:{posY}</span>
            <span className="opacity-60">•</span>
            <span className="text-emerald-300">Free Drag</span>
          </div>
        )}

        {/* Canva-Style Bounding Box Border (Ignored in PNG Export) */}
        <div
          data-html2canvas-ignore="true"
          className={`absolute inset-0 pointer-events-none transition-opacity rounded-xs ${
            isSelected
              ? 'border-2 border-purple-500 ring-1 ring-purple-500/30 opacity-100'
              : 'group-hover:border-2 group-hover:border-purple-400/80 opacity-0 group-hover:opacity-100'
          }`}
        />

        {/* Interactive Transform / Resize Handles (Ignored in PNG Export) */}
        <div
          data-html2canvas-ignore="true"
          className={`transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          {/* Right Edge Handle */}
          <div
            onMouseDown={(e) => startInteraction(e, img, 'resize-e')}
            onTouchStart={(e) => startTouchInteraction(e, img, 'resize-e')}
            className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-6 h-10 flex items-center justify-center cursor-ew-resize touch-none z-30 group/handle"
            title="Resize Lebar"
          >
            <div className="w-1.5 h-6 bg-white border border-purple-600 rounded-full shadow-md group-hover/handle:scale-125 group-hover/handle:bg-purple-100 transition-transform" />
          </div>

          {/* Left Edge Handle */}
          <div
            onMouseDown={(e) => startInteraction(e, img, 'resize-w')}
            onTouchStart={(e) => startTouchInteraction(e, img, 'resize-w')}
            className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-6 h-10 flex items-center justify-center cursor-ew-resize touch-none z-30 group/handle"
            title="Resize Lebar"
          >
            <div className="w-1.5 h-6 bg-white border border-purple-600 rounded-full shadow-md group-hover/handle:scale-125 group-hover/handle:bg-purple-100 transition-transform" />
          </div>

          {/* Bottom Edge Handle */}
          <div
            onMouseDown={(e) => startInteraction(e, img, 'resize-s')}
            onTouchStart={(e) => startTouchInteraction(e, img, 'resize-s')}
            className="absolute left-1/2 -bottom-2.5 -translate-x-1/2 w-10 h-6 flex items-center justify-center cursor-ns-resize touch-none z-30 group/handle"
            title="Resize Tinggi"
          >
            <div className="h-1.5 w-6 bg-white border border-purple-600 rounded-full shadow-md group-hover/handle:scale-125 group-hover/handle:bg-purple-100 transition-transform" />
          </div>

          {/* Top Edge Handle */}
          <div
            onMouseDown={(e) => startInteraction(e, img, 'resize-n')}
            onTouchStart={(e) => startTouchInteraction(e, img, 'resize-n')}
            className="absolute left-1/2 -top-2.5 -translate-x-1/2 w-10 h-6 flex items-center justify-center cursor-ns-resize touch-none z-30 group/handle"
            title="Resize Tinggi"
          >
            <div className="h-1.5 w-6 bg-white border border-purple-600 rounded-full shadow-md group-hover/handle:scale-125 group-hover/handle:bg-purple-100 transition-transform" />
          </div>

          {/* Corner Handles */}
          <div
            onMouseDown={(e) => startInteraction(e, img, 'resize-se')}
            onTouchStart={(e) => startTouchInteraction(e, img, 'resize-se')}
            className="absolute -right-2 -bottom-2 w-7 h-7 flex items-center justify-center cursor-nwse-resize touch-none z-30 group/handle"
            title="Tarik sudut untuk resize besar-kecil"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-purple-600 shadow-md group-hover/handle:scale-125 group-hover/handle:bg-purple-100 transition-transform" />
          </div>

          <div
            onMouseDown={(e) => startInteraction(e, img, 'resize-sw')}
            onTouchStart={(e) => startTouchInteraction(e, img, 'resize-sw')}
            className="absolute -left-2 -bottom-2 w-7 h-7 flex items-center justify-center cursor-nesw-resize touch-none z-30 group/handle"
            title="Tarik sudut untuk resize besar-kecil"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-purple-600 shadow-md group-hover/handle:scale-125 group-hover/handle:bg-purple-100 transition-transform" />
          </div>

          <div
            onMouseDown={(e) => startInteraction(e, img, 'resize-ne')}
            onTouchStart={(e) => startTouchInteraction(e, img, 'resize-ne')}
            className="absolute -right-2 -top-2 w-7 h-7 flex items-center justify-center cursor-nesw-resize touch-none z-30 group/handle"
            title="Tarik sudut untuk resize besar-kecil"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-purple-600 shadow-md group-hover/handle:scale-125 group-hover/handle:bg-purple-100 transition-transform" />
          </div>

          <div
            onMouseDown={(e) => startInteraction(e, img, 'resize-nw')}
            onTouchStart={(e) => startTouchInteraction(e, img, 'resize-nw')}
            className="absolute -left-2 -top-2 w-7 h-7 flex items-center justify-center cursor-nwse-resize touch-none z-30 group/handle"
            title="Tarik sudut untuk resize besar-kecil"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-purple-600 shadow-md group-hover/handle:scale-125 group-hover/handle:bg-purple-100 transition-transform" />
          </div>
        </div>
      </div>
    );

    if (isWideBlock) {
      return (
        <div key={img.id} className="w-full block clear-both">
          {imageElement}
        </div>
      );
    }

    return (
      <React.Fragment key={img.id}>
        {/* Float clearance spacer to push the floating box down to posY vertically */}
        {spacerHeight > 0 && (
          <div
            data-html2canvas-ignore="false"
            aria-hidden="true"
            style={{
              float: floatSide,
              clear: floatSide,
              width: '1px',
              height: `${spacerHeight}px`,
              marginRight: floatSide === 'left' ? '-1px' : undefined,
              marginLeft: floatSide === 'right' ? '-1px' : undefined,
              pointerEvents: 'none',
              visibility: 'hidden',
            }}
          />
        )}
        {imageElement}
      </React.Fragment>
    );
  };

  return (
    <div
      ref={setCombinedRef}
      id="preview-target"
      onClick={() => setSelectedImageId(null)}
      className={`w-[380px] min-w-[380px] max-w-[380px] shrink-0 ${getAspectClass()} mx-auto overflow-hidden shadow-xl relative select-none transition-all`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderRadius: 'var(--preview-corner-radius, 16px)',
        fontFamily: getFontFamilyCss(fontStyle, customFontName, customFontUrl),
      }}
    >
      {/* Custom Embedded Font */}
      {customFontUrl && customFontName && (
        <style>{`
          @font-face {
            font-family: '${customFontName}';
            src: url('${customFontUrl}');
          }
        `}</style>
      )}

      {/* Pure Note Body Text with Natural Text Wrapping and Flow */}
      <div
        className="w-full flex-1 select-text relative z-10 block clear-both"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
          textAlign: textAlign,
          fontWeight: getFontWeightNumber(fontWeight),
        }}
      >
        {/* Images with Dynamic Float & Auto-Wrapping */}
        {images.map((img) => renderImageNode(img))}

        {/* The actual Note Body Text Paragraphs */}
        {lines.length > 0 && lines[0] !== '' ? (
          lines.map((line, idx) => (
            <p key={idx} className="mb-2 min-h-[1.2em] whitespace-pre-wrap break-words">
              {renderFormattedNoteContent(line)}
            </p>
          ))
        ) : (
          <p className="opacity-40 italic text-sm">
            Type your note text here...
          </p>
        )}

        {/* Clear floats so container wraps everything cleanly */}
        <div className="clear-both" />
      </div>
    </div>
  );
};
