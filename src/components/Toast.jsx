import React from 'react';
import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, X } from 'lucide-react';

// Global toast manager
let addToastFunction = null;

export const showToast = (alert) => {
  if (addToastFunction) {
    addToastFunction(alert);
  }
};

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastFunction = (alert) => {
      const id = Date.now();
      setToasts(prev => [...prev, { ...alert, toastId: id }]);
      
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.toastId !== id));
      }, 4000);
    };

    return () => {
      addToastFunction = null;
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.toastId !== id));
  };

  const getIcon = (severity) => {
    switch (severity) {
      case 'high': return <ShieldAlert className="text-brand-danger shrink-0" size={20} />;
      case 'medium': return <AlertTriangle className="text-brand-warning shrink-0" size={20} />;
      case 'low': return <ShieldCheck className="text-brand-safe shrink-0" size={20} />;
      default: return <AlertTriangle className="text-brand-purple shrink-0" size={20} />;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div 
          key={toast.toastId} 
          className="bg-brand-surface border border-brand-border shadow-lg shadow-brand-purple/10 rounded-lg p-4 w-80 animate-[slideInRight_0.3s_ease-out] flex items-start gap-3 relative"
        >
          {getIcon(toast.severity)}
          <div className="flex-1 min-w-0 pr-4">
            {toast.message ? (
              <p className="text-sm font-medium text-brand-text-primary leading-relaxed">
                {toast.message}
              </p>
            ) : (
              <>
                <h4 className="text-sm font-bold text-brand-text-primary truncate">
                  🚨 New report: {toast.type}
                </h4>
                <p className="text-xs text-brand-text-secondary mt-1 truncate">
                  at {toast.location}
                </p>
              </>
            )}
          </div>
          <button 
            onClick={() => removeToast(toast.toastId)}
            className="absolute top-2 right-2 text-brand-text-muted hover:text-brand-text-primary transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
