import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TypingMessageProps {
  content: string;
  onComplete?: () => void;
  speed?: number;
}

export function TypingMessage({ content, onComplete, speed = 15 }: TypingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(prev => prev + content[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (currentIndex === content.length && onComplete) {
      // 타이핑 완료 후 콜백 실행
      setTimeout(() => {
        onComplete();
      }, 300);
    }
  }, [currentIndex, content, speed, onComplete]);

  return (
    <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0 prose-headings:my-2 prose-table:my-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {displayedContent}
      </ReactMarkdown>
      {currentIndex < content.length && (
        <span className="inline-block w-1 h-4 bg-blue-600 ml-0.5 animate-pulse"></span>
      )}
    </div>
  );
}
