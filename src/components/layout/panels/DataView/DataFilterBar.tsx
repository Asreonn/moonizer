import { useLanguage } from '../../../../core/i18n/LanguageProvider';
import { useState } from 'react';
import styles from './DataFilterBar.module.css';
import { ColoringMode, ShowFilter } from '../../../../state/useDataViewStore';



interface DataFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onClearHighlight?: () => void;
  hasHighlight?: boolean;
  statusText?: {
    from: number;
    to: number;
    total: number;
  };
  coloringMode: ColoringMode;
  onColoringModeChange: (mode: ColoringMode) => void;
  showFilter: ShowFilter;
  onShowFilterChange: (filter: ShowFilter) => void;
  onClearFilters?: () => void;
}

export function DataFilterBar({ 
  searchValue, 
  onSearchChange, 
  onClearHighlight, 
  hasHighlight = false, 
  statusText, 
  coloringMode, 
  onColoringModeChange, 
  showFilter, 
  onShowFilterChange,
  onClearFilters
}: DataFilterBarProps) {
  const { t } = useLanguage();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Helper function to get available filters for each mode
  const getFiltersForMode = (mode: ColoringMode): string[] => {
    switch (mode) {
      case 'Type':
        return ['All', 'Numeric', 'Text', 'Categorical', 'DateTime', 'Boolean', 'IdUnique', 'Constant'];
      case 'Sign':
        return ['All', 'Positives', 'Negatives', 'Zeros'];
      case 'Delta':
        return ['All', 'Increased', 'Decreased', 'Unchanged', 'FirstRow'];
      case 'Outliers':
        return ['All', 'Outliers', 'Normal', 'Extreme'];
      case 'Quartiles':
        return ['All', 'Q1', 'Q2', 'Q3', 'Q4'];
      case 'Heatmap':
        return ['All', 'Hot', 'Warm', 'Cool', 'Cold'];
      default:
        return ['All'];
    }
  };

  // Check if filters are active (not at default values)
  const hasActiveFilters = searchValue.trim() !== '' || coloringMode !== 'Type' || showFilter !== 'All';

  return (
    <div className={styles.filterBar}>
      <div className={styles.topBar}>
        <div className={styles.leftSection}>
          <div className={styles.searchContainer}>
            <svg 
              className={styles.searchIcon} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={t('table.search.placeholder')}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchValue && (
              <button
                className={styles.clearButton}
                onClick={() => onSearchChange('')}
                title={t('table.search.clear')}
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          
          <button
            className={`${styles.filterToggleButton} ${isFilterOpen ? styles.filterToggleButtonActive : ''}`}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            title={t('dataView.filter.toggle')}
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            {t('dataView.filter.label')}
          </button>
          
          {hasHighlight && onClearHighlight && (
            <button
              className={styles.clearHighlightButton}
              onClick={onClearHighlight}
              title={t('table.highlight.clear')}
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
              {t('table.highlight.clear')}
            </button>
          )}
        </div>
        
        <div className={styles.rightSection}>
          {statusText && (
            <div className={styles.statusText}>
              {t('table.status.showingPrefix')} <span className={styles.rangeAccent}>{statusText.from}–{statusText.to}</span> {t('table.status.showingOf')} {statusText.total}
            </div>
          )}
        </div>
      </div>

      {isFilterOpen && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <svg className={styles.filterIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              {t('dataView.coloring.label')}
            </label>
            <select 
              className={styles.filterSelect}
              value={coloringMode}
              onChange={(e) => onColoringModeChange(e.target.value as ColoringMode)}
              title={t(`dataView.coloring.tooltip.${coloringMode.toLowerCase()}`)}
            >
              {(['Type', 'Sign', 'Delta', 'Outliers', 'Quartiles', 'Heatmap'] as const).map((mode) => (
                <option key={mode} value={mode}>
                  {t(`dataView.coloring.${mode.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <svg className={styles.filterIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              {t('dataView.show.label')}
            </label>
            <select 
              className={styles.filterSelect}
              value={showFilter}
              onChange={(e) => onShowFilterChange(e.target.value as ShowFilter)}
              title={t(`dataView.show.tooltip.${showFilter.toLowerCase()}`, { mode: t(`dataView.coloring.${coloringMode.toLowerCase()}`) })}
            >
              {getFiltersForMode(coloringMode).map((filter) => (
                <option key={filter} value={filter}>
                  {t(`dataView.show.${filter.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterActions}>
            {onClearFilters && hasActiveFilters && (
              <button
                className={styles.clearFiltersButton}
                onClick={() => {
                  onClearFilters();
                  onSearchChange('');
                }}
                title={t('dataView.filter.clearTooltip')}
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                {t('dataView.filter.clear')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}