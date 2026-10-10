import { ColumnProfile } from '../../../../../../core/profiling/columnTypes';
import styles from './AdvancedBooleanAnalysis.module.css';

interface AdvancedBooleanAnalysisProps {
  profile: ColumnProfile;
  data: any[];
  t: any;
}

export function AdvancedBooleanAnalysis({ data, t }: AdvancedBooleanAnalysisProps) {
  const validBooleans = data.filter(v => v !== null && v !== undefined);
  
  if (validBooleans.length === 0) {
    return (
      <div className={styles.noDataState}>
        <div className={styles.noDataIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="9,11 12,14 22,4"/>
            <path d="M21,12v7a2,2 0 01-2,2H5a2,2 0 01-2-2V5a2,2 0 012-2h11"/>
          </svg>
        </div>
        <p>{t('dataExplorer.advanced.boolean.noValidData')}</p>
      </div>
    );
  }

  const distribution = analyzeBooleanDistribution(validBooleans);
  const patterns = analyzeBooleanPatterns(validBooleans);
  const quality = assessBooleanQuality(validBooleans);
  const insights = generateBooleanInsights(distribution);

  return (
    <div className={styles.advancedBooleanAnalysis}>
      <div className={styles.analysisGrid}>
        {/* Distribution Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.boolean.distributionAnalysis')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.boolean.distributionInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.trueCount')}</span>
              <span className={styles.statValue}>{distribution.trueCount}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.falseCount')}</span>
              <span className={styles.statValue}>{distribution.falseCount}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.truePercentage')}</span>
              <span className={styles.statValue}>{(distribution.truePercentage * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.falsePercentage')}</span>
              <span className={styles.statValue}>{(distribution.falsePercentage * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.ratio')}</span>
              <span className={styles.statValue}>{distribution.ratio}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.balance')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.boolean.balance.${distribution.balance}`))}</span>
            </div>
          </div>
        </div>

        {/* Pattern Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.boolean.patternAnalysis')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.boolean.patternInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.longestTrueStreak')}</span>
              <span className={styles.statValue}>{patterns.longestTrueStreak}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.longestFalseStreak')}</span>
              <span className={styles.statValue}>{patterns.longestFalseStreak}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.alternations')}</span>
              <span className={styles.statValue}>{patterns.alternations}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.clustering')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.boolean.clustering.${patterns.clustering}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.randomness')}</span>
              <span className={styles.statValue}>{(patterns.randomness * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.predictability')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.boolean.predictability.${patterns.predictability}`))}</span>
            </div>
          </div>
        </div>

        {/* Data Quality */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.boolean.dataQuality')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.boolean.qualityInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.purity')}</span>
              <span className={styles.statValue}>{(quality.purity * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.consistency')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.boolean.consistency.${quality.consistency}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.uniqueValues')}</span>
              <span className={styles.statValue}>{quality.uniqueValues}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.nonBooleanValues')}</span>
              <span className={styles.statValue}>{quality.nonBooleanCount}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.dataType')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.boolean.dataType.${quality.dataType}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.recommendation')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.boolean.recommendation.${quality.recommendation}`))}</span>
            </div>
          </div>
        </div>

        {/* Statistical Insights */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.boolean.statisticalInsights')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.boolean.insightsInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.entropy')}</span>
              <span className={styles.statValue}>{insights.entropy.toFixed(3)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.informationContent')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.boolean.informationContent.${insights.informationContent}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.biasMagnitude')}</span>
              <span className={styles.statValue}>{(insights.bias * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.biasDirection')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.boolean.biasDirection.${insights.biasDirection}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.variance')}</span>
              <span className={styles.statValue}>{insights.variance.toFixed(3)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.expectedValue')}</span>
              <span className={styles.statValue}>{insights.expectedValue.toFixed(3)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Value Distribution Chart */}
      <div className={styles.distributionChart}>
        <h4>{t('dataExplorer.advanced.boolean.valueDistribution')}</h4>
        <div className={styles.chartContainer}>
          <div className={styles.valueBar}>
            <div className={styles.valueLabel}>
              {t('dataExplorer.advanced.boolean.trueValues')}
            </div>
            <div className={styles.barContainer}>
              <div 
                className={`${styles.bar} ${styles.trueBar}`}
                style={{ width: `${distribution.truePercentage * 100}%` }}
              />
            </div>
            <div className={styles.valueCount}>
              {distribution.trueCount} ({(distribution.truePercentage * 100).toFixed(1)}%)
            </div>
          </div>
          <div className={styles.valueBar}>
            <div className={styles.valueLabel}>
              {t('dataExplorer.advanced.boolean.falseValues')}
            </div>
            <div className={styles.barContainer}>
              <div 
                className={`${styles.bar} ${styles.falseBar}`}
                style={{ width: `${distribution.falsePercentage * 100}%` }}
              />
            </div>
            <div className={styles.valueCount}>
              {distribution.falseCount} ({(distribution.falsePercentage * 100).toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function analyzeBooleanDistribution(values: any[]) {
  const booleanValues = values.map(v => {
    if (typeof v === 'boolean') return v;
    const str = String(v).toLowerCase().trim();
    if (['true', '1', 'yes', 'y', 'on'].includes(str)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(str)) return false;
    return null;
  });

  const validBooleans = booleanValues.filter(v => v !== null);
  const trueCount = validBooleans.filter(v => v === true).length;
  const falseCount = validBooleans.filter(v => v === false).length;
  const total = trueCount + falseCount;

  const truePercentage = total > 0 ? trueCount / total : 0;
  const falsePercentage = total > 0 ? falseCount / total : 0;

  // Calculate ratio
  let ratio = 'N/A';
  if (falseCount > 0) {
    const ratioValue = trueCount / falseCount;
    ratio = `${ratioValue.toFixed(2)}:1`;
  } else if (trueCount > 0) {
    ratio = '∞:1';
  }

  // Determine balance
  let balance = 'balanced';
  const minPercentage = Math.min(truePercentage, falsePercentage);
  if (minPercentage < 0.1) balance = 'highlyImbalanced';
  else if (minPercentage < 0.25) balance = 'imbalanced';
  else if (minPercentage < 0.4) balance = 'moderatelyImbalanced';

  return {
    trueCount,
    falseCount,
    truePercentage,
    falsePercentage,
    ratio,
    balance
  };
}

function analyzeBooleanPatterns(values: any[]) {
  const booleanValues = values.map(v => {
    if (typeof v === 'boolean') return v;
    const str = String(v).toLowerCase().trim();
    if (['true', '1', 'yes', 'y', 'on'].includes(str)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(str)) return false;
    return null;
  }).filter(v => v !== null);

  if (booleanValues.length === 0) {
    return {
      longestTrueStreak: 0,
      longestFalseStreak: 0,
      alternations: 0,
      clustering: 'none',
      randomness: 0,
      predictability: 'unknown'
    };
  }

  // Find streaks
  let longestTrueStreak = 0;
  let longestFalseStreak = 0;
  let currentTrueStreak = 0;
  let currentFalseStreak = 0;

  booleanValues.forEach(value => {
    if (value === true) {
      currentTrueStreak++;
      currentFalseStreak = 0;
      longestTrueStreak = Math.max(longestTrueStreak, currentTrueStreak);
    } else {
      currentFalseStreak++;
      currentTrueStreak = 0;
      longestFalseStreak = Math.max(longestFalseStreak, currentFalseStreak);
    }
  });

  // Count alternations
  let alternations = 0;
  for (let i = 1; i < booleanValues.length; i++) {
    if (booleanValues[i] !== booleanValues[i - 1]) {
      alternations++;
    }
  }

  // Determine clustering
  const maxStreak = Math.max(longestTrueStreak, longestFalseStreak);
  const avgStreak = booleanValues.length / (alternations + 1);
  let clustering = 'none';
  if (maxStreak > booleanValues.length * 0.5) clustering = 'high';
  else if (avgStreak > 3) clustering = 'moderate';
  else if (alternations > booleanValues.length * 0.6) clustering = 'low';

  // Calculate randomness (normalized alternation frequency)
  const maxAlternations = booleanValues.length - 1;
  const randomness = maxAlternations > 0 ? alternations / maxAlternations : 0;

  // Determine predictability
  let predictability = 'random';
  if (randomness < 0.3) predictability = 'highly_predictable';
  else if (randomness < 0.6) predictability = 'moderately_predictable';

  return {
    longestTrueStreak,
    longestFalseStreak,
    alternations,
    clustering,
    randomness,
    predictability
  };
}

function assessBooleanQuality(values: any[]) {
  const uniqueValues = new Set(values.map(v => String(v).toLowerCase().trim()));
  const uniqueCount = uniqueValues.size;

  // Count true boolean values
  const booleanValues = values.filter(v => {
    if (typeof v === 'boolean') return true;
    const str = String(v).toLowerCase().trim();
    return ['true', '1', 'yes', 'y', 'on', 'false', '0', 'no', 'n', 'off'].includes(str);
  });

  const purity = values.length > 0 ? booleanValues.length / values.length : 0;
  const nonBooleanCount = values.length - booleanValues.length;

  // Determine consistency
  let consistency = 'high';
  if (purity < 0.8) consistency = 'low';
  else if (purity < 0.95) consistency = 'medium';

  // Determine data type classification
  let dataType = 'mixed';
  if (purity === 1) {
    if (uniqueCount === 2) dataType = 'pure_boolean';
    else if (uniqueCount === 1) dataType = 'constant';
    else dataType = 'boolean_variants';
  }

  // Generate recommendation
  let recommendation = 'good';
  if (purity < 0.9 || uniqueCount > 3) recommendation = 'needs_cleaning';
  else if (uniqueCount === 1) recommendation = 'consider_constant';

  return {
    purity,
    consistency,
    uniqueValues: uniqueCount,
    nonBooleanCount,
    dataType,
    recommendation
  };
}

function generateBooleanInsights(distribution: any) {
  const p = distribution.truePercentage;
  
  // Shannon entropy
  const entropy = p === 0 || p === 1 ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
  
  // Information content
  let informationContent = 'maximum';
  if (entropy < 0.5) informationContent = 'low';
  else if (entropy < 0.8) informationContent = 'medium';
  else if (entropy < 0.95) informationContent = 'high';

  // Bias analysis
  const bias = Math.abs(0.5 - p);
  let biasDirection = 'none';
  if (bias > 0.1) {
    biasDirection = p > 0.5 ? 'toward_true' : 'toward_false';
  }

  // Statistical measures
  const variance = p * (1 - p);
  const expectedValue = p;

  return {
    entropy,
    informationContent,
    bias,
    biasDirection,
    variance,
    expectedValue
  };
}