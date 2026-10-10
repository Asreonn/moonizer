import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '../../../../core/i18n/LanguageProvider';
import { useLayoutStore } from '../../../../state/useLayoutStore';
import { useDatasetStore } from '../../../../state/useDatasetStore';
import { exportDataset } from '../../../../core/dataset/exportData';
import type { ExportOptions } from '../../../../core/dataset/exportData';
import styles from './ExportPanel.module.css';

export function ExportPanel() {
  const { t } = useLanguage();
  const { exportPanelOpen, exportPanelDatasetId, closeExportPanel } = useLayoutStore();
  const { datasets } = useDatasetStore();

  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [filename, setFilename] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [rowFrom, setRowFrom] = useState<number>(1);
  const [rowTo, setRowTo] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);

  const dataset = useMemo(() => {
    return datasets.find(d => d.id === exportPanelDatasetId);
  }, [datasets, exportPanelDatasetId]);

  // Initialize states when dataset changes
  React.useEffect(() => {
    if (dataset) {
      setFilename(dataset.name);
      setSelectedColumns(dataset.columnNames || []);
      setRowTo(dataset.rows);
    }
  }, [dataset]);

  const handleColumnToggle = useCallback((column: string) => {
    setSelectedColumns(prev => 
      prev.includes(column) 
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  }, []);

  const handleSelectAllColumns = useCallback(() => {
    if (dataset) {
      setSelectedColumns(dataset.columnNames || []);
    }
  }, [dataset]);

  const handleDeselectAllColumns = useCallback(() => {
    setSelectedColumns([]);
  }, []);

  const handleExport = useCallback(async () => {
    if (!dataset) return;

    if (selectedColumns.length === 0) {
      alert(t('dataset.export.messages.noColumns'));
      return;
    }

    if (rowFrom > rowTo || rowFrom < 1 || rowTo > dataset.rows) {
      alert(t('dataset.export.messages.invalidRange'));
      return;
    }

    setIsExporting(true);

    try {
      const options: ExportOptions = {
        format,
        filename,
        columns: selectedColumns,
        rows: { from: rowFrom, to: rowTo }
      };

      exportDataset({
        data: dataset.data || [],
        columnNames: dataset.columnNames || []
      }, options);

      closeExportPanel();
    } catch (error) {
      console.error('Export error:', error);
      alert(t('dataset.export.messages.error'));
    } finally {
      setIsExporting(false);
    }
  }, [dataset, format, filename, selectedColumns, rowFrom, rowTo, t, closeExportPanel]);

  if (!exportPanelOpen || !dataset) {
    return null;
  }

  return (
    <div className={styles.exportPanel}>
      <div className={styles.exportPanel__content}>
        <div className={styles.exportPanel__section}>
          <div className={styles.basicOptions}>
            <div className={styles.basicOptions__format}>
              <label className={styles.exportPanel__label}>
                {t('dataset.export.format.label')}
              </label>
              <div className={styles.formatButtons}>
                <button
                  className={`${styles.formatButton} ${format === 'csv' ? styles['formatButton--active'] : ''}`}
                  onClick={() => setFormat('csv')}
                >
                  {t('dataset.export.format.csv')}
                </button>
                <button
                  className={`${styles.formatButton} ${format === 'json' ? styles['formatButton--active'] : ''}`}
                  onClick={() => setFormat('json')}
                >
                  {t('dataset.export.format.json')}
                </button>
              </div>
            </div>
            
            <div className={styles.basicOptions__filename}>
              <label className={styles.exportPanel__label} htmlFor="filename-input">
                {t('dataset.export.filename.label')}
              </label>
              <input
                id="filename-input"
                type="text"
                className={styles.exportPanel__input}
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder={t('dataset.export.filename.placeholder')}
              />
            </div>
          </div>
        </div>

        <div className={styles.exportPanel__section}>
          <h4 className={styles.exportPanel__sectionTitle}>
            {t('dataset.export.options.title')}
          </h4>

          {/* Column Selection */}
          <div className={styles.exportPanel__option}>
            <label className={styles.exportPanel__label}>
              {t('dataset.export.options.columns.title')}
            </label>
            <div className={styles.columnSelection}>
              <div className={styles.columnSelection__controls}>
                <button
                  className={styles.columnSelection__button}
                  onClick={handleSelectAllColumns}
                >
                  {t('dataset.export.options.columns.selectAll')}
                </button>
                <button
                  className={styles.columnSelection__button}
                  onClick={handleDeselectAllColumns}
                >
                  {t('dataset.export.options.columns.deselectAll')}
                </button>
              </div>
              <div className={styles.columnSelection__list}>
                {dataset.columnNames?.map(column => (
                  <label key={column} className={styles.columnSelection__item}>
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column)}
                      onChange={() => handleColumnToggle(column)}
                    />
                    <span>{column}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Row Selection */}
          <div className={styles.exportPanel__option}>
            <label className={styles.exportPanel__label}>
              {t('dataset.export.options.rows.title')}
            </label>
            <div className={styles.rangeInputs}>
              <div className={styles.rangeInput}>
                <label className={styles.rangeInput__label}>
                  {t('dataset.export.options.rows.rangeFrom')}
                </label>
                <input
                  type="number"
                  className={styles.rangeInput__input}
                  value={rowFrom}
                  onChange={(e) => setRowFrom(Number(e.target.value))}
                  min={1}
                  max={dataset.rows}
                />
              </div>
              <div className={styles.rangeInput}>
                <label className={styles.rangeInput__label}>
                  {t('dataset.export.options.rows.rangeTo')}
                </label>
                <input
                  type="number"
                  className={styles.rangeInput__input}
                  value={rowTo}
                  onChange={(e) => setRowTo(Number(e.target.value))}
                  min={rowFrom}
                  max={dataset.rows}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.exportPanel__actions}>
          <button
            className={styles.exportPanel__cancelButton}
            onClick={closeExportPanel}
          >
            {t('dataset.export.actions.cancel')}
          </button>
          <button
            className={styles.exportPanel__exportButton}
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? '...' : t('dataset.export.actions.export')}
          </button>
        </div>
      </div>
    </div>
  );
}