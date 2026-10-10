import { useState } from 'react';
import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import { ColumnProfile } from '../../../../../core/profiling/columnTypes';
import { useDatasetStore } from '../../../../../state/useDatasetStore';
import { useColumnEditorStore } from '../../../../../state/useColumnEditorStore';
import { useToast } from '../../../../common/Toast/ToastProvider';
import styles from '../ActionGroups.module.css';

interface NumericGroupProps {
  profile: ColumnProfile;
}

export function NumericGroup({ profile }: NumericGroupProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Round form state
  const [roundForm, setRoundForm] = useState({
    method: 'nearest', // nearest, ceil, floor, banker
    decimals: 0
  });
  
  // Scale form state
  const [scaleForm, setScaleForm] = useState({
    operation: 'multiply', // multiply, divide, add, subtract
    value: 1,
    range: { min: 0, max: 1 }, // for scale to range
    customRange: false
  });
  
  // Normalize form state - no form needed, just buttons
  // const [normalizeForm, setNormalizeForm] = useState({
  //   method: 'minmax' // minmax, zscore, decimal
  // });
  
  // Fill missing form state
  const [fillMissingForm, setFillMissingForm] = useState({
    method: 'mean', // mean, median, mode, constant, forward, backward
    constantValue: 0
  });
  
  // Math transform form state
  const [mathForm, setMathForm] = useState({
    operation: 'abs', // abs, log, log10, log2, exp, sqrt, square, power
    powerValue: 2
  });
  
  // Binning form state
  const [binForm, setBinForm] = useState({
    method: 'equal_width', // equal_width, equal_freq, quantile, custom
    bins: 5,
    customRanges: ''
  });
  
  // Validation form state
  const [validationForm, setValidationForm] = useState({
    action: 'remove_negatives', // remove_negatives, positive_only, remove_zeros, integers_only
    clampMin: 0,
    clampMax: 100,
    outlierMethod: 'zscore', // zscore, iqr, custom
    outlierThreshold: 3
  });

  const { applyDatasetTransform } = useDatasetStore();
  const { addOperationWithSnapshot } = useColumnEditorStore();
  const { showToast } = useToast();

  const handleApplyAction = async (actionKey: string, params: any = {}) => {
    try {
      // Get current dataset state for snapshot BEFORE operation
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

      // Create BEFORE snapshot
      const beforeSnapshot = {
        data: JSON.parse(JSON.stringify(activeDataset.data)),
        columnNames: [...activeDataset.columnNames]
      };
      
      let operationData: any;
      let actionDescription: string;
      
      // Handle different numeric operations
      if (actionKey.startsWith('round_')) {
        const method = actionKey.replace('round_', '');
        operationData = {
          type: 'numeric_transform',
          columnName: profile.name,
          parameters: { 
            transformType: 'round',
            method,
            decimals: params.decimals || 0
          },
          description: t(`inspector.actionGroups.numeric.round.${method}.title`)
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t(`inspector.actionGroups.numeric.round.${method}.title`), 
          column: profile.name 
        });
      } else if (actionKey.startsWith('scale_')) {
        const operation = actionKey.replace('scale_', '');
        operationData = {
          type: 'numeric_transform',
          columnName: profile.name,
          parameters: { 
            transformType: 'scale',
            operation,
            value: params.value,
            range: params.range
          },
          description: t(`inspector.actionGroups.numeric.scale.${operation}.title`)
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t(`inspector.actionGroups.numeric.scale.${operation}.title`), 
          column: profile.name 
        });
      } else if (actionKey.startsWith('normalize_')) {
        const method = actionKey.replace('normalize_', '');
        operationData = {
          type: 'numeric_transform',
          columnName: profile.name,
          parameters: { 
            transformType: 'normalize',
            method
          },
          description: t(`inspector.actionGroups.numeric.normalize.${method}.title`)
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t(`inspector.actionGroups.numeric.normalize.${method}.title`), 
          column: profile.name 
        });
      } else if (actionKey.startsWith('fill_')) {
        const method = actionKey.replace('fill_', '');
        operationData = {
          type: 'fill_missing',
          columnName: profile.name,
          parameters: { 
            method,
            constantValue: params.constantValue
          },
          description: t(`inspector.actionGroups.numeric.fillMissing.${method}.title`)
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t(`inspector.actionGroups.numeric.fillMissing.${method}.title`), 
          column: profile.name 
        });
      } else if (actionKey.startsWith('math_')) {
        const operation = actionKey.replace('math_', '');
        operationData = {
          type: 'numeric_transform',
          columnName: profile.name,
          parameters: { 
            transformType: 'math',
            operation,
            powerValue: params.powerValue
          },
          description: t(`inspector.actionGroups.numeric.math.${operation}.title`)
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t(`inspector.actionGroups.numeric.math.${operation}.title`), 
          column: profile.name 
        });
      } else if (actionKey.startsWith('bin_')) {
        const method = actionKey.replace('bin_', '');
        operationData = {
          type: 'numeric_transform',
          columnName: profile.name,
          parameters: { 
            transformType: 'binning',
            method,
            bins: params.bins,
            customRanges: params.customRanges
          },
          description: t(`inspector.actionGroups.numeric.binning.${method}.title`)
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t(`inspector.actionGroups.numeric.binning.${method}.title`), 
          column: profile.name 
        });
      } else if (actionKey.startsWith('validate_')) {
        const action = actionKey.replace('validate_', '');
        
        // Pre-calculate translations to avoid context issues
        const validationTitleKey = `inspector.actionGroups.numeric.validation.${action}.title`;
        const validationTitle = t(validationTitleKey);
        
        // Log for debugging
        console.log('🔍 Validation translation debug:', {
          action,
          key: validationTitleKey,
          result: validationTitle
        });
        
        operationData = {
          type: 'numeric_validation',
          columnName: profile.name,
          parameters: { 
            action,
            clampMin: params.clampMin,
            clampMax: params.clampMax,
            outlierMethod: params.outlierMethod,
            outlierThreshold: params.outlierThreshold
          },
          description: validationTitle
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: validationTitle, 
          column: profile.name 
        });
      } else {
        showToast({
          message: t('inspector.actionGroups.general.actionNotImplemented', { actionKey }),
          type: 'error',
          duration: 3000
        });
        return;
      }
      
      // Apply the transformation
      const result = await applyDatasetTransform({
        id: `${actionKey}_${Date.now()}`,
        ...operationData,
        timestamp: new Date()
      });
      
      if (result.success) {
        // Get AFTER snapshot
        const updatedDataset = useDatasetStore.getState().datasets.find(d => d.id === activeDatasetId);
        const afterSnapshot = updatedDataset ? {
          data: JSON.parse(JSON.stringify(updatedDataset.data)),
          columnNames: [...updatedDataset.columnNames]
        } : null;

        // Add to operation history with snapshots
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
        
        // Show success toast with undo action
        showToast({
          message: actionDescription,
          type: 'success',
          duration: 5000,
          action: {
            label: t('inspector.editor.header.undo'),
            onClick: () => {
              try {
                const { undo, canUndo } = useColumnEditorStore.getState();
                if (canUndo()) {
                  const undoneOperation = undo();
                  console.log('🔄 Undo operation:', undoneOperation);
                  
                  // Show confirmation toast
                  showToast({
                    message: t('inspector.undoRedo.undone', { 
                      action: undoneOperation?.description || 'Operation' 
                    }),
                    type: 'info',
                    duration: 3000
                  });
                } else {
                  console.warn('Cannot undo - no operations available');
                }
              } catch (error) {
                console.error('Error during undo:', error);
                showToast({
                  message: t('inspector.actionGroups.general.generalError'),
                  type: 'error',
                  duration: 3000
                });
              }
            }
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

  const renderRoundSection = () => {
    const roundMethods = ['nearest', 'ceil', 'floor', 'banker'];
    
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actionGroups.numeric.round.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actionGroups.numeric.round.description')}</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actionGroups.numeric.round.decimals')}
          </label>
          <input
            type="number"
            className={styles.formInput}
            value={roundForm.decimals}
            onChange={(e) => setRoundForm(prev => ({ ...prev, decimals: parseInt(e.target.value) || 0 }))}
            min="0"
            max="10"
          />
        </div>

        <div className={styles.optionsGrid}>
          {roundMethods.map(method => (
            <button
              key={method}
              className={`${styles.actionButton} ${styles.secondary}`}
              onClick={() => handleApplyAction(`round_${method}`, { decimals: roundForm.decimals })}
              title={t(`inspector.actionGroups.numeric.round.${method}.description`)}
            >
              {t(`inspector.actionGroups.numeric.round.${method}.title`)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderScaleSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actionGroups.numeric.scale.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actionGroups.numeric.scale.description')}</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actionGroups.numeric.scale.operation')}
          </label>
          <select
            className={styles.formSelect}
            value={scaleForm.operation}
            onChange={(e) => setScaleForm(prev => ({ ...prev, operation: e.target.value }))}
          >
            <option value="multiply">{t('inspector.actionGroups.numeric.scale.multiply.title')}</option>
            <option value="divide">{t('inspector.actionGroups.numeric.scale.divide.title')}</option>
            <option value="add">{t('inspector.actionGroups.numeric.scale.add.title')}</option>
            <option value="subtract">{t('inspector.actionGroups.numeric.scale.subtract.title')}</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actionGroups.numeric.scale.value')}
          </label>
          <input
            type="number"
            className={styles.formInput}
            value={scaleForm.value}
            onChange={(e) => setScaleForm(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
            step="0.1"
          />
        </div>

        <div className={styles.actionControls}>
          <button 
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => handleApplyAction(`scale_${scaleForm.operation}`, { value: scaleForm.value })}
          >
            {t('inspector.actionGroups.numeric.scale.apply')}
          </button>
        </div>
      </div>
    );
  };

  const renderNormalizeSection = () => {
    const normalizeMethods = ['minmax', 'zscore', 'decimal'];
    
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actionGroups.numeric.normalize.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actionGroups.numeric.normalize.description')}</span>
        </div>

        <div className={styles.optionsGrid}>
          {normalizeMethods.map(method => (
            <button
              key={method}
              className={`${styles.actionButton} ${styles.secondary}`}
              onClick={() => handleApplyAction(`normalize_${method}`)}
              title={t(`inspector.actionGroups.numeric.normalize.${method}.description`)}
            >
              {t(`inspector.actionGroups.numeric.normalize.${method}.title`)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderFillMissingSection = () => {
    const fillMethods = ['mean', 'median', 'mode', 'constant', 'forward', 'backward'];
    
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actionGroups.numeric.fillMissing.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actionGroups.numeric.fillMissing.description')}</span>
        </div>

        {fillMissingForm.method === 'constant' && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t('inspector.actionGroups.numeric.fillMissing.constantValue')}
            </label>
            <input
              type="number"
              className={styles.formInput}
              value={fillMissingForm.constantValue}
              onChange={(e) => setFillMissingForm(prev => ({ ...prev, constantValue: parseFloat(e.target.value) || 0 }))}
              step="0.1"
            />
          </div>
        )}

        <div className={styles.optionsGrid}>
          {fillMethods.map(method => (
            <button
              key={method}
              className={`${styles.actionButton} ${method === fillMissingForm.method ? styles.primary : styles.secondary}`}
              onClick={() => {
                setFillMissingForm(prev => ({ ...prev, method }));
                if (method !== 'constant') {
                  handleApplyAction(`fill_${method}`);
                }
              }}
              title={t(`inspector.actionGroups.numeric.fillMissing.${method}.description`)}
            >
              {t(`inspector.actionGroups.numeric.fillMissing.${method}.title`)}
            </button>
          ))}
        </div>

        {fillMissingForm.method === 'constant' && (
          <div className={styles.actionControls}>
            <button 
              className={`${styles.actionButton} ${styles.primary}`}
              onClick={() => handleApplyAction('fill_constant', { constantValue: fillMissingForm.constantValue })}
            >
              {t('inspector.actionGroups.numeric.fillMissing.apply')}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderMathSection = () => {
    const mathOperations = ['abs', 'log', 'log10', 'log2', 'exp', 'sqrt', 'square'];
    
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actionGroups.numeric.math.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actionGroups.numeric.math.description')}</span>
        </div>

        <div className={styles.optionsGrid}>
          {mathOperations.map(operation => (
            <button
              key={operation}
              className={`${styles.actionButton} ${styles.secondary}`}
              onClick={() => handleApplyAction(`math_${operation}`)}
              title={t(`inspector.actionGroups.numeric.math.${operation}.description`)}
            >
              {t(`inspector.actionGroups.numeric.math.${operation}.title`)}
            </button>
          ))}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actionGroups.numeric.math.power.title')}
          </label>
          <div className={styles.formRow}>
            <input
              type="number"
              className={styles.formInput}
              value={mathForm.powerValue}
              onChange={(e) => setMathForm(prev => ({ ...prev, powerValue: parseFloat(e.target.value) || 2 }))}
              step="0.1"
              placeholder="2"
            />
            <button 
              className={`${styles.actionButton} ${styles.secondary}`}
              onClick={() => handleApplyAction('math_power', { powerValue: mathForm.powerValue })}
            >
              {t('inspector.actionGroups.numeric.math.power.apply')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBinningSection = () => {
    const binMethods = ['equal_width', 'equal_freq', 'quantile'];
    
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actionGroups.numeric.binning.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actionGroups.numeric.binning.description')}</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actionGroups.numeric.binning.bins')}
          </label>
          <input
            type="number"
            className={styles.formInput}
            value={binForm.bins}
            onChange={(e) => setBinForm(prev => ({ ...prev, bins: parseInt(e.target.value) || 5 }))}
            min="2"
            max="20"
          />
        </div>

        <div className={styles.optionsGrid}>
          {binMethods.map(method => (
            <button
              key={method}
              className={`${styles.actionButton} ${styles.secondary}`}
              onClick={() => handleApplyAction(`bin_${method}`, { bins: binForm.bins })}
              title={t(`inspector.actionGroups.numeric.binning.${method}.description`)}
            >
              {t(`inspector.actionGroups.numeric.binning.${method}.title`)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderValidationSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actionGroups.numeric.validation.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actionGroups.numeric.validation.description')}</span>
        </div>

        <div className={styles.optionsGrid}>
          <button
            className={`${styles.actionButton} ${styles.secondary}`}
            onClick={() => handleApplyAction('validate_remove_negatives')}
            title={t('inspector.actionGroups.numeric.validation.remove_negatives.description')}
          >
            {t('inspector.actionGroups.numeric.validation.remove_negatives.title')}
          </button>
          
          <button
            className={`${styles.actionButton} ${styles.secondary}`}
            onClick={() => handleApplyAction('validate_positive_only')}
            title={t('inspector.actionGroups.numeric.validation.positive_only.description')}
          >
            {t('inspector.actionGroups.numeric.validation.positive_only.title')}
          </button>
          
          <button
            className={`${styles.actionButton} ${styles.secondary}`}
            onClick={() => handleApplyAction('validate_remove_zeros')}
            title={t('inspector.actionGroups.numeric.validation.remove_zeros.description')}
          >
            {t('inspector.actionGroups.numeric.validation.remove_zeros.title')}
          </button>
          
          <button
            className={`${styles.actionButton} ${styles.secondary}`}
            onClick={() => handleApplyAction('validate_integers_only')}
            title={t('inspector.actionGroups.numeric.validation.integers_only.description')}
          >
            {t('inspector.actionGroups.numeric.validation.integers_only.title')}
          </button>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actionGroups.numeric.validation.clampRange.title')}
          </label>
          <div className={styles.formRow}>
            <input
              type="number"
              className={styles.formInput}
              value={validationForm.clampMin}
              onChange={(e) => setValidationForm(prev => ({ ...prev, clampMin: parseFloat(e.target.value) || 0 }))}
              placeholder={t('inspector.actionGroups.numeric.validation.clampRange.min')}
            />
            <input
              type="number"
              className={styles.formInput}
              value={validationForm.clampMax}
              onChange={(e) => setValidationForm(prev => ({ ...prev, clampMax: parseFloat(e.target.value) || 100 }))}
              placeholder={t('inspector.actionGroups.numeric.validation.clampRange.max')}
            />
            <button 
              className={`${styles.actionButton} ${styles.secondary}`}
              onClick={() => handleApplyAction('validate_clamp', { 
                clampMin: validationForm.clampMin, 
                clampMax: validationForm.clampMax 
              })}
            >
              {t('inspector.actionGroups.numeric.validation.clampRange.apply')}
            </button>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actionGroups.numeric.validation.outliers.title')}
          </label>
          <div className={styles.formRow}>
            <select
              className={styles.formSelect}
              value={validationForm.outlierMethod}
              onChange={(e) => setValidationForm(prev => ({ ...prev, outlierMethod: e.target.value }))}
            >
              <option value="zscore">{t('inspector.actionGroups.numeric.validation.outliers.zscore')}</option>
              <option value="iqr">{t('inspector.actionGroups.numeric.validation.outliers.iqr')}</option>
              <option value="custom">{t('inspector.actionGroups.numeric.validation.outliers.custom')}</option>
            </select>
            {validationForm.outlierMethod === 'zscore' && (
              <input
                type="number"
                className={styles.formInput}
                value={validationForm.outlierThreshold}
                onChange={(e) => setValidationForm(prev => ({ ...prev, outlierThreshold: parseFloat(e.target.value) || 3 }))}
                placeholder="3"
                step="0.1"
              />
            )}
            <button 
              className={`${styles.actionButton} ${styles.secondary}`}
              onClick={() => handleApplyAction('validate_outliers', { 
                outlierMethod: validationForm.outlierMethod,
                outlierThreshold: validationForm.outlierThreshold
              })}
            >
              {t('inspector.actionGroups.numeric.validation.outliers.apply')}
            </button>
          </div>
        </div>
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
            {t('inspector.actionGroups.numeric.title')}
          </h3>
          <p className={styles.groupDescription}>
            {t('inspector.actionGroups.numeric.description')}
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
            {renderRoundSection()}
            {renderScaleSection()}
            {renderNormalizeSection()}
            {renderFillMissingSection()}
            {renderMathSection()}
            {renderBinningSection()}
            {renderValidationSection()}
          </div>
        </div>
      )}
    </div>
  );
}