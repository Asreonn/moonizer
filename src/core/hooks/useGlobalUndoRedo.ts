import { useEffect } from 'react';
import { useColumnEditorStore } from '../../state/useColumnEditorStore';
import { useToast } from '../../components/common/Toast/ToastProvider';
import { useLanguage } from '../i18n/LanguageProvider';

export function useGlobalUndoRedo() {
  const { undo, redo, canUndo, canRedo } = useColumnEditorStore();
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent undo/redo when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Check for Ctrl+Z (undo)
      if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo()) {
          const operation = undo();
          if (operation) {
            showToast({
              message: t('inspector.operation.undone', { operation: operation.description }),
              type: 'info',
              duration: 3000,
              action: {
                label: t('inspector.editor.header.redo'),
                onClick: () => {
                  redo();
                }
              }
            });
          }
        } else {
          showToast({
            message: t('inspector.editor.header.noUndoHistory'),
            type: 'info',
            duration: 2000
          });
        }
      }

      // Check for Ctrl+Shift+Z (redo)
      if (event.ctrlKey && event.shiftKey && event.key === 'Z') {
        event.preventDefault();
        if (canRedo()) {
          const operation = redo();
          if (operation) {
            showToast({
              message: t('inspector.operation.redone', { operation: operation.description }),
              type: 'info',
              duration: 3000
            });
          }
        } else {
          showToast({
            message: t('inspector.editor.header.noRedoHistory'),
            type: 'info',
            duration: 2000
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, showToast, t]);

  return { undo, redo, canUndo, canRedo };
}