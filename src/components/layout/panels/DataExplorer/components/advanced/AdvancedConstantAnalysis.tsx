import { ColumnProfile } from '../../../../../../core/profiling/columnTypes';
import styles from './AdvancedConstantAnalysis.module.css';

interface AdvancedConstantAnalysisProps {
  profile: ColumnProfile;
  data: any[];
  t: any;
}

export function AdvancedConstantAnalysis({ data, t }: AdvancedConstantAnalysisProps) {
  const analysis = analyzeConstantColumn(data);

  return (
    <div className={styles.advancedConstantAnalysis}>
      <div className={styles.analysisGrid}>
        {/* Constant Value Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.constant.valueAnalysis')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.constant.valueInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.constantValueDisplay}>
            <div className={styles.valueContainer}>
              <div className={styles.valueLabel}>{t('dataExplorer.advanced.constant.constantValue')}</div>
              <div className={styles.actualValue}>
                {analysis.displayValue}
              </div>
              <div className={styles.valueType}>
                {String(t(`dataExplorer.advanced.constant.types.${analysis.valueType}`))}
              </div>
            </div>
          </div>
        </div>

        {/* Data Quality Assessment */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.constant.dataQuality')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.constant.qualityInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.constant.totalRecords')}</span>
              <span className={styles.statValue}>{analysis.totalRecords}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.constant.constantRecords')}</span>
              <span className={styles.statValue}>{analysis.constantRecords}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.constant.nullRecords')}</span>
              <span className={styles.statValue}>{analysis.nullRecords}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.constant.purity')}</span>
              <span className={styles.statValue}>{(analysis.purity * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.constant.consistency')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.constant.consistency.${analysis.consistency}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.constant.dataIntegrity')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.constant.integrity.${analysis.integrity}`))}</span>
            </div>
          </div>
        </div>

        {/* Storage Implications */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.constant.storageImplications')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.constant.storageInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.constant.redundancyLevel')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.constant.redundancy.${analysis.redundancyLevel}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.constant.compressionPotential')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.constant.compression.${analysis.compressionPotential}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.constant.spaceSavings')}</span>
              <span className={styles.statValue}>{analysis.spaceSavings}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.constant.memoryFootprint')}</span>
              <span className={styles.statValue}>{String(analysis.memoryFootprint)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.constant.indexingBenefit')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.constant.indexing.${analysis.indexingBenefit}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.constant.queryOptimization')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.constant.optimization.${analysis.queryOptimization}`))}</span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.constant.recommendations')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.constant.recommendationsInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.recommendationsList}>
            {analysis.recommendations.map((rec, index) => (
              <div key={index} className={styles.recommendationItem}>
                <div className={styles.recommendationIcon}>
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0z"/>
                    <path d="M8 4a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3A.5.5 0 0 1 8 4zm.002 6a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1z"/>
                  </svg>
                </div>
                <div className={styles.recommendationText}>
                  {t(`dataExplorer.advanced.constant.recommendationTexts.${rec.key}`)}
                </div>
                <div className={styles.recommendationPriority}>
                  {String(t(`dataExplorer.advanced.constant.priority.${rec.priority}`))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Scenarios */}
      <div className={styles.scenariosSection}>
        <h4>{t('dataExplorer.advanced.constant.usageScenarios')}</h4>
        <div className={styles.scenariosList}>
          {analysis.usageScenarios.map((scenario, index) => (
            <div key={index} className={styles.scenarioItem}>
              <div className={styles.scenarioIcon}>
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2z"/>
                  <path d="M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
                  <path d="M8.256 14a4.474 4.474 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10c.26 0 .507.009.74.025.226-.341.496-.65.804-.918C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4s1 1 1 1h5.256z"/>
                </svg>
              </div>
              <div className={styles.scenarioContent}>
                <div className={styles.scenarioTitle}>
                  {String(t(`dataExplorer.advanced.constant.scenarios.${scenario.type}.title`))}
                </div>
                <div className={styles.scenarioDescription}>
                  {String(t(`dataExplorer.advanced.constant.scenarios.${scenario.type}.description`))}
                </div>
                <div className={styles.scenarioApplicability}>
                  {t('dataExplorer.advanced.constant.applicability')}: {String(t(`dataExplorer.advanced.constant.applicabilityLevels.${scenario.applicability}`))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function analyzeConstantColumn(data: any[]) {
  const nonNullValues = data.filter(v => v !== null && v !== undefined);
  const nullValues = data.filter(v => v === null || v === undefined);
  
  // Find the constant value
  const constantValue = nonNullValues.length > 0 ? nonNullValues[0] : null;
  const displayValue = constantValue === null ? 'NULL' : 
                       constantValue === '' ? '(empty string)' :
                       String(constantValue);
  
  // Determine value type
  let valueType = 'unknown';
  if (constantValue === null || constantValue === undefined) {
    valueType = 'null';
  } else if (typeof constantValue === 'boolean') {
    valueType = 'boolean';
  } else if (typeof constantValue === 'number') {
    valueType = 'numeric';
  } else if (constantValue === '') {
    valueType = 'empty_string';
  } else if (typeof constantValue === 'string') {
    if (constantValue.match(/^\d{4}-\d{2}-\d{2}/)) {
      valueType = 'date';
    } else if (constantValue.length <= 10) {
      valueType = 'short_string';
    } else {
      valueType = 'long_string';
    }
  }
  
  // Quality metrics
  const totalRecords = data.length;
  const constantRecords = nonNullValues.length;
  const nullRecords = nullValues.length;
  const purity = totalRecords > 0 ? constantRecords / totalRecords : 0;
  
  let consistency = 'perfect';
  if (purity < 1) consistency = nullRecords > 0 ? 'with_nulls' : 'mixed';
  
  let integrity = 'high';
  if (purity < 0.95) integrity = 'medium';
  if (purity < 0.8) integrity = 'low';
  
  // Storage analysis
  let redundancyLevel = 'maximum';
  let compressionPotential = 'excellent';
  const spaceSavings = Math.round((1 - (1 / totalRecords)) * 100);
  
  let memoryFootprint = 'minimal';
  if (typeof constantValue === 'string' && constantValue.length > 50) {
    memoryFootprint = 'moderate';
  }
  
  let indexingBenefit = 'high';
  let queryOptimization = 'excellent';
  
  if (constantValue === null) {
    indexingBenefit = 'low';
    queryOptimization = 'moderate';
  }
  
  // Generate recommendations
  const recommendations = [];
  
  if (purity === 1 && constantValue !== null) {
    recommendations.push({ key: 'remove_column', priority: 'high' });
    recommendations.push({ key: 'move_to_metadata', priority: 'medium' });
  }
  
  if (nullRecords > 0) {
    recommendations.push({ key: 'handle_nulls', priority: 'medium' });
  }
  
  if (constantValue === '') {
    recommendations.push({ key: 'clarify_empty_string', priority: 'low' });
  }
  
  if (totalRecords > 1000) {
    recommendations.push({ key: 'compression_opportunity', priority: 'high' });
  }
  
  recommendations.push({ key: 'document_purpose', priority: 'low' });
  
  // Usage scenarios
  const usageScenarios = [
    { type: 'configuration_flag', applicability: 'high' },
    { type: 'version_identifier', applicability: 'medium' },
    { type: 'default_value', applicability: 'high' },
    { type: 'placeholder_column', applicability: 'low' },
    { type: 'regulatory_requirement', applicability: 'medium' }
  ];
  
  return {
    displayValue,
    valueType,
    totalRecords,
    constantRecords,
    nullRecords,
    purity,
    consistency,
    integrity,
    redundancyLevel,
    compressionPotential,
    spaceSavings,
    memoryFootprint,
    indexingBenefit,
    queryOptimization,
    recommendations,
    usageScenarios
  };
}