import React, { useState, useEffect } from 'react';
import { useApp } from '../utils/AppContext';
import { Card, Button } from '../components/UI';

export const CalendarPage = () => {
  const { data, updateSettings, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = useApp();
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeTogetherText, setTimeTogetherText] = useState('');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Get anniversary and events from data
  const anniversary = data.settings?.anniversary;
  const events = data.calendarEvents || [];

  // Calculate time together
  useEffect(() => {
    if (anniversary) {
      const annivDate = new Date(anniversary);
      const now = new Date();
      const diffTime = Math.abs(now - annivDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      const days = diffDays % 30;

      let timeText = '';
      if (years > 0) timeText += `${years} year${years > 1 ? 's' : ''}, `;
      if (months > 0) timeText += `${months} month${months > 1 ? 's' : ''}, `;
      timeText += `${days} day${days > 1 ? 's' : ''}`;
      
      setTimeTogetherText(timeText);
    }
  }, [anniversary]);

  const handleSetAnniversary = async (date) => {
    try {
      await updateSettings({
        ...data.settings,
        anniversary: date
      });
      setShowEventModal(false); // Close modal after setting anniversary
    } catch (error) {
      console.error('Failed to set anniversary:', error);
      alert('Failed to set anniversary. Please try again.');
    }
  };

  const handleDateClick = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(date);
    setShowEventModal({
      type: 'event',
      date: dateStr
    });
  };

  const handleSaveEvent = async (eventData) => {
    try {
      if (editingEvent) {
        await updateCalendarEvent(editingEvent.id, eventData);
      } else {
        await addCalendarEvent({
          ...eventData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        });
      }
      setShowEventModal(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('Failed to save event. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteCalendarEvent(eventId);
      } catch (error) {
        console.error('Failed to delete event:', error);
        alert('Failed to delete event. Please try again.');
      }
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    const upcoming = events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now || event.repeating;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
    
    return upcoming;
  };

  // Visual Calendar Component
  const VisualCalendar = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    const days = [];
    
    // Add empty cells for previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const hasEvent = events.some(event => event.date === dateStr);
      const isAnniversary = anniversary === dateStr;
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      
      days.push({
        day,
        date,
        dateStr,
        hasEvent,
        isAnniversary,
        isToday
      });
    }
    
    const goToPrevMonth = () => {
      setCurrentCalendarDate(new Date(year, month - 1, 1));
    };
    
    const goToNextMonth = () => {
      setCurrentCalendarDate(new Date(year, month + 1, 1));
    };
    
    return (
      <div className="calendar">
        {/* Calendar Header */}
        <div className="calendar__header">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-gray-100 rounded"
          >
            ←
          </button>
          <h3 className="text-lg font-semibold">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>
        
        {/* Day labels */}
        <div className="calendar__grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar__day-header">
              {day}
            </div>
          ))}
        
          {/* Calendar days */}
          {days.map((dayData, index) => (
            <button
              key={index}
              className={`
                calendar__day
                ${!dayData ? 'calendar__day--empty' : ''}
                ${dayData?.isToday ? 'calendar__day--today' : ''}
                ${dayData?.hasEvent ? 'calendar__day--selected' : ''}
              `}
              onClick={() => dayData && handleDateClick(dayData.date)}
              disabled={!dayData}
            >
              {dayData && (
                <div className="calendar__day-content">
                  <span className="calendar__day-number">{dayData.day}</span>
                  {dayData.isAnniversary && (
                    <span className="calendar__day-emoji">💖</span>
                  )}
                  {dayData.hasEvent && !dayData.isAnniversary && (
                    <span className="calendar__day-emoji">�</span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          Click a date to add an event
        </div>
      </div>
    );
  };

  return (
    <div className="page p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">💕 Our Calendar</h1>

      {/* Anniversary Section */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              💖 Anniversary
            </h2>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowEventModal('anniversary')}
            >
              {anniversary ? 'Update' : 'Set Date'}
            </Button>
          </div>
          
          {anniversary ? (
            <div className="text-center">
              <div className="text-xl font-medium mb-2">
                {formatDate(anniversary)}
              </div>
              {timeTogetherText && (
                <div className="text-sm text-textSecondary">
                  Together for {timeTogetherText} 💕
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-textSecondary">
              <p>Set your anniversary date to track your time together</p>
            </div>
          )}
        </div>
      </Card>

      {/* Upcoming Events - Compact */}
      {getUpcomingEvents().length > 0 && (
        <Card className="mb-4">
          <div className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              📅 Upcoming Events
            </h2>
            <div className="space-y-2">
              {getUpcomingEvents().map(event => (
                <div
                  key={event.id}
                  className="flex items-center justify-between text-sm py-1"
                >
                  <div className="flex-1">
                    <span className="font-medium">{event.title}</span>
                    <span className="text-textSecondary ml-2">{formatDate(event.date)}</span>
                    {event.repeating && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                        {event.repeatType}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setEditingEvent(event);
                      setShowEventModal({ type: 'event' });
                    }}
                    className="text-blue-600 hover:text-blue-800 text-xs ml-2"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Visual Calendar */}
      <Card className="mb-6">
        <div className="p-6">
          <VisualCalendar />
        </div>
      </Card>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          type={typeof showEventModal === 'string' ? showEventModal : showEventModal.type}
          event={editingEvent}
          anniversary={anniversary}
          selectedDate={typeof showEventModal === 'object' ? showEventModal.date : undefined}
          onSave={typeof showEventModal === 'string' && showEventModal === 'anniversary' ? handleSetAnniversary : handleSaveEvent}
          onClose={() => {
            setShowEventModal(false);
            setEditingEvent(null);
          }}
        />
      )}
    </div>
  );
};

// Event Modal Component
const EventModal = ({ type, event, anniversary, selectedDate, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    date: event?.date || selectedDate || new Date().toISOString().split('T')[0],
    description: event?.description || '',
    repeating: event?.repeating || false,
    repeatType: event?.repeatType || 'yearly',
    weekdays: event?.weekdays || []
  });

  const toggleWeekday = (dayIndex) => {
    const newWeekdays = formData.weekdays.includes(dayIndex)
      ? formData.weekdays.filter(day => day !== dayIndex)
      : [...formData.weekdays, dayIndex];
    setFormData({ ...formData, weekdays: newWeekdays });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (type === 'anniversary') {
      onSave(formData.date);
    } else {
      if (!formData.title.trim()) {
        alert('Please enter a title for the event');
        return;
      }
      if (formData.repeating && formData.repeatType === 'weekly' && formData.weekdays.length === 0) {
        alert('Please select at least one day of the week for weekly events');
        return;
      }
      onSave(formData);
    }
  };

  const isAnniversary = type === 'anniversary';
  const isRepeating = type === 'repeating';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {isAnniversary ? '💖 Set Anniversary' : 
             isRepeating ? '🔄 Add Repeating Event' : 
             event ? '📅 Edit Event' : '📅 Add Event'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAnniversary && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Event Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g., First Date, Birthday, Trip"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              {isAnniversary ? 'Anniversary Date' : 'Event Date'}
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {!isAnniversary && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows="2"
                  placeholder="Add any notes or details..."
                />
              </div>

              {!isAnniversary && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="repeating"
                    checked={formData.repeating}
                    onChange={(e) => setFormData({...formData, repeating: e.target.checked})}
                  />
                  <label htmlFor="repeating" className="text-sm">
                    Repeating event
                  </label>
                </div>
              )}

              {!isAnniversary && formData.repeating && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Repeat Type
                      </label>
                      <select
                        value={formData.repeatType}
                        onChange={(e) => setFormData({...formData, repeatType: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="yearly">Yearly</option>
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                  )}

                  {!isAnniversary && formData.repeating && formData.repeatType === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select Days
                      </label>
                      <div className="grid grid-cols-7 gap-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleWeekday(index)}
                            className={`
                              p-1 text-sm rounded border transition-colors font-medium
                              ${formData.weekdays.includes(index)
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                              }
                            `}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      {formData.weekdays.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          Please select at least one day
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              {isAnniversary ? 'Set Anniversary' : 'Save Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
