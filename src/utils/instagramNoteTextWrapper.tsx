import React from 'react';
import { renderFormattedTextWithAppleEmojis } from './emojiUtils';

interface Props {
  text: string;
  maxCharsPerLine?: number;
}

export const InstagramNoteText: React.FC<Props> = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <br />}
          {renderFormattedTextWithAppleEmojis(line)}
        </React.Fragment>
      ))}
    </>
  );
};
