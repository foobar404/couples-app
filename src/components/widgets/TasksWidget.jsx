import React from 'react';
import { Widget } from '../UI';

export const TasksWidget = ({ tasksCount = 0 }) => {
  return (
    <Widget title="Shared Tasks" action="View all" to="/notes">
      <div className="text-center py-4">
        <div className="text-2xl mb-2">✅</div>
        <p className="text-gray-600 text-sm">
          {tasksCount} tasks pending
        </p>
      </div>
    </Widget>
  );
};
