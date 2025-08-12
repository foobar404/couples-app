import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  initializeFirebase, 
  signOutUser, 
  onAuthStateChange,
  getCurrentUser,
  getUserData,
  updateUserData,
  getPartnerData,
  connectPartner,
  checkPartnerExists,
  subscribeToUserData,
  subscribeToPartnerData
} from './firebase';
import { getTestUserData } from './devConfig';

// Initial data structure
const initialData = {
  moods: {},
  notes: [], // Keep for backward compatibility
  sharedNotes: [], // New shared notes system
  messages: [],
  notifications: [], // Partner notifications
  photos: [],
  calendarEvents: [], // Calendar events and anniversary
  sharedCalendarEvents: [], // Shared calendar events
  pinnedDates: [], // Shared pinned dates
  location: null,
  games: {
    scores: {},
    history: []
  },
  settings: {
    dashboardWidgets: ['mood'],
    notifications: true,
    theme: 'light'
  },
  lastUpdated: null,
  updatedBy: null
};

// Create context
const AppContext = createContext();

// Context provider component
export const AppProvider = ({ children }) => {
  // Core state
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [partnerEmail, setPartnerEmailState] = useState(null);
  const [partnerData, setPartnerData] = useState(null);
  const [data, setData] = useState(initialData);
  const [userDataListener, setUserDataListener] = useState(null);
  const [partnerDataListener, setPartnerDataListener] = useState(null);
  const [cleanupInterval, setCleanupInterval] = useState(null);
  
  // Use ref to always have current data in listeners
  const dataRef = useRef(data);
  dataRef.current = data;

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Auto-sync data when it changes (2 second delay)
  useEffect(() => {
    if (currentUser && data.lastUpdated) {
      const timeoutId = setTimeout(syncDataToFirebase, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [data.lastUpdated]);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      await initializeFirebase();
      
      // Restore test user if in dev mode
      if (import.meta.env.DEV) {
        const storedTestUser = sessionStorage.getItem('test-user');
        if (storedTestUser) {
          const testUser = JSON.parse(storedTestUser);
          await signInUser(testUser);
          setIsLoading(false);
          return;
        }
      }
      
      // Set up auth state listener
      onAuthStateChange(async (user) => {
        if (user) {
          const userData = {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            imageUrl: user.photoURL
          };
          setCurrentUser(userData);
          await loadUserDataFromFirebase(user.email);
        } else {
          clearUserState();
        }
      });
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setSyncError(error.message);
      setIsLoading(false);
    }
  };

  const clearUserState = () => {
    setCurrentUser(null);
    setPartnerEmailState(null);
    setPartnerData(null);
    setData(initialData);
    setIsLoading(false);
    stopDataListeners();
    stopCleanupInterval();
  };

  const loadUserDataFromFirebase = async (userEmail) => {
    try {
      const userData = await getUserData(userEmail);
      
      if (userData) {
        const finalData = {
          moods: userData.moods || {},
          notes: userData.notes || [], // Keep for backward compatibility
          sharedNotes: userData.sharedNotes || [], // New shared notes
          messages: userData.messages || [],
          photos: userData.photos || [],
          calendarEvents: userData.calendarEvents || [],
          sharedCalendarEvents: userData.sharedCalendarEvents || [],
          pinnedDates: userData.pinnedDates || [],
          location: userData.location || null,
          games: userData.games || { scores: {}, history: [] },
          settings: userData.settings || initialData.settings,
          lastUpdated: userData.lastUpdated,
          updatedBy: userData.email
        };
        
        setData(finalData);
        setSyncError(null);
        
        // Set up partner if exists
        if (userData.partnerEmail) {
          setPartnerEmailState(userData.partnerEmail);
          const partnerData = await getPartnerData(userData.partnerEmail);
          if (partnerData) setPartnerData(partnerData);
        }
        
        // Start real-time listeners
        startDataListeners(userEmail, userData.partnerEmail);
        
        // Migrate calendar events to shared if needed
        await migrateCalendarEventsToShared(userData, userEmail);
        
        // Start cleanup interval for messages
        startCleanupInterval();
        
      } else {
        // Create initial data for new user
        const newData = {
          ...initialData,
          lastUpdated: new Date().toISOString(),
          updatedBy: userEmail
        };
        setData(newData);
        await updateUserData(userEmail, newData);
        
        // Start cleanup interval for messages
        startCleanupInterval();
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load from Firebase:', error);
      setSyncError(error.message);
      setIsLoading(false);
    }
  };

  const syncDataToFirebase = async () => {
    const user = currentUser || getCurrentUser();
    if (!user) return;
    
    try {
      const dataToSync = {
        ...dataRef.current,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.email
      };
      
      await updateUserData(user.email, dataToSync);
      setSyncError(null);
    } catch (error) {
      console.error('Failed to sync to Firebase:', error);
      setSyncError(error.message);
    }
  };

  // Simplified data update functions
  const updateData = (updates) => {
    setData(prevData => {
      const newData = {
        ...prevData,
        ...updates,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.email || 'unknown'
      };
      // Update ref immediately so listeners have access to latest data
      dataRef.current = newData;
      return newData;
    });
  };

  const updateMood = async (date, mood) => {
    const newMoods = { ...data.moods };
    if (mood === null) {
      delete newMoods[date];
    } else {
      newMoods[date] = mood;
    }
    updateData({ moods: newMoods });
  };

  const addNote = async (noteData) => {
    const newNote = {
      id: noteData.id || Date.now().toString(),
      title: noteData.title,
      content: noteData.content,
      type: noteData.type || 'text',
      author: currentUser?.name || 'Unknown',
      authorEmail: currentUser?.email || 'unknown',
      timestamp: noteData.timestamp || new Date().toISOString()
    };
    updateData({ notes: [...data.notes, newNote] });
  };

  // New shared notes functions
  const addSharedNote = async (noteData) => {
    const newNote = {
      id: noteData.id || Date.now().toString(),
      title: noteData.title,
      content: noteData.content,
      type: noteData.type || 'text',
      author: currentUser?.name || 'Unknown',
      authorEmail: currentUser?.email || 'unknown',
      timestamp: noteData.timestamp || new Date().toISOString(),
      isShared: true
    };

    // Add to both user and partner data if partner exists
    const updatedSharedNotes = [...data.sharedNotes, newNote];
    updateData({ sharedNotes: updatedSharedNotes });

    // If we have a partner, sync to their data too
    if (partnerEmail) {
      try {
        const partnerData = await getPartnerData(partnerEmail);
        if (partnerData) {
          const partnerSharedNotes = [...(partnerData.sharedNotes || []), newNote];
          await updateUserData(partnerEmail, {
            ...partnerData,
            sharedNotes: partnerSharedNotes,
            lastUpdated: new Date().toISOString(),
            updatedBy: currentUser?.email || 'unknown'
          });
        }
      } catch (error) {
        console.warn('Could not sync note to partner:', error);
      }
    }
  };

  const updateNote = async (noteId, updates) => {
    const updatedNotes = data.notes.map(note => 
      note.id === noteId 
        ? { ...note, ...updates, lastModified: new Date().toISOString() }
        : note
    );
    updateData({ notes: updatedNotes });
  };

  const updateSharedNote = async (noteId, updates) => {
    const updatedSharedNotes = data.sharedNotes.map(note => 
      note.id === noteId 
        ? { ...note, ...updates, lastModified: new Date().toISOString() }
        : note
    );
    updateData({ sharedNotes: updatedSharedNotes });

    // Sync to partner if exists
    if (partnerEmail) {
      try {
        const partnerData = await getPartnerData(partnerEmail);
        if (partnerData) {
          const partnerSharedNotes = (partnerData.sharedNotes || []).map(note => 
            note.id === noteId 
              ? { ...note, ...updates, lastModified: new Date().toISOString() }
              : note
          );
          await updateUserData(partnerEmail, {
            ...partnerData,
            sharedNotes: partnerSharedNotes,
            lastUpdated: new Date().toISOString(),
            updatedBy: currentUser?.email || 'unknown'
          });
        }
      } catch (error) {
        console.warn('Could not sync note update to partner:', error);
      }
    }
  };

  const deleteNote = async (noteId) => {
    const filteredNotes = data.notes.filter(note => note.id !== noteId);
    updateData({ notes: filteredNotes });
  };

  const deleteSharedNote = async (noteId) => {
    const filteredSharedNotes = data.sharedNotes.filter(note => note.id !== noteId);
    updateData({ sharedNotes: filteredSharedNotes });

    // Sync deletion to partner if exists
    if (partnerEmail) {
      try {
        const partnerData = await getPartnerData(partnerEmail);
        if (partnerData) {
          const partnerSharedNotes = (partnerData.sharedNotes || []).filter(note => note.id !== noteId);
          await updateUserData(partnerEmail, {
            ...partnerData,
            sharedNotes: partnerSharedNotes,
            lastUpdated: new Date().toISOString(),
            updatedBy: currentUser?.email || 'unknown'
          });
        }
      } catch (error) {
        console.warn('Could not sync note deletion to partner:', error);
      }
    }
  };

  // Shared Calendar Events functions
  const addSharedCalendarEvent = async (eventData) => {
    const newEvent = {
      id: eventData.id || Date.now().toString(),
      title: eventData.title,
      date: eventData.date,
      description: eventData.description || '',
      repeating: eventData.repeating || false,
      repeatType: eventData.repeatType || 'yearly',
      weekdays: eventData.weekdays || [],
      author: currentUser?.name || 'Unknown',
      authorEmail: currentUser?.email || 'unknown',
      createdAt: eventData.createdAt || new Date().toISOString(),
      isShared: true
    };

    // Add to both user and partner data if partner exists
    const updatedSharedEvents = [...(data.sharedCalendarEvents || []), newEvent];
    updateData({ sharedCalendarEvents: updatedSharedEvents });

    // If we have a partner, sync to their data too
    if (partnerEmail) {
      try {
        const partnerData = await getPartnerData(partnerEmail);
        if (partnerData) {
          const partnerSharedEvents = [...(partnerData.sharedCalendarEvents || []), newEvent];
          await updateUserData(partnerEmail, {
            ...partnerData,
            sharedCalendarEvents: partnerSharedEvents,
            lastUpdated: new Date().toISOString(),
            updatedBy: currentUser?.email || 'unknown'
          });
        }
      } catch (error) {
        console.warn('Could not sync calendar event to partner:', error);
      }
    }
  };

  const updateSharedCalendarEvent = async (eventId, updatedEventData) => {
    // Update local data
    const updatedSharedEvents = (data.sharedCalendarEvents || []).map(event =>
      event.id === eventId ? { ...event, ...updatedEventData } : event
    );
    updateData({ sharedCalendarEvents: updatedSharedEvents });

    // Sync to partner if exists
    if (partnerEmail) {
      try {
        const partnerData = await getPartnerData(partnerEmail);
        if (partnerData) {
          const partnerSharedEvents = (partnerData.sharedCalendarEvents || []).map(event =>
            event.id === eventId ? { ...event, ...updatedEventData } : event
          );
          await updateUserData(partnerEmail, {
            ...partnerData,
            sharedCalendarEvents: partnerSharedEvents,
            lastUpdated: new Date().toISOString(),
            updatedBy: currentUser?.email || 'unknown'
          });
        }
      } catch (error) {
        console.warn('Could not sync calendar event update to partner:', error);
      }
    }
  };

  const deleteSharedCalendarEvent = async (eventId) => {
    // Remove from local data
    const updatedSharedEvents = (data.sharedCalendarEvents || []).filter(event => event.id !== eventId);
    updateData({ sharedCalendarEvents: updatedSharedEvents });

    // Sync to partner if exists
    if (partnerEmail) {
      try {
        const partnerData = await getPartnerData(partnerEmail);
        if (partnerData) {
          const partnerSharedEvents = (partnerData.sharedCalendarEvents || []).filter(event => event.id !== eventId);
          await updateUserData(partnerEmail, {
            ...partnerData,
            sharedCalendarEvents: partnerSharedEvents,
            lastUpdated: new Date().toISOString(),
            updatedBy: currentUser?.email || 'unknown'
          });
        }
      } catch (error) {
        console.warn('Could not sync calendar event deletion to partner:', error);
      }
    }
  };

  // Shared Pinned Dates functions
  const addPinnedDate = async (pinData) => {
    const newPin = {
      id: pinData.id || Date.now().toString(),
      title: pinData.title,
      date: pinData.date,
      author: currentUser?.name || 'Unknown',
      authorEmail: currentUser?.email || 'unknown',
      createdAt: new Date().toISOString()
    };

    // Add to local data
    const updatedPinnedDates = [...data.pinnedDates, newPin];
    updateData({ pinnedDates: updatedPinnedDates });

    // Sync to partner if exists
    if (partnerEmail) {
      try {
        const partnerData = await getPartnerData(partnerEmail);
        if (partnerData) {
          const partnerPinnedDates = [...(partnerData.pinnedDates || []), newPin];
          await updateUserData(partnerEmail, {
            ...partnerData,
            pinnedDates: partnerPinnedDates,
            lastUpdated: new Date().toISOString(),
            updatedBy: currentUser?.email || 'unknown'
          });
        }
      } catch (error) {
        console.warn('Could not sync pinned date to partner:', error);
      }
    }
  };

  const deletePinnedDate = async (pinId) => {
    // Remove from local data
    const updatedPinnedDates = data.pinnedDates.filter(pin => pin.id !== pinId);
    updateData({ pinnedDates: updatedPinnedDates });

    // Sync to partner if exists
    if (partnerEmail) {
      try {
        const partnerData = await getPartnerData(partnerEmail);
        if (partnerData) {
          const partnerPinnedDates = (partnerData.pinnedDates || []).filter(pin => pin.id !== pinId);
          await updateUserData(partnerEmail, {
            ...partnerData,
            pinnedDates: partnerPinnedDates,
            lastUpdated: new Date().toISOString(),
            updatedBy: currentUser?.email || 'unknown'
          });
        }
      } catch (error) {
        console.warn('Could not sync pinned date deletion to partner:', error);
      }
    }
  };

  // Notification functions
  const sendNotificationToPartner = async (title, message) => {
    if (!partnerEmail || !currentUser) {
      throw new Error('Partner email or current user not available');
    }

    const notification = {
      id: Date.now().toString(),
      title: title.trim(),
      message: message.trim(),
      timestamp: new Date().toISOString(),
      from: currentUser.email,
      read: false
    };

    try {
      // Get current partner data
      const currentPartnerData = await getPartnerData(partnerEmail);
      if (!currentPartnerData) {
        throw new Error('Partner data not found');
      }

      // Add notification to partner's notifications array
      const updatedNotifications = [...(currentPartnerData.notifications || []), notification];
      
      // Update partner's data
      await updateUserData(partnerEmail, {
        ...currentPartnerData,
        notifications: updatedNotifications,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser.email
      });

      return notification;
    } catch (error) {
      console.error('Failed to send notification to partner:', error);
      throw error;
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    if (!currentUser) return;

    // Update local data first
    setData(prevData => ({
      ...prevData,
      notifications: prevData.notifications.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      ),
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.email
    }));

    // Sync to Firebase
    try {
      const userData = await getUserData(currentUser.email);
      if (userData) {
        const updatedNotifications = userData.notifications.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        );
        
        await updateUserData(currentUser.email, {
          ...userData,
          notifications: updatedNotifications,
          lastUpdated: new Date().toISOString(),
          updatedBy: currentUser.email
        });
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!currentUser) return;

    // Update local data first
    setData(prevData => ({
      ...prevData,
      notifications: prevData.notifications.filter(notif => notif.id !== notificationId),
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.email
    }));

    // Sync to Firebase
    try {
      const userData = await getUserData(currentUser.email);
      if (userData) {
        const updatedNotifications = userData.notifications.filter(notif => notif.id !== notificationId);
        
        await updateUserData(currentUser.email, {
          ...userData,
          notifications: updatedNotifications,
          lastUpdated: new Date().toISOString(),
          updatedBy: currentUser.email
        });
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Auto-delete messages older than 24 hours
  const cleanupOldMessages = () => {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const filteredMessages = data.messages.filter(message => {
      const messageTime = new Date(message.timestamp);
      return messageTime > twentyFourHoursAgo;
    });
    
    // Only update if we actually removed messages
    if (filteredMessages.length < data.messages.length) {
      console.log(`Cleaned up ${data.messages.length - filteredMessages.length} old messages`);
      updateData({ messages: filteredMessages });
    }
  };

  const addMessage = async (messageText) => {
    const newMessage = {
      id: Date.now().toString(),
      text: messageText,
      timestamp: new Date().toISOString(),
      sender: currentUser?.email || 'unknown'
    };
    
    // Update state and sync immediately
    setData(prevData => {
      // Filter out messages older than 24 hours before adding new message
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const recentMessages = prevData.messages.filter(message => {
        const messageTime = new Date(message.timestamp);
        return messageTime > twentyFourHoursAgo;
      });
      
      const newMessages = [...recentMessages, newMessage];
      const updatedData = {
        ...prevData,
        messages: newMessages,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.email || 'unknown'
      };
      
      // Sync to Firebase immediately in the next tick
      setTimeout(async () => {
        try {
          const user = currentUser || getCurrentUser();
          if (user) {
            await updateUserData(user.email, updatedData);
            setSyncError(null);
          }
        } catch (error) {
          console.error('Failed to sync message to Firebase:', error);
          setSyncError(error.message);
        }
      }, 0);
      
      return updatedData;
    });
  };

  // Photo functions
  const addPhoto = async (photoData) => {
    if (!currentUser) return;

    // Update local data first
    setData(prevData => ({
      ...prevData,
      photos: [...(prevData.photos || []), photoData],
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.email
    }));

    // Sync to Firebase
    if (currentUser.email !== 'test@user.com' && currentUser.email !== 'test@partner.com') {
      setTimeout(async () => {
        try {
          const userData = await getUserData(currentUser.email);
          if (userData) {
            const updatedPhotos = [...(userData.photos || []), photoData];
            
            await updateUserData(currentUser.email, {
              ...userData,
              photos: updatedPhotos,
              lastUpdated: new Date().toISOString(),
              updatedBy: currentUser.email
            });
          }
        } catch (error) {
          console.error('Failed to sync photo to Firebase:', error);
          setSyncError(error.message);
        }
      }, 0);
    }

    // Sync to partner if connected
    if (partnerEmail && partnerEmail !== 'test@partner.com' && partnerEmail !== 'test@user.com') {
      try {
        const partnerData = await getPartnerData(partnerEmail);
        if (partnerData) {
          const updatedPhotos = [...(partnerData.photos || []), photoData];
          await updateUserData(partnerEmail, {
            ...partnerData,
            photos: updatedPhotos,
            lastUpdated: new Date().toISOString(),
            updatedBy: currentUser.email
          });
        }
      } catch (error) {
        console.warn('Could not sync photo to partner:', error);
      }
    }
  };

  const deletePhoto = async (photoId) => {
    if (!currentUser) return;

    // Update local data first
    setData(prevData => ({
      ...prevData,
      photos: prevData.photos.filter(photo => photo.id !== photoId),
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.email
    }));

    // Sync to Firebase
    if (currentUser.email !== 'test@user.com' && currentUser.email !== 'test@partner.com') {
      setTimeout(async () => {
        try {
          const userData = await getUserData(currentUser.email);
          if (userData) {
            const updatedPhotos = userData.photos.filter(photo => photo.id !== photoId);
            
            await updateUserData(currentUser.email, {
              ...userData,
              photos: updatedPhotos,
              lastUpdated: new Date().toISOString(),
              updatedBy: currentUser.email
            });
          }
        } catch (error) {
          console.error('Failed to sync photo deletion to Firebase:', error);
          setSyncError(error.message);
        }
      }, 0);
    }

    // Sync to partner if connected
    if (partnerEmail && partnerEmail !== 'test@partner.com' && partnerEmail !== 'test@user.com') {
      try {
        const partnerData = await getPartnerData(partnerEmail);
        if (partnerData) {
          const updatedPhotos = partnerData.photos.filter(photo => photo.id !== photoId);
          await updateUserData(partnerEmail, {
            ...partnerData,
            photos: updatedPhotos,
            lastUpdated: new Date().toISOString(),
            updatedBy: currentUser.email
          });
        }
      } catch (error) {
        console.warn('Could not sync photo deletion to partner:', error);
      }
    }
  };

  const updateSettings = async (newSettings) => {
    updateData({ 
      settings: { ...data.settings, ...newSettings } 
    });
  };

  const updateLocation = async (locationData) => {
    // Update state and sync immediately
    setData(prevData => {
      const updatedData = {
        ...prevData,
        location: locationData,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.email || 'unknown'
      };
      
      // Sync to Firebase immediately in the next tick
      setTimeout(async () => {
        try {
          const user = currentUser || getCurrentUser();
          if (user) {
            await updateUserData(user.email, updatedData);
            setSyncError(null);
          }
        } catch (error) {
          console.error('Failed to sync location to Firebase:', error);
          setSyncError(error.message);
        }
      }, 0);
      
      return updatedData;
    });
  };

  // Migration function to move calendar events to shared
  const migrateCalendarEventsToShared = async (userData, userEmail) => {
    if (!userData.calendarEvents || userData.calendarEvents.length === 0) {
      return; // No events to migrate
    }
    
    if (userData.sharedCalendarEvents && userData.sharedCalendarEvents.length > 0) {
      return; // Already migrated
    }
    
    try {
      // Convert individual events to shared events
      const sharedEvents = userData.calendarEvents.map(event => ({
        ...event,
        isShared: true,
        author: 'User',
        authorEmail: userEmail
      }));
      
      // Update user data with shared events
      await updateUserData(userEmail, {
        ...userData,
        sharedCalendarEvents: sharedEvents,
        lastUpdated: new Date().toISOString(),
        updatedBy: userEmail
      });
      
      // Update local state
      setData(prevData => ({
        ...prevData,
        sharedCalendarEvents: sharedEvents
      }));
      
      console.log('Migrated calendar events to shared system');
    } catch (error) {
      console.error('Failed to migrate calendar events:', error);
    }
  };

  // Calendar Event Functions
  const addCalendarEvent = async (eventData) => {
    if (!currentUser) return;

    // Update local data first
    setData(prevData => ({
      ...prevData,
      calendarEvents: [...(prevData.calendarEvents || []), eventData],
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.email
    }));

    // Sync to Firebase
    if (currentUser.email !== 'test@user.com' && currentUser.email !== 'test@partner.com') {
      setTimeout(async () => {
        try {
          const userData = await getUserData(currentUser.email);
          if (userData) {
            const updatedEvents = [...(userData.calendarEvents || []), eventData];
            
            await updateUserData(currentUser.email, {
              ...userData,
              calendarEvents: updatedEvents,
              lastUpdated: new Date().toISOString(),
              updatedBy: currentUser.email
            });
            setSyncError(null);
          }
        } catch (error) {
          console.error('Failed to sync calendar event to Firebase:', error);
          setSyncError(error.message);
        }
      }, 100);
    }
  };

  const updateCalendarEvent = async (eventId, updatedEventData) => {
    if (!currentUser) return;

    // Update local data first
    setData(prevData => ({
      ...prevData,
      calendarEvents: (prevData.calendarEvents || []).map(event =>
        event.id === eventId ? { ...event, ...updatedEventData } : event
      ),
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.email
    }));

    // Sync to Firebase
    if (currentUser.email !== 'test@user.com' && currentUser.email !== 'test@partner.com') {
      setTimeout(async () => {
        try {
          const userData = await getUserData(currentUser.email);
          if (userData) {
            const updatedEvents = (userData.calendarEvents || []).map(event =>
              event.id === eventId ? { ...event, ...updatedEventData } : event
            );
            
            await updateUserData(currentUser.email, {
              ...userData,
              calendarEvents: updatedEvents,
              lastUpdated: new Date().toISOString(),
              updatedBy: currentUser.email
            });
            setSyncError(null);
          }
        } catch (error) {
          console.error('Failed to sync calendar event update to Firebase:', error);
          setSyncError(error.message);
        }
      }, 100);
    }
  };

  const deleteCalendarEvent = async (eventId) => {
    if (!currentUser) return;

    // Update local data first
    setData(prevData => ({
      ...prevData,
      calendarEvents: (prevData.calendarEvents || []).filter(event => event.id !== eventId),
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.email
    }));

    // Sync to Firebase
    if (currentUser.email !== 'test@user.com' && currentUser.email !== 'test@partner.com') {
      setTimeout(async () => {
        try {
          const userData = await getUserData(currentUser.email);
          if (userData) {
            const updatedEvents = (userData.calendarEvents || []).filter(event => event.id !== eventId);
            
            await updateUserData(currentUser.email, {
              ...userData,
              calendarEvents: updatedEvents,
              lastUpdated: new Date().toISOString(),
              updatedBy: currentUser.email
            });
            setSyncError(null);
          }
        } catch (error) {
          console.error('Failed to sync calendar event deletion to Firebase:', error);
          setSyncError(error.message);
        }
      }, 100);
    }
  };

  const signInUser = async (user) => {
    // Handle test users in dev mode
    if (import.meta.env.DEV && (user.email === 'test.user@example.com' || user.email === 'test.partner@example.com')) {
      clearUserState();
      
      const testData = getTestUserData(user.email === 'test.partner@example.com' ? 'partner' : 'user');
      setCurrentUser(testData.user);
      sessionStorage.setItem('test-user', JSON.stringify(testData.user));
      
      await loadUserDataFromFirebase(user.email);
      return;
    }
    
    // Clear test user from sessionStorage for regular users
    if (import.meta.env.DEV) {
      sessionStorage.removeItem('test-user');
    }
    
    clearUserState();
    setCurrentUser(user);
    await loadUserDataFromFirebase(user.email);
  };

  const signOutUserAction = async () => {
    stopDataListeners();
    stopCleanupInterval();
    
    if (import.meta.env.DEV) {
      sessionStorage.removeItem('test-user');
    }
    
    await signOutUser();
    clearUserState();
  };

  const setupPartner = async (partnerEmail) => {
    const user = currentUser || getCurrentUser();
    if (!user) throw new Error('User not signed in');
    
    try {
      const partnerExists = await checkPartnerExists(partnerEmail);
      if (!partnerExists) {
        throw new Error('Partner email not found. Please ask them to create an account first, then try again.');
      }
      
      await connectPartner(user.email, partnerEmail);
      setPartnerEmailState(partnerEmail);
      
      try {
        const partnerData = await getPartnerData(partnerEmail);
        if (partnerData) {
          setPartnerData(partnerData);
        }
        // Restart listeners with new partner
        stopDataListeners();
        startDataListeners(user.email, partnerEmail);
      } catch (partnerError) {
        console.warn('Could not load partner data, but connection established:', partnerError);
      }
      
      await syncDataToFirebase();
    } catch (error) {
      console.error('Failed to setup partner:', error);
      throw error;
    }
  };

  // Real-time listener functions
  const startDataListeners = (userEmail, partnerEmail) => {
    stopDataListeners();
    
    // Set up user data listener
    const userListener = subscribeToUserData(userEmail, (userData) => {
      if (userData?.lastUpdated) {
        const firebaseTime = new Date(userData.lastUpdated).getTime();
        const localTime = dataRef.current.lastUpdated ? new Date(dataRef.current.lastUpdated).getTime() : 0;
        
        // Only update if Firebase data is newer
        if (firebaseTime > localTime) {
          // Clean up old messages from Firebase data
          const twentyFourHoursAgo = new Date();
          twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
          
          const recentMessages = (userData.messages || []).filter(message => {
            const messageTime = new Date(message.timestamp);
            return messageTime > twentyFourHoursAgo;
          });
          
          const updatedAppData = {
            moods: userData.moods || {},
            notes: userData.notes || [],
            sharedNotes: userData.sharedNotes || [],
            pinnedDates: userData.pinnedDates || [],
            messages: recentMessages,
            notifications: userData.notifications || [],
            photos: userData.photos || [],
            calendarEvents: userData.calendarEvents || [],
            sharedCalendarEvents: userData.sharedCalendarEvents || [],
            location: userData.location || null,
            games: userData.games || { scores: {}, history: [] },
            settings: userData.settings || initialData.settings,
            lastUpdated: userData.lastUpdated,
            updatedBy: userData.email
          };
          setData(updatedAppData);
        }
      }
    });
    setUserDataListener(userListener);
    
    // Set up partner data listener if partner exists
    if (partnerEmail) {
      const partnerListener = subscribeToPartnerData(partnerEmail, (updatedPartnerData) => {
        if (updatedPartnerData) {
          setPartnerData(updatedPartnerData);
        }
      });
      setPartnerDataListener(partnerListener);
    }
  };

  const stopDataListeners = () => {
    if (userDataListener) {
      userDataListener(); // Firebase listeners return unsubscribe function
      setUserDataListener(null);
    }
    if (partnerDataListener) {
      partnerDataListener(); // Firebase listeners return unsubscribe function
      setPartnerDataListener(null);
    }
  };

  const startCleanupInterval = () => {
    stopCleanupInterval();
    
    // Run cleanup immediately
    cleanupOldMessages();
    
    // Run cleanup every hour
    const cleanup = setInterval(() => {
      cleanupOldMessages();
    }, 60 * 60 * 1000); // 1 hour
    
    setCleanupInterval(cleanup);
  };

  const stopCleanupInterval = () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      setCleanupInterval(null);
    }
  };

  // Cleanup listeners on unmount
  useEffect(() => () => {
    stopDataListeners();
    stopCleanupInterval();
  }, []);

  const contextValue = {
    // State
    isLoading,
    syncError,
    currentUser,
    partnerEmail,
    partnerData,
    data,
    
    // Actions
    updateMood,
    addNote,
    updateNote,
    deleteNote,
    addSharedNote,
    updateSharedNote,
    deleteSharedNote,
    addSharedCalendarEvent,
    updateSharedCalendarEvent,
    deleteSharedCalendarEvent,
    addPinnedDate,
    deletePinnedDate,
    sendNotificationToPartner,
    markNotificationAsRead,
    deleteNotification,
    addPhoto,
    deletePhoto,
    addMessage,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    updateSettings,
    updateLocation,
    signInUser,
    signOutUser: signOutUserAction,
    setupPartner,
    
    // Utilities
    needsSetup: !partnerEmail,
    isSynced: !!currentUser && !syncError
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};