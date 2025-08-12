import React from 'react';
import { Widget } from '../UI';
import { useApp } from '../../utils/AppContext';

export const MessengerWidget = () => {
  const { data, partnerData, currentUser } = useApp();

  // Get display name for partner
  const partnerDisplayName = data.settings?.displayName || 'Partner';
  
  // Get all messages (user and partner combined) and get the 4 most recent
  const userMessages = data.messages || [];
  const partnerMessages = partnerData?.messages || [];
  
  // Combine and sort all messages, then take the 4 most recent
  const recentMessages = [...userMessages, ...partnerMessages]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 4)
    .reverse(); // Reverse to show chronologically

  const formatMessageTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffHours = Math.floor((now - messageTime) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor((now - messageTime) / (1000 * 60));
      return diffMinutes < 1 ? 'Just now' : `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return messageTime.toLocaleDateString();
    }
  };

  const isFromCurrentUser = (message) => {
    return message.sender === currentUser?.email;
  };

  // Check if a message text is an image URL
  const isImageUrl = (text) => {
    const trimmedText = text.trim();
    
    // Check for data URI images (base64 encoded images)
    const dataUriPattern = /^data:image\/.+;base64,/i;
    if (dataUriPattern.test(trimmedText)) {
      return true;
    }
    
    // Check for direct image URLs with extensions
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)($|\?)/i;
    const urlPattern = /^https?:\/\/.+/i;
    
    // Check for common image hosting patterns
    const imageHostPatterns = [
      /imgur\.com/i,
      /i\.imgur\.com/i,
      /gyazo\.com/i,
      /prnt\.sc/i,
      /screenshot/i,
      /image/i,
      /photo/i,
      /pic/i
    ];
    
    const isUrl = urlPattern.test(trimmedText);
    const hasImageExtension = imageExtensions.test(trimmedText);
    const isImageHost = imageHostPatterns.some(pattern => pattern.test(trimmedText));
    
    return isUrl && (hasImageExtension || isImageHost);
  };

  // Render message content (text or image) for widget
  const renderMessageContent = (message) => {
    const text = message.text;
    
    if (isImageUrl(text)) {
      return (
        <div className="message-image-container">
          <img 
            src={text.trim()} 
            alt="Shared image" 
            className="rounded-md shadow-sm"
            style={{ 
              maxWidth: '80%', 
              height: 'auto',
              display: 'block',
              maxHeight: '60px'
            }}
            onLoad={(e) => {
              // Widget image loaded successfully
            }}
            onError={(e) => {
              console.error('Widget image failed to load:', text.trim());
              // If image fails to load, show as text link instead
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span 
            className="text-xs opacity-70 break-all"
            style={{ display: 'none' }}
          >
            📷 Image
          </span>
        </div>
      );
    } else {
      return <p className="break-words font-medium">{text}</p>;
    }
  };

  return (
    <Widget
      title="💬 Messages"
      action="View all"
      to="/messenger"
    >
      <div className="py-4">
        {/* Recent Messages */}
        <div className="space-y-3 max-h-40 overflow-y-auto">
          {recentMessages.length > 0 ? (
            recentMessages.map(message => {
              const isCurrentUser = isFromCurrentUser(message);
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] min-w-[60%] p-2 rounded-lg text-lg shadow-sm ${
                    isCurrentUser ? 'rounded-br-sm' : 'rounded-bl-sm border'}`} 
                    style={{
                        backgroundColor: isCurrentUser ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: isCurrentUser ? 'var(--color-text-secondary)' : 'var(--color-text)',
                        borderColor: isCurrentUser ? 'transparent' : 'var(--color-border)'
                    }}>
                    {renderMessageContent(message)}
                    <p className="text-xs mt-1 opacity-70">
                      {formatMessageTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              No messages yet. Click "View all" to start messaging! 💕
            </div>
          )}
        </div>
      </div>
    </Widget>
  );
};
