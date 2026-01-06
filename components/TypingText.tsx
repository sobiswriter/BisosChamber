
import React, { useState, useEffect } from 'react';

interface TypingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

const TypingText: React.FC<TypingTextProps> = ({ text, speed = 15, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      // Small delay after finishing before calling completion
      const finalTimeout = setTimeout(onComplete, 200);
      return () => clearTimeout(finalTimeout);
    }
  }, [index, text, speed, onComplete]);

  return <>{displayedText}</>;
};

export default TypingText;
