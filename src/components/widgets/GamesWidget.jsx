import React from 'react';
import { Card, Button } from '../UI';
import { useApp } from '../../utils/AppContext';
import { useNavigation } from '../../utils/hooks';

export const GamesWidget = () => {
  const { data, partnerData } = useApp();
  const { navigateTo } = useNavigation();

  // Get recent game activity or scores
  const gameData = data.games || { scores: {}, history: [] };
  const partnerGameData = partnerData?.games || { scores: {}, history: [] };
  
  // Get the most recent game or highest score
  const recentActivity = gameData.history?.[0] || null;
  const totalGamesPlayed = gameData.history?.length || 0;
  const partnerGamesPlayed = partnerGameData.history?.length || 0;

  const handleViewGames = () => {
    navigateTo('/games');
  };

  return (
    <Card className="games-widget">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎮</span>
            <h3 className="font-semibold text-sm">Games</h3>
          </div>
          <Button 
            onClick={handleViewGames}
            className="btn--small btn--secondary"
          >
            Play
          </Button>
        </div>

        <div className="space-y-2">
          {recentActivity ? (
            <div className="text-sm">
              <div className="text-textSecondary">Last played:</div>
              <div className="font-medium">{recentActivity.game || 'Game'}</div>
              {recentActivity.score && (
                <div className="text-xs text-textSecondary">
                  Score: {recentActivity.score}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-textSecondary">
              No games played yet
            </div>
          )}

          <div className="flex justify-between text-xs text-textSecondary pt-2 border-t border-border">
            <span>You: {totalGamesPlayed} games</span>
            <span>Partner: {partnerGamesPlayed} games</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
