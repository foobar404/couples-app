import React, { useState, useEffect } from 'react';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-50 border-b border-yellow-200 p-2 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-center">
        <p className="text-yellow-800 text-sm font-medium">
          📶 You're offline. Changes will sync when you're back online.
        </p>
      </div>
    </div>
  );
};
