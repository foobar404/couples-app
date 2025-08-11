import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../utils/AppContext';

export const NotificationsPage = () => {
  const { needsSetup, currentUser, data, sendNotificationToPartner, markNotificationAsRead, deleteNotification } = useApp();
  const navigate = useNavigate();
  
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Get received notifications (sorted by newest first)
  const receivedNotifications = (data.notifications || []).sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  const handleSendNotification = async (notification) => {
    if (!notification.title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    if (!notification.message.trim()) {
      alert('Please enter a message');
      return;
    }

    setIsSending(true);

    try {
      await sendNotificationToPartner(notification.title, notification.message);
      
      setSuccessMessage('Notification sent to your partner! 💕');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reset form after successful send
      setNewNotification({
        title: '',
        message: ''
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'yesterday';
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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

      {/* Received Notifications */}
      {receivedNotifications.length > 0 && (
        <div className="card mb-6">
          <div className="card__header">
            <h3 className="card__title">💕 Messages from your partner</h3>
          </div>
          <div className="card__body">
            <div className="space-y-3">
              {receivedNotifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`p-4 rounded-lg border ${
                    notification.read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-pink-50 border-pink-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold mb-1 ${
                        notification.read ? 'text-gray-900' : 'text-pink-900'
                      }`}>
                        {notification.title}
                      </h4>
                      <p className={`text-sm mb-2 ${
                        notification.read ? 'text-gray-700' : 'text-pink-800'
                      }`}>
                        {notification.message}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatDate(notification.timestamp)}
                      </span>
                    </div>
                    <div className="flex gap-1 ml-3">
                      {!notification.read && (
                        <button
                          onClick={() => markNotificationAsRead(notification.id)}
                          className="text-xs px-2 py-1 bg-pink-100 text-pink-700 rounded hover:bg-pink-200"
                          title="Mark as read"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Send Notification */}
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">✨ Send Message to Partner</h3>
        </div>
        <div className="card__body">
          {/* Title Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Title
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
            disabled={!newNotification.title.trim() || !newNotification.message.trim() || isSending || needsSetup}
            className="w-full sm:w-auto px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSending ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Sending...
              </span>
            ) : (
              '� Send Message to Partner'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
