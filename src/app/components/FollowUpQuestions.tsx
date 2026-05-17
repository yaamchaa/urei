import { useState, useEffect } from 'react';
import { Button } from './ui/button';

interface FollowUpQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
  isLoading: boolean;
}

export function FollowUpQuestions({ questions, onQuestionClick, isLoading }: FollowUpQuestionsProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount < questions.length) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => prev + 1);
      }, 400); // 각 버튼이 0.4초 간격으로 나타남

      return () => clearTimeout(timer);
    }
  }, [visibleCount, questions.length]);

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-600 mb-3 font-medium">💡 이런 것도 궁금하시다면:</p>
      {questions.slice(0, visibleCount).map((question, idx) => (
        <div
          key={idx}
          className="animate-fadeIn"
          style={{ 
            animation: 'fadeIn 0.3s ease-in',
            animationFillMode: 'backwards'
          }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuestionClick(question)}
            className="text-xs text-left w-full justify-start hover:bg-blue-50 hover:border-blue-300 transition-all"
            disabled={isLoading}
          >
            💬 {question}
          </Button>
        </div>
      ))}
    </div>
  );
}
