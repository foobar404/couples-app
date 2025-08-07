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

// Initial data structure
const initialData = {
  moods: {},
  notes: [],
  sharedTasks: [],
  photos: [],
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

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Auto-sync data when it changes (debounced)
  useEffect(() => {
    if (isSynced && data.lastUpdated) {
      const timeoutId = setTimeout(() => {
        syncDataToFirebase();
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [data.lastUpdated, isSynced]);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Initialize Firebase
      await initializeFirebase();
      
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
          // User signed out, load from local storage
          setCurrentUser(null);
          setIsSynced(false);
          loadDataFromLocal();
        }
      });
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setSyncError(error.message);
      loadDataFromLocal();
    }
  };

  const loadUserDataFromFirebase = async (userEmail) => {
    try {
      // Get user data from Firebase
      const userData = await getUserData(userEmail);
      
      // Get local data for comparison
      const localData = getLocalData();
      
      let finalData;
      
      if (userData) {
        // Firebase data exists
        const firebaseAppData = {
          moods: userData.moods || {},
          notes: userData.notes || [],
          sharedTasks: userData.sharedTasks || [],
          photos: userData.photos || [],
          games: userData.games || { scores: {}, history: [] },
          settings: userData.settings || initialData.settings,
          lastUpdated: userData.lastUpdated,
          updatedBy: userData.email
        };
        
        // Compare timestamps to determine which data is newer
        if (localData && localData.lastUpdated && userData.lastUpdated) {
          const localTime = new Date(localData.lastUpdated).getTime();
          const firebaseTime = new Date(userData.lastUpdated).getTime();
          
          if (localTime > firebaseTime) {
            finalData = localData;
            await updateUserData(userEmail, localData);
          } else {
            finalData = firebaseAppData;
          }
        } else if (localData && !userData.lastUpdated) {
          finalData = localData;
          await updateUserData(userEmail, localData);
        } else {
          finalData = firebaseAppData;
        }
        
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
          
          // Set up real-time listeners
          subscribeToUserData(userEmail, (updatedUserData) => {
            const updatedAppData = {
              moods: updatedUserData.moods || {},
              notes: updatedUserData.notes || [],
              sharedTasks: updatedUserData.sharedTasks || [],
              photos: updatedUserData.photos || [],
              games: updatedUserData.games || { scores: {}, history: [] },
              settings: updatedUserData.settings || initialData.settings,
              lastUpdated: updatedUserData.lastUpdated,
              updatedBy: updatedUserData.email
            };
            setData(updatedAppData);
            localStorage.setItem('couples-app-data', JSON.stringify(updatedAppData));
          });
          
          subscribeToPartnerData(userData.partnerEmail, (updatedPartnerData) => {
            setPartnerData(updatedPartnerData);
          });
        }
        
        // Save final data to local storage
        localStorage.setItem('couples-app-data', JSON.stringify(finalData));
        
      } else if (localData) {
        // No Firebase data but local data exists
        finalData = localData;
        await updateUserData(userEmail, localData);
        setData(finalData);
        setIsLoading(false);
        setIsSynced(true);
        
      } else {
        // No data anywhere - create initial data
        const newInitialData = {
          ...initialData,
          lastUpdated: new Date().toISOString(),
          updatedBy: userEmail
        };
        
        setData(newInitialData);
        setIsLoading(false);
        setIsSynced(true);
        
        // Sync to Firebase
        await updateUserData(userEmail, newInitialData);
        localStorage.setItem('couples-app-data', JSON.stringify(newInitialData));
      }
    } catch (error) {
      console.error('Failed to load from Firebase:', error);
      setSyncError(error.message);
      loadDataFromLocal();
    }
  };

  const getLocalData = () => {
    try {
      const localData = localStorage.getItem('couples-app-data');
      return localData ? JSON.parse(localData) : null;
    } catch (error) {
      console.error('Failed to parse local storage data:', error);
      return null;
    }
  };

  const loadDataFromLocal = () => {
    try {
      const localData = getLocalData();
      if (localData) {
        setData(localData);
        setIsLoading(false);
        setIsSynced(true);
        setLastSync(new Date().toISOString());
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to load from local storage:', error);
      setIsLoading(false);
    }
  };

  const syncDataToFirebase = async () => {
    const user = getCurrentUser();
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
      
      // Update localStorage with the same data
      localStorage.setItem('couples-app-data', JSON.stringify(dataToSync));
      
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

  const setPartnerEmail = async (email) => {
    setPartnerEmailState(email);
  };

  const signInUser = async (user) => {
    setCurrentUser(user);
    setIsSynced(true);
    await loadUserDataFromFirebase(user.email);
  };

  const signOutUserAction = async () => {
    await signOutUser();
    setCurrentUser(null);
    setIsSynced(false);
    setPartnerEmailState(null);
    setPartnerData(null);
  };

  const forceSync = async () => {
    const user = getCurrentUser();
    if (user) {
      await loadUserDataFromFirebase(user.email);
    }
  };

  const syncLocalToFirebase = async () => {
    const user = getCurrentUser();
    if (!user) return;
    
    const localData = getLocalData();
    if (localData) {
      await updateUserData(user.email, {
        ...localData,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.email
      });
      await forceSync(); // Reload to ensure consistency
    }
  };

  const setupPartner = async (partnerEmail) => {
    const user = getCurrentUser();
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
          
          // Set up real-time listener for partner data
          subscribeToPartnerData(partnerEmail, (updatedPartnerData) => {
            if (updatedPartnerData) {
              setPartnerData(updatedPartnerData);
            }
          });
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
    updateSettings,
    setPartnerEmail,
    signInUser,
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
