import React, { useState } from 'react';
import { Button } from '../UI';

export const WidgetConfig = ({ 
  currentWidgets = [], 
  onUpdateWidgets, 
  isUpdating = false 
}) => {
  const [selectedWidgets, setSelectedWidgets] = useState(currentWidgets);
  const [showConfig, setShowConfig] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Available widgets
  const availableWidgets = [
    { id: 'mood', name: 'Today\'s Mood', emoji: '😊', description: 'Track your daily emotions' },
    { id: 'notes', name: 'Recent Notes', emoji: '📝', description: 'View your latest shared notes' },
    { id: 'connection', name: 'Connection Status', emoji: '💖', description: 'See your sync status' },
    { id: 'tasks', name: 'Notes', emoji: '✅', description: 'Track shared notes and tasks' }
  ];

  const handleWidgetToggle = (widgetId) => {
    const newWidgets = selectedWidgets.includes(widgetId)
      ? selectedWidgets.filter(id => id !== widgetId)
      : [...selectedWidgets, widgetId];
    
    setSelectedWidgets(newWidgets);
  };

  const handleSave = async () => {
    try {
      await onUpdateWidgets(selectedWidgets);
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
        setShowConfig(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to update widgets:', error);
    }
  };

  const hasChanges = JSON.stringify(selectedWidgets.sort()) !== JSON.stringify(currentWidgets.sort());

  if (!showConfig) {
    return (
      <div className="mb-4">
        <Button 
          variant="secondary" 
          size="small"
          onClick={() => setShowConfig(true)}
        >
          ⚙️ Customize Widgets
        </Button>
      </div>
    );
  }

  return (
    <div className="card mb-6 bg-gray-50 border-gray-200">
      <div className="card__header">
        <h3 className="card__title">Dashboard Widgets</h3>
      </div>
      <div className="card__body">
        <p className="text-gray-600 mb-4 text-sm">
          Choose which widgets to show on your dashboard
        </p>
        
        <div className="space-y-2">
          {availableWidgets.map(widget => (
            <div key={widget.id} className="flex items-center justify-between p-2 border rounded-lg bg-white">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{widget.emoji}</span>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{widget.name}</h4>
                  <p className="text-xs text-gray-600">{widget.description}</p>
                </div>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedWidgets.includes(widget.id)}
                  onChange={() => handleWidgetToggle(widget.id)}
                  className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="ml-2 text-xs text-gray-700">
                  {selectedWidgets.includes(widget.id) ? 'On' : 'Off'}
                </span>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {selectedWidgets.length} of {availableWidgets.length} widgets enabled
          </p>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="small"
              onClick={() => {
                setSelectedWidgets(currentWidgets);
                setShowConfig(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="small"
              onClick={handleSave}
              disabled={isUpdating || !hasChanges}
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {updateSuccess && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
            <span className="text-green-700">✅ Dashboard updated!</span>
          </div>
        )}
      </div>
    </div>
  );
};
