import React, { useEffect, useState } from 'react';

const Toast = ({ message, type = 'success', duration = 0, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true);

    // Only auto-dismiss if duration is greater than 0
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Allow exit animation to complete before calling onClose
        setTimeout(onClose, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'linear-gradient(135deg, #28c7b6, #20b3a5)',
          icon: '✓',
          borderColor: 'rgba(40, 199, 182, 0.3)'
        };
      case 'error':
        return {
          bg: 'linear-gradient(135deg, #ff6b6b, #ff5252)',
          icon: '✕',
          borderColor: 'rgba(255, 107, 107, 0.3)'
        };
      case 'warning':
        return {
          bg: 'linear-gradient(135deg, #ffa726, #ff9800)',
          icon: '⚠',
          borderColor: 'rgba(255, 167, 38, 0.3)'
        };
      case 'info':
        return {
          bg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          icon: 'ℹ',
          borderColor: 'rgba(59, 130, 246, 0.3)'
        };
      default:
        return {
          bg: 'linear-gradient(135deg, #28c7b6, #20b3a5)',
          icon: '✓',
          borderColor: 'rgba(40, 199, 182, 0.3)'
        };
    }
  };

  const styles = getTypeStyles();

  // Format message to handle newlines and basic markdown
  const formatMessage = (text) => {
    return text.split('\n').map((line, index) => {
      // Handle bold text
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <div key={index} dangerouslySetInnerHTML={{ __html: formattedLine }} />
      );
    });
  };

  return (
    <div className={`toast-container ${isVisible ? 'toast-visible' : 'toast-hidden'}`}>
      <div 
        className="toast-content toast-multiline"
        style={{
          background: styles.bg,
          borderColor: styles.borderColor
        }}
      >
        <div className="toast-icon">
          {styles.icon}
        </div>
        <div className="toast-message toast-message-multiline">
          {formatMessage(message)}
        </div>
        <button
          className="toast-close"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
