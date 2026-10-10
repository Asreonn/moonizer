import { useMemo } from 'react';
import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import { ColumnProfile } from '../../../../../core/profiling/columnTypes';
import styles from './SimpleChartRenderer.module.css';

interface SimpleChartRendererProps {
  columnProfile: ColumnProfile;
  columnData: any[];
  className?: string;
  chartType?: 'bar' | 'line' | 'scatter' | 'box' | 'pie' | 'area' | 'heatmap';
  showGrid?: boolean;
  showValues?: boolean;
  syncScales?: boolean;
  maxValue?: number;
}

export function SimpleChartRenderer({ columnProfile, columnData, className, chartType = 'bar', showGrid = false, showValues = true, syncScales = false, maxValue }: SimpleChartRendererProps) {
  const { t } = useLanguage();

  // Simple chart data processing
  const chartData = useMemo(() => {
    if (!columnData || columnData.length === 0) return null;
    
    const validData = columnData.filter(v => v !== null && v !== undefined && v !== '');
    if (validData.length === 0) return null;

    // Process data based on column type and chart type
    switch (columnProfile.type) {
      case 'numeric': {
        const numbers = validData.map(v => Number(v)).filter(n => !isNaN(n));
        if (numbers.length === 0) return null;
        
        // Create frequency bins for numeric data
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);
        const binCount = Math.min(10, Math.max(3, Math.floor(numbers.length / 5)));
        const binSize = (max - min) / binCount;
        
        const bins = Array.from({ length: binCount }, (_, i) => ({
          min: min + i * binSize,
          max: min + (i + 1) * binSize,
          count: 0,
          label: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`
        }));
        
        numbers.forEach(num => {
          const binIndex = Math.min(Math.floor((num - min) / binSize), binCount - 1);
          bins[binIndex].count++;
        });
        
        const result = bins.map(bin => ({ 
          label: bin.label, 
          count: bin.count,
          value: (bin.min + bin.max) / 2
        }));
        return chartType === 'bar' ? result.reverse() : result;
      }
      
      case 'categorical':
      case 'boolean': {
        const counts = new Map<string, number>();
        validData.forEach(value => {
          const key = String(value);
          counts.set(key, (counts.get(key) || 0) + 1);
        });
        
        return Array.from(counts.entries())
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([label, count]) => ({ label, count }));
      }
      
      case 'datetime': {
        // Group by year or month depending on data range
        const dates = validData.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
        if (dates.length === 0) return null;
        
        const counts = new Map<string, number>();
        dates.forEach(date => {
          const key = date.getFullYear().toString(); // Group by year for simplicity
          counts.set(key, (counts.get(key) || 0) + 1);
        });
        
        return Array.from(counts.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([label, count]) => ({ label, count }));
      }
      
      default: {
        // For text, id_unique, constant - show frequency
        const counts = new Map<string, number>();
        validData.forEach(value => {
          const key = String(value).substring(0, 20); // Truncate long values
          counts.set(key, (counts.get(key) || 0) + 1);
        });
        
        return Array.from(counts.entries())
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8)
          .map(([label, count]) => ({ label, count }));
      }
    }
  }, [columnData, columnProfile.type, chartType]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`${styles.chartRenderer} ${className || ''}`}>
        <div className={styles.noDataState}>
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            xmlns="http://www.w3.org/2000/svg"
            data-chart-type="no-data"
          >
            <path d="M3 3v18h18"/>
            <path d="M8 17l4-4 4 4"/>
          </svg>
          <p>{t('dataExplorer.chart.noValidData')}</p>
        </div>
      </div>
    );
  }

  const maxCount = syncScales && maxValue ? maxValue : Math.max(...chartData.map(d => d.count));

  // Chart rendering functions

  const renderBarChart = (data: any[], max: number) => (
    <div className={styles.barChartContainer}>
      {showGrid && (
        <div className={styles.barChartGrid}>
          {[0.25, 0.5, 0.75].map(position => (
            <div
              key={position}
              className={styles.verticalGridLine}
              style={{ left: `${20 + position * 70}%` }}
            />
          ))}
        </div>
      )}
      {data.map((item, index) => (
        <div key={index} className={styles.barRow}>
          <span className={styles.barLabel}>{item.label}</span>
          <div className={styles.barContainer}>
            <div
              className={styles.bar}
              style={{
                width: `${(item.count / max) * 100}%`,
                backgroundColor: `hsl(${260 + index * 30}, 70%, 60%)`
              }}
            >
              {showValues && <span className={styles.barValueOnTop}>{item.count}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderLineChart = (data: any[], max: number) => {
    if (data.length === 0) return <div>No data</div>;
    
    const points = data.map((item, index) => {
      const x = 10 + (index / Math.max(data.length - 1, 1)) * 80; // Better margin
      const y = 85 - (item.count / max) * 70; // Leave more room at top/bottom
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className={styles.lineChart}>
        <svg 
          viewBox="0 0 100 100" 
          className={styles.lineSvg} 
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          data-chart-type="line"
        >
          {showGrid && (
            <g className={styles.gridLines}>
              {/* Horizontal grid lines */}
              {[25, 40, 55, 70, 85].map(y => (
                <line key={y} x1="10" y1={y} x2="90" y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              ))}
              {/* Vertical grid lines */}
              {[25, 40, 55, 70].map(x => (
                <line key={x} x1={x} y1="15" x2={x} y2="85" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              ))}
            </g>
          )}
          <polyline
            points={points}
            fill="none"
            stroke="hsl(260, 70%, 60%)"
            strokeWidth="2"
            className={styles.linePath}
          />
          {data.map((item, index) => {
            const x = 10 + (index / Math.max(data.length - 1, 1)) * 80;
            const y = 85 - (item.count / max) * 70;
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  fill="hsl(260, 70%, 60%)"
                  className={styles.linePoint}
                />
                {showValues && (
                  <text
                    x={x}
                    y={y - 6}
                    fill="var(--color-text-primary)"
                    fontSize="5"
                    textAnchor="middle"
                    className={styles.valueText}
                  >
                    {item.count}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className={styles.lineLabels}>
          {data.slice(0, 6).map((item, index) => (
            <span key={index} className={styles.lineLabel}>
              {item.label}: {item.count}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderScatterPlot = (data: any[], max: number) => {
    if (data.length === 0) return <div>No data</div>;
    
    return (
      <div className={styles.scatterPlot}>
        <svg 
          viewBox="0 0 100 100" 
          className={styles.scatterSvg} 
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          data-chart-type="scatter"
        >
          {showGrid && (
            <g className={styles.gridLines}>
              {[25, 40, 55, 70, 85].map(y => (
                <line key={y} x1="10" y1={y} x2="90" y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              ))}
              {[25, 40, 55, 70].map(x => (
                <line key={x} x1={x} y1="15" x2={x} y2="85" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              ))}
            </g>
          )}
          {data.map((item, index) => {
            const x = 15 + (index / Math.max(data.length - 1, 1)) * 70;
            const y = 85 - (item.count / max) * 60;
            const size = Math.max(4, Math.min(10, (item.count / max) * 8 + 3));
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r={size}
                  fill={`hsl(${200 + index * 30}, 70%, 60%)`}
                  className={styles.scatterPoint}
                  opacity="0.8"
                />
                {showValues && (
                  <text
                    x={x}
                    y={y - size - 3}
                    fill="var(--color-text-primary)"
                    fontSize="5"
                    textAnchor="middle"
                    className={styles.valueText}
                  >
                    {item.count}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className={styles.scatterLabels}>
          {data.slice(0, 8).map((item, index) => (
            <span key={index} className={styles.scatterLabel}>
              {item.label}: {item.count}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderPieChart = (data: any[]) => {
    if (data.length === 0) return <div>No data</div>;
    
    const total = data.reduce((sum, item) => sum + item.count, 0);
    let currentAngle = 0;
    
    return (
      <div className={styles.pieChart}>
        <svg 
          viewBox="0 0 100 100" 
          className={styles.pieSvg} 
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          data-chart-type="pie"
        >
          {showGrid && (
            <g className={styles.pieGridLines}>
              {/* Grid circles */}
              <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              {/* Grid lines */}
              <line x1="15" y1="50" x2="85" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              <line x1="50" y1="15" x2="50" y2="85" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
            </g>
          )}
          {data.slice(0, 8).map((item, index) => {
            const percentage = item.count / total;
            const angle = percentage * 360;
            
            // Skip slices that are too small to see
            if (angle < 3) return null;
            
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle += angle;
            
            const startAngleRad = (startAngle - 90) * Math.PI / 180;
            const endAngleRad = (endAngle - 90) * Math.PI / 180;
            
            const x1 = 50 + 35 * Math.cos(startAngleRad);
            const y1 = 50 + 35 * Math.sin(startAngleRad);
            const x2 = 50 + 35 * Math.cos(endAngleRad);
            const y2 = 50 + 35 * Math.sin(endAngleRad);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            const pathData = [
              `M 50 50`,
              `L ${x1} ${y1}`,
              `A 35 35 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            // Calculate center of slice for text positioning
            const midAngle = (startAngle + endAngle) / 2;
            const midAngleRad = (midAngle - 90) * Math.PI / 180;
            const textX = 50 + 25 * Math.cos(midAngleRad);
            const textY = 50 + 25 * Math.sin(midAngleRad);

            return (
              <g key={index}>
                <path
                  d={pathData}
                  fill={`hsl(${index * 45}, 70%, 60%)`}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="0.5"
                  className={styles.pieSlice}
                />
                {showValues && angle > 15 && ( // Only show text for slices larger than 15 degrees
                  <text
                    x={textX}
                    y={textY}
                    fill="white"
                    fontSize="5"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={styles.pieValueText}
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {item.count}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className={styles.pieLabels}>
          {data.slice(0, 6).map((item, index) => {
            const percentage = Math.round((item.count / total) * 100);
            return (
              <div key={index} className={styles.pieLabel}>
                <span className={styles.pieLegend} style={{ backgroundColor: `hsl(${index * 45}, 70%, 60%)` }}></span>
                {item.label}: {item.count} ({percentage}%)
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAreaChart = (data: any[], max: number) => {
    if (data.length === 0) return <div>No data</div>;
    
    const points = data.map((item, index) => {
      const x = 10 + (index / Math.max(data.length - 1, 1)) * 80;
      const y = 85 - (item.count / max) * 70;
      return `${x},${y}`;
    }).join(' ');
    
    const areaPoints = `10,85 ${points} 90,85`;

    return (
      <div className={styles.areaChart}>
        <svg 
          viewBox="0 0 100 100" 
          className={styles.areaSvg} 
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          data-chart-type="area"
        >
          {showGrid && (
            <g className={styles.gridLines}>
              {[25, 40, 55, 70, 85].map(y => (
                <line key={y} x1="10" y1={y} x2="90" y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              ))}
              {[25, 40, 55, 70].map(x => (
                <line key={x} x1={x} y1="15" x2={x} y2="85" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              ))}
            </g>
          )}
          <polygon
            points={areaPoints}
            fill="hsla(260, 70%, 60%, 0.4)"
            stroke="hsl(260, 70%, 60%)"
            strokeWidth="2"
            className={styles.areaPath}
          />
          {showValues && data.map((item, index) => {
            const x = 10 + (index / Math.max(data.length - 1, 1)) * 80;
            const y = 85 - (item.count / max) * 70;
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="2"
                  fill="hsl(260, 70%, 60%)"
                  className={styles.areaPoint}
                />
                <text
                  x={x}
                  y={y - 5}
                  fill="var(--color-text-primary)"
                  fontSize="5"
                  textAnchor="middle"
                  className={styles.areaValueText}
                >
                  {item.count}
                </text>
              </g>
            );
          })}
        </svg>
        <div className={styles.areaLabels}>
          {data.slice(0, 6).map((item, index) => (
            <span key={index} className={styles.areaLabel}>
              {item.label}: {item.count}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderBoxPlot = (data: any[]) => {
    if (data.length === 0) return <div>No data</div>;
    
    // Simplified box plot - show distribution of counts
    const counts = data.map(item => item.count).sort((a, b) => a - b);
    const q1 = counts[Math.floor(counts.length * 0.25)] || 0;
    const median = counts[Math.floor(counts.length * 0.5)] || 0;
    const q3 = counts[Math.floor(counts.length * 0.75)] || 0;
    const min = counts[0] || 0;
    const maxVal = counts[counts.length - 1] || 0;
    
    return (
      <div className={styles.boxPlot}>
        <svg 
          viewBox="0 0 100 100" 
          className={styles.boxSvg} 
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          data-chart-type="box"
        >
          {showGrid && (
            <g className={styles.boxGridLines}>
              {/* Horizontal grid lines */}
              {[25, 40, 50, 60, 75].map(y => (
                <line key={y} x1="15" y1={y} x2="85" y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              ))}
              {/* Vertical grid lines */}
              {[25, 40, 50, 60, 75].map(x => (
                <line key={x} x1={x} y1="15" x2={x} y2="85" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              ))}
            </g>
          )}
          {/* Box */}
          <rect 
            x="30" y="40" width="40" height="20" 
            fill="hsla(260, 70%, 60%, 0.3)" 
            stroke="hsl(260, 70%, 60%)" 
            strokeWidth="2" 
          />
          {/* Median line */}
          <line 
            x1="30" y1="50" x2="70" y2="50" 
            stroke="hsl(260, 70%, 60%)" 
            strokeWidth="3" 
          />
          {/* Whiskers */}
          <line x1="20" y1="20" x2="80" y2="20" stroke="hsl(260, 70%, 60%)" strokeWidth="1" />
          <line x1="20" y1="80" x2="80" y2="80" stroke="hsl(260, 70%, 60%)" strokeWidth="1" />
          {/* Whisker connections */}
          <line x1="50" y1="20" x2="50" y2="40" stroke="hsl(260, 70%, 60%)" strokeWidth="1" strokeDasharray="2,2" />
          <line x1="50" y1="60" x2="50" y2="80" stroke="hsl(260, 70%, 60%)" strokeWidth="1" strokeDasharray="2,2" />
          
          {/* Value labels on chart */}
          {showValues && (
            <g>
              <text x="50" y="15" fill="var(--color-text-primary)" fontSize="4" textAnchor="middle" className={styles.boxValueText}>Max: {maxVal}</text>
              <text x="35" y="37" fill="var(--color-text-primary)" fontSize="4" textAnchor="middle" className={styles.boxValueText}>Q3: {q3}</text>
              <text x="50" y="47" fill="var(--color-text-primary)" fontSize="4" textAnchor="middle" className={styles.boxValueText}>Med: {median}</text>
              <text x="65" y="37" fill="var(--color-text-primary)" fontSize="4" textAnchor="middle" className={styles.boxValueText}>Q1: {q1}</text>
              <text x="50" y="93" fill="var(--color-text-primary)" fontSize="4" textAnchor="middle" className={styles.boxValueText}>Min: {min}</text>
            </g>
          )}
        </svg>
        <div className={styles.boxLabels}>
          <div>Min: {min}</div>
          <div>Q1: {q1}</div>
          <div>Median: {median}</div>
          <div>Q3: {q3}</div>
          <div>Max: {maxVal}</div>
        </div>
      </div>
    );
  };

  const renderHeatmap = (data: any[], max: number) => {
    if (data.length === 0) return <div>No data</div>;
    
    const gridSize = Math.min(Math.ceil(Math.sqrt(data.length)), 6); // Max 6x6 grid
    const cellSize = 90 / gridSize;
    
    return (
      <div className={styles.heatmap}>
        <svg 
          viewBox="0 0 100 100" 
          className={styles.heatmapSvg} 
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          data-chart-type="heatmap"
        >
          {showGrid && (
            <g className={styles.heatmapGridLines}>
              {/* Grid lines for heatmap cells */}
              {Array.from({ length: gridSize + 1 }, (_, i) => {
                const pos = 5 + (i * 90) / gridSize;
                return [
                  <line key={`h-${i}`} x1="5" y1={pos} x2="95" y2={pos} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />,
                  <line key={`v-${i}`} x1={pos} y1="5" x2={pos} y2="95" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                ];
              }).flat()}
            </g>
          )}
          {data.slice(0, gridSize * gridSize).map((item, index) => {
            const col = index % gridSize;
            const row = Math.floor(index / gridSize);
            const x = 5 + col * cellSize;
            const y = 5 + row * cellSize;
            const intensity = item.count / max;
            
            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={cellSize - 1}
                  height={cellSize - 1}
                  fill={`hsl(${260 - intensity * 80}, 70%, ${40 + intensity * 30}%)`}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="0.5"
                  className={styles.heatmapCell}
                  opacity={0.7 + intensity * 0.3}
                />
                {showValues && cellSize > 12 && ( // Only show values if cells are large enough
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2 + 1.5}
                    fill="white"
                    fontSize={Math.min(cellSize / 6, 5)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={styles.heatmapValueText}
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {item.count}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className={styles.heatmapLabels}>
          {data.slice(0, 8).map((item, index) => (
            <span key={index} className={styles.heatmapLabel}>
              {item.label}: {item.count}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Render chart based on type
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return renderBarChart(chartData, maxCount);
      case 'line':
        return renderLineChart(chartData, maxCount);
      case 'scatter':
        return renderScatterPlot(chartData, maxCount);
      case 'pie':
        return renderPieChart(chartData);
      case 'area':
        return renderAreaChart(chartData, maxCount);
      case 'box':
        return renderBoxPlot(chartData);
      case 'heatmap':
        return renderHeatmap(chartData, maxCount);
      default:
        return renderBarChart(chartData, maxCount);
    }
  };

  return (
    <div className={`${styles.chartRenderer} ${className || ''}`}>
      <div className={`${styles.simpleChart} ${styles[`chart${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`]}`}>
        {renderChart()}
      </div>
      
      <div className={styles.chartInfo}>
        <span className={styles.totalCount}>
          {columnData.length} {t('dataExplorer.analysis.records')} • {chartType.toUpperCase()}
        </span>
      </div>
    </div>
  );
}