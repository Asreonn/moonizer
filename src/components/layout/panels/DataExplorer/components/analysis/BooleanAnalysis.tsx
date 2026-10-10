import { ColumnProfile } from '../../../../../../core/profiling/columnTypes';
import { AnalyticsTooltip } from '../../../../../ui/AnalyticsTooltip';
import styles from './BooleanAnalysis.module.css';

interface BooleanAnalysisProps {
  profile: ColumnProfile;
  t: any;
}

export function BooleanAnalysis({ profile, t }: BooleanAnalysisProps) {
  const stats = profile.booleanStats;
  
  if (!stats) {
    return (
      <div className={styles.noData}>
        <p>{t('dataExplorer.analysis.boolean.noData')}</p>
      </div>
    );
  }

  const total = stats.trueCount + stats.falseCount;
  const balance = getBalanceLevel(stats.truePercent);
  const ratio = total > 0 ? `${stats.trueCount}:${stats.falseCount}` : '0:0';

  // Calculate advanced metrics
  const entropy = calculateEntropy(stats.truePercent / 100);
  const imbalanceRatio = Math.abs(stats.truePercent - 50) / 50;
  const majority = Math.max(stats.truePercent, stats.falsePercent);

  return (
    <div className={styles.booleanAnalysis}>
      {/* Distribution Analysis */}
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>
          {t('dataExplorer.advanced.boolean.distributionAnalysis')}
        </h4>
        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="trueCount">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.trueCount')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{stats.trueCount} ({stats.truePercent.toFixed(1)}%)</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="falseCount">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.falseCount')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{stats.falseCount} ({stats.falsePercent.toFixed(1)}%)</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="balanceRatio">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.ratio')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{ratio}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="dataBalance">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.balance')}</span>
            </AnalyticsTooltip>
            <span className={`${styles.statValue} ${styles[balance]}`}>
              {t(`dataExplorer.advanced.boolean.balance.${balance}`)}
            </span>
          </div>
        </div>
      </div>

      {/* Statistical Insights */}
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>
          {t('dataExplorer.advanced.boolean.statisticalInsights')}
        </h4>
        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="entropy">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.entropy')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{entropy.toFixed(3)} bits</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="informationContent">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.informationContent')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>
              {t(`dataExplorer.advanced.boolean.informationContent.${getInformationContent(entropy)}`)}
            </span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="biasMagnitude">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.biasMagnitude')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{(imbalanceRatio * 100).toFixed(1)}%</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="predictability">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.predictability')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>
              {t(`dataExplorer.advanced.boolean.predictability.${getPredictability(majority)}`)}
            </span>
          </div>
        </div>
      </div>

      {/* Data Quality */}
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>
          {t('dataExplorer.advanced.boolean.dataQuality')}
        </h4>
        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="purity">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.purity')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>
              {((total / profile.totalCount) * 100).toFixed(1)}%
            </span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="uniqueValues">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.uniqueValues')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{profile.uniqueCount}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="consistency">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.consistency')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>
              {t(`dataExplorer.advanced.boolean.consistency.${getConsistency(profile.uniqueCount, profile.nullCount)}`)}
            </span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="dataType">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.boolean.dataType')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>
              {t(`dataExplorer.advanced.boolean.dataType.${getDataType(profile.uniqueCount, total)}`)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getBalanceLevel(truePercent: number): string {
  const balance = Math.abs(truePercent - 50);
  if (balance <= 10) return 'balanced';
  if (balance <= 20) return 'moderatelyImbalanced';
  if (balance <= 35) return 'imbalanced';
  return 'highlyImbalanced';
}

function calculateEntropy(p: number): number {
  if (p === 0 || p === 1) return 0;
  return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
}

function getInformationContent(entropy: number): string {
  if (entropy >= 0.95) return 'maximum';
  if (entropy >= 0.75) return 'high';
  if (entropy >= 0.5) return 'medium';
  return 'low';
}

function getPredictability(majorityPercent: number): string {
  if (majorityPercent >= 95) return 'highly_predictable';
  if (majorityPercent >= 70) return 'moderately_predictable';
  return 'random';
}

function getConsistency(uniqueCount: number, nullCount: number): string {
  if (uniqueCount === 2 && nullCount === 0) return 'high';
  if (uniqueCount <= 3 && nullCount < 10) return 'medium';
  return 'low';
}

function getDataType(uniqueCount: number, validCount: number): string {
  if (validCount === 0) return 'constant';
  if (uniqueCount === 2) return 'pure_boolean';
  if (uniqueCount <= 4) return 'boolean_variants';
  return 'mixed';
}
