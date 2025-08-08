import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  initializeFirebase, 
  signInWithGoogle, 
  signOutUser, 
  onAuthStateChange,
  getCurrentUser,
  getUserData,
  updateUserData,
  getCoupleData,
  getPartnerData,
  subscribeToUserData,
  subscribeToPartnerData,
  connectPartner,
  checkPartnerExists,
  getFirebaseStatus,
  createUserEntry
} from './firebase';
import { DEV_CONFIG, getTestUserData } from './devConfig';

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
  // Simple state management with useState
  const [isLoading, setIsLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [partnerEmail, setPartnerEmailState] = useState(null);
  const [partnerData, setPartnerData] = useState(null);
  const [data, setData] = useState(initialData);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [partnerPollingInterval, setPartnerPollingInterval] = useState(null);

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Auto-sync data when it changes (every 10 seconds)
  useEffect(() => {
    if (isSynced && data.lastUpdated) {
      const timeoutId = setTimeout(() => {
        syncDataToFirebase();
      }, 10000); // Changed from 2000 to 10000 (10 seconds)
      
      return () => clearTimeout(timeoutId);
    }
  }, [data.lastUpdated, isSynced]);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Initialize Firebase
      await initializeFirebase();
      
      // Check for test user in sessionStorage (dev mode only)
      if (import.meta.env.DEV) {
        const storedTestUser = sessionStorage.getItem('test-user');
        if (storedTestUser) {
          const testUser = JSON.parse(storedTestUser);
          console.log('Restoring test user from session:', testUser.email);
          await signInUser(testUser);
          setIsLoading(false);
          return;
        }
      }
      
      // Set up auth state listener
      const unsubscribe = onAuthStateChange(async (user) => {
        if (user) {
          setCurrentUser({
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            imageUrl: user.photoURL
          });
          setIsSynced(true);
          
          // Load user data using email
          await loadUserDataFromFirebase(user.email);
        } else {
          // User signed out
          setCurrentUser(null);
          setIsSynced(false);
          setData(initialData);
          setIsLoading(false); // Ensure loading state is cleared when no user
        }
      });
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setSyncError(error.message);
      setIsLoading(false);
    }
  };

  const loadUserDataFromFirebase = async (userEmail) => {
    try {
      // Get user data from Firebase
      const userData = await getUserData(userEmail);
      
      let finalData;
      
      if (userData) {
        // Firebase data exists
        finalData = {
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
        setIsLoading(false);
        setIsSynced(true);
        setLastSync(new Date().toISOString());
        setSyncError(null);
        
        // Set partner email if exists
        if (userData.partnerEmail) {
          setPartnerEmailState(userData.partnerEmail);
          
          // Load partner data for viewing
          const partnerData = await getPartnerData(userData.partnerEmail);
          if (partnerData) {
            setPartnerData(partnerData);
          }
          
          // Set up polling for user and partner data every 10 seconds
          startDataPolling(userEmail, userData.partnerEmail);
        }
        
      } else {
        // No data - create initial data
        finalData = {
          ...initialData,
          lastUpdated: new Date().toISOString(),
          updatedBy: userEmail
        };
        
        setData(finalData);
        setIsLoading(false);
        setIsSynced(true);
        
        // Sync to Firebase
        await updateUserData(userEmail, finalData);
      }
    } catch (error) {
      console.error('Failed to load from Firebase:', error);
      setSyncError(error.message);
      setIsLoading(false);
    }
  };

  const syncDataToFirebase = async () => {
    // Use currentUser from React state instead of Firebase getCurrentUser for test users
    const user = currentUser || getCurrentUser();
    if (!user) return;
    
    try {
      const dataToSync = {
        ...data,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.email
      };
      
      // Update user's data in Firebase
      await updateUserData(user.email, dataToSync);
      
      setIsSynced(true);
      setLastSync(new Date().toISOString());
      setSyncError(null);
      
    } catch (error) {
      console.error('Failed to sync to Firebase:', error);
      setSyncError(error.message);
    }
  };

  const updateMood = async (date, mood) => {
    const newMoods = { ...data.moods };
    if (mood === null) {
      delete newMoods[date];
    } else {
      newMoods[date] = mood;
    }
    
    setData({
      ...data,
      moods: newMoods,
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser?.email || 'unknown'
    });
  };

  const addNote = async (text) => {
    const newNote = {
      id: Date.now().toString(),
      text: text,
      author: currentUser?.name || 'Unknown',
      authorEmail: currentUser?.email || 'unknown',
      timestamp: new Date().toISOString()
    };
    
    setData({
      ...data,
      notes: [...data.notes, newNote],
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser?.email || 'unknown'
    });
  };

  const addMessage = async (messageText) => {
    const newMessage = {
      id: Date.now().toString(),
      text: messageText,
      timestamp: new Date().toISOString(),
      sender: currentUser?.email || 'unknown'
    };
    
    const newData = {
      ...data,
      messages: [...data.messages, newMessage],
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser?.email || 'unknown'
    };
    
    setData(newData);
    
    // Sync to Firebase immediately
    try {
      const user = currentUser || getCurrentUser();
      if (user) {
        await updateUserData(user.email, newData);
        setIsSynced(true);
        setLastSync(new Date().toISOString());
        setSyncError(null);
      }
    } catch (error) {
      console.error('Failed to sync message to Firebase:', error);
      setSyncError(error.message);
    }
  };

  const updateSettings = async (newSettings) => {
    setData({
      ...data,
      settings: {
        ...data.settings,
        ...newSettings
      },
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser?.email || 'unknown'
    });
  };

  const updateLocation = async (locationData) => {
    const newData = {
      ...data,
      location: locationData,
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser?.email || 'unknown'
    };
    
    setData(newData);
    
    // Sync to Firebase immediately
    try {
      const user = currentUser || getCurrentUser();
      if (user) {
        await updateUserData(user.email, newData);
        setIsSynced(true);
        setLastSync(new Date().toISOString());
        setSyncError(null);
      }
    } catch (error) {
      console.error('Failed to sync location to Firebase:', error);
      setSyncError(error.message);
    }
  };

  const setPartnerEmail = async (email) => {
    setPartnerEmailState(email);
  };

  const signInUser = async (user) => {
    // Check if this is a test email in dev mode
    if (import.meta.env.DEV && (user.email === 'test.user@example.com' || user.email === 'test.partner@example.com')) {
      // Clear all state first to prevent race conditions
      setCurrentUser(null);
      setPartnerEmailState(null);
      setPartnerData(null);
      setData(initialData);
      setSyncError(null);
      
      const testData = getTestUserData(user.email === 'test.partner@example.com' ? 'partner' : 'user');
      setCurrentUser(testData.user);
      
      // Store test user in sessionStorage for persistence
      sessionStorage.setItem('test-user', JSON.stringify(testData.user));
      
      // Use normal Firebase flow for test users - no pre-populated data
      await loadUserDataFromFirebase(user.email);
      
      setLastSync(Date.now());
      setIsSynced(true);
      return;
    }
    
    // Clear test user from sessionStorage for regular users
    if (import.meta.env.DEV) {
      sessionStorage.removeItem('test-user');
    }
    
    // Clear state for regular users too
    setCurrentUser(null);
    setPartnerEmailState(null);
    setPartnerData(null);
    setData(initialData);
    setSyncError(null);
    
    setCurrentUser(user);
    setIsSynced(true);
    await loadUserDataFromFirebase(user.email);
  };

  const signOutUserAction = async () => {
    // Stop polling
    stopDataPolling();
    
    // Clear test user from sessionStorage (dev mode)
    if (import.meta.env.DEV) {
      sessionStorage.removeItem('test-user');
    }
    
    await signOutUser();
    setCurrentUser(null);
    setIsSynced(false);
    setPartnerEmailState(null);
    setPartnerData(null);
    setData(initialData); // Reset all user data to initial state
    setLastSync(null);
    setSyncError(null);
    setIsLoading(false);
  };

  const forceSync = async () => {
    // Use currentUser from React state instead of Firebase getCurrentUser for test users
    const user = currentUser || getCurrentUser();
    if (user) {
      await loadUserDataFromFirebase(user.email);
    }
  };

  const syncLocalToFirebase = async () => {
    // This function is no longer needed since we don't use localStorage
    // Just force a sync of current data
    await syncDataToFirebase();
  };

  const setupPartner = async (partnerEmail) => {
    // Use currentUser from React state instead of Firebase getCurrentUser for test users
    const user = currentUser || getCurrentUser();
    if (!user) throw new Error('User not signed in');
    
    try {
      // Check if partner exists
      const partnerExists = await checkPartnerExists(partnerEmail);
      if (!partnerExists) {
        throw new Error('Partner email not found. Please ask them to create an account first, then try again.');
      }
      
      // Connect partner to user
      await connectPartner(user.email, partnerEmail);
      setPartnerEmailState(partnerEmail);
      
      // Try to load partner data
      try {
        const partnerData = await getPartnerData(partnerEmail);
        if (partnerData) {
          setPartnerData(partnerData);
          
          // Start polling for both user and partner data
          startDataPolling(user.email, partnerEmail);
        }
      } catch (partnerError) {
        // Partner data loading failed, but connection is still valid
        console.warn('Could not load partner data, but connection established:', partnerError);
      }
      
      // Force sync current user data to Firebase
      await syncDataToFirebase();
      
    } catch (error) {
      console.error('Failed to setup partner:', error);
      throw error;
    }
  };

  const signInTestUser = async (testUser) => {
    if (!DEV_CONFIG.IS_DEV) {
      console.warn('Test sign-in is only available in development mode');
      return;
    }

    try {
      setCurrentUser(testUser);
      setIsLoading(false);
      setIsSynced(true);
      setLastSync(new Date().toISOString());
      setSyncError(null);

      // Load test data for this user
      const testData = getTestUserData(testUser.email);
      if (testData) {
        setData(testData);
        
        // Set partner data if available
        if (testData.partnerEmail) {
          setPartnerEmailState(testData.partnerEmail);
          const partnerTestData = getTestUserData(testData.partnerEmail);
          if (partnerTestData) {
            setPartnerData(partnerTestData);
          }
        }
      }
    } catch (error) {
      console.error('Test sign-in failed:', error);
      setSyncError(error.message);
    }
  };

  // Polling functions for 10-second updates
  const startDataPolling = (userEmail, partnerEmail) => {
    // Clear existing intervals
    stopDataPolling();
    
    // Poll user data every 10 seconds
    const userPolling = setInterval(async () => {
      try {
        const userData = await getUserData(userEmail);
        if (userData && userData.lastUpdated !== data.lastUpdated) {
          const updatedAppData = {
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
          setData(updatedAppData);
        }
      } catch (error) {
        console.error('Error polling user data:', error);
      }
    }, 10000);
    
    setPollingInterval(userPolling);
    
    // Poll partner data every 10 seconds if partner exists
    if (partnerEmail) {
      const partnerPolling = setInterval(async () => {
        try {
          const updatedPartnerData = await getPartnerData(partnerEmail);
          if (updatedPartnerData) {
            setPartnerData(updatedPartnerData);
          }
        } catch (error) {
          console.error('Error polling partner data:', error);
        }
      }, 10000);
      
      setPartnerPollingInterval(partnerPolling);
    }
  };

  const stopDataPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    if (partnerPollingInterval) {
      clearInterval(partnerPollingInterval);
      setPartnerPollingInterval(null);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopDataPolling();
    };
  }, []);

  const contextValue = {
    // State
    isLoading,
    isSynced,
    lastSync,
    syncError,
    currentUser,
    partnerEmail,
    partnerData,
    data,
    
    // Actions
    updateMood,
    addNote,
    addMessage,
    updateSettings,
    updateLocation,
    setPartnerEmail,
    signInUser,
    signInTestUser,
    signOutUser: signOutUserAction,
    forceSync,
    syncLocalToFirebase,
    setupPartner,
    
    // Utilities
    needsSetup: !partnerEmail
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
