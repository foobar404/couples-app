import React, { useState } from 'react';

export const SettingsPage = ({ onSignIn, onSignOut, isUserSignedIn, currentUser, onSetPartnerEmail, partnerEmail, syncStatus, onUpdateDisplayName, currentDisplayName }) => {
  const [partnerEmailInput, setPartnerEmailInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(currentDisplayName || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameUpdateSuccess, setNameUpdateSuccess] = useState(false);

  const handlePartnerSubmit = async () => {
    if (!partnerEmailInput.trim()) {
      setConnectionError('Please enter a valid email address');
      return;
    }

    if (!partnerEmailInput.includes('@')) {
      setConnectionError('Please enter a valid email address');
      return;
    }

    setIsConnecting(true);
    setConnectionError('');
    setConnectionSuccess(false);

    try {
      await onSetPartnerEmail(partnerEmailInput.trim());
      setConnectionSuccess(true);
      setPartnerEmailInput('');
    } catch (error) {
      setConnectionError(error.message || 'Failed to connect partner');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisplayNameUpdate = async () => {
    if (!displayNameInput.trim()) {
      return;
    }

    setIsUpdatingName(true);
    setNameUpdateSuccess(false);

    try {
      await onUpdateDisplayName(displayNameInput.trim());
      setNameUpdateSuccess(true);
      setTimeout(() => setNameUpdateSuccess(false), 3000); // Clear success message after 3 seconds
    } catch (error) {
      console.error('Failed to update display name:', error);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const clearMessages = () => {
    setConnectionError('');
    setConnectionSuccess(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">⚙️ Settings</h1>
      
      {/* User Profile Section */}
      {isUserSignedIn && currentUser && (
        <div className="card mb-6">
          <div className="card__header">
            <h3 className="card__title">Profile</h3>
          </div>
          <div className="card__body">
            <div className="flex items-center space-x-4 mb-4">
              {currentUser.imageUrl && (
                <img 
                  src={currentUser.imageUrl} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full border-2 border-pink-200"
                />
              )}
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900">
                  {currentDisplayName || currentUser.name || 'Anonymous User'}
                </h4>
                <p className="text-sm text-gray-600">
                  {currentUser.email}
                </p>
              </div>
            </div>
            
            {/* Display Name Editor */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💕 Cute Name (what your partner sees)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., Honey Bear, Sunshine, etc."
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleDisplayNameUpdate()}
                  className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  disabled={isUpdatingName}
                  maxLength={30}
                />
                <button 
                  onClick={handleDisplayNameUpdate}
                  disabled={isUpdatingName || !displayNameInput.trim() || displayNameInput.trim() === currentDisplayName}
                  className="btn btn--primary px-6"
                >
                  {isUpdatingName ? 'Saving...' : 'Save'}
                </button>
              </div>
              
              {nameUpdateSuccess && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <span className="text-green-700">✅ Display name updated!</span>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                This is the name your partner will see throughout the app
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Firebase Sync Section */}
      <div className="card mb-6">
        <div className="card__header">
          <h3 className="card__title">Firebase Sync</h3>
        </div>
        <div className="card__body">
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              Sign in to sync your data across devices and share with your partner
            </p>
            
            {isUserSignedIn ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700">✓ Connected</span>
                  <button className="btn btn--secondary" onClick={onSignOut}>
                    Sign Out
                  </button>
                </div>
                
                {syncStatus.lastSync && (
                  <p className="text-sm text-gray-600">
                    Last synced: {new Date(syncStatus.lastSync).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <button className="btn btn--primary" onClick={onSignIn}>
                Sign In with Google
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Partner Setup Section */}
      {isUserSignedIn && (
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Partner Connection</h3>
          </div>
          <div className="card__body">
            <p className="text-gray-600 mb-4">
              Enter your partner's email to set up shared data. They must have an account first.
            </p>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="partner@example.com"
                  value={partnerEmailInput}
                  onChange={(e) => {
                    setPartnerEmailInput(e.target.value);
                    clearMessages();
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handlePartnerSubmit()}
                  className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  disabled={isConnecting}
                />
                <button 
                  onClick={handlePartnerSubmit}
                  disabled={isConnecting || !partnerEmailInput.trim()}
                  className="btn btn--primary px-6"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              </div>

              {connectionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-red-700">❌ {connectionError}</span>
                </div>
              )}

              {connectionSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-green-700">✅ Partner connected successfully!</span>
                </div>
              )}
              
              {partnerEmail && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-blue-700">💕 Currently connected to: {partnerEmail}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
