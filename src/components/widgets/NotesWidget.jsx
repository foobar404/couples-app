import React from 'react';
import { Widget } from '../UI';

export const NotesWidget = ({ recentNotes, currentUser }) => {
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
      title="Shared Notes"
      action="View all"
      to="/notes"
    >
      <div className="space-y-2">
        {recentNotes.length > 0 ? (
          recentNotes.map(note => (
            <div 
              key={note.id} 
              className="p-3 rounded-lg border transition-colors hover:bg-gray-50 cursor-pointer" 
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div className="flex items-start justify-between mb-2">
                {note.type === 'doodle' ? (
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {note.title || '🎨 Doodle'}
                      </span>
                    </div>
                    {note.content && (
                      <img 
                        src={note.content} 
                        alt="Doodle" 
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-medium line-clamp-2 flex-1" style={{ color: 'var(--color-text)' }}>
                    {note.title || (
                      note.content ? (
                        Array.isArray(note.content) 
                          ? note.content.filter(item => item.text.trim()).map(item => item.text).join(', ').substring(0, 60) + (note.content.length > 1 ? '...' : '')
                          : note.content.substring(0, 60) + (note.content.length > 60 ? '...' : '')
                      ) : 'Empty note'
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {formatShortDate(note.timestamp)}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {note.authorEmail === currentUser?.email ? 'you' : 'partner'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <div className="text-2xl mb-2">📝</div>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              No shared notes yet
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Create your first note!
            </p>
          </div>
        )}
      </div>
    </Widget>
  );
};
