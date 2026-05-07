import React, { useState } from 'react';
import ConfirmModal from './ConfirmModal';

const EnrollButton = ({ 
  isEnrolled, 
  availableSpots, 
  enrollmentBusy, 
  onEnroll, 
  onUnenroll,
  enrollmentId 
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (isEnrolled) {
    return (
      <>
        <div className="enroll-button-container enrolled">
          <span className="enroll-status-badge">You're enrolled!</span>
          <button
            type="button"
            className="enroll-button unenroll-btn"
            onClick={() => setShowConfirmModal(true)}
            disabled={enrollmentBusy}
          >
            {enrollmentBusy ? 'Processing...' : 'Unenroll'}
          </button>
        </div>
        
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={() => onUnenroll(enrollmentId)}
          title="Unenroll from Class"
          message="Are you sure you want to unenroll from this class? Your spot will be available for other members."
          confirmText="Unenroll"
          cancelText="Cancel"
          type="danger"
        />
      </>
    );
  }

  return (
    <button
      type="button"
      className={`enroll-button primary-btn ${availableSpots === 0 ? 'disabled' : ''}`}
      onClick={onEnroll}
      disabled={enrollmentBusy || availableSpots === 0}
    >
      {availableSpots === 0 ? 'Class Full' : enrollmentBusy ? 'Enrolling...' : 'Enroll Now'}
    </button>
  );
};

export default EnrollButton;
