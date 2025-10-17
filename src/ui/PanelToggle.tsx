import { useLanguage } from '../core/i18n/LanguageProvider';
import styles from './PanelToggle.module.css';

interface PanelToggleProps {
  position: 'left' | 'right' | 'top' | 'bottom';
  isOpen: boolean;
  onClick: () => void;
  ariaLabel: string;
  inHeader?: boolean;
  variant?: 'default' | 'dataExplorer';
}

export function PanelToggle({ position, isOpen, onClick, ariaLabel, inHeader = false, variant = 'default' }: PanelToggleProps) {
  const { t } = useLanguage();
  
  const getChevronDirection = () => {
    if (inHeader) {
      // Header'da panel kapatma yönü
      switch (position) {
        case 'left':
          return 'left';  // Sol paneli kapat (sola)
        case 'right':
          return 'right'; // Sağ paneli kapat (sağa)
        case 'bottom':
          return 'down';  // Explorer'ı kapat (aşağı)
        default:
          return 'left';
      }
    } else {
      // Gutter'da panel açma yönü
      switch (position) {
        case 'left':
          return 'right'; // Sol paneli aç (sağdan)
        case 'right':
          return 'left';  // Sağ paneli aç (soldan)
        case 'top':
          return 'down';  // Explorer'ı aç (aşağı)
        case 'bottom':
          return 'up';    // Explorer'ı aç (yukarı)
      }
    }
  };

  const chevronDirection = getChevronDirection();
  
  const getButtonClasses = () => {
    let classes = [styles.panelToggle];
    
    if (inHeader) {
      classes.push(styles['panelToggle--headerToggle']);
      if (isOpen) {
        classes.push(styles['panelToggle--open']);
      }
    } else {
      if (variant === 'dataExplorer') {
        classes.push(styles['panelToggle--dataExplorerEdge']);
      } else {
        classes.push(styles[`panelToggle--${position}Edge`]);
      }
      classes.push(styles['panelToggle--gutter']);
      if (!isOpen) {
        classes.push(styles['panelToggle--closed']);
      }
    }
    
    return classes.join(' ');
  };

  const getIcon = () => {
    if (inHeader && isOpen) {
      // Panel açıkken kapatma ikonu (X veya minimize)
      return (
        <svg className={styles.panelToggle__icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M6 18 L18 6" />
          <path d="M6 6 L18 18" />
        </svg>
      );
    } else {
      // Panel kapalıyken açma ikonu (chevron) veya gutter toggle
      const getChevronPath = () => {
        switch (chevronDirection) {
          case 'left':
            return 'M15 18 L9 12 L15 6';
          case 'right':
            return 'M9 18 L15 12 L9 6';
          case 'up':
            return 'M18 15 L12 9 L6 15';
          case 'down':
            return 'M6 9 L12 15 L18 9';
        }
      };

      return (
        <svg className={styles.panelToggle__icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d={getChevronPath()} />
        </svg>
      );
    }
  };

  const getTooltip = () => {
    if (inHeader) {
      return isOpen ? t('panel.toggle.close') : t('panel.toggle.open');
    }
    return t(ariaLabel);
  };

  return (
    <button
      className={getButtonClasses()}
      onClick={onClick}
      aria-label={getTooltip()}
      title={getTooltip()}
    >
      {getIcon()}
    </button>
  );
}