import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../utils/AppContext';

export const NotificationsWidget = () => {
  const { data, needsSetup, updateSettings } = useApp();
  const navigate = useNavigate();
  const [isSending, setIsSending] = useState(false);

  // Get saved notifications
  const notifications = data.settings?.savedNotifications || [];
  const recentNotifications = notifications.slice(-3).reverse(); // Show 3 most recent

  // Quick notification messages
  const quickNotifications = [
    { message: 'Just wanted to remind you how much I love you! 💕' },
    { message: 'Thinking of you right now... missing your smile 😘' },
    { message: 'Want to grab coffee together? My treat! ☕' }
  ];

  const handleQuickSend = async (notification) => {
    if (!('Notification' in window)) {
      alert('This browser doesn\'t support notifications');
      return;
    }

    setIsSending(true);

    try {
      // Request permission if not granted
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        // Create the notification
        const notif = new Notification('💕 Sweet Message', {
          body: notification.message,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'couples-app-notification',
          requireInteraction: true
        });

        // Handle notification clicks
        notif.onclick = () => {
          window.focus();
          notif.close();
        };

        // Show success briefly
        setTimeout(() => setIsSending(false), 1500);
      } else {
        alert('Notification permission denied. Please enable notifications in your browser settings.');
        setIsSending(false);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification. Please try again.');
      setIsSending(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="widget">
      <div className="widget__header">
        <h3 className="widget__title">🔔 Notifications</h3>
        <button 
          onClick={() => navigate('/notifications')}
          className="widget__action"
          aria-label="Go to notifications page"
        >
          <span className="text-sm">View All</span>
        </button>
      </div>

      <div className="widget__content">
        {needsSetup ? (
          <div className="text-center py-6">
            <div className="text-2xl mb-3">👫</div>
            <p className="text-sm text-gray-600 mb-3">
              Connect with your partner to send notifications
            </p>
            <button 
              onClick={() => navigate('/settings')}
              className="btn btn--primary btn--small"
            >
              Set Up Partner
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Send Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">💨 Quick Send</h4>
              <div className="space-y-2">
                {quickNotifications.map((notification, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSend(notification)}
                    disabled={isSending}
                    className="w-full text-left p-3 bg-pink-50 hover:bg-pink-100 rounded-lg border border-pink-200 transition-colors disabled:opacity-50"
                  >
                    <div className="text-sm text-pink-900">{notification.message}</div>
                  </button>
                ))}
              </div>

              {isSending && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <div className="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                    Notification sent! 💕
                  </div>
                </div>
              )}
            </div>

            {/* Saved Notifications */}
            {recentNotifications.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">📋 Saved ({notifications.length})</h4>
                <div className="space-y-2">
                  {recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 truncate">
                            {notification.message}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Created {formatDate(notification.createdAt)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleQuickSend(notification)}
                          disabled={isSending}
                          className="ml-3 px-2 py-1 bg-pink-500 text-white text-xs rounded hover:bg-pink-600 disabled:opacity-50 transition-colors"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Button */}
            <button
              onClick={() => navigate('/notifications')}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-pink-300 hover:text-pink-600 transition-colors"
            >
              <div className="text-center">
                <div className="text-lg mb-1">➕</div>
                <div className="text-sm font-medium">Create New Notification</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
