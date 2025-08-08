import React, { useState } from 'react';

export const NavigationMenu = ({ isOpen, onClose, allTabs, pinnedTabs, onTogglePin, onNavigate, activeTab }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose}>
      <div className="navigation-menu" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">All Pages</h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Pages List */}
        <div className="space-y-2">
          {allTabs.map(tab => {
            const isPinned = pinnedTabs.includes(tab.id);
            const isActive = activeTab === tab.id;
            
            return (
              <div 
                key={tab.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isActive 
                    ? 'bg-pink-50 border-pink-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <button
                  onClick={() => {
                    onNavigate(tab.id);
                    onClose();
                  }}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <span className="text-xl">{tab.icon}</span>
                  <div>
                    <div className={`font-medium ${isActive ? 'text-pink-700' : 'text-gray-900'}`}>
                      {tab.label}
                    </div>
                    {tab.description && (
                      <div className="text-xs text-gray-500">{tab.description}</div>
                    )}
                  </div>
                </button>
                
                <button
                  onClick={() => onTogglePin(tab.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    isPinned 
                      ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={isPinned ? 'Unpin from navigation' : 'Pin to navigation'}
                >
                  {isPinned ? '📌' : '📍'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 Pin your favorite pages to show them in the bottom navigation bar. You can pin up to 5 pages.
          </p>
        </div>
      </div>
    </div>
  );
};
