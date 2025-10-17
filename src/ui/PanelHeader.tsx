import { ReactNode } from 'react';
import styles from './PanelHeader.module.css';

interface PanelHeaderProps {
  title: string;
  actions?: ReactNode;
  position?: 'left' | 'right' | 'center' | 'bottom';
}

export function PanelHeader({ title, actions, position = 'center' }: PanelHeaderProps) {

  return (
    <div className={`${styles.panelHeader} ${styles[`panelHeader--${position}`]}`}>
      <div className={styles.panelHeaderContent}>
        <h2 className={styles.panelTitle}>
          {title}
        </h2>
        {actions && (
          <div className={styles.panelActions}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}