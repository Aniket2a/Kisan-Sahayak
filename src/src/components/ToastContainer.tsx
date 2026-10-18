import React from 'react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      className="container flash-container"
      style={{
        position: 'fixed',
        top: '80px',
        right: '1.5rem',
        zIndex: 10000,
        maxWidth: '420px',
        pointerEvents: 'none'
      }}
    >
      {toasts.map(toast => {
        let icon = 'fa-circle-info';
        if (toast.type === 'success') icon = 'fa-circle-check';
        else if (toast.type === 'danger') icon = 'fa-circle-exclamation';
        else if (toast.type === 'warning') icon = 'fa-triangle-exclamation';

        return (
          <div
            key={toast.id}
            className={`alert alert-${toast.type}`}
            style={{
              pointerEvents: 'auto',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-lg)',
              animation: 'pageFadeIn 0.25s ease-out',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <i className={`fa-solid ${icon}`}></i>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                opacity: 0.7,
                marginLeft: '0.75rem',
                fontSize: '0.9rem'
              }}
              title="Dismiss"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        );
      })}
    </div>
  );
};
