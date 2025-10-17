import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../../../core/i18n/LanguageProvider';
import { ColumnProfile } from '../../../../core/profiling/columnTypes';
import { useDatasetStore } from '../../../../state/useDatasetStore';
import { useColumnEditorStore } from '../../../../state/useColumnEditorStore';
import { useToast } from '../../../common/Toast/ToastProvider';
import { ActionGroups } from './ActionGroups';
import styles from './NewColumnEditorPanel.module.css';

interface NewColumnEditorPanelProps {
  profile: ColumnProfile;
  onBack: () => void;
}

export function NewColumnEditorPanel({ profile, onBack }: NewColumnEditorPanelProps) {
  const { t } = useLanguage();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(profile?.name || '');
  const { applyDatasetTransform } = useDatasetStore();
  const { addOperationWithSnapshot } = useColumnEditorStore();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);


  // Setup scroll shadow monitoring
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const updateScrollShadows = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const hasScrollTop = scrollTop > 10;
      const hasScrollBottom = scrollTop < scrollHeight - clientHeight - 10;

      container.classList.toggle('hasScrollTop', hasScrollTop);
      container.classList.toggle('hasScrollBottom', hasScrollBottom);
    };

    updateScrollShadows();
    container.addEventListener('scroll', updateScrollShadows);
    
    // Also update on resize
    const resizeObserver = new ResizeObserver(updateScrollShadows);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', updateScrollShadows);
      resizeObserver.disconnect();
    };
  }, []);

  // Handle case where profile becomes undefined (e.g., after column deletion)
  if (!profile) {
    onBack();
    return null;
  }

  const handleColumnNameDoubleClick = () => {
    if (!profile) return;
    setIsEditing(true);
    setEditingName(profile.name);
  };

  const handleColumnNameSave = async () => {
    if (!profile || !editingName.trim() || editingName.trim() === profile.name) {
      setIsEditing(false);
      return;
    }
    
    if (editingName.trim() !== profile.name) {
      try {
        // Get current dataset state for snapshot BEFORE operation
        const { datasets, activeDatasetId } = useDatasetStore.getState();
        const activeDataset = datasets.find(d => d.id === activeDatasetId);
        
        if (!activeDataset) {
          showToast({
            message: t('inspector.error.noActiveDataset'),
            type: 'error',
            duration: 4000
          });
          setIsEditing(false);
          return;
        }

        // Create BEFORE snapshot
        const beforeSnapshot = {
          data: JSON.parse(JSON.stringify(activeDataset.data)),
          columnNames: [...activeDataset.columnNames]
        };

        const description = t('inspector.actions.rename.title');
        
        const result = await applyDatasetTransform({
          id: `rename_${Date.now()}`,
          type: 'rename_column',
          columnName: profile.name,
          parameters: { newName: editingName.trim() },
          timestamp: new Date(),
          description
        });

        if (result.success) {
          // Get AFTER snapshot
          const updatedDataset = useDatasetStore.getState().datasets.find(d => d.id === activeDatasetId);
          const afterSnapshot = updatedDataset ? {
            data: JSON.parse(JSON.stringify(updatedDataset.data)),
            columnNames: [...updatedDataset.columnNames]
          } : null;

          // Add to operation history with snapshots
          if (afterSnapshot) {
            addOperationWithSnapshot(
              {
                columnName: profile.name,
                type: 'rename_column',
                description,
                parameters: { newName: editingName.trim() }
              },
              beforeSnapshot.data,
              beforeSnapshot.columnNames,
              afterSnapshot.data,
              afterSnapshot.columnNames
            );
          }

          // Show success toast with undo action
          showToast({
            message: t('inspector.operation.applied', { 
              operation: t('inspector.actions.rename.title'), 
              column: profile.name 
            }),
            type: 'success',
            duration: 5000,
            action: {
              label: t('inspector.undoRedo.undo'),
              onClick: () => {}
            }
          });
        } else {
          showToast({
            message: t('inspector.error.failed', { message: result.error }),
            type: 'error',
            duration: 4000
          });
        }
      } catch (error) {
        console.error('Failed to rename column:', error);
        showToast({
          message: t('inspector.error.failed', { message: 'Unknown error' }),
          type: 'error',
          duration: 4000
        });
      }
    }
    setIsEditing(false);
  };

  const handleColumnNameCancel = () => {
    if (!profile) return;
    setEditingName(profile.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleColumnNameSave();
    } else if (e.key === 'Escape') {
      handleColumnNameCancel();
    }
  };



  const renderStatsOverview = () => {
    const missingPercent = profile.nullPercent;
    const uniquePercent = profile.uniquePercent;
    const completenessPercent = 100 - missingPercent;
    
    return (
      <div className={styles.compactOverview}>
        {/* Core Stats Grid */}
        <div className={styles.coreStatsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{profile.totalCount.toLocaleString()}</span>
            <span className={styles.statLabel}>{t('inspector.editor.overview.rows')}</span>
          </div>
          
          <div className={styles.statCard}>
            <span className={styles.statValue}>{profile.uniqueCount.toLocaleString()}</span>
            <span className={styles.statLabel}>{t('inspector.editor.overview.unique')}</span>
          </div>
          
          <div className={styles.statCard}>
            <span className={styles.statValue}>{completenessPercent.toFixed(1)}%</span>
            <span className={styles.statLabel}>{t('inspector.editor.overview.completeness')}</span>
          </div>
          
          <div className={styles.statCard}>
            <span className={styles.statValue}>{missingPercent.toFixed(1)}%</span>
            <span className={styles.statLabel}>{t('inspector.editor.overview.missing')}</span>
          </div>
        </div>

        {/* Type Info */}
        <div className={styles.typeInfoCard}>
          <div className={styles.typeInfoRow}>
            <span className={styles.typeInfoLabel}>{t('inspector.editor.overview.dataType')}</span>
            <span className={styles.typeInfoValue}>
              {t(`inspector.types.${profile.type}`)}
            </span>
          </div>
          
          <div className={styles.typeInfoRow}>
            <span className={styles.typeInfoLabel}>{t('inspector.editor.overview.uniqueness')}</span>
            <span className={styles.typeInfoValue}>
              {uniquePercent > 95 ? t('inspector.editor.overview.highlyUnique') :
               uniquePercent > 80 ? t('inspector.editor.overview.mostlyUnique') :
               uniquePercent > 50 ? t('inspector.editor.overview.moderateUnique') :
               t('inspector.editor.overview.lowUnique')}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderTypeDetails = () => {
    const { min, max, median, q1, q3 } = profile.numericStats || {};
    
    if (profile.type === 'numeric' && profile.numericStats) {
      return (
          <div className={styles.typeDetails}>
          <h4 className={styles.typeTitle}>{t('inspector.editor.overview.numericDetails')}</h4>
            
            {/* Statistics Summary - 3x2 Grid */}
            <div className={styles.fiveNumberSummary}>
              {/* First Row: Min, Max */}
              <div className={styles.numberStat}>
                <span className={styles.numberLabel}>{t('inspector.editor.stats.min')}</span>
                <span className={styles.numberValue}>{min?.toFixed(2) ?? '—'}</span>
              </div>
              <div className={styles.numberStat}>
                <span className={styles.numberLabel}>{t('inspector.editor.stats.max')}</span>
                <span className={styles.numberValue}>{max?.toFixed(2) ?? '—'}</span>
              </div>
              
              {/* Second Row: Median, Mean */}
              <div className={`${styles.numberStat} ${styles['numberStat--median']}`}>
                <span className={styles.numberLabel}>{t('inspector.editor.stats.median')}</span>
                <span className={styles.numberValue}>{median?.toFixed(2) ?? '—'}</span>
              </div>
              <div className={styles.numberStat}>
                <span className={styles.numberLabel}>{t('inspector.editor.stats.q3')}</span>
                <span className={styles.numberValue}>{q3?.toFixed(2) ?? '—'}</span>
              </div>
              
              {/* Third Row: Q1, Q2 */}
              <div className={styles.numberStat}>
                <span className={styles.numberLabel}>{t('inspector.editor.stats.q1')}</span>
                <span className={styles.numberValue}>{q1?.toFixed(2) ?? '—'}</span>
              </div>
              <div className={styles.numberStat}>
                <span className={styles.numberLabel}>{t('inspector.editor.stats.q2')}</span>
                <span className={styles.numberValue}>{median?.toFixed(2) ?? '—'}</span>
              </div>
            </div>
            
          </div>
      );
    }

    if (profile.type === 'categorical' && profile.categoricalStats) {
      return (
          <div className={styles.typeDetails}>
          <h4 className={styles.typeTitle}>{t('inspector.editor.overview.categoricalDetails')}</h4>
            
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t('inspector.editor.overview.categories')}</span>
              <span className={styles.statValue}>{profile.categoricalStats.classes}</span>
            </div>
            
            {profile.categoricalStats.topCategories && (
              <div className={styles.topCategories}>
              <span className={styles.subTitle}>{t('inspector.editor.overview.topCategories')}</span>
                {profile.categoricalStats.topCategories.slice(0, 5).map((cat, idx) => (
                  <div key={idx} className={styles.categoryItem}>
                    <span className={styles.categoryName}>{String(cat.value).substring(0, 20)}</span>
                    <span className={styles.categoryPercent}>{cat.percent.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
      );
    }

    if (profile.type === 'text' && profile.textStats) {
      return (
          <div className={styles.typeDetails}>
          <h4 className={styles.typeTitle}>{t('inspector.editor.overview.textDetails')}</h4>
            
            <div className={styles.additionalStats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>{t('inspector.editor.stats.avgLength')}</span>
                <span className={styles.statValue}>{profile.textStats.avgLength?.toFixed(1) ?? '—'}</span>
              </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>{t('inspector.editor.stats.minLength')}</span>
                <span className={styles.statValue}>{profile.textStats.minLength ?? '—'}</span>
              </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>{t('inspector.editor.stats.maxLength')}</span>
                <span className={styles.statValue}>{profile.textStats.maxLength ?? '—'}</span>
              </div>
            </div>
          </div>
      );
    }

    if (profile.type === 'datetime' && profile.datetimeStats) {
      return (
          <div className={styles.typeDetails}>
          <h4 className={styles.typeTitle}>{t('inspector.editor.overview.datetimeDetails')}</h4>
            
            <div className={styles.additionalStats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>{t('inspector.editor.stats.minDate')}</span>
                <span className={styles.statValue}>
                {profile.datetimeStats.minDate ? new Date(profile.datetimeStats.minDate).toLocaleDateString('tr-TR') : '—'}
                </span>
              </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>{t('inspector.editor.stats.maxDate')}</span>
                <span className={styles.statValue}>
                {profile.datetimeStats.maxDate ? new Date(profile.datetimeStats.maxDate).toLocaleDateString('tr-TR') : '—'}
                </span>
              </div>
                </div>
            </div>
      );
    }

    if (profile.type === 'boolean' && profile.booleanStats) {
      return (
          <div className={styles.typeDetails}>
          <h4 className={styles.typeTitle}>{t('inspector.editor.overview.booleanDetails')}</h4>
            
            <div className={styles.additionalStats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>{t('inspector.editor.stats.trueCount')}</span>
                <span className={styles.statValue}>
                  {profile.booleanStats.trueCount} ({profile.booleanStats.truePercent.toFixed(1)}%)
                </span>
              </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>{t('inspector.editor.stats.falseCount')}</span>
                <span className={styles.statValue}>
                {profile.booleanStats.falseCount} ({profile.booleanStats.falsePercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
      );
    }

    return null;
  };



  return (
    <div className={styles.editorPanel}>
      {/* Content */}
      <div ref={contentRef} className={styles.editorContent}>
        {/* Header Row with Back Button, Column Name, and Type */}
        <div className={styles.headerRow}>
          <button className={styles.backButton} onClick={onBack} title={t('inspector.editor.header.back')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>


          <div className={styles.columnNameContainer}>
            {isEditing ? (
              <form className={styles.renameForm} onSubmit={(e) => { e.preventDefault(); handleColumnNameSave(); }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={(e) => {
                    // Only cancel if the user clicked outside the form
                    setTimeout(() => {
                      if (!e.relatedTarget || !e.currentTarget.closest('form')?.contains(e.relatedTarget)) {
                        handleColumnNameCancel();
                      }
                    }, 0);
                  }}
                  className={styles.renameInput}
                  placeholder={t('inspector.editor.columnNamePlaceholder')}
                  autoFocus
                />
              </form>
            ) : (
              <h2 
                className={styles.columnName}
                onDoubleClick={handleColumnNameDoubleClick}
                title={t('inspector.editor.doubleClickToRename')}
              >
                {profile.name}
              </h2>
            )}
          </div>

          <div className={`${styles.typeIndicator} ${styles[`typeIndicator--${profile.type}`]}`}>
            {t(`inspector.types.${profile.type}`)}
          </div>
        </div>

        {/* Stats Overview */}
        {renderStatsOverview()}

        {/* Type Details */}
        {renderTypeDetails()}

        {/* Action Groups */}
        <ActionGroups profile={profile} />
      </div>
    </div>
  );
}
