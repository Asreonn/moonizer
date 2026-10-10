import { useLanguage } from '../../../../core/i18n/LanguageProvider';
import styles from './DataPagination.module.css';

interface DataPaginationProps {
  currentPage: number;
  totalPages: number;
  totalRows: number;
  rowsPerPage: number;
  showAll: boolean;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (value: string) => void;
}

export function DataPagination({
  currentPage,
  totalPages,
  totalRows,
  rowsPerPage,
  showAll,
  startIndex,
  endIndex,
  onPageChange,
  onRowsPerPageChange
}: DataPaginationProps) {
  const { t } = useLanguage();

  const pageOptions = [10, 25, 50, 100];
  const maxVisiblePages = 5;

  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(currentPage - half, 1);
    let end = Math.min(start + maxVisiblePages - 1, totalPages);

    if (end - start < maxVisiblePages - 1) {
      start = Math.max(end - maxVisiblePages + 1, 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();

  if (totalRows === 0) return null;

  return (
    <div className={styles.pagination}>
      <div className={styles.leftSection}>
        <div className={styles.rowsPerPage}>
          <label className={styles.label}>
            {t('table.pagination.rowsPerPage')}:
          </label>
          <select
            value={showAll ? 'all' : rowsPerPage.toString()}
            onChange={(e) => onRowsPerPageChange(e.target.value)}
            className={styles.select}
          >
            {pageOptions.map(option => (
              <option key={option} value={option.toString()}>
                {option}
              </option>
            ))}
            <option value="all">{t('table.pagination.showAll')}</option>
          </select>
        </div>

        <div className={styles.info}>
          {t('table.status.showingPrefix')} <span className={styles.accent}>{totalRows === 0 ? 0 : startIndex + 1}–{endIndex}</span> {t('table.status.showingOf')} {totalRows}
        </div>
      </div>

      {!showAll && totalPages > 1 && (
        <div className={styles.rightSection}>
          <div className={styles.pageControls}>
            <button
              className={`${styles.pageButton} ${styles.navButton}`}
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              title={t('table.pagination.firstPage')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="11,17 6,12 11,7"/>
                <polyline points="18,17 13,12 18,7"/>
              </svg>
            </button>

            <button
              className={`${styles.pageButton} ${styles.navButton}`}
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              title={t('table.pagination.previousPage')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
            </button>

            {visiblePages[0] > 1 && (
              <>
                <button
                  className={styles.pageButton}
                  onClick={() => onPageChange(1)}
                >
                  1
                </button>
                {visiblePages[0] > 2 && (
                  <span className={styles.ellipsis}>...</span>
                )}
              </>
            )}

            {visiblePages.map(page => (
              <button
                key={page}
                className={`${styles.pageButton} ${currentPage === page ? styles.pageButtonActive : ''}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            ))}

            {visiblePages[visiblePages.length - 1] < totalPages && (
              <>
                {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                  <span className={styles.ellipsis}>...</span>
                )}
                <button
                  className={styles.pageButton}
                  onClick={() => onPageChange(totalPages)}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              className={`${styles.pageButton} ${styles.navButton}`}
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              title={t('table.pagination.nextPage')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </button>

            <button
              className={`${styles.pageButton} ${styles.navButton}`}
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              title={t('table.pagination.lastPage')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="13,17 18,12 13,7"/>
                <polyline points="6,17 11,12 6,7"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}