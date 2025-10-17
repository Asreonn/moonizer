import React, { useState, useCallback } from 'react';
import { useLanguage } from '../../../../core/i18n/LanguageProvider';
import { ColumnProfile } from '../../../../core/profiling/columnTypes';
import styles from './ColumnDetailsCard.module.css';

interface ColumnDetailsCardProps {
  profile: ColumnProfile;
  onClick: () => void;
}


export function ColumnDetailsCard({ profile, onClick }: ColumnDetailsCardProps) {
  const { t } = useLanguage();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(profile.name);
  
  const handleCardClick = useCallback(() => {
    if (!isRenaming) {
      onClick();
    }
  }, [onClick, isRenaming]);
  
  const handleNameDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
    setNewName(profile.name);
  }, [profile.name]);
  
  const handleNameSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual rename functionality
    setIsRenaming(false);
    console.log('Rename column:', profile.name, 'to:', newName);
    // Add pulse animation on successful rename
    const cardElement = e.currentTarget.closest(`.${styles.card}`);
    if (cardElement) {
      cardElement.classList.add(styles['card--pulse']);
      setTimeout(() => cardElement.classList.remove(styles['card--pulse']), 400);
    }
  }, [profile.name, newName]);
  
  const handleNameCancel = useCallback(() => {
    setIsRenaming(false);
    setNewName(profile.name);
  }, [profile.name]);

  
  const renderTypeSpecificChips = () => {
    switch (profile.type) {
      case 'numeric':
        return renderNumericChips();
      case 'categorical':
        return renderCategoricalChips();
      case 'datetime':
        return renderDatetimeChips();
      case 'text':
        return renderTextChips();
      case 'boolean':
        return renderBooleanChips();
      case 'id_unique':
        return renderIdUniqueChips();
      default:
        return null;
    }
  };

  const renderNumericChips = () => {
    if (!profile.numericStats) return null;
    const { min, max, median, mean } = profile.numericStats;
    
    return (
      <div className={styles.typeChips}>
        <div className={styles.typeChip}>
          <span className={styles.typeChip__label}>{t('inspector.card.stats.numericLabels.min')}</span>
          <span className={styles.typeChip__value}>{min?.toFixed(1) ?? '—'}</span>
        </div>
        <div className={styles.typeChip}>
          <span className={styles.typeChip__label}>{t('inspector.card.stats.numericLabels.median')}</span>
          <span className={styles.typeChip__value}>{median?.toFixed(1) ?? '—'}</span>
        </div>
        <div className={styles.typeChip}>
          <span className={styles.typeChip__label}>{t('inspector.card.stats.numericLabels.mean')}</span>
          <span className={styles.typeChip__value}>{mean?.toFixed(1) ?? '—'}</span>
        </div>
        <div className={styles.typeChip}>
          <span className={styles.typeChip__label}>{t('inspector.card.stats.numericLabels.max')}</span>
          <span className={styles.typeChip__value}>{max?.toFixed(1) ?? '—'}</span>
        </div>
      </div>
    );
  };

  const renderCategoricalChips = () => {
    if (!profile.categoricalStats) return null;
    const { topCategories, classes } = profile.categoricalStats;
    
    return (
      <div className={styles.typeChips}>
        <div className={styles.typeChip}>
          <span className={styles.typeChip__label}>{t('inspector.card.stats.categoryLabels.classes')}</span>
          <span className={styles.typeChip__value}>{classes}</span>
        </div>
        {topCategories.slice(0, 3).map((cat, index) => (
          <div key={index} className={styles.typeChip}>
            <span className={styles.typeChip__label}>{String(cat.value).substring(0, 6)}</span>
            <span className={styles.typeChip__value}>{cat.percent.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    );
  };

  const renderDatetimeChips = () => {
    if (!profile.datetimeStats) return null;
    const { minDate, maxDate, invalidCount } = profile.datetimeStats;
    
    return (
      <div className={styles.typeChips}>
        <div className={styles.typeChip}>
          <span className={styles.typeChip__label}>{t('inspector.card.stats.dateLabels.minDate')}</span>
          <span className={styles.typeChip__value}>{minDate?.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }) ?? '—'}</span>
        </div>
        <div className={styles.typeChip}>
          <span className={styles.typeChip__label}>{t('inspector.card.stats.dateLabels.maxDate')}</span>
          <span className={styles.typeChip__value}>{maxDate?.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }) ?? '—'}</span>
        </div>
        <div className={styles.typeChip}>
          <span className={styles.typeChip__label}>{t('inspector.card.stats.dateLabels.invalid')}</span>
          <span className={styles.typeChip__value}>{invalidCount || 0}</span>
        </div>
      </div>
    );
  };

  const renderTextChips = () => {
    if (!profile.textStats) return null;
    const { avgLength, minLength, maxLength } = profile.textStats;
    
    return (
      <div className={styles.typeChips}>
        <div className={styles.typeChip}>
          <span className={styles.typeChip__label}>{t('inspector.card.stats.textLabels.avgLen')}</span>
          <span className={styles.typeChip__value}>{avgLength?.toFixed(0) ?? '—'}</span>
        </div>
        <div className={styles.typeChip}>
          <span className={styles.typeChip__label}>{t('inspector.card.stats.textLabels.minLen')}</span>
          <span className={styles.typeChip__value}>{minLength || 0}</span>
        </div>
        <div className={styles.typeChip}>
          <span className={styles.typeChip__label}>{t('inspector.card.stats.textLabels.maxLen')}</span>
          <span className={styles.typeChip__value}>{maxLength || 0}</span>
        </div>
      </div>
    );
  };

  const renderBooleanChips = () => {
    if (!profile.booleanStats) return null;
    const { truePercent, falsePercent } = profile.booleanStats;
    
    return (
      <div className={styles.typeChips}>
        <div className={styles.typeChip}>
          <span className={styles.typeChip__label}>{t('inspector.card.stats.booleanLabels.ratio')}</span>
          <span className={styles.typeChip__value}>{truePercent.toFixed(0)}%/{falsePercent.toFixed(0)}%</span>
        </div>
      </div>
    );
  };

  const renderIdUniqueChips = () => {
    if (!profile.idUniqueStats) return null;
    const { isUnique, duplicateCount } = profile.idUniqueStats;
    
    return (
      <div className={styles.typeChips}>
        <div className={`${styles.typeChip} ${isUnique ? styles['typeChip--success'] : styles['typeChip--warning']}`}>
          <span className={styles.typeChip__label}>{t('inspector.card.stats.uniqueLabels.uniqueness')}</span>
          <span className={styles.typeChip__value}>{isUnique ? t('inspector.card.stats.uniqueLabels.ok') : `${t('inspector.card.stats.uniqueLabels.duplicates')} ${duplicateCount}`}</span>
        </div>
      </div>
    );
  };


  return (
    <div 
      className={styles.card}
      onClick={handleCardClick}
      role="listitem"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
        if (e.key === 'Escape') {
          setIsRenaming(false);
        }
      }}
    >
      {/* Header with larger title and inline type badge */}
      <div className={styles.card__header}>
        <div className={styles.columnName}>
          {isRenaming ? (
            <form onSubmit={handleNameSubmit} className={styles.renameForm}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={styles.renameInput}
                placeholder={t('inspector.card.rename.placeholder')}
                autoFocus
                onBlur={handleNameCancel}
                onKeyDown={(e) => e.key === 'Escape' && handleNameCancel()}
              />
            </form>
          ) : (
            <h3 
              className={styles.columnName__text}
              onDoubleClick={handleNameDoubleClick}
              title="Double-click to rename"
            >
              {profile.name}
            </h3>
          )}
        </div>
        
        <div className={styles.headerBadge}>
          <span 
            className={`${styles.typeBadge} ${styles[`typeBadge--${profile.type}`]}`}
          >
            {t(`inspector.types.${profile.type}`)}
          </span>
          
          {profile.isTypeLocked && (
            <span className={styles.lockBadge} title={t('inspector.actions.lockType')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
          )}
        </div>
      </div>
      
      {/* Type-Specific Quick Stats (Center, Chips) */}
      {renderTypeSpecificChips()}
      
      {/* Baseline Line (Always Present) */}
      <div className={styles.baselineLine}>
        <span className={styles.baselineItem}>{t('inspector.card.stats.missing')} {profile.nullPercent.toFixed(1)}%</span>
        <span className={styles.baselineItem}>{t('inspector.card.stats.unique')} {profile.uniqueCount}</span>
      </div>
      
      {/* Warnings if any */}
      {profile.warnings.length > 0 && (
        <div className={styles.warnings}>
          {profile.warnings.slice(0, 2).map((warning, index) => (
            <div key={index} className={styles.warning}>
              <svg className={styles.warning__icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span className={styles.warning__text}>
                {t(`inspector.warn.${warning}`)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}