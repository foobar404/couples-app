import React, { useState, useRef } from 'react';
import { useApp } from '../utils/AppContext';
import { Button } from '../components/UI';

export const NotesPage = () => {
  const { data, addSharedNote, updateSharedNote, deleteSharedNote, currentUser } = useApp();
  const [editingNote, setEditingNote] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteType, setNewNoteType] = useState('text');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const textareaRef = useRef(null);
  const canvasRef = useRef(null);
  const editCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [drawingColor, setDrawingColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(3);

  // Use shared notes
  const notes = data.sharedNotes || [];
  const sortedNotes = notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Auto-resize textarea
  const autoResize = (textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  const handleCreateNote = async () => {
    // Allow creation if there's a title, text content, or it's a doodle
    if (newNoteType === 'text' && !newNoteText.trim() && !newNoteTitle.trim()) return;
    if (newNoteType === 'list' && !newNoteText.trim() && !newNoteTitle.trim()) return;
    // Doodle notes can always be created

    try {
      let content = newNoteText.trim();
      
      if (newNoteType === 'list') {
        // Convert text to list items
        const items = newNoteText.split('\n').filter(line => line.trim()).map(line => ({
          id: Date.now().toString() + Math.random(),
          text: line.trim(),
          completed: false
        }));
        content = items.length > 0 ? items : []; // Allow empty lists
      } else if (newNoteType === 'doodle') {
        const canvas = canvasRef.current;
        content = canvas ? canvas.toDataURL() : '';
      }

      await addSharedNote({
        title: newNoteTitle.trim() || '',
        content: content,
        type: newNoteType
      });
      
      setNewNoteText('');
      setNewNoteTitle('');
      setNewNoteType('text');
      setShowTypeSelector(false);
      
      if (newNoteType === 'doodle') {
        clearCanvas();
      }
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleUpdateNote = async (noteId, content) => {
    if (!content.trim()) {
      handleDeleteNote(noteId);
      return;
    }

    try {
      await updateSharedNote(noteId, { content: content.trim() });
      setEditingNote(null);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteSharedNote(noteId);
      setEditingNote(null);
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  // Canvas drawing functions
  const getEventPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getEventPos(e);
    setCurrentPath([pos]);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getEventPos(e);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = drawingColor;

    if (currentPath.length > 0) {
      const lastPoint = currentPath[currentPath.length - 1];
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    setCurrentPath(prev => [...prev, pos]);
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Initialize canvas context for better drawing quality
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Set initial drawing state
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = brushSize;
    }
  }, [drawingColor, brushSize]);

  const formatDate = (timestamp) => {
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
    <div className="notes-page page-padding">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-bold mb-8 text-center">📝 Notes</h1>
        
        {/* New Note Input */}
        <div className="mb-6">
          <div className="bg-white rounded-lg border-2 border-gray-200 focus-within:border-pink-400 transition-colors shadow-sm">
            {/* Note Type Selector */}
            <div className="px-4 pt-3 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-600">Type:</span>
                <div className="flex gap-1">
                  {[
                    { key: 'text', icon: '📄', label: 'Text' },
                    { key: 'list', icon: '☑️', label: 'List' },
                    { key: 'doodle', icon: '🎨', label: 'Draw' }
                  ].map(type => (
                    <button
                      key={type.key}
                      onClick={() => setNewNoteType(type.key)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        newNoteType === type.key 
                          ? 'bg-pink-100 text-pink-700 border border-pink-300' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type.icon} {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Title Input */}
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Note title (optional)..."
              className="w-full px-4 py-2 border-none outline-none text-gray-800 placeholder-gray-400 font-medium"
            />

            {/* Content Input - varies by type */}
            {newNoteType === 'text' && (
              <textarea
                ref={textareaRef}
                value={newNoteText}
                onChange={(e) => {
                  setNewNoteText(e.target.value);
                  autoResize(e.target);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleCreateNote();
                  }
                }}
                placeholder="Write your note..."
                className="w-full px-4 pb-4 border-none outline-none resize-none text-gray-800 placeholder-gray-400"
                style={{ minHeight: '80px', maxHeight: '200px' }}
              />
            )}

            {newNoteType === 'list' && (
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleCreateNote();
                  }
                }}
                placeholder="Write each item on a new line..."
                className="w-full px-4 pb-4 border-none outline-none resize-none text-gray-800 placeholder-gray-400"
                style={{ minHeight: '80px', maxHeight: '200px' }}
              />
            )}

            {newNoteType === 'doodle' && (
              <div className="p-3">
                {/* Drawing Controls - Streamlined for mobile */}
                <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg">
                  {/* Color Picker */}
                  <input
                    type="color"
                    value={drawingColor}
                    onChange={(e) => setDrawingColor(e.target.value)}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer"
                    title="Choose color"
                  />
                  
                  {/* Brush Size */}
                  <div className="flex items-center gap-1">
                    <div className="flex flex-col items-center">
                      <div 
                        className="rounded-full bg-gray-600"
                        style={{ 
                          width: `${Math.max(4, brushSize * 2)}px`, 
                          height: `${Math.max(4, brushSize * 2)}px` 
                        }}
                      />
                      <span className="text-xs text-gray-500 mt-1">{brushSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(brushSize-1)/11*100}%, #e5e7eb ${(brushSize-1)/11*100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                  
                  {/* Clear Button */}
                  <button
                    onClick={clearCanvas}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                  >
                    Clear
                  </button>
                </div>

                <canvas
                  ref={canvasRef}
                  width={800}
                  height={400}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="border-2 border-gray-200 rounded-lg cursor-crosshair w-full touch-none bg-white shadow-sm"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    touchAction: 'none',
                    aspectRatio: '2/1',
                    minHeight: '200px'
                  }}
                />
              </div>
            )}

            {/* Action Bar */}
            {(newNoteText.trim() || newNoteTitle.trim() || newNoteType === 'doodle') && (
              <div className="px-4 pb-3 flex justify-between items-center border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  {newNoteType === 'text' && `${newNoteText.length} characters`}
                  {newNoteType === 'list' && `${newNoteText.split('\n').filter(l => l.trim()).length} items`}
                  {newNoteType === 'doodle' && 'Draw something'}
                  {newNoteType !== 'doodle' && ' • Press Cmd+Enter to save'}
                </span>
                <Button
                  variant="primary"
                  size="small"
                  onClick={handleCreateNote}
                  disabled={
                    (newNoteType === 'text' && !newNoteText.trim() && !newNoteTitle.trim()) ||
                    (newNoteType === 'list' && !newNoteText.trim() && !newNoteTitle.trim())
                    // Doodle notes are never disabled - user can save empty canvas if they want
                  }
                >
                  Save {newNoteType === 'text' ? 'Note' : newNoteType === 'list' ? 'List' : 'Drawing'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Notes List */}
        <div className="space-y-3">
          {sortedNotes.length > 0 ? (
            sortedNotes.map(note => {
              if (note.type === 'list') {
                return (
                  <ListNoteCard
                    key={note.id}
                    note={note}
                    currentUser={currentUser}
                    isEditing={editingNote === note.id}
                    onEdit={() => setEditingNote(note.id)}
                    onSave={async (updates) => {
                      await updateSharedNote(note.id, updates);
                      setEditingNote(null);
                    }}
                    onDelete={() => handleDeleteNote(note.id)}
                    onCancel={() => setEditingNote(null)}
                    formatDate={formatDate}
                  />
                );
              } else if (note.type === 'doodle') {
                return (
                  <DoodleNoteCard
                    key={note.id}
                    note={note}
                    currentUser={currentUser}
                    isEditing={editingNote === note.id}
                    onEdit={() => setEditingNote(note.id)}
                    onSave={async (updates) => {
                      await updateSharedNote(note.id, updates);
                      setEditingNote(null);
                    }}
                    onDelete={() => handleDeleteNote(note.id)}
                    onCancel={() => setEditingNote(null)}
                    formatDate={formatDate}
                    canvasRef={canvasRef}
                    drawingColor={drawingColor}
                    setDrawingColor={setDrawingColor}
                    brushSize={brushSize}
                    setBrushSize={setBrushSize}
                    isDrawing={isDrawing}
                    setIsDrawing={setIsDrawing}
                    currentPath={currentPath}
                    setCurrentPath={setCurrentPath}
                    getEventPos={getEventPos}
                    startDrawing={startDrawing}
                    draw={draw}
                    stopDrawing={stopDrawing}
                    clearCanvas={clearCanvas}
                  />
                );
              } else {
                return (
                  <NoteCard
                    key={note.id}
                    note={note}
                    currentUser={currentUser}
                    isEditing={editingNote === note.id}
                    onEdit={() => setEditingNote(note.id)}
                    onSave={async (updates) => {
                      await updateSharedNote(note.id, updates);
                      setEditingNote(null);
                    }}
                    onDelete={() => handleDeleteNote(note.id)}
                    onCancel={() => setEditingNote(null)}
                    formatDate={formatDate}
                    autoResize={autoResize}
                  />
                );
              }
            })
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-500">No notes yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first note above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple Note Card Component
const NoteCard = ({ note, currentUser, isEditing, onEdit, onSave, onDelete, onCancel, formatDate, autoResize }) => {
  // Convert content to string for editing if it's an array (list items)
  const getEditableContent = (content) => {
    if (Array.isArray(content)) {
      return content.map(item => item.text || '').join('\n');
    }
    return typeof content === 'string' ? content : '';
  };

  const [editText, setEditText] = useState(getEditableContent(note.content));
  const [editTitle, setEditTitle] = useState(note.title || '');
  const editRef = useRef(null);

  React.useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      autoResize(editRef.current);
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave({ title: editTitle, content: editText });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditText(getEditableContent(note.content));
      setEditTitle(note.title || '');
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg border-2 border-pink-400 shadow-sm">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Note title (optional)..."
          className="w-full px-4 py-3 border-none outline-none text-gray-800 placeholder-gray-400 font-medium border-b border-gray-100"
        />
        <textarea
          ref={editRef}
          value={editText}
          onChange={(e) => {
            setEditText(e.target.value);
            autoResize(e.target);
          }}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 border-none outline-none resize-none text-gray-800"
          style={{ minHeight: '80px', maxHeight: '300px' }}
        />
        <div className="px-4 pb-3 flex justify-between items-center border-t border-gray-100">
          <span className="text-xs text-gray-400">
            Press Cmd+Enter to save • Esc to cancel
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="small" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" size="small" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-pointer group shadow-sm hover:shadow-md"
      onClick={onEdit}
    >
      <div className="p-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            {note.title && (
              <h3 className="font-semibold text-gray-900 mb-2 break-words">
                {note.title}
              </h3>
            )}
            <p className="text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
              {typeof note.content === 'string' ? note.content : 
               Array.isArray(note.content) ? `${note.content.length} list items` :
               'Note content'}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 p-1 rounded"
            title="Delete note"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {formatDate(note.timestamp)}
          </span>
          <span className="text-xs text-gray-400">
            by {note.authorEmail === currentUser?.email ? 'you' : note.author || 'partner'}
          </span>
        </div>
      </div>
    </div>
  );
};

// List Note Card Component
const ListNoteCard = ({ note, currentUser, isEditing, onEdit, onSave, onDelete, onCancel, formatDate }) => {
  const [editTitle, setEditTitle] = useState(note.title || '');
  const [newItemText, setNewItemText] = useState('');
  const [items, setItems] = useState(Array.isArray(note.content) ? note.content : []);

  const addItem = () => {
    if (!newItemText.trim()) return;
    const newItem = {
      id: Date.now().toString() + Math.random(),
      text: newItemText.trim(),
      completed: false
    };
    setItems([...items, newItem]);
    setNewItemText('');
  };

  const toggleItem = (itemId) => {
    setItems(items.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  const deleteItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleSave = () => {
    onSave({ title: editTitle, content: items });
  };

  const completedCount = items.filter(item => item.completed).length;

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg border-2 border-pink-400 shadow-sm">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="List title (optional)..."
          className="w-full px-4 py-3 border-none outline-none text-gray-800 placeholder-gray-400 font-medium border-b border-gray-100"
        />
        
        <div className="p-4">
          {/* List Items */}
          <div className="space-y-2 mb-4">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <button
                  onClick={() => toggleItem(item.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    item.completed 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {item.completed && <span className="text-white text-xs">✓</span>}
                </button>
                <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                  {item.text}
                </span>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Add New Item */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              placeholder="Add new item..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded outline-none focus:border-pink-400"
            />
            <Button variant="primary" size="small" onClick={addItem}>
              Add
            </Button>
          </div>
        </div>

        <div className="px-4 pb-3 flex justify-between items-center border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {items.length} items • {completedCount} completed
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="small" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" size="small" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-pointer group shadow-sm hover:shadow-md"
      onClick={onEdit}
    >
      <div className="p-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            {note.title && (
              <h3 className="font-semibold text-gray-900 mb-2 break-words">
                {note.title}
              </h3>
            )}
            <div className="space-y-1 mb-3">
              {(note.content || []).slice(0, 3).map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                    item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                  }`}>
                    {item.completed && '✓'}
                  </span>
                  <span className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {item.text}
                  </span>
                </div>
              ))}
              {(note.content || []).length > 3 && (
                <p className="text-xs text-gray-400 pl-6">
                  +{(note.content || []).length - 3} more items
                </p>
              )}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 p-1 rounded"
            title="Delete list"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {formatDate(note.timestamp)}
            </span>
            <span className="text-xs text-gray-400">
              {completedCount}/{(note.content || []).length} completed
            </span>
          </div>
          <span className="text-xs text-gray-400">
            by {note.authorEmail === currentUser?.email ? 'you' : note.author || 'partner'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Doodle Note Card Component
const DoodleNoteCard = ({ 
  note, 
  currentUser, 
  isEditing, 
  onEdit, 
  onSave, 
  onDelete, 
  onCancel, 
  formatDate,
  drawingColor,
  setDrawingColor,
  brushSize,
  setBrushSize
}) => {
  const [editTitle, setEditTitle] = useState(note.title || '');
  const editCanvasRef = useRef(null);
  const [editIsDrawing, setEditIsDrawing] = useState(false);
  const [editCurrentPath, setEditCurrentPath] = useState([]);

  // Initialize edit canvas with existing drawing
  React.useEffect(() => {
    if (isEditing && editCanvasRef.current && note.content) {
      const canvas = editCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = note.content;
    }
  }, [isEditing, note.content]);

  const getEditEventPos = (e) => {
    const canvas = editCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const startEditDrawing = (e) => {
    e.preventDefault();
    setEditIsDrawing(true);
    const pos = getEditEventPos(e);
    setEditCurrentPath([pos]);
  };

  const editDraw = (e) => {
    e.preventDefault();
    if (!editIsDrawing) return;
    
    const canvas = editCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getEditEventPos(e);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = drawingColor;

    if (editCurrentPath.length > 0) {
      const lastPoint = editCurrentPath[editCurrentPath.length - 1];
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    setEditCurrentPath(prev => [...prev, pos]);
  };

  const stopEditDrawing = (e) => {
    e.preventDefault();
    setEditIsDrawing(false);
    setEditCurrentPath([]);
  };

  const clearEditCanvas = () => {
    const canvas = editCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = editCanvasRef.current;
    const dataURL = canvas ? canvas.toDataURL() : note.content;
    onSave({ title: editTitle, content: dataURL });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditTitle(note.title || '');
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg border-2 border-pink-400 shadow-sm">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Drawing title (optional)..."
          className="w-full px-4 py-3 border-none outline-none text-gray-800 placeholder-gray-400 font-medium border-b border-gray-100"
        />
        
        <div className="p-3">
          {/* Drawing Controls */}
          <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg">
            <input
              type="color"
              value={drawingColor}
              onChange={(e) => setDrawingColor(e.target.value)}
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer"
              title="Choose color"
            />
            
            <div className="flex items-center gap-1">
              <div className="flex flex-col items-center">
                <div 
                  className="rounded-full bg-gray-600"
                  style={{ 
                    width: `${Math.max(4, brushSize * 2)}px`, 
                    height: `${Math.max(4, brushSize * 2)}px` 
                  }}
                />
                <span className="text-xs text-gray-500 mt-1">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <button
              onClick={clearEditCanvas}
              className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
            >
              Clear
            </button>
          </div>
          
          <canvas
            ref={editCanvasRef}
            width={800}
            height={400}
            onMouseDown={startEditDrawing}
            onMouseMove={editDraw}
            onMouseUp={stopEditDrawing}
            onMouseLeave={stopEditDrawing}
            onTouchStart={startEditDrawing}
            onTouchMove={editDraw}
            onTouchEnd={stopEditDrawing}
            className="border-2 border-gray-200 rounded-lg cursor-crosshair w-full touch-none bg-white shadow-sm"
            style={{
              maxWidth: '100%',
              height: 'auto',
              touchAction: 'none',
              aspectRatio: '2/1',
              minHeight: '200px'
            }}
          />
        </div>
        
        <div className="px-4 pb-3 flex justify-between items-center border-t border-gray-100">
          <span className="text-xs text-gray-400">
            Press Cmd+Enter to save • Esc to cancel
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="small" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" size="small" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-pointer group shadow-sm hover:shadow-md"
        onClick={onEdit}
      >
        <div className="p-4">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              {note.title && (
                <h3 className="font-semibold text-gray-900 mb-2 break-words">
                  {note.title}
                </h3>
              )}
              <div className="mb-3">
                <img
                  src={note.content}
                  alt={note.title || 'Drawing'}
                  className="w-full rounded-lg border max-h-48 object-contain bg-gray-50"
                />
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 p-1 rounded"
              title="Delete drawing"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {formatDate(note.timestamp)}
            </span>
            <span className="text-xs text-gray-400">
              by {note.authorEmail === currentUser?.email ? 'you' : note.author || 'partner'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
