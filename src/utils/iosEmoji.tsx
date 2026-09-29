import React from 'react';
import { renderEmojiText } from './emojiUtils';

interface Props {
  text?: string;
  className?: string;
  sizeEm?: number;
}

/** Backward-compatible component routed through the shared emoji renderer. */
export const IOSEmojiText: React.FC<Props> = ({ text, className, sizeEm = 1 }) => {
  if (!text) return null;
  return <span className={className}>{renderEmojiText(text, { sizeEm })}</span>;
};
