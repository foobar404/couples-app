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
  checkPartnerExists
} from './firebase';
import { getTestUserData } from './devConfig';

// Initial data structure
const initialData = {
  moods: {},
  notes: [],
  messages: [],
  sharedTasks: [],
  photos: [],
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
  const [pollingInterval, setPollingInterval] = useState(null);
  const [cleanupInterval, setCleanupInterval] = useState(null);
  
  // Use ref to always have current data in polling
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
    stopDataPolling();
    stopCleanupInterval();
  };

  const loadUserDataFromFirebase = async (userEmail) => {
    try {
      const userData = await getUserData(userEmail);
      
      if (userData) {
        const finalData = {
          moods: userData.moods || {},
          notes: userData.notes || [],
          messages: userData.messages || [],
          sharedTasks: userData.sharedTasks || [],
          photos: userData.photos || [],
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
          startDataPolling(userEmail, userData.partnerEmail);
        }
        
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
      // Update ref immediately so polling has access to latest data
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

  const updateNote = async (noteId, updates) => {
    const updatedNotes = data.notes.map(note => 
      note.id === noteId 
        ? { ...note, ...updates, lastModified: new Date().toISOString() }
        : note
    );
    updateData({ notes: updatedNotes });
  };

  const deleteNote = async (noteId) => {
    const filteredNotes = data.notes.filter(note => note.id !== noteId);
    updateData({ notes: filteredNotes });
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
    stopDataPolling();
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
          startDataPolling(user.email, partnerEmail);
        }
      } catch (partnerError) {
        console.warn('Could not load partner data, but connection established:', partnerError);
      }
      
      await syncDataToFirebase();
    } catch (error) {
      console.error('Failed to setup partner:', error);
      throw error;
    }
  };

  // Simplified polling functions
  const startDataPolling = (userEmail, partnerEmail) => {
    stopDataPolling();
    
    const polling = setInterval(async () => {
      try {
        // Poll user data
        const userData = await getUserData(userEmail);
        if (userData?.lastUpdated) {
          const firebaseTime = new Date(userData.lastUpdated).getTime();
          const localTime = dataRef.current.lastUpdated ? new Date(dataRef.current.lastUpdated).getTime() : 0;
          
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
              messages: recentMessages,
              sharedTasks: userData.sharedTasks || [],
              photos: userData.photos || [],
              location: userData.location || null,
              games: userData.games || { scores: {}, history: [] },
              settings: userData.settings || initialData.settings,
              lastUpdated: userData.lastUpdated,
              updatedBy: userData.email
            };
            setData(updatedAppData);
          }
        }
        
        // Poll partner data if exists
        if (partnerEmail) {
          const updatedPartnerData = await getPartnerData(partnerEmail);
          if (updatedPartnerData && (!partnerData || updatedPartnerData.lastUpdated !== partnerData.lastUpdated)) {
            setPartnerData(updatedPartnerData);
          }
        }
      } catch (error) {
        console.error('Error polling data:', error);
      }
    }, 2000);
    
    setPollingInterval(polling);
  };

  const stopDataPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
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

  // Cleanup polling on unmount
  useEffect(() => () => {
    stopDataPolling();
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
    addMessage,
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