import React from 'react';
import { Widget } from '../UI';

export const ConnectionWidget = ({ lastUpdated, formatRelativeTime }) => {
  return (
    <Widget title="Connection">
      <div className="text-center py-4">
        <div className="text-2xl mb-2">💖</div>
        <p className="text-sm text-gray-600">
          Last synced: {lastUpdated ? formatRelativeTime(lastUpdated) : 'Never'}
        </p>
      </div>
    </Widget>
  );
};
