import { useRef, useEffect } from 'react';
import { useLanguage } from '../../../../core/i18n/LanguageProvider';
import styles from './DataHeaderMenu.module.css';

export type SortDirection = 'asc' | 'desc' | null;

interface DataHeaderMenuProps {
  columnKey: string;
  isOpen: boolean;
  onClose: () => void;
  onHideColumn: () => void;
  onSendToExplorer: () => void;
  onLockType: () => void;
}

export function DataHeaderMenu({ 
  isOpen, 
  onClose, 
  onHideColumn, 
  onSendToExplorer, 
  onLockType
}: DataHeaderMenuProps) {
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems = [
    {
      key: 'sendToExplorer',
      label: t('table.headerMenu.sendToExplorer'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 12l2 2 4-4"/>
          <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.68.94 6.36 2.64L21 8"/>
        </svg>
      ),
      onClick: onSendToExplorer
    },
    {
      key: 'lockType',
      label: t('table.headerMenu.lockType'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <circle cx="12" cy="16" r="1"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
      onClick: onLockType
    },
    {
      key: 'separator1',
      separator: true
    },
    {
      key: 'hide',
      label: t('table.headerMenu.hide'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ),
      onClick: onHideColumn,
      destructive: true
    }
  ];

  return (
    <div className={styles.menuOverlay}>
      <div ref={menuRef} className={styles.menu} role="menu">
        {menuItems.map((item) => {
          if (item.separator) {
            return <div key={item.key} className={styles.separator} />;
          }

          return (
            <button
              key={item.key}
              className={`${styles.menuItem} ${item.destructive ? styles.menuItemDestructive : ''}`}
              onClick={() => {
                item.onClick?.();
                onClose();
              }}
              role="menuitem"
            >
              <span className={styles.menuIcon}>
                {item.icon}
              </span>
              <span className={styles.menuLabel}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}