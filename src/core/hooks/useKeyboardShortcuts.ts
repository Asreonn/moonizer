import { useEffect } from 'react';
import { useColumnEditorStore } from '../../state/useColumnEditorStore';
import { useToast } from '../../components/common/Toast/ToastProvider';
import { useLanguage } from '../i18n/LanguageProvider';

export function useKeyboardShortcuts() {
  const { undo, redo, canUndo, canRedo } = useColumnEditorStore();
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      // Only handle shortcuts when Ctrl/Cmd is pressed
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      
      if (!isCtrlOrCmd) return;

      // Ctrl+Z or Cmd+Z for undo
      if (event.key === 'z' && !event.shiftKey && canUndo()) {
        event.preventDefault();
        const operation = undo();
        
        if (operation) {
          showToast({
            message: t('inspector.inspector.undoRedo.undone', { action: operation.description }),
            type: 'info',
            duration: 3000,
            action: {
              label: t('inspector.inspector.undoRedo.redo'),
              onClick: () => {
                redo();
              }
            }
          });
        }
        return;
      }

      // Ctrl+Shift+Z or Cmd+Shift+Z for redo
      if (event.key === 'z' && event.shiftKey && canRedo()) {
        event.preventDefault();
        const operation = redo();
        
        if (operation) {
          showToast({
            message: t('inspector.undoRedo.redone', { action: operation.description }),
            type: 'info',
            duration: 3000,
            action: {
              label: t('inspector.undoRedo.undo'),
              onClick: () => {
                undo();
              }
            }
          });
        }
        return;
      }

      // Alternative: Ctrl+Y for redo (common in Windows apps)
      if (event.key === 'y' && !event.shiftKey && canRedo()) {
        event.preventDefault();
        const operation = redo();
        
        if (operation) {
          showToast({
            message: t('inspector.undoRedo.redone', { action: operation.description }),
            type: 'info',
            duration: 3000,
            action: {
              label: t('inspector.undoRedo.undo'),
              onClick: () => {
                undo();
              }
            }
          });
        }
        return;
      }
    };

    // Add global keyboard listener
    document.addEventListener('keydown', handleKeyboard);

    return () => {
      document.removeEventListener('keydown', handleKeyboard);
    };
  }, [undo, redo, canUndo, canRedo, showToast, t]);
}