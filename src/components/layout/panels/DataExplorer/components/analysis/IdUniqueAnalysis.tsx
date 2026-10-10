import { ColumnProfile } from '../../../../../../core/profiling/columnTypes';
import { AnalyticsTooltip } from '../../../../../ui/AnalyticsTooltip';
import styles from './IdUniqueAnalysis.module.css';

interface IdUniqueAnalysisProps {
  profile: ColumnProfile;
  t: any;
}

export function IdUniqueAnalysis({ profile, t }: IdUniqueAnalysisProps) {
  const stats = profile.idUniqueStats;
  const isActuallyUnique = profile.uniqueCount === (profile.totalCount - profile.nullCount);
  
  if (!stats) {
    return (
      <div className={styles.noData}>
        <p>{t('dataExplorer.analysis.idUnique.noData')}</p>
      </div>
    );
  }

  return (
    <div className={styles.idUniqueAnalysis}>
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>
          {t('dataExplorer.analysis.idUnique.basic')}
        </h4>
        
        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="dataPoints">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.idUnique.totalRecords')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{profile.totalCount}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="uniqueIdCount">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.idUnique.uniqueValues')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{profile.uniqueCount}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="uniqueness">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.idUnique.uniqueness')}</span>
            </AnalyticsTooltip>
            <span className={`${styles.statValue} ${isActuallyUnique ? styles.success : styles.warning}`}>
              {isActuallyUnique ? t('dataExplorer.analysis.idUnique.fullyUnique') : `${profile.uniquePercent.toFixed(1)}% ${t('dataExplorer.analysis.idUnique.unique')}`}
            </span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="duplicateCount">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.idUnique.duplicates')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>
              {stats.duplicateCount}
              {stats.duplicateCount > 0 && (
                <span className={styles.warning}>
                  ({((stats.duplicateCount / profile.totalCount) * 100).toFixed(1)}%)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Pattern Analysis */}
      {stats.pattern && (
        <div className={styles.analysisGroup}>
          <h4 className={styles.groupTitle}>{t('dataExplorer.analysis.idUnique.patternAnalysis')}</h4>
          <div className={styles.patternInfo}>
            <div className={styles.stat}>
              <AnalyticsTooltip metricKey="idPattern">
                <span className={styles.statLabel}>{t('dataExplorer.analysis.idUnique.detectedPattern')}</span>
              </AnalyticsTooltip>
              <span className={styles.statValue}>
                {t(`dataExplorer.analysis.idUnique.pattern.${stats.pattern}`)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sample Values */}
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>{t('dataExplorer.analysis.idUnique.sampleValues')}</h4>
        <div className={styles.sampleValues}>
          {profile.sampleValues.slice(0, 6).map((value, index) => (
            <div key={index} className={styles.sampleValue}>
              {String(value)}
            </div>
          ))}
          {profile.sampleValues.length > 6 && (
            <div className={styles.sampleMore}>
              +{profile.sampleValues.length - 6} {t('dataExplorer.analysis.idUnique.more')}
            </div>
          )}
        </div>
      </div>

      {/* Data Quality Assessment */}
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>{t('dataExplorer.analysis.idUnique.dataQuality')}</h4>
        <div className={styles.qualityAssessment}>
          <div className={`${styles.qualityItem} ${isActuallyUnique ? styles.success : styles.warning}`}>
            <div className={styles.qualityIcon}>
              {isActuallyUnique ? '✓' : '⚠'}
            </div>
            <div className={styles.qualityText}>
              {isActuallyUnique
                ? t('dataExplorer.analysis.idUnique.perfectUniqueness')
                : t('dataExplorer.analysis.idUnique.duplicatesDetected', { count: stats.duplicateCount })
              }
            </div>
          </div>

          <div className={`${styles.qualityItem} ${profile.nullCount === 0 ? styles.success : styles.warning}`}>
            <div className={styles.qualityIcon}>
              {profile.nullCount === 0 ? '✓' : '⚠'}
            </div>
            <div className={styles.qualityText}>
              {profile.nullCount === 0
                ? t('dataExplorer.analysis.idUnique.noNulls')
                : t('dataExplorer.analysis.idUnique.nullsPresent', { count: profile.nullCount })
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

