import React from 'react';
import { Button } from './UI';

const MOODS = {
  'amazing': '😍',
  'great': '😊',
  'good': '🙂',
  'okay': '😐',
  'meh': '😕',
  'down': '😔',
  'sad': '😢',
  'terrible': '😭',
  'tired': '😴',
  'sick': '🤒',
  'stressed': '😤',
  'loved': '🥰'
};

export const Calendar = ({ 
  currentDate, 
  selectedDate, 
  onDateSelect, 
  onPrevMonth, 
  onNextMonth, 
  moods = {},
  className = '' 
}) => {
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const getMoodEmoji = (date) => {
    const dateStr = formatDate(date);
    const mood = moods[dateStr];
    return mood ? MOODS[mood] : null;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`calendar ${className}`}>
      <div className="calendar__header">
        <Button onClick={onPrevMonth} size="small" className="w-10 h-10 rounded-full">‹</Button>
        <h3 className="text-lg font-semibold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <Button onClick={onNextMonth} size="small" className="w-10 h-10 rounded-full">›</Button>
      </div>
      
      <div className="calendar__grid">
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="calendar__day-header">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {getDaysInMonth().map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="calendar__day calendar__day--empty"></div>;
          }

          let dayClasses = 'calendar__day';
          if (isToday(date)) dayClasses += ' calendar__day--today';
          if (isSelected(date)) dayClasses += ' calendar__day--selected';

          const moodEmoji = getMoodEmoji(date);

          return (
            <button
              key={formatDate(date)}
              className={dayClasses}
              onClick={() => onDateSelect(date)}
            >
              <div className="calendar__day-content">
                {moodEmoji ? (
                  <span className="calendar__day-emoji">{moodEmoji}</span>
                ) : (
                  <span className="calendar__day-number">{date.getDate()}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
