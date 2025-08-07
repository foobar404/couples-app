import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Hook for managing app data - now using AppContext instead of direct Firebase calls
export const useAppData = () => {
  const [data, setData] = useState({
    moods: {},
    notes: [],
    settings: {
      dashboardWidgets: ['mood', 'notes']
    },
    lastUpdated: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data from local storage for compatibility
  const loadAppData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use local storage as fallback
      const localData = localStorage.getItem('couples-app-data');
      if (localData) {
        setData(JSON.parse(localData));
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save data to local storage
  const saveAppData = async (newData) => {
    try {
      setError(null);
      
      // Save to local storage
      localStorage.setItem('couples-app-data', JSON.stringify(newData));
      setData(newData);
    } catch (err) {
      setError(err.message);
      console.error('Error saving data:', err);
    }
  };

  // Update specific data sections
  const updateMood = async (date, mood) => {
    const newData = {
      ...data,
      moods: {
        ...data.moods,
        [date]: mood
      }
    };
    await saveAppData(newData);
  };

  const addNote = async (note) => {
    const newData = {
      ...data,
      notes: [
        ...data.notes,
        {
          id: Date.now().toString(),
          text: note,
          timestamp: new Date().toISOString()
        }
      ]
    };
    await saveAppData(newData);
  };

  const updateSettings = async (newSettings) => {
    const newData = {
      ...data,
      settings: {
        ...data.settings,
        ...newSettings
      }
    };
    await saveAppData(newData);
  };

  useEffect(() => {
    loadAppData();
  }, []);

  return {
    data,
    loading,
    error,
    loadAppData,
    saveAppData,
    updateMood,
    addNote,
    updateSettings
  };
};

// Hook for managing current date and calendar navigation
export const useCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

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

  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  return {
    currentDate,
    selectedDate,
    setSelectedDate,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
    getDaysInMonth,
    formatDate,
    formatDisplayDate,
    isToday,
    isSelected
  };
};

// Hook for managing navigation
export const useNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: '🏠', path: '/' },
    { id: 'mood', label: 'Mood', icon: '😊', path: '/mood' },
    { id: 'notes', label: 'Notes', icon: '📝', path: '/notes' },
    { id: 'games', label: 'Games', icon: '🎮', path: '/games' },
    { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings' }
  ];

  // Get current active tab based on location
  const getActiveTab = () => {
    const currentPath = location.pathname;
    const currentTab = tabs.find(tab => tab.path === currentPath);
    return currentTab ? currentTab.id : 'dashboard';
  };

  const activeTab = getActiveTab();

  const setActiveTab = (tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      navigate(tab.path);
    }
  };

  return {
    activeTab,
    setActiveTab,
    tabs
  };
};
