import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type ColoringMode = 'Type' | 'Sign' | 'Delta' | 'Outliers' | 'Quartiles' | 'Heatmap';

// Mode-specific filter types
export type TypeFilter = 'All' | 'Numeric' | 'Text' | 'Categorical' | 'DateTime' | 'Boolean' | 'IdUnique' | 'Constant';
export type SignFilter = 'All' | 'Positives' | 'Negatives' | 'Zeros';
export type DeltaFilter = 'All' | 'Increased' | 'Decreased' | 'Unchanged' | 'FirstRow';
export type OutlierFilter = 'All' | 'Outliers' | 'Normal' | 'Extreme';
export type QuartileFilter = 'All' | 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type HeatmapFilter = 'All' | 'Hot' | 'Warm' | 'Cool' | 'Cold';

export type ShowFilter = TypeFilter | SignFilter | DeltaFilter | OutlierFilter | QuartileFilter | HeatmapFilter;

interface CellSelection {
  rowKey: string;
  colKey: string;
}

interface DataViewState {
  // Cell coloring
  coloringMode: ColoringMode;
  showFilter: ShowFilter;
  
  // Multi-cell selection
  selectedCells: CellSelection[];
  
  // Actions
  setColoringMode: (mode: ColoringMode) => void;
  setShowFilter: (filter: ShowFilter) => void;
  addCellSelection: (rowKey: string, colKey: string) => void;
  removeCellSelection: (rowKey: string, colKey: string) => void;
  toggleCellSelection: (rowKey: string, colKey: string) => void;
  clearAllSelections: () => void;
  removeLastSelection: () => void;
  isCellSelected: (rowKey: string, colKey: string) => boolean;
  hasSelections: () => boolean;
}

export const useDataViewStore = create<DataViewState>()(
  immer((set, get) => ({
    // Default state
    coloringMode: 'Type',
    showFilter: 'All',
    selectedCells: [],

    // Actions
    setColoringMode: (mode) => set((state) => {
      state.coloringMode = mode;
      // Reset show filter to appropriate default when switching modes
      switch (mode) {
        case 'Type':
          state.showFilter = 'All' as TypeFilter;
          break;
        case 'Sign':
          state.showFilter = 'All' as SignFilter;
          break;
        case 'Delta':
          state.showFilter = 'All' as DeltaFilter;
          break;
        case 'Outliers':
          state.showFilter = 'All' as OutlierFilter;
          break;
        case 'Quartiles':
          state.showFilter = 'All' as QuartileFilter;
          break;
        case 'Heatmap':
          state.showFilter = 'All' as HeatmapFilter;
          break;
      }
    }),

    setShowFilter: (filter) => set((state) => {
      state.showFilter = filter;
    }),

    addCellSelection: (rowKey, colKey) => set((state) => {
      const exists = state.selectedCells.some(
        cell => cell.rowKey === rowKey && cell.colKey === colKey
      );
      if (!exists) {
        state.selectedCells.push({ rowKey, colKey });
      }
    }),

    removeCellSelection: (rowKey, colKey) => set((state) => {
      state.selectedCells = state.selectedCells.filter(
        cell => !(cell.rowKey === rowKey && cell.colKey === colKey)
      );
    }),

    toggleCellSelection: (rowKey, colKey) => {
      const { selectedCells, addCellSelection, removeCellSelection } = get();
      const exists = selectedCells.some(
        cell => cell.rowKey === rowKey && cell.colKey === colKey
      );
      
      if (exists) {
        removeCellSelection(rowKey, colKey);
      } else {
        addCellSelection(rowKey, colKey);
      }
    },

    clearAllSelections: () => set((state) => {
      state.selectedCells = [];
    }),

    removeLastSelection: () => set((state) => {
      if (state.selectedCells.length > 0) {
        state.selectedCells.pop();
      }
    }),

    isCellSelected: (rowKey, colKey) => {
      const { selectedCells } = get();
      return selectedCells.some(
        cell => cell.rowKey === rowKey && cell.colKey === colKey
      );
    },

    hasSelections: () => {
      const { selectedCells } = get();
      return selectedCells.length > 0;
    },
  }))
);