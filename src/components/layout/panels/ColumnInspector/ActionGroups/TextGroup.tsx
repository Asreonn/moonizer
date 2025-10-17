import { useState } from 'react';
import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import { ColumnProfile } from '../../../../../core/profiling/columnTypes';
import { useDatasetStore } from '../../../../../state/useDatasetStore';
import { useColumnEditorStore } from '../../../../../state/useColumnEditorStore';
import { useToast } from '../../../../common/Toast/ToastProvider';
import styles from '../ActionGroups.module.css';

interface TextGroupProps {
  profile: ColumnProfile;
}

export function TextGroup({ profile }: TextGroupProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [findReplaceForm, setFindReplaceForm] = useState({
    findText: '',
    replaceText: '',
    useRegex: false,
    caseSensitive: true
  });
  const [splitForm, setSplitForm] = useState({
    delimiter: ',',
    createColumns: true,
    maxColumns: 3
  });
  const [concatenateForm, setConcatenateForm] = useState({
    targetColumn: '',
    delimiter: ' ',
    removeOriginals: false
  });
  
  const { applyDatasetTransform, datasets, activeDatasetId } = useDatasetStore();
  const { addOperationWithSnapshot } = useColumnEditorStore();
  const { showToast } = useToast();

  // Text transformation actions
  const trimActions = [
    'trim_leading', 'trim_trailing', 'trim_both', 'trim_all', 'trim_normalize_inner'
  ];
  
  const caseActions = [
    'case_upper', 'case_lower', 'case_capitalize', 'case_titleCase'
  ];

  const activeDataset = datasets.find(d => d.id === activeDatasetId);
  const availableColumns = activeDataset?.columnNames.filter(col => col !== profile.name) || [];

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
      
      if (trimActions.includes(actionKey)) {
        const trimType = actionKey.replace('trim_', '');
        operationData = {
          type: 'text_transform',
          columnName: profile.name,
          parameters: { 
            transformType: 'trim',
            trimType
          },
          description: t(`inspector.actions.transform.text.trim.${trimType}.title`)
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t(`inspector.actions.transform.text.trim.${trimType}.title`), 
          column: profile.name 
        });
      } else if (caseActions.includes(actionKey)) {
        const caseType = actionKey.replace('case_', '');
        operationData = {
          type: 'text_transform',
          columnName: profile.name,
          parameters: { 
            transformType: 'case',
            caseType
          },
          description: t(`inspector.actions.transform.text.case.${caseType}.title`)
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t(`inspector.actions.transform.text.case.${caseType}.title`), 
          column: profile.name 
        });
      } else if (actionKey === 'find_replace') {
        operationData = {
          type: 'find_replace',
          columnName: profile.name,
          parameters: {
            findText: params.findText,
            replaceText: params.replaceText,
            useRegex: params.useRegex,
            caseSensitive: params.caseSensitive
          },
          description: t('inspector.actions.transform.text.findReplace.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.transform.text.findReplace.title'), 
          column: profile.name 
        });
      } else if (actionKey === 'split_delimiter') {
        operationData = {
          type: 'split_delimiter',
          columnName: profile.name,
          parameters: {
            delimiter: params.delimiter,
            createColumns: params.createColumns,
            maxColumns: params.maxColumns
          },
          description: t('inspector.actions.transform.text.split.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.transform.text.split.title'), 
          column: profile.name 
        });
      } else if (actionKey === 'concatenate') {
        operationData = {
          type: 'concatenate',
          columnName: profile.name,
          parameters: {
            targetColumn: params.targetColumn,
            delimiter: params.delimiter,
            removeOriginals: params.removeOriginals
          },
          description: t('inspector.actions.transform.text.concatenate.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.transform.text.concatenate.title'), 
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

  const renderTrimWhitespaceSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actions.transform.text.trim.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actions.transform.text.trim.description')}</span>
        </div>

        <div className={styles.optionsGrid}>
          {trimActions.map(action => {
            const trimType = action.replace('trim_', '');
            return (
              <button
                key={action}
                className={`${styles.actionButton} ${styles.secondary}`}
                onClick={() => handleApplyAction(action)}
                title={t(`inspector.actions.transform.text.trim.${trimType}.description`)}
              >
                {t(`inspector.actions.transform.text.trim.${trimType}.title`)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCaseConversionSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actions.transform.text.case.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actions.transform.text.case.description')}</span>
        </div>

        <div className={styles.optionsGrid}>
          {caseActions.map(action => {
            const caseType = action.replace('case_', '');
            return (
              <button
                key={action}
                className={`${styles.actionButton} ${styles.secondary}`}
                onClick={() => handleApplyAction(action)}
                title={t(`inspector.actions.transform.text.case.${caseType}.description`)}
              >
                {t(`inspector.actions.transform.text.case.${caseType}.title`)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFindReplaceSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actions.transform.text.findReplace.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actions.transform.text.findReplace.description')}</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actions.transform.text.findReplace.findText')}
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={findReplaceForm.findText}
            onChange={(e) => setFindReplaceForm(prev => ({ ...prev, findText: e.target.value }))}
            placeholder={t('inspector.actions.transform.text.findReplace.findPlaceholder')}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actions.transform.text.findReplace.replaceText')}
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={findReplaceForm.replaceText}
            onChange={(e) => setFindReplaceForm(prev => ({ ...prev, replaceText: e.target.value }))}
            placeholder={t('inspector.actions.transform.text.findReplace.replacePlaceholder')}
          />
        </div>

        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={findReplaceForm.useRegex}
              onChange={(e) => setFindReplaceForm(prev => ({ ...prev, useRegex: e.target.checked }))}
            />
            <span className={styles.checkboxText}>
              {t('inspector.actions.transform.text.findReplace.useRegex')}
            </span>
          </label>
          
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={findReplaceForm.caseSensitive}
              onChange={(e) => setFindReplaceForm(prev => ({ ...prev, caseSensitive: e.target.checked }))}
            />
            <span className={styles.checkboxText}>
              {t('inspector.actions.transform.text.findReplace.caseSensitive')}
            </span>
          </label>
        </div>

        <div className={styles.actionControls}>
          <button 
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => handleApplyAction('find_replace', findReplaceForm)}
            disabled={!findReplaceForm.findText}
          >
            {t('inspector.actions.transform.text.findReplace.apply')}
          </button>
        </div>
      </div>
    );
  };

  const renderSplitDelimiterSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actions.transform.text.split.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actions.transform.text.split.description')}</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actions.transform.text.split.delimiter')}
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={splitForm.delimiter}
            onChange={(e) => setSplitForm(prev => ({ ...prev, delimiter: e.target.value }))}
            placeholder={t('inspector.actions.transform.text.split.delimiterPlaceholder')}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actions.transform.text.split.maxColumns')}
          </label>
          <input
            type="number"
            className={styles.formInput}
            value={splitForm.maxColumns}
            onChange={(e) => setSplitForm(prev => ({ ...prev, maxColumns: parseInt(e.target.value) || 3 }))}
            min="2"
            max="10"
          />
        </div>

        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={splitForm.createColumns}
              onChange={(e) => setSplitForm(prev => ({ ...prev, createColumns: e.target.checked }))}
            />
            <span className={styles.checkboxText}>
              {t('inspector.actions.transform.text.split.createColumns')}
            </span>
          </label>
        </div>

        <div className={styles.actionControls}>
          <button 
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => handleApplyAction('split_delimiter', splitForm)}
            disabled={!splitForm.delimiter}
          >
            {t('inspector.actions.transform.text.split.apply')}
          </button>
        </div>
      </div>
    );
  };

  const renderConcatenateSection = () => {
    return (
      <div className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t('inspector.actions.transform.text.concatenate.title')}
          </h4>
        </div>
        
        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('inspector.actions.transform.text.concatenate.description')}</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actions.transform.text.concatenate.targetColumn')}
          </label>
          <select
            className={styles.formSelect}
            value={concatenateForm.targetColumn}
            onChange={(e) => setConcatenateForm(prev => ({ ...prev, targetColumn: e.target.value }))}
          >
            <option value="">{t('inspector.actions.transform.text.concatenate.selectColumn')}</option>
            {availableColumns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {t('inspector.actions.transform.text.concatenate.delimiter')}
          </label>
          <input
            type="text"
            className={styles.formInput}
            value={concatenateForm.delimiter}
            onChange={(e) => setConcatenateForm(prev => ({ ...prev, delimiter: e.target.value }))}
            placeholder={t('inspector.actions.transform.text.concatenate.delimiterPlaceholder')}
          />
        </div>

        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={concatenateForm.removeOriginals}
              onChange={(e) => setConcatenateForm(prev => ({ ...prev, removeOriginals: e.target.checked }))}
            />
            <span className={styles.checkboxText}>
              {t('inspector.actions.transform.text.concatenate.removeOriginals')}
            </span>
          </label>
        </div>

        <div className={styles.actionControls}>
          <button 
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={() => handleApplyAction('concatenate', concatenateForm)}
            disabled={!concatenateForm.targetColumn}
          >
            {t('inspector.actions.transform.text.concatenate.apply')}
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
            {t('inspector.actionGroups.text.title')}
          </h3>
          <p className={styles.groupDescription}>
            {t('inspector.actionGroups.text.description')}
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
            {renderTrimWhitespaceSection()}
            {renderCaseConversionSection()}
            {renderFindReplaceSection()}
            {renderSplitDelimiterSection()}
            {renderConcatenateSection()}
          </div>
        </div>
      )}
    </div>
  );
}
