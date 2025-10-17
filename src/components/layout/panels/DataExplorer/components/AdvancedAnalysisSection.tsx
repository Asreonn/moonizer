import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import { ColumnProfile } from '../../../../../core/profiling/columnTypes';
import { AdvancedNumericAnalysis } from './advanced/AdvancedNumericAnalysis';
import { AdvancedCategoricalAnalysis } from './advanced/AdvancedCategoricalAnalysis';
import { AdvancedTextAnalysis } from './advanced/AdvancedTextAnalysis';
import { AdvancedDateTimeAnalysis } from './advanced/AdvancedDateTimeAnalysis';
import { AdvancedBooleanAnalysis } from './advanced/AdvancedBooleanAnalysis';
import { AdvancedConstantAnalysis } from './advanced/AdvancedConstantAnalysis';
import { AdvancedIdUniqueAnalysis } from './advanced/AdvancedIdUniqueAnalysis';
import styles from './AdvancedAnalysisSection.module.css';

interface AdvancedAnalysisSectionProps {
  columnProfile: ColumnProfile;
  columnData: any[];
}

export function AdvancedAnalysisSection({ columnProfile, columnData }: AdvancedAnalysisSectionProps) {
  const { t } = useLanguage();

  return (
    <div className={styles.advancedAnalysisSection}>
      <div className={styles.analysisHeader}>
        <h3 className={styles.sectionTitle}>
          {t('dataExplorer.advanced.title')}
        </h3>
        <div className={styles.infoIcon} title={t('dataExplorer.advanced.tooltip')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="m9,9 0.13,0.13a4.17,4.17 0 0 1,0,5.74L9,15"/>
            <circle cx="12" cy="12" r="1"/>
          </svg>
        </div>
      </div>

      <div className={styles.analysisContent}>
        {renderAdvancedTypeAnalysis(columnProfile, columnData, t)}
      </div>
    </div>
  );
}

function renderAdvancedTypeAnalysis(columnProfile: ColumnProfile, columnData: any[], t: any) {
  switch (columnProfile.type) {
    case 'numeric':
      return <AdvancedNumericAnalysis profile={columnProfile} data={columnData} t={t} />;
    
    case 'categorical':
      return <AdvancedCategoricalAnalysis profile={columnProfile} data={columnData} t={t} />;
    
    case 'text':
      return <AdvancedTextAnalysis profile={columnProfile} data={columnData} t={t} />;
    
    case 'datetime':
      return <AdvancedDateTimeAnalysis profile={columnProfile} data={columnData} t={t} />;
    
    case 'boolean':
      return <AdvancedBooleanAnalysis profile={columnProfile} data={columnData} t={t} />;
    
    case 'constant':
      return <AdvancedConstantAnalysis profile={columnProfile} data={columnData} t={t} />;
    
    case 'id_unique':
      return <AdvancedIdUniqueAnalysis profile={columnProfile} data={columnData} t={t} />;
    
    default:
      return (
        <div className={styles.fallbackAnalysis}>
          <div className={styles.basicStats}>
            <h4>{t('dataExplorer.advanced.basic')}</h4>
            <div className={styles.statGrid}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>{t('dataExplorer.advanced.records')}</span>
                <span className={styles.statValue}>{columnProfile.totalCount}</span>
                <div className={styles.statInfo} title={t('dataExplorer.advanced.recordsInfo')}>
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                    <path d="M8 4v4l3 3"/>
                  </svg>
                </div>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>{t('dataExplorer.advanced.uniqueValues')}</span>
                <span className={styles.statValue}>{columnProfile.uniqueCount}</span>
                <div className={styles.statInfo} title={t('dataExplorer.advanced.uniqueInfo')}>
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                    <path d="M8 4v4l3 3"/>
                  </svg>
                </div>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>{t('dataExplorer.advanced.nulls')}</span>
                <span className={styles.statValue}>{columnProfile.nullCount}</span>
                <div className={styles.statInfo} title={t('dataExplorer.advanced.nullsInfo')}>
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                    <path d="M8 4v4l3 3"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
  }
}