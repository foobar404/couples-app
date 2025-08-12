import React, { useState } from 'react';
import { Calendar } from '../components/Calendar';
import { MoodSelector } from '../components/MoodSelector';
import { Card } from '../components/UI';
import { useCalendar } from '../utils/hooks';
import { useApp } from '../utils/AppContext';

export const MoodPage = () => {
  const { data, partnerData, currentUser, partnerEmail, updateMood } = useApp();
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

  // Get display names - Fixed the swap
  const yourDisplayName = partnerData?.settings?.displayName || currentUser?.name || 'You';
  const partnerDisplayName = data.settings?.displayName || 'Partner';

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
    <div className="page p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">😊 Mood Tracker</h1>

      {/* Mood Selector */}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Calendar */}
        <Card>
            <h2 className="text-lg font-semibold mb-4 text-center">
              {yourDisplayName}'s Moods
            </h2>
            <Calendar
              currentDate={currentDate}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onPrevMonth={goToPrevMonth}
              onNextMonth={goToNextMonth}
              moods={data.moods}
              className="w-full m-auto"
            />
        </Card>

        {/* Partner Calendar */}
        {partnerEmail && partnerData && (
          <Card>
            <h2 className="text-lg font-semibold mb-4 text-center">
              {partnerDisplayName}'s Moods
            </h2>
            <Calendar
              currentDate={currentDate}
              selectedDate={selectedDate}
              onDateSelect={() => {}} // Partner calendar is read-only
              onPrevMonth={goToPrevMonth}
              onNextMonth={goToNextMonth}
              moods={partnerData.moods || {}}
            />
          </Card>
        )}

        {/* Partner Not Connected Message */}
        {!partnerEmail && (
          <Card className="flex items-center justify-center">
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">👫</div>
              <h3 className="font-semibold text-gray-900 mb-2">Connect with your partner</h3>
              <p className="text-gray-600 text-sm mb-4">
                Set up your partner's email in settings to see their mood calendar
              </p>
              <button 
                onClick={() => window.location.hash = '#/settings'}
                className="btn btn--primary btn--small"
              >
                Go to Settings
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
