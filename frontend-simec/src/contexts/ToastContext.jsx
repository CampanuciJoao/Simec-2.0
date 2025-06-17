// src/contexts/ToastContext.jsx
import React, { createContext, useState, useContext, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  return useContext(ToastContext);
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(currentToasts => [...currentToasts, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }, []);

  const value = { addToast, removeToast, toasts };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};