import { useEffect, useCallback } from 'react';
import { useLanguage } from '../../../../core/i18n/LanguageProvider';
import { useDatasetStore } from '../../../../state/useDatasetStore';
import { loadCsv } from '../../../../core/dataset/loadCsv';
import { DatasetSummaryCard } from './DatasetSummaryCard';
import { DatasetDropzone } from './DatasetDropzone';
import { Skeleton } from '../../../../ui/Placeholder';
import styles from './DatasetManagerPanel.module.css';

export function DatasetManagerPanel() {
  const { t } = useLanguage();
  const {
    datasets,
    activeDatasetId,
    isLoading,
    error,
    addDataset,
    removeDataset,
    setActiveDataset,
    setLoading,
    setError,
    initializePreloadedDatasets,
  } = useDatasetStore();

  useEffect(() => {
    initializePreloadedDatasets();
  }, [initializePreloadedDatasets]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError(t('errors.csv.fileTooLarge'));
      return;
    }

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError(t('errors.csv.invalidFile'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const csvResult = await loadCsv(file);
      
      addDataset({
        name: file.name.replace('.csv', ''),
        fileName: file.name,
        rows: csvResult.rows,
        columns: csvResult.columns.length,
        size: file.size,
        isPreloaded: false,
        data: csvResult.data,
        columnNames: csvResult.columns,
        hasHeaders: csvResult.hasHeaders
      });
      
    } catch (err) {
      console.error('CSV parsing error:', err);
      setError(t('errors.csv.parse'));
    } finally {
      setLoading(false);
    }
  }, [addDataset, setLoading, setError, t]);

  const handleDatasetSelect = useCallback((id: string) => {
    setActiveDataset(id);
  }, [setActiveDataset]);

  const handleDatasetRemove = useCallback((id: string) => {
    removeDataset(id);
  }, [removeDataset]);

  const allDatasets = datasets;

  return (
    <div className={styles.datasetManager}>
      <div className={styles.datasetManager__content}>
        {error && (
          <div className={styles.errorMessage}>
            <svg className={styles.errorMessage__icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
            <button 
              className={styles.errorMessage__dismiss}
              onClick={() => setError(null)}
              aria-label={t('buttons.dismiss_error')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        <div className={styles.dropzoneSection}>
          <DatasetDropzone 
            onFileSelect={handleFileSelect}
            isProcessing={isLoading}
          />
        </div>

        {allDatasets.length > 0 && (
          <>
            {/* Dataset Summary */}
            <div className={styles.datasetSummary}>
              <span className={styles.datasetSummary__item}>
                {allDatasets.length === 1 
                  ? t('panels.datasetManager.summary.count', { count: allDatasets.length })
                  : t('panels.datasetManager.summary.count_plural', { count: allDatasets.length })
                }
              </span>
              <span className={styles.datasetSummary__separator}>•</span>
              <span className={styles.datasetSummary__item}>
                {activeDatasetId ? t('panels.datasetManager.summary.oneActive') : t('panels.datasetManager.summary.noneActive')}
              </span>
            </div>
            
            {/* Scrollable Dataset List */}
            <div className={styles.datasetListContainer}>
              <div className={styles.scrollShadowTop}></div>
              <div className={styles.datasetList}>
                {isLoading && <Skeleton rows={2} />}
                {allDatasets.map((dataset) => (
                  <DatasetSummaryCard
                    key={dataset.id}
                    dataset={dataset}
                    isActive={dataset.id === activeDatasetId}
                    onSelect={() => handleDatasetSelect(dataset.id)}
                    onRemove={() => handleDatasetRemove(dataset.id)}
                  />
                ))}
              </div>
              <div className={styles.scrollShadowBottom}></div>
            </div>
          </>
        )}
      </div>

      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
        </div>
      )}
    </div>
  );
}
