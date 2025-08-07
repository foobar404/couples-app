// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, set, get, onValue, push, update } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCBhLO-ZVMkQgehFAMKnQTf_JWeabqN_LQ",
    authDomain: "couples-app-fa2b0.firebaseapp.com",
    databaseURL: "https://couples-app-fa2b0-default-rtdb.firebaseio.com",
    projectId: "couples-app-fa2b0",
    storageBucket: "couples-app-fa2b0.firebasestorage.app",
    messagingSenderId: "621211994658",
    appId: "1:621211994658:web:bc749f52fa3fce68f6d87b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Add scopes for additional user info
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Initialize Firebase services
let isInitialized = false;

export const initializeFirebase = async () => {
    if (isInitialized) return true;

    try {
        // Firebase is already initialized above
        isInitialized = true;
        return true;
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        return false;
    }
};

// Authentication functions
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Create user entry in realtime database if it doesn't exist
        await createUserEntry(user);

        return user;
    } catch (error) {
        console.error('Sign in failed:', error);
        throw error;
    }
};

export const signOutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Sign out failed:', error);
        throw error;
    }
};

// Check if user is signed in
export const isSignedIn = () => {
    return !!auth.currentUser;
};

// Get current user
export const getCurrentUser = () => {
    return auth.currentUser;
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// Helper function to create safe email key for database
const createEmailKey = (email) => {
    return email.replace(/[.#$[\]]/g, '_');
};

// Realtime Database functions
export const createUserEntry = async (user) => {
    if (!user) return;

    const emailKey = createEmailKey(user.email);
    const userRef = ref(database, `users/${emailKey}`);

    try {
        // Check if user already exists
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            const { displayName, email, photoURL, uid } = user;
            const userData = {
                displayName,
                email,
                photoURL,
                uid,
                createdAt: new Date().toISOString(),
                settings: {
                    dashboardWidgets: ['mood', 'notes']
                },
                partnerEmail: null,
                connectedAt: null,
                moods: {},
                notes: [],
                sharedTasks: [],
                photos: [],
                games: {
                    scores: {},
                    history: []
                },
                lastSeen: new Date().toISOString()
            };

            await set(userRef, userData);
        }
    } catch (error) {
        console.error('Error creating user entry:', error);
    }
};

// Get user data by email
export const getUserData = async (email) => {
    try {
        const emailKey = createEmailKey(email);
        const userRef = ref(database, `users/${emailKey}`);
        const snapshot = await get(userRef);
        const userData = snapshot.exists() ? snapshot.val() : null;
        return userData;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
};

// Update user data
export const updateUserData = async (email, data) => {
    try {
        const emailKey = createEmailKey(email);
        const userRef = ref(database, `users/${emailKey}`);
        const updates = {
            ...data,
            lastUpdated: new Date().toISOString()
        };
        await update(userRef, updates);
        return true;
    } catch (error) {
        console.error('Error updating user data:', error);
        throw error;
    }
};

// Get partner's data by email
export const getPartnerData = async (partnerEmail) => {
    try {
        return await getUserData(partnerEmail);
    } catch (error) {
        console.error('Error getting partner data:', error);
        return null;
    }
};

// Get both user and partner data
export const getCoupleData = async (userEmail, partnerEmail) => {
    try {
        const [userData, partnerData] = await Promise.all([
            getUserData(userEmail),
            getUserData(partnerEmail)
        ]);

        return {
            user: userData,
            partner: partnerData
        };
    } catch (error) {
        console.error('Error getting couple data:', error);
        return null;
    }
};

// Real-time listeners
export const subscribeToPartnerData = (partnerEmail, callback) => {
    const emailKey = createEmailKey(partnerEmail);
    const userRef = ref(database, `users/${emailKey}`);
    return onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        }
    });
};

export const subscribeToUserData = (email, callback) => {
    const emailKey = createEmailKey(email);
    const userRef = ref(database, `users/${emailKey}`);
    return onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        }
    });
};

// Set up partner connection
export const connectPartner = async (userEmail, partnerEmail) => {
    try {
        // Update user's partner info
        await updateUserData(userEmail, {
            partnerEmail,
            connectedAt: new Date().toISOString()
        });

        return true;
    } catch (error) {
        console.error('Error connecting partner:', error);
        throw error;
    }
};

// Check if partner exists and get their info
export const checkPartnerExists = async (partnerEmail) => {
    try {
        const partnerData = await getUserData(partnerEmail);
        return !!partnerData;
    } catch (error) {
        return false;
    }
};

// Get Firebase status
export const getFirebaseStatus = () => {
    return {
        isInitialized,
        isSignedIn: isSignedIn(),
        currentUser: getCurrentUser(),
        hasAuth: !!auth,
        hasDatabase: !!database
    };
};
