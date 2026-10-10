import { useMemo } from 'react';
import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import { ColumnProfile } from '../../../../../core/profiling/columnTypes';
// Define chart interfaces locally
interface ChartConfig {
  color: string;
  backgroundColor?: string;
  type?: string;
  showLabels?: boolean;
  showGrid?: boolean;
  bins?: number;
}
import styles from './ChartRenderer.module.css';

interface ChartRendererProps {
  config: ChartConfig;
  columnProfile: ColumnProfile;
  columnData: any[];
  className?: string;
}

interface ChartData {
  labels: string[];
  values: number[];
  total: number;
}

export function ChartRenderer({ config, columnProfile, columnData, className }: ChartRendererProps) {
  const { t } = useLanguage();

  // Process data for charting
  const chartData = useMemo(() => {
    return processDataForChart(columnData, config, columnProfile);
  }, [columnData, config, columnProfile]);

  if (!chartData || chartData.values.length === 0) {
    return (
      <div className={`${styles.chartRenderer} ${className || ''}`}>
        <div className={styles.noDataState}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18"/>
            <path d="M8 17l4-4 4 4"/>
          </svg>
          <p>{t('dataExplorer.chart.noValidData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.chartRenderer} ${className || ''}`}>
      <div className={styles.chartCanvas}>
        {config.type === 'histogram' && (
          <HistogramChart data={chartData} config={config} />
        )}
        {config.type === 'bar' && (
          <BarChart data={chartData} config={config} />
        )}
        {config.type === 'pie' && (
          <PieChart data={chartData} config={config} />
        )}
        {config.type === 'line' && (
          <LineChart data={chartData} config={config} />
        )}
        {config.type === 'scatter' && (
          <ScatterChart data={chartData} config={config} />
        )}
      </div>
      
      {config.showLabels && (
        <div className={styles.chartInfo}>
          <span className={styles.totalCount}>
            {chartData.total} {t('dataExplorer.analysis.records')}
          </span>
        </div>
      )}
    </div>
  );
}

// Histogram Chart Component
function HistogramChart({ data, config }: { data: ChartData; config: ChartConfig }) {
  const maxValue = Math.max(...data.values);
  
  return (
    <div className={styles.histogram}>
      {config.showGrid && <div className={styles.grid} />}
      <div className={styles.bars}>
        {data.values.map((value, index) => (
          <div key={index} className={styles.histogramBar}>
            <div
              className={styles.bar}
              style={{
                height: `${(value / maxValue) * 100}%`,
                backgroundColor: config.color
              }}
              />
            {config.showLabels && (
              <div className={styles.barLabel}>
                {data.labels[index]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Bar Chart Component
function BarChart({ data, config }: { data: ChartData; config: ChartConfig }) {
  const maxValue = Math.max(...data.values);
  
  return (
    <div className={styles.barChart}>
      {config.showGrid && <div className={styles.grid} />}
      {data.labels.map((label, index) => (
        <div key={index} className={styles.barRow}>
          <div className={styles.barLabel}>{label}</div>
          <div className={styles.barContainer}>
            <div
              className={styles.bar}
              style={{
                width: `${(data.values[index] / maxValue) * 100}%`,
                backgroundColor: config.color
              }}
            />
            {config.showLabels && (
              <div className={styles.barValue}>{data.values[index]}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Pie Chart Component
function PieChart({ data, config }: { data: ChartData; config: ChartConfig }) {
  let cumulativePercentage = 0;
  const colors = generateColorVariations(config.color, data.values.length);
  
  return (
    <div className={styles.pieChart}>
      <svg viewBox="0 0 200 200" className={styles.pieSvg}>
        {data.values.map((value, index) => {
          const percentage = (value / data.total) * 100;
          const strokeDasharray = `${percentage} ${100 - percentage}`;
          const strokeDashoffset = -cumulativePercentage;
          cumulativePercentage += percentage;
          
          return (
            <circle
              key={index}
              cx="100"
              cy="100"
              r="80"
              fill="transparent"
              stroke={colors[index]}
              strokeWidth="40"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={styles.pieSlice}
            />
          );
        })}
      </svg>
      
      {config.showLabels && (
        <div className={styles.pieLegend}>
          {data.labels.map((label, index) => (
            <div key={index} className={styles.legendItem}>
              <div
                className={styles.legendColor}
                style={{ backgroundColor: colors[index] }}
              />
              <span className={styles.legendLabel}>
                {label}: {data.values[index]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Line Chart Component  
function LineChart({ data, config }: { data: ChartData; config: ChartConfig }) {
  const maxValue = Math.max(...data.values);
  const points = data.values.map((value, index) => ({
    x: (index / (data.values.length - 1)) * 100,
    y: 100 - (value / maxValue) * 100
  }));
  
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');
  
  return (
    <div className={styles.lineChart}>
      {config.showGrid && <div className={styles.grid} />}
      <svg viewBox="0 0 100 100" className={styles.lineSvg}>
        <path
          d={pathData}
          fill="none"
          stroke={config.color}
          strokeWidth="2"
          className={styles.line}
        />
        {config.showLabels && points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="2"
            fill={config.color}
            className={styles.point}
          />
        ))}
      </svg>
    </div>
  );
}

// Scatter Chart Component
function ScatterChart({ data, config }: { data: ChartData; config: ChartConfig }) {
  const maxValue = Math.max(...data.values);
  
  return (
    <div className={styles.scatterChart}>
      {config.showGrid && <div className={styles.grid} />}
      <svg viewBox="0 0 100 100" className={styles.scatterSvg}>
        {data.values.map((value, index) => (
          <circle
            key={index}
            cx={(index / (data.values.length - 1)) * 100}
            cy={100 - (value / maxValue) * 100}
            r="3"
            fill={config.color}
            className={styles.scatterPoint}
          />
        ))}
      </svg>
    </div>
  );
}

// Helper Functions
function processDataForChart(columnData: any[], config: ChartConfig, columnProfile: ColumnProfile): ChartData | null {
  const validData = columnData.filter(v => v !== null && v !== undefined && v !== '');
  
  if (validData.length === 0) return null;
  
  switch (config.type) {
    case 'histogram':
      return processNumericDataForHistogram(validData, config.bins || 20);
    
    case 'bar':
    case 'pie':
      return processCategoricalData(validData);
    
    case 'line':
    case 'scatter':
      if (columnProfile.type === 'datetime') {
        return processDatetimeData(validData);
      } else {
        return processNumericDataForLine(validData);
      }
    
    default:
      return processCategoricalData(validData);
  }
}

function processNumericDataForHistogram(data: any[], bins: number): ChartData {
  const numbers = data.map(v => Number(v)).filter(n => !isNaN(n));
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const binSize = (max - min) / bins;
  
  const binCounts = new Array(bins).fill(0);
  const labels = new Array(bins).fill('');
  
  numbers.forEach(num => {
    const binIndex = Math.min(Math.floor((num - min) / binSize), bins - 1);
    binCounts[binIndex]++;
  });
  
  for (let i = 0; i < bins; i++) {
    const binStart = min + i * binSize;
    const binEnd = min + (i + 1) * binSize;
    labels[i] = `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`;
  }
  
  return {
    labels,
    values: binCounts,
    total: numbers.length
  };
}

function processCategoricalData(data: any[]): ChartData {
  const counts = new Map<string, number>();
  data.forEach(value => {
    const key = String(value);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  
  const sortedEntries = Array.from(counts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10); // Top 10 categories
  
  return {
    labels: sortedEntries.map(([label]) => label),
    values: sortedEntries.map(([, count]) => count),
    total: data.length
  };
}

function processDatetimeData(data: any[]): ChartData {
  const dates = data.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
  const counts = new Map<string, number>();
  
  dates.forEach(date => {
    const key = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  
  const sortedEntries = Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b));
  
  return {
    labels: sortedEntries.map(([date]) => date),
    values: sortedEntries.map(([, count]) => count),
    total: dates.length
  };
}

function processNumericDataForLine(data: any[]): ChartData {
  const numbers = data.map(v => Number(v)).filter(n => !isNaN(n));
  return {
    labels: numbers.map((_, index) => `${index + 1}`),
    values: numbers,
    total: numbers.length
  };
}

function generateColorVariations(baseColor: string, count: number): string[] {
  const colors = [baseColor];
  
  // Generate variations by adjusting lightness
  for (let i = 1; i < count; i++) {
    const hue = (parseInt(baseColor.slice(1, 3), 16) + i * 30) % 255;
    const sat = Math.max(50, 255 - i * 20);
    const light = Math.max(80, 200 - i * 15);
    
    colors.push(`rgb(${hue}, ${sat}, ${light})`);
  }
  
  return colors;
}