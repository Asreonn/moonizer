import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useLanguage } from '../../../core/i18n/LanguageProvider';
import styles from './Toast.module.css';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const { t } = useLanguage();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { ...toastData, id };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto-hide after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Toast Container */}
      <div className={styles.toastContainer}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[`toast--${toast.type}`]}`}
          >
            <div className={styles.toastMessage}>
              {toast.message}
            </div>
            
            {toast.action && (
              <button 
                className={styles.toastAction}
                onClick={() => {
                  toast.action!.onClick();
                  hideToast(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            )}
            
            <button
              className={styles.toastClose}
              onClick={() => hideToast(toast.id)}
              aria-label={t('toast.close')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}