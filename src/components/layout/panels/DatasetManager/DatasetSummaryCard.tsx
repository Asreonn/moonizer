import React, { useState, useCallback } from 'react';
import { useLanguage } from '../../../../core/i18n/LanguageProvider';
import { useLayoutStore } from '../../../../state/useLayoutStore';
import type { Dataset } from '../../../../state/useDatasetStore';
import styles from './DatasetSummaryCard.module.css';

interface DatasetSummaryCardProps {
  dataset: Dataset;
  isActive?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  onRename?: (newName: string) => void;
}

export function DatasetSummaryCard({ 
  dataset, 
  isActive = false, 
  onSelect,
  onRemove,
  onRename 
}: DatasetSummaryCardProps) {
  const { t } = useLanguage();
  const { openExportPanel } = useLayoutStore();
  const [isSelecting, setIsSelecting] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const handleSelect = useCallback(() => {
    if (onSelect) {
      setIsSelecting(true);
      onSelect();
      setTimeout(() => setIsSelecting(false), 200);
    }
  }, [onSelect]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  }, [onRemove]);

  const handleRename = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRename) {
      const newName = prompt(t('dataset.actions.rename'), dataset.name);
      if (newName && newName !== dataset.name) {
        onRename(newName);
      }
    }
  }, [onRename, dataset.name, t]);

  const handleExport = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    openExportPanel(dataset.id);
  }, [openExportPanel, dataset.id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect();
    } else if (e.key === 'Delete' && onRemove) {
      e.preventDefault();
      onRemove();
    }
  };

  const cardClasses = [
    styles.summaryCard,
    isActive && styles['summaryCard--active'],
    isSelecting && styles['summaryCard--selecting'],
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${t('dataset.actions.select')} ${dataset.name}`}
      aria-pressed={isActive}
    >
      <div className={styles.summaryCard__header}>
        <div className={styles.summaryCard__titleGroup}>
          <h4 className={styles.summaryCard__title}>
            {dataset.name}
          </h4>
          <div className={styles.summaryCard__fileName}>
            {dataset.fileName}
          </div>
        </div>
        
        <button
          className={styles.actionButton}
          onClick={handleExport}
          aria-label={t('dataset.actions.export')}
          title={t('dataset.actions.export')}
        >
          <svg className={styles.actionButton__icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>

        {onRename && (
          <button
            className={styles.actionButton}
            onClick={handleRename}
            aria-label={t('dataset.actions.rename')}
            title={t('dataset.actions.rename')}
          >
            <svg className={styles.actionButton__icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M11 4 H4 a2 2 0 00-2 2 v14 a2 2 0 002 2 h14 a2 2 0 002-2 v-7"/>
              <path d="M18.5 2.5 a2.121 2.121 0 013 3 L12 15 l-4 1 l1-4 l9.5-9.5 z"/>
            </svg>
          </button>
        )}
        
        {onRemove && (
          <button
            className={`${styles.actionButton} ${styles['actionButton--danger']}`}
            onClick={handleRemove}
            aria-label={t('dataset.actions.remove')}
            title={t('dataset.actions.remove')}
          >
            <svg className={styles.actionButton__icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 6 h18"/>
              <path d="M19 6 v14 a2 2 0 01-2 2 H7 a2 2 0 01-2-2 V6 m3 0 V4 a2 2 0 012-2 h4 a2 2 0 012 2 v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        )}
      </div>

      <div className={styles.summaryCard__stats}>
        <div className={`${styles.summaryCard__stat} ${styles['summaryCard__stat--rows']}`}>
          <span className={styles.summaryCard__statLabel}>
            {t('dataset.card.rows')}
          </span>
          <span className={styles.summaryCard__statValue}>
            {dataset.rows.toLocaleString()}
          </span>
        </div>
        
        <div className={`${styles.summaryCard__stat} ${styles['summaryCard__stat--columns']}`}>
          <span className={styles.summaryCard__statLabel}>
            {t('dataset.card.columns')}
          </span>
          <span className={styles.summaryCard__statValue}>
            {dataset.columns}
          </span>
        </div>
        
        <div className={`${styles.summaryCard__stat} ${styles['summaryCard__stat--size']}`}>
          <span className={styles.summaryCard__statLabel}>
            {t('dataset.card.size')}
          </span>
          <span className={styles.summaryCard__statValue}>
            {formatFileSize(dataset.size)}
          </span>
        </div>
      </div>

      <div className={styles.summaryCard__meta}>
        <span>
          {t('dataset.card.addedAt')} {formatDate(dataset.addedAt)}
        </span>
        
        {isActive && (
          <div className={`${styles.summaryCard__badge} ${dataset.isPreloaded ? styles['summaryCard__badge--preloaded'] : ''}`}>
            <svg className={styles.summaryCard__icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 11 L12 14 L22 4"/>
              <path d="M21 12 v7 a2 2 0 01-2 2 H5 a2 2 0 01-2-2 v-14 a2 2 0 012-2 h11"/>
            </svg>
            {t('dataset.badge.active')}
          </div>
        )}
      </div>
    </div>
  );
}