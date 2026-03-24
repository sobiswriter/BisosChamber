
import React, { useState, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

const CHARS_PER_TICK = 3;

interface TypingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

const TypingText: React.FC<TypingTextProps> = ({ text, speed = 3, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        const end = Math.min(index + CHARS_PER_TICK, text.length);
        setDisplayedText(text.slice(0, end));
        setIndex(end);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      // Small delay after finishing before calling completion
      const finalTimeout = setTimeout(onComplete, 200);
      return () => clearTimeout(finalTimeout);
    }
  }, [index, text, speed, onComplete]);

  return <MarkdownRenderer content={displayedText} />;
};

export default TypingText;
