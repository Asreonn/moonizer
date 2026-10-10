import { useState } from 'react';
import { useLanguage } from '@/core/i18n/LanguageProvider';
import { useDatasetStore } from '@/state/useDatasetStore';
import { useColumnEditorStore } from '@/state/useColumnEditorStore';
import type { ColumnType } from '@/core/profiling/columnTypes';
import styles from './TypeCorrectionModal.module.css';

interface TypeCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnName: string;
  currentType: ColumnType;
  onSuccess?: () => void;
}

const AVAILABLE_TYPES: ColumnType[] = [
  'numeric',
  'categorical',
  'text',
  'datetime',
  'boolean',
  'id_unique'
];

export default function TypeCorrectionModal({
  isOpen,
  onClose,
  columnName,
  currentType,
  onSuccess
}: TypeCorrectionModalProps) {
  const { t } = useLanguage();
  const { setColumnTypeOverride } = useDatasetStore();
  const { addOperationWithSnapshot } = useColumnEditorStore();
  const [selectedType, setSelectedType] = useState<ColumnType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleApply = async () => {
    if (!selectedType || selectedType === currentType) {
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
      setColumnTypeOverride(columnName, selectedType);

      // Create operation record for undo/redo
      addOperationWithSnapshot(
        {
          columnName,
          type: 'correctType',
          description: t('inspector.typeCorrection.success', { type: selectedType }),
          parameters: { 
            fromType: currentType, 
            toType: selectedType 
          }
        },
        beforeData,
        beforeColumns,
        beforeData, // Data doesn't change, only interpretation
        beforeColumns // Columns don't change
      );

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Type correction failed:', error);
      // Could show error toast here
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setSelectedType(null);
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {t('inspector.typeCorrection.title')}
          </h3>
          <button 
            className={styles.closeButton}
            onClick={handleCancel}
            disabled={isProcessing}
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>
            {t('inspector.typeCorrection.description')}
          </p>

          <div className={styles.currentType}>
            <label className={styles.label}>
              {t('inspector.typeCorrection.currentType')}
            </label>
            <div className={styles.typeBadge} data-type={currentType}>
              {t(`inspector.types.${currentType}`)}
            </div>
          </div>

          <div className={styles.typeSelection}>
            <label className={styles.label}>
              {t('inspector.typeCorrection.newType')}
            </label>
            <select
              className={styles.select}
              value={selectedType || ''}
              onChange={(e) => setSelectedType(e.target.value as ColumnType)}
              disabled={isProcessing}
            >
              <option value="">{t('inspector.typeCorrection.selectType')}</option>
              {AVAILABLE_TYPES.map(type => (
                <option key={type} value={type} disabled={type === currentType}>
                  {t(`inspector.typeCorrection.types.${type}`)}
                </option>
              ))}
            </select>
          </div>

          {selectedType && selectedType !== currentType && (
            <div className={styles.warning}>
              <div className={styles.warningHeader}>
                <strong>{t('inspector.typeCorrection.warning.title')}</strong>
              </div>
              <p className={styles.warningMessage}>
                {t('inspector.typeCorrection.warning.message', { newType: selectedType })}
              </p>
              <div className={styles.consequences}>
                <strong>{t('inspector.typeCorrection.warning.consequences')}</strong>
                <ul>
                  <li>{t('inspector.typeCorrection.warning.wrongOperations')}</li>
                  <li>{t('inspector.typeCorrection.warning.incorrectAnalysis')}</li>
                  <li>{t('inspector.typeCorrection.warning.filteringIssues')}</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.applyButton}
            onClick={handleApply}
            disabled={!selectedType || selectedType === currentType || isProcessing}
          >
            {isProcessing ? '...' : t('inspector.typeCorrection.apply')}
          </button>
        </div>
      </div>
    </div>
  );
}