import React from 'react';
import { Widget } from '../UI';
import { useApp } from '../../utils/appContext';

export const LocationWidget = ({ 
  partnerDisplayName: propPartnerDisplayName
}) => {
  const { data, partnerData } = useApp();

  // Get data from context
  const userLocation = data.location;
  const partnerLocation = partnerData?.location;
  const partnerDisplayName = propPartnerDisplayName || data.settings?.displayName || 'Partner';

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const formatAddress = (location) => {
    if (!location) return 'Location not shared';
    
    // If we have a readable address, show it
    if (location.address) {
      return location.address;
    }
    
    // Otherwise show coordinates
    if (location.latitude && location.longitude) {
      return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    }
    
    return 'Location unavailable';
  };

  return (
    <Widget
      title="📍 Location"
      action="Share & view"
      to="/location"
    >
      <div className="py-4">
        {/* Location Status */}
        <div className="space-y-4">
          {/* User Location */}
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <span className="font-medium">You</span>
              </div>
              {userLocation ? (
                <span className="text-gray-500 text-xs">
                  {formatTimeAgo(userLocation.timestamp)}
                </span>
              ) : (
                <span className="text-gray-400 text-xs">Not shared</span>
              )}
            </div>
            <p className="text-sm text-gray-600 ml-5">
              {formatAddress(userLocation)}
            </p>
          </div>
          
          {/* Partner Location */}
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-pink-500 rounded-full"></span>
                <span className="font-medium">{partnerDisplayName}</span>
              </div>
              {partnerLocation ? (
                <span className="text-gray-500 text-xs">
                  {formatTimeAgo(partnerLocation.timestamp)}
                </span>
              ) : (
                <span className="text-gray-400 text-xs">Not shared</span>
              )}
            </div>
            <p className="text-sm text-gray-600 ml-5">
              {formatAddress(partnerLocation)}
            </p>
          </div>
          
          {/* Distance if both locations available */}
          {userLocation && partnerLocation && (
            <div className="pt-2">
              <DistanceDisplay 
                userLocation={userLocation} 
                partnerLocation={partnerLocation}
                partnerDisplayName={partnerDisplayName}
              />
            </div>
          )}
        </div>
      </div>
    </Widget>
  );
};

// Helper component to calculate and display distance
const DistanceDisplay = ({ userLocation, partnerLocation, partnerDisplayName }) => {
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
    return distance;
  };

  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    partnerLocation.latitude,
    partnerLocation.longitude
  );

  const formatDistance = (km) => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m apart`;
    } else if (km < 10) {
      return `${km.toFixed(1)}km apart`;
    } else {
      return `${Math.round(km)}km apart`;
    }
  };

  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
        <span className="text-purple-600">💕</span>
        <span className="text-sm text-purple-700 font-medium">
          {formatDistance(distance)}
        </span>
      </div>
    </div>
  );
};
