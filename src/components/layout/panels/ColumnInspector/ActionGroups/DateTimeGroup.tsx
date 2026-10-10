import { useState } from 'react';
import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import { ColumnProfile } from '../../../../../core/profiling/columnTypes';
import { useDatasetStore } from '../../../../../state/useDatasetStore';
import { useColumnEditorStore } from '../../../../../state/useColumnEditorStore';
import { useToast } from '../../../../common/Toast/ToastProvider';
import styles from '../ActionGroups.module.css';

interface DateTimeGroupProps {
  profile: ColumnProfile;
}

export function DateTimeGroup({ profile }: DateTimeGroupProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Form states for different operations
  const [formatForm, setFormatForm] = useState({
    targetFormat: 'YYYY-MM-DD',
    sourceFormat: ''
  });
  
  const [extractForm, setExtractForm] = useState({
    component: 'year',
    newColumnName: ''
  });
  
  const [arithmeticForm, setArithmeticForm] = useState({
    operation: 'add',
    amount: 1,
    unit: 'days'
  });
  
  
  const [timezoneForm, setTimezoneForm] = useState({
    fromTimezone: '',
    toTimezone: 'UTC'
  });
  
  const [combineForm, setCombineForm] = useState({
    dateColumn: '',
    timeColumn: '',
    targetColumn: `${profile.name}_combined`
  });
  
  const [splitForm, setSplitForm] = useState({
    dateColumn: '',
    timeColumn: ''
  });
  
  const { applyDatasetTransform, datasets, activeDatasetId } = useDatasetStore();
  const { addOperationWithSnapshot } = useColumnEditorStore();
  const { showToast } = useToast();

  const activeDataset = datasets.find(d => d.id === activeDatasetId);
  const availableColumns = activeDataset?.columnNames.filter(col => col !== profile.name) || [];

  const handleApplyAction = async (actionKey: string, params: any = {}) => {
    try {
      const { datasets, activeDatasetId } = useDatasetStore.getState();
      const activeDataset = datasets.find(d => d.id === activeDatasetId);
      
      if (!activeDataset) {
        showToast({
          message: t('inspector.actionGroups.general.generalError'),
          type: 'error',
          duration: 4000
        });
        return;
      }

      const beforeSnapshot = {
        data: JSON.parse(JSON.stringify(activeDataset.data)),
        columnNames: [...activeDataset.columnNames]
      };
      
      let operationData: any;
      let actionDescription: string;
      
      switch (actionKey) {
        case 'datetime_format':
          operationData = {
            type: 'datetime_format',
            columnName: profile.name,
            parameters: params,
            description: t('inspector.actionGroups.datetime.format.convert.title')
          };
          actionDescription = t('inspector.operation.applied', { 
            operation: t('inspector.actionGroups.datetime.format.convert.title'), 
            column: profile.name 
          });
          break;
          
        case 'datetime_extract':
          operationData = {
            type: 'datetime_extract',
            columnName: profile.name,
            parameters: params,
            description: t(`inspector.actionGroups.datetime.extract.components.${params.component}.title`)
          };
          actionDescription = t('inspector.operation.applied', { 
            operation: t(`inspector.actionGroups.datetime.extract.components.${params.component}.title`), 
            column: profile.name 
          });
          break;
          
        case 'datetime_arithmetic':
          operationData = {
            type: 'datetime_arithmetic',
            columnName: profile.name,
            parameters: params,
            description: t('inspector.actionGroups.datetime.arithmetic.title')
          };
          actionDescription = t('inspector.operation.applied', { 
            operation: t('inspector.actionGroups.datetime.arithmetic.title'), 
            column: profile.name 
          });
          break;
          
        case 'datetime_truncate':
          operationData = {
            type: 'datetime_truncate',
            columnName: profile.name,
            parameters: params,
            description: t(`inspector.actionGroups.datetime.truncate.units.${params.unit}.title`)
          };
          actionDescription = t('inspector.operation.applied', { 
            operation: t(`inspector.actionGroups.datetime.truncate.units.${params.unit}.title`), 
            column: profile.name 
          });
          break;
          
        case 'datetime_timezone':
          operationData = {
            type: 'datetime_timezone',
            columnName: profile.name,
            parameters: params,
            description: t('inspector.actionGroups.datetime.timezone.convert.title')
          };
          actionDescription = t('inspector.operation.applied', { 
            operation: t('inspector.actionGroups.datetime.timezone.convert.title'), 
            column: profile.name 
          });
          break;
          
        case 'datetime_combine':
          operationData = {
            type: 'datetime_combine',
            columnName: profile.name,
            parameters: params,
            description: t('inspector.actionGroups.datetime.combine.title')
          };
          actionDescription = t('inspector.operation.applied', { 
            operation: t('inspector.actionGroups.datetime.combine.title'), 
            column: profile.name 
          });
          break;
          
        case 'datetime_split':
          operationData = {
            type: 'datetime_split',
            columnName: profile.name,
            parameters: params,
            description: t('inspector.actionGroups.datetime.split.title')
          };
          actionDescription = t('inspector.operation.applied', { 
            operation: t('inspector.actionGroups.datetime.split.title'), 
            column: profile.name 
          });
          break;
          
        default:
          showToast({
            message: t('inspector.actionGroups.general.actionNotImplemented', { actionKey }),
            type: 'error',
            duration: 3000
          });
          return;
      }
      
      const result = await applyDatasetTransform({
        id: `${actionKey}_${Date.now()}`,
        ...operationData,
        timestamp: new Date()
      });
      
      if (result.success) {
        const updatedDataset = useDatasetStore.getState().datasets.find(d => d.id === activeDatasetId);
        const afterSnapshot = updatedDataset ? {
          data: JSON.parse(JSON.stringify(updatedDataset.data)),
          columnNames: [...updatedDataset.columnNames]
        } : null;

        if (afterSnapshot) {
          addOperationWithSnapshot(
            {
              columnName: profile.name,
              type: operationData.type,
              description: operationData.description,
              parameters: operationData.parameters
            },
            beforeSnapshot.data,
            beforeSnapshot.columnNames,
            afterSnapshot.data,
            afterSnapshot.columnNames
          );
        }
        
        showToast({
          message: actionDescription,
          type: 'success',
          duration: 5000,
          action: {
            label: t('inspector.editor.header.undo'),
            onClick: () => {}
          }
        });
        
        console.log(`${actionKey} applied successfully to column: ${profile.name}`);
      } else {
        console.error('Operation failed:', result.error);
        showToast({
          message: t('inspector.actionGroups.general.operationFailed', { actionKey, error: result.error }),
          type: 'error',
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Failed to apply action:', error);
      showToast({
        message: t('inspector.actionGroups.general.generalError'),
        type: 'error',
        duration: 4000
      });
    }
  };

  const renderFormatConversionSection = () => {
    const formatPresets = [
      { key: 'YYYY-MM-DD', label: t('inspector.actionGroups.datetime.format.presets.iso') },
      { key: 'DD/MM/YYYY', label: t('inspector.actionGroups.datetime.format.presets.european') },
      { key: 'MM/DD/YYYY', label: t('inspector.actionGroups.datetime.format.presets.american') },
      { key: 'DD.MM.YYYY', label: t('inspector.actionGroups.datetime.format.presets.german') },
      { key: 'YYYYMMDD', label: t('inspector.actionGroups.datetime.format.presets.compact') }
    ];

    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actionGroups.datetime.format.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actionGroups.datetime.format.description')}</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actionGroups.datetime.format.convert.targetFormat')}
          </label>
          <select
            className={styles.formSelect}
            value={formatForm.targetFormat}
            onChange={(e) => setFormatForm(prev => ({ ...prev, targetFormat: e.target.value }))}
          >
            {formatPresets.map(preset => (
              <option key={preset.key} value={preset.key}>{preset.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actionGroups.datetime.format.convert.sourceFormat')}
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={formatForm.sourceFormat}
            onChange={(e) => setFormatForm(prev => ({ ...prev, sourceFormat: e.target.value }))}
            placeholder={t('inspector.actionGroups.datetime.format.convert.formatPlaceholder')}
          />
          <div className={styles.helpText}>
            {t('inspector.actionGroups.datetime.format.convert.examples')}
          </div>
        </div>

        <div className={styles.actionControls}>
          <button 
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => handleApplyAction('datetime_format', formatForm)}
          >
            {t('inspector.actionGroups.datetime.format.convert.apply')}
          </button>
        </div>
      </div>
    );
  };

  const renderExtractComponentsSection = () => {
    const components = ['year', 'month', 'day', 'weekday', 'quarter', 'hour', 'minute', 'second', 'time', 'date'];

    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actionGroups.datetime.extract.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actionGroups.datetime.extract.description')}</span>
        </div>

        <div className={styles.optionsGrid}>
          {components.map(component => (
            <button
              key={component}
              className={`${styles.actionButton} ${styles.secondary}`}
              onClick={() => handleApplyAction('datetime_extract', { 
                component, 
                newColumnName: extractForm.newColumnName || `${profile.name}_${component}` 
              })}
              title={t(`inspector.actionGroups.datetime.extract.components.${component}.description`)}
            >
              {t(`inspector.actionGroups.datetime.extract.components.${component}.title`)}
            </button>
          ))}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actionGroups.datetime.extract.newColumnName')}
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={extractForm.newColumnName}
            onChange={(e) => setExtractForm(prev => ({ ...prev, newColumnName: e.target.value }))}
            placeholder={t('inspector.actionGroups.datetime.extract.newColumnPlaceholder')}
          />
        </div>
      </div>
    );
  };

  const renderArithmeticSection = () => {
    const units = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];

    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actionGroups.datetime.arithmetic.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actionGroups.datetime.arithmetic.description')}</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actionGroups.datetime.arithmetic.operation')}
          </label>
          <select
            className={styles.formSelect}
            value={arithmeticForm.operation}
            onChange={(e) => setArithmeticForm(prev => ({ ...prev, operation: e.target.value }))}
          >
            <option value="add">{t('inspector.actionGroups.datetime.arithmetic.add')}</option>
            <option value="subtract">{t('inspector.actionGroups.datetime.arithmetic.subtract')}</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actionGroups.datetime.arithmetic.amount')}
          </label>
          <input
            type="number"
            className={styles.formInput}
            value={arithmeticForm.amount}
            onChange={(e) => setArithmeticForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 1 }))}
            min="1"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actionGroups.datetime.arithmetic.unit')}
          </label>
          <select
            className={styles.formSelect}
            value={arithmeticForm.unit}
            onChange={(e) => setArithmeticForm(prev => ({ ...prev, unit: e.target.value }))}
          >
            {units.map(unit => (
              <option key={unit} value={unit}>
                {t(`inspector.actionGroups.datetime.arithmetic.units.${unit}`)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.actionControls}>
          <button 
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => handleApplyAction('datetime_arithmetic', {
              amount: arithmeticForm.operation === 'subtract' ? -arithmeticForm.amount : arithmeticForm.amount,
              unit: arithmeticForm.unit
            })}
          >
            {t('inspector.actionGroups.datetime.arithmetic.apply')}
          </button>
        </div>
      </div>
    );
  };

  const renderTruncateSection = () => {
    const units = ['year', 'month', 'day', 'hour', 'minute'];

    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actionGroups.datetime.truncate.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actionGroups.datetime.truncate.description')}</span>
        </div>

        <div className={styles.optionsGrid}>
          {units.map(unit => (
            <button
              key={unit}
              className={`${styles.actionButton} ${styles.secondary}`}
              onClick={() => handleApplyAction('datetime_truncate', { unit })}
              title={t(`inspector.actionGroups.datetime.truncate.units.${unit}.description`)}
            >
              {t(`inspector.actionGroups.datetime.truncate.units.${unit}.title`)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderTimezoneSection = () => {
    const timezonePresets = [
      { key: 'UTC', label: t('inspector.actionGroups.datetime.timezone.presets.utc') },
      { key: 'local', label: t('inspector.actionGroups.datetime.timezone.presets.local') },
      { key: 'EST', label: t('inspector.actionGroups.datetime.timezone.presets.est') },
      { key: 'PST', label: t('inspector.actionGroups.datetime.timezone.presets.pst') },
      { key: 'GMT', label: t('inspector.actionGroups.datetime.timezone.presets.gmt') }
    ];

    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actionGroups.datetime.timezone.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actionGroups.datetime.timezone.description')}</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actionGroups.datetime.timezone.convert.toTimezone')}
          </label>
          <select
            className={styles.formSelect}
            value={timezoneForm.toTimezone}
            onChange={(e) => setTimezoneForm(prev => ({ ...prev, toTimezone: e.target.value }))}
          >
            {timezonePresets.map(preset => (
              <option key={preset.key} value={preset.key}>{preset.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.actionControls}>
          <button 
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => handleApplyAction('datetime_timezone', timezoneForm)}
          >
            {t('inspector.actionGroups.datetime.timezone.apply')}
          </button>
        </div>
      </div>
    );
  };

  const renderCombineSplitSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actionGroups.datetime.combine.title')} & {t('inspector.actionGroups.datetime.split.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actionGroups.datetime.combine.description')}</span>
        </div>

        {/* Split section */}
        <div className={styles.subSection}>
          <h5 className={styles.subSectionTitle}>{t('inspector.actionGroups.datetime.split.title')}</h5>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t('inspector.actionGroups.datetime.split.dateColumn')}
            </label>
            <input
              type="text"
              className={styles.formInput}
              value={splitForm.dateColumn}
              onChange={(e) => setSplitForm(prev => ({ ...prev, dateColumn: e.target.value }))}
              placeholder={t('inspector.actionGroups.datetime.split.dateColumnPlaceholder')}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t('inspector.actionGroups.datetime.split.timeColumn')}
            </label>
            <input
              type="text"
              className={styles.formInput}
              value={splitForm.timeColumn}
              onChange={(e) => setSplitForm(prev => ({ ...prev, timeColumn: e.target.value }))}
              placeholder={t('inspector.actionGroups.datetime.split.timeColumnPlaceholder')}
            />
          </div>

          <div className={styles.actionControls}>
            <button 
              className={`${styles.actionButton} ${styles.primary}`}
              onClick={() => handleApplyAction('datetime_split', splitForm)}
            >
              {t('inspector.actionGroups.datetime.split.apply')}
            </button>
          </div>
        </div>

        {/* Combine section */}
        {availableColumns.length > 0 && (
          <div className={styles.subSection}>
            <h5 className={styles.subSectionTitle}>{t('inspector.actionGroups.datetime.combine.title')}</h5>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                {t('inspector.actionGroups.datetime.combine.dateColumn')}
              </label>
              <select
                className={styles.formSelect}
                value={combineForm.dateColumn}
                onChange={(e) => setCombineForm(prev => ({ ...prev, dateColumn: e.target.value }))}
              >
                <option value="">{t('inspector.actionGroups.datetime.combine.selectDateColumn')}</option>
                {availableColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                {t('inspector.actionGroups.datetime.combine.timeColumn')}
              </label>
              <select
                className={styles.formSelect}
                value={combineForm.timeColumn}
                onChange={(e) => setCombineForm(prev => ({ ...prev, timeColumn: e.target.value }))}
              >
                <option value="">{t('inspector.actionGroups.datetime.combine.selectTimeColumn')}</option>
                {availableColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                {t('inspector.actionGroups.datetime.combine.targetColumn')}
              </label>
              <input
                type="text"
                className={styles.formInput}
                value={combineForm.targetColumn}
                onChange={(e) => setCombineForm(prev => ({ ...prev, targetColumn: e.target.value }))}
                placeholder={t('inspector.actionGroups.datetime.combine.targetColumnPlaceholder')}
              />
            </div>

            <div className={styles.actionControls}>
              <button 
                className={`${styles.actionButton} ${styles.primary}`}
                onClick={() => handleApplyAction('datetime_combine', combineForm)}
                disabled={!combineForm.dateColumn || !combineForm.timeColumn || !combineForm.targetColumn}
              >
                {t('inspector.actionGroups.datetime.combine.apply')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${styles.actionGroup} ${!isExpanded ? styles.collapsed : ''}`}>
      <div 
        className={styles.groupHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.groupTitleSection}>
          <h3 className={styles.groupTitle}>
            {t('inspector.actionGroups.datetime.title')}
          </h3>
          <p className={styles.groupDescription}>
            {t('inspector.actionGroups.datetime.description')}
          </p>
        </div>
        
        <div className={styles.groupControls}>
          <button className={`${styles.expandButton} ${isExpanded ? styles.expanded : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.groupContent}>
          <div className={styles.actionsGrid}>
            {renderFormatConversionSection()}
            {renderExtractComponentsSection()}
            {renderArithmeticSection()}
            {renderTruncateSection()}
            {renderTimezoneSection()}
            {renderCombineSplitSection()}
          </div>
        </div>
      )}
    </div>
  );
}