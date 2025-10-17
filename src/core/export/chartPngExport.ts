/**
 * Dedicated Chart PNG Export System
 * Creates perfect PNG exports for each chart type by rebuilding them in background
 */

import { ColumnProfile } from '../profiling/columnTypes';

export interface ChartData {
  label: string;
  count: number;
  value?: number;
}

export type ChartExportTranslator = (key: string, params?: Record<string, any>) => string;

export interface ChartExportConfig {
  columnName: string;
  columnProfile: ColumnProfile;
  data: any[];
  chartType: 'bar' | 'pie' | 'line' | 'scatter' | 'box' | 'area' | 'heatmap';
  width?: number;
  height?: number;
  backgroundColor?: string;
  appearance?: ExportAppearanceOptions;
  layoutMode?: 'single' | 'dual';
  dualOptions?: {
    isDual: boolean;
    leftChart: string;
    rightChart: string;
    syncScales: boolean;
    maxValue?: number;
  };
  translate?: ChartExportTranslator;
}

export interface ExportAppearanceOptions {
  mode: 'transparent' | 'light' | 'dark';
}

interface ChartExportTheme {
  variant: 'light' | 'dark';
  transparent: boolean;
  cardBackground: string;
  cardBorder: string;
  dropShadow: string;
  panelBackground: string;
  panelBorder: string;
  primaryText: string;
  secondaryText: string;
  legendText: string;
  gridLine: string;
  highlight: string;
  highlightSecondary: string;
  accentSoft: string;
  dataLabelColor: string;
  legendChipBorder: string;
  percentageLabelFill: string;
  canvasBackground: string;
}

function translateOrFallback(
  config: ChartExportConfig,
  key: string,
  fallback: string,
  params?: Record<string, any>
): string {
  const translator = config.translate;
  if (translator) {
    try {
      const translated = translator(key, params);
      if (translated && translated !== key) {
        return translated;
      }
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);
    }
  }
  return fallback;
}

function resolveExportTheme(config: ChartExportConfig): ChartExportTheme {
  const mode = config.appearance?.mode ?? 'transparent';
  const variant: 'light' | 'dark' = mode === 'dark' ? 'dark' : 'light';
  const transparent = mode === 'transparent';

  if (variant === 'dark') {
    const cardBackground = transparent ? 'transparent' : '#0f172a';
    return {
      variant,
      transparent,
      cardBackground,
      cardBorder: transparent ? 'rgba(148, 163, 184, 0.25)' : 'rgba(30, 41, 59, 0.65)',
      dropShadow: transparent ? 'none' : '0 32px 64px rgba(2, 6, 23, 0.45)',
      panelBackground: transparent ? 'transparent' : '#101c3a',
      panelBorder: transparent ? 'rgba(148, 163, 184, 0.25)' : 'rgba(30, 41, 59, 0.65)',
      primaryText: '#e2e8f0',
      secondaryText: '#cbd5f5',
      legendText: '#f8fafc',
      gridLine: 'rgba(148, 163, 184, 0.25)',
      highlight: '#38bdf8',
      highlightSecondary: '#0ea5e9',
      accentSoft: transparent ? 'rgba(56, 189, 248, 0.22)' : 'rgba(59, 130, 246, 0.25)',
      dataLabelColor: '#0f172a',
      legendChipBorder: 'rgba(148, 163, 184, 0.35)',
      percentageLabelFill: '#f8fafc',
      canvasBackground: transparent ? 'transparent' : '#020617'
    };
  }

  // Light variant
  return {
    variant,
    transparent,
    cardBackground: transparent ? 'transparent' : '#ffffff',
    cardBorder: transparent ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.35)',
    dropShadow: transparent ? 'none' : '0 28px 60px rgba(15, 23, 42, 0.18)',
    panelBackground: transparent ? 'transparent' : '#f8fafc',
    panelBorder: transparent ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.35)',
    primaryText: '#111827',
    secondaryText: '#475569',
    legendText: '#1f2937',
    gridLine: 'rgba(148, 163, 184, 0.35)',
    highlight: '#2563eb',
    highlightSecondary: '#3b82f6',
    accentSoft: transparent ? 'rgba(37, 99, 235, 0.18)' : 'rgba(37, 99, 235, 0.12)',
    dataLabelColor: '#ffffff',
    legendChipBorder: '#e2e8f0',
    percentageLabelFill: '#ffffff',
    canvasBackground: transparent ? 'transparent' : '#f1f5f9'
  };
}

/**
 * Main chart export function - rebuilds chart in background and exports as PNG
 */
export async function exportChartAsPng(config: ChartExportConfig): Promise<void> {
  console.log(`🎨 Chart PNG Export - Starting ${config.dualOptions?.isDual ? 'dual' : 'single'} ${config.chartType} export`);
  
  // Process data for the specific chart type
  const chartData = processDataForChartType(config.data, config.columnProfile, config.chartType);
  
  if (!chartData || chartData.length === 0) {
    throw new Error('No valid data for chart export');
  }
  
  const theme = resolveExportTheme(config);
  
  // Create chart in background based on type and layout
  let chartElement: HTMLElement;
  
  if (config.dualOptions?.isDual) {
    // Create dual charts side by side
    chartElement = await createDualChartsForExport(chartData, config, theme);
  } else {
    // Create single chart
    const singleChartConfig: ChartExportConfig = { ...config, layoutMode: 'single' };
    switch (config.chartType) {
      case 'bar':
        chartElement = await createBarChartForExport(chartData, singleChartConfig, theme);
        break;
      case 'pie':
        chartElement = await createPieChartForExport(chartData, singleChartConfig, theme);
        break;
      case 'line':
        chartElement = await createLineChartForExport(chartData, singleChartConfig, theme);
        break;
      case 'scatter':
        chartElement = await createScatterChartForExport(chartData, singleChartConfig, theme);
        break;
      case 'box':
        chartElement = await createBoxChartForExport(chartData, singleChartConfig, theme);
        break;
      case 'area':
        chartElement = await createAreaChartForExport(chartData, singleChartConfig, theme);
        break;
      case 'heatmap':
        chartElement = await createHeatmapChartForExport(chartData, singleChartConfig, theme);
        break;
      default:
        throw new Error(`Unsupported chart type: ${config.chartType}`);
    }
  }
  
  // Convert to PNG and download
  const blob = await convertBackgroundChartToPng(chartElement, config, theme);
  downloadChartPng(blob, config);
  
  // Clean up background element
  if (chartElement.parentNode) {
    chartElement.parentNode.removeChild(chartElement);
  }
  
  console.log(`✅ Chart PNG Export - ${config.dualOptions?.isDual ? 'dual' : 'single'} ${config.chartType} exported successfully`);
}

