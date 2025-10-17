import { ColumnProfile } from '../../../../../core/profiling/columnTypes';
import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import styles from '../ActionGroups.module.css';

interface ConstantGroupProps {
  profile: ColumnProfile;
}

// eslint-disable-next-line no-unused-vars
export function ConstantGroup({ profile: _profile }: ConstantGroupProps) {
  const { t } = useLanguage();

  return (
    <div className={styles.actionGroup}>
      <div className={styles.actionGroupHeader}>
        <h4 className={styles.actionGroupTitle}>
          {t('inspector.actionGroups.constant.title')}
        </h4>
        <span className={styles.actionGroupDescription}>
          {t('inspector.actionGroups.constant.description')}
        </span>
      </div>
      
      <div className={styles.actionGroupContent}>
        {/* Constant-specific actions will be implemented here */}
        <div className={styles.placeholderMessage}>
          {t('inspector.placeholders.constant')}
        </div>
      </div>
    </div>
  );
}