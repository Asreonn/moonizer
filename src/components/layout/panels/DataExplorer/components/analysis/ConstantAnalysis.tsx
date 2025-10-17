import { ColumnProfile } from '../../../../../../core/profiling/columnTypes';
import { AnalyticsTooltip } from '../../../../../ui/AnalyticsTooltip';
import styles from './ConstantAnalysis.module.css';

interface ConstantAnalysisProps {
  profile: ColumnProfile;
  t: any;
}

export function ConstantAnalysis({ profile, t }: ConstantAnalysisProps) {
  const constantValue = profile.sampleValues[0];
  const nonNullCount = profile.totalCount - profile.nullCount;

  return (
    <div className={styles.constantAnalysis}>
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>
          {t('dataExplorer.analysis.constant.title')}
        </h4>
        
        <div className={styles.constantInfo}>
          <div className={styles.description}>
            {t('dataExplorer.analysis.constant.description')}
          </div>
          
          <div className={styles.valueDisplay}>
            <AnalyticsTooltip metricKey="constantValue">
              <div className={styles.valueLabel}>
                {t('dataExplorer.analysis.constant.value')}:
              </div>
            </AnalyticsTooltip>
            <div className={styles.constantValue}>
              {constantValue !== null && constantValue !== undefined && constantValue !== '' 
                ? String(constantValue) 
                : '—'
              }
            </div>
          </div>
          
          <div className={styles.stats}>
            <div className={styles.stat}>
              <AnalyticsTooltip metricKey="recordCount">
                <span className={styles.statLabel}>{t('dataExplorer.analysis.constant.totalRecords')}</span>
              </AnalyticsTooltip>
              <span className={styles.statValue}>{profile.totalCount}</span>
            </div>
            <div className={styles.stat}>
              <AnalyticsTooltip metricKey="dataPoints">
                <span className={styles.statLabel}>{t('dataExplorer.analysis.constant.nonNullRecords')}</span>
              </AnalyticsTooltip>
              <span className={styles.statValue}>{nonNullCount}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>{t('dataExplorer.analysis.constant.nullRecords')}</span>
              <span className={styles.statValue}>{profile.nullCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}