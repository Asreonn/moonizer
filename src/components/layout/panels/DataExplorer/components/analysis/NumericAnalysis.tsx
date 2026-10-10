import { ColumnProfile } from '../../../../../../core/profiling/columnTypes';
import { AnalyticsTooltip } from '../../../../../ui/AnalyticsTooltip';
import styles from './NumericAnalysis.module.css';

interface NumericAnalysisProps {
  profile: ColumnProfile;
  t: any;
}

export function NumericAnalysis({ profile, t }: NumericAnalysisProps) {
  const stats = profile.numericStats;
  
  if (!stats) {
    return (
      <div className={styles.noData}>
        <p>{t('dataExplorer.analysis.numeric.noValidData')}</p>
      </div>
    );
  }

  const range = stats.max - stats.min;
  const iqr = stats.q3 - stats.q1;
  const skewness = calculateSkewness(stats.mean, stats.median);

  return (
    <div className={styles.numericAnalysis}>
      {/* Core Statistics */}
      <div className={styles.analysisGroup}>
        <div className={styles.groupHeader}>
          <h4 className={styles.groupTitle}>
            {t('dataExplorer.analysis.numeric.descriptive')}
          </h4>
          <div className={styles.typeChip}>NUMERIC</div>
        </div>
        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="dataPoints">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.numeric.count')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{profile.totalCount - profile.nullCount}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="meanValue">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.numeric.mean')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{formatNumber(stats.mean)}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="medianValue">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.numeric.median')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{formatNumber(stats.median)}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="standardDeviation">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.numeric.stdDev')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{formatNumber(stats.std)}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="valueRange">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.numeric.min')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{formatNumber(stats.min)}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="maximumValue">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.numeric.max')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{formatNumber(stats.max)}</span>
          </div>
        </div>
      </div>

      {/* Quartile Analysis */}
      <div className={styles.analysisGroup}>
        <div className={styles.groupHeader}>
          <h4 className={styles.groupTitle}>
            {t('dataExplorer.analysis.numeric.quartiles')}
          </h4>
          <div className={styles.confidenceChip}>95% CONFIDENCE</div>
        </div>
        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="q1Percentile">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.numeric.q1')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{formatNumber(stats.q1)}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="q3Percentile">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.numeric.q3')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{formatNumber(stats.q3)}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="interquartileRange">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.numeric.iqr')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{formatNumber(iqr)}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="totalRange">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.numeric.range')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{formatNumber(range)}</span>
          </div>
        </div>
      </div>

      {/* Distribution Analysis */}
      <div className={styles.analysisGroup}>
        <div className={styles.groupHeader}>
          <h4 className={styles.groupTitle}>
            {t('dataExplorer.analysis.numeric.distribution.title')}
          </h4>
          <div className={styles.algorithmChip}>TUKEY METHOD</div>
        </div>
        <div className={styles.distributionInfo}>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="skewnessValue">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.numeric.skewness')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>
              {getSkewnessLabel(skewness, t)}
            </span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="outlierCount">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.numeric.outliers')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>
              {stats.outlierCount} ({stats.outlierPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
        
        {/* Distribution visualization */}
        <div className={styles.distributionViz}>
          <div className={styles.boxPlot}>
            <div className={styles.boxPlotContainer}>
              <div
                className={styles.whiskerLeft}
                style={{ left: '0%' }}
              />
              <div
                className={styles.box}
                style={{ 
                  left: '25%', 
                  width: '50%'
                }}
              >
                <div
                  className={styles.median}
                  style={{ 
                    left: `${((stats.median - stats.q1) / (stats.q3 - stats.q1)) * 100}%`
                  }}
                />
              </div>
              <div
                className={styles.whiskerRight}
                style={{ right: '0%' }}
              />
            </div>
            <div className={styles.boxPlotLabels}>
              <span>{formatNumber(stats.min)}</span>
              <span>{formatNumber(stats.q1)}</span>
              <span>{formatNumber(stats.median)}</span>
              <span>{formatNumber(stats.q3)}</span>
              <span>{formatNumber(stats.max)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Value Composition */}
      <div className={styles.analysisGroup}>
        <div className={styles.groupHeader}>
          <h4 className={styles.groupTitle}>
            {t('dataExplorer.analysis.numeric.composition')}
          </h4>
          <div className={styles.sampleChip}>SAMPLE: {profile.totalCount}</div>
        </div>
        <div className={styles.compositionStats}>
          {renderValueComposition(profile, stats, t)}
        </div>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  } else if (Number.isInteger(num)) {
    return num.toString();
  } else {
    return num.toFixed(3);
  }
}

function calculateSkewness(mean: number, median: number): number {
  return mean - median;
}

function getSkewnessLabel(skewness: number, t: any): string {
  if (Math.abs(skewness) < 0.5) {
    return t('dataExplorer.analysis.numeric.distribution.normal');
  } else if (skewness > 0) {
    return t('dataExplorer.analysis.numeric.distribution.rightSkewed');
  } else {
    return t('dataExplorer.analysis.numeric.distribution.leftSkewed');
  }
}

function renderValueComposition(profile: ColumnProfile, _stats: any, t: any) {
  // We'll calculate these from sample values for now
  const sampleNumbers = profile.sampleValues
    .map(v => Number(v))
    .filter(n => !isNaN(n));

  const positive = sampleNumbers.filter(n => n > 0).length;
  const negative = sampleNumbers.filter(n => n < 0).length;
  const zero = sampleNumbers.filter(n => n === 0).length;
  const total = positive + negative + zero;

  if (total === 0) return null;

  return (
    <div className={styles.compositionGrid}>
      <div className={styles.compositionItem}>
        <span className={styles.compositionLabel}>{t('dataExplorer.analysis.numeric.positive')}</span>
        <span className={styles.compositionValue}>
          {positive} ({((positive / total) * 100).toFixed(1)}%)
        </span>
      </div>
      <div className={styles.compositionItem}>
        <span className={styles.compositionLabel}>{t('dataExplorer.analysis.numeric.negative')}</span>
        <span className={styles.compositionValue}>
          {negative} ({((negative / total) * 100).toFixed(1)}%)
        </span>
      </div>
      <div className={styles.compositionItem}>
        <span className={styles.compositionLabel}>{t('dataExplorer.analysis.numeric.zero')}</span>
        <span className={styles.compositionValue}>
          {zero} ({((zero / total) * 100).toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}