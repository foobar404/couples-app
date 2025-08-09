import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../utils/AppContext';

export const MessengerPage = () => {
  const { data, partnerData, needsSetup, currentUser, addMessage } = useApp();
  const navigate = useNavigate();
  
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  
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

  // Auto-resize textarea when component mounts or message changes
  useEffect(() => {
    autoResizeTextarea();
  }, [newMessage]);

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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File is too large. Please select a file smaller than 5MB.');
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const isImage = allowedTypes.includes(file.type);
    
    setIsUploading(true);
    
    try {
      if (isImage) {
        // For images, create a data URL and send it
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            await addMessage(e.target.result);
          } catch (error) {
            console.error('Failed to send image:', error);
            alert('Failed to send image. Please try again.');
          } finally {
            setIsUploading(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // For other files, send file info
        const fileMessage = `📎 Shared file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        await addMessage(fileMessage);
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
      setIsUploading(false);
    }
    
    // Reset file input
    event.target.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    autoResizeTextarea();
  };

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the scroll height
      textarea.style.height = 'auto';
      // Set height to scroll height, with max of 300px
      const newHeight = Math.min(textarea.scrollHeight, 300);
      textarea.style.height = `${newHeight}px`;
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

  // Check if a message text is an image URL or data URL
  const isImageUrl = (text) => {
    const trimmedText = text.trim();
    
    // Check for data URLs (base64 images)
    if (trimmedText.startsWith('data:image/')) {
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
              maxWidth: '100%', 
              maxHeight: '300px',
              width: 'auto',
              height: 'auto',
              display: 'block'
            }}
            onLoad={(e) => {
              // Image loaded successfully
            }}
            onError={(e) => {
              console.error('Image failed to load');
              // If image fails to load, show as text link instead
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <a 
            href={text.trim().startsWith('data:') ? '#' : text.trim()} 
            target={text.trim().startsWith('data:') ? '_self' : '_blank'}
            rel="noopener noreferrer"
            className="text-blue-400 underline break-all text-xs"
            style={{ display: 'none' }}
            onClick={(e) => {
              if (text.trim().startsWith('data:')) {
                e.preventDefault();
                // For data URLs, we could implement a modal or download functionality
              }
            }}
          >
            {text.trim().startsWith('data:') ? 'Shared Image' : text}
          </a>
        </div>
      );
    } else {
      return <p className="break-words whitespace-pre-wrap font-medium">{text}</p>;
    }
  };

  return (
    <div className="messenger-page flex flex-col h-screen max-w-4xl mx-auto bg-white">
      {/* Header */}
      <div className="p-4 flex-shrink-0 border-b border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-center">💬 Messenger</h1>
      </div>
      
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
        <div className="fixed bottom-20 left-0 right-0 z-40">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 p-2 rounded-2xl shadow-lg" style={{
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
            }}>
              {/* Upload Button */}
              <button
                onClick={handleUploadClick}
                disabled={isUploading || isSending}
                className="bg-gray-200 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
                onMouseEnter={(e) => {
                  if (!isUploading && !isSending) {
                    e.target.style.backgroundColor = 'var(--color-border)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isUploading && !isSending) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
                title="Upload image or file"
              >
                {isUploading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full"></div>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                )}
              </button>

              {/* Message Input */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message ${partnerDisplayName}...`}
                  className="w-full px-4 py-3 bg-transparent border-none outline-none text-base resize-none overflow-y-auto"
                  style={{
                    color: 'var(--color-text)',
                    minHeight: '48px',
                    maxHeight: '300px',
                    lineHeight: '1.5'
                  }}
                  disabled={isSending || isUploading}
                  rows={1}
                />
              </div>
              
              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending || isUploading}
                className="bg-gray-200 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-40 hover:scale-105 active:scale-95"
              >
                {isSending ? (
                  <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full"></div>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Upload Status */}
            {isUploading && (
              <div className="mt-3 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm" style={{
                  backgroundColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)'
                }}>
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                  Uploading file...
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
