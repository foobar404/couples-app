import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Button } from '../components/UI';
import { 
  MoodWidget, 
  NotesWidget, 
  LocationWidget,
  MessengerWidget,
  NotificationsWidget,
  ConnectionWidget, 
  PhotosWidget,
  GamesWidget,
  CalendarWidget,
  WidgetConfig 
} from '../components/widgets';
import { useApp } from '../utils/AppContext';
import { useNavigation } from '../utils/hooks';

export const Dashboard = () => {
  const { data, currentUser, partnerEmail, partnerData, needsSetup, updateSettings } = useApp();
  const { setActiveTab } = useNavigation();
  const navigate = useNavigate();
  const [isUpdatingWidgets, setIsUpdatingWidgets] = useState(false);
  
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format in local time
  const todaysMood = data.moods[today];
  const partnerMood = partnerData?.moods?.[today];
  
  // Get display name for personalized greeting
  // User sees the nickname their partner gave them (from partner's settings)
  const displayName = partnerData?.settings?.displayName || currentUser?.name;
  // User sees the nickname they gave their partner (from their own settings)
  const partnerDisplayName = data.settings?.displayName || 'Partner';
  
  // Get widget preferences (default to showing only mood widget)
  const dashboardWidgets = data.settings?.dashboardWidgets || ['mood'];
  
  // Get recent notes (last 3) - use shared notes
  const recentNotes = (data.sharedNotes || [])
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 3);

  // Get recent photos (last 3)
  const recentPhotos = (data.photos || [])
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 3);

  // Handle widget configuration updates
  const handleUpdateWidgets = async (newWidgets) => {
    setIsUpdatingWidgets(true);
    try {
      await updateSettings({ dashboardWidgets: newWidgets });
    } catch (error) {
      console.error('Failed to update widgets:', error);
      throw error;
    } finally {
      setIsUpdatingWidgets(false);
    }
  };

  // Widget components mapping
  const widgets = {
    mood: (
      <MoodWidget 
        key="mood"
        todaysMood={todaysMood}
        partnerMood={partnerMood}
        partnerDisplayName={partnerDisplayName}
        partnerEmail={partnerEmail}
      />
    ),
    messenger: (
      <MessengerWidget 
        key="messenger"
      />
    ),
    location: (
      <LocationWidget 
        key="location"
      />
    ),
    notifications: (
      <NotificationsWidget 
        key="notifications"
      />
    ),
    notes: (
      <NotesWidget 
        key="notes"
        recentNotes={recentNotes}
        currentUser={currentUser}
      />
    ),
    connection: (
      <ConnectionWidget 
        key="connection"
        lastUpdated={data.lastUpdated}
        formatRelativeTime={formatRelativeTime}
      />
    ),
    photos: (
      <PhotosWidget 
        key="photos"
        recentPhotos={recentPhotos}
        currentUser={currentUser}
      />
    ),
    games: (
      <GamesWidget 
        key="games"
      />
    ),
    calendar: (
      <CalendarWidget 
        key="calendar"
      />
    )
  };

  return (
    <div className="page py-4">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Good {getTimeOfDay()}{displayName ? `, ${displayName}` : ''}! 💕
      </h1>

      {/* Setup Prompt (if no partner connected yet) */}
      {needsSetup && currentUser && (
        <div className="card mb-6 bg-blue-50 border-blue-200">
          <div className="card__body">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">👫 Connect with your partner</h3>
                <p className="text-blue-700 text-sm">Set up your partner's email in settings to start sharing</p>
              </div>
              <Button variant="primary" size="small" onClick={() => navigate('/settings')}>
                Setup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Widget Configuration */}
      {currentUser && (
        <WidgetConfig 
          currentWidgets={dashboardWidgets}
          onUpdateWidgets={handleUpdateWidgets}
          isUpdating={isUpdatingWidgets}
        />
      )}

      <Grid columns="responsive" className="gap-4">
        {/* Render only selected widgets */}
        {dashboardWidgets.map(widgetKey => widgets[widgetKey]).filter(Boolean)}
      </Grid>

    </div>
  );
};

// Helper functions
const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

const formatRelativeTime = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return date.toLocaleDateString();
};
