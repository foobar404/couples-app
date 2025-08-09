import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../utils/AppContext';
import { Button, Card } from '../components/UI';

export const NotesPage = () => {
  const { data, addNote, updateNote, deleteNote } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [viewingDoodle, setViewingDoodle] = useState(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', type: 'text' });
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [drawingColor, setDrawingColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(3);

  const notes = data.notes || [];

  const handleCreateNote = async () => {
    console.log('Creating note:', newNote);

    try {
      const noteData = {
        ...newNote,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        content: newNote.type === 'list' ? [] : newNote.content || ''
      };

      console.log('Note data to be saved:', noteData);
      await addNote(noteData);
      setNewNote({ title: '', content: '', type: 'text' });
      setShowCreateModal(false);
      console.log('Note created successfully');
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleUpdateNote = async (noteId, updates) => {
    try {
      await updateNote(noteId, updates);
      setEditingNote(null);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(noteId);
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  // Canvas drawing functions
  const getEventPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches && e.touches.length > 0) {
      // Touch event
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
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

  const saveDoodle = async () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL();
    
    try {
      const noteData = {
        id: Date.now().toString(),
        title: newNote.title,
        content: dataURL,
        type: 'doodle',
        timestamp: new Date().toISOString()
      };

      await addNote(noteData);
      setNewNote({ title: '', content: '', type: 'text' });
      setShowCreateModal(false);
      clearCanvas();
    } catch (error) {
      console.error('Failed to save doodle:', error);
    }
  };

  // List note functions
  const addListItem = (noteId, text) => {
    if (!text.trim()) return;
    
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const newItem = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false
    };

    const updatedContent = [...(note.content || []), newItem];
    handleUpdateNote(noteId, { content: updatedContent });
  };

  const toggleListItem = (noteId, itemId) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const updatedContent = note.content.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    handleUpdateNote(noteId, { content: updatedContent });
  };

  const deleteListItem = (noteId, itemId) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const updatedContent = note.content.filter(item => item.id !== itemId);
    handleUpdateNote(noteId, { content: updatedContent });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="notes-page page-padding">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-bold mb-6 text-center">📝 Notes</h1>
        
        <div className="mb-6 text-center">
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            + New Note
          </Button>
        </div>

        {/* All Notes */}
        <div className="space-y-4">
          {notes.length > 0 ? (
            notes
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map(note => {
                if (note.type === 'text') {
                  return (
                    <TextNoteCard 
                      key={note.id} 
                      note={note} 
                      onEdit={() => setEditingNote(note)}
                      onDelete={() => handleDeleteNote(note.id)}
                      onUpdate={handleUpdateNote}
                      isEditing={editingNote?.id === note.id}
                      formatDate={formatDate}
                    />
                  );
                } else if (note.type === 'list') {
                  return (
                    <ListNoteCard 
                      key={note.id} 
                      note={note} 
                      onEdit={() => setEditingNote(note)}
                      onDelete={() => handleDeleteNote(note.id)}
                      onUpdate={handleUpdateNote}
                      isEditing={editingNote?.id === note.id}
                      addListItem={addListItem}
                      toggleListItem={toggleListItem}
                      deleteListItem={deleteListItem}
                      formatDate={formatDate}
                    />
                  );
                } else if (note.type === 'doodle') {
                  return (
                    <DoodleNoteCard 
                      key={note.id} 
                      note={note} 
                      onView={() => setViewingDoodle(note)}
                      onDelete={() => handleDeleteNote(note.id)}
                      formatDate={formatDate}
                    />
                  );
                }
                return null;
              })
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="font-medium text-lg mb-2" style={{ color: 'var(--color-text)' }}>
                No notes yet
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Create your first note to get started
              </p>
            </div>
          )}
        </div>

        {/* Create Note Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Create New Note</h3>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewNote({ title: '', content: '', type: 'text' });
                    if (newNote.type === 'doodle') clearCanvas();
                  }}
                >
                  ×
                </Button>
              </div>

              {/* Note Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text)' }}>
                  Note Type
                </label>
                <div className="space-y-3">
                  {[
                    { key: 'text', label: '📄 Text Note', desc: 'Simple text note' },
                    { key: 'list', label: '☑️ List/Checklist', desc: 'Todo items with checkboxes' },
                    { key: 'doodle', label: '🎨 Doodle/Drawing', desc: 'Draw or sketch something' }
                  ].map(type => (
                    <label key={type.key} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="noteType"
                        value={type.key}
                        checked={newNote.type === type.key}
                        onChange={(e) => setNewNote({ ...newNote, type: e.target.value, content: e.target.value === 'list' ? [] : '' })}
                        className="mt-1"
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                          {type.label}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {type.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Enter note title (optional)..."
                  className="input w-full"
                />
              </div>

              {/* Content Based on Type */}
              {newNote.type === 'text' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Content
                  </label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    placeholder="Write your note here..."
                    rows={6}
                    className="input w-full resize-none"
                  />
                </div>
              )}

              {newNote.type === 'doodle' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Drawing Canvas
                  </label>
                  
                  {/* Drawing Controls */}
                  <div className="flex gap-4 mb-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Color:</label>
                      <input
                        type="color"
                        value={drawingColor}
                        onChange={(e) => setDrawingColor(e.target.value)}
                        className="w-8 h-8 rounded border-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Size:</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-sm w-6">{brushSize}</span>
                    </div>
                    <Button variant="secondary" size="small" onClick={clearCanvas}>
                      Clear
                    </Button>
                  </div>

                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={300}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="border rounded-lg cursor-crosshair w-full touch-none"
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid var(--color-border)',
                      maxWidth: '100%',
                      touchAction: 'none'
                    }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewNote({ title: '', content: '', type: 'text' });
                    if (newNote.type === 'doodle') clearCanvas();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={newNote.type === 'doodle' ? saveDoodle : handleCreateNote}
                  disabled={
                    newNote.type === 'text' ? !newNote.content.trim() :
                    newNote.type === 'list' ? true : // Lists are always creatable
                    false // Doodles are always creatable once drawn
                  }
                >
                  {newNote.type === 'doodle' ? 'Save Doodle' : 'Create Note'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* View Doodle Modal */}
        {viewingDoodle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    {viewingDoodle.title || 'Untitled Doodle'}
                  </h2>
                  <button
                    onClick={() => setViewingDoodle(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                {/* Full Size Doodle */}
                <div className="mb-4">
                  <img
                    src={viewingDoodle.content}
                    alt={viewingDoodle.title || 'Doodle'}
                    className="w-full rounded-lg border max-h-[70vh] object-contain"
                    style={{ border: '1px solid var(--color-border)' }}
                  />
                </div>

                {/* Timestamp */}
                <p className="text-sm text-gray-500">
                  Created: {formatDate(viewingDoodle.timestamp)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Text Note Component
const TextNoteCard = ({ note, onEdit, onDelete, onUpdate, isEditing, formatDate }) => {
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);

  const handleSave = () => {
    onUpdate(note.id, { title: editTitle, content: editContent });
  };

  const handleCancel = () => {
    setEditTitle(note.title);
    setEditContent(note.content);
    onEdit(null);
  };

  if (isEditing) {
    return (
      <Card>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Title (optional)..."
          className="input w-full mb-3"
        />
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          className="input w-full resize-none mb-3"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="small" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="small" onClick={handleSave}>
            Save
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onEdit}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>
          {note.title || 'Untitled Note'}
        </h3>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="secondary" size="small" onClick={onEdit}>
            ✏️
          </Button>
          <Button variant="secondary" size="small" onClick={onDelete}>
            🗑️
          </Button>
        </div>
      </div>
      <p className="text-sm mb-3 whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
        {note.content}
      </p>
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {formatDate(note.timestamp)}
      </p>
    </Card>
  );
};

// List Note Component
const ListNoteCard = ({ note, onEdit, onDelete, onUpdate, isEditing, addListItem, toggleListItem, deleteListItem, formatDate }) => {
  const [newItemText, setNewItemText] = useState('');
  const [editTitle, setEditTitle] = useState(note.title);

  const handleAddItem = () => {
    if (newItemText.trim()) {
      addListItem(note.id, newItemText);
      setNewItemText('');
    }
  };

  const handleSave = () => {
    onUpdate(note.id, { title: editTitle });
  };

  const handleCancel = () => {
    setEditTitle(note.title);
    onEdit(null);
  };

  const completedCount = (note.content || []).filter(item => item.completed).length;
  const totalCount = (note.content || []).length;

  if (isEditing) {
    return (
      <Card>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="List title (optional)..."
          className="input w-full mb-3"
        />
        <div className="flex gap-2 justify-end mb-3">
          <Button variant="secondary" size="small" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="small" onClick={handleSave}>
            Save
          </Button>
        </div>
        
        {/* List Items (still functional in edit mode) */}
        <div className="space-y-2 mb-3">
          {(note.content || []).map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <button
                onClick={() => toggleListItem(note.id, item.id)}
                className="w-5 h-5 rounded border-2 flex items-center justify-center"
                style={{
                  borderColor: item.completed ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: item.completed ? 'var(--color-primary)' : 'transparent'
                }}
              >
                {item.completed && <span className="text-white text-xs">✓</span>}
              </button>
              <span
                className={`flex-1 ${item.completed ? 'line-through opacity-60' : ''}`}
                style={{ color: 'var(--color-text)' }}
              >
                {item.text}
              </span>
              <Button 
                variant="secondary" 
                size="small" 
                onClick={() => deleteListItem(note.id, item.id)}
              >
                ✕
              </Button>
            </div>
          ))}
        </div>

        {/* Add New Item */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
            placeholder="Add new item..."
            className="input flex-1"
          />
          <Button variant="primary" size="small" onClick={handleAddItem}>
            Add
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div 
        className="flex justify-between items-start mb-3 cursor-pointer" 
        onClick={onEdit}
      >
        <div>
          <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>
            {note.title || 'Untitled List'}
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {completedCount}/{totalCount} completed
          </p>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Button variant="secondary" size="small" onClick={onDelete}>
            🗑️
          </Button>
        </div>
      </div>

      {/* List Items */}
      <div className="space-y-2 mb-3">
        {(note.content || []).map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <button
              onClick={() => toggleListItem(note.id, item.id)}
              className="w-5 h-5 rounded border-2 flex items-center justify-center"
              style={{
                borderColor: item.completed ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: item.completed ? 'var(--color-primary)' : 'transparent'
              }}
            >
              {item.completed && <span className="text-white text-xs">✓</span>}
            </button>
            <span
              className={`flex-1 ${item.completed ? 'line-through opacity-60' : ''}`}
              style={{ color: 'var(--color-text)' }}
            >
              {item.text}
            </span>
            <Button 
              variant="secondary" 
              size="small" 
              onClick={() => deleteListItem(note.id, item.id)}
            >
              ×
            </Button>
          </div>
        ))}
      </div>

      {/* Add New Item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
          placeholder="Add new item..."
          className="flex-1 input"
        />
        <Button
          variant="primary"
          size="small"
          onClick={handleAddItem}
          disabled={!newItemText.trim()}
        >
          Add
        </Button>
      </div>

      <p className="text-xs mt-3" style={{ color: 'var(--color-text-secondary)' }}>
        {formatDate(note.timestamp)}
      </p>
    </Card>
  );
};

// Doodle Note Component
const DoodleNoteCard = ({ note, onView, onDelete, formatDate }) => {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onView}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>
          {note.title || 'Untitled Doodle'}
        </h3>
        <div onClick={(e) => e.stopPropagation()}>
          <Button variant="secondary" size="small" onClick={onDelete}>
            🗑️
          </Button>
        </div>
      </div>

      <div className="mb-3">
        <img
          src={note.content}
          alt={note.title || 'Doodle'}
          className="w-full rounded-lg border"
          style={{ border: '1px solid var(--color-border)' }}
        />
      </div>

      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {formatDate(note.timestamp)}
      </p>
    </Card>
  );
};
