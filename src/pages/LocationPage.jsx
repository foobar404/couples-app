import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../utils/appContext';

export const LocationPage = () => {
  const { data, partnerData, needsSetup, currentUser, updateLocation } = useApp();
  const navigate = useNavigate();
  
  // State for location sharing
  const [isActivelySharing, setIsActivelySharing] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [watchId, setWatchId] = useState(null);
  
  // Map state
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [userMarker, setUserMarker] = useState(null);
  const [partnerMarker, setPartnerMarker] = useState(null);
  
  // Get display name for partner
  const partnerDisplayName = data.settings?.displayName || 'Partner';
  
  // Get user and partner locations
  const userLocation = data.location;
  const partnerLocation = partnerData?.location;
  
  // Check if user has recent location data (for display purposes)
  const hasRecentLocation = userLocation && (() => {
    const now = new Date();
    const locationTime = new Date(userLocation.timestamp);
    const diffMinutes = (now - locationTime) / (1000 * 60);
    return diffMinutes < 10; // Show as recent if less than 10 minutes old
  })();

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || map) return;

    // Check if Leaflet is available
    if (typeof window === 'undefined' || !window.L) {
      console.error('Leaflet (L) is not available');
      return;
    }

    // Default center - NYC as fallback
    const defaultCenter = [40.7128, -74.0060];

    // Initialize the map
    const newMap = window.L.map(mapRef.current).setView(defaultCenter, 12);

    // Add tile layer (OpenStreetMap)
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(newMap);

    setMap(newMap);

    // Cleanup function
    return () => {
      if (newMap) {
        newMap.remove();
      }
    };
  }, []); // Keep empty dependency array

  // Initial map positioning based on available data
  useEffect(() => {
    if (!map) return;

    // Set initial view based on available location data
    if (userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 15);
    } else if (partnerLocation) {
      map.setView([partnerLocation.latitude, partnerLocation.longitude], 15);
    }
  }, [map]); // Only run when map is first created

  // Update markers when locations change
  useEffect(() => {
    if (!map || !window.L) return;

    // Create custom icons
    const userIcon = window.L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        width: 24px; 
        height: 24px; 
        background-color: #3B82F6; 
        border: 2px solid white; 
        border-radius: 50%; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px; 
          height: 8px; 
          background-color: white; 
          border-radius: 50%;
        "></div>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const partnerIcon = window.L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        width: 24px; 
        height: 24px; 
        background-color: #EC4899; 
        border: 2px solid white; 
        border-radius: 50%; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px; 
          height: 8px; 
          background-color: white; 
          border-radius: 50%;
        "></div>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Track if we're adding markers for the first time
    const isFirstUserMarker = !userMarker && userLocation;
    const isFirstPartnerMarker = !partnerMarker && partnerLocation;

    // Update user marker
    if (userLocation) {
      if (userMarker) {
        userMarker.setLatLng([userLocation.latitude, userLocation.longitude]);
      } else {
        const marker = window.L.marker([userLocation.latitude, userLocation.longitude], { 
          icon: userIcon 
        })
        .addTo(map)
        .bindPopup('Your Location');
        setUserMarker(marker);
      }
    } else if (userMarker) {
      map.removeLayer(userMarker);
      setUserMarker(null);
    }

    // Update partner marker
    if (partnerLocation) {
      if (partnerMarker) {
        partnerMarker.setLatLng([partnerLocation.latitude, partnerLocation.longitude]);
      } else {
        const marker = window.L.marker([partnerLocation.latitude, partnerLocation.longitude], { 
          icon: partnerIcon 
        })
        .addTo(map)
        .bindPopup(`${partnerDisplayName}'s Location`);
        setPartnerMarker(marker);
      }
    } else if (partnerMarker) {
      map.removeLayer(partnerMarker);
      setPartnerMarker(null);
    }

    // Only fit bounds when adding first markers or when both locations are newly available
    if ((isFirstUserMarker || isFirstPartnerMarker) && userLocation && partnerLocation) {
      const bounds = window.L.latLngBounds([
        [userLocation.latitude, userLocation.longitude],
        [partnerLocation.latitude, partnerLocation.longitude]
      ]);
      map.fitBounds(bounds.pad(0.1));
    }
  }, [map, userLocation, partnerLocation, userMarker, partnerMarker, partnerDisplayName]);

  const startLocationSharing = () => {
    if (!navigator.geolocation) {
      setLocationError('Location not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(''); // Clear any previous errors

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const successCallback = (position) => {
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString(),
      };
      
      updateLocation(locationData);
      setIsGettingLocation(false);
      setLocationError(''); // Clear any errors on success
    };

    const errorCallback = (error) => {
      let errorMessage = 'Failed to get location';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable location permissions.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out.';
          break;
      }
      setLocationError(errorMessage);
      setIsGettingLocation(false);
      setIsActivelySharing(false);
    };

    // Start watching position
    const id = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      options
    );

    setWatchId(id);
    setIsActivelySharing(true);
  };

  const stopLocationSharing = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsActivelySharing(false);
    setIsGettingLocation(false);
    setLocationError('');
  };

  const toggleLocationSharing = () => {
    if (isActivelySharing) {
      stopLocationSharing();
    } else {
      startLocationSharing();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <div className="page p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">📍 Location Sharing</h1>
        <p className="text-gray-600">Share your location with your partner in real-time</p>
      </div>

      {/* Setup Prompt */}
      {needsSetup && currentUser && (
        <div className="card mb-6 bg-blue-50 border-blue-200">
          <div className="card__body">
            <div className="text-center">
              <h3 className="font-semibold text-blue-900 mb-2">👫 Connect with your partner</h3>
              <p className="text-blue-700 text-sm mb-4">
                Set up your partner's email in settings to start sharing locations
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

      {/* Map Container */}
      <div className="card mb-6">
        <div className="card__body p-0">
          <div 
            ref={mapRef} 
            className="w-full h-80 md:h-96 rounded-lg"
            style={{ minHeight: '320px' }}
          >
          </div>
        </div>
      </div>

      {/* Location Sharing Controls */}
      <div className="card mb-6">
        <div className="card__header">
          <h3 className="card__title">Your Location Sharing</h3>
        </div>
        <div className="card__body">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-700 mb-1">
                {isActivelySharing ? '🟢 Currently sharing your location' : '🔴 Not sharing location'}
              </p>
              <p className="text-xs text-gray-500">
                {isActivelySharing ? 'Updates every 10 seconds' : 'Press button to start sharing'}
              </p>
            </div>
            <button
              onClick={toggleLocationSharing}
              disabled={isGettingLocation}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActivelySharing 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } disabled:opacity-50`}
            >
              {isGettingLocation ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Getting location...
                </span>
              ) : isActivelySharing ? (
                '⏹️ Stop Sharing'
              ) : (
                '▶️ Share Location'
              )}
            </button>
          </div>

          {locationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">⚠️ {locationError}</p>
            </div>
          )}

          {userLocation && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Location shared</p>
                  <p className="text-xs text-green-600">
                    Last updated: {formatTimeAgo(userLocation.timestamp)}
                  </p>
                </div>
                <button
                  onClick={() => openInMaps(userLocation.latitude, userLocation.longitude, 'Your Location')}
                  className="text-xs text-green-600 hover:text-green-700 underline"
                >
                  Open in Maps
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Partner Location Status */}
      <div className="card mb-6">
        <div className="card__header">
          <h3 className="card__title">{partnerDisplayName}'s Location</h3>
        </div>
        <div className="card__body">
          {partnerLocation ? (
            <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-800">
                    📍 {partnerDisplayName} is sharing their location
                  </p>
                  <p className="text-xs text-pink-600">
                    Last updated: {formatTimeAgo(partnerLocation.timestamp)}
                  </p>
                  {userLocation && partnerLocation && (
                    <p className="text-xs text-pink-600 mt-1">
                      Distance: {calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        partnerLocation.latitude,
                        partnerLocation.longitude
                      )}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => openInMaps(partnerLocation.latitude, partnerLocation.longitude, `${partnerDisplayName}'s Location`)}
                  className="text-xs text-pink-600 hover:text-pink-700 underline"
                >
                  Open in Maps
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <p className="text-sm text-gray-600">
                {needsSetup ? 
                  'Connect with your partner to see their location' :
                  `${partnerDisplayName} is not currently sharing their location`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions
const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return date.toLocaleDateString();
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m apart`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km apart`;
  } else {
    return `${Math.round(distance)}km apart`;
  }
};

const openInMaps = (lat, lng, label) => {
  const url = `https://maps.google.com/?q=${lat},${lng}`;
  window.open(url, '_blank');
};
