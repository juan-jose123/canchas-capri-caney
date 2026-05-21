import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  const [notifications, setNotifications] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [settings, setSettings] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('adminToken') !== null;
  });

  // Initialize socket
  useEffect(() => {
    const s = io(window.location.origin, { 
      transports: ['websocket', 'polling'] 
    });
    setSocket(s);

    s.on('reservation-update', (data) => {
      if (data.type === 'new') {
        setReservations(prev => [...prev, data.reservation]);
      } else if (data.type === 'cancel') {
        setReservations(prev =>
          prev.map(r => r.id === data.reservation.id ? data.reservation : r)
        );
      } else if (data.type === 'payment') {
        setReservations(prev =>
          prev.map(r => r.id === data.reservation.id ? data.reservation : r)
        );
      }
    });

    return () => s.disconnect();
  }, []);

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load settings
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  const addNotification = useCallback((message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const login = useCallback(async (password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        setIsAdmin(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
  }, []);

  const value = {
    darkMode,
    setDarkMode,
    notifications,
    addNotification,
    reservations,
    setReservations,
    settings,
    socket,
    isAdmin,
    login,
    logout
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
