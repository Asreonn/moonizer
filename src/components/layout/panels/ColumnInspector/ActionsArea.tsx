import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../../../core/i18n/LanguageProvider';
import { ColumnProfile } from '../../../../core/profiling/columnTypes';
import { useToast } from '../../../common/Toast/ToastProvider';
import styles from './ActionsArea.module.css';

interface ActionsAreaProps {
  profile: ColumnProfile;
  onApplyAction: (actionType: string, parameters?: any) => Promise<{ success: boolean; error?: string }>;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isMultiSelect?: boolean;
  selectedColumns?: string[];
}

interface MenuState {
  isOpen: boolean;
  chipId: 'typeCast' | 'fillMissing' | null;
  anchorElement: HTMLElement | null;
  position: { top: number; left: number; width: number; height: number } | null;
}

interface GroupState {
  transform: boolean;
  encode: boolean;
}

export function ActionsArea({ 
  profile, 
  onApplyAction, 
  canUndo, 
  canRedo, 
  onUndo, 
  onRedo,
  isMultiSelect = false,
  selectedColumns = []
}: ActionsAreaProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  
  const [menuState, setMenuState] = useState<MenuState>({
    isOpen: false,
    chipId: null,
    anchorElement: null,
    position: null
  });
  
  const [expandedGroups, setExpandedGroups] = useState<GroupState>({
    transform: false,
    encode: false
  });

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu function
  const closeMenu = useCallback(() => {
    setMenuState({
      isOpen: false,
      chipId: null,
      anchorElement: null,
      position: null
    });
  }, []);

  // Calculate optimal menu position to prevent overflow
  const calculateMenuPosition = useCallback((anchorElement: HTMLElement) => {
    const anchorRect = anchorElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 250; // Estimated menu width
    const menuHeight = 300; // Estimated menu height
    const offset = 8;

    let top = anchorRect.bottom + offset;
    let left = anchorRect.left;

    // Check if menu would overflow bottom
    if (top + menuHeight > viewportHeight) {
      top = anchorRect.top - menuHeight - offset;
    }

    // Check if menu would overflow right
    if (left + menuWidth > viewportWidth) {
      left = anchorRect.right - menuWidth;
    }

    // Check if menu would overflow left
    if (left < 0) {
      left = offset;
    }

    // If still overflowing, clamp to viewport
    if (top < 0) top = offset;
    if (top + menuHeight > viewportHeight) {
      top = viewportHeight - menuHeight - offset;
    }

    return {
      top,
      left,
      width: anchorRect.width,
      height: anchorRect.height
    };
  }, []);

  // Keyboard shortcuts for undo/redo and menu handling
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) onUndo();
      }
      
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'z') {
        event.preventDefault();
        if (canRedo) onRedo();
      }

      if (event.key === 'Escape' && menuState.isOpen) {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [canUndo, canRedo, onUndo, onRedo, menuState.isOpen, closeMenu]);

  // Handle outside clicks and window events to close menu
  useEffect(() => {
    if (!menuState.isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          menuState.anchorElement && !menuState.anchorElement.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleWindowEvents = () => {
      if (menuState.isOpen && menuState.anchorElement) {
        const newPosition = calculateMenuPosition(menuState.anchorElement);
        setMenuState(prev => ({ ...prev, position: newPosition }));
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', handleWindowEvents, true);
    window.addEventListener('resize', handleWindowEvents);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', handleWindowEvents, true);
      window.removeEventListener('resize', handleWindowEvents);
    };
  }, [menuState.isOpen, menuState.anchorElement, calculateMenuPosition, closeMenu]);

  const handleAction = useCallback(async (actionType: string, parameters?: any) => {
    try {
      const result = await onApplyAction(actionType, parameters);
      
      if (result.success) {
        showToast({
          type: 'success',
          message: t('inspector.toast.applied'),
          duration: 3000,
          action: {
            label: t('inspector.editor.header.undo'),
            onClick: onUndo
          }
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: t('inspector.error.failed', { 
          message: error instanceof Error ? error.message : 'Unknown error' 
        }),
        duration: 4000
      });
    }
    
    // Close menu after action
    closeMenu();
  }, [onApplyAction, showToast, t, onUndo, closeMenu]);

  const handleDropColumn = useCallback(() => {
    const columnName = isMultiSelect ? 
      `${selectedColumns.length} columns` : 
      profile.name;
    
    if (window.confirm(t('inspector.actions.dropColumnConfirm', { columnName }))) {
      handleAction('drop');
    }
  }, [handleAction, profile.name, t, isMultiSelect, selectedColumns.length]);

  const handleChipClick = useCallback((chipId: 'typeCast' | 'fillMissing' | 'duplicate' | 'drop', event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (chipId === 'typeCast' || chipId === 'fillMissing') {
      const anchorElement = event.currentTarget;
      const position = calculateMenuPosition(anchorElement);
      
      setMenuState({
        isOpen: true,
        chipId,
        anchorElement,
        position
      });
    } else if (chipId === 'duplicate') {
      handleAction('duplicate');
    } else if (chipId === 'drop') {
      handleDropColumn();
    }
  }, [calculateMenuPosition, handleAction, handleDropColumn]);

  const toggleGroup = useCallback((groupId: keyof GroupState) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  }, []);

  return (
    <div className={styles.actionsArea}>
      {/* Core Chip Bar */}
      <div className={styles.chipBar}>
        <div className={styles.chipsContainer}>
          <button
            className={`${styles.chip} ${styles.chipTypeCast}`}
            onClick={(e) => handleChipClick('typeCast', e)}
            aria-label={t('inspector.actions.chips.typeCast')}
          >
            <svg className={styles.chipIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
            <span className={styles.chipLabel}>{t('inspector.actions.chips.typeCast')}</span>
            <svg className={styles.chipChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <button
            className={`${styles.chip} ${styles.chipFillMissing}`}
            onClick={(e) => handleChipClick('fillMissing', e)}
            aria-label={t('inspector.actions.chips.fillMissing')}
          >
            <svg className={styles.chipIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={styles.chipLabel}>{t('inspector.actions.chips.fillMissing')}</span>
            <svg className={styles.chipChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <button
            className={`${styles.chip} ${styles.chipDuplicate}`}
            onClick={(e) => handleChipClick('duplicate', e)}
            aria-label={t('inspector.actions.chips.duplicate')}
          >
            <svg className={styles.chipIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className={styles.chipLabel}>{t('inspector.actions.chips.duplicate')}</span>
          </button>

          <button
            className={`${styles.chip} ${styles.chipDrop}`}
            onClick={(e) => handleChipClick('drop', e)}
            aria-label={t('inspector.actions.chips.drop')}
          >
            <svg className={styles.chipIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className={styles.chipLabel}>{t('inspector.actions.chips.drop')}</span>
          </button>
        </div>

        {/* Undo/Redo Controls */}
        <div className={styles.undoRedoControls}>
          <button
            className={`${styles.undoRedoButton} ${!canUndo ? styles.undoRedoButtonDisabled : ''}`}
            onClick={onUndo}
            disabled={!canUndo}
            title={`${t('inspector.editor.header.undo')} (Ctrl+Z)`}
            aria-label={t('inspector.editor.header.undo')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          
          <button
            className={`${styles.undoRedoButton} ${!canRedo ? styles.undoRedoButtonDisabled : ''}`}
            onClick={onRedo}
            disabled={!canRedo}
            title={`${t('inspector.editor.header.redo')} (Ctrl+Shift+Z)`}
            aria-label={t('inspector.editor.header.redo')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible Action Groups */}
      <div className={styles.actionGroups}>
        {/* Transform Group */}
        <div className={styles.actionGroup}>
          <button
            className={`${styles.groupHeader} ${expandedGroups.transform ? styles.groupHeaderExpanded : ''}`}
            onClick={() => toggleGroup('transform')}
            aria-expanded={expandedGroups.transform}
            aria-label={t('inspector.actions.groups.transform')}
          >
            <span className={styles.groupTitle}>{t('inspector.actions.groups.transform')}</span>
            <svg className={styles.groupChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedGroups.transform && (
            <div className={styles.groupContent}>
              {renderTransformActions()}
            </div>
          )}
        </div>

        {/* Encode Group */}
        <div className={styles.actionGroup}>
          <button
            className={`${styles.groupHeader} ${expandedGroups.encode ? styles.groupHeaderExpanded : ''}`}
            onClick={() => toggleGroup('encode')}
            aria-expanded={expandedGroups.encode}
            aria-label={t('inspector.actions.groups.encode')}
          >
            <span className={styles.groupTitle}>{t('inspector.actions.groups.encode')}</span>
            <svg className={styles.groupChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedGroups.encode && (
            <div className={styles.groupContent}>
              {renderEncodeActions()}
            </div>
          )}
        </div>
      </div>

      {/* Overflow-safe Menu Portal */}
      {menuState.isOpen && menuState.position && createPortal(
        <div 
          className={`${styles.menuPortal} ${styles.menuPortalOpen}`}
          style={{
            top: menuState.position.top,
            left: menuState.position.left,
          }}
        >
          <div 
            ref={menuRef}
            className={`${styles.menu} ${styles.menuOpen}`}
            role="menu"
            aria-label={menuState.chipId ? t(`inspector.actions.chips.${menuState.chipId}`) : undefined}
          >
            {menuState.chipId === 'typeCast' && renderTypeCastMenu()}
            {menuState.chipId === 'fillMissing' && renderFillMissingMenu()}
          </div>
        </div>,
        document.body
      )}
    </div>
  );

  // Type Cast Menu Renderer
  function renderTypeCastMenu() {
    const isDestructive = (targetType: string) => {
      if (profile.type === 'numeric' && ['text', 'categorical'].includes(targetType)) return false;
      if (profile.type === 'text' && targetType === 'datetime') return true;
      if (profile.type === 'datetime' && ['numeric', 'text'].includes(targetType)) return true;
      return false;
    };

    const handleDestructiveTypeCast = (targetType: string) => {
      if (window.confirm(t('inspector.actions.destructiveCast.confirm'))) {
        handleAction('cast', { targetType, destructive: true });
      }
    };

    const options = [
      { key: 'numeric', label: t('inspector.actions.typeCast.toNumeric'), available: profile.type !== 'numeric' },
      { key: 'text', label: t('inspector.actions.typeCast.toString'), available: profile.type !== 'text' },
      { key: 'boolean', label: t('inspector.actions.typeCast.toBoolean'), available: profile.type !== 'boolean' },
      { key: 'datetime', label: t('inspector.actions.typeCast.toDatetime'), available: profile.type !== 'datetime' },
      { key: 'categorical', label: t('inspector.actions.typeCast.toCategorical'), available: profile.type !== 'categorical' }
    ].filter(option => option.available);

    return (
      <div className={styles.menuContent}>
        <div className={styles.menuTitle}>{t('inspector.actions.chips.typeCast')}</div>
        {options.map(option => (
          <button
            key={option.key}
            className={`${styles.menuOption} ${isDestructive(option.key) ? styles.menuOptionDestructive : ''}`}
            onClick={() => {
              if (isDestructive(option.key)) {
                handleDestructiveTypeCast(option.key);
              } else {
                handleAction('cast', { targetType: option.key });
              }
            }}
            role="menuitem"
          >
            <span className={styles.optionLabel}>{option.label}</span>
            {isDestructive(option.key) && (
              <span className={styles.destructiveWarning}>⚠</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Fill Missing Menu Renderer
  function renderFillMissingMenu() {
    let options: Array<{ key: string; label: string; needsInput?: boolean }> = [];

    if (profile.type === 'numeric') {
      options = [
        { key: 'mean', label: t('inspector.actions.fillMissing.mean') },
        { key: 'median', label: t('inspector.actions.fillMissing.median') },
        { key: 'constant', label: t('inspector.actions.fillMissing.constant'), needsInput: true },
        { key: 'randomInRange', label: t('inspector.actions.fillMissing.randomInRange'), needsInput: true },
        { key: 'forwardFill', label: t('inspector.actions.fillMissing.forwardFill') },
        { key: 'backwardFill', label: t('inspector.actions.fillMissing.backwardFill') }
      ];
    } else if (profile.type === 'categorical' || profile.type === 'boolean') {
      options = [
        { key: 'mode', label: t('inspector.actions.fillMissing.mode') },
        { key: 'constant', label: t('inspector.actions.fillMissing.constant'), needsInput: true },
        { key: 'forwardFill', label: t('inspector.actions.fillMissing.forwardFill') },
        { key: 'backwardFill', label: t('inspector.actions.fillMissing.backwardFill') }
      ];
    } else if (profile.type === 'datetime') {
      options = [
        { key: 'constant', label: t('inspector.actions.fillMissing.constant'), needsInput: true },
        { key: 'forwardFill', label: t('inspector.actions.fillMissing.forwardFill') },
        { key: 'backwardFill', label: t('inspector.actions.fillMissing.backwardFill') }
      ];
    } else {
      options = [
        { key: 'constant', label: t('inspector.actions.fillMissing.constant'), needsInput: true },
        { key: 'forwardFill', label: t('inspector.actions.fillMissing.forwardFill') },
        { key: 'backwardFill', label: t('inspector.actions.fillMissing.backwardFill') }
      ];
    }

    return (
      <div className={styles.menuContent}>
        <div className={styles.menuTitle}>{t('inspector.actions.chips.fillMissing')}</div>
        {options.map(option => (
          <button
            key={option.key}
            className={styles.menuOption}
            onClick={() => {
              if (option.needsInput) {
                const value = window.prompt(`Enter value for ${option.label}:`);
                if (value !== null) {
                  handleAction('fillMissing', { strategy: option.key, value });
                }
              } else {
                handleAction('fillMissing', { strategy: option.key });
              }
            }}
            role="menuitem"
          >
            <span className={styles.optionLabel}>{option.label}</span>
            {option.needsInput && (
              <span className={styles.inputIndicator}>✏️</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Transform Actions Renderer (Type-gated)
  function renderTransformActions() {
    const actions = [];

    if (profile.type === 'numeric') {
      actions.push(
        { key: 'scale', title: t('inspector.actions.transform.scale.title'), description: t('inspector.actions.transform.scale.description'), role: 'transform' },
        { key: 'scaleCustom', title: t('inspector.actions.transform.scaleCustom.title'), description: t('inspector.actions.transform.scaleCustom.description'), role: 'transform' },
        { key: 'scaleMinusOne', title: t('inspector.actions.transform.scaleMinusOne.title'), description: t('inspector.actions.transform.scaleMinusOne.description'), role: 'transform' },
        { key: 'standardize', title: t('inspector.actions.transform.standardize.title'), description: t('inspector.actions.transform.standardize.description'), role: 'transform' },
        { key: 'robustScale', title: t('inspector.actions.transform.robustScale.title'), description: t('inspector.actions.transform.robustScale.description'), role: 'transform' },
        { key: 'clip', title: t('inspector.actions.transform.clip.title'), description: t('inspector.actions.transform.clip.description'), role: 'transform' },
        { key: 'winsorize', title: t('inspector.actions.transform.winsorize.title'), description: t('inspector.actions.transform.winsorize.description'), role: 'transform' },
        { key: 'round', title: t('inspector.actions.transform.round.title'), description: t('inspector.actions.transform.round.description'), role: 'transform' },
        { key: 'log', title: t('inspector.actions.transform.log.title'), description: t('inspector.actions.transform.log.description'), role: 'transform' },
        { key: 'sqrt', title: t('inspector.actions.transform.sqrt.title'), description: t('inspector.actions.transform.sqrt.description'), role: 'transform' },
        { key: 'binEqualWidth', title: t('inspector.actions.transform.binEqualWidth.title'), description: t('inspector.actions.transform.binEqualWidth.description'), role: 'transform' },
        { key: 'binEqualFreq', title: t('inspector.actions.transform.binEqualFreq.title'), description: t('inspector.actions.transform.binEqualFreq.description'), role: 'transform' },
        { key: 'percentChange', title: t('inspector.actions.transform.percentChange.title'), description: t('inspector.actions.transform.percentChange.description'), role: 'transform' },
        { key: 'diff', title: t('inspector.actions.transform.diff.title'), description: t('inspector.actions.transform.diff.description'), role: 'transform' },
        { key: 'demean', title: t('inspector.actions.transform.demean.title'), description: t('inspector.actions.transform.demean.description'), role: 'transform' },
        { key: 'rank', title: t('inspector.actions.transform.rank.title'), description: t('inspector.actions.transform.rank.description'), role: 'transform' },
        { key: 'qcut', title: t('inspector.actions.transform.qcut.title'), description: t('inspector.actions.transform.qcut.description'), role: 'transform' },
        { key: 'rolling', title: t('inspector.actions.transform.rolling.title'), description: t('inspector.actions.transform.rolling.description'), role: 'transform' },
        { key: 'cumulative', title: t('inspector.actions.transform.cumulative.title'), description: t('inspector.actions.transform.cumulative.description'), role: 'transform' },
        { key: 'replaceZeros', title: t('inspector.actions.transform.replaceZeros.title'), description: t('inspector.actions.transform.replaceZeros.description'), role: 'transform' },
        { key: 'clipPercentile', title: t('inspector.actions.transform.clipPercentile.title'), description: t('inspector.actions.transform.clipPercentile.description'), role: 'transform' }
      );
    } else if (profile.type === 'datetime') {
      actions.push(
        { key: 'parse', title: t('inspector.actions.transform.parse.title'), description: t('inspector.actions.transform.parse.description'), role: 'transform' },
        { key: 'timezone', title: t('inspector.actions.transform.timezone.title'), description: t('inspector.actions.transform.timezone.description'), role: 'transform' },
        { key: 'extractParts', title: t('inspector.actions.transform.extractParts.title'), description: t('inspector.actions.transform.extractParts.description'), role: 'transform' },
        { key: 'roundDate', title: t('inspector.actions.transform.roundDate.title'), description: t('inspector.actions.transform.roundDate.description'), role: 'transform' },
        { key: 'deltaSince', title: t('inspector.actions.transform.deltaSince.title'), description: t('inspector.actions.transform.deltaSince.description'), role: 'transform' },
        { key: 'isWeekend', title: t('inspector.actions.transform.isWeekend.title'), description: t('inspector.actions.transform.isWeekend.description'), role: 'transform' }
      );
    } else if (profile.type === 'text') {
      actions.push(
        { key: 'trim', title: t('inspector.actions.transform.trim.title'), description: t('inspector.actions.transform.trim.description'), role: 'transform' },
        { key: 'case', title: t('inspector.actions.transform.case.title'), description: t('inspector.actions.transform.case.description'), role: 'transform' },
        { key: 'regexReplace', title: t('inspector.actions.transform.regexReplace.title'), description: t('inspector.actions.transform.regexReplace.description'), role: 'transform' },
        { key: 'removePunctuation', title: t('inspector.actions.transform.removePunctuation.title'), description: t('inspector.actions.transform.removePunctuation.description'), role: 'transform' },
        { key: 'removeDigits', title: t('inspector.actions.transform.removeDigits.title'), description: t('inspector.actions.transform.removeDigits.description'), role: 'transform' },
        { key: 'collapseWhitespace', title: t('inspector.actions.transform.collapseWhitespace.title'), description: t('inspector.actions.transform.collapseWhitespace.description'), role: 'transform' },
        { key: 'splitByDelimiter', title: t('inspector.actions.transform.splitByDelimiter.title'), description: t('inspector.actions.transform.splitByDelimiter.description'), role: 'transform' },
        { key: 'regexExtract', title: t('inspector.actions.transform.regexExtract.title'), description: t('inspector.actions.transform.regexExtract.description'), role: 'transform' },
        { key: 'slugify', title: t('inspector.actions.transform.slugify.title'), description: t('inspector.actions.transform.slugify.description'), role: 'transform' },
        { key: 'removeStopwords', title: t('inspector.actions.transform.removeStopwords.title'), description: t('inspector.actions.transform.removeStopwords.description'), role: 'transform' }
      );
    }

    return actions.map(action => (
      <button
        key={action.key}
        className={`${styles.groupActionButton} ${styles[`groupActionButton${action.role.charAt(0).toUpperCase() + action.role.slice(1)}`]}`}
        onClick={() => handleAction(action.key)}
      >
        <span className={styles.actionTitle}>{action.title}</span>
        <span className={styles.actionDescription}>{action.description}</span>
      </button>
    ));
  }

  // Encode Actions Renderer (Categorical-focused)
  function renderEncodeActions() {
    if (profile.type !== 'categorical') return [];

    const actions = [
      { key: 'labelEncode', title: t('inspector.actions.encode.label.title'), description: t('inspector.actions.encode.label.description'), role: 'encode' },
      { key: 'oneHotEncode', title: t('inspector.actions.encode.oneHot.title'), description: t('inspector.actions.encode.oneHot.description'), role: 'encode' },
      { key: 'frequencyEncode', title: t('inspector.actions.encode.frequency.title'), description: t('inspector.actions.encode.frequency.description'), role: 'encode' },
      { key: 'renameCategories', title: t('inspector.actions.encode.renameCategories.title'), description: t('inspector.actions.encode.renameCategories.description'), role: 'encode' },
      { key: 'mergeRare', title: t('inspector.actions.encode.mergeRare.title'), description: t('inspector.actions.encode.mergeRare.description'), role: 'encode' },
      { key: 'orderCategories', title: t('inspector.actions.encode.orderCategories.title'), description: t('inspector.actions.encode.orderCategories.description'), role: 'encode' },
      { key: 'targetMeanEncode', title: t('inspector.actions.encode.targetMean.title'), description: t('inspector.actions.encode.targetMean.description'), role: 'encode' },
      { key: 'binaryEncode', title: t('inspector.actions.encode.binary.title'), description: t('inspector.actions.encode.binary.description'), role: 'encode' },
      { key: 'mapCategories', title: t('inspector.actions.encode.mapCategories.title'), description: t('inspector.actions.encode.mapCategories.description'), role: 'encode' },
      { key: 'splitCategory', title: t('inspector.actions.encode.splitCategory.title'), description: t('inspector.actions.encode.splitCategory.description'), role: 'encode' }
    ];

    return actions.map(action => (
      <button
        key={action.key}
        className={`${styles.groupActionButton} ${styles[`groupActionButton${action.role.charAt(0).toUpperCase() + action.role.slice(1)}`]}`}
        onClick={() => handleAction(action.key)}
      >
        <span className={styles.actionTitle}>{action.title}</span>
        <span className={styles.actionDescription}>{action.description}</span>
      </button>
    ));
  }
}