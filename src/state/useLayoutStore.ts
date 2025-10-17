import { create } from 'zustand';

interface LayoutState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  dataExplorerOpen: boolean;
  exportPanelOpen: boolean;
  exportPanelDatasetId: string | null;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleDataExplorer: () => void;
  toggleExportPanel: () => void;
  openExportPanel: (datasetId: string) => void;
  closeExportPanel: () => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  leftPanelOpen: true,
  rightPanelOpen: true,
  dataExplorerOpen: true,
  exportPanelOpen: false,
  exportPanelDatasetId: null,
  toggleLeftPanel: () =>
    set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  toggleRightPanel: () =>
    set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  toggleDataExplorer: () =>
    set((state) => ({ dataExplorerOpen: !state.dataExplorerOpen })),
  toggleExportPanel: () =>
    set((state) => ({ exportPanelOpen: !state.exportPanelOpen })),
  openExportPanel: (datasetId: string) =>
    set(() => ({ exportPanelOpen: true, exportPanelDatasetId: datasetId })),
  closeExportPanel: () =>
    set(() => ({ exportPanelOpen: false, exportPanelDatasetId: null })),
}));