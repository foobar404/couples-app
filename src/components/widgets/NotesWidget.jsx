import React from 'react';
import { Widget } from '../UI';

export const NotesWidget = ({ recentNotes, formatRelativeTime }) => {
  const getNoteThumbnail = (note) => {
    switch (note.type) {
      case 'list':
        const items = note.content || [];
        const completedCount = items.filter(item => item.completed).length;
        return `☑️ ${completedCount}/${items.length} completed`;
      case 'doodle':
        return '🎨 Drawing';
      case 'text':
      default:
        return note.content ? note.content.substring(0, 60) + (note.content.length > 60 ? '...' : '') : '';
    }
  };

  return (
    <Widget
      title="Recent Notes"
      action="View all"
      to="/notes"
    >
      <div className="space-y-2">
        {recentNotes.length > 0 ? (
          recentNotes.map(note => (
            <div key={note.id} className="p-3 rounded-lg border transition-colors hover:bg-gray-50" style={{
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)'
            }}>
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-medium text-sm truncate" style={{ color: 'var(--color-text)' }}>
                  {note.title}
                </h4>
                <span className="text-xs ml-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {note.type === 'text' ? '📄' : note.type === 'list' ? '☑️' : '🎨'}
                </span>
              </div>
              <p className="text-sm truncate mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                {getNoteThumbnail(note)}
              </p>
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {formatRelativeTime(note.timestamp)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-secondary)' }}>
            No notes yet. Create your first note! �
          </p>
        )}
      </div>
    </Widget>
  );
};
