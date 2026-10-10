import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDatasetStore } from '../../../../state/useDatasetStore';
import { useDataViewStore } from '../../../../state/useDataViewStore';
import { useColumnEditorStore } from '../../../../state/useColumnEditorStore';
import { useLayoutStore } from '../../../../state/useLayoutStore';
import { useLanguage } from '../../../../core/i18n/LanguageProvider';
import { DataFilterBar } from './DataFilterBar';
export type SortDirection = 'asc' | 'desc' | null;
import { DataPagination } from './DataPagination';
import { classifyColumnTypeWithOverride } from '../../../../core/profiling/columnTypes';
import styles from './DataViewGrid.module.css';

interface ColumnWidth {
  [key: string]: number;
}

interface SortConfig {
  column: string | null;
  direction: SortDirection;
}

interface HighlightState {
  rowId: string | null;
  columnKey: string | null;
}

export function DataViewGrid() {
  const { t } = useLanguage();
  const { datasets, activeDatasetId, isLoading, getColumnTypeOverride } = useDatasetStore();
  const { setActiveColumn } = useColumnEditorStore();
  const { 
    dataExplorerOpen, 
    rightPanelOpen,
    toggleDataExplorer, 
    toggleRightPanel 
  } = useLayoutStore();
  const {
    coloringMode,
    showFilter,
    setColoringMode,
    setShowFilter,
    toggleCellSelection,
    clearAllSelections,
    removeLastSelection,
    isCellSelected,
    hasSelections
  } = useDataViewStore();
  
  
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [showAll, setShowAll] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: null });
  const [hiddenColumns] = useState<Set<string>>(new Set());
  const [columnWidths, setColumnWidths] = useState<ColumnWidth>({});
  const [highlight, setHighlight] = useState<HighlightState>({ rowId: null, columnKey: null });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  
  const tableRef = useRef<HTMLTableElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const activeDataset = datasets.find(d => d.id === activeDatasetId);

  // Use real CSV data from the dataset
  const rawData = useMemo(() => {
    if (!activeDataset || !activeDataset.data || activeDataset.data.length === 0) {
      return [];
    }
    
    // Ensure we have a fresh copy of the data to prevent stale references
    const freshData = [...activeDataset.data];
    
    // Validate that the data structure is correct
    if (freshData.length > 0 && typeof freshData[0] === 'object') {
      return freshData;
    }
    
    return [];
  }, [activeDataset]);

  // Cache column types based on original dataset to avoid recalculation during filtering
  const columnTypeCache = useMemo(() => {
    if (!rawData || rawData.length === 0) return {};
    
    const cache: Record<string, string> = {};
    const columns = Object.keys(rawData[0] || {});
    
    columns.forEach(column => {
      if (column === '__rowId') return; // Skip internal row ID column
      
      // Extract column values from ORIGINAL dataset
      const columnValues = rawData.map(row => row[column]);
      
      // Use the same classification logic as the column inspector with type overrides
      const typeOverride = getColumnTypeOverride(column);
      const detectedType = classifyColumnTypeWithOverride(columnValues, column, typeOverride);
      
      // Map internal types to display types if needed
      cache[column] = detectedType === 'id_unique' ? 'idUnique' : detectedType;
    });
    
    return cache;
  }, [rawData, getColumnTypeOverride]);

  // Cell coloring utilities - use cached column types from original dataset
  const getColumnDataType = useCallback((column: string) => {
    return columnTypeCache[column] || 'text';
  }, [columnTypeCache]);

  const getCellColorClass = useCallback((value: any, column: string, rowIndex: number, data: any[]) => {
    if (coloringMode === 'Type') {
      const dataType = getColumnDataType(column);
      return styles[`cell--type-${dataType}`] || '';
    }
    
    if (coloringMode === 'Sign') {
      const dataType = getColumnDataType(column);
      if (dataType !== 'numeric') return styles['cell--muted'] || '';
      
      const numValue = Number(value);
      if (isNaN(numValue)) return styles['cell--muted'] || '';
      
      if (numValue > 0) return styles['cell--sign-positive'] || '';
      if (numValue < 0) return styles['cell--sign-negative'] || '';
      return styles['cell--sign-zero'] || '';
    }
    
    if (coloringMode === 'Delta') {
      const dataType = getColumnDataType(column);
      if (dataType !== 'numeric') return styles['cell--muted'] || '';
      
      const numValue = Number(value);
      if (isNaN(numValue)) return styles['cell--muted'] || '';
      
      if (rowIndex === 0) return styles['cell--delta-first'] || '';
      
      const prevValue = Number(data[rowIndex - 1][column]);
      if (isNaN(prevValue)) return styles['cell--muted'] || '';
      
      const delta = numValue - prevValue;
      if (delta > 0) return styles['cell--delta-increased'] || '';
      if (delta < 0) return styles['cell--delta-decreased'] || '';
      return styles['cell--delta-unchanged'] || '';
    }
    
    if (coloringMode === 'Outliers') {
      const dataType = getColumnDataType(column);
      if (dataType !== 'numeric') return styles['cell--muted'] || '';
      
      const numValue = Number(value);
      if (isNaN(numValue)) return styles['cell--muted'] || '';
      
      // Simple outlier detection using IQR
      const columnValues = data.map(row => Number(row[column])).filter(v => !isNaN(v));
      columnValues.sort((a, b) => a - b);
      
      const q1Index = Math.floor(columnValues.length * 0.25);
      const q3Index = Math.floor(columnValues.length * 0.75);
      const q1 = columnValues[q1Index];
      const q3 = columnValues[q3Index];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      if (numValue < lowerBound || numValue > upperBound) {
        const extremeLowerBound = q1 - 3 * iqr;
        const extremeUpperBound = q3 + 3 * iqr;
        if (numValue < extremeLowerBound || numValue > extremeUpperBound) {
          return styles['cell--outlier-extreme'] || '';
        }
        return styles['cell--outlier-mild'] || '';
      }
      return styles['cell--outlier-normal'] || '';
    }
    
    if (coloringMode === 'Quartiles') {
      const dataType = getColumnDataType(column);
      if (dataType !== 'numeric') return styles['cell--muted'] || '';
      
      const numValue = Number(value);
      if (isNaN(numValue)) return styles['cell--muted'] || '';
      
      const columnValues = data.map(row => Number(row[column])).filter(v => !isNaN(v));
      columnValues.sort((a, b) => a - b);
      
      const q1Index = Math.floor(columnValues.length * 0.25);
      const q2Index = Math.floor(columnValues.length * 0.5);
      const q3Index = Math.floor(columnValues.length * 0.75);
      const q1 = columnValues[q1Index];
      const q2 = columnValues[q2Index];
      const q3 = columnValues[q3Index];
      
      if (numValue <= q1) return styles['cell--quartile-q1'] || '';
      if (numValue <= q2) return styles['cell--quartile-q2'] || '';
      if (numValue <= q3) return styles['cell--quartile-q3'] || '';
      return styles['cell--quartile-q4'] || '';
    }
    
    if (coloringMode === 'Heatmap') {
      const dataType = getColumnDataType(column);
      if (dataType !== 'numeric') return styles['cell--muted'] || '';
      
      const numValue = Number(value);
      if (isNaN(numValue)) return styles['cell--muted'] || '';
      
      const columnValues = data.map(row => Number(row[column])).filter(v => !isNaN(v));
      const min = Math.min(...columnValues);
      const max = Math.max(...columnValues);
      const range = max - min;
      
      if (range === 0) return styles['cell--heatmap-mid'] || '';
      
      const normalized = (numValue - min) / range;
      if (normalized >= 0.75) return styles['cell--heatmap-hot'] || '';
      if (normalized >= 0.5) return styles['cell--heatmap-warm'] || '';
      if (normalized >= 0.25) return styles['cell--heatmap-cool'] || '';
      return styles['cell--heatmap-cold'] || '';
    }
    
    return '';
  }, [coloringMode, getColumnDataType]);

  const shouldShowCell = useCallback((value: any, column: string, rowIndex: number, data: any[]) => {
    // Always show if 'All' is selected or if we don't recognize the filter
    if (!showFilter || showFilter === 'All') return true;
    
    const dataType = getColumnDataType(column);
    
    // Type-based filtering
    if (coloringMode === 'Type') {
      if (showFilter === 'Numeric') return dataType === 'numeric';
      if (showFilter === 'Text') return dataType === 'text';
      if (showFilter === 'Categorical') return dataType === 'categorical';
      if (showFilter === 'DateTime') return dataType === 'datetime';
      if (showFilter === 'Boolean') return dataType === 'boolean';
      if (showFilter === 'IdUnique') return dataType === 'id_unique';
      if (showFilter === 'Constant') return dataType === 'constant';
      return true;
    }
    
    // For numeric-only modes, show non-numeric cells by default
    if (['Sign', 'Delta', 'Outliers', 'Quartiles', 'Heatmap'].includes(coloringMode)) {
      if (dataType !== 'numeric') return true;
      
      const numValue = Number(value);
      if (isNaN(numValue)) return true;
      
      // Sign mode filtering
      if (coloringMode === 'Sign') {
        if (showFilter === 'Positives') return numValue > 0;
        if (showFilter === 'Negatives') return numValue < 0;
        if (showFilter === 'Zeros') return numValue === 0;
        return true;
      }
      
      // Delta mode filtering
      if (coloringMode === 'Delta') {
        if (rowIndex === 0) {
          return showFilter === 'FirstRow';
        }
        
        const prevValue = Number(data[rowIndex - 1]?.[column]);
        if (isNaN(prevValue)) return true;
        
        const delta = numValue - prevValue;
        if (showFilter === 'Increased') return delta > 0;
        if (showFilter === 'Decreased') return delta < 0;
        if (showFilter === 'Unchanged') return delta === 0;
        return true;
      }
    }
    
    return true;
  }, [coloringMode, showFilter, getColumnDataType]);

  const columns = useMemo(() => {
    if (!activeDataset || !activeDataset.columnNames) return [];
    return activeDataset.columnNames.filter(col => !hiddenColumns.has(col));
  }, [activeDataset, hiddenColumns]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchValue.trim()) return rawData;
    
    const searchTerm = searchValue.toLowerCase();
    return rawData.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm)
      )
    );
  }, [rawData, searchValue]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.column || !sortConfig.direction) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.column!];
      const bVal = b[sortConfig.column!];
      
      let comparison = 0;
      if (aVal > bVal) comparison = 1;
      else if (aVal < bVal) comparison = -1;
      
      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const totalRows = sortedData.length;
  const totalPages = showAll ? 1 : Math.ceil(totalRows / rowsPerPage);
  const startIndex = showAll ? 0 : (currentPage - 1) * rowsPerPage;
  const endIndex = showAll ? totalRows : Math.min(startIndex + rowsPerPage, totalRows);
  const visibleData = sortedData.slice(startIndex, endIndex);

  const handleSort = useCallback((column: string) => {
    // Set the active column for Data Explorer when clicking headers
    setActiveColumn(column);
    
    // First click: Open Data Explorer and Column Editor if not already open
    if (!dataExplorerOpen) {
      toggleDataExplorer();
    }
    if (!rightPanelOpen) {
      toggleRightPanel();
    }
    
    // If panels are already open, handle sorting
    if (dataExplorerOpen && rightPanelOpen) {
      setSortConfig(prev => {
        if (prev.column !== column) {
          // New column - start with asc
          return { column, direction: 'asc' };
        } else {
          // Same column - cycle through asc -> desc -> none
          if (prev.direction === 'asc') {
            return { column, direction: 'desc' };
          } else if (prev.direction === 'desc') {
            return { column: null, direction: null };
          } else {
            return { column, direction: 'asc' };
          }
        }
      });
      setCurrentPage(1);
    }
  }, [setActiveColumn, dataExplorerOpen, rightPanelOpen, toggleDataExplorer, toggleRightPanel]);

  const handleRowsPerPageChange = useCallback((value: string) => {
    if (value === 'all') {
      setShowAll(true);
      setCurrentPage(1);
    } else {
      setShowAll(false);
      setRowsPerPage(parseInt(value));
      setCurrentPage(1);
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);



  const getColumnWidth = useCallback((column: string) => {
    return columnWidths[column] || 120;
  }, [columnWidths]);

  const handleColumnResize = useCallback((column: string, width: number) => {
    setColumnWidths(prev => ({ ...prev, [column]: Math.max(60, width) }));
  }, []);

  const handleCellClick = useCallback((rowId: string, columnKey: string, event?: React.MouseEvent) => {
    if (event?.ctrlKey || event?.metaKey) {
      // Ctrl+click for multi-selection
      event.preventDefault();
      toggleCellSelection(rowId, columnKey);
    } else {
      // Normal click for highlighting
      setHighlight({ rowId, columnKey });
    }
    
    // Always set the active column for Data Explorer
    setActiveColumn(columnKey);
  }, [toggleCellSelection, setActiveColumn]);

  const handleClearHighlight = useCallback(() => {
    setHighlight({ rowId: null, columnKey: null });
  }, []);

  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+right-click clears all selections
      clearAllSelections();
    } else if (hasSelections()) {
      // Right-click removes last selection
      removeLastSelection();
    } else {
      // Normal right-click clears highlight
      handleClearHighlight();
    }
  }, [handleClearHighlight, clearAllSelections, removeLastSelection, hasSelections]);

  // Middle-mouse panning - improved for smooth movement
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      
      if (wrapperRef.current) {
        wrapperRef.current.style.userSelect = 'none';
        wrapperRef.current.style.cursor = 'grabbing';
      }
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && panStart && wrapperRef.current) {
      e.preventDefault();
      
      // Fast direct panning with sensitivity multiplier
      const deltaX = (panStart.x - e.clientX) /2;
      const deltaY = (panStart.y - e.clientY) /2;
      
      // Direct scroll update for maximum responsiveness
      wrapperRef.current.scrollLeft += deltaX;
      wrapperRef.current.scrollTop += deltaY;
      
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 && isPanning) {
      e.preventDefault();
      setIsPanning(false);
      setPanStart(null);
      
      if (wrapperRef.current) {
        wrapperRef.current.style.userSelect = '';
        wrapperRef.current.style.cursor = '';
      }
    }
  }, [isPanning]);

  // Global mouse events for panning - improved for smooth movement
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPanning && panStart && wrapperRef.current) {
        e.preventDefault();
        
        const deltaX = (panStart.x - e.clientX) * 1.5;
        const deltaY = (panStart.y - e.clientY) * 1.5;
        
        // Direct fast global panning - no RAF for maximum speed
        wrapperRef.current.scrollLeft += deltaX;
        wrapperRef.current.scrollTop += deltaY;
        
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (e.button === 1 && isPanning) {
        e.preventDefault();
        setIsPanning(false);
        setPanStart(null);
        
        if (wrapperRef.current) {
          wrapperRef.current.style.userSelect = '';
          wrapperRef.current.style.cursor = '';
        }
        document.body.style.cursor = '';
      }
    };

    if (isPanning) {
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = 'grabbing';
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = '';
    };
  }, [isPanning, panStart]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!highlight.rowId || !highlight.columnKey) return;
      
      if (e.key === 'Escape') {
        handleClearHighlight();
        return;
      }
      
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      
      e.preventDefault();
      
      const currentRowIndex = visibleData.findIndex(row => row.__rowId === highlight.rowId);
      const currentColIndex = columns.findIndex(col => col === highlight.columnKey);
      
      if (currentRowIndex === -1 || currentColIndex === -1) return;
      
      let newRowIndex = currentRowIndex;
      let newColIndex = currentColIndex;
      
      switch (e.key) {
        case 'ArrowUp':
          newRowIndex = Math.max(0, currentRowIndex - 1);
          break;
        case 'ArrowDown':
          newRowIndex = Math.min(visibleData.length - 1, currentRowIndex + 1);
          break;
        case 'ArrowLeft':
          newColIndex = Math.max(0, currentColIndex - 1);
          break;
        case 'ArrowRight':
          newColIndex = Math.min(columns.length - 1, currentColIndex + 1);
          break;
      }
      
      const newRow = visibleData[newRowIndex];
      const newColumn = columns[newColIndex];
      
      if (newRow && newColumn) {
        setHighlight({ rowId: newRow.__rowId, columnKey: newColumn });
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [highlight, visibleData, columns, handleClearHighlight]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue]);

  // Reset local state when dataset changes
  useEffect(() => {
    if (activeDatasetId) {
      setSearchValue('');
      setCurrentPage(1);
      setHighlight({ rowId: null, columnKey: null });
      setSortConfig({ column: null, direction: null });
      setShowAll(false);
      setRowsPerPage(25);
      clearAllSelections();
    }
  }, [activeDatasetId, clearAllSelections]);


  if (!activeDataset || isLoading) {
    return (
      <div className={styles.dataViewGrid}>
        <div className={styles.emptyState}>
          <svg className={styles.emptyState__icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <div className={styles.emptyState__text}>
            {isLoading ? t('placeholders.dataset.loading') : t('placeholders.dataset.none')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${styles.dataViewGrid} ${hasSelections() ? styles['dataViewGrid--multiSelect'] : ''}`} 
      onContextMenu={handleRightClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <DataFilterBar 
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onClearHighlight={handleClearHighlight}
        hasHighlight={highlight.rowId !== null || highlight.columnKey !== null}
        statusText={{
          from: totalRows === 0 ? 0 : startIndex + 1,
          to: endIndex,
          total: totalRows
        }}
        coloringMode={coloringMode}
        onColoringModeChange={setColoringMode}
        showFilter={showFilter}
        onShowFilterChange={setShowFilter}
        onClearFilters={() => {
          setColoringMode('Type');
          setShowFilter('All');
        }}
      />
      
      <div ref={containerRef} className={styles.tableContainer} title={t('table.tooltip.horizontalScroll')}>
        <div className={styles.scrollShadows}>
          <div className={styles.scrollShadowStart} />
          <div className={styles.scrollShadowEnd} />
        </div>
        
        <div ref={wrapperRef} className={styles.tableWrapper}>
          <table ref={tableRef} className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                {columns.map(column => (
                  <th 
                    key={column} 
                    className={`${styles.headerCell} ${
                      sortConfig.column === column ? styles.headerCellSorted : ''
                    } ${highlight.columnKey === column ? styles.headerCellHighlighted : ''}`}
                    style={{ width: getColumnWidth(column) }}
                  >
                    <div className={styles.headerContent}>
                      <button
                        className={styles.headerButton}
                        onClick={() => handleSort(column)}
                        title={
                          sortConfig.column === column && sortConfig.direction === 'asc'
                            ? t('table.sort.desc')
                            : sortConfig.column === column && sortConfig.direction === 'desc'
                            ? t('table.sort.none')
                            : t('table.sort.asc')
                        }
                      >
                        <span className={styles.headerText}>{column}</span>
                        {sortConfig.column === column && sortConfig.direction && (
                          <span className={styles.sortIcon}>
                            {sortConfig.direction === 'asc' && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="6,15 12,9 18,15"/>
                              </svg>
                            )}
                            {sortConfig.direction === 'desc' && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="6,9 12,15 18,9"/>
                              </svg>
                            )}
                          </span>
                        )}
                      </button>
                      
                      
                      <div
                        className={styles.resizeHandle}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const startX = e.clientX;
                          const startWidth = getColumnWidth(column);
                          
                          const handleMouseMove = (e: MouseEvent) => {
                            const width = startWidth + (e.clientX - startX);
                            handleColumnResize(column, width);
                          };
                          
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                        title={t('table.column.resize')}
                      />
                    </div>
                    
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className={styles.tableBody}>
              {visibleData.map((row, index) => (
                <tr 
                  key={row.__rowId || index}
                  className={`${styles.tableRow} ${
                    highlight.rowId === row.__rowId ? styles.tableRowHighlighted : ''
                  }`}
                >
                  {columns.map(column => {
                    const cellValue = row[column];
                    const isSelected = isCellSelected(row.__rowId, column);
                    const shouldShow = shouldShowCell(cellValue, column, index, sortedData);
                    const colorClass = getCellColorClass(cellValue, column, index, sortedData);
                    
                    // Build className
                    const cellClasses = [styles.tableCell];
                    if (highlight.columnKey === column) {
                      cellClasses.push(styles.tableCellColumnHighlighted);
                    }
                    if (highlight.rowId === row.__rowId && highlight.columnKey === column) {
                      cellClasses.push(styles.tableCellIntersection);
                    }
                    if (isSelected) {
                      cellClasses.push(styles['cell--selected']);
                    }
                    if (!shouldShow) {
                      cellClasses.push(styles['cell--muted']);
                    }
                    // Add color class for cell coloring
                    if (colorClass) {
                      cellClasses.push(colorClass);
                    }
                    
                    return (
                    <td 
                      key={column} 
                      className={cellClasses.join(' ')}
                      style={{ 
                        width: getColumnWidth(column),
                        opacity: shouldShow ? 1 : 0.3
                      }}
                      onClick={(e) => handleCellClick(row.__rowId, column, e)}
                    >
                      <div className={`${styles.cellContent} ${
                        (() => {
                          const value = row[column];
                          
                          // Handle null, undefined, empty string
                          if (value === null || value === undefined || value === '') {
                            return styles.cellContentEmpty;
                          }
                          
                          // Detect data type and apply appropriate styling
                          if (typeof value === 'number' || (!isNaN(Number(value)) && value !== '')) {
                            return styles.cellContentNumber;
                          }
                          
                          if (typeof value === 'boolean' || value === 'true' || value === 'false') {
                            return styles.cellContentBoolean;
                          }
                          
                          // Check if it looks like a date
                          const stringValue = String(value);
                          if (stringValue.match(/^\d{4}-\d{2}-\d{2}/) || stringValue.match(/^\d{2}\/\d{2}\/\d{4}/)) {
                            return styles.cellContentDate;
                          }
                          
                          // Default to text styling
                          return styles.cellContentText;
                        })()
                      } ${colorClass}`}>
{(() => {
                          const value = row[column];
                          // Handle null, undefined, empty string
                          if (value === null || value === undefined || value === '') {
                            return (
                              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', fontSize: 'var(--font-size-xs)' }}>
                                <svg width="6" height="6" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.6 }}>
                                  <circle cx="12" cy="12" r="2"/>
                                </svg>
                                —
                              </span>
                            );
                          }
                          // Handle legitimate zero values
                          if (value === 0 || value === '0') {
                            return (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.6 }}>
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                                </svg>
                                0
                              </span>
                            );
                          }
                          // Boolean values
                          if (typeof value === 'boolean') {
                            return (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {value ? (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                  </svg>
                                ) : (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                  </svg>
                                )}
                                {value ? t('data.boolean.true') : t('data.boolean.false')}
                              </span>
                            );
                          }
                          if (value === 'true' || value === 'false') {
                            const isTrue = value === 'true';
                            return (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {isTrue ? (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                  </svg>
                                ) : (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                  </svg>
                                )}
                                {isTrue ? t('data.boolean.true') : t('data.boolean.false')}
                              </span>
                            );
                          }
                          // Numbers (for visual consistency, add subtle icon)
                          if (typeof value === 'number' || (!isNaN(Number(value)) && value !== '')) {
                            return (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.4 }}>
                                  <path d="M17.5 3H6.5C5.67 3 5 3.67 5 4.5v15c0 .83.67 1.5 1.5 1.5h11c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zM16 14h-2v2h-4v-2H8v-4h2V8h4v2h2v4z"/>
                                </svg>
                                {String(value)}
                              </span>
                            );
                          }
                          
                          // Date values
                          const stringValue = String(value);
                          if (stringValue.match(/^\d{4}-\d{2}-\d{2}/) || stringValue.match(/^\d{2}\/\d{2}\/\d{4}/)) {
                            return (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.6 }}>
                                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
                                </svg>
                                {stringValue}
                              </span>
                            );
                          }
                          
                          // Regular text values
                          return String(value);
                        })()}
                      </div>
                    </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRows={totalRows}
        rowsPerPage={rowsPerPage}
        showAll={showAll}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </div>
  );
}