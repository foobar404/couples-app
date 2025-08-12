import React, { useState, useEffect } from 'react';
import { useApp } from '../utils/AppContext';
import { Card, Button } from '../components/UI';

export const CalendarPage = () => {
  const { data, addPinnedDate, deletePinnedDate, addSharedCalendarEvent, updateSharedCalendarEvent, deleteSharedCalendarEvent } = useApp();
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingPin, setEditingPin] = useState(null);
  const [pickerDate, setPickerDate] = useState('');
  const [newPinTitle, setNewPinTitle] = useState('');

  // Get pinned dates and shared events from data
  const pinnedDates = data.pinnedDates || [];
  const events = data.sharedCalendarEvents || [];

  // Pin management functions
  const handleAddNewPin = () => {
    setEditingPin({ id: 'new', title: '' });
    setNewPinTitle('');
    setPickerDate('');
    setShowDatePicker(true);
  };

  const handleDatePickerSave = async () => {
    if (!pickerDate || !editingPin) return;
    
    if (editingPin.id === 'new') {
      // Creating new pin
      if (!newPinTitle.trim()) {
        alert('Please enter a title for the pin');
        return;
      }
      await addPinnedDate({
        title: newPinTitle.trim(),
        date: pickerDate
      });
    } else {
      // Update existing pin (shouldn't happen with current UI but keeping for robustness)
      await addPinnedDate({
        title: editingPin.title,
        date: pickerDate
      });
    }
    
    setShowDatePicker(false);
    setEditingPin(null);
    setPickerDate('');
    setNewPinTitle('');
  };

  const handleDatePickerCancel = () => {
    setShowDatePicker(false);
    setEditingPin(null);
    setPickerDate('');
    setNewPinTitle('');
  };

  const handleDeletePin = async (pinId) => {
    if (window.confirm('Are you sure you want to delete this pin?')) {
      try {
        await deletePinnedDate(pinId);
      } catch (error) {
        console.error('Failed to delete pin:', error);
        alert('Failed to delete pin. Please try again.');
      }
    }
  };

  const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    const [year, month, day] = dateString.split('-').map(Number);
    
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  };

  // Helper function to format date using local time
  const formatDateLocal = (dateInput) => {
    let date;
    if (typeof dateInput === 'string') {
      // Parse YYYY-MM-DD string as local date
      const [year, month, day] = dateInput.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateInput);
    }
    
    return date.toLocaleDateString([], { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper function to get date string in local time
  const getDateStringLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = (date) => {
    const dateStr = getDateStringLocal(date);
    
    // Get all events for this date (regular and repeating)
    const allEventsOnDate = events.filter(event => {
      // Regular event on this specific date
      if (event.date === dateStr) return true;
      // Repeating event that should appear on this date
      if (event.repeating && shouldShowRepeatingEvent(event, date)) return true;
      return false;
    });

    if (allEventsOnDate.length === 0) {
      // No existing events, create a new one
      setEditingEvent(null);
      setSelectedDate(date);
      setShowEventModal(true);
    } else if (allEventsOnDate.length === 1) {
      const event = allEventsOnDate[0];
      if (event.repeating) {
        // For repeating events, we can only edit the original event
        // Show a simple message and allow editing the repeating event
        if (confirm(`This is a repeating event: "${event.title}". Would you like to edit the original event?`)) {
          setEditingEvent(event);
          setShowEventModal(true);
        }
      } else {
        // Regular event, edit normally
        setEditingEvent(event);
        setShowEventModal(true);
      }
    } else {
      // Multiple events on this date, show selection
      const eventOptions = allEventsOnDate.map(event => {
        const type = event.repeating ? ' (repeating)' : '';
        return `${event.title}${type}`;
      }).join('\n');
      
      const choice = prompt(`Multiple events on this date:\n${eventOptions}\n\nEnter the number (1-${allEventsOnDate.length}) to edit, or press Cancel to add a new event:`);
      
      if (choice && !isNaN(choice)) {
        const index = parseInt(choice) - 1;
        if (index >= 0 && index < allEventsOnDate.length) {
          setEditingEvent(allEventsOnDate[index]);
          setShowEventModal(true);
        }
      } else if (choice === null) {
        // User cancelled, create new event
        setEditingEvent(null);
        setSelectedDate(date);
        setShowEventModal(true);
      }
    }
  };

  const handleSaveEvent = async (eventData) => {
    try {
      if (editingEvent) {
        await updateSharedCalendarEvent(editingEvent.id, eventData);
      } else {
        await addSharedCalendarEvent({
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
        await deleteSharedCalendarEvent(eventId);
      } catch (error) {
        console.error('Failed to delete event:', error);
        alert('Failed to delete event. Please try again.');
      }
    }
  };

  const formatDate = (dateStr) => {
    return formatDateLocal(dateStr);
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

  const calculateTimePassed = (dateString) => {
    if (!dateString || typeof dateString !== 'string') {
      return 'No date';
    }
    
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const targetDate = new Date(year, month - 1, day);
      const now = new Date();
      
      let years = now.getFullYear() - targetDate.getFullYear();
      let months = now.getMonth() - targetDate.getMonth();
      let days = now.getDate() - targetDate.getDate();
      
      // Adjust for negative days
      if (days < 0) {
        months--;
        const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += lastMonth.getDate();
      }
      
      // Adjust for negative months
      if (months < 0) {
        years--;
        months += 12;
      }
      
      const parts = [];
      if (years > 0) parts.push(`${years}yr`);
      if (months > 0) parts.push(`${months}mo`);
      if (days > 0) parts.push(`${days}d`);
      
      if (parts.length === 0) {
        return 'Today';
      }
      
      return parts.join(' ') + ' ago';
    } catch (error) {
      console.error('Error calculating time passed:', error);
      return 'Invalid date';
    }
  };

  const formatPinDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') {
      return '';
    }
    
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting pin date:', error);
      return dateString;
    }
  };

  // Helper function to check if a repeating event should appear on a given date
  const shouldShowRepeatingEvent = (event, checkDate) => {
    if (!event.repeating || !event.date) return false;
    
    const eventDate = new Date(event.date);
    const targetDate = new Date(checkDate);
    
    // Don't show events before their original date
    if (targetDate < eventDate) return false;
    
    switch (event.repeatType) {
      case 'yearly':
        return eventDate.getMonth() === targetDate.getMonth() && 
               eventDate.getDate() === targetDate.getDate();
               
      case 'monthly':
        return eventDate.getDate() === targetDate.getDate();
        
      case 'weekly':
        if (!event.weekdays || event.weekdays.length === 0) return false;
        return event.weekdays.includes(targetDate.getDay());
        
      default:
        return false;
    }
  };

  // Helper function to check if any event (regular or repeating) should appear on a date
  const hasEventOnDate = (dateStr, date) => {
    // Check for regular events on this specific date
    const hasRegularEvent = events.some(event => event.date === dateStr);
    
    // Check for repeating events that should appear on this date
    const hasRepeatingEvent = events.some(event => 
      event.repeating && shouldShowRepeatingEvent(event, date)
    );
    
    return hasRegularEvent || hasRepeatingEvent;
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
      const dateStr = getDateStringLocal(date);
      const hasEvent = hasEventOnDate(dateStr, date);
      const hasPinnedDate = pinnedDates.some(pd => pd.date === dateStr);
      const isToday = dateStr === getDateStringLocal(new Date());
      
      days.push({
        day,
        date,
        dateStr,
        hasEvent,
        hasPinnedDate,
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
          {days.map((dayData, index) => {
            if (!dayData) {
              return (
                <button
                  key={index}
                  className="calendar__day calendar__day--empty"
                  disabled={true}
                />
              );
            }

            // Get all events for this day
            const dayEvents = events.filter(event => {
              // Regular event on this specific date
              if (event.date === dayData.dateStr) return true;
              // Repeating event that should appear on this date
              if (event.repeating && shouldShowRepeatingEvent(event, dayData.date)) return true;
              return false;
            });

            return (
              <button
                key={index}
                className={`
                  calendar__day
                  ${dayData.isToday ? 'calendar__day--today' : ''}
                  ${dayData.hasEvent ? 'calendar__day--selected' : ''}
                `}
                onClick={() => handleDateClick(dayData.date)}
              >
                <div className="calendar__day-content">
                  <span className="calendar__day-number">{dayData.day}</span>
                  
                  {/* Show pinned date indicator */}
                  {dayData.hasPinnedDate && (
                    <span className="calendar__day-emoji">📌</span>
                  )}
                  
                  {/* Show event indicators */}
                  {dayEvents.length > 0 && !dayData.hasPinnedDate && (
                    <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((event, idx) => (
                        <span key={`${event.id}-${idx}`} className="calendar__day-emoji text-xs">
                          {event.emoji || '📅'}
                        </span>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="calendar__day-emoji text-xs">+</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          Click a date to add an event
        </div>
      </div>
    );
  };

  return (
    <div className="page p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">💕 Our Calendar</h1>

      {/* Pinned Dates Section - Simple */}
      <Card className="mb-4">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">📌 Pins</h2>
            <Button
              variant="secondary"
              size="small"
              onClick={() => handleAddNewPin()}
            >
              Add New Pin
            </Button>
          </div>
          
          <div className="space-y-2">
            {/* All Pins */}
            {pinnedDates.filter(pin => pin.date).map(pin => (
              <div key={pin.id} className="flex items-center justify-between text-sm py-2">
                <div className="flex-1">
                  <span className="font-medium">{pin.title}</span>
                  <div className="text-gray-500 text-xs mt-1">
                    {formatPinDate(pin.date)} • {calculateTimePassed(pin.date)}
                  </div>
                </div>
                <button
                  className="text-red-600 hover:text-red-800 px-2 py-1 text-xs"
                  onClick={() => handleDeletePin(pin.id)}
                  title="Delete pin"
                >
                  ✕
                </button>
              </div>
            ))}
            
            {pinnedDates.filter(pin => pin.date).length === 0 && (
              <div className="text-center text-gray-500 py-4">
                <p>No pins yet</p>
                <p className="text-xs mt-1">Add important dates to track</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Upcoming Events - Compact */}
      {getUpcomingEvents().length > 0 && (
        <Card className="mb-4">
          <div className="p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              📅 Shared Events
            </h2>
            <div className="space-y-2">
              {getUpcomingEvents().map(event => (
                <div
                  key={event.id}
                  className="flex items-center justify-between text-sm py-1"
                >
                  <div className="flex-1">
                    <span className="font-medium">{event.title}</span>
                    <span className="text-gray-500 ml-2">{formatDate(event.date)}</span>
                    {event.repeating && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                        {event.repeatType}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingEvent(event);
                        setShowEventModal({ type: 'event' });
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Visual Calendar */}
      <Card className="mb-6">
        <div className="">
          <VisualCalendar />
        </div>
      </Card>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          event={editingEvent}
          selectedDate={typeof showEventModal === 'object' ? showEventModal.date : undefined}
          onSave={handleSaveEvent}
          onDelete={editingEvent ? handleDeleteEvent : undefined}
          onClose={() => {
            setShowEventModal(false);
            setEditingEvent(null);
          }}
        />
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingPin?.id === 'new' ? 'Create New Pin' : `Set Date for ${editingPin?.title}`}
              </h3>
              
              {editingPin?.id === 'new' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pin Title
                  </label>
                  <input
                    type="text"
                    value={newPinTitle}
                    onChange={(e) => setNewPinTitle(e.target.value)}
                    placeholder="Enter pin title..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={pickerDate}
                  onChange={(e) => setPickerDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={handleDatePickerCancel}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDatePickerSave}
                  disabled={!pickerDate || (editingPin?.id === 'new' && !newPinTitle.trim())}
                >
                  {editingPin?.id === 'new' ? 'Create Pin' : 'Save Date'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Event Modal Component
const EventModal = ({ event, selectedDate, onSave, onDelete, onClose }) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    date: event?.date || selectedDate || new Date().toLocaleDateString('en-CA'),
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
    
    if (!formData.title.trim()) {
      alert('Please enter a title for the event');
      return;
    }
    if (formData.repeating && formData.repeatType === 'weekly' && formData.weekdays.length === 0) {
      alert('Please select at least one day of the week for weekly events');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {event ? '📅 Edit Event' : '📅 Add Event'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Event Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="e.g., Birthday, Trip"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

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

          {formData.repeating && (
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

          {formData.repeating && formData.repeatType === 'weekly' && (
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

          <div className="flex gap-3 pt-4">
            {onDelete && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this event?')) {
                    onDelete(event.id);
                    onClose();
                  }
                }}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </Button>
            )}
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
              Save Event
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
