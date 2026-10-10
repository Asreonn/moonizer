import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import { NumericAnalysis } from './NumericAnalysis';
import { CategoricalAnalysis } from './CategoricalAnalysis';
import { TextAnalysis } from './TextAnalysis';
import { DateTimeAnalysis } from './DateTimeAnalysis';
import { BooleanAnalysis } from './BooleanAnalysis';
import styles from './AnalysisSection.module.css';

interface AnalysisSectionProps {
  columnData: any[] | null;
  columnType: string | null;
  columnName: string;
}

export function AnalysisSection({ columnData, columnType, columnName }: AnalysisSectionProps) {
  const { t } = useLanguage();
  
  if (!columnData || columnData.length === 0) {
    return (
      <div className={styles.analysisSection}>
        <div className={styles.noData}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <div>{t('dataExplorer.analysis.noData')}</div>
        </div>
      </div>
    );
  }
  
  const renderTypeSpecificAnalysis = () => {
    switch (columnType) {
      case 'numeric':
        return <NumericAnalysis data={columnData} columnName={columnName} />;
      case 'categorical':
        return <CategoricalAnalysis data={columnData} columnName={columnName} />;
      case 'text':
        return <TextAnalysis data={columnData} columnName={columnName} />;
      case 'datetime':
        return <DateTimeAnalysis data={columnData} columnName={columnName} />;
      case 'boolean':
        return <BooleanAnalysis data={columnData} columnName={columnName} />;
      case 'id_unique':
        return <CategoricalAnalysis data={columnData} columnName={columnName} isIdUnique={true} />;
      case 'constant':
        return (
          <div className={styles.constantAnalysis}>
            <div className={styles.analysisCard}>
              <div className={styles.cardHeader}>
                <h3>{t('dataExplorer.analysis.constant.title')}</h3>
              </div>
              <div className={styles.cardContent}>
                <p>{t('dataExplorer.analysis.constant.description')}</p>
                <div className={styles.constantValue}>
                  <strong>{t('dataExplorer.analysis.constant.value')}:</strong> {String(columnData[0])}</div>
              </div>
            </div>
          </div>
        );
      default:
        return <CategoricalAnalysis data={columnData} columnName={columnName} />;
    }
  };
  
  return (
    <div className={styles.analysisSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          {t('dataExplorer.analysis.title')} - {columnName}
        </h2>
        <span className={styles.typeIndicator}>
          {t(`dataExplorer.types.${columnType}`)} • {columnData.length} {t('dataExplorer.analysis.records')}
        </span>
      </div>
      
      <div className={styles.analysisContent}>
        {renderTypeSpecificAnalysis()}
      </div>
    </div>
  );
}