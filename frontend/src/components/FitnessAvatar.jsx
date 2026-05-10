import React, { useState, useEffect } from 'react';
import './FitnessAvatar.css';

const FitnessAvatar = ({ memberId }) => {
  const [avatarData, setAvatarData] = useState(null);
  const [avatarLevels, setAvatarLevels] = useState([]);
  const [progressHistory, setProgressHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!memberId) return;
    loadAvatarData();
  }, [memberId]);

  const loadAvatarData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [avatarRes, levelsRes, historyRes] = await Promise.all([
        fetch(`/api/member/${memberId}/avatar`),
        fetch('/api/avatar/levels'),
        fetch(`/api/member/${memberId}/avatar/progress`)
      ]);

      const avatarData = await avatarRes.json();
      const levelsData = await levelsRes.json();
      const historyData = await historyRes.json();

      if (avatarRes.ok) {
        setAvatarData(avatarData);
      } else {
        throw new Error(avatarData.message || 'Failed to load avatar data');
      }

      if (levelsRes.ok) {
        setAvatarLevels(levelsData);
      }

      if (historyRes.ok) {
        setProgressHistory(historyData);
      }

    } catch (err) {
      console.error('Error loading avatar data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarImage = (level) => {
    // For now, use emoji-based avatars based on level
    const avatarEmojis = {
      1: '🌱', // Beginner - seedling
      2: '🌿', // Novice - small plant
      3: '🌳', // Intermediate - tree
      4: '💪', // Advanced - muscle
      5: '🏋️', // Expert - weightlifter
      6: '🎯', // Elite - target
      7: '🏆', // Master - trophy
      8: '⭐', // Champion - star
      9: '👑', // Legend - crown
      10: '🔥' // Icon - fire
    };
    return avatarEmojis[level] || '🌱';
  };

  const getLevelColor = (level) => {
    const colors = {
      1: '#8B4513', // Brown
      2: '#228B22', // Forest Green
      3: '#32CD32', // Lime Green
      4: '#FFD700', // Gold
      5: '#FF8C00', // Dark Orange
      6: '#FF6347', // Tomato
      7: '#4B0082', // Indigo
      8: '#1E90FF', // Dodger Blue
      9: '#FF1493', // Deep Pink
      10: '#FF4500' // Orange Red
    };
    return colors[level] || '#8B4513';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="avatar-container loading">
        <div className="loading-spinner">Loading avatar...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="avatar-container error">
        <div className="error-message">Error: {error}</div>
        <button onClick={loadAvatarData} className="retry-button">Retry</button>
      </div>
    );
  }

  if (!avatarData) {
    return (
      <div className="avatar-container empty">
        <div className="empty-message">No avatar data available</div>
      </div>
    );
  }

  return (
    <div className="avatar-container">
      <div className="avatar-header">
        <h3>Your Fitness Avatar</h3>
        <button 
          className="history-toggle"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? 'Hide' : 'Show'} Progress History
        </button>
      </div>

      <div className="avatar-main">
        <div className="avatar-visual" style={{ borderColor: getLevelColor(avatarData.current_level) }}>
          <div className="avatar-image">
            {getAvatarImage(avatarData.current_level)}
          </div>
          <div className="avatar-level-badge" style={{ backgroundColor: getLevelColor(avatarData.current_level) }}>
            Level {avatarData.current_level}
          </div>
        </div>

        <div className="avatar-info">
          <h4 className="avatar-title">{avatarData.level_name}</h4>
          <p className="avatar-description">{avatarData.description}</p>
          
          <div className="avatar-stats">
            <div className="stat-item">
              <span className="stat-label">Total Points:</span>
              <span className="stat-value">{avatarData.total_points}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Workout Points:</span>
              <span className="stat-value">{avatarData.workout_points}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Measurement Points:</span>
              <span className="stat-value">{avatarData.measurement_points}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Goal Points:</span>
              <span className="stat-value">{avatarData.goal_points}</span>
            </div>
          </div>

          {avatarData.progressToNextLevel && avatarData.progressToNextLevel.nextLevel && (
            <div className="progress-section">
              <h5>Progress to Level {avatarData.progressToNextLevel.nextLevel}</h5>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill"
                  style={{ 
                    width: `${avatarData.progressToNextLevel.progress}%`,
                    backgroundColor: getLevelColor(avatarData.current_level)
                  }}
                />
              </div>
              <div className="progress-text">
                {avatarData.progressToNextLevel.pointsToNext} points to next level
              </div>
            </div>
          )}

          <div className="last-updated">
            Last updated: {formatDate(avatarData.last_updated)}
          </div>
        </div>
      </div>

      {showHistory && (
        <div className="progress-history">
          <h4>Progress History</h4>
          {progressHistory.length === 0 ? (
            <p>No progress history available</p>
          ) : (
            <div className="history-list">
              {progressHistory.slice(0, 10).map((item) => (
                <div key={item.progress_id} className="history-item">
                  <div className="history-date">{formatDate(item.created_at)}</div>
                  <div className="history-details">
                    <span className="history-points">
                      {item.points_earned > 0 && '+'}{item.points_earned} points
                    </span>
                    <span className="history-reason">{item.reason}</span>
                    {item.old_level && item.new_level && (
                      <span className="history-level-up">
                        🎉 Level up! {item.old_level} → {item.new_level}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="avatar-levels-reference">
        <h4>All Avatar Levels</h4>
        <div className="levels-grid">
          {avatarLevels.map((level) => (
            <div 
              key={level.level_id} 
              className={`level-item ${level.level_id <= avatarData.current_level ? 'unlocked' : 'locked'}`}
            >
              <div className="level-emoji">{getAvatarImage(level.level_id)}</div>
              <div className="level-info">
                <div className="level-name">Level {level.level_id}: {level.level_name}</div>
                <div className="level-range">{level.min_points} - {level.max_points} points</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FitnessAvatar;
