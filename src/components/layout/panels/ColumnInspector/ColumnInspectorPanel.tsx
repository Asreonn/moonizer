import { useMemo, useState, useRef, useEffect } from 'react';
import { useDatasetStore } from '../../../../state/useDatasetStore';
import { useColumnEditorStore } from '../../../../state/useColumnEditorStore';
import { useLanguage } from '../../../../core/i18n/LanguageProvider';
import { generateColumnProfile, ColumnType } from '../../../../core/profiling/columnTypes';
import { ColumnDetailsCard } from './ColumnDetailsCard';
import { NewColumnEditorPanel } from './NewColumnEditorPanel';
import styles from './ColumnInspectorPanel.module.css';
import chipStyles from './Chips.module.css';

export function ColumnInspectorPanel() {
  const { t } = useLanguage();
  const { datasets, activeDatasetId, getColumnTypeOverride } = useDatasetStore();
  const { activeColumn, setActiveColumn } = useColumnEditorStore();
  
  // Debug render count
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  console.log(`🎨 ColumnInspectorPanel render #${renderCountRef.current}`);
  const [activeTypeFilters, setActiveTypeFilters] = useState<Set<ColumnType>>(new Set());
  const [editorColumn, setEditorColumn] = useState<string | null>(null);
  const [savedScrollPosition, setSavedScrollPosition] = useState(0);
  const [quickFilter, setQuickFilter] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const activeDataset = datasets.find(d => d.id === activeDatasetId);

  // Sync activeColumn from global state to local editorColumn
  useEffect(() => {
    if (activeColumn && activeDataset?.columnNames?.includes(activeColumn)) {
      setEditorColumn(activeColumn);
    }
  }, [activeColumn, activeDataset]);
  
  const columnProfiles = useMemo(() => {
    if (!activeDataset?.data || !activeDataset?.columnNames) {
      return [];
    }
    
    return activeDataset.columnNames.map(columnName => {
      const columnValues = activeDataset.data.map(row => row[columnName]);
      const typeOverride = getColumnTypeOverride(columnName);
      return generateColumnProfile(columnValues, columnName, typeOverride);
    });
  }, [activeDataset, getColumnTypeOverride]);
  
  const summaryData = useMemo(() => {
    if (columnProfiles.length === 0) {
      return {
        typeCounts: {} as Record<ColumnType, number>,
        missingCellsPercent: 0,
        colsWithMissing: 0,
        colsWithDuplicates: 0,
        highCardinalityCols: 0
      };
    }
    
    const typeCounts: Record<ColumnType, number> = {
      numeric: 0,
      categorical: 0,
      boolean: 0,
      datetime: 0,
      text: 0,
      id_unique: 0,
      constant: 0,
    };
    
    let totalCells = columnProfiles.length * (activeDataset?.data?.length || 0);
    let totalMissingCells = 0;
    let colsWithMissing = 0;
    let colsWithDuplicates = 0;
    let highCardinalityCols = 0;
    
    columnProfiles.forEach(profile => {
      typeCounts[profile.type]++;
      totalMissingCells += profile.nullCount;
      
      if (profile.nullCount > 0) {
        colsWithMissing++;
      }
      
      if (profile.uniquePercent < 100) {
        colsWithDuplicates++;
      }
      
      if (profile.type === 'categorical' && 
          profile.categoricalStats && 
          profile.categoricalStats.classes > 20) {
        highCardinalityCols++;
      }
    });
    
    return {
      typeCounts,
      missingCellsPercent: totalCells > 0 ? (totalMissingCells / totalCells) * 100 : 0,
      colsWithMissing,
      colsWithDuplicates,
      highCardinalityCols
    };
  }, [columnProfiles, activeDataset]);
  
  const filteredProfiles = useMemo(() => {
    let filtered = columnProfiles;
    
    console.log('📊 Filter Processing START:', {
      totalProfiles: columnProfiles.length,
      activeFilters: Array.from(activeTypeFilters),
      activeFiltersCount: activeTypeFilters.size,
      quickFilter: quickFilter,
      profileTypes: columnProfiles.map(p => ({ name: p.name, type: p.type }))
    });
    
    // Apply quick filter (column name search)
    if (quickFilter.trim()) {
      const searchTerm = quickFilter.toLowerCase();
      filtered = filtered.filter(profile => 
        profile.name.toLowerCase().includes(searchTerm)
      );
      console.log('🔎 After name filter:', {
        count: filtered.length,
        remaining: filtered.map(p => ({ name: p.name, type: p.type }))
      });
    }
    
    // Apply type filters (multiple allowed)
    if (activeTypeFilters.size > 0) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(profile => {
        const matches = activeTypeFilters.has(profile.type);
        console.log(`  Type filter check: ${profile.name} (${profile.type}) -> ${matches ? 'KEEP' : 'REMOVE'}`);
        return matches;
      });
      console.log('🎯 After type filter:', {
        before: beforeFilter,
        after: filtered.length,
        activeFilters: Array.from(activeTypeFilters),
        remaining: filtered.map(p => ({ name: p.name, type: p.type }))
      });
    }
    
    console.log('📊 Filter Processing END:', {
      finalCount: filtered.length,
      finalProfiles: filtered.map(p => ({ name: p.name, type: p.type }))
    });
    
    return filtered;
  }, [columnProfiles, activeTypeFilters, quickFilter]);

  const handleTypeFilterClick = (type: ColumnType) => {
    console.log('🔘 CLICK HANDLER START:', {
      clickedType: type,
      currentFilters: Array.from(activeTypeFilters),
      currentFiltersSize: activeTypeFilters.size
    });
    
    const newFilters = new Set(activeTypeFilters);
    const wasActive = newFilters.has(type);
    
    if (wasActive) {
      newFilters.delete(type);
      console.log(`🔘 REMOVING filter: ${type}`);
    } else {
      newFilters.add(type);
      console.log(`🔘 ADDING filter: ${type}`);
    }
    
    console.log('🔘 CLICK HANDLER STATE CHANGE:', {
      clickedType: type,
      wasActive: wasActive,
      oldFilters: Array.from(activeTypeFilters),
      newFilters: Array.from(newFilters),
      oldSize: activeTypeFilters.size,
      newSize: newFilters.size,
      columnProfilesTotal: columnProfiles.length,
      columnProfilesTypes: columnProfiles.map(p => ({ name: p.name, type: p.type }))
    });
    
    // Call setState
    setActiveTypeFilters(newFilters);
    console.log('🔘 setState called with:', Array.from(newFilters));
    
    // Announce filter change for accessibility
    const filterName = t(`inspector.summary.types.${type}`);
    const message = t('inspector.aria.filterChanged', { filter: filterName });
    
    // Update live region for screen readers
    const liveRegion = document.getElementById('inspector-live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(() => {
        if (liveRegion) liveRegion.textContent = '';
      }, 1000);
    }
  };


  const handleCardClick = (columnName: string) => {
    // Save scroll position
    if (scrollContainerRef.current) {
      setSavedScrollPosition(scrollContainerRef.current.scrollTop);
    }
    
    // Open editor mode
    setEditorColumn(columnName);
    setActiveColumn(columnName);
  };

  const handleBackToList = () => {
    setEditorColumn(null);
    
    // Restore scroll position
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = savedScrollPosition;
      }
    }, 50); // Small delay for DOM update
  };



  const handleClearAllFilters = () => {
    setActiveTypeFilters(new Set());
    setQuickFilter('');
  };
  
  if (!activeDataset) {
    return (
      <div className={styles.columnInspectorPanel}>
        <div className={styles.emptyState}>
          <svg className={styles.emptyState__icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
          </svg>
          <div className={styles.emptyState__text}>
            {t('placeholders.dataset.none')}
          </div>
        </div>
      </div>
    );
  }
  
  // Show editor mode if a column is selected
  if (editorColumn) {
    const selectedProfile = columnProfiles.find(p => p.name === editorColumn);
    return (
      <div className={styles.columnInspectorPanel}>
        <NewColumnEditorPanel 
          profile={selectedProfile!}
          onBack={handleBackToList}
        />
      </div>
    );
  }

  return (
    <div className={styles.columnInspectorPanel}>
      {/* Type Chips Grid - Always Show All 6 Types */}
      <div className={styles.typeChipGrid}>
        {(['numeric', 'categorical', 'boolean', 'datetime', 'text', 'id_unique'] as ColumnType[]).map((type) => {
          const count = summaryData.typeCounts[type] || 0;
          const isActive = activeTypeFilters.has(type);
          const isMuted = count === 0;
          
          return (
            <button
              key={type}
              className={`${chipStyles.typeChipSquare} ${chipStyles[`typeChipSquare--${type}`]} ${
                isActive ? chipStyles['typeChipSquare--active'] : ''
              } ${isMuted ? chipStyles['typeChipSquare--muted'] : ''}`}
              onClick={() => handleTypeFilterClick(type)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTypeFilterClick(type);
                }
              }}
              aria-pressed={isActive}
              disabled={isMuted}
              title={`${count} ${t(`inspector.types.${type}`)} columns`}
            >
              <span className={chipStyles.typeChipSquare__label}>
                {t(`inspector.types.${type}`)}
              </span>
              <span className={chipStyles.typeChipSquare__count}>{count}</span>
            </button>
          );
        })}
      </div>
      
      {/* Dataset Summary Line */}
      <div className={styles.datasetSummary}>
        <span className={styles.datasetSummary__item}>
          {columnProfiles.length} {t('dataset.columns')}
        </span>
        <span className={styles.datasetSummary__separator}>•</span>
        <span className={styles.datasetSummary__item}>
          {activeDataset?.data?.length || 0} {t('dataset.rows')}
        </span>
      </div>
      
      {/* Quick Filter and Controls */}
      <div className={styles.filterControls}>
        <input
          type="text"
          placeholder={t('inspector.filter.placeholder')}
          value={quickFilter}
          onChange={(e) => setQuickFilter(e.target.value)}
          className={styles.quickFilter}
        />
        
        {(activeTypeFilters.size > 0 || quickFilter) && (
          <div className={styles.filterActions}>
            <button
              className={styles.clearFiltersBtn}
              onClick={handleClearAllFilters}
              title={t('inspector.filter.clearAll')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Scrollable Column List */}
      <div 
        ref={scrollContainerRef}
        className={styles.columnList} 
        role="list"
      >
        <div className={styles.scrollShadowTop}></div>
        {filteredProfiles.map(profile => (
          <ColumnDetailsCard 
            key={profile.name}
            profile={profile}
            onClick={() => handleCardClick(profile.name)}
          />
        ))}
        <div className={styles.scrollShadowBottom}></div>
      </div>
      
      {/* Live region for accessibility announcements */}
      <div 
        id="inspector-live-region"
        aria-live="polite" 
        aria-atomic="true" 
        className={styles.srOnly}
      ></div>
    </div>
  );
}