import React from 'react';
import EnrollButton from './EnrollButton';

const ClassCard = ({ 
  classItem, 
  enrollments, 
  memberId, 
  enrollmentBusy, 
  onEnroll, 
  onUnenroll 
}) => {
  const isEnrolled = enrollments.some(e => e.member_id === memberId);
  const availableSpots = classItem.capacity - enrollments.length;
  const enrollment = enrollments.find(e => e.member_id === memberId);
  
  const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (value) => {
    if (value == null) return '';
    if (typeof value === 'string' && /^\d{1,2}:\d{2}/.test(value)) {
      const [h, m] = value.split(':');
      const hour = String(parseInt(h, 10)).padStart(2, '0');
      return `${hour}:${m.slice(0, 2)}`;
    }
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return String(value);
  };

  return (
    <div className="class-card">
      <div className="class-card-header">
        <div className="class-title-section">
          <h3 className="class-name">{classItem.class_name}</h3>
          <div className="class-meta">
            <span className="class-trainer">
              {classItem.trainer_name || 'Not assigned'}
            </span>
          </div>
        </div>
        <div className="class-capacity-section">
          <div className={`capacity-indicator ${availableSpots <= 3 ? 'low' : 'good'}`}>
            <span className="capacity-number">{availableSpots}</span>
            <span className="capacity-label">spots left</span>
          </div>
          <div className="capacity-bar">
            <div 
              className="capacity-fill" 
              style={{ width: `${(enrollments.length / classItem.capacity) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="class-card-body">
        <div className="class-schedule">
          <div className="schedule-item">
            <div className="schedule-icon">📅</div>
            <div className="schedule-details">
              <span className="schedule-label">Date</span>
              <span className="schedule-value">{formatDate(classItem.schedule_date)}</span>
            </div>
          </div>
          <div className="schedule-item">
            <div className="schedule-icon">⏰</div>
            <div className="schedule-details">
              <span className="schedule-label">Time</span>
              <span className="schedule-value">{formatTime(classItem.schedule_time)}</span>
            </div>
          </div>
          <div className="schedule-item">
            <div className="schedule-icon">👥</div>
            <div className="schedule-details">
              <span className="schedule-label">Capacity</span>
              <span className="schedule-value">{enrollments.length}/{classItem.capacity}</span>
            </div>
          </div>
        </div>

        <div className="enrolled-members">
          <h4 className="enrolled-title">Enrolled Members</h4>
          {enrollments.length === 0 ? (
            <p className="no-enrolled">No one enrolled yet</p>
          ) : (
            <div className="members-list">
              {enrollments.slice(0, 3).map((enrollment) => (
                <div key={enrollment.enrollment_id} className="member-avatar">
                  {enrollment.full_name ? enrollment.full_name.charAt(0).toUpperCase() : '?'}
                </div>
              ))}
              {enrollments.length > 3 && (
                <div className="member-more">
                  +{enrollments.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="class-card-footer">
        <EnrollButton
          isEnrolled={isEnrolled}
          availableSpots={availableSpots}
          enrollmentBusy={enrollmentBusy}
          onEnroll={() => onEnroll(classItem.class_id)}
          onUnenroll={onUnenroll}
          enrollmentId={enrollment?.enrollment_id}
        />
      </div>
    </div>
  );
};

export default ClassCard;
