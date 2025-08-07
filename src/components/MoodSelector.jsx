import React, { useRef } from 'react';
import { EmojiButton } from './UI';

export const MOODS = [
  { emoji: '😊', label: 'Great', value: 'great' },
  { emoji: '🙂', label: 'Good', value: 'good' },
  { emoji: '😐', label: 'Okay', value: 'okay' },
  { emoji: '😕', label: 'Meh', value: 'meh' },
  { emoji: '😔', label: 'Down', value: 'down' },
  { emoji: '😢', label: 'Sad', value: 'sad' },
  { emoji: '😭', label: 'Terrible', value: 'terrible' },
  { emoji: '😴', label: 'Tired', value: 'tired' },
  { emoji: '🤒', label: 'Sick', value: 'sick' },
  { emoji: '😤', label: 'Stressed', value: 'stressed' },
  { emoji: '🥰', label: 'Loved', value: 'loved' },
  { emoji: '😍', label: 'Amazing', value: 'amazing' }
];

export const MoodSelector = ({ selectedMood, onMoodSelect, className = '' }) => {
  const scrollContainerRef = useRef(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -80, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 80, behavior: 'smooth' });
    }
  };

  return (
    <div className={`mood-selector ${className}`}>
      <div className="relative flex items-center">
        <button
          onClick={scrollLeft}
          className="btn w-6 h-6 mr-1 flex-shrink-0 text-textSecondary hover:text-primary rounded"
          style={{ minWidth: '24px', fontSize: '14px' }}
          aria-label="Scroll left"
        >
          ‹
        </button>
        
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto pb-2 scrollbar-hide flex-1"
          style={{ minWidth: '0', scrollPaddingLeft: '0' }}
        >
          {MOODS.map((mood, index) => (
            <EmojiButton
              key={mood.value}
              emoji={mood.emoji}
              label={mood.label}
              isSelected={selectedMood === mood.value}
              onClick={() => onMoodSelect(mood.value)}
              className={`flex-shrink-0 w-10 h-10 justify-center items-center ${index > 0 ? 'ml-1' : ''}`}
            />
          ))}
        </div>
        
        <button
          onClick={scrollRight}
          className="btn w-6 h-6 ml-1 flex-shrink-0 text-textSecondary hover:text-primary rounded"
          style={{ minWidth: '24px', fontSize: '14px' }}
          aria-label="Scroll right"
        >
          ›
        </button>
      </div>
    </div>
  );
};

export const MoodDisplay = ({ mood, size = 'default', showLabel = false }) => {
  const moodData = MOODS.find(m => m.value === mood);
  
  if (!moodData) return null;

  const sizeClass = size === 'large' ? 'text-4xl' : size === 'small' ? 'text-lg' : 'text-2xl';

  return (
    <div className="mood-display flex items-center gap-2">
      <span className={sizeClass}>{moodData.emoji}</span>
      {showLabel && (
        <span className="text-sm text-textSecondary">{moodData.label}</span>
      )}
    </div>
  );
};
