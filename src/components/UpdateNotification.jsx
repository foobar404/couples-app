import React, { useState, useEffect } from 'react';
import { Button } from './UI';

export const UpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          setRegistration(reg);
          
          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available
                  setShowUpdate(true);
                }
              });
            }
          });

          // Listen for controlling service worker changes
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Refresh the page to load new content
            window.location.reload();
          });
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdate(false);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 left-4 right-4 bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">Update Available! 🎉</h3>
          <p className="text-sm text-blue-700">
            A new version of Couples Connect is ready. Update now to get the latest features!
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button variant="secondary" size="small" onClick={handleDismiss}>
            Later
          </Button>
          <Button variant="primary" size="small" onClick={handleUpdate}>
            Update
          </Button>
        </div>
      </div>
    </div>
  );
};
