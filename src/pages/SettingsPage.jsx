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
    <div className="page p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">⚙️ Settings</h1>
      
      {!isUserSignedIn ? (
        /* Sign In Section */
        <div className="card mb-6">
          <div className="card__header">
            <h3 className="card__title">Sign In Required</h3>
          </div>
          <div className="card__body text-center">
            <p className="text-gray-600 mb-4">
              Sign in to sync your data and connect with your partner
            </p>
            
            <button className="btn btn--primary mb-4" onClick={() => onSignIn()}>
              Sign In with Google
            </button>
            
            {/* Dev Mode Test Users */}
            {import.meta.env.DEV && (
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button 
                  onClick={() => onSignIn('test.user@example.com')}
                  className="btn btn--secondary btn--small flex-1 sm:flex-none"
                >
                  Test User 1
                </button>
                <button 
                  onClick={() => onSignIn('test.partner@example.com')}
                  className="btn btn--secondary btn--small flex-1 sm:flex-none"
                >
                  Test User 2
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* You Section */}
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">👤 You</h3>
            </div>
            <div className="card__body">
              {/* Profile Info */}
              <div className="flex items-center space-x-4 mb-6">
                {currentUser.imageUrl && (
                  <img 
                    src={currentUser.imageUrl} 
                    alt="" 
                    className="w-16 h-16 rounded-full border-2 border-pink-200"
                  />
                )}
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {currentUser.name || 'Anonymous User'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              
              {/* Sign Out */}
              <div className="pt-4 border-t border-gray-200">
                <button className="btn btn--secondary w-full" onClick={onSignOut}>
                  Sign Out
                </button>
                {syncStatus.lastSync && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Last synced: {new Date(syncStatus.lastSync).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Partner Section */}
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">💕 Partner</h3>
            </div>
            <div className="card__body">
              {partnerEmail ? (
                <>
                  {/* Connected Partner Info */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-pink-100 border-2 border-pink-200 flex items-center justify-center">
                      <span className="text-2xl">💕</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {currentDisplayName || 'Partner'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {partnerEmail}
                      </p>
                    </div>
                  </div>
                  
                  {/* Connection Status */}
                  <div className="mb-6">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-green-700">✅ Connected & Syncing</span>
                    </div>
                  </div>
                  
                  {/* Nickname for Partner */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💕 Your Nickname for Them
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="e.g., Honey Bear, Sunshine..."
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
                        className="btn btn--primary w-full sm:w-auto"
                      >
                        {isUpdatingName ? '...' : 'Save'}
                      </button>
                    </div>
                    
                    {nameUpdateSuccess && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                        <span className="text-green-700">✅ Nickname updated!</span>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">
                      What you'll call them in the app
                    </p>
                  </div>
                  
                  {/* Change Partner */}
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Change Partner Email
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        placeholder="new-partner@example.com"
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
                        className="btn btn--primary w-full sm:w-auto"
                      >
                        {isConnecting ? '...' : 'Update'}
                      </button>
                    </div>
                    
                    {connectionError && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                        <span className="text-red-700">❌ {connectionError}</span>
                      </div>
                    )}

                    {connectionSuccess && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                        <span className="text-green-700">✅ Partner updated!</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* No Partner Connected */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                      <span className="text-2xl">❓</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">
                        No Partner Connected
                      </h4>
                      <p className="text-sm text-gray-600">
                        Connect with your partner to share data
                      </p>
                    </div>
                  </div>
                  
                  {/* Nickname for Future Partner */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💕 Nickname for Your Partner
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="e.g., Honey Bear, Sunshine..."
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
                        className="btn btn--primary w-full sm:w-auto"
                      >
                        {isUpdatingName ? '...' : 'Save'}
                      </button>
                    </div>
                    
                    {nameUpdateSuccess && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                        <span className="text-green-700">✅ Nickname updated!</span>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">
                      Set this now or after connecting
                    </p>
                  </div>
                  
                  {/* Connect Partner */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Partner's Email Address
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
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
                        className="btn btn--primary w-full sm:w-auto"
                      >
                        {isConnecting ? '...' : 'Connect'}
                      </button>
                    </div>
                    
                    {connectionError && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                        <span className="text-red-700">❌ {connectionError}</span>
                      </div>
                    )}

                    {connectionSuccess && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                        <span className="text-green-700">✅ Partner connected!</span>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">
                      They must have an account first
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
