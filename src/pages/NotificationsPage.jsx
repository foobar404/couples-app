import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../utils/AppContext';

export const NotificationsPage = () => {
  const { needsSetup, currentUser } = useApp();
  const navigate = useNavigate();
  
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSendNotification = async (notification) => {
    if (!notification.title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    if (!notification.message.trim()) {
      alert('Please enter a message');
      return;
    }

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
        const notif = new Notification(notification.title, {
          body: notification.message,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'couples-app-notification',
          requireInteraction: true,
          actions: [
            { action: 'reply', title: '💕 Reply' },
            { action: 'dismiss', title: 'Dismiss' }
          ]
        });

        // Handle notification clicks
        notif.onclick = () => {
          window.focus();
          notif.close();
        };

        setSuccessMessage('Notification sent! 💕');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Reset form after successful send
        setNewNotification({
          title: '',
          message: ''
        });
      } else {
        alert('Notification permission denied. Please enable notifications in your browser settings.');
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="page p-4 max-w-4xl mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6 text-center">🔔 Notifications</h1>

      {/* Setup Prompt */}
      {needsSetup && currentUser && (
        <div className="card mb-6 bg-blue-50 border-blue-200">
          <div className="card__body">
            <div className="text-center">
              <h3 className="font-semibold text-blue-900 mb-2">👫 Connect with your partner</h3>
              <p className="text-blue-700 text-sm mb-4">
                Set up your partner's email in settings to start sending notifications
              </p>
              <button 
                onClick={() => navigate('/settings')}
                className="btn btn--primary btn--small"
              >
                Go to Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="card mb-6 bg-green-50 border-green-200">
          <div className="card__body text-center">
            <p className="text-green-700 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Send Notification */}
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">✨ Send Notification</h3>
        </div>
        <div className="card__body">
          {/* Title Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Title
            </label>
            <input
              type="text"
              value={newNotification.title}
              onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
              placeholder="e.g., Good Morning, Love You, etc..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              maxLength={50}
            />
            <div className="text-xs text-gray-500 mt-1">
              {newNotification.title.length}/50 characters
            </div>
          </div>

          {/* Message Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sweet Message
            </label>
            <textarea
              value={newNotification.message}
              onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
              placeholder="Write a sweet message for your partner..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              maxLength={120}
            />
            <div className="text-xs text-gray-500 mt-1">
              {newNotification.message.length}/120 characters
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={() => handleSendNotification(newNotification)}
            disabled={!newNotification.title.trim() || !newNotification.message.trim() || isSending}
            className="w-full sm:w-auto px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSending ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Sending...
              </span>
            ) : (
              '🔔 Send Notification'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
