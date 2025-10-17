import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../../../core/i18n/LanguageProvider';
import { useColumnEditorStore } from '../../../../state/useColumnEditorStore';
import { useDatasetStore } from '../../../../state/useDatasetStore';
import { generateColumnProfile } from '../../../../core/profiling/columnTypes';
import { SimpleChartRenderer } from './components/SimpleChartRenderer';
import { AnalysisSection } from './components/AnalysisSection';
import { DataGridSection } from './components/DataGridSection';
import { useChartExport } from '../../../../core/hooks/useChartExport';
import { ExportAppearanceOptions } from '../../../../core/export/chartPngExport';
import styles from './DataExplorerPanel.module.css';

type ChartType = 'bar' | 'line' | 'scatter' | 'box' | 'pie' | 'area' | 'heatmap';
type ChartLayout = 'single' | 'dual';

interface DualSettings {
  leftChart: ChartType;
  rightChart: ChartType;
  syncScales: boolean;
  showGrid: boolean;
  leftShowValues: boolean;
  rightShowValues: boolean;
}

export function DataExplorerPanel() {
  const { t } = useLanguage();
  const { activeColumn } = useColumnEditorStore();
  const { datasets, activeDatasetId } = useDatasetStore();
  const { exportDedicatedChart, isExporting } = useChartExport();
  
  // Refs for chart containers
  const singleChartRef = useRef<HTMLDivElement>(null);
  const leftChartRef = useRef<HTMLDivElement>(null);
  const rightChartRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const exportButtonWrapperRef = useRef<HTMLDivElement>(null);
  const [exportMenuPosition, setExportMenuPosition] = useState<{ top: number; left: number } | null>(null);
  
  // Chart settings state
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [chartLayout, setChartLayout] = useState<ChartLayout>('single');
  const [singleSettings, setSingleSettings] = useState({
    showGrid: false,
    showValues: true
  });
  const [dualSettings, setDualSettings] = useState<DualSettings>({
    leftChart: 'bar' as ChartType,
    rightChart: 'line' as ChartType,
    syncScales: true,
    showGrid: false,
    leftShowValues: true,
    rightShowValues: true
  });
  const getChartTypeLabel = useCallback((chart: ChartType) => {
    const key = `dataExplorer.chartTypes.${chart}` as const;
    const translated = t(key);
    if (translated === key) {
      return chart.charAt(0).toUpperCase() + chart.slice(1);
    }
    return translated;
  }, [t]);
  const getLeftOptionLabel = useCallback(
    (chart: ChartType) => t('dataExplorer.config.leftOption', { chart: getChartTypeLabel(chart) }),
    [getChartTypeLabel, t]
  );
  const getRightOptionLabel = useCallback(
    (chart: ChartType) => t('dataExplorer.config.rightOption', { chart: getChartTypeLabel(chart) }),
    [getChartTypeLabel, t]
  );

  const activeDataset = activeDatasetId ? datasets.find(d => d.id === activeDatasetId) : null;

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportAppearance, setExportAppearance] = useState<ExportAppearanceOptions>({
    mode: 'transparent'
  });
  const appearanceOptions: Array<{ mode: ExportAppearanceOptions['mode']; label: string }> = useMemo(() => ([
    {
      mode: 'transparent',
      label: t('dataExplorer.export.appearance.options.transparent')
    },
    {
      mode: 'light',
      label: t('dataExplorer.export.appearance.options.light')
    },
    {
      mode: 'dark',
      label: t('dataExplorer.export.appearance.options.dark')
    }
  ]), [t]);

  useEffect(() => {
    if (!exportMenuOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExportMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [exportMenuOpen]);

  useEffect(() => {
    if (!exportMenuOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (exportMenuRef.current?.contains(target)) {
        return;
      }
      if (exportButtonWrapperRef.current?.contains(target)) {
        return;
      }
      setExportMenuOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [exportMenuOpen]);

  // Generate column profile when we have active column and data
  const columnProfile = useMemo(() => {
    if (!activeColumn || !activeDataset?.data || activeDataset.data.length === 0) {
      return null;
    }

    const columnData = activeDataset.data.map(row => row[activeColumn]);
    
    // Simple debug to understand the issue
    if (columnData.every(v => v === 0 || v === null || v === undefined)) {
      console.warn(`⚠️ Column "${activeColumn}" contains only zeros/nulls:`, columnData.slice(0, 5));
      console.warn('Available columns:', Object.keys(activeDataset.data[0] || {}));
      console.warn('Sample row:', activeDataset.data[0]);
    }
    
    return generateColumnProfile(columnData, activeColumn);
  }, [activeColumn, activeDataset]);

  // Calculate shared max value for sync scales
  const sharedMaxValue = dualSettings.syncScales && activeDataset?.data && activeColumn ? 
    Math.max(...activeDataset.data.map(row => row[activeColumn]).filter(v => v !== null && v !== undefined).map(v => Number(v) || 0)) : undefined;


  const runDedicatedExport = useCallback(async (appearance: ExportAppearanceOptions) => {
    if (!activeColumn || !activeDataset || !columnProfile) {
      return;
    }

    try {
      const columnData = activeDataset.data.map(row => row[activeColumn]);
      
      if (chartLayout === 'single') {
        // Single chart export
        await exportDedicatedChart(
          activeColumn,
          columnProfile,
          columnData,
          chartType,
          undefined,
          appearance,
          t
        );
      } else {
        // Dual chart export - export both charts side by side
        await exportDedicatedChart(
          activeColumn,
          columnProfile,
          columnData,
          dualSettings.leftChart,
          {
            isDual: true,
            leftChart: dualSettings.leftChart,
            rightChart: dualSettings.rightChart,
            syncScales: dualSettings.syncScales,
            maxValue: sharedMaxValue
          },
          appearance,
          t
        );
      }
    } catch (error) {
      console.error('Dedicated chart export failed:', error);
      // Could add toast notification here
    }
  }, [
    activeColumn, 
    activeDataset, 
    columnProfile,
    chartLayout, 
    chartType, 
    dualSettings,
    sharedMaxValue,
    exportDedicatedChart,
    t
  ]);

  const handleConfirmExport = useCallback(async () => {
    if (isExporting) {
      return;
    }

    setExportMenuOpen(false);
    await runDedicatedExport(exportAppearance);
  }, [exportAppearance, isExporting, runDedicatedExport]);

  const toggleExportMenu = useCallback(() => {
    if (isExporting) {
      return;
    }

    setExportMenuOpen(prev => {
      const next = !prev;
      if (next) {
        const rect = exportButtonWrapperRef.current?.getBoundingClientRect();
        if (rect) {
          const menuWidth = 220;
          const gutter = 16;
          const left = Math.min(
            window.scrollX + rect.right - menuWidth,
            window.scrollX + window.innerWidth - menuWidth - gutter
          );
          const constrainedLeft = Math.max(window.scrollX + gutter, left);
          const top = window.scrollY + rect.bottom + 12;
          setExportMenuPosition({ top, left: constrainedLeft });
        } else {
          setExportMenuPosition(null);
        }
      }
      return next;
    });
  }, [isExporting]);

  const handleAppearanceSelect = useCallback((mode: ExportAppearanceOptions['mode']) => {
    setExportAppearance({ mode });
  }, []);

  useEffect(() => {
    if (isExporting) {
      setExportMenuOpen(false);
    }
  }, [isExporting]);

  useEffect(() => {
    if (!exportMenuOpen) {
      setExportMenuPosition(null);
    }
  }, [exportMenuOpen]);

  useEffect(() => {
    if (!exportMenuOpen) {
      return;
    }

    const updatePosition = () => {
      const rect = exportButtonWrapperRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      const menuWidth = 300;
      const gutter = 16;
      const left = Math.min(
        window.scrollX + rect.right - menuWidth,
        window.scrollX + window.innerWidth - menuWidth - gutter
      );
      const constrainedLeft = Math.max(window.scrollX + gutter, left);
      const top = window.scrollY + rect.bottom + 12;
      setExportMenuPosition({ top, left: constrainedLeft });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [exportMenuOpen]);

  // Show empty state when no column is selected
  if (!activeColumn || !activeDataset) {
    return (
      <div className={styles.dataExplorer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3v18h18"/>
              <path d="M8 12l4-4 4 4 4-4"/>
              <circle cx="8" cy="8" r="2"/>
              <circle cx="16" cy="16" r="2"/>
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>
            {t('dataExplorer.title')}
          </h3>
          <p className={styles.emptyDescription}>
            {t('dataExplorer.states.selectColumn')}
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while generating profile
  if (!columnProfile) {
    return (
      <div className={styles.dataExplorer}>
        <div className={styles.loadingState}>
          <div className={styles.loadingIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
          </div>
          <p>{t('dataExplorer.states.loading')}</p>
        </div>
      </div>
    );
  }



  // Main explorer layout with charts section and analysis section
  return (
    <div className={styles.dataExplorer}>
      <div className={styles.explorerContent}>
        {/* Compact Chart Controls - Single Line */}
        <div className={styles.compactControls}>
          <div className={styles.controlsRow}>
            <div className={styles.leftControls}>
              <div className={styles.layoutButtons}>
                <button
                  className={`${styles.layoutBtn} ${chartLayout === 'single' ? styles.active : ''}`}
                  onClick={() => setChartLayout('single')}
                  title={t('dataExplorer.chart.layout.single')}
                >
                  Single
                </button>
                <button
                  className={`${styles.layoutBtn} ${chartLayout === 'dual' ? styles.active : ''}`}
                  onClick={() => setChartLayout('dual')}
                  title={t('dataExplorer.chart.layout.sideBySide')}
                >
                  Dual
                </button>
              </div>
              
{chartLayout === 'single' ? (
              <>
                <select 
                  className={styles.compactSelect}
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as ChartType)}
                  title={t('dataExplorer.config.chartType')}
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="scatter">Scatter Plot</option>
                  <option value="box">Box Plot</option>
                  <option value="pie">Pie Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="heatmap">Heatmap</option>
                </select>
                
                <div className={styles.compactCheckboxes}>
                <label className={styles.compactCheckbox}>
                  <input 
                    type="checkbox" 
                    checked={singleSettings.showGrid}
                    onChange={(e) => setSingleSettings(prev => ({...prev, showGrid: e.target.checked}))}
                  />
                  {t('dataExplorer.export.controls.grid')}
                </label>
                <label className={styles.compactCheckbox}>
                  <input 
                    type="checkbox" 
                    checked={singleSettings.showValues}
                    onChange={(e) => setSingleSettings(prev => ({...prev, showValues: e.target.checked}))}
                  />
                  {t('dataExplorer.export.controls.values')}
                </label>
                </div>
              </>
            ) : (
              <>
                <select 
                  className={styles.compactSelect}
                  value={dualSettings.leftChart}
                  onChange={(e) => setDualSettings(prev => ({...prev, leftChart: e.target.value as ChartType}))}
                  title={t('dataExplorer.config.leftChart')}
                >
                  <option value="bar">{getLeftOptionLabel('bar')}</option>
                  <option value="line">{getLeftOptionLabel('line')}</option>
                  <option value="scatter">{getLeftOptionLabel('scatter')}</option>
                  <option value="box">{getLeftOptionLabel('box')}</option>
                  <option value="pie">{getLeftOptionLabel('pie')}</option>
                  <option value="area">{getLeftOptionLabel('area')}</option>
                  <option value="heatmap">{getLeftOptionLabel('heatmap')}</option>
                </select>
                
                <select 
                  className={styles.compactSelect}
                  value={dualSettings.rightChart}
                  onChange={(e) => setDualSettings(prev => ({...prev, rightChart: e.target.value as ChartType}))}
                  title={t('dataExplorer.config.rightChart')}
                >
                  <option value="bar">{getRightOptionLabel('bar')}</option>
                  <option value="line">{getRightOptionLabel('line')}</option>
                  <option value="scatter">{getRightOptionLabel('scatter')}</option>
                  <option value="box">{getRightOptionLabel('box')}</option>
                  <option value="pie">{getRightOptionLabel('pie')}</option>
                  <option value="area">{getRightOptionLabel('area')}</option>
                  <option value="heatmap">{getRightOptionLabel('heatmap')}</option>
                </select>
                
                <div className={styles.compactCheckboxes}>
                  <label className={styles.compactCheckbox}>
                    <input 
                      type="checkbox" 
                      checked={dualSettings.syncScales}
                      onChange={(e) => setDualSettings(prev => ({...prev, syncScales: e.target.checked}))}
                    />
                    {t('dataExplorer.export.controls.syncScales')}
                  </label>
                  <label className={styles.compactCheckbox}>
                    <input 
                      type="checkbox" 
                      checked={dualSettings.leftShowValues}
                      onChange={(e) => setDualSettings(prev => ({...prev, leftShowValues: e.target.checked}))}
                    />
                    {t('dataExplorer.export.controls.leftValues')}
                  </label>
                  <label className={styles.compactCheckbox}>
                    <input 
                      type="checkbox" 
                      checked={dualSettings.rightShowValues}
                      onChange={(e) => setDualSettings(prev => ({...prev, rightShowValues: e.target.checked}))}
                    />
                    {t('dataExplorer.export.controls.rightValues')}
                  </label>
                </div>
              </>
            )}
            </div>
            
            {/* PNG Export Button */}
            <div className={styles.rightControls}>
              <div className={styles.exportButtonWrapper} ref={exportButtonWrapperRef}>
                <button
                  className={`${styles.exportButton} ${styles.dedicatedExport} ${isExporting ? styles.exporting : ''}`}
                  onClick={toggleExportMenu}
                  disabled={isExporting}
                  title={chartLayout === 'dual'
                    ? t('dataExplorer.export.button.tooltip.dual')
                    : t('dataExplorer.export.button.tooltip.single')}
                >
                  <span className={styles.exportButtonContent}>
                    {isExporting ? (
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
                        <path d="M21 12a9 9 0 11-6.219-8.56" strokeWidth="2"/>
                      </svg>
                    ) : chartLayout === 'dual' ? (
                      // Dual chart icon
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <rect x="2" y="6" width="8" height="12" rx="1" fill="currentColor" opacity="0.7"/>
                        <rect x="14" y="6" width="8" height="12" rx="1" fill="currentColor" opacity="0.7"/>
                        <path d="M6 2v2M6 20v2M18 2v2M18 20v2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      </svg>
                    ) : (
                      // Single chart icon
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M5 12l-3 0m3 0l3 0m-3 0l0 3m0-3l0 -3"/>
                        <path d="M19 12l3 0m-3 0l-3 0m3 0l0 3m0-3l0 -3"/>
                        <path d="M12 5l0 -3m0 3l0 3m0-3l3 0m-3 0l-3 0"/>
                        <path d="M12 19l0 3m0-3l0 -3m0 3l3 0m-3 0l-3 0"/>
                        <rect x="7" y="7" width="10" height="10" rx="1"/>
                      </svg>
                    )}
                    <span className={styles.exportButtonText}>
                      {isExporting
                        ? t('dataExplorer.export.button.exporting')
                        : t('dataExplorer.export.button.label')}
                    </span>
                  </span>
                </button>

                {exportMenuOpen && exportMenuPosition && createPortal(
                  <>
                    <div
                      className={styles.exportMenuBackdrop}
                      onClick={() => setExportMenuOpen(false)}
                    />
                    <div
                      ref={exportMenuRef}
                      className={styles.exportMenu}
                      style={{ top: `${exportMenuPosition.top}px`, left: `${exportMenuPosition.left}px` }}
                      onMouseDown={(event) => event.stopPropagation()}
                    >
                      <header className={styles.exportMenuHeader}>
                        <div className={styles.exportMenuHeaderText}>
                          <span>{t('dataExplorer.export.menu.title')}</span>
                        </div>
                        <button
                          type="button"
                          className={styles.exportMenuClose}
                          onClick={() => setExportMenuOpen(false)}
                          aria-label={t('dataExplorer.export.menu.close')}
                        >
                          ×
                        </button>
                      </header>

                      <div className={styles.exportMenuSection}>
                        <div className={styles.exportMenuLabel}>{t('dataExplorer.export.menu.appearance')}</div>
                        <div className={styles.exportModeList}>
                          {appearanceOptions.map(option => {
                            const isActive = exportAppearance.mode === option.mode;
                            return (
                              <button
                                key={option.mode}
                                type="button"
                                className={`${styles.exportModeOption} ${isActive ? styles.exportModeOptionActive : ''}`}
                                data-mode={option.mode}
                                onClick={() => handleAppearanceSelect(option.mode)}
                              >
                                <span className={styles.exportModeSwatch} aria-hidden="true" />
                                <span className={styles.exportModeLabel}>{option.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className={styles.exportMenuFooter}>
                        <button
                          className={styles.exportMenuAction}
                          onClick={handleConfirmExport}
                          disabled={isExporting}
                        >
                          {isExporting
                            ? t('dataExplorer.export.status.preparing')
                            : t('dataExplorer.export.actions.download')}
                        </button>
                      </div>
                    </div>
                  </>,
                  document.body
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className={styles.chartsSection}>
          {chartLayout === 'single' ? (
            <div ref={singleChartRef}>
              <SimpleChartRenderer 
                columnProfile={columnProfile}
                columnData={activeDataset.data.map(row => row[activeColumn!])}
                chartType={chartType}
                showGrid={singleSettings.showGrid}
                showValues={singleSettings.showValues}
                syncScales={false}
                maxValue={undefined}
              />
            </div>
          ) : (
            <div className={styles.dualChartsContainer}>
              <div className={styles.chartContainer} ref={leftChartRef}>
                <SimpleChartRenderer 
                  columnProfile={columnProfile}
                  columnData={activeDataset.data.map(row => row[activeColumn!])}
                  chartType={dualSettings.leftChart}
                  showGrid={dualSettings.showGrid}
                  showValues={dualSettings.leftShowValues}
                  syncScales={dualSettings.syncScales}
                  maxValue={sharedMaxValue}
                />
              </div>
              <div className={styles.chartContainer} ref={rightChartRef}>
                <SimpleChartRenderer 
                  columnProfile={columnProfile}
                  columnData={activeDataset.data.map(row => row[activeColumn!])}
                  chartType={dualSettings.rightChart}
                  showGrid={dualSettings.showGrid}
                  showValues={dualSettings.rightShowValues}
                  syncScales={dualSettings.syncScales}
                  maxValue={sharedMaxValue}
                />
              </div>
            </div>
          )}
        </div>

        {/* Data Grid Section */}
        <DataGridSection 
          activeColumn={activeColumn}
          columnProfile={columnProfile}
          dataset={activeDataset}
        />

        {/* Column Analysis Section */}
        <AnalysisSection 
          columnProfile={columnProfile}
        />
      </div>
    </div>
  );
}