/**
 * Bar Chart PNG Export - Creates perfect bar chart in background
 */
async function createBarChartForExport(
  data: ChartData[],
  config: ChartExportConfig,
  theme: ChartExportTheme
): Promise<HTMLElement> {
  const { width = 0, height = 600, layoutMode = 'single' } = config;
  const barCount = Math.max(data.length, 1);
  const isDualLayout = layoutMode === 'dual';

  const fallbackCardWidth = isDualLayout ? 760 : 1040;
  const minCardWidth = isDualLayout ? 640 : 900;
  const maxCardWidth = isDualLayout ? 980 : 1280;
  const dataDrivenWidth = isDualLayout
    ? 540 + Math.min(barCount, 14) * 28
    : 660 + Math.min(barCount, 14) * 34;

  let cardWidth = width > 0 ? width : fallbackCardWidth;
  cardWidth = Math.max(cardWidth, dataDrivenWidth);
  cardWidth = Math.min(Math.max(cardWidth, minCardWidth), maxCardWidth);

  const outerPadding = isDualLayout ? 44 : 56;
  const containerWidth = cardWidth + outerPadding * 2;

  const cardPadX = isDualLayout ? 48 : 64;
  const cardPadTop = isDualLayout ? 36 : 44;
  const cardPadBottom = isDualLayout ? 48 : 56;

  const chartPadX = isDualLayout ? 26 : 32;
  const chartPadTop = isDualLayout ? 22 : 26;
  const chartPadBottom = isDualLayout ? 28 : 32;

  const columnGap = isDualLayout ? 20 : 24;
  const metricsClusterGap = isDualLayout ? 24 : 28;
  const rowGap = isDualLayout ? 16 : 18;
  const barHeight = isDualLayout ? 28 : 32;
  const labelLineClamp = isDualLayout ? 2 : 3;
  const badgeSize = isDualLayout ? 26 : 28;

  const numericCounts = data.map(d => Number(d.count) || 0);
  const maxCount = numericCounts.length > 0 ? Math.max(...numericCounts) : 0;
  const totalCount = numericCounts.reduce((sum, value) => sum + value, 0);
  const countFormatter = new Intl.NumberFormat('tr-TR');
  const percentFormatter = new Intl.NumberFormat('tr-TR', {
    style: 'percent',
    maximumFractionDigits: 1,
    minimumFractionDigits: 0
  });
  const translate = (key: string, fallback: string, params?: Record<string, any>) =>
    translateOrFallback(config, key, fallback, params);
  const categoryCount = data.length;
  const formattedTotal = countFormatter.format(totalCount);

  const innerChartWidth = cardWidth - chartPadX * 2;
  const labelColumnWidth = Math.min(
    isDualLayout ? 240 : 280,
    Math.max(isDualLayout ? 150 : 168, Math.round(innerChartWidth * (isDualLayout ? 0.27 : 0.25)))
  );
  const metricsColumnWidth = Math.min(
    isDualLayout ? 200 : 220,
    Math.max(isDualLayout ? 112 : 132, Math.round(innerChartWidth * 0.19))
  );

  const labelAccent = theme.variant === 'dark'
    ? 'rgba(56, 189, 248, 0.28)'
    : 'rgba(37, 99, 235, 0.12)';
  const barTrackFill = theme.variant === 'dark'
    ? 'rgba(30, 64, 175, 0.3)'
    : 'rgba(191, 219, 254, 0.35)';
  const highlightShadow = theme.transparent
    ? '0 10px 28px rgba(15, 23, 42, 0.18)'
    : '0 12px 32px rgba(15, 23, 42, 0.28)';

  const estimatedBarsHeight = barCount * barHeight + Math.max(0, barCount - 1) * rowGap + 24;
  const headerAllowance = cardPadTop + cardPadBottom + (isDualLayout ? 112 : 148);
  const resolvedChartHeight = Math.max(estimatedBarsHeight, Math.max(0, height - headerAllowance));
  const resolvedContainerHeight = Math.max(height, resolvedChartHeight + headerAllowance);

  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: -10000px;
    left: -10000px;
    width: ${containerWidth}px;
    min-width: ${containerWidth}px;
    height: ${resolvedContainerHeight}px;
    min-height: ${resolvedContainerHeight}px;
    padding: ${outerPadding}px;
    box-sizing: border-box;
    display: flex;
    align-items: stretch;
    justify-content: center;
    background: transparent;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: ${theme.primaryText};
  `;

  const contentWrapper = document.createElement('div');
  contentWrapper.style.cssText = `
    width: 100%;
    background: ${theme.cardBackground};
    border-radius: 24px;
    border: 1px solid ${theme.cardBorder};
    box-shadow: ${theme.dropShadow};
    padding: ${cardPadTop}px ${cardPadX}px ${cardPadBottom}px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: ${isDualLayout ? 24 : 32}px;
    max-width: ${cardWidth}px;
    margin: 0 auto;
  `;
  contentWrapper.dataset.exportCard = 'true';
  contentWrapper.dataset.cardWidth = String(cardWidth);

  const titleBlock = document.createElement('div');
  titleBlock.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
  `;

  const title = document.createElement('div');
  title.textContent = translate(
    'dataExplorer.export.barChart.title',
    `${config.columnName} Distribution`,
    { columnName: config.columnName }
  );
  title.style.cssText = `
    font-size: ${isDualLayout ? 20 : 22}px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: ${theme.primaryText};
  `;

  const subtitle = document.createElement('div');
  subtitle.textContent = translate(
    'dataExplorer.export.barChart.subtitle',
    `${categoryCount} categories · ${formattedTotal} total records`,
    {
      columnName: config.columnName,
      categoryCount,
      formattedTotal,
      totalCount
    }
  );
  subtitle.style.cssText = `
    font-size: 13px;
    font-weight: 500;
    color: ${theme.secondaryText};
    letter-spacing: 0.01em;
  `;

  titleBlock.appendChild(title);
  titleBlock.appendChild(subtitle);

  const chartContainer = document.createElement('div');
  chartContainer.style.cssText = `
    width: 100%;
    background: ${theme.panelBackground};
    border-radius: ${isDualLayout ? 18 : 20}px;
    border: 1px solid ${theme.panelBorder};
    padding: ${chartPadTop}px ${chartPadX}px ${chartPadBottom}px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: ${isDualLayout ? 20 : 24}px;
    min-height: ${resolvedChartHeight}px;
  `;
  chartContainer.dataset.exportChartBody = 'true';

  const legend = document.createElement('div');
  legend.style.cssText = `
    display: grid;
    grid-template-columns: ${labelColumnWidth}px 1fr ${metricsColumnWidth}px;
    align-items: center;
    width: 100%;
    color: ${theme.secondaryText};
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  `;

  const leftLegend = document.createElement('span');
  leftLegend.textContent = translate('dataExplorer.export.barChart.legend.category', 'Category');
  leftLegend.style.cssText = `
    justify-self: flex-start;
  `;

  const centerLegend = document.createElement('span');
  centerLegend.textContent = translate('dataExplorer.export.barChart.legend.distribution', 'Distribution');
  centerLegend.style.cssText = `
    justify-self: center;
    text-align: center;
  `;

  const metricsLegend = document.createElement('div');
  metricsLegend.style.cssText = `
    display: flex;
    justify-content: flex-end;
    gap: ${metricsClusterGap}px;
  `;

  const countLegend = document.createElement('span');
  countLegend.textContent = translate('dataExplorer.export.barChart.legend.count', 'Count');
  const percentLegend = document.createElement('span');
  percentLegend.textContent = translate('dataExplorer.export.barChart.legend.percentage', 'Percentage');

  metricsLegend.appendChild(countLegend);
  metricsLegend.appendChild(percentLegend);
  legend.appendChild(leftLegend);
  legend.appendChild(centerLegend);
  legend.appendChild(metricsLegend);

  const barsWrapper = document.createElement('div');
  barsWrapper.style.cssText = `
    width: 100%;
    max-width: ${innerChartWidth}px;
    display: flex;
    flex-direction: column;
    gap: ${rowGap}px;
    margin: 0 auto;
  `;

  const guideFractions = [0.25, 0.5, 0.75];
  const minimumFill = barCount > 1 ? (isDualLayout ? 0.1 : 0.12) : 0.4;

  data.forEach((item, index) => {
    const numericCount = numericCounts[index] ?? 0;
    const ratio = maxCount === 0 ? 0 : numericCount / maxCount;
    const safeRatio = ratio === 0 ? 0 : Math.min(1, Math.max(ratio, minimumFill));
    const hue = (index * 48) % 360;
    const gradientStart = theme.variant === 'dark'
      ? `hsl(${hue}, 82%, 62%)`
      : `hsl(${hue}, 78%, 58%)`;
    const gradientEnd = theme.variant === 'dark'
      ? `hsl(${hue}, 88%, 52%)`
      : `hsl(${hue}, 82%, 46%)`;

    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      align-items: center;
      gap: ${columnGap}px;
      width: 100%;
      padding: ${isDualLayout ? 4 : 6}px 0;
    `;

    const labelBlock = document.createElement('div');
    labelBlock.style.cssText = `
      flex: 0 0 ${labelColumnWidth}px;
      display: flex;
      align-items: center;
      gap: ${isDualLayout ? 12 : 14}px;
      color: ${theme.primaryText};
    `;

    const badge = document.createElement('span');
    badge.textContent = `${index + 1}`;
    badge.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${badgeSize}px;
      height: ${badgeSize}px;
      border-radius: 10px;
      background: ${labelAccent};
      border: 1px solid ${theme.panelBorder};
      font-size: 12px;
      font-weight: 600;
      color: ${theme.secondaryText};
    `;

    const labelText = document.createElement('span');
    labelText.textContent = item.label;
    labelText.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
      letter-spacing: -0.01em;
      color: ${theme.primaryText};
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: ${labelLineClamp};
      -webkit-box-orient: vertical;
    `;

    labelBlock.appendChild(badge);
    labelBlock.appendChild(labelText);

    const barContainer = document.createElement('div');
    barContainer.style.cssText = `
      position: relative;
      flex: 1;
      height: ${barHeight}px;
      border-radius: ${isDualLayout ? 12 : 14}px;
      background: ${barTrackFill};
      border: 1px solid ${theme.panelBorder};
      overflow: hidden;
      min-width: 0;
    `;

    guideFractions.forEach((fraction) => {
      const guide = document.createElement('div');
      guide.style.cssText = `
        position: absolute;
        top: 0;
        bottom: 0;
        left: calc(${(fraction * 100).toFixed(2)}% - 1px);
        width: 1px;
        background: ${theme.gridLine};
        opacity: 0.45;
        pointer-events: none;
        z-index: 3;
        mix-blend-mode: ${theme.variant === 'dark' ? 'screen' : 'multiply'};
      `;
      barContainer.appendChild(guide);
    });

    const barFill = document.createElement('div');
    barFill.style.cssText = `
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: ${(safeRatio * 100).toFixed(3)}%;
      background: linear-gradient(90deg, ${gradientStart}, ${gradientEnd});
      border-radius: inherit;
      box-shadow: ${highlightShadow};
      transition: none;
      z-index: 2;
    `;

    const sheen = document.createElement('div');
    sheen.style.cssText = `
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, rgba(255, 255, 255, ${theme.variant === 'dark' ? '0.12' : '0.24'}) 0%, rgba(255, 255, 255, 0) 65%);
      mix-blend-mode: ${theme.variant === 'dark' ? 'screen' : 'soft-light'};
      pointer-events: none;
    `;

    barFill.appendChild(sheen);
    barContainer.appendChild(barFill);

    const metrics = document.createElement('div');
    metrics.style.cssText = `
      flex: 0 0 ${metricsColumnWidth}px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: ${metricsClusterGap}px;
      color: ${theme.primaryText};
      min-width: 0;
    `;

    const countWrapper = document.createElement('div');
    countWrapper.style.cssText = `
      display: flex;
      justify-content: flex-end;
      min-width: ${isDualLayout ? 64 : 72}px;
    `;

    const countLabel = document.createElement('span');
    countLabel.textContent = countFormatter.format(numericCount);
    countLabel.style.cssText = `
      font-size: ${isDualLayout ? 14 : 15}px;
      font-weight: 700;
      letter-spacing: -0.01em;
    `;

    countWrapper.appendChild(countLabel);

    const percentWrapper = document.createElement('div');
    percentWrapper.style.cssText = `
      display: flex;
      justify-content: flex-end;
      min-width: ${isDualLayout ? 54 : 60}px;
    `;

    const percentValue = totalCount === 0 ? 0 : numericCount / totalCount;
    const percentLabel = document.createElement('span');
    percentLabel.textContent = percentFormatter.format(percentValue);
    percentLabel.style.cssText = `
      font-size: ${isDualLayout ? 12 : 13}px;
      font-weight: 600;
      color: ${theme.secondaryText};
      letter-spacing: 0.02em;
    `;

    percentWrapper.appendChild(percentLabel);

    metrics.appendChild(countWrapper);
    metrics.appendChild(percentWrapper);

    row.appendChild(labelBlock);
    row.appendChild(barContainer);
    row.appendChild(metrics);
    barsWrapper.appendChild(row);
  });

  chartContainer.appendChild(legend);
  chartContainer.appendChild(barsWrapper);
  contentWrapper.appendChild(titleBlock);
  contentWrapper.appendChild(chartContainer);
  container.appendChild(contentWrapper);
  document.body.appendChild(container);

  await new Promise(resolve => setTimeout(resolve, 160));

  const legendHeight = Math.ceil(legend.getBoundingClientRect().height || 0);
  const measuredBarsHeight = Math.ceil(barsWrapper.scrollHeight || 0);
  const measuredChartHeight = Math.max(
    resolvedChartHeight,
    legendHeight + measuredBarsHeight + chartPadTop + chartPadBottom + (isDualLayout ? 16 : 24)
  );
  chartContainer.style.minHeight = `${measuredChartHeight}px`;

  const measuredContentHeight = Math.ceil(contentWrapper.scrollHeight || 0);
  const totalMeasuredHeight = Math.max(
    resolvedContainerHeight,
    measuredContentHeight + outerPadding * 2
  );
  container.style.height = `${totalMeasuredHeight}px`;
  container.style.minHeight = `${totalMeasuredHeight}px`;

  return container;
}

/**
 * Pie Chart PNG Export - Creates perfect pie chart in background
 */
async function createPieChartForExport(
  data: ChartData[],
  config: ChartExportConfig,
  theme: ChartExportTheme
): Promise<HTMLElement> {
  const { width = 800, height = 600 } = config;
  
  // Create background container
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: -10000px;
    left: -10000px;
    width: ${width}px;
    height: ${height}px;
    background: transparent;
    padding: 48px;
    box-sizing: border-box;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: ${theme.primaryText};
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
  `;

  const contentWrapper = document.createElement('div');
  contentWrapper.style.cssText = `
    width: 100%;
    height: 100%;
    min-height: 100%;
    background: ${theme.cardBackground};
    border-radius: 24px;
    border: 1px solid ${theme.cardBorder};
    box-shadow: ${theme.dropShadow};
    padding: 40px 48px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 32px;
    align-items: stretch;
  `;
  contentWrapper.dataset.exportCard = 'true';
  
  // Create title
  const title = document.createElement('div');
  title.textContent = `${config.columnName} Distribution`;
  title.style.cssText = `
    font-size: 20px;
    font-weight: 600;
    text-align: center;
    letter-spacing: -0.01em;
    color: ${theme.primaryText};
  `;
  
  // Create SVG container
  const svgContainer = document.createElement('div');
  svgContainer.style.cssText = `
    width: 100%;
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 40px;
    align-items: center;
    justify-content: center;
  `;
  
  // Create SVG pie chart
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const chartSize = Math.min(width - 200, height - 200);
  svg.setAttribute('width', chartSize.toString());
  svg.setAttribute('height', chartSize.toString());
  svg.setAttribute('viewBox', `0 0 ${chartSize} ${chartSize}`);
  svg.style.cssText = `
    flex: 0 0 auto;
    filter: ${theme.dropShadow === 'none' ? 'drop-shadow(0 24px 40px rgba(15, 23, 42, 0.12))' : theme.dropShadow};
  `;
  
  const centerX = chartSize / 2;
  const centerY = chartSize / 2;
  const radius = chartSize * 0.35;
  
  // Calculate total
  const total = data.reduce((sum, d) => sum + d.count, 0);
  
  // Create pie slices
  let currentAngle = -Math.PI / 2; // Start at top
  
  data.forEach((item, index) => {
    const percentage = item.count / total;
    const sliceAngle = percentage * 2 * Math.PI;
    const endAngle = currentAngle + sliceAngle;
    
    // Create path for slice
    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
    const startX = centerX + Math.cos(currentAngle) * radius;
    const startY = centerY + Math.sin(currentAngle) * radius;
    const endX = centerX + Math.cos(endAngle) * radius;
    const endY = centerY + Math.sin(endAngle) * radius;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      'Z'
    ].join(' ');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    
    const hue = (index * 360 / data.length) % 360;
    const sliceLightness = theme.variant === 'dark' ? 60 : 55;
    const sliceStroke = theme.variant === 'dark' ? 'rgba(15, 23, 42, 0.35)' : 'rgba(255, 255, 255, 0.7)';
    path.setAttribute('fill', `hsl(${hue}, 70%, ${sliceLightness}%)`);
    path.setAttribute('stroke', sliceStroke);
    path.setAttribute('stroke-width', '1.5');
    path.style.cssText = `transition: none;`;
    
    svg.appendChild(path);
    
    // Add percentage label if slice is big enough
    if (percentage > 0.05) {
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', labelX.toString());
      text.setAttribute('y', labelY.toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', theme.percentageLabelFill);
      text.setAttribute('font-size', '13');
      text.setAttribute('font-weight', '600');
      text.setAttribute('font-family', 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif');
      text.textContent = `${(percentage * 100).toFixed(1)}%`;
      text.style.cssText = `text-shadow: 0 1px 3px rgba(15, 23, 42, 0.35);`;
      
      svg.appendChild(text);
    }
    
    currentAngle = endAngle;
  });
  
  // Create legend
  contentWrapper.appendChild(title);
  svgContainer.appendChild(svg);
  contentWrapper.appendChild(svgContainer);
  container.appendChild(contentWrapper);
  document.body.appendChild(container);
  
  // Wait for render
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return container;
}

/**
 * Line Chart PNG Export - Creates perfect line chart in background
 */
async function createLineChartForExport(
  data: ChartData[],
  config: ChartExportConfig,
  theme: ChartExportTheme
): Promise<HTMLElement> {
  const { width = 800, height = 600 } = config;
  const pointCount = Math.max(data.length, 2);
  const dynamicChartWidth = Math.max(540, Math.min(1200, 240 + pointCount * 64));
  const maxChartWidth = dynamicChartWidth * 1.08;
  const cardPaddingX = 80;
  const resolvedWidth = Math.max(width, maxChartWidth + cardPaddingX + 80);
  const resolvedHeight = Math.max(height, 440);
  
  // Create background container
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: -10000px;
    left: -10000px;
    width: ${resolvedWidth}px;
    min-width: ${resolvedWidth}px;
    height: ${resolvedHeight}px;
    background: transparent;
    padding: 48px;
    box-sizing: border-box;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: ${theme.primaryText};
    display: flex;
    flex-direction: column;
    align-items: stretch;
  `;

  const contentWrapper = document.createElement('div');
  contentWrapper.style.cssText = `
    width: 100%;
    height: 100%;
    min-height: 100%;
    background: ${theme.cardBackground};
    border-radius: 24px;
    border: 1px solid ${theme.cardBorder};
    box-shadow: ${theme.dropShadow};
    padding: 40px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 32px;
    max-width: ${resolvedWidth - 96}px;
    margin: 0 auto;
  `;
  contentWrapper.dataset.exportCard = 'true';
  
  // Create title
  const title = document.createElement('div');
  title.textContent = `${config.columnName} Trend`;
  title.style.cssText = `
    font-size: 20px;
    font-weight: 600;
    text-align: center;
    letter-spacing: -0.01em;
    color: ${theme.primaryText};
  `;
  
  // Create SVG line chart
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const chartWidth = Math.min(dynamicChartWidth, resolvedWidth - 200);
  const chartHeight = Math.max(320, resolvedHeight - 200);
  svg.setAttribute('width', chartWidth.toString());
  svg.setAttribute('height', chartHeight.toString());
  svg.setAttribute('viewBox', `0 0 ${chartWidth} ${chartHeight}`);
  svg.style.cssText = `
    border: 1px solid ${theme.panelBorder};
    border-radius: 20px;
    background: ${theme.panelBackground};
    box-shadow: ${theme.dropShadow};
    display: block;
    margin: 0 auto;
    width: 100%;
  `;
  
  const padding = 72;
  const plotWidth = chartWidth - 2 * padding;
  const plotHeight = chartHeight - 2 * padding;
  
  // Get min/max values
  const maxCount = data.length > 0 ? Math.max(...data.map(d => d.count)) : 0;
  const minCount = data.length > 0 ? Math.min(...data.map(d => d.count)) : 0;
  const valueRange = Math.max(maxCount - minCount, 1);
  const pointSpan = Math.max(data.length - 1, 1);
  
  // Create grid lines
  for (let i = 0; i <= 5; i++) {
    const y = padding + (i * plotHeight / 5);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', padding.toString());
    line.setAttribute('y1', y.toString());
    line.setAttribute('x2', (chartWidth - padding).toString());
    line.setAttribute('y2', y.toString());
    line.setAttribute('stroke', theme.gridLine);
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
    
    // Y-axis labels
    const value = maxCount - (i * (maxCount - minCount) / 5);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', (padding - 10).toString());
    text.setAttribute('y', (y + 4).toString());
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('fill', theme.secondaryText);
    text.setAttribute('font-size', '12');
    text.setAttribute('font-family', 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif');
    text.textContent = Math.round(value).toString();
    svg.appendChild(text);
  }
  
  // Create line path
  let pathData = '';
  data.forEach((item, index) => {
    const x = padding + (index * plotWidth / pointSpan);
    const y = padding + plotHeight - ((item.count - minCount) / valueRange) * plotHeight;
    
    if (index === 0) {
      pathData += `M ${x} ${y}`;
    } else {
      pathData += ` L ${x} ${y}`;
    }
  });
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', theme.highlight);
  path.setAttribute('stroke-width', '3');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.style.cssText = `filter: drop-shadow(0 12px 24px rgba(37, 99, 235, ${theme.variant === 'dark' ? '0.35' : '0.25'}));`;
  svg.appendChild(path);
  
  // Create data points
  data.forEach((item, index) => {
    const x = padding + (index * plotWidth / pointSpan);
    const y = padding + plotHeight - ((item.count - minCount) / valueRange) * plotHeight;
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x.toString());
    circle.setAttribute('cy', y.toString());
    circle.setAttribute('r', '5');
    circle.setAttribute('fill', theme.variant === 'dark' ? '#e2e8f0' : '#ffffff');
    circle.setAttribute('stroke', theme.highlightSecondary);
    circle.setAttribute('stroke-width', '2.5');
    svg.appendChild(circle);
    
    // X-axis labels
    if (index % Math.ceil(data.length / 8) === 0) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x.toString());
      text.setAttribute('y', (chartHeight - padding + 20).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', theme.secondaryText);
      text.setAttribute('font-size', '11');
      text.setAttribute('font-family', 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif');
      text.textContent = item.label.length > 8 ? item.label.substring(0, 8) + '...' : item.label;
      svg.appendChild(text);
    }
  });
  
  contentWrapper.appendChild(title);

  const svgFrame = document.createElement('div');
  svgFrame.style.cssText = `
    width: 100%;
    display: flex;
    justify-content: center;
  `;
  svgFrame.appendChild(svg);
  contentWrapper.appendChild(svgFrame);
  container.appendChild(contentWrapper);
  document.body.appendChild(container);
  
  // Wait for render
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return container;
}

/**
 * Process data for specific chart type
 */
function processDataForChartType(data: any[], columnProfile: ColumnProfile, chartType: string): ChartData[] {
  const validData = data.filter(v => v !== null && v !== undefined && v !== '');
  if (validData.length === 0) return [];

  switch (columnProfile.type) {
    case 'numeric': {
      const numbers = validData.map(v => Number(v)).filter(n => !isNaN(n));
      if (numbers.length === 0) return [];
      
      // Create frequency bins for numeric data - more responsive with more bins
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      const binCount = Math.min(15, Math.max(5, Math.floor(numbers.length / 3)));
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
        .slice(0, 15)
        .map(([label, count]) => ({ label, count }));
    }
    
    case 'datetime': {
      // Group by year or month depending on data range
      const dates = validData.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
      if (dates.length === 0) return [];
      
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
        .slice(0, 12)
        .map(([label, count]) => ({ label, count }));
    }
  }
}

/**
 * Placeholder functions for other chart types
 */
async function createScatterChartForExport(
  data: ChartData[],
  config: ChartExportConfig,
  theme: ChartExportTheme
): Promise<HTMLElement> {
  // Scatter chart implementation would go here
  return createBarChartForExport(data, config, theme); // Fallback to bar chart for now
}

async function createBoxChartForExport(
  data: ChartData[],
  config: ChartExportConfig,
  theme: ChartExportTheme
): Promise<HTMLElement> {
  // Box chart implementation would go here
  return createBarChartForExport(data, config, theme); // Fallback to bar chart for now
}

async function createAreaChartForExport(
  data: ChartData[],
  config: ChartExportConfig,
  theme: ChartExportTheme
): Promise<HTMLElement> {
  // Area chart implementation would go here
  return createLineChartForExport(data, config, theme); // Fallback to line chart for now
}

async function createHeatmapChartForExport(
  data: ChartData[],
  config: ChartExportConfig,
  theme: ChartExportTheme
): Promise<HTMLElement> {
  // Heatmap implementation would go here
  return createBarChartForExport(data, config, theme); // Fallback to bar chart for now
}

/**
 * Convert background chart element to PNG
 */
async function convertBackgroundChartToPng(
  element: HTMLElement,
  config: ChartExportConfig,
  theme: ChartExportTheme
): Promise<Blob> {
  const { width = 800, height = 600 } = config;
  const backgroundColor = config.backgroundColor ?? theme.canvasBackground;

  // Force layout stabilization and give the browser a moment to paint
  element.getBoundingClientRect();
  await new Promise(resolve => setTimeout(resolve, 200));

  // Measure the fully rendered dimensions so we don't clip any content
  const rect = element.getBoundingClientRect();
  const measuredWidth = Math.max(
    width,
    Math.ceil(rect.width),
    Math.ceil(element.scrollWidth),
    Math.ceil(element.offsetWidth)
  );
  const measuredHeight = Math.max(
    height,
    Math.ceil(rect.height),
    Math.ceil(element.scrollHeight),
    Math.ceil(element.offsetHeight)
  );

  const safetyPadding = 36;
  const exportWidth = measuredWidth + safetyPadding;
  const exportHeight = measuredHeight + safetyPadding;

  // Create SVG wrapper sized to the rendered content
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', exportWidth.toString());
  svg.setAttribute('height', exportHeight.toString());
  svg.setAttribute('viewBox', `0 0 ${exportWidth} ${exportHeight}`);

  const normalizedBackground = (backgroundColor || '').trim().toLowerCase();
  const shouldRenderBackground = normalizedBackground &&
    normalizedBackground !== 'transparent' &&
    normalizedBackground !== 'rgba(0,0,0,0)' &&
    normalizedBackground !== 'rgba(0, 0, 0, 0)';

  if (shouldRenderBackground) {
    const rectNode = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectNode.setAttribute('x', '0');
    rectNode.setAttribute('y', '0');
    rectNode.setAttribute('width', '100%');
    rectNode.setAttribute('height', '100%');
    rectNode.setAttribute('fill', backgroundColor);
    svg.appendChild(rectNode);
  }

  // Create foreign object at the measured size
  const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  foreignObject.setAttribute('x', '0');
  foreignObject.setAttribute('y', '0');
  foreignObject.setAttribute('width', exportWidth.toString());
  foreignObject.setAttribute('height', exportHeight.toString());

  // Clone element content so we can tweak sizing without mutating original
  const elementClone = element.cloneNode(true) as HTMLElement;
  elementClone.style.position = 'relative';
  elementClone.style.top = '0';
  elementClone.style.left = '0';
  elementClone.style.width = `${measuredWidth}px`;
  elementClone.style.minWidth = `${measuredWidth}px`;
  elementClone.style.height = `${measuredHeight}px`;
  elementClone.style.minHeight = `${measuredHeight}px`;
  elementClone.style.maxWidth = 'none';
  elementClone.style.maxHeight = 'none';
  elementClone.style.overflow = 'visible';
  elementClone.style.background = 'transparent';

  const cloneWrapper = document.createElement('div');
  cloneWrapper.style.cssText = `
    width: 100%;
    height: 100%;
    padding: ${safetyPadding / 2}px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  cloneWrapper.appendChild(elementClone);
  foreignObject.appendChild(cloneWrapper);
  svg.appendChild(foreignObject);

  // Prepare high DPI canvas scaled to export dimensions
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialise export canvas context');
  }

  const pixelRatio = Math.max(window.devicePixelRatio || 1, 2);
  canvas.width = exportWidth * pixelRatio;
  canvas.height = exportHeight * pixelRatio;
  ctx.scale(pixelRatio, pixelRatio);

  // High quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, exportWidth, exportHeight);

  const svgString = new XMLSerializer().serializeToString(svg);
  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0, exportWidth, exportHeight);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create PNG blob'));
          }
        }, 'image/png', 1.0);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load SVG image'));
    img.src = svgDataUrl;
  });
}

