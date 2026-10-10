import { useState } from 'react';
import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import { ColumnProfile } from '../../../../../core/profiling/columnTypes';
import { useDatasetStore } from '../../../../../state/useDatasetStore';
import { useColumnEditorStore } from '../../../../../state/useColumnEditorStore';
import { useToast } from '../../../../common/Toast/ToastProvider';
import styles from '../ActionGroups.module.css';

interface CategoryGroupProps {
  profile: ColumnProfile;
}

export function CategoryGroup({ profile }: CategoryGroupProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Simplified rename categories form state
  const [renameCategoriesForm, setRenameCategoriesForm] = useState({
    originalCategory: '',
    newCategory: '',
    mappings: {} as Record<string, string>,
    regexPattern: '',
    regexReplacement: '',
    searchTerm: ''
  });
  
  // Simplified merge categories form state
  const [mergeCategoriesForm, setMergeCategoriesForm] = useState({
    sourceCategories: [] as string[],
    targetCategory: '',
    strategy: 'custom', // custom, most_frequent, alphabetical
    searchTerm: ''
  });
  
  // Split categories form state
  const [splitCategoriesForm, setSplitCategoriesForm] = useState({
    sourceCategory: '',
    newCategories: ['', ''],
    rules: [] as Array<{ pattern: string; category: string }>
  });
  
  // Encoding form state
  const [encodingForm, setEncodingForm] = useState({
    type: 'label', // label, onehot, binary, matrix
    dropFirst: false,
    handleUnknown: 'ignore' // ignore, error
  });
  
  // Group rare categories form state
  const [groupRareForm, setGroupRareForm] = useState({
    threshold: 5,
    thresholdType: 'count', // count, percentage
    otherLabel: 'Other'
  });
  
  // Default value assignment form state
  const [defaultValueForm, setDefaultValueForm] = useState({
    strategy: 'constant', // constant, most_frequent
    defaultValue: 'Unknown'
  });

  // Rules system form state (similar to BooleanGroup)
  const [rulesForm, setRulesForm] = useState({
    condition: '',
    columnName: '',
    trueValue: '',
    falseValue: '',
    targetCategory: ''
  });

  // Custom condition state
  const [customCondition, setCustomCondition] = useState('');

  const { applyDatasetTransform, datasets, activeDatasetId } = useDatasetStore();
  const { addOperationWithSnapshot } = useColumnEditorStore();
  const { showToast } = useToast();

  // Get unique categories from current column data
  const activeDataset = datasets.find(d => d.id === activeDatasetId);
  const uniqueCategories = activeDataset ? 
    Array.from(new Set(
      activeDataset.data
        .map(row => row[profile.name])
        .filter(val => val != null && val !== '')
    )).sort() : [];

  // Available columns for rules (if we want to add column selection later)
  // const availableColumns = activeDataset?.columnNames.filter(col => col !== profile.name) || [];

  // Simple condition parser - converts user text to rule engine format
  const parseCondition = (condition: string) => {
    const trimmed = condition.trim();
    
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
      
      if (actionKey === 'rename_categories') {
        operationData = {
          type: 'category_rename',
          columnName: profile.name,
          parameters: {
            mappings: params.mappings
          },
          description: t('inspector.actions.transform.category.rename.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.transform.category.rename.title'), 
          column: profile.name 
        });
      } else if (actionKey === 'merge_categories') {
        operationData = {
          type: 'category_merge',
          columnName: profile.name,
          parameters: {
            sourceCategories: params.sourceCategories,
            targetCategory: params.targetCategory,
            strategy: params.strategy
          },
          description: t('inspector.actions.transform.category.merge.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.transform.category.merge.title'), 
          column: profile.name 
        });
      } else if (actionKey === 'split_categories') {
        operationData = {
          type: 'category_split',
          columnName: profile.name,
          parameters: {
            sourceCategory: params.sourceCategory,
            newCategories: params.newCategories,
            rules: params.rules
          },
          description: t('inspector.actions.transform.category.split.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.transform.category.split.title'), 
          column: profile.name 
        });
      } else if (actionKey === 'label_encoding') {
        operationData = {
          type: 'category_encoding',
          columnName: profile.name,
          parameters: {
            encodingType: 'label'
          },
          description: t('inspector.actions.transform.category.encoding.label.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.transform.category.encoding.label.title'), 
          column: profile.name 
        });
      } else if (actionKey === 'onehot_encoding') {
        operationData = {
          type: 'category_encoding',
          columnName: profile.name,
          parameters: {
            encodingType: 'onehot',
            dropFirst: params.dropFirst
          },
          description: t('inspector.actions.transform.category.encoding.onehot.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.transform.category.encoding.onehot.title'), 
          column: profile.name 
        });
      } else if (actionKey === 'binary_encoding') {
        operationData = {
          type: 'category_encoding',
          columnName: profile.name,
          parameters: {
            encodingType: 'binary'
          },
          description: t('inspector.actions.transform.category.encoding.binary.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.transform.category.encoding.binary.title'), 
          column: profile.name 
        });
      } else if (actionKey === 'matrix_encoding') {
        operationData = {
          type: 'category_encoding',
          columnName: profile.name,
          parameters: {
            encodingType: 'matrix',
            dropFirst: params.dropFirst
          },
          description: t('inspector.actions.transform.category.encoding.matrix.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.transform.category.encoding.matrix.title'), 
          column: profile.name 
        });
      } else if (actionKey === 'group_rare_categories') {
        operationData = {
          type: 'category_group_rare',
          columnName: profile.name,
          parameters: {
            threshold: params.threshold,
            thresholdType: params.thresholdType,
            otherLabel: params.otherLabel
          },
          description: t('inspector.actions.transform.category.groupRare.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.transform.category.groupRare.title'), 
          column: profile.name 
        });
      } else if (actionKey === 'assign_default_value') {
        operationData = {
          type: 'category_default_value',
          columnName: profile.name,
          parameters: {
            strategy: params.strategy,
            defaultValue: params.defaultValue
          },
          description: t('inspector.actions.transform.category.defaultValue.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.transform.category.defaultValue.title'), 
          column: profile.name 
        });
      } else if (actionKey === 'apply_categorical_rules') {
        const parsedCondition = parseCondition(customCondition);
        if (!parsedCondition) {
          showToast({
            message: t('inspector.ruleBuilder.errors.invalidSyntax'),
            type: 'error',
            duration: 4000
          });
          return;
        }

        operationData = {
          type: 'category_rules',
          columnName: profile.name,
          parameters: {
            condition: parsedCondition,
            trueValue: rulesForm.trueValue,
            falseValue: rulesForm.falseValue,
            targetCategory: rulesForm.targetCategory
          },
          description: t('inspector.actions.transform.category.rules.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.transform.category.rules.title'), 
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

  const addMapping = () => {
    if (renameCategoriesForm.originalCategory && renameCategoriesForm.newCategory) {
      setRenameCategoriesForm(prev => ({
        ...prev,
        mappings: {
          ...prev.mappings,
          [prev.originalCategory]: prev.newCategory
        },
        originalCategory: '',
        newCategory: ''
      }));
    }
  };


  const applyRegexTransform = () => {
    const { regexPattern, regexReplacement } = renameCategoriesForm;
    if (!regexPattern) return;
    
    try {
      const regex = new RegExp(regexPattern, 'g');
      const newMappings: Record<string, string> = {};
      
      uniqueCategories.forEach(category => {
        const transformed = category.replace(regex, regexReplacement);
        if (transformed !== category) {
          newMappings[category] = transformed;
        }
      });
      
      setRenameCategoriesForm(prev => ({
        ...prev,
        mappings: { ...prev.mappings, ...newMappings }
      }));
    } catch (error) {
      console.error('Invalid regex pattern:', error);
    }
  };


  const removeMapping = (originalCategory: string) => {
    setRenameCategoriesForm(prev => {
      const newMappings = { ...prev.mappings };
      delete newMappings[originalCategory];
      return {
        ...prev,
        mappings: newMappings
      };
    });
  };

  const addSourceCategory = (category: string) => {
    if (!mergeCategoriesForm.sourceCategories.includes(category)) {
      setMergeCategoriesForm(prev => ({
        ...prev,
        sourceCategories: [...prev.sourceCategories, category]
      }));
    }
  };

  const removeSourceCategory = (category: string) => {
    setMergeCategoriesForm(prev => ({
      ...prev,
      sourceCategories: prev.sourceCategories.filter(c => c !== category)
    }));
  };




  const addSplitRule = () => {
    setSplitCategoriesForm(prev => ({
      ...prev,
      rules: [...prev.rules, { pattern: '', category: '' }]
    }));
  };

  const updateSplitRule = (index: number, field: 'pattern' | 'category', value: string) => {
    setSplitCategoriesForm(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => 
        i === index ? { ...rule, [field]: value } : rule
      )
    }));
  };

  const removeSplitRule = (index: number) => {
    setSplitCategoriesForm(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const renderRenameCategoriesSection = () => {
    const filteredCategories = uniqueCategories.filter(cat => 
      !renameCategoriesForm.searchTerm || 
      cat.toLowerCase().includes(renameCategoriesForm.searchTerm.toLowerCase())
    );

    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actions.transform.category.rename.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actions.transform.category.rename.description')}</span>
        </div>

        <div className={styles.categoryOperationForm}>
          {/* Search filter */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('inspector.actions.transform.category.rename.searchLabel')}</label>
            <input
              type="text"
              className={styles.formInput}
              value={renameCategoriesForm.searchTerm}
              onChange={(e) => setRenameCategoriesForm(prev => ({ ...prev, searchTerm: e.target.value }))}
              placeholder={t('inspector.actions.transform.category.rename.searchPlaceholder')}
            />
          </div>

          {/* Basic mapping interface */}
          <div className={styles.compactFormRow}>
            <select
              className={styles.formSelect}
              value={renameCategoriesForm.originalCategory}
              onChange={(e) => setRenameCategoriesForm(prev => ({ ...prev, originalCategory: e.target.value }))}
            >
              <option value="">{t('inspector.actions.transform.category.rename.selectCategory')}</option>
              {filteredCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <input
              type="text"
              className={styles.formInput}
              value={renameCategoriesForm.newCategory}
              onChange={(e) => setRenameCategoriesForm(prev => ({ ...prev, newCategory: e.target.value }))}
              placeholder={t('inspector.actions.transform.category.rename.newCategoryPlaceholder')}
            />
            <button 
              className={`${styles.actionButton} ${styles.secondary}`}
              onClick={addMapping}
              disabled={!renameCategoriesForm.originalCategory || !renameCategoriesForm.newCategory}
            >
              {t('inspector.actions.transform.category.rename.addMapping')}
            </button>
          </div>

          {/* Regex operations */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('inspector.actions.transform.category.rename.regexLabel')}</label>
            <div className={styles.compactFormRow}>
              <input
                type="text"
                className={styles.formInput}
                value={renameCategoriesForm.regexPattern}
                onChange={(e) => setRenameCategoriesForm(prev => ({ ...prev, regexPattern: e.target.value }))}
                placeholder={t('inspector.actions.transform.category.rename.regexPatternPlaceholder')}
              />
              <input
                type="text"
                className={styles.formInput}
                value={renameCategoriesForm.regexReplacement}
                onChange={(e) => setRenameCategoriesForm(prev => ({ ...prev, regexReplacement: e.target.value }))}
                placeholder={t('inspector.actions.transform.category.rename.regexReplacementPlaceholder')}
              />
              <button 
                className={`${styles.actionButton} ${styles.secondary}`}
                onClick={applyRegexTransform}
                disabled={!renameCategoriesForm.regexPattern}
              >
                {t('inspector.actions.transform.category.rename.applyRegex')}
              </button>
            </div>
          </div>

          {/* Show mappings inline if any exist */}
          {Object.keys(renameCategoriesForm.mappings).length > 0 && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Mappings ({Object.keys(renameCategoriesForm.mappings).length})
              </label>
              <div className={styles.mappingsList} style={{ maxHeight: '120px' }}>
                {Object.entries(renameCategoriesForm.mappings).map(([original, renamed]) => (
                  <div key={original} className={styles.mappingItem}>
                    <span>{original} → {renamed}</span>
                    <button 
                      className={`${styles.actionButton} ${styles.destructive}`}
                      onClick={() => removeMapping(original)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply button */}
          <div className={styles.actionControls}>
            <button 
              className={`${styles.actionButton} ${styles.primary}`}
              onClick={() => handleApplyAction('rename_categories', { mappings: renameCategoriesForm.mappings })}
              disabled={Object.keys(renameCategoriesForm.mappings).length === 0}
            >
              {t('inspector.actions.transform.category.rename.apply')} ({Object.keys(renameCategoriesForm.mappings).length} mappings)
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMergeCategoriesSection = () => {
    const filteredCategories = uniqueCategories.filter(cat => 
      !mergeCategoriesForm.searchTerm || 
      cat.toLowerCase().includes(mergeCategoriesForm.searchTerm.toLowerCase())
    );

    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actions.transform.category.merge.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actions.transform.category.merge.description')}</span>
        </div>

        <div className={styles.categoryOperationForm}>
          {/* Search filter */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('inspector.actions.transform.category.merge.searchLabel')}</label>
            <input
              type="text"
              className={styles.formInput}
              value={mergeCategoriesForm.searchTerm}
              onChange={(e) => setMergeCategoriesForm(prev => ({ ...prev, searchTerm: e.target.value }))}
              placeholder={t('inspector.actions.transform.category.merge.searchPlaceholder')}
            />
          </div>

          {/* Manual category selection */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t('inspector.actions.transform.category.merge.sourceCategories')} ({mergeCategoriesForm.sourceCategories.length} selected)
            </label>
            <div className={styles.categorySelector}>
              {filteredCategories.map(category => (
                <button
                  key={category}
                  className={`${styles.categoryChip} ${mergeCategoriesForm.sourceCategories.includes(category) ? styles.selected : ''}`}
                  onClick={() => {
                    if (mergeCategoriesForm.sourceCategories.includes(category)) {
                      removeSourceCategory(category);
                    } else {
                      addSourceCategory(category);
                    }
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Target category and strategy */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t('inspector.actions.transform.category.merge.targetCategory')}
            </label>
            <div className={styles.compactFormRow}>
              <input
                type="text"
                className={styles.formInput}
                value={mergeCategoriesForm.targetCategory}
                onChange={(e) => setMergeCategoriesForm(prev => ({ ...prev, targetCategory: e.target.value }))}
                placeholder={t('inspector.actions.transform.category.merge.targetCategoryPlaceholder')}
              />
              <select
                className={styles.formSelect}
                value={mergeCategoriesForm.strategy}
                onChange={(e) => setMergeCategoriesForm(prev => ({ ...prev, strategy: e.target.value }))}
              >
                <option value="custom">Custom Name</option>
                <option value="most_frequent">Most Frequent</option>
                <option value="alphabetical">Alphabetical First</option>
              </select>
            </div>
          </div>

          {/* Selected categories preview */}
          {mergeCategoriesForm.sourceCategories.length > 0 && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Selected for Merge</label>
              <div className={styles.mappingsList} style={{ maxHeight: '120px' }}>
                {mergeCategoriesForm.sourceCategories.map(category => (
                  <div key={category} className={styles.mappingItem}>
                    <span>{category}</span>
                    <button 
                      className={`${styles.actionButton} ${styles.destructive}`}
                      onClick={() => removeSourceCategory(category)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className={styles.formGroup}>
            <div className={styles.compactFormRow}>
              <button 
                className={`${styles.actionButton} ${styles.secondary}`}
                onClick={() => setMergeCategoriesForm(prev => ({ ...prev, sourceCategories: [] }))}
                disabled={mergeCategoriesForm.sourceCategories.length === 0}
              >
                Clear Selection
              </button>
              <button 
                className={`${styles.actionButton} ${styles.secondary}`}
                onClick={() => setMergeCategoriesForm(prev => ({ 
                  ...prev, 
                  sourceCategories: filteredCategories 
                }))}
              >
                Select All Visible
              </button>
            </div>
          </div>

          {/* Apply button */}
          <div className={styles.actionControls}>
            <button 
              className={`${styles.actionButton} ${styles.primary}`}
              onClick={() => handleApplyAction('merge_categories', {
                sourceCategories: mergeCategoriesForm.sourceCategories,
                targetCategory: mergeCategoriesForm.targetCategory,
                strategy: mergeCategoriesForm.strategy
              })}
              disabled={mergeCategoriesForm.sourceCategories.length < 2 || !mergeCategoriesForm.targetCategory}
            >
              {t('inspector.actions.transform.category.merge.apply')} ({mergeCategoriesForm.sourceCategories.length} → 1)
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSplitCategoriesSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actions.transform.category.split.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actions.transform.category.split.description')}</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actions.transform.category.split.sourceCategory')}
          </label>
          <select
            className={styles.formSelect}
            value={splitCategoriesForm.sourceCategory}
            onChange={(e) => setSplitCategoriesForm(prev => ({ ...prev, sourceCategory: e.target.value }))}
          >
            <option value="">{t('inspector.actions.transform.category.split.selectSourceCategory')}</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actions.transform.category.split.rules')}
          </label>
          {splitCategoriesForm.rules.map((rule, index) => (
            <div key={index} className={styles.ruleRow}>
              <input
                type="text"
                className={styles.formInput}
                value={rule.pattern}
                onChange={(e) => updateSplitRule(index, 'pattern', e.target.value)}
                placeholder={t('inspector.actions.transform.category.split.patternPlaceholder')}
              />
              <input
                type="text"
                className={styles.formInput}
                value={rule.category}
                onChange={(e) => updateSplitRule(index, 'category', e.target.value)}
                placeholder={t('inspector.actions.transform.category.split.categoryPlaceholder')}
              />
              <button 
                className={`${styles.actionButton} ${styles.destructive}`}
                onClick={() => removeSplitRule(index)}
              >
                {t('inspector.actions.transform.category.split.removeRule')}
              </button>
            </div>
          ))}
          <button 
            className={`${styles.actionButton} ${styles.secondary}`}
            onClick={addSplitRule}
          >
            {t('inspector.actions.transform.category.split.addRule')}
          </button>
        </div>

        <div className={styles.actionControls}>
          <button 
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => handleApplyAction('split_categories', {
              sourceCategory: splitCategoriesForm.sourceCategory,
              newCategories: splitCategoriesForm.newCategories,
              rules: splitCategoriesForm.rules
            })}
            disabled={!splitCategoriesForm.sourceCategory || splitCategoriesForm.rules.length === 0}
          >
            {t('inspector.actions.transform.category.split.apply')}
          </button>
        </div>
      </div>
    );
  };

  const renderEncodingSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actions.transform.category.encoding.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actions.transform.category.encoding.description')}</span>
        </div>

        <div className={styles.optionsGrid}>
          <button
            className={`${styles.actionButton} ${styles.secondary}`}
            onClick={() => handleApplyAction('label_encoding')}
            title={t('inspector.actions.transform.category.encoding.label.description')}
          >
            {t('inspector.actions.transform.category.encoding.label.title')}
          </button>
          <button
            className={`${styles.actionButton} ${styles.secondary}`}
            onClick={() => handleApplyAction('onehot_encoding', { dropFirst: encodingForm.dropFirst })}
            title={t('inspector.actions.transform.category.encoding.onehot.description')}
          >
            {t('inspector.actions.transform.category.encoding.onehot.title')}
          </button>
          <button
            className={`${styles.actionButton} ${styles.secondary}`}
            onClick={() => handleApplyAction('binary_encoding')}
            title={t('inspector.actions.transform.category.encoding.binary.description')}
          >
            {t('inspector.actions.transform.category.encoding.binary.title')}
          </button>
          <button
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => handleApplyAction('matrix_encoding', { dropFirst: encodingForm.dropFirst })}
            title={t('inspector.actions.transform.category.encoding.matrix.description')}
          >
            {t('inspector.actions.transform.category.encoding.matrix.title')}
          </button>
        </div>

        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={encodingForm.dropFirst}
              onChange={(e) => setEncodingForm(prev => ({ ...prev, dropFirst: e.target.checked }))}
            />
            <span className={styles.checkboxText}>
              {t('inspector.actions.transform.category.encoding.onehot.dropFirst')}
            </span>
          </label>
        </div>
      </div>
    );
  };

  // Rules section renderer
  const renderRulesSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actions.transform.category.rules.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actions.transform.category.rules.description')}</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.ruleBuilder.condition')}
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={customCondition}
            onChange={(e) => setCustomCondition(e.target.value)}
            placeholder={t('inspector.ruleBuilder.conditionPlaceholder')}
          />
          <div className={styles.exampleHint}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('inspector.ruleBuilder.conditionHelp')}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.ruleBuilder.trueValue')}
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={rulesForm.trueValue}
            onChange={(e) => setRulesForm(prev => ({ ...prev, trueValue: e.target.value }))}
            placeholder={t('inspector.ruleBuilder.trueValuePlaceholder')}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.ruleBuilder.falseValue')}
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={rulesForm.falseValue}
            onChange={(e) => setRulesForm(prev => ({ ...prev, falseValue: e.target.value }))}
            placeholder={t('inspector.ruleBuilder.falseValuePlaceholder')}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.ruleBuilder.targetCategory')}
          </label>
          <select
            className={styles.formSelect}
            value={rulesForm.targetCategory}
            onChange={(e) => setRulesForm(prev => ({ ...prev, targetCategory: e.target.value }))}
          >
            <option value="">{t('inspector.ruleBuilder.allCategories')}</option>
            {uniqueCategories.map(cat => (
              <option key={String(cat)} value={String(cat)}>
                {String(cat)}
              </option>
            ))}
          </select>
          <div className={styles.exampleHint}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('inspector.ruleBuilder.targetCategoryHelp')}
          </div>
        </div>

        <div className={styles.actionControls}>
          <button
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => handleApplyAction('apply_categorical_rules')}
            disabled={!customCondition || !rulesForm.trueValue}
          >
            {t('inspector.ruleBuilder.applyRule')}
          </button>
        </div>
      </div>
    );
  };

  const renderGroupRareCategoriesSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actions.transform.category.groupRare.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actions.transform.category.groupRare.description')}</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actions.transform.category.groupRare.threshold')}
          </label>
          <div className={styles.formRow}>
            <input
              type="number"
              className={`${styles.formInput} ${styles.thresholdInput}`}
              value={groupRareForm.threshold}
              onChange={(e) => setGroupRareForm(prev => ({ ...prev, threshold: parseInt(e.target.value) || 5 }))}
              min="1"
            />
            <select
              className={styles.formSelect}
              value={groupRareForm.thresholdType}
              onChange={(e) => setGroupRareForm(prev => ({ ...prev, thresholdType: e.target.value }))}
            >
              <option value="count">{t('inspector.actions.transform.category.groupRare.thresholdCount')}</option>
              <option value="percentage">{t('inspector.actions.transform.category.groupRare.thresholdPercentage')}</option>
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actions.transform.category.groupRare.otherLabel')}
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={groupRareForm.otherLabel}
            onChange={(e) => setGroupRareForm(prev => ({ ...prev, otherLabel: e.target.value }))}
            placeholder={t('inspector.actions.transform.category.groupRare.otherLabelPlaceholder')}
          />
        </div>

        <div className={styles.actionControls}>
          <button 
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => handleApplyAction('group_rare_categories', {
              threshold: groupRareForm.threshold,
              thresholdType: groupRareForm.thresholdType,
              otherLabel: groupRareForm.otherLabel
            })}
            disabled={!groupRareForm.otherLabel}
          >
            {t('inspector.actions.transform.category.groupRare.apply')}
          </button>
        </div>
      </div>
    );
  };

  const renderDefaultValueAssignmentSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actions.transform.category.defaultValue.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actions.transform.category.defaultValue.description')}</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actions.transform.category.defaultValue.strategy')}
          </label>
          <select
            className={styles.formSelect}
            value={defaultValueForm.strategy}
            onChange={(e) => setDefaultValueForm(prev => ({ ...prev, strategy: e.target.value }))}
          >
            <option value="constant">{t('inspector.actions.transform.category.defaultValue.constantStrategy')}</option>
            <option value="most_frequent">{t('inspector.actions.transform.category.defaultValue.mostFrequentStrategy')}</option>
          </select>
        </div>

        {defaultValueForm.strategy === 'constant' && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t('inspector.actions.transform.category.defaultValue.defaultValue')}
            </label>
            <input
              type="text"
              className={styles.formInput}
              value={defaultValueForm.defaultValue}
              onChange={(e) => setDefaultValueForm(prev => ({ ...prev, defaultValue: e.target.value }))}
              placeholder={t('inspector.actions.transform.category.defaultValue.defaultValuePlaceholder')}
            />
          </div>
        )}

        <div className={styles.actionControls}>
          <button 
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => handleApplyAction('assign_default_value', {
              strategy: defaultValueForm.strategy,
              defaultValue: defaultValueForm.defaultValue
            })}
            disabled={defaultValueForm.strategy === 'constant' && !defaultValueForm.defaultValue}
          >
            {t('inspector.actions.transform.category.defaultValue.apply')}
          </button>
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
            {t('inspector.actionGroups.category.title')}
          </h3>
          <p className={styles.groupDescription}>
            {t('inspector.actionGroups.category.description')}
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
            {renderRenameCategoriesSection()}
            {renderMergeCategoriesSection()}
            {renderSplitCategoriesSection()}
            {renderEncodingSection()}
            {renderRulesSection()}
            {renderGroupRareCategoriesSection()}
            {renderDefaultValueAssignmentSection()}
          </div>
        </div>
      )}
    </div>
  );
}
