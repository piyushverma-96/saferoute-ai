import React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

const AlertsContext = createContext();

const initialAlerts = [
  {
    id: 1,
    type: "Harassment",
    location: "Rajwada, Indore",
    time: "2 hours ago",
    severity: "high",
    description: "Unsafe area reported near market",
    reportedBy: "Anonymous",
    timestamp: Date.now() - 7200000,
    confirmations: 0
  },
  {
    id: 2,
    type: "Poor Lighting",
    location: "Vijay Nagar, Indore",
    time: "4 hours ago",
    severity: "medium", 
    description: "Street lights not working on main road",
    reportedBy: "Anonymous",
    timestamp: Date.now() - 14400000,
    confirmations: 0
  },
  {
    id: 3,
    type: "Suspicious Activity",
    location: "Palasia, Indore",
    time: "6 hours ago",
    severity: "high",
    description: "Reported by multiple users",
    reportedBy: "Anonymous",
    timestamp: Date.now() - 21600000,
    confirmations: 0
  },
  {
    id: 4,
    type: "Safe Zone",
    location: "Sapna Sangeeta, Indore",
    time: "1 hour ago",
    severity: "low",
    description: "Well lit area, police presence",
    reportedBy: "Community",
    timestamp: Date.now() - 3600000,
    confirmations: 0
  },
  {
    id: 5,
    type: "Crowd Alert",
    location: "MG Road, Indore",
    time: "30 mins ago",
    severity: "medium",
    description: "Large gathering, stay alert",
    reportedBy: "Anonymous",
    timestamp: Date.now() - 1800000,
    confirmations: 0
  }
];

export const AlertsProvider = ({ children }) => {
  const [alerts, setAlerts] = useState(() => {
    // Load from localStorage if exists
    const saved = localStorage.getItem('saferoute_alerts');
    return saved ? JSON.parse(saved) : initialAlerts;
  });

  // Save to localStorage whenever alerts change
  useEffect(() => {
    localStorage.setItem('saferoute_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Cross-tab real-time sync
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'saferoute_alerts') {
        try {
          const newAlerts = JSON.parse(e.newValue);
          if (newAlerts) {
            setAlerts(newAlerts);
          }
        } catch (err) {
          console.error("Failed to parse cross-tab alerts update");
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addAlert = (newAlert) => {
    const user = JSON.parse(localStorage.getItem('saferoute_user'));
    
    const alert = {
      ...newAlert,
      id: Date.now(),
      time: "Just now",
      timestamp: Date.now(),
      reportedBy: newAlert.anonymous ? "Anonymous" : (user?.name || "Anonymous"),
      confirmations: 0
    };
    
    // Add to TOP of feed (newest first)
    setAlerts(prev => [alert, ...prev]);
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const confirmAlert = (id) => {
    setAlerts(prev => prev.map(alert => {
      if (alert.id === id) {
        return { ...alert, confirmations: (alert.confirmations || 0) + 1 };
      }
      return alert;
    }));
  };

  return (
    <AlertsContext.Provider value={{ alerts, addAlert, removeAlert, confirmAlert }}>
      {children}
    </AlertsContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts must be used within AlertsProvider');
  }
  return context;
};

export default AlertsContext;
