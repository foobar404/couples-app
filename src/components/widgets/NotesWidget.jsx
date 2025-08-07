import React from 'react';
import { Widget } from '../UI';

export const NotesWidget = ({ recentNotes, formatRelativeTime }) => {
  return (
    <Widget
      title="Recent Notes"
      action="View all"
      to="/notes"
    >
      <div className="space-y-2">
        {recentNotes.length > 0 ? (
          recentNotes.map(note => (
            <div key={note.id} className="p-2 bg-gray-100 rounded text-sm">
              <p className="truncate">{note.text}</p>
              <span className="text-xs text-gray-600">
                {formatRelativeTime(note.timestamp)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-600 text-sm py-4 text-center">
            No notes yet. Start sharing your thoughts! 💭
          </p>
        )}
      </div>
    </Widget>
  );
};
