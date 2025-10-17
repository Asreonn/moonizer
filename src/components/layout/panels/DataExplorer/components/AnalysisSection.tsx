import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import { ColumnProfile } from '../../../../../core/profiling/columnTypes';
import { NumericAnalysis } from './analysis/NumericAnalysis';
import { CategoricalAnalysis } from './analysis/CategoricalAnalysis';
import { TextAnalysis } from './analysis/TextAnalysis';
import { DateTimeAnalysis } from './analysis/DateTimeAnalysis';
import { BooleanAnalysis } from './analysis/BooleanAnalysis';
import { ConstantAnalysis } from './analysis/ConstantAnalysis';
import { IdUniqueAnalysis } from './analysis/IdUniqueAnalysis';
import styles from './AnalysisSection.module.css';

interface AnalysisSectionProps {
  columnProfile: ColumnProfile;
}

export function AnalysisSection({ columnProfile }: AnalysisSectionProps) {
  const { t } = useLanguage();

  return (
    <div className={styles.analysisSection}>
      <div className={styles.analysisHeader}>
        <h3 className={styles.sectionTitle}>
          {t('dataExplorer.analysis.title')}
        </h3>
      </div>

      <div className={styles.analysisContent}>
        {renderTypeSpecificAnalysis(columnProfile, t)}
      </div>
    </div>
  );
}

function renderTypeSpecificAnalysis(columnProfile: ColumnProfile, t: any) {
  switch (columnProfile.type) {
    case 'numeric':
      return <NumericAnalysis profile={columnProfile} t={t} />;
    
    case 'categorical':
      return <CategoricalAnalysis profile={columnProfile} t={t} />;
    
    case 'text':
      return <TextAnalysis profile={columnProfile} t={t} />;
    
    case 'datetime':
      return <DateTimeAnalysis profile={columnProfile} t={t} />;
    
    case 'boolean':
      return <BooleanAnalysis profile={columnProfile} t={t} />;
    
    case 'constant':
      return <ConstantAnalysis profile={columnProfile} t={t} />;
    
    case 'id_unique':
      return <IdUniqueAnalysis profile={columnProfile} t={t} />;
    
    default:
      return (
        <div className={styles.fallbackAnalysis}>
          <div className={styles.basicStats}>
            <h4>{t('dataExplorer.analysis.basic')}</h4>
            <div className={styles.statGrid}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>{t('dataExplorer.analysis.records')}</span>
                <span className={styles.statValue}>{columnProfile.totalCount}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>{t('dataExplorer.analysis.uniqueValues')}</span>
                <span className={styles.statValue}>{columnProfile.uniqueCount}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>{t('dataExplorer.analysis.nulls')}</span>
                <span className={styles.statValue}>{columnProfile.nullCount}</span>
              </div>
            </div>
          </div>
        </div>
      );
  }
}