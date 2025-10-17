import { ReactNode } from 'react';
import { useLanguage } from '../core/i18n/LanguageProvider';
import styles from './Placeholder.module.css';

interface PlaceholderProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  chips?: Array<{
    label: string;
    icon?: ReactNode;
    onClick?: () => void;
  }>;
  size?: 'default' | 'compact';
}

export function Placeholder({ icon, title, description, chips, size = 'default' }: PlaceholderProps) {
  const { t } = useLanguage();

  const placeholderClasses = [
    styles.placeholder,
    size === 'compact' && styles['placeholder--compact'],
  ].filter(Boolean).join(' ');

  return (
    <div className={placeholderClasses}>
      <div className={styles.placeholder__content}>
        {icon && (
          <div className={styles.placeholder__icon}>
            {icon}
          </div>
        )}
        
        <h3 className={styles.placeholder__title}>
          {t(title)}
        </h3>
        
        {description && (
          <p className={styles.placeholder__description}>
            {t(description)}
          </p>
        )}
        
        {chips && chips.length > 0 && (
          <div className={styles.placeholder__chips}>
            {chips.map((chip, index) => (
              <button
                key={index}
                className={styles.helperChip}
                onClick={chip.onClick}
                type="button"
              >
                {chip.icon && (
                  <span className={styles.helperChip__icon}>
                    {chip.icon}
                  </span>
                )}
                {t(chip.label)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface SkeletonProps {
  rows?: number;
}

export function Skeleton({ rows = 3 }: SkeletonProps) {
  const rowVariants = ['short', 'medium', 'long'];
  
  return (
    <div className={styles.skeleton}>
      {Array.from({ length: rows }, (_, index) => {
        const variant = rowVariants[index % rowVariants.length];
        return (
          <div
            key={index}
            className={`${styles.skeleton__row} ${styles[`skeleton__row--${variant}`]}`}
          />
        );
      })}
    </div>
  );
}