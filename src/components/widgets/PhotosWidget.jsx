import React from 'react';
import { Widget } from '../UI';

export const PhotosWidget = ({ recentPhotos, currentUser }) => {
  const formatShortDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'now';
    if (diffHours < 24) return `${diffHours}h`;
    if (diffHours < 48) return 'yesterday';
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <Widget
      title="Photo Memories"
      action="View all"
      to="/photos"
    >
      <div className="space-y-2">
        {recentPhotos && recentPhotos.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-1 mb-3">
              {recentPhotos.slice(0, 3).map(photo => (
                <div 
                  key={photo.id} 
                  className="aspect-square relative overflow-hidden rounded-lg bg-gray-100"
                >
                  <img
                    src={photo.imageData}
                    alt="Recent photo"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {recentPhotos.length} photo{recentPhotos.length !== 1 ? 's' : ''}
              </span>
              <span>
                Last: {formatShortDate(recentPhotos[0].timestamp)}
              </span>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="text-2xl mb-2">📸</div>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              No photos yet
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Start capturing memories!
            </p>
          </div>
        )}
      </div>
    </Widget>
  );
};