/**
 * Dual Charts PNG Export - Creates two charts side by side
 */
async function createDualChartsForExport(
  data: ChartData[],
  config: ChartExportConfig,
  theme: ChartExportTheme
): Promise<HTMLElement> {
  const { width = 1200, height = 600, dualOptions } = config;

  if (!dualOptions) {
    throw new Error('Dual options required for dual chart export');
  }

  const translate = (key: string, fallback: string, params?: Record<string, any>) =>
    translateOrFallback(config, key, fallback, params);
  const formatChartType = (chartType: string) => {
    const fallback = chartType.charAt(0).toUpperCase() + chartType.slice(1);
    return translate(`dataExplorer.chartTypes.${chartType}`, fallback);
  };
  const leftChartLabel = formatChartType(dualOptions.leftChart);
  const rightChartLabel = formatChartType(dualOptions.rightChart);

  const isBarLeft = dualOptions.leftChart === 'bar';
  const isBarRight = dualOptions.rightChart === 'bar';
  const needsWideLayout = isBarLeft || isBarRight;
  const barDrivenCategories = needsWideLayout ? Math.max(data.length, 1) : 0;

  const baseDualWidth = needsWideLayout ? 1480 : 1320;
  const widthBoost = needsWideLayout
    ? Math.min(Math.max(barDrivenCategories - 6, 0) * 14, 200)
    : Math.min(Math.max(data.length - 6, 0) * 8, 120);
  const resolvedDualWidth = Math.max(width, baseDualWidth + widthBoost);

  const baselineHeight = needsWideLayout ? 640 : 560;
  const heightBoost = needsWideLayout
    ? Math.min(Math.max(barDrivenCategories - 8, 0) * 34, 340)
    : Math.min(Math.max(data.length - 8, 0) * 24, 240);
  const estimatedDualHeight = Math.max(height, baselineHeight + heightBoost);

  const containerPadding = 48;
  const contentPadX = 56;
  const contentPadYTop = 48;
  const contentPadYBottom = 56;
  const chartsGap = 40;

  const chartsAreaWidth = resolvedDualWidth - containerPadding * 2 - contentPadX * 2;
  const slotWidth = Math.floor((chartsAreaWidth - chartsGap) / 2);
  const slotWidthClamped = Math.max(slotWidth, needsWideLayout ? 660 : 560);

  const childBaseHeight = Math.max(
    estimatedDualHeight - (containerPadding * 2 + contentPadYTop + contentPadYBottom + 96),
    needsWideLayout ? 420 : 360
  );
  const childHeightAdjustment = needsWideLayout
    ? Math.max(barDrivenCategories - 10, 0) * 30
    : Math.max(data.length - 12, 0) * 18;
  const resolvedChildHeight = Math.max(childBaseHeight + childHeightAdjustment, needsWideLayout ? 480 : 380);
  const resolvedDualHeight = Math.max(estimatedDualHeight, resolvedChildHeight + containerPadding * 2 + contentPadYTop + contentPadYBottom + 120);

  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: -10000px;
    left: -10000px;
    width: ${resolvedDualWidth}px;
    min-width: ${resolvedDualWidth}px;
    height: ${resolvedDualHeight}px;
    min-height: ${resolvedDualHeight}px;
    background: transparent;
    padding: ${containerPadding}px;
    box-sizing: border-box;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: ${theme.primaryText};
    display: flex;
    flex-direction: column;
    align-items: stretch;
  `;

  const contentWrapper = document.createElement('div');
  contentWrapper.style.cssText = `
    width: 100%;
    height: 100%;
    background: ${theme.cardBackground};
    border-radius: 24px;
    border: 1px solid ${theme.cardBorder};
    box-shadow: ${theme.dropShadow};
    padding: ${contentPadYTop}px ${contentPadX}px ${contentPadYBottom}px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 36px;
  `;

  const title = document.createElement('div');
  title.textContent = translate(
    'dataExplorer.export.dual.title',
    `${config.columnName} - Dual View (${leftChartLabel} | ${rightChartLabel})`,
    {
      columnName: config.columnName,
      leftChart: leftChartLabel,
      rightChart: rightChartLabel
    }
  );
  title.style.cssText = `
    font-size: 20px;
    font-weight: 600;
    text-align: center;
    letter-spacing: -0.01em;
    color: ${theme.primaryText};
  `;

  const chartsContainer = document.createElement('div');
  chartsContainer.style.cssText = `
    flex: 1 0 auto;
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${chartsGap}px;
    min-height: ${resolvedChildHeight}px;
    align-items: stretch;
    justify-items: center;
  `;

  const leftChartConfig: ChartExportConfig = {
    ...config,
    chartType: dualOptions.leftChart as any,
    width: slotWidthClamped,
    height: resolvedChildHeight,
    backgroundColor: config.backgroundColor,
    appearance: config.appearance,
    layoutMode: 'dual',
    translate: config.translate
  };

  const leftChartHeading = translate('dataExplorer.export.dual.leftHeading', 'Left Chart');
  const leftChart = await createSingleChartElement(data, leftChartConfig, leftChartHeading, theme);
  leftChart.style.width = '100%';
  leftChart.style.maxWidth = `${slotWidthClamped}px`;
  leftChart.style.background = 'transparent';
  leftChart.style.padding = '0';
  leftChart.style.alignSelf = 'stretch';

  const rightChartConfig: ChartExportConfig = {
    ...config,
    chartType: dualOptions.rightChart as any,
    width: slotWidthClamped,
    height: resolvedChildHeight,
    backgroundColor: config.backgroundColor,
    appearance: config.appearance,
    layoutMode: 'dual',
    translate: config.translate
  };

  const rightChartHeading = translate('dataExplorer.export.dual.rightHeading', 'Right Chart');
  const rightChart = await createSingleChartElement(data, rightChartConfig, rightChartHeading, theme);
  rightChart.style.width = '100%';
  rightChart.style.maxWidth = `${slotWidthClamped}px`;
  rightChart.style.background = 'transparent';
  rightChart.style.padding = '0';
  rightChart.style.alignSelf = 'stretch';

  chartsContainer.appendChild(leftChart);
  chartsContainer.appendChild(rightChart);

  contentWrapper.appendChild(title);
  contentWrapper.appendChild(chartsContainer);
  container.appendChild(contentWrapper);
  document.body.appendChild(container);

  await new Promise(resolve => setTimeout(resolve, 220));

  const leftHeight = leftChart.getBoundingClientRect().height;
  const rightHeight = rightChart.getBoundingClientRect().height;
  const tallest = Math.max(leftHeight, rightHeight);
  const titleHeight = title.getBoundingClientRect().height || 0;
  const structuralSpacing = containerPadding * 2 + contentPadYTop + contentPadYBottom + 36 + titleHeight;
  const measuredContentHeight = Math.ceil(contentWrapper.scrollHeight || 0);
  const calculatedDualHeight = tallest + structuralSpacing;
  const adjustedDualHeight = Math.max(resolvedDualHeight, measuredContentHeight + containerPadding * 2, calculatedDualHeight);
  container.style.height = `${adjustedDualHeight}px`;
  container.style.minHeight = `${adjustedDualHeight}px`;
  chartsContainer.style.minHeight = `${Math.max(resolvedChildHeight, tallest)}px`;

  return container;
}

/**
 * Create a single chart element for dual view
 */
async function createSingleChartElement(
  data: ChartData[],
  config: ChartExportConfig,
  title: string,
  theme: ChartExportTheme
): Promise<HTMLElement> {
  const translate = (key: string, fallback: string, params?: Record<string, any>) =>
    translateOrFallback(config, key, fallback, params);
  const layoutMode = config.layoutMode ?? 'single';
  const chartContainer = document.createElement('div');
  chartContainer.style.cssText = `
    width: 100%;
    height: auto;
    min-height: 100%;
    padding: ${layoutMode === 'dual' ? '12px 8px 24px' : '16px 12px 24px'};
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: transparent;
  `;
  
  // Chart title
  const chartTitle = document.createElement('div');
  const chartTypeLabel = translate(
    `dataExplorer.chartTypes.${config.chartType}`,
    config.chartType.charAt(0).toUpperCase() + config.chartType.slice(1)
  );
  chartTitle.textContent = translate(
    'dataExplorer.export.dual.panelTitle',
    `${title} (${chartTypeLabel})`,
    {
      heading: title,
      chartType: chartTypeLabel
    }
  );
  chartTitle.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${theme.secondaryText};
  `;
  
  // Chart content container
  const contentContainer = document.createElement('div');
  contentContainer.style.cssText = `
    flex: 1 0 auto;
    min-height: 0;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    padding: ${layoutMode === 'dual' ? '10px 8px 18px' : '12px'};
    box-sizing: border-box;
    width: 100%;
    gap: ${layoutMode === 'dual' ? 14 : 16}px;
  `;

  // Create chart based on type
  let chartElement: HTMLElement;
  const widthCompensation = layoutMode === 'dual' ? 32 : 40;
  const heightCompensation = layoutMode === 'dual' ? 84 : 96;
  const adjustedConfig: ChartExportConfig = {
    ...config,
    width: config.width && config.width > 0 ? Math.max(config.width - widthCompensation, 0) : config.width,
    height: config.height && config.height > 0 ? Math.max(config.height - heightCompensation, 0) : config.height,
    layoutMode: config.layoutMode,
    translate: config.translate
  };
  
  switch (config.chartType) {
    case 'bar':
      chartElement = await createBarChartForExport(data, adjustedConfig, theme);
      break;
    case 'pie':
      chartElement = await createPieChartForExport(data, adjustedConfig, theme);
      break;
    case 'line':
      chartElement = await createLineChartForExport(data, adjustedConfig, theme);
      break;
    default:
      chartElement = await createBarChartForExport(data, adjustedConfig, theme); // Fallback
  }
  
  // Remove the outer container from single chart and just use content
  const exportedCard = chartElement.querySelector('[data-export-card]') as HTMLElement | null;

  if (exportedCard) {
    const clonedContent = exportedCard.cloneNode(true) as HTMLElement;
    const datasetWidthAttr = exportedCard.dataset.cardWidth;
    const datasetWidth = datasetWidthAttr ? Number(datasetWidthAttr) : undefined;
    const slotWidth = config.width && config.width > 0 ? config.width : undefined;
    const fallbackWidth = layoutMode === 'dual' ? 720 : 1040;
    const baseWidth = !Number.isNaN(datasetWidth ?? NaN) && datasetWidth ? datasetWidth : slotWidth ?? fallbackWidth;
    const minWidth = layoutMode === 'dual' ? 560 : 720;
    const maxWidth = layoutMode === 'dual' ? 960 : 1220;
    const widthCeiling = slotWidth ?? maxWidth;
    let finalMaxWidth = Math.min(baseWidth, widthCeiling, maxWidth);
    if (!slotWidth) {
      finalMaxWidth = Math.max(minWidth, finalMaxWidth);
    }

    finalMaxWidth = Math.max(320, finalMaxWidth);

    clonedContent.style.width = '100%';
    clonedContent.style.maxWidth = `${finalMaxWidth}px`;
    clonedContent.style.height = 'auto';
    clonedContent.style.margin = '0 auto';

    const chartBody = clonedContent.querySelector('[data-export-chart-body]') as HTMLElement | null;
    if (chartBody) {
      chartBody.style.margin = '0 auto';
      chartBody.style.maxWidth = '100%';
    }

    contentContainer.appendChild(clonedContent);
  } else {
    contentContainer.appendChild(chartElement);
  }

  const originalParent = chartElement.parentNode;
  if (originalParent && originalParent !== contentContainer) {
    originalParent.removeChild(chartElement);
  }

  chartContainer.appendChild(chartTitle);
  chartContainer.appendChild(contentContainer);

  return chartContainer;
}

/**
 * Download chart PNG with proper filename
 */
function downloadChartPng(blob: Blob, config: ChartExportConfig): void {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  const cleanColumnName = config.columnName
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const chartTypeSuffix = config.dualOptions?.isDual 
    ? `dual-${config.dualOptions.leftChart}-${config.dualOptions.rightChart}`
    : config.chartType;
  
  const filename = `chart-${cleanColumnName}-${chartTypeSuffix}-${timestamp}.png`;
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
