import { useState, useMemo } from 'react';
import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import { ColumnProfile } from '../../../../../core/profiling/columnTypes';
import { Dataset } from '../../../../../state/useDatasetStore';
import styles from './DataGridSection.module.css';

interface DataGridSectionProps {
  activeColumn: string;
  columnProfile: ColumnProfile | null;
  dataset: Dataset | null;
}

export function DataGridSection({ activeColumn, columnProfile, dataset }: DataGridSectionProps) {
  const { t } = useLanguage();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showOnlyNonNull, setShowOnlyNonNull] = useState<boolean>(false);

  // Get column data and apply filters/sorting
  const processedData = useMemo(() => {
    if (!dataset?.data || !activeColumn) return [];

    let data = dataset.data.map((row, index) => ({
      rowIndex: index,
      value: row[activeColumn],
      originalRow: row
    }));

    // Filter non-null values if requested
    if (showOnlyNonNull) {
      data = data.filter(item => item.value !== null && item.value !== undefined && item.value !== '');
    }

    // Apply sorting
    if (sortOrder) {
      data.sort((a, b) => {
        let aVal = a.value;
        let bVal = b.value;

        // Handle null/undefined values
        if (aVal === null || aVal === undefined || aVal === '') aVal = '';
        if (bVal === null || bVal === undefined || bVal === '') bVal = '';

        // Convert to numbers if possible for proper numeric sorting
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
        }

        // String comparison
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        if (sortOrder === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return data;
  }, [dataset?.data, activeColumn, sortOrder, showOnlyNonNull]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = currentPage * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, currentPage, pageSize]);

  const totalPages = Math.ceil(processedData.length / pageSize);

  const handleSort = () => {
    if (sortOrder === null) {
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortOrder(null);
    }
    setCurrentPage(0); // Reset to first page when sorting
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value);
  };

  const getValueClass = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return styles.nullValue;
    }
    if (typeof value === 'number') {
      return styles.numericValue;
    }
    if (typeof value === 'boolean') {
      return styles.booleanValue;
    }
    return styles.textValue;
  };

  if (!dataset?.data || !activeColumn || !columnProfile) {
    return null;
  }

  return (
    <div className={styles.dataGridSection}>
      <div className={styles.gridHeader}>
        <div className={styles.titleSection}>
          <h3 className={styles.gridTitle}>
            {t('dataExplorer.grid.title')} - {activeColumn}
          </h3>
          <div className={styles.gridStats}>
            <span className={styles.statBadge}>
              {processedData.length} {t('dataExplorer.grid.records')}
            </span>
            {showOnlyNonNull && (
              <span className={styles.filterBadge}>
                {t('dataExplorer.grid.filtered')}
              </span>
            )}
          </div>
        </div>
        
        <div className={styles.gridControls}>
          <label className={styles.filterControl}>
            <input 
              type="checkbox"
              checked={showOnlyNonNull}
              onChange={(e) => {
                setShowOnlyNonNull(e.target.checked);
                setCurrentPage(0);
              }}
            />
            <span>{t('dataExplorer.grid.hideNull')}</span>
          </label>
          
          <select 
            className={styles.pageSizeSelect}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(0);
            }}
          >
            <option value={10}>10 {t('dataExplorer.grid.perPage')}</option>
            <option value={20}>20 {t('dataExplorer.grid.perPage')}</option>
            <option value={50}>50 {t('dataExplorer.grid.perPage')}</option>
            <option value={100}>100 {t('dataExplorer.grid.perPage')}</option>
          </select>
        </div>
      </div>

      <div className={styles.gridContainer}>
        <div className={styles.gridTable}>
          <div className={styles.gridTableHeader}>
            <div className={styles.headerCell} onClick={handleSort}>
              <span>Row #</span>
            </div>
            <div className={styles.headerCell} onClick={handleSort}>
              <span>{activeColumn}</span>
              {sortOrder && (
                <span className={styles.sortIcon}>
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
          </div>
          
          <div className={styles.gridTableBody}>
            {paginatedData.map((item, index) => (
              <div key={`${item.rowIndex}-${index}`} className={styles.gridRow}>
                <div className={styles.rowIndexCell}>
                  #{item.rowIndex + 1}
                </div>
                <div className={`${styles.valueCell} ${getValueClass(item.value)}`}>
                  {formatValue(item.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.paginationBtn}
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            ← {t('dataExplorer.grid.previous')}
          </button>
          
          <span className={styles.pageInfo}>
            {t('dataExplorer.grid.page')} {currentPage + 1} {t('dataExplorer.grid.of')} {totalPages}
          </span>
          
          <button
            className={styles.paginationBtn}
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
          >
            {t('dataExplorer.grid.next')} →
          </button>
        </div>
      )}
    </div>
  );
}