import { ColumnProfile } from '../../../../../../core/profiling/columnTypes';
import styles from './AdvancedNumericAnalysis.module.css';

interface AdvancedNumericAnalysisProps {
  profile: ColumnProfile;
  data: any[];
  t: any;
}

export function AdvancedNumericAnalysis({ data, t }: AdvancedNumericAnalysisProps) {
  const validNumbers = data.filter(v => typeof v === 'number' && !isNaN(v));
  
  if (validNumbers.length === 0) {
    return (
      <div className={styles.noDataState}>
        <div className={styles.noDataIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5-2 4-2 4 2 4 2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </div>
        <p>{t('dataExplorer.advanced.numeric.noValidData')}</p>
      </div>
    );
  }

  const stats = calculateAdvancedStats(validNumbers);
  const distribution = calculateDistributionAnalysis(validNumbers);
  const outliers = detectOutliers(validNumbers);
  const patterns = analyzePatterns(validNumbers);

  return (
    <div className={styles.advancedNumericAnalysis}>
      <div className={styles.analysisGrid}>
        {/* Enhanced Statistics */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.numeric.enhancedStats')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.numeric.enhancedStatsInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.mean')}</span>
              <span className={styles.statValue}>{stats.mean.toFixed(3)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.median')}</span>
              <span className={styles.statValue}>{stats.median.toFixed(3)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.mode')}</span>
              <span className={styles.statValue}>{stats.mode !== null ? stats.mode.toFixed(3) : 'N/A'}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.stdDev')}</span>
              <span className={styles.statValue}>{stats.stdDev.toFixed(3)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.variance')}</span>
              <span className={styles.statValue}>{stats.variance.toFixed(3)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.cv')}</span>
              <span className={styles.statValue}>{stats.cv.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Distribution Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.numeric.distributionAnalysis')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.numeric.distributionInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.skewness')}</span>
              <span className={styles.statValue}>{distribution.skewness.toFixed(3)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.kurtosis')}</span>
              <span className={styles.statValue}>{distribution.kurtosis.toFixed(3)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.shape')}</span>
              <span className={styles.statValue}>{t(`dataExplorer.advanced.numeric.shapes.${distribution.shape}`)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.peakedness')}</span>
              <span className={styles.statValue}>{t(`dataExplorer.advanced.numeric.peakedness.${distribution.peakedness}`)}</span>
            </div>
          </div>
        </div>

        {/* Outlier Detection */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.numeric.outlierDetection')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.numeric.outlierInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.iqrOutliers')}</span>
              <span className={styles.statValue}>{outliers.iqrOutliers.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.zScoreOutliers')}</span>
              <span className={styles.statValue}>{outliers.zScoreOutliers.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.outlierPercentage')}</span>
              <span className={styles.statValue}>{((outliers.iqrOutliers.length / validNumbers.length) * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.extremeValues')}</span>
              <span className={styles.statValue}>{outliers.extremeValues.length}</span>
            </div>
          </div>
        </div>

        {/* Pattern Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.numeric.patternAnalysis')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.numeric.patternInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.trend')}</span>
              <span className={styles.statValue}>{t(`dataExplorer.advanced.numeric.trends.${patterns.trend}`)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.volatility')}</span>
              <span className={styles.statValue}>{t(`dataExplorer.advanced.numeric.volatility.${patterns.volatility}`)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.clustering')}</span>
              <span className={styles.statValue}>{patterns.clustering ? t('dataExplorer.advanced.numeric.yes') : t('dataExplorer.advanced.numeric.no')}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.numeric.gaps')}</span>
              <span className={styles.statValue}>{patterns.gaps}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateAdvancedStats(numbers: number[]) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const n = numbers.length;
  
  const mean = numbers.reduce((sum, val) => sum + val, 0) / n;
  const median = n % 2 === 0 ? (sorted[n/2 - 1] + sorted[n/2]) / 2 : sorted[Math.floor(n/2)];
  
  // Mode calculation
  const frequency: Record<number, number> = {};
  numbers.forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1;
  });
  const maxFreq = Math.max(...Object.values(frequency));
  const modes = Object.keys(frequency).filter(key => frequency[Number(key)] === maxFreq);
  const mode = modes.length === 1 ? Number(modes[0]) : null;
  
  const variance = numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  const cv = Math.abs(mean) > 0 ? (stdDev / Math.abs(mean)) * 100 : 0;
  
  return { mean, median, mode, variance, stdDev, cv };
}

function calculateDistributionAnalysis(numbers: number[]) {
  const n = numbers.length;
  const mean = numbers.reduce((sum, val) => sum + val, 0) / n;
  const variance = numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  
  // Skewness (third moment)
  const skewness = numbers.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / n;
  
  // Kurtosis (fourth moment)
  const kurtosis = numbers.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / n - 3;
  
  // Distribution shape
  let shape = 'normal';
  if (Math.abs(skewness) > 1) {
    shape = skewness > 0 ? 'rightSkewed' : 'leftSkewed';
  } else if (Math.abs(skewness) > 0.5) {
    shape = skewness > 0 ? 'moderatelyRightSkewed' : 'moderatelyLeftSkewed';
  }
  
  // Peakedness
  let peakedness = 'mesokurtic';
  if (kurtosis > 1) {
    peakedness = 'leptokurtic';
  } else if (kurtosis < -1) {
    peakedness = 'platykurtic';
  }
  
  return { skewness, kurtosis, shape, peakedness };
}

function detectOutliers(numbers: number[]) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const n = numbers.length;
  
  // IQR method
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const iqrOutliers = numbers.filter(val => val < lowerBound || val > upperBound);
  
  // Z-score method (|z| > 3)
  const mean = numbers.reduce((sum, val) => sum + val, 0) / n;
  const stdDev = Math.sqrt(numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1));
  const zScoreOutliers = numbers.filter(val => Math.abs((val - mean) / stdDev) > 3);
  
  // Extreme values (beyond 3 * IQR)
  const extremeLower = q1 - 3 * iqr;
  const extremeUpper = q3 + 3 * iqr;
  const extremeValues = numbers.filter(val => val < extremeLower || val > extremeUpper);
  
  return { iqrOutliers, zScoreOutliers, extremeValues };
}

function analyzePatterns(numbers: number[]) {
  const n = numbers.length;
  
  // Trend analysis (simple linear regression slope)
  const indices = Array.from({ length: n }, (_, i) => i);
  const meanX = (n - 1) / 2;
  const meanY = numbers.reduce((sum, val) => sum + val, 0) / n;
  
  const numerator = indices.reduce((sum, x, i) => sum + (x - meanX) * (numbers[i] - meanY), 0);
  const denominator = indices.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0);
  const slope = denominator !== 0 ? numerator / denominator : 0;
  
  let trend = 'stable';
  if (Math.abs(slope) > 0.1) {
    trend = slope > 0 ? 'increasing' : 'decreasing';
  }
  
  // Volatility analysis
  const differences = [];
  for (let i = 1; i < n; i++) {
    differences.push(Math.abs(numbers[i] - numbers[i - 1]));
  }
  const avgDifference = differences.reduce((sum, val) => sum + val, 0) / differences.length;
  const range = Math.max(...numbers) - Math.min(...numbers);
  const volatilityRatio = range > 0 ? avgDifference / range : 0;
  
  let volatility = 'low';
  if (volatilityRatio > 0.1) {
    volatility = 'high';
  } else if (volatilityRatio > 0.05) {
    volatility = 'medium';
  }
  
  // Simple clustering detection (gaps in sorted data)
  const sorted = [...numbers].sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(sorted[i] - sorted[i - 1]);
  }
  const avgGap = gaps.reduce((sum, val) => sum + val, 0) / gaps.length;
  const largeGaps = gaps.filter(gap => gap > avgGap * 3).length;
  const clustering = largeGaps > 0;
  
  return { trend, volatility, clustering, gaps: largeGaps };
}