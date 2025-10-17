import { ColumnProfile } from '../../../../../../core/profiling/columnTypes';
import { AnalyticsTooltip } from '../../../../../ui/AnalyticsTooltip';
import styles from './CategoricalAnalysis.module.css';

interface CategoricalAnalysisProps {
  profile: ColumnProfile;
  t: any;
}

export function CategoricalAnalysis({ profile, t }: CategoricalAnalysisProps) {
  const stats = profile.categoricalStats;
  
  if (!stats) {
    return (
      <div className={styles.noData}>
        <p>{t('dataExplorer.analysis.noData')}</p>
      </div>
    );
  }

  // Calculate advanced metrics
  const frequencies = stats.topCategories.map(c => c.percent / 100);
  const shannonEntropy = calculateShannonEntropy(frequencies);
  const giniIndex = calculateGiniIndex(frequencies);
  const simpsonIndex = calculateSimpsonIndex(frequencies);
  const dominance = Math.max(...frequencies) * 100;
  const evenness = shannonEntropy / Math.log2(stats.classes);
  const singletons = stats.topCategories.filter(c => c.count === 1).length;
  const top3Share = stats.topCategories.slice(0, 3).reduce((sum, c) => sum + c.percent, 0);

  return (
    <div className={styles.categoricalAnalysis}>
      {/* Distribution Analysis */}
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>
          {t('dataExplorer.advanced.categorical.distributionAnalysis')}
        </h4>
        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="totalCategories">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.totalCategories')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{stats.classes}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="maxFrequency">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.maxFrequency')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>
              {stats.topCategories[0]?.count || 0} ({stats.topCategories[0]?.percent.toFixed(1) || 0}%)
            </span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="averageFrequency">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.avgFrequency')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>
              {(profile.totalCount / stats.classes).toFixed(1)}
            </span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="giniIndex">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.giniIndex')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{giniIndex.toFixed(3)}</span>
          </div>
        </div>
      </div>

      {/* Diversity Analysis */}
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>
          {t('dataExplorer.advanced.categorical.diversityAnalysis')}
        </h4>
        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="shannonEntropy">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.shannonEntropy')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{shannonEntropy.toFixed(3)} bits</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="simpsonIndex">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.simpsonIndex')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{simpsonIndex.toFixed(3)}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="evenness">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.evenness')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{(evenness * 100).toFixed(1)}%</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="dominance">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.dominance')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{dominance.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Pattern Analysis */}
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>
          {t('dataExplorer.advanced.categorical.patternAnalysis')}
        </h4>
        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="concentration">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.concentration')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>
              {t(`dataExplorer.advanced.categorical.concentration.${getConcentration(giniIndex)}`)}
            </span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="singletons">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.singletons')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{singletons}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="topCategoriesShare">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.topCategoriesShare')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{top3Share.toFixed(1)}%</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="diversityLevel">
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.diversity')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>
              {t(`dataExplorer.advanced.categorical.diversity.${getDiversityLevel(profile.uniquePercent)}`)}
            </span>
          </div>
        </div>
      </div>

      {/* Top Categories Table */}
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>
          {t('dataExplorer.advanced.categorical.topCategories')}
        </h4>
        <div className={styles.categoriesTable}>
          {stats.topCategories.slice(0, 8).map((category, index) => (
            <div key={index} className={styles.categoryRow}>
              <span className={styles.categoryRank}>{index + 1}</span>
              <span className={styles.categoryValue}>{category.value}</span>
              <span className={styles.categoryCount}>{category.count}</span>
              <span className={styles.categoryPercent}>{category.percent.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getDiversityLevel(uniquePercent: number): string {
  if (uniquePercent >= 80) return 'veryHigh';
  if (uniquePercent >= 60) return 'high';
  if (uniquePercent >= 30) return 'medium';
  return 'low';
}

function calculateShannonEntropy(frequencies: number[]): number {
  return -frequencies.reduce((sum, p) => {
    if (p === 0) return sum;
    return sum + p * Math.log2(p);
  }, 0);
}

function calculateGiniIndex(frequencies: number[]): number {
  const sorted = [...frequencies].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((acc, freq, i) => acc + (i + 1) * freq, 0);
  return (2 * sum) / (n * sorted.reduce((a, b) => a + b, 0)) - (n + 1) / n;
}

function calculateSimpsonIndex(frequencies: number[]): number {
  return 1 - frequencies.reduce((sum, p) => sum + p * p, 0);
}

function getConcentration(giniIndex: number): string {
  if (giniIndex >= 0.6) return 'high';
  if (giniIndex >= 0.3) return 'medium';
  return 'low';
}