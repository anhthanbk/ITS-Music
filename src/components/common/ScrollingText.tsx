import React, { useRef, useEffect, useState } from 'react';

interface ScrollingTextProps {
  text: string;
  className?: string;
  speed?: number; // duration in seconds
}

export const ScrollingText: React.FC<ScrollingTextProps> = ({
  text,
  className = '',
  speed = 10,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
      }
    };

    checkOverflow();
    // Re-check after font loads or layout updates
    const timer = setTimeout(checkOverflow, 200);
    window.addEventListener('resize', checkOverflow);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [text]);

  return (
    <div ref={containerRef} className={`overflow-hidden whitespace-nowrap relative ${className}`}>
      {isOverflowing ? (
        <div
          className="inline-flex animate-marquee whitespace-nowrap"
          style={{ animationDuration: `${Math.max(6, Math.min(20, text.length * 0.4))}s` }}
        >
          <span className="pr-8">{text}</span>
          <span className="pr-8">{text}</span>
        </div>
      ) : (
        <span ref={textRef} className="truncate block w-full">
          {text}
        </span>
      )}
    </div>
  );
};

export default ScrollingText;
