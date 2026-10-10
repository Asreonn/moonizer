import { useEffect, useRef, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { calculatePopoverPosition, createPopoverObserver, PopoverPosition, PopoverDimensions } from '../../../core/popover/popoverPositioning';
import { useLanguage } from '../../../core/i18n/LanguageProvider';
import styles from './Popover.module.css';

interface PopoverProps {
  isOpen: boolean;
  anchorElement: HTMLElement | null;
  children: ReactNode;
  onClose: () => void;
  className?: string;
  initialDimensions?: PopoverDimensions;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export function Popover({
  isOpen,
  anchorElement,
  children,
  onClose,
  className,
  initialDimensions = { width: 280, height: 200 },
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy
}: PopoverProps) {
  const { t } = useLanguage();
  const popoverRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const cleanupObserverRef = useRef<(() => void) | null>(null);

  // Handle positioning and repositioning
  const updatePosition = useCallback((position: PopoverPosition) => {
    const popover = popoverRef.current;
    if (!popover) return;

    popover.style.left = `${position.x}px`;
    popover.style.top = `${position.y}px`;
    popover.style.maxWidth = `${position.maxWidth}px`;
    popover.style.maxHeight = `${position.maxHeight}px`;
    
    // Add data attributes for styling based on placement and scroll needs
    popover.dataset.placement = position.placement;
    popover.dataset.requiresScroll = position.requiresScroll.toString();
  }, []);

  const getDimensions = useCallback((): PopoverDimensions => {
    const popover = popoverRef.current;
    if (!popover) return initialDimensions;
    
    return {
      width: popover.scrollWidth || initialDimensions.width,
      height: popover.scrollHeight || initialDimensions.height
    };
  }, [initialDimensions]);

  // Position popover when it opens or anchor changes
  useEffect(() => {
    if (!isOpen || !anchorElement || !popoverRef.current) return;

    const position = calculatePopoverPosition(anchorElement, getDimensions());
    updatePosition(position);

    // Set up observer for repositioning on scroll/resize
    cleanupObserverRef.current = createPopoverObserver(
      anchorElement,
      popoverRef.current,
      updatePosition,
      getDimensions
    );

    return () => {
      if (cleanupObserverRef.current) {
        cleanupObserverRef.current();
        cleanupObserverRef.current = null;
      }
    };
  }, [isOpen, anchorElement, updatePosition, getDimensions]);

  // Focus management
  useEffect(() => {
    if (!isOpen) return;

    // Store previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element in popover
    const popover = popoverRef.current;
    if (popover) {
      const focusableElements = popover.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0] as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    return () => {
      // Return focus to previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  // Keyboard event handlers
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === 'Tab') {
      // Focus trap
      const popover = popoverRef.current;
      if (!popover) return;

      const focusableElements = Array.from(
        popover.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ) as HTMLElement[];

      if (focusableElements.length === 0) return;

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      // Arrow key navigation between focusable elements
      const popover = popoverRef.current;
      if (!popover) return;

      const focusableElements = Array.from(
        popover.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ) as HTMLElement[];

      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
      if (currentIndex === -1) return;

      event.preventDefault();
      let nextIndex: number;

      if (event.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % focusableElements.length;
      } else {
        nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
      }

      focusableElements[nextIndex].focus();
    }
  }, [isOpen, onClose]);

  // Click outside handler
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (!isOpen) return;

    const popover = popoverRef.current;
    const target = event.target as Node;

    if (popover && !popover.contains(target) && anchorElement && !anchorElement.contains(target)) {
      onClose();
    }
  }, [isOpen, onClose, anchorElement]);

  // Set up global event listeners
  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleKeyDown, handleClickOutside]);

  // Handle route changes (close popover)
  useEffect(() => {
    if (!isOpen) return;

    const handleRouteChange = () => onClose();
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const popoverContent = (
    <div
      ref={popoverRef}
      className={`${styles.popover} ${className || ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-testid="popover"
    >
      <div className={styles.popoverContent}>
        {children}
      </div>
      
      {/* Accessibility hints */}
      <div className={styles.accessibilityHints}>
        <span className={styles.screenReaderOnly}>
          {t('popover.hint.escToClose')}
        </span>
        <span className={styles.screenReaderOnly}>
          {t('popover.hint.scroll')}
        </span>
      </div>
    </div>
  );

  // Render in portal to body to avoid clipping
  return createPortal(popoverContent, document.body);
}