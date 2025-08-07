import React from 'react';
import { Widget } from '../UI';

export const PhotosWidget = ({ photosCount = 0 }) => {
  return (
    <Widget title="Photo Memories" action="View all" to="/notes">
      <div className="text-center py-4">
        <div className="text-2xl mb-2">📸</div>
        <p className="text-gray-600 text-sm">
          {photosCount} shared photos
        </p>
      </div>
    </Widget>
  );
};
