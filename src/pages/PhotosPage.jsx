import React, { useState, useRef } from 'react';
import { useApp } from '../utils/AppContext';
import { Button } from '../components/UI';
import { compressImageFile, compressWithStats } from '../utils/imageCompression';

export const PhotosPage = () => {
  const { data, addPhoto, deletePhoto, currentUser } = useApp();
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const fileInputRef = useRef(null);

  // Get photos sorted by newest first
  const photos = (data.photos || []).sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  // PhotoCard component
  const PhotoCard = ({ photo }) => (
    <div
      className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => setSelectedPhoto(photo)}
    >
      <div className="aspect-square relative">
        <img
          src={photo.imageData}
          alt={`Photo from ${formatDate(photo.timestamp)}`}
          className="w-full h-full object-cover"
        />
        {currentUser?.email === photo.author && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePhoto(photo.id);
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            title="Delete photo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="p-3">
        <div className="text-xs text-gray-500 mb-1">
          {formatDate(photo.timestamp)}
        </div>
        {photo.location && (
          <div className="text-xs text-blue-600">
            📍 {formatLocation(photo.location)}
          </div>
        )}
        <div className="text-xs text-gray-400 mt-1">
          by {photo.author === currentUser?.email ? 'you' : 'partner'}
        </div>
      </div>
    </div>
  );

  const handlePhotoCapture = async (file) => {
    if (!file) return;

    setIsCapturing(true);
    
    try {
      // Get location if available
      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: true
            });
          });
          
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
        } catch (error) {
          console.warn('Could not get location:', error);
        }
      }

      // Compress and convert file
      try {
        const compressionResult = await compressWithStats(file, 'photo');
        
        const photoData = {
          id: Date.now().toString(),
          imageData: compressionResult.dataUrl,
          timestamp: new Date().toISOString(),
          location: location,
          author: currentUser?.email || 'unknown',
          filename: file.name,
          originalSize: compressionResult.originalSize,
          compressedSize: compressionResult.compressedSize,
          compressionRatio: compressionResult.compressionRatio
        };

        await addPhoto(photoData);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (photoError) {
        console.error('Failed to save photo:', photoError);
        alert('Failed to save photo. Please try again.');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      alert('Error capturing photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      handlePhotoCapture(file);
    } else {
      alert('Please select a valid image file.');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      try {
        await deletePhoto(photoId);
        setSelectedPhoto(null);
      } catch (error) {
        console.error('Failed to delete photo:', error);
        alert('Failed to delete photo. Please try again.');
      }
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLocation = (location) => {
    if (!location) return null;
    
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  };

  const getLocationLink = (location) => {
    if (!location) return null;
    
    return `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
  };

  return (
    <div className="page p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">📸 Photo of the Day</h1>
        
        {/* Add Photo Button */}
        <div className="flex justify-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCapturing}
            className="flex items-center gap-2"
          >
            📆 {isCapturing ? 'Saving Photo...' : 'Add Today\'s Photo'}
          </Button>
        </div>
      </div>

      {/* Photos Timeline */}
      {photos.length > 0 ? (
        <div className="space-y-6">
          {/* Today's Photos Section */}
          {(() => {
            const today = new Date().toDateString();
            const todaysPhotos = photos.filter(photo => 
              new Date(photo.timestamp).toDateString() === today
            );
            
            if (todaysPhotos.length > 0) {
              return (
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-center">📅 Today's Moments</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {todaysPhotos.map(photo => (
                      <PhotoCard key={photo.id} photo={photo} />
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}
          
          {/* All Photos */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-center">⏳ Photo Timeline</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map(photo => (
                <PhotoCard key={photo.id} photo={photo} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛣️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Your Photo Journey</h3>
          <p className="text-gray-600 mb-4">Share a photo of your day and create beautiful memories together!</p>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    📸 Photo Details
                  </h2>
                  <p className="text-sm text-gray-500">
                    {formatDate(selectedPhoto.timestamp)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <img
                  src={selectedPhoto.imageData}
                  alt={`Photo from ${formatDate(selectedPhoto.timestamp)}`}
                  className="w-full rounded-lg max-h-[60vh] object-contain"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Taken by:</span>
                  <span className="ml-2 text-gray-600">
                    {selectedPhoto.author === currentUser?.email ? 'You' : 'Your partner'}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Date & Time:</span>
                  <span className="ml-2 text-gray-600">
                    {formatDate(selectedPhoto.timestamp)}
                  </span>
                </div>
                
                {selectedPhoto.location && (
                  <div className="sm:col-span-2">
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2">
                      <a
                        href={getLocationLink(selectedPhoto.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        📍 {formatLocation(selectedPhoto.location)} (View on map)
                      </a>
                    </span>
                  </div>
                )}
                
                <div>
                  <span className="font-medium text-gray-700">File size:</span>
                  <span className="ml-2 text-gray-600">
                    {selectedPhoto.size ? (selectedPhoto.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}
                  </span>
                </div>
              </div>
              
              {currentUser?.email === selectedPhoto.author && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleDeletePhoto(selectedPhoto.id)}
                  >
                    🗑️ Delete Photo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
