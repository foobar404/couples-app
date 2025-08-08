import React, { useState } from 'react';
import { Calendar } from '../components/Calendar';
import { MoodSelector } from '../components/MoodSelector';
import { Card } from '../components/UI';
import { useCalendar } from '../utils/hooks';
import { useApp } from '../utils/AppContext';

export const MoodPage = () => {
  const { data, updateMood } = useApp();
  const {
    currentDate,
    selectedDate,
    setSelectedDate,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
    formatDate,
    formatDisplayDate
  } = useCalendar();

  const [showMoodSelector, setShowMoodSelector] = useState(false);

  // Get mood for selected date
  const selectedDateStr = formatDate(selectedDate);
  const existingMood = data.moods[selectedDateStr];

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowMoodSelector(true);
  };

  const handleMoodSelect = async (mood) => {
    await updateMood(selectedDateStr, mood);
    setShowMoodSelector(false);
  };

  const handleMoodRemove = async () => {
    await updateMood(selectedDateStr, null);
    setShowMoodSelector(false);
  };

  return (
    <div className="page p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Mood Tracker 😊</h1>
        <p className="text-textSecondary">Track your daily emotions by selecting a date</p>
      </div>

      {/* Mood Selector - appears when date is selected */}
      {showMoodSelector && (
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">{formatDisplayDate(selectedDate)}</h3>
              <button 
                onClick={() => setShowMoodSelector(false)}
                className="text-textSecondary hover:text-text"
              >
                ✕
              </button>
            </div>
            
            <MoodSelector
              selectedMood=""
              onMoodSelect={handleMoodSelect}
            />
            
            {existingMood && (
              <div className="mt-4 pt-4 border-t border-border">
                <button 
                  onClick={handleMoodRemove}
                  className="btn btn--secondary btn--small flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <span>🗑️</span>
                  Remove Mood
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Calendar */}
      <Card>
        <div className="p-4">
          <Calendar
            currentDate={currentDate}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onPrevMonth={goToPrevMonth}
            onNextMonth={goToNextMonth}
            moods={data.moods}
          />
        </div>
      </Card>
    </div>
  );
};
