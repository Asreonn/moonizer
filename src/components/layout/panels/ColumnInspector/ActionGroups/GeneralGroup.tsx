import { useState } from 'react';
import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import { ColumnProfile, ColumnType } from '../../../../../core/profiling/columnTypes';
import { useDatasetStore } from '../../../../../state/useDatasetStore';
import { useColumnEditorStore } from '../../../../../state/useColumnEditorStore';
import { useToast } from '../../../../common/Toast/ToastProvider';
import styles from '../ActionGroups.module.css';

interface GeneralGroupProps {
  profile: ColumnProfile;
}

const AVAILABLE_TYPES: ColumnType[] = [
  'numeric',
  'categorical',
  'text',
  'datetime',
  'boolean',
  'id_unique'
];

export function GeneralGroup({ profile }: GeneralGroupProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState<ColumnType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { applyDatasetTransform, setColumnTypeOverride } = useDatasetStore();
  const { addOperationWithSnapshot, undo } = useColumnEditorStore();
  const { showToast } = useToast();

  const actions = [
    'duplicate', 'delete', 'correctType'
  ];

  const handleApplyAction = async (actionKey: string) => {
    try {
      let operationData: any;
      let actionDescription: string;
      
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
        data: JSON.parse(JSON.stringify(activeDataset.data)), // Deep copy
        columnNames: [...activeDataset.columnNames]
      };
      
      if (actionKey === 'delete') {
        operationData = {
          type: 'drop',
          columnName: profile.name,
          parameters: {},
          description: t('inspector.actionGroups.general.actions.delete.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actionGroups.general.actions.delete.title'), 
          column: profile.name 
        });
      } else if (actionKey === 'duplicate') {
        // Generate unique column name
        let newColumnName = `${profile.name}_copy`;
        let counter = 1;
        const existingColumns = activeDataset.columnNames;
        
        while (existingColumns.includes(newColumnName)) {
          newColumnName = `${profile.name}_copy_${counter}`;
          counter++;
        }
        
        operationData = {
          type: 'duplicate',
          columnName: profile.name,
          parameters: { newName: newColumnName },
          description: t('inspector.actions.duplicate.title')
        };
        actionDescription = t('inspector.operation.applied', { 
          operation: t('inspector.actions.duplicate.title'), 
          column: profile.name 
        });
      } else if (actionKey === 'correctType') {
        return;
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
          data: JSON.parse(JSON.stringify(updatedDataset.data)), // Deep copy
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
              undo();
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

  const handleTypeCorrection = async () => {
    if (!selectedType || selectedType === profile.type) {
      return;
    }

    setIsProcessing(true);

    try {
      // Get current dataset data for snapshot
      const { datasets, activeDatasetId } = useDatasetStore.getState();
      const activeDataset = datasets.find((d: any) => d.id === activeDatasetId);
      
      if (!activeDataset) {
        throw new Error('No active dataset');
      }

      const beforeData = [...activeDataset.data];
      const beforeColumns = [...activeDataset.columnNames];

      // Apply the type override
      setColumnTypeOverride(profile.name, selectedType);

      // Create operation record for undo/redo
      addOperationWithSnapshot(
        {
          columnName: profile.name,
          type: 'correctType',
          description: t('inspector.typeCorrection.success', { type: selectedType }),
          parameters: { 
            fromType: profile.type, 
            toType: selectedType 
          }
        },
        beforeData,
        beforeColumns,
        beforeData, // Data doesn't change, only interpretation
        beforeColumns // Columns don't change
      );

      showToast({
        message: t('inspector.typeCorrection.success', { type: selectedType }),
        type: 'success',
        duration: 4000,
        action: {
          label: t('inspector.editor.header.undo'),
          onClick: () => undo()
        }
      });

      // Reset the form
      setSelectedType(null);
      
    } catch (error) {
      console.error('Type correction failed:', error);
      showToast({
        message: t('inspector.actionGroups.general.generalError'),
        type: 'error',
        duration: 4000
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getImpactSummary = (actionKey: string) => {
    switch (actionKey) {
      case 'delete':
        return t('inspector.actionGroups.general.impact.delete');
      case 'duplicate':
        return t('inspector.actionGroups.general.impact.duplicate');
      case 'correctType':
        return t('inspector.actionGroups.general.impact.correctType');
      default:
        return t('inspector.actionGroups.common.impact.noChanges');
    }
  };

  const getWarningMessage = (actionKey: string) => {
    if (actionKey === 'delete') {
      return t('inspector.actionGroups.common.warnings.destructive');
    }
    return null;
  };

  const getButtonClass = (actionKey: string) => {
    if (actionKey === 'delete') return `${styles.actionButton} ${styles.danger}`;
    if (actionKey === 'duplicate') return `${styles.actionButton} ${styles.success}`;
    if (actionKey === 'correctType') return `${styles.actionButton} ${styles.primary}`;
    return styles.actionButton;
  };

  const renderAction = (actionKey: string) => {
    const titleKey = `inspector.actionGroups.general.actions.${actionKey}.title`;
    const warning = getWarningMessage(actionKey);
    
    // Special handling for type correction - render inline UI
    if (actionKey === 'correctType') {
      return (
        <div key={actionKey} className={styles.actionItem}>
          <div className={styles.actionHeader}>
            <h4 className={styles.actionTitle}>
              {t(titleKey)}
            </h4>
          </div>

          <div className={styles.impactSummary}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{getImpactSummary(actionKey)}</span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t('inspector.typeCorrection.currentType')}
            </label>
            <div className={styles.typeBadge} data-type={profile.type}>
              {t(`inspector.types.${profile.type}`)}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t('inspector.typeCorrection.newType')}
            </label>
            <select
              className={styles.formSelect}
              value={selectedType || ''}
              onChange={(e) => setSelectedType(e.target.value as ColumnType)}
              disabled={isProcessing}
            >
              <option value="">{t('inspector.typeCorrection.selectType')}</option>
              {AVAILABLE_TYPES.map(type => (
                <option key={type} value={type} disabled={type === profile.type}>
                  {t(`inspector.typeCorrection.types.${type}`)}
                </option>
              ))}
            </select>
          </div>

          {selectedType && selectedType !== profile.type && (
            <div className={styles.warningMessage}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span>{t('inspector.typeCorrection.warning.message', { newType: selectedType })}</span>
            </div>
          )}

          <div className={styles.actionControls}>
            <button 
              className={`${styles.actionButton} ${styles.primary}`}
              onClick={handleTypeCorrection}
              disabled={!selectedType || selectedType === profile.type || isProcessing}
            >
              {isProcessing ? '...' : t('inspector.typeCorrection.apply')}
            </button>
            {selectedType && (
              <button 
                className={`${styles.actionButton} ${styles.secondary}`}
                onClick={() => setSelectedType(null)}
                disabled={isProcessing}
              >
                {t('inspector.typeCorrection.cancel')}
              </button>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div key={actionKey} className={styles.actionItem}>
        <div className={styles.actionHeader}>
          <h4 className={styles.actionTitle}>
            {t(titleKey)}
          </h4>
        </div>
        

        <div className={styles.impactSummary}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{getImpactSummary(actionKey)}</span>
        </div>

        {warning && (
          <div className={styles.warningMessage}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>{warning}</span>
          </div>
        )}

        <div className={styles.actionControls}>
          <button 
            className={getButtonClass(actionKey)}
            onClick={() => handleApplyAction(actionKey)}
          >
            {t(titleKey)}
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
            {t('inspector.actionGroups.general.title')}
          </h3>
          <p className={styles.groupDescription}>
            {t('inspector.actionGroups.general.description')}
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
            {actions.map(actionKey => renderAction(actionKey))}
          </div>
        </div>
      )}
    </div>
  );
}
