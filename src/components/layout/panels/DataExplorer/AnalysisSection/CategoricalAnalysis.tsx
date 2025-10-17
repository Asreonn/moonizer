import { useMemo } from 'react';
import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import styles from './AnalysisSection.module.css';
import statStyles from './StatisticCard.module.css';

interface CategoricalAnalysisProps {
  data: any[];
  columnName: string;
  isIdUnique?: boolean;
}

export function CategoricalAnalysis({ data, isIdUnique = false }: CategoricalAnalysisProps) {
  const { t } = useLanguage();
  
  const analysis = useMemo(() => {
    const counts = data.reduce((acc, value) => {
      const key = String(value);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const entries = Object.entries(counts).sort(([, a], [, b]) => (b as number) - (a as number));
    const uniqueCount = entries.length;
    const totalCount = data.length;
    const uniqueRatio = uniqueCount / totalCount;
    
    // Top categories
    const topCategories = entries.slice(0, 10).map(([value, count]) => ({
      value,
      count: count as number,
      percentage: ((count as number) / totalCount) * 100
    }));
    
    // Statistics
    const mode = entries[0];
    const frequencies = entries.map(([, count]) => count as number);
    const maxFreq = Math.max(...frequencies);
    const minFreq = Math.min(...frequencies);
    const avgFreq = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
    
    // Diversity metrics
    const entropy = calculateEntropy(frequencies, totalCount);
    const giniIndex = calculateGiniIndex(frequencies, totalCount);
    
    return {
      uniqueCount,
      totalCount,
      uniqueRatio,
      topCategories,
      mode: mode ? { value: mode[0], count: mode[1] as number } : null,
      maxFreq,
      minFreq,
      avgFreq,
      entropy,
      giniIndex,
      isUniform: Math.abs(maxFreq - minFreq) <= 1
    };
  }, [data]);
  
  const getDiversityLevel = () => {
    if (analysis.uniqueRatio > 0.95) return { level: t('dataExplorer.analysis.categorical.diversity.veryHigh'), color: '#10b981' };
    if (analysis.uniqueRatio > 0.7) return { level: t('dataExplorer.analysis.categorical.diversity.high'), color: '#06b6d4' };
    if (analysis.uniqueRatio > 0.3) return { level: t('dataExplorer.analysis.categorical.diversity.medium'), color: '#f59e0b' };
    return { level: t('dataExplorer.analysis.categorical.diversity.low'), color: '#ef4444' };
  };
  
  const diversity = getDiversityLevel();
  
  return (
    <div className={styles.cardGrid}>
      {/* Basic Statistics */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{isIdUnique ? t('dataExplorer.analysis.idUnique.basic') : t('dataExplorer.analysis.categorical.basic')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.statGrid}>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.categorical.totalRecords')}</span>
              <span className={statStyles.statValue}>{analysis.totalCount.toLocaleString()}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.categorical.uniqueValues')}</span>
              <span className={statStyles.statValue}>{analysis.uniqueCount.toLocaleString()}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.categorical.uniqueRatio')}</span>
              <span className={statStyles.statValue}>{(analysis.uniqueRatio * 100).toFixed(1)}%</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.categorical.diversityLevel')}</span>
              <span className={statStyles.statValue} style={{ color: diversity.color }}>
                {diversity.level}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Frequency Statistics */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.categorical.frequency')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.statGrid}>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.categorical.mostCommon')}</span>
              <span className={statStyles.statValue}>
                {analysis.mode ? `${analysis.mode.value} (${analysis.mode.count})` : '—'}
              </span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.categorical.maxFreq')}</span>
              <span className={statStyles.statValue}>{analysis.maxFreq}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.categorical.minFreq')}</span>
              <span className={statStyles.statValue}>{analysis.minFreq}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.categorical.avgFreq')}</span>
              <span className={statStyles.statValue}>{analysis.avgFreq.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Categories */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.categorical.topCategories')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.categoryList}>
            {analysis.topCategories.slice(0, 8).map((category, index) => (
              <div key={index} className={statStyles.categoryItem}>
                <div className={statStyles.categoryHeader}>
                  <span className={statStyles.categoryValue}>{String(category.value)}</span>
                  <span className={statStyles.categoryCount}>{category.count}</span>
                </div>
                <div className={statStyles.categoryBar}>
                  <div 
                    className={statStyles.categoryBarFill}
                    style={{ 
                      width: `${category.percentage}%`,
                      backgroundColor: `hsl(${(index * 45) % 360}, 60%, 60%)`
                    }}
                  />
                </div>
                <span className={statStyles.categoryPercent}>{category.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function calculateEntropy(frequencies: number[], total: number): number {
  return frequencies.reduce((entropy, freq) => {
    const prob = freq / total;
    return entropy - (prob > 0 ? prob * Math.log2(prob) : 0);
  }, 0);
}

function calculateGiniIndex(frequencies: number[], total: number): number {
  const probabilities = frequencies.map(freq => freq / total);
  return 1 - probabilities.reduce((sum, prob) => sum + prob * prob, 0);
}