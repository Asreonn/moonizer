import { ColumnProfile } from '../../../../../../core/profiling/columnTypes';
import styles from './AdvancedCategoricalAnalysis.module.css';

interface AdvancedCategoricalAnalysisProps {
  profile: ColumnProfile;
  data: any[];
  t: any;
}

export function AdvancedCategoricalAnalysis({ data, t }: AdvancedCategoricalAnalysisProps) {
  const validCategories = data.filter(v => v !== null && v !== undefined && v !== '');
  
  if (validCategories.length === 0) {
    return (
      <div className={styles.noDataState}>
        <div className={styles.noDataIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
          </svg>
        </div>
        <p>{t('dataExplorer.advanced.categorical.noValidData')}</p>
      </div>
    );
  }

  const distribution = calculateCategoryDistribution(validCategories);
  const diversity = analyzeDiversity(distribution);
  const patterns = analyzePatterns(validCategories);
  const quality = assessDataQuality(validCategories);

  return (
    <div className={styles.advancedCategoricalAnalysis}>
      <div className={styles.analysisGrid}>
        {/* Distribution Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.categorical.distributionAnalysis')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.categorical.distributionInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.totalCategories')}</span>
              <span className={styles.statValue}>{distribution.uniqueCount}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.mostFrequent')}</span>
              <span className={styles.statValue}>{distribution.mostFrequent?.category || 'N/A'}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.maxFrequency')}</span>
              <span className={styles.statValue}>{distribution.mostFrequent?.count || 0}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.minFrequency')}</span>
              <span className={styles.statValue}>{distribution.leastFrequent?.count || 0}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.avgFrequency')}</span>
              <span className={styles.statValue}>{distribution.averageFrequency.toFixed(1)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.giniIndex')}</span>
              <span className={styles.statValue}>{distribution.giniIndex.toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Diversity Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.categorical.diversityAnalysis')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.categorical.diversityInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.shannonEntropy')}</span>
              <span className={styles.statValue}>{diversity.shannonEntropy.toFixed(3)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.simpsonIndex')}</span>
              <span className={styles.statValue}>{diversity.simpsonIndex.toFixed(3)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.evenness')}</span>
              <span className={styles.statValue}>{diversity.evenness.toFixed(3)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.dominance')}</span>
              <span className={styles.statValue}>{diversity.dominance.toFixed(3)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.diversityLevel')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.categorical.diversity.${diversity.level}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.concentration')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.categorical.concentration.${diversity.concentration}`))}</span>
            </div>
          </div>
        </div>

        {/* Pattern Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.categorical.patternAnalysis')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.categorical.patternInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.singletons')}</span>
              <span className={styles.statValue}>{patterns.singletons}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.powerLaw')}</span>
              <span className={styles.statValue}>{patterns.powerLaw ? t('dataExplorer.advanced.categorical.yes') : t('dataExplorer.advanced.categorical.no')}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.topCategoriesShare')}</span>
              <span className={styles.statValue}>{(patterns.topCategoriesShare * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.tailLength')}</span>
              <span className={styles.statValue}>{patterns.tailLength}</span>
            </div>
          </div>
        </div>

        {/* Data Quality Assessment */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.categorical.dataQualityAssessment')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.categorical.qualityInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.inconsistencies')}</span>
              <span className={styles.statValue}>{quality.inconsistencies}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.potentialDuplicates')}</span>
              <span className={styles.statValue}>{quality.potentialDuplicates}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.averageLength')}</span>
              <span className={styles.statValue}>{quality.averageLength.toFixed(1)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.categorical.standardization')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.categorical.standardization.${quality.standardization}`))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div className={styles.topCategoriesSection}>
        <h4>{t('dataExplorer.advanced.categorical.topCategories')}</h4>
        <div className={styles.categoryList}>
          {distribution.topCategories.slice(0, 10).map((cat, index) => (
            <div key={index} className={styles.categoryItem}>
              <div className={styles.categoryRank}>#{index + 1}</div>
              <div className={styles.categoryName}>{cat.category}</div>
              <div className={styles.categoryCount}>{cat.count}</div>
              <div className={styles.categoryPercentage}>
                {((cat.count / validCategories.length) * 100).toFixed(1)}%
              </div>
              <div className={styles.categoryBar}>
                <div 
                  className={styles.categoryBarFill}
                  style={{ width: `${(cat.count / distribution.mostFrequent!.count) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function calculateCategoryDistribution(categories: any[]) {
  const frequency: Record<string, number> = {};
  categories.forEach(cat => {
    const key = String(cat);
    frequency[key] = (frequency[key] || 0) + 1;
  });

  const entries = Object.entries(frequency).map(([category, count]) => ({ category, count }));
  const sorted = entries.sort((a, b) => b.count - a.count);
  
  const mostFrequent = sorted[0];
  const leastFrequent = sorted[sorted.length - 1];
  const averageFrequency = categories.length / sorted.length;
  
  // Calculate Gini index for inequality measure
  const sortedCounts = sorted.map(entry => entry.count).sort((a, b) => a - b);
  const n = sortedCounts.length;
  const mean = averageFrequency;
  const giniIndex = sortedCounts.reduce((sum, count, i) => {
    return sum + (2 * (i + 1) - n - 1) * count;
  }, 0) / (n * n * mean);

  return {
    uniqueCount: sorted.length,
    topCategories: sorted,
    mostFrequent,
    leastFrequent,
    averageFrequency,
    giniIndex: Math.abs(giniIndex)
  };
}

function analyzeDiversity(distribution: any) {
  const total = distribution.topCategories.reduce((sum: number, cat: any) => sum + cat.count, 0);
  const probabilities = distribution.topCategories.map((cat: any) => cat.count / total);
  
  // Shannon entropy
  const shannonEntropy = -probabilities.reduce((sum: number, p: number) => {
    return sum + (p > 0 ? p * Math.log2(p) : 0);
  }, 0);
  
  // Simpson's diversity index
  const simpsonIndex = 1 - probabilities.reduce((sum: number, p: number) => sum + p * p, 0);
  
  // Evenness (Shannon entropy / log(number of categories))
  const maxEntropy = Math.log2(distribution.uniqueCount);
  const evenness = maxEntropy > 0 ? shannonEntropy / maxEntropy : 0;
  
  // Dominance (most frequent category proportion)
  const dominance = probabilities[0] || 0;
  
  // Diversity level classification
  let level = 'low';
  if (shannonEntropy > 3) level = 'veryHigh';
  else if (shannonEntropy > 2) level = 'high';
  else if (shannonEntropy > 1) level = 'medium';
  
  // Concentration level
  let concentration = 'high';
  if (dominance < 0.3) concentration = 'low';
  else if (dominance < 0.6) concentration = 'medium';
  
  return {
    shannonEntropy,
    simpsonIndex,
    evenness,
    dominance,
    level,
    concentration
  };
}

function analyzePatterns(categories: any[]) {
  const frequency: Record<string, number> = {};
  categories.forEach(cat => {
    const key = String(cat);
    frequency[key] = (frequency[key] || 0) + 1;
  });

  const counts = Object.values(frequency);
  const singletons = counts.filter(count => count === 1).length;
  
  // Power law detection (rough approximation)
  const sorted = counts.sort((a, b) => b - a);
  const top10Percent = Math.max(1, Math.floor(sorted.length * 0.1));
  const topSum = sorted.slice(0, top10Percent).reduce((sum, count) => sum + count, 0);
  const topCategoriesShare = topSum / categories.length;
  const powerLaw = topCategoriesShare > 0.5; // Simple heuristic
  
  // Tail length (categories with frequency <= 5% of max)
  const maxFreq = Math.max(...counts);
  const tailThreshold = maxFreq * 0.05;
  const tailLength = counts.filter(count => count <= tailThreshold).length;
  
  return {
    singletons,
    powerLaw,
    topCategoriesShare,
    tailLength
  };
}

function assessDataQuality(categories: any[]) {
  const strings = categories.map(cat => String(cat));
  
  // Case inconsistencies
  const lowerCased = strings.map(s => s.toLowerCase());
  const uniqueLower = new Set(lowerCased).size;
  const inconsistencies = strings.length - uniqueLower;
  
  // Potential duplicates (similar strings)
  const trimmed = strings.map(s => s.trim());
  const uniqueTrimmed = new Set(trimmed).size;
  const potentialDuplicates = strings.length - uniqueTrimmed;
  
  // Average length
  const averageLength = strings.reduce((sum, s) => sum + s.length, 0) / strings.length;
  
  // Standardization assessment
  let standardization = 'good';
  if (inconsistencies > strings.length * 0.1 || potentialDuplicates > strings.length * 0.05) {
    standardization = 'poor';
  } else if (inconsistencies > strings.length * 0.05 || potentialDuplicates > strings.length * 0.02) {
    standardization = 'fair';
  }
  
  return {
    inconsistencies,
    potentialDuplicates,
    averageLength,
    standardization
  };
}