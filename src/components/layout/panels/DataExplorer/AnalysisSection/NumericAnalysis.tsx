import { useMemo } from 'react';
import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import styles from './AnalysisSection.module.css';
import statStyles from './StatisticCard.module.css';

interface NumericAnalysisProps {
  data: any[];
  columnName: string;
}

export function NumericAnalysis({ data }: NumericAnalysisProps) {
  const { t } = useLanguage();
  
  const analysis = useMemo(() => {
    const numericData = data.map(d => parseFloat(d)).filter(d => !isNaN(d)).sort((a, b) => a - b);
    
    if (numericData.length === 0) return null;
    
    const sum = numericData.reduce((a, b) => a + b, 0);
    const mean = sum / numericData.length;
    const min = numericData[0];
    const max = numericData[numericData.length - 1];
    const range = max - min;
    
    // Median
    const mid = Math.floor(numericData.length / 2);
    const median = numericData.length % 2 === 0 
      ? (numericData[mid - 1] + numericData[mid]) / 2 
      : numericData[mid];
    
    // Quartiles
    const q1Index = Math.floor(numericData.length * 0.25);
    const q3Index = Math.floor(numericData.length * 0.75);
    const q1 = numericData[q1Index];
    const q3 = numericData[q3Index];
    const iqr = q3 - q1;
    
    // Standard deviation
    const variance = numericData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericData.length;
    const stdDev = Math.sqrt(variance);
    
    // Outliers (using IQR method)
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliers = numericData.filter(val => val < lowerBound || val > upperBound);
    
    // Distribution shape indicators
    const skewness = calculateSkewness(numericData, mean, stdDev);
    const kurtosis = calculateKurtosis(numericData, mean, stdDev);
    
    // Zero and negative counts
    const zeroCount = numericData.filter(val => val === 0).length;
    const negativeCount = numericData.filter(val => val < 0).length;
    const positiveCount = numericData.filter(val => val > 0).length;
    
    return {
      count: numericData.length,
      sum,
      mean,
      median,
      min,
      max,
      range,
      q1,
      q3,
      iqr,
      stdDev,
      variance,
      outliers,
      skewness,
      kurtosis,
      zeroCount,
      negativeCount,
      positiveCount
    };
  }, [data]);
  
  if (!analysis) {
    return (
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.numeric.title')}</h3>
        </div>
        <div className={styles.cardContent}>
          <p>{t('dataExplorer.analysis.numeric.noValidData')}</p>
        </div>
      </div>
    );
  }
  
  const formatNumber = (num: number, decimals = 2) => {
    if (Math.abs(num) >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (Math.abs(num) >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(decimals);
  };
  
  const getDistributionShape = () => {
    if (Math.abs(analysis.skewness) < 0.5) {
      return { shape: t('dataExplorer.analysis.numeric.distribution.normal'), color: '#10b981' };
    } else if (analysis.skewness > 0.5) {
      return { shape: t('dataExplorer.analysis.numeric.distribution.rightSkewed'), color: '#f59e0b' };
    } else {
      return { shape: t('dataExplorer.analysis.numeric.distribution.leftSkewed'), color: '#ef4444' };
    }
  };
  
  const distributionInfo = getDistributionShape();
  
  return (
    <div className={styles.cardGrid}>
      {/* Descriptive Statistics */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.numeric.descriptive')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.statGrid}>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.numeric.count')}</span>
              <span className={statStyles.statValue}>{analysis.count.toLocaleString()}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.numeric.mean')}</span>
              <span className={statStyles.statValue}>{formatNumber(analysis.mean)}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.numeric.median')}</span>
              <span className={statStyles.statValue}>{formatNumber(analysis.median)}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.numeric.stdDev')}</span>
              <span className={statStyles.statValue}>{formatNumber(analysis.stdDev)}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.numeric.min')}</span>
              <span className={statStyles.statValue}>{formatNumber(analysis.min)}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.numeric.max')}</span>
              <span className={statStyles.statValue}>{formatNumber(analysis.max)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quartile Analysis */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.numeric.quartiles')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.statGrid}>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.numeric.q1')}</span>
              <span className={statStyles.statValue}>{formatNumber(analysis.q1)}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.numeric.q3')}</span>
              <span className={statStyles.statValue}>{formatNumber(analysis.q3)}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.numeric.iqr')}</span>
              <span className={statStyles.statValue}>{formatNumber(analysis.iqr)}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.numeric.range')}</span>
              <span className={statStyles.statValue}>{formatNumber(analysis.range)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Distribution Analysis */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.numeric.distribution.title')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.statGrid}>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.numeric.distribution.shape')}</span>
              <span 
                className={statStyles.statValue} 
                style={{ color: distributionInfo.color }}
              >
                {distributionInfo.shape}
              </span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.numeric.skewness')}</span>
              <span className={statStyles.statValue}>{formatNumber(analysis.skewness, 3)}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.numeric.outliers')}</span>
              <span className={statStyles.statValue}>
                {analysis.outliers.length} ({((analysis.outliers.length / analysis.count) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Value Composition */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.numeric.composition')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.statGrid}>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.numeric.positive')}</span>
              <span className={statStyles.statValue}>
                {analysis.positiveCount} ({((analysis.positiveCount / analysis.count) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.numeric.negative')}</span>
              <span className={statStyles.statValue}>
                {analysis.negativeCount} ({((analysis.negativeCount / analysis.count) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.numeric.zero')}</span>
              <span className={statStyles.statValue}>
                {analysis.zeroCount} ({((analysis.zeroCount / analysis.count) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for statistical calculations
function calculateSkewness(data: number[], mean: number, stdDev: number): number {
  const n = data.length;
  if (n < 3 || stdDev === 0) return 0;
  
  const skewSum = data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
  return (n / ((n - 1) * (n - 2))) * skewSum;
}

function calculateKurtosis(data: number[], mean: number, stdDev: number): number {
  const n = data.length;
  if (n < 4 || stdDev === 0) return 0;
  
  const kurtSum = data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0);
  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * kurtSum - 
         (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
}