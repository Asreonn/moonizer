import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../core/i18n/LanguageProvider';
import styles from './AnalyticsTooltip.module.css';

interface AnalyticsTooltipProps {
  children: React.ReactNode;
  metricKey: string;
  className?: string;
}

export function AnalyticsTooltip({ children, metricKey, className }: AnalyticsTooltipProps) {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsVisible(true);
    updatePosition(e);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isVisible) {
      updatePosition(e);
    }
  };

  const updatePosition = (e: React.MouseEvent) => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Position tooltip near mouse cursor (slightly offset)
    let x = e.clientX + 12;
    let y = e.clientY - 8;

    // Adjust if tooltip would go off screen horizontally
    if (x + tooltipRect.width > viewportWidth - 20) {
      x = e.clientX - tooltipRect.width - 12;
    }
    
    // Adjust if tooltip would go off screen vertically
    if (y + tooltipRect.height > viewportHeight - 20) {
      y = e.clientY - tooltipRect.height - 12;
    }

    // Ensure tooltip stays within bounds
    x = Math.max(10, Math.min(x, viewportWidth - tooltipRect.width - 10));
    y = Math.max(10, Math.min(y, viewportHeight - tooltipRect.height - 10));
    
    setPosition({ x, y });
  };

  useEffect(() => {
    const handleScroll = () => setIsVisible(false);
    const handleResize = () => setIsVisible(false);

    if (isVisible) {
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible]);

  return (
    <>
      <div
        ref={triggerRef}
        className={`${styles.trigger} ${className || ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {children}
        <svg 
          className={styles.infoIcon} 
          viewBox="0 0 16 16" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M8 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="8" cy="5" r="0.5" fill="currentColor"/>
        </svg>
      </div>

      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className={styles.tooltip}
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          <div className={styles.tooltipContent}>
            <div className={styles.tooltipTitle}>
              {t(`analytics.tooltips.${metricKey}.title`)}
            </div>
            <div className={styles.tooltipDescription}>
              {t(`analytics.tooltips.${metricKey}.description`)}
            </div>
            <div className={styles.tooltipInterpretation}>
              <strong>{t('analytics.tooltips.interpretation')}:</strong>{' '}
              {t(`analytics.tooltips.${metricKey}.interpretation`)}
            </div>
          </div>
          <div className={styles.tooltipArrow}></div>
        </div>,
        document.body
      )}
    </>
  );
}