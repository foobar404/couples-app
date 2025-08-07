import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/UI';
import { PWAPrompt } from './components/PWAPrompt';
import { UpdateNotification } from './components/UpdateNotification';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Dashboard } from './pages/Dashboard';
import { MoodPage } from './pages/MoodPage';
import { NotesPage } from './pages/NotesPage';
import { GamesPage } from './pages/GamesPage';
import { SettingsPage } from './pages/SettingsPage';
import { useNavigation } from './utils/hooks';
import { useApp } from './utils/AppContext';
import { signInWithGoogle, signOutUser } from './utils/firebase';

function AppContent() {
  const { 
    currentUser, 
    isLoading, 
    lastSync, 
    syncError, 
    needsSetup,
    partnerEmail,
    data,
    updateSettings,
    signInUser,
    signOutUser: signOutUserAction,
    setupPartner
  } = useApp();

  // Redirect to settings if user is not signed in
  useEffect(() => {
    if (!isLoading && !currentUser) {
      // This will be handled by the router navigation
    }
  }, [isLoading, currentUser]);

  const handleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      const userInfo = {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        imageUrl: user.photoURL
      };
      await signInUser(userInfo);
    } catch (error) {
      console.error('Sign in failed:', error);
      alert('Sign in failed: ' + error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUserAction();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handlePartnerSetup = async (email) => {
    try {
      await setupPartner(email);
      // Success is handled by the SettingsPage component
    } catch (error) {
      // Re-throw the error to be handled by the SettingsPage component
      throw error;
    }
  };

  const handleDisplayNameUpdate = async (displayName) => {
    try {
      await updateSettings({
        displayName: displayName
      });
    } catch (error) {
      console.error('Display name update failed:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your couples app...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PWA Components */}
      <OfflineIndicator />
      <UpdateNotification />
      
      {/* Sync Error Banner */}
      {syncError && (
        <div className="bg-red-50 border-b border-red-200 p-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-red-700 text-sm">
              ⚠️ Sync error: {syncError}
            </p>
            <button 
              className="text-red-700 hover:text-red-900 text-sm underline"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pb-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mood" element={<MoodPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route 
            path="/settings" 
            element={
              <SettingsPage
                onSignIn={handleSignIn}
                onSignOut={handleSignOut}
                isUserSignedIn={!!currentUser}
                currentUser={currentUser}
                onSetPartnerEmail={handlePartnerSetup}
                partnerEmail={partnerEmail}
                syncStatus={{ lastSync }}
                onUpdateDisplayName={handleDisplayNameUpdate}
                currentDisplayName={data.settings?.displayName}
              />
            } 
          />
          {/* Redirect to settings if user is not signed in */}
          {!currentUser && <Route path="*" element={<Navigate to="/settings" replace />} />}
          {/* Redirect any unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Bottom Navigation */}
      <NavigationWrapper />
      
      {/* PWA Install Prompt */}
      <PWAPrompt />
    </div>
  );
}

function NavigationWrapper() {
  const { activeTab, setActiveTab, tabs } = useNavigation();
  return <Navigation activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />;
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
