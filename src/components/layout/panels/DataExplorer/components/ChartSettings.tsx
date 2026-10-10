import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import { ColumnProfile } from '../../../../../core/profiling/columnTypes';
// Define types locally
type ChartType = 'histogram' | 'bar' | 'line' | 'scatter' | 'box' | 'pie' | 'area' | 'heatmap';
interface ChartConfig {
  color: string;
  backgroundColor?: string;
  type?: string;
  showLabels?: boolean;
  showGrid?: boolean;
  bins?: number;
}
import styles from './ChartSettings.module.css';

interface ChartSettingsProps {
  chartLayout: 'single' | 'sideBySide';
  leftChart: ChartConfig;
  rightChart: ChartConfig;
  columnProfile: ColumnProfile;
  onLeftChartChange: (config: ChartConfig) => void;
  onRightChartChange: (config: ChartConfig) => void;
}

export function ChartSettings({
  chartLayout,
  leftChart,
  rightChart,
  columnProfile,
  onLeftChartChange,
  onRightChartChange
}: ChartSettingsProps) {
  const { t } = useLanguage();

  const availableChartTypes = getAvailableChartTypes(columnProfile.type);
  const colorOptions = [
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#f59e0b', // amber
    '#ec4899', // pink
    '#10b981', // emerald
    '#f97316', // orange
    '#6366f1', // indigo
    '#84cc16'  // lime
  ];

  const renderChartConfig = (
    config: ChartConfig,
    onChange: (config: ChartConfig) => void,
    title: string
  ) => (
    <div className={styles.configGroup}>
      <h4 className={styles.configTitle}>{title}</h4>
      
      {/* Chart Type */}
      <div className={styles.configRow}>
        <label className={styles.configLabel}>
          {t('dataExplorer.config.chartType')}
        </label>
        <select
          value={config.type}
          onChange={(e) => onChange({ ...config, type: e.target.value as ChartType })}
          className={styles.configSelect}
        >
          {availableChartTypes.map(type => (
            <option key={type} value={type}>
              {t(`dataExplorer.chartTypes.${type}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Color Picker */}
      <div className={styles.configRow}>
        <label className={styles.configLabel}>
          {t('dataExplorer.config.color')}
        </label>
        <div className={styles.colorPicker}>
          {colorOptions.map(color => (
            <button
              key={color}
              className={`${styles.colorSwatch} ${config.color === color ? styles.selected : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onChange({ ...config, color })}
            />
          ))}
        </div>
      </div>

      {/* Chart Options */}
      <div className={styles.configRow}>
        <label className={styles.configLabel}>
          {t('dataExplorer.config.options')}
        </label>
        <div className={styles.optionsList}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={config.showGrid}
              onChange={(e) => onChange({ ...config, showGrid: e.target.checked })}
              className={styles.checkbox}
            />
            {t('dataExplorer.config.showGrid')}
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={config.showLabels}
              onChange={(e) => onChange({ ...config, showLabels: e.target.checked })}
              className={styles.checkbox}
            />
            {t('dataExplorer.config.showLabels')}
          </label>
        </div>
      </div>

      {/* Histogram-specific options */}
      {config.type === 'histogram' && (
        <div className={styles.configRow}>
          <label className={styles.configLabel}>
            Bins
          </label>
          <input
            type="range"
            min="5"
            max="50"
            value={config.bins || 20}
            onChange={(e) => onChange({ ...config, bins: parseInt(e.target.value) })}
            className={styles.rangeSlider}
          />
          <span className={styles.rangeValue}>{config.bins || 20}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.chartSettings}>
      {chartLayout === 'single' ? (
        renderChartConfig(leftChart, onLeftChartChange, t('dataExplorer.config.chart'))
      ) : (
        <div className={styles.dualConfig}>
          {renderChartConfig(leftChart, onLeftChartChange, t('dataExplorer.config.leftChart'))}
          <div className={styles.configDivider} />
          {renderChartConfig(rightChart, onRightChartChange, t('dataExplorer.config.rightChart'))}
        </div>
      )}
    </div>
  );
}

function getAvailableChartTypes(columnType: string): ChartType[] {
  switch (columnType) {
    case 'numeric':
      return ['histogram', 'line', 'scatter'];
    case 'categorical':
      return ['bar', 'pie'];
    case 'boolean':
      return ['pie', 'bar'];
    case 'datetime':
      return ['line', 'bar'];
    case 'text':
      return ['bar', 'pie'];
    default:
      return ['bar', 'pie', 'histogram', 'line', 'scatter'];
  }
}