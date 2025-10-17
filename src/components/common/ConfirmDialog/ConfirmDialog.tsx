import React, { useCallback } from 'react';
import { useLanguage } from '../../../core/i18n/LanguageProvider';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'warning',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const { t } = useLanguage();

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  }, [onCancel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      onConfirm();
    }
  }, [onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div 
      className={styles.overlay} 
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div className={`${styles.dialog} ${styles[`dialog--${variant}`]}`}>
        <div className={styles.header}>
          <h2 id="confirm-dialog-title" className={styles.title}>
            {title}
          </h2>
          
          <button
            className={styles.closeButton}
            onClick={onCancel}
            aria-label={t('dialog.close')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div className={styles.body}>
          <p id="confirm-dialog-message" className={styles.message}>
            {message}
          </p>
        </div>
        
        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            onClick={onCancel}
          >
            {cancelText || t('dialog.cancel')}
          </button>
          
          <button
            className={`${styles.confirmButton} ${styles[`confirmButton--${variant}`]}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmText || t('dialog.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}