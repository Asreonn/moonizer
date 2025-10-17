import { useState } from 'react';
import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import { ColumnProfile } from '../../../../../core/profiling/columnTypes';
import { useDatasetStore } from '../../../../../state/useDatasetStore';
import { useColumnEditorStore } from '../../../../../state/useColumnEditorStore';
import { useToast } from '../../../../common/Toast/ToastProvider';
import styles from '../ActionGroups.module.css';

interface BooleanGroupProps {
  profile: ColumnProfile;
}

export function BooleanGroup({ profile }: BooleanGroupProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [fillMissingForm, setFillMissingForm] = useState({
    defaultValue: 'true',
    strategy: 'default'
  });
  const [customLabelsForm, setCustomLabelsForm] = useState({
    trueLabel: '',
    falseLabel: ''
  });
  const [ruleForm, setRuleForm] = useState({
    condition: '',
    columnName: ''
  });

  // Custom condition state
  const [customCondition, setCustomCondition] = useState('');

  const { applyDatasetTransform, datasets, activeDatasetId } = useDatasetStore();
  const { addOperationWithSnapshot } = useColumnEditorStore();
  const { showToast } = useToast();

  // Boolean transformation actions
  const basicActions = [
    'convert_to_01', 'invert_values'
  ];
  
  const fillMissingActions = [
    'fill_default_true', 'fill_default_false', 'fill_majority'
  ];

  const activeDataset = datasets.find(d => d.id === activeDatasetId);
  const availableColumns = activeDataset?.columnNames.filter(col => col !== profile.name) || [];

  // Simple condition parser - converts user text to rule engine format
  const parseCondition = (condition: string) => {
    // Simple parsing for basic conditions like "Age > 18" or "Status == 'Active'"
    // This is a basic implementation - can be enhanced later
    const trimmed = condition.trim();
    
    // Handle AND/OR combinations later - for now just simple conditions
    const operators = ['>=', '<=', '==', '!=', '>', '<', '.contains(', '.startsWith(', '.endsWith('];
    
    for (const op of operators) {
      if (trimmed.includes(op)) {
        const parts = trimmed.split(op);
        if (parts.length === 2) {
          const column = parts[0].trim();
          let value = parts[1].trim();
          
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          // Handle text methods
          if (op === '.contains(') {
            value = value.replace(')', '');
            return { column, operator: 'contains', value };
          } else if (op === '.startsWith(') {
            value = value.replace(')', '');
            return { column, operator: 'startsWith', value };
          } else if (op === '.endsWith(') {
            value = value.replace(')', '');
            return { column, operator: 'endsWith', value };
          }
          
          // Convert operator symbols to rule engine format
          let ruleOperator = op;
          if (op === '==') ruleOperator = '==';
          if (op === '!=') ruleOperator = '!=';
          
          return { column, operator: ruleOperator, value };
        }
      }
    }
    
    return null;
  };

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
      
      if (basicActions.includes(actionKey)) {
        // Map action keys to localization keys
        const localizationKey = actionKey === 'convert_to_01' ? 'convertTo01' : 
                               actionKey === 'invert_values' ? 'invertValues' : actionKey;
        
        operationData = {
          type: 'boolean_transform',
          columnName: profile.name,
          parameters: { 
            transformType: actionKey
          },
          description: t(`inspector.actions.transform.boolean.${localizationKey}.title`)
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t(`inspector.actions.transform.boolean.${localizationKey}.title`), 
          column: profile.name 
        });
      } else if (fillMissingActions.includes(actionKey)) {
        operationData = {
          type: 'boolean_fill_missing',
          columnName: profile.name,
          parameters: { 
            fillType: actionKey,
            defaultValue: params.defaultValue
          },
          description: t('inspector.actions.transform.boolean.fillMissing.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.transform.boolean.fillMissing.title'), 
          column: profile.name 
        });
      } else if (actionKey === 'convert_to_custom_labels') {
        operationData = {
          type: 'boolean_custom_labels',
          columnName: profile.name,
          parameters: {
            trueLabel: params.trueLabel,
            falseLabel: params.falseLabel
          },
          description: t('inspector.actions.transform.boolean.convertToCustomLabels.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.transform.boolean.convertToCustomLabels.title'), 
          column: profile.name 
        });
      } else if (actionKey === 'advanced_rule_mapping') {
        operationData = {
          type: 'advanced_rule_mapping',
          columnName: profile.name,
          parameters: {
            ruleSetData: params.ruleSetData
          },
          description: t('inspector.actions.transform.boolean.advancedRuleMapping.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.transform.boolean.advancedRuleMapping.title'), 
          column: profile.name 
        });
      } else if (actionKey === 'custom_rule_mapping') {
        operationData = {
          type: 'boolean_rule_mapping',
          columnName: profile.name,
          parameters: {
            condition: params.condition,
            columnName: params.columnName
          },
          description: t('inspector.actions.transform.boolean.customRuleMapping.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.transform.boolean.customRuleMapping.title'), 
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

  // Apply custom condition
  const applyCustomCondition = async () => {
    if (!customCondition.trim()) {
      showToast({
        message: t('inspector.ruleBuilder.errors.conditionRequired'),
        type: 'error',
        duration: 3000
      });
      return;
    }

    try {
      const parsed = parseCondition(customCondition);
      
      if (!parsed) {
        showToast({
          message: t('inspector.ruleBuilder.errors.invalidSyntax'),
          type: 'error',
          duration: 3000
        });
        return;
      }
      
      const { createRuleGroup, createRuleSet, createCondition } = await import('../../../../../core/dataset/ruleEngine');
      
      // Convert parsed value to appropriate type
      let conditionValue: any = parsed.value;
      if (['>', '<', '>=', '<='].includes(parsed.operator)) {
        const numValue = parseFloat(parsed.value);
        if (!isNaN(numValue)) {
          conditionValue = numValue;
        }
      }
      
      const condition = createCondition(parsed.column, parsed.operator as any, conditionValue);
      const ruleGroup = createRuleGroup('AND', [condition]);
      const ruleSet = createRuleSet('Özel Koşul', ruleGroup, {
        description: customCondition,
        resultType: 'boolean',
        trueValue: true,
        falseValue: false,
        defaultValue: false
      });

      const ruleSetData = JSON.stringify(ruleSet);
      await handleApplyAction('advanced_rule_mapping', { ruleSetData });
      
      // Reset form
      setCustomCondition('');
      
    } catch (error) {
      console.error('Failed to apply custom condition:', error);
      showToast({
        message: t('inspector.ruleBuilder.errors.ruleApplicationFailed'),
        type: 'error',
        duration: 4000
      });
    }
  };


  const renderBasicTransformationsSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actions.transform.boolean.basic.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actions.transform.boolean.basic.description')}</span>
        </div>

        <div className={styles.optionsGrid}>
          <button
            className={`${styles.actionButton} ${styles.secondary}`}
            onClick={() => handleApplyAction('convert_to_01')}
            title={t('inspector.actions.transform.boolean.convertTo01.description')}
          >
            {t('inspector.actions.transform.boolean.convertTo01.title')}
          </button>
          <button
            className={`${styles.actionButton} ${styles.secondary}`}
            onClick={() => handleApplyAction('invert_values')}
            title={t('inspector.actions.transform.boolean.invertValues.description')}
          >
            {t('inspector.actions.transform.boolean.invertValues.title')}
          </button>
        </div>
      </div>
    );
  };

  const renderFillMissingSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actions.transform.boolean.fillMissing.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actions.transform.boolean.fillMissing.description')}</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actions.transform.boolean.fillMissing.strategy')}
          </label>
          <select
            className={styles.formSelect}
            value={fillMissingForm.strategy}
            onChange={(e) => setFillMissingForm(prev => ({ ...prev, strategy: e.target.value }))}
          >
            <option value="default">{t('inspector.actions.transform.boolean.fillMissing.defaultStrategy')}</option>
            <option value="majority">{t('inspector.actions.transform.boolean.fillMissing.majorityStrategy')}</option>
          </select>
        </div>

        {fillMissingForm.strategy === 'default' && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t('inspector.actions.transform.boolean.fillMissing.defaultValue')}
            </label>
            <select
              className={styles.formSelect}
              value={fillMissingForm.defaultValue}
              onChange={(e) => setFillMissingForm(prev => ({ ...prev, defaultValue: e.target.value }))}
            >
              <option value="true">{t('inspector.actions.transform.boolean.fillMissing.defaultTrue')}</option>
              <option value="false">{t('inspector.actions.transform.boolean.fillMissing.defaultFalse')}</option>
            </select>
          </div>
        )}

        <div className={styles.actionControls}>
          <button 
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => {
              if (fillMissingForm.strategy === 'majority') {
                handleApplyAction('fill_majority');
              } else {
                handleApplyAction(fillMissingForm.defaultValue === 'true' ? 'fill_default_true' : 'fill_default_false');
              }
            }}
          >
            {t('inspector.actions.transform.boolean.fillMissing.apply')}
          </button>
        </div>
      </div>
    );
  };

  const renderCustomLabelsSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actions.transform.boolean.convertToCustomLabels.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actions.transform.boolean.convertToCustomLabels.description')}</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actions.transform.boolean.convertToCustomLabels.trueLabel')}
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={customLabelsForm.trueLabel}
            onChange={(e) => setCustomLabelsForm(prev => ({ ...prev, trueLabel: e.target.value }))}
            placeholder={t('inspector.actions.transform.boolean.convertToCustomLabels.truePlaceholder')}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actions.transform.boolean.convertToCustomLabels.falseLabel')}
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={customLabelsForm.falseLabel}
            onChange={(e) => setCustomLabelsForm(prev => ({ ...prev, falseLabel: e.target.value }))}
            placeholder={t('inspector.actions.transform.boolean.convertToCustomLabels.falsePlaceholder')}
          />
        </div>

        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {t('inspector.actions.transform.boolean.convertToCustomLabels.example', {
              trueLabel: customLabelsForm.trueLabel || 'Active',
              falseLabel: customLabelsForm.falseLabel || 'Inactive'
            })}
          </span>
        </div>

        <div className={styles.actionControls}>
          <button 
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => handleApplyAction('convert_to_custom_labels', customLabelsForm)}
            disabled={!customLabelsForm.trueLabel || !customLabelsForm.falseLabel}
          >
            {t('inspector.actions.transform.boolean.convertToCustomLabels.apply')}
          </button>
        </div>
      </div>
    );
  };

  const renderCustomRuleMappingSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actions.transform.boolean.customRuleMapping.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actions.transform.boolean.customRuleMapping.description')}</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actions.transform.boolean.customRuleMapping.columnName')}
          </label>
          <select
            className={styles.formSelect}
            value={ruleForm.columnName}
            onChange={(e) => setRuleForm(prev => ({ ...prev, columnName: e.target.value }))}
          >
            <option value="">{t('inspector.actions.transform.boolean.customRuleMapping.selectColumn')}</option>
            {availableColumns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actions.transform.boolean.customRuleMapping.condition')}
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={ruleForm.condition}
            onChange={(e) => setRuleForm(prev => ({ ...prev, condition: e.target.value }))}
            placeholder={t('inspector.actions.transform.boolean.customRuleMapping.conditionPlaceholder')}
          />
        </div>

        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {t('inspector.actions.transform.boolean.customRuleMapping.example')}
          </span>
        </div>

        <div className={styles.actionControls}>
          <button 
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => handleApplyAction('custom_rule_mapping', ruleForm)}
            disabled={!ruleForm.columnName || !ruleForm.condition}
          >
            {t('inspector.actions.transform.boolean.customRuleMapping.apply')}
          </button>
        </div>
      </div>
    );
  };

  const renderAdvancedRuleMappingSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.ruleBuilder.customCondition.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span>{t('inspector.ruleBuilder.customCondition.description')}</span>
        </div>

        {/* Custom Condition Input */}
        <div className={styles.formSection}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('inspector.ruleBuilder.customCondition.conditionLabel')}</label>
            <input
              type="text"
              className={styles.formInput}
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              placeholder={t('inspector.ruleBuilder.customCondition.conditionPlaceholder')}
            />
          </div>

          <div className={styles.actionControls}>
            <button
              className={`${styles.actionButton} ${styles.primary}`}
              onClick={applyCustomCondition}
              disabled={!customCondition.trim()}
            >
              {t('inspector.ruleBuilder.customCondition.applyButton')}
            </button>
          </div>
        </div>

        {/* Examples Section */}
        <div className={styles.formSection}>
          <h4 className={styles.sectionTitle}>{t('inspector.ruleBuilder.customCondition.examples.title')}</h4>
          <div className={styles.exampleHint}>
            <div>
              <div>{t('inspector.ruleBuilder.customCondition.examples.numeric')}</div>
              <div>{t('inspector.ruleBuilder.customCondition.examples.text')}</div>
              <div>{t('inspector.ruleBuilder.customCondition.examples.combined')}</div>
            </div>
          </div>
        </div>

        {/* Syntax Help */}
        <div className={styles.formSection}>
          <h4 className={styles.sectionTitle}>{t('inspector.ruleBuilder.customCondition.syntax.title')}</h4>
          <div className={styles.exampleHint}>
            <div>
              <div>{t('inspector.ruleBuilder.customCondition.syntax.operators')}</div>
              <div>{t('inspector.ruleBuilder.customCondition.syntax.text')}</div>
              <div>{t('inspector.ruleBuilder.customCondition.syntax.logical')}</div>
            </div>
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
            {t('inspector.actionGroups.boolean.title')}
          </h3>
          <p className={styles.groupDescription}>
            {t('inspector.actionGroups.boolean.description')}
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
            {renderBasicTransformationsSection()}
            {renderFillMissingSection()}
            {renderCustomLabelsSection()}
            {renderCustomRuleMappingSection()}
            {renderAdvancedRuleMappingSection()}
          </div>
        </div>
      )}

    </div>
  );
}
