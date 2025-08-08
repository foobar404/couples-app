import React from 'react';
import { Widget } from '../UI';
import { MOODS } from '../MoodSelector';

export const MoodWidget = ({ 
  todaysMood, 
  partnerMood, 
  partnerDisplayName = 'Partner', 
  partnerEmail 
}) => {
  return (
    <Widget
      title="Today's Moods"
      action="Tap to update"
      to="/mood"
    >
      <div className="py-4">
        {/* Yin-Yang Style Mood Display */}
        <div className="mood-yin-yang">
          <div className="mood-circle">
            {/* Left side - Your mood */}
            <div className="mood-half mood-half--left">
              <div className="mood-display">
                {todaysMood ? (
                  <div className="mood-emoji">{MOODS.find(m => m.value === todaysMood)?.emoji || '?'}</div>
                ) : (
                  <div className="mood-emoji">?</div>
                )}
                <div className="mood-label">You</div>
              </div>
            </div>
            
            {/* Right side - Partner's mood */}
            <div className="mood-half mood-half--right">
              <div className="mood-display">
                {partnerMood ? (
                  <div className="mood-emoji">{MOODS.find(m => m.value === partnerMood)?.emoji || '?'}</div>
                ) : (
                  <div className="mood-emoji">?</div>
                )}
                <div className="mood-label">{partnerDisplayName}</div>
              </div>
            </div>
            
            {/* Center divider */}
            <div className="mood-divider"></div>
          </div>
        </div>

        {/* Connection message for single users */}
        {!partnerEmail && (
          <div className="text-center mt-4">
            <p className="text-gray-500 text-sm">
              Connect with your partner to complete the circle! 💕
            </p>
          </div>
        )}
      </div>
    </Widget>
  );
};
