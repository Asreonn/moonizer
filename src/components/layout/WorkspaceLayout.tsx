import { useLayoutStore } from '../../state/useLayoutStore';
import { useColumnEditorStore } from '../../state/useColumnEditorStore';
import { useDatasetStore } from '../../state/useDatasetStore';
import { useLanguage } from '../../core/i18n/LanguageProvider';
import { classifyColumnTypeWithOverride } from '../../core/profiling/columnTypes';
import { useToast } from '../common/Toast/ToastProvider';
import { PanelToggle } from '../../ui/PanelToggle';
import { PanelHeader } from '../../ui/PanelHeader';
import typeBadgeStyles from './panels/ColumnInspector/ColumnDetailsCard.module.css';
import { DatasetManagerPanel } from './panels/DatasetManager/DatasetManagerPanel';
import { DataViewGrid } from './panels/DataView/DataViewGrid';
import { DataExplorerPanel } from './panels/DataExplorer/DataExplorerPanel';
import { ColumnInspectorPanel } from './panels/ColumnInspector/ColumnInspectorPanel';
import { ExportPanel } from './panels/ExportPanel/ExportPanel';

export function WorkspaceLayout() {
  const { t, language, setLanguage } = useLanguage();
  const { undo, redo, canUndo, canRedo, activeColumn } = useColumnEditorStore();
  const { datasets, activeDatasetId } = useDatasetStore();
  const { showToast } = useToast();
  
  // Get the active dataset object
  const activeDataset = datasets.find(d => d.id === activeDatasetId);
  const columnTypeOverrides = activeDataset?.columnTypeOverrides;
  const {
    leftPanelOpen,
    rightPanelOpen,
    dataExplorerOpen,
    exportPanelOpen,
    toggleLeftPanel,
    toggleRightPanel,
    toggleDataExplorer,
    closeExportPanel,
  } = useLayoutStore();

  
  
  const getDataExplorerTitle = () => {
    if (activeColumn) {
      return t('dataExplorer.titleWithColumn', { columnName: activeColumn });
    }
    return t('dataExplorer.title');
  };

  const getActiveColumnType = () => {
    if (!activeColumn || !activeDataset?.data) return null;
    
    const columnData = activeDataset.data.map(row => row[activeColumn]);
    const override = columnTypeOverrides?.[activeColumn];
    return classifyColumnTypeWithOverride(columnData, activeColumn, override);
  };

  const getDataExplorerActions = () => {
    const activeColumnType = getActiveColumnType();
    
    return (
      <>
        {activeColumn && activeColumnType && (
          <span className={`${typeBadgeStyles.typeBadge} ${typeBadgeStyles[`typeBadge--${activeColumnType}`]}`}>
            {t(`dataExplorer.types.${activeColumnType}`)}
          </span>
        )}
        <PanelToggle
          position="bottom"
          isOpen={dataExplorerOpen}
          onClick={toggleDataExplorer}
          ariaLabel="dataExplorer.actions.toggle"
          inHeader={true}
        />
      </>
    );
  };

  const handleUndo = () => {
    const operation = undo();
    if (operation) {
      showToast({
        message: t('inspector.undoRedo.undone', { action: operation.description }),
        type: 'info',
        duration: 3000,
        action: {
          label: t('inspector.undoRedo.redo'),
          onClick: () => {
            redo();
          }
        }
      });
    }
  };

  const handleRedo = () => {
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
  };

  const workspaceClasses = [
    'workspace',
    !leftPanelOpen && 'workspace--leftCollapsed',
    !rightPanelOpen && 'workspace--rightCollapsed',
    dataExplorerOpen && 'workspace--dataExplorerOpen',
    exportPanelOpen && 'workspace--exportPanelOpen',
  ].filter(Boolean).join(' ');

  const centerClasses = [
    'workspace__center',
    dataExplorerOpen && 'workspace__center--dataExplorerExpanded',
  ].filter(Boolean).join(' ');

  const dataExplorerClasses = [
    'workspace__dataExplorer',
    dataExplorerOpen && 'workspace__dataExplorer--expanded',
  ].filter(Boolean).join(' ');


  return (
    <div className={workspaceClasses}>
      {/* Left Panel */}
      {leftPanelOpen ? (
        <div className="panel panel--left">
          <PanelHeader 
            title={exportPanelOpen ? t('panels.export_panel') : t('panels.dataset_manager')} 
            position="left"
            actions={
              <>
                {exportPanelOpen && (
                  <button
                    className="undoRedoBtn"
                    onClick={closeExportPanel}
                    title={t('dataset.export.actions.close')}
                    aria-label={t('dataset.export.actions.close')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                )}
                <select
                  className="langSelector"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en')}
                  title={t('settings.language')}
                >
                  <option value="en">EN</option>
                  <option value="tr">TR</option>
                </select>
                <PanelToggle
                  position="left"
                  isOpen={leftPanelOpen}
                  onClick={toggleLeftPanel}
                  ariaLabel="buttons.toggle_left"
                  inHeader={true}
                />
              </>
            }
          />
          <div className="panel__content">
            {exportPanelOpen ? <ExportPanel /> : <DatasetManagerPanel />}
          </div>
        </div>
      ) : (
        <div className="panelGutter panelGutter--left">
          <PanelToggle
            position="right"
            isOpen={leftPanelOpen}
            onClick={toggleLeftPanel}
            ariaLabel="buttons.toggle_left"
          />
        </div>
      )}

      {/* Center Area */}
      <div className={centerClasses}>
        <div className="workspace__dataView">
          <PanelHeader 
            title={t('panels.data_view')} 
            position="center"
          />
          <DataViewGrid />
        </div>
        
        {dataExplorerOpen ? (
          <div className={dataExplorerClasses}>
            <PanelHeader 
              title={getDataExplorerTitle()} 
              position="bottom"
              actions={getDataExplorerActions()}
            />
            <div className="panel__content">
              <DataExplorerPanel />
            </div>
          </div>
        ) : (
          <div className="panelGutter panelGutter--dataExplorer">
            <PanelToggle
              position="top"
              isOpen={dataExplorerOpen}
              onClick={toggleDataExplorer}
              ariaLabel="dataExplorer.actions.toggle"
              variant="dataExplorer"
            />
          </div>
        )}
      </div>

      {/* Right Panel */}
      {rightPanelOpen ? (
        <div className="panel panel--right">
          <PanelHeader 
            title={t('panels.column_inspector')} 
            position="right"
            actions={
              <>
                <button 
                  className="undoRedoBtn"
                  onClick={handleUndo}
                  disabled={!canUndo()}
                  title={canUndo() ? t('inspector.undoRedo.undo') : t('inspector.editor.header.noUndoHistory')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v6h6"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
                  </svg>
                </button>
                <button 
                  className="undoRedoBtn"
                  onClick={handleRedo}
                  disabled={!canRedo()}
                  title={canRedo() ? t('inspector.undoRedo.redo') : t('inspector.editor.header.noRedoHistory')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 7v6h-6"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
                  </svg>
                </button>
                <PanelToggle
                  position="right"
                  isOpen={rightPanelOpen}
                  onClick={toggleRightPanel}
                  ariaLabel="buttons.toggle_right"
                  inHeader={true}
                />
              </>
            }
          />
          <div className="panel__content">
            <ColumnInspectorPanel />
          </div>
        </div>
      ) : (
        <div className="panelGutter panelGutter--right">
          <PanelToggle
            position="left"
            isOpen={rightPanelOpen}
            onClick={toggleRightPanel}
            ariaLabel="buttons.toggle_right"
          />
        </div>
      )}
    </div>
  );
}