import React from 'react';
import { Widget } from '../UI';
import { useApp } from '../../utils/AppContext';

export const CalendarWidget = () => {
  const { data } = useApp();
  
  const events = data.sharedCalendarEvents || [];
  const pinnedDates = data.pinnedDates || [];

  // Get upcoming events and pins
  const getUpcomingItems = () => {
    const now = new Date();
    const upcoming = [];

    // Add upcoming events
    events.forEach(event => {
      if (event.date) {
        const eventDate = new Date(event.date);
        if (eventDate >= now || event.repeating) {
          upcoming.push({
            type: 'event',
            title: event.title,
            date: event.date,
            emoji: event.emoji || '📅',
            repeating: event.repeating
          });
        }
      }
    });

    // Add pins (they don't have a future/past concept)
    pinnedDates.forEach(pin => {
      if (pin.date && pin.title) {
        upcoming.push({
          type: 'pin',
          title: pin.title,
          date: pin.date,
          emoji: '📌'
        });
      }
    });

    // Sort by date and take first 3
    return upcoming
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return dateString;
    }
  };

  const upcomingItems = getUpcomingItems();

  return (
    <Widget 
      title="📅 Calendar" 
      action="View All"
      href="/calendar"
    >
      <div className="space-y-3">
        {upcomingItems.length > 0 ? (
          upcomingItems.map((item, index) => (
            <div key={`${item.type}-${index}`} className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-lg">{item.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{item.title}</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(item.date)}
                    {item.repeating && ' (repeating)'}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">
            <div className="text-2xl mb-2">📅</div>
            <div className="text-sm">No upcoming events</div>
          </div>
        )}
      </div>
    </Widget>
  );
};
