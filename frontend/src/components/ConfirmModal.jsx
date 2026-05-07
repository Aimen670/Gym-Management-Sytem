import React from 'react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger" // danger, warning, info
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          confirmBg: 'linear-gradient(135deg, #ff6b6b, #ff5252)',
          confirmHover: 'linear-gradient(135deg, #ff5252, #ff4444)',
          icon: '⚠️'
        };
      case 'warning':
        return {
          confirmBg: 'linear-gradient(135deg, #ffa726, #ff9800)',
          confirmHover: 'linear-gradient(135deg, #ff9800, #f57c00)',
          icon: '⚠️'
        };
      default:
        return {
          confirmBg: 'linear-gradient(135deg, #28c7b6, #20b3a5)',
          confirmHover: 'linear-gradient(135deg, #20b3a5, #18a395)',
          icon: 'ℹ️'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div 
      className="modal-backdrop" 
      onClick={handleBackdropClick}
    >
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-icon">{styles.icon}</div>
          <h3 className="modal-title">{title}</h3>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        
        <div className="modal-footer">
          <button
            type="button"
            className="modal-btn modal-btn-cancel"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="modal-btn modal-btn-confirm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              background: styles.confirmBg
            }}
            onMouseEnter={(e) => {
              e.target.style.background = styles.confirmHover;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = styles.confirmBg;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
