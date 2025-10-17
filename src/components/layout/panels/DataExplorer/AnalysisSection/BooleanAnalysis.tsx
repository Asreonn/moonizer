import { useMemo } from 'react';
import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import styles from './AnalysisSection.module.css';
import statStyles from './StatisticCard.module.css';

interface BooleanAnalysisProps {
  data: any[];
  columnName: string;
}

export function BooleanAnalysis({ data }: BooleanAnalysisProps) {
  const { t } = useLanguage();
  
  const analysis = useMemo(() => {
    if (data.length === 0) return null;
    
    // Categorize values into true/false/other
    const trueValues = new Set(['true', '1', 'yes', 'y', 'on', 'active', 'enabled']);
    const falseValues = new Set(['false', '0', 'no', 'n', 'off', 'inactive', 'disabled']);
    
    let trueCount = 0;
    let falseCount = 0;
    let otherCount = 0;
    const valueCounts: Record<string, number> = {};
    
    data.forEach(value => {
      const strValue = String(value).toLowerCase().trim();
      valueCounts[strValue] = (valueCounts[strValue] || 0) + 1;
      
      if (trueValues.has(strValue)) {
        trueCount++;
      } else if (falseValues.has(strValue)) {
        falseCount++;
      } else {
        otherCount++;
      }
    });
    
    const totalCount = data.length;
    const truePercentage = (trueCount / totalCount) * 100;
    const falsePercentage = (falseCount / totalCount) * 100;
    const otherPercentage = (otherCount / totalCount) * 100;
    
    // Calculate ratio and balance
    const ratio = falseCount > 0 ? trueCount / falseCount : Infinity;
    const balance = Math.min(truePercentage, falsePercentage) / Math.max(truePercentage, falsePercentage);
    
    // Most/least common values
    const sortedValues = Object.entries(valueCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([value, count]) => ({
        value,
        count,
        percentage: (count / totalCount) * 100,
        category: trueValues.has(value.toLowerCase()) ? 'true' : 
                 falseValues.has(value.toLowerCase()) ? 'false' : 'other'
      }));
    
    // Determine if this is a clean boolean column
    const isCleanBoolean = otherCount === 0 && sortedValues.length === 2;
    const dominantValue = sortedValues[0];
    const minorityValue = sortedValues[1];
    
    return {
      totalCount,
      trueCount,
      falseCount,
      otherCount,
      truePercentage,
      falsePercentage,
      otherPercentage,
      ratio,
      balance,
      sortedValues: sortedValues.slice(0, 10),
      isCleanBoolean,
      dominantValue,
      minorityValue,
      uniqueValueCount: sortedValues.length
    };
  }, [data]);
  
  if (!analysis) {
    return (
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.boolean.title')}</h3>
        </div>
        <div className={styles.cardContent}>
          <p>{t('dataExplorer.analysis.boolean.noData')}</p>
        </div>
      </div>
    );
  }
  
  const getBalanceDescription = () => {
    if (analysis.balance > 0.8) return { text: t('dataExplorer.analysis.boolean.wellBalanced'), color: '#10b981' };
    if (analysis.balance > 0.5) return { text: t('dataExplorer.analysis.boolean.moderatelyBalanced'), color: '#f59e0b' };
    return { text: t('dataExplorer.analysis.boolean.imbalanced'), color: '#ef4444' };
  };
  
  const balanceInfo = getBalanceDescription();
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'true': return '#10b981';
      case 'false': return '#ef4444';
      case 'other': return '#6b7280';
      default: return '#8b5cf6';
    }
  };
  
  return (
    <div className={styles.cardGrid}>
      {/* Basic Statistics */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.boolean.basic')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.statGrid}>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.boolean.totalRecords')}</span>
              <span className={statStyles.statValue}>{analysis.totalCount.toLocaleString()}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.boolean.trueValues')}</span>
              <span className={statStyles.statValue} style={{ color: '#10b981' }}>
                {analysis.trueCount} ({analysis.truePercentage.toFixed(1)}%)
              </span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.boolean.falseValues')}</span>
              <span className={statStyles.statValue} style={{ color: '#ef4444' }}>
                {analysis.falseCount} ({analysis.falsePercentage.toFixed(1)}%)
              </span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.boolean.otherValues')}</span>
              <span className={statStyles.statValue} style={{ color: '#6b7280' }}>
                {analysis.otherCount} ({analysis.otherPercentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Distribution Analysis */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.boolean.distribution')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.statGrid}>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.boolean.ratio')}</span>
              <span className={statStyles.statValue}>
                {analysis.ratio === Infinity ? '∞:1' : `${analysis.ratio.toFixed(2)}:1`}
              </span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.boolean.balance')}</span>
              <span className={statStyles.statValue} style={{ color: balanceInfo.color }}>
                {balanceInfo.text}
              </span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.boolean.dataQuality')}</span>
              <span className={statStyles.statValue} style={{ color: analysis.isCleanBoolean ? '#10b981' : '#f59e0b' }}>
                {analysis.isCleanBoolean ? t('dataExplorer.analysis.boolean.clean') : t('dataExplorer.analysis.boolean.mixed')}
              </span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.boolean.uniqueValues')}</span>
              <span className={statStyles.statValue}>{analysis.uniqueValueCount}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Value Distribution */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.boolean.valueDistribution')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.categoryList}>
            {analysis.sortedValues.slice(0, 8).map((item, index) => (
              <div key={index} className={statStyles.categoryItem}>
                <div className={statStyles.categoryHeader}>
                  <span className={statStyles.categoryValue}>
                    {item.value} 
                    <span style={{ 
                      color: getCategoryColor(item.category),
                      fontSize: 'var(--font-size-xs)',
                      marginLeft: 'var(--space-xs)',
                      fontWeight: 500
                    }}>
                      ({item.category})
                    </span>
                  </span>
                  <span className={statStyles.categoryCount}>{item.count}</span>
                </div>
                <div className={statStyles.categoryBar}>
                  <div 
                    className={statStyles.categoryBarFill}
                    style={{ 
                      width: `${item.percentage}%`,
                      backgroundColor: getCategoryColor(item.category)
                    }}
                  />
                </div>
                <span className={statStyles.categoryPercent}>{item.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Summary Insights */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.boolean.insights')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={styles.insightsList}>
            {analysis.dominantValue && (
              <div className={styles.insight}>
                <span className={styles.insightLabel}>{t('dataExplorer.analysis.boolean.mostCommon')}:</span>
                <span className={styles.insightValue}>
                  {analysis.dominantValue.value} ({analysis.dominantValue.percentage.toFixed(1)}%)
                </span>
              </div>
            )}
            {analysis.minorityValue && (
              <div className={styles.insight}>
                <span className={styles.insightLabel}>{t('dataExplorer.analysis.boolean.leastCommon')}:</span>
                <span className={styles.insightValue}>
                  {analysis.minorityValue.value} ({analysis.minorityValue.percentage.toFixed(1)}%)
                </span>
              </div>
            )}
            {analysis.otherCount > 0 && (
              <div className={styles.insight}>
                <span className={styles.insightLabel}>{t('dataExplorer.analysis.boolean.recommendation')}:</span>
                <span className={styles.insightValue}>
                  {t('dataExplorer.analysis.boolean.considerCleaning')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}