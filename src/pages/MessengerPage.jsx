import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../utils/AppContext';

export const MessengerPage = () => {
  const { data, partnerData, needsSetup, currentUser, addMessage } = useApp();
  const navigate = useNavigate();
  
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Get display name for partner
  const partnerDisplayName = data.settings?.displayName || 'Partner';
  
  // Get all messages (user and partner combined)
  const userMessages = data.messages || [];
  const partnerMessages = partnerData?.messages || [];
  
  // Combine and sort all messages
  const allMessages = [...userMessages, ...partnerMessages]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Remove auto-scroll - let users control scroll position manually
  // useEffect(() => {
  //   scrollToBottom();
  // }, [allMessages]);

  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await addMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp) => {
    const messageTime = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(messageTime.getFullYear(), messageTime.getMonth(), messageTime.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      // Today - show time
      return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.getTime() === today.getTime() - 86400000) {
      // Yesterday
      return 'Yesterday ' + messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // Older - show date and time
      return messageTime.toLocaleDateString() + ' ' + messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const isFromCurrentUser = (message) => {
    return message.sender === currentUser?.email;
  };

  // Check if a message text is an image URL
  const isImageUrl = (text) => {
    const trimmedText = text.trim();
    
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
    
    console.log('Image URL check:', {
      text: trimmedText,
      isUrl,
      hasImageExtension,
      isImageHost,
      result: isUrl && (hasImageExtension || isImageHost)
    });
    
    return isUrl && (hasImageExtension || isImageHost);
  };

  // Render message content (text or image)
  const renderMessageContent = (message) => {
    const text = message.text;
    
    if (isImageUrl(text)) {
      return (
        <div className="message-image-container">
          <img 
            src={text.trim()} 
            alt="Shared image" 
            className="rounded-lg shadow-sm"
            style={{ 
              maxWidth: '80%', 
              height: 'auto',
              display: 'block'
            }}
            onLoad={(e) => {
              console.log('Image loaded successfully:', text.trim());
            }}
            onError={(e) => {
              console.error('Image failed to load:', text.trim());
              // If image fails to load, show as text link instead
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <a 
            href={text.trim()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 underline break-all"
            style={{ display: 'none' }}
          >
            {text}
          </a>
        </div>
      );
    } else {
      return <p className="break-words whitespace-pre-wrap font-medium">{text}</p>;
    }
  };

  return (
    <div className="messenger-page flex flex-col h-screen max-w-4xl mx-auto bg-white">
      {/* Setup Prompt */}
      {needsSetup && currentUser && (
        <div className="p-4 flex-shrink-0">
          <div className="card bg-blue-50 border-blue-200">
            <div className="card__body">
              <div className="text-center">
                <h3 className="font-semibold text-blue-900 mb-2">👫 Connect with your partner</h3>
                <p className="text-blue-700 text-sm mb-4">
                  Set up your partner's email in settings to start messaging
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
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: 'var(--color-background)', paddingBottom: '100px' }}>
        {allMessages.length > 0 ? (
          allMessages.map((message, index) => {
            const isCurrentUser = isFromCurrentUser(message);
            const showDateDivider = index === 0 || 
              new Date(message.timestamp).toDateString() !== new Date(allMessages[index - 1].timestamp).toDateString();
            
            return (
              <div key={message.id}>
                {/* Date Divider */}
                {showDateDivider && (
                  <div className="flex justify-center my-4">
                    <div style={{ 
                      backgroundColor: 'var(--color-border)', 
                      color: 'var(--color-text-secondary)' 
                    }} className="text-xs px-3 py-1 rounded-full">
                      {new Date(message.timestamp).toDateString() === new Date().toDateString() 
                        ? 'Today' 
                        : new Date(message.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                )}
                
                {/* Message */}
                <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg shadow-sm messenger-bubble ${
                    isCurrentUser
                      ? 'messenger-bubble--primary text-white rounded-br-sm'
                      : 'messenger-bubble--secondary rounded-bl-sm border'
                  }`} style={{
                    backgroundColor: isCurrentUser ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: isCurrentUser ? 'white' : 'var(--color-text)',
                    borderColor: isCurrentUser ? 'transparent' : 'var(--color-border)'
                  }}>
                    {renderMessageContent(message)}
                    <p className="text-base mt-2 opacity-70 font-medium">
                      {formatMessageTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : !needsSetup ? (
          <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
            <div className="text-4xl mb-4">💕</div>
            <h3 className="font-medium text-lg mb-2">Start your conversation</h3>
            <p className="text-sm">Send your first message to {partnerDisplayName}!</p>
          </div>
        ) : null}
      </div>

      {/* Message Input */}
      {!needsSetup && (
        <div className="fixed bottom-20 left-0 right-0 p-4 z-40" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="max-w-4xl mx-auto">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${partnerDisplayName}... (Press Enter to send)`}
              className="messenger-input w-full px-4 py-3 rounded-full focus:outline-none transition-all font-medium"
              style={{
                backgroundColor: 'var(--color-background)',
                border: '2px solid var(--color-border)',
                color: 'var(--color-text)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)';
              }}
              disabled={isSending}
            />
          </div>
        </div>
      )}
    </div>
  );
};
