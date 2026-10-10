import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useDatasetStore } from './useDatasetStore';

export interface ColumnOperation {
  id: string;
  columnName: string;
  type: string;
  description: string;
  timestamp: Date;
  parameters: Record<string, any>;
  // Enhanced snapshot approach for reliable undo/redo
  beforeSnapshot: {
    data: any[];
    columnNames: string[];
    datasetId: string;
  };
  afterSnapshot: {
    data: any[];
    columnNames: string[];
    datasetId: string;
  };
}

export interface ColumnEditorState {
  // Current editing state
  activeColumn: string | null;
  expandedSections: Record<string, Set<string>>; // Per column expanded sections
  
  // History management
  operations: ColumnOperation[];
  currentIndex: number; // -1 means no operations, 0+ means position in operations array
  maxHistorySize: number;
  
  // UI state
  isProcessing: boolean;
  processingMessage: string;
  
  // Actions
  setActiveColumn: (columnName: string | null) => void;
  toggleSection: (columnName: string, sectionId: string) => void;
  getSectionExpanded: (columnName: string, sectionId: string) => boolean;
  
  // History actions
  addOperation: (operation: Omit<ColumnOperation, 'id' | 'timestamp'>) => void;
  addOperationWithSnapshot: (
    operation: Omit<ColumnOperation, 'id' | 'timestamp' | 'beforeSnapshot' | 'afterSnapshot'>,
    beforeData: any[],
    beforeColumns: string[],
    afterData: any[],
    afterColumns: string[]
  ) => void;
  undo: () => ColumnOperation | null;
  redo: () => ColumnOperation | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getHistory: () => ColumnOperation[];
  jumpToOperation: (index: number) => void;
  clearHistory: (columnName?: string) => void;
  
  // Processing state
  setProcessing: (isProcessing: boolean, message?: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useColumnEditorStore = create<ColumnEditorState>()(
  immer((set, get) => ({
    activeColumn: null,
    expandedSections: {},
    operations: [],
    currentIndex: -1,
    maxHistorySize: 20,
    isProcessing: false,
    processingMessage: '',

    setActiveColumn: (columnName) => set((state) => {
      state.activeColumn = columnName;
    }),

    toggleSection: (columnName, sectionId) => set((state) => {
      if (!state.expandedSections[columnName]) {
        state.expandedSections[columnName] = new Set(['overview']); // Overview expanded by default
      }
      
      const sections = state.expandedSections[columnName];
      if (sections.has(sectionId)) {
        sections.delete(sectionId);
      } else {
        sections.add(sectionId);
      }
    }),

    getSectionExpanded: (columnName, sectionId) => {
      const state = get();
      if (!state.expandedSections[columnName]) {
        return sectionId === 'overview'; // Overview expanded by default
      }
      return state.expandedSections[columnName].has(sectionId);
    },

    addOperation: (operationData) => set((state) => {
      // Create new operation - this method is for backward compatibility
      // but should include snapshots
      const operation: ColumnOperation = {
        ...operationData,
        id: generateId(),
        timestamp: new Date()
      };
      
      // If we're not at the end, remove all operations after current position
      if (state.currentIndex < state.operations.length - 1) {
        state.operations = state.operations.slice(0, state.currentIndex + 1);
      }
      
      // Add new operation
      state.operations.push(operation);
      state.currentIndex = state.operations.length - 1;
      
      // Trim history if too long
      if (state.operations.length > state.maxHistorySize) {
        const excess = state.operations.length - state.maxHistorySize;
        state.operations.splice(0, excess);
        state.currentIndex = Math.max(0, state.currentIndex - excess);
      }
    }),

    addOperationWithSnapshot: (operationData, beforeData, beforeColumns, afterData, afterColumns) => set((state) => {
      const datasetStore = useDatasetStore.getState();
      const activeDatasetId = datasetStore.activeDatasetId;
      
      if (!activeDatasetId) return;
      
      // Create new operation with complete snapshots
      const operation: ColumnOperation = {
        ...operationData,
        id: generateId(),
        timestamp: new Date(),
        beforeSnapshot: {
          data: [...beforeData],
          columnNames: [...beforeColumns],
          datasetId: activeDatasetId
        },
        afterSnapshot: {
          data: [...afterData],
          columnNames: [...afterColumns],
          datasetId: activeDatasetId
        }
      };
      
      // If we're not at the end, remove all operations after current position (linear history)
      if (state.currentIndex < state.operations.length - 1) {
        state.operations = state.operations.slice(0, state.currentIndex + 1);
      }
      
      // Add new operation
      state.operations.push(operation);
      state.currentIndex = state.operations.length - 1;
      
      // Trim history if too long
      if (state.operations.length > state.maxHistorySize) {
        const excess = state.operations.length - state.maxHistorySize;
        state.operations.splice(0, excess);
        state.currentIndex = Math.max(0, state.currentIndex - excess);
      }
    }),

    undo: () => {
      const state = get();
      if (!state.canUndo()) return null;
      
      const operation = state.operations[state.currentIndex];
      
      // Robust undo using snapshots
      if (operation.beforeSnapshot) {
        const datasetStore = useDatasetStore.getState();
        
        // Verify we're undoing the correct dataset
        if (operation.beforeSnapshot.datasetId === datasetStore.activeDatasetId) {
          // Use updateDatasetData to properly trigger reactivity
          datasetStore.updateDatasetData(
            operation.beforeSnapshot.datasetId,
            [...operation.beforeSnapshot.data],
            [...operation.beforeSnapshot.columnNames]
          );
        }
      }
      
      set((s) => {
        s.currentIndex--;
      });
      
      return operation;
    },

    redo: () => {
      const state = get();
      if (!state.canRedo()) return null;
      
      const operation = state.operations[state.currentIndex + 1];
      
      // Move index first
      set((s) => {
        s.currentIndex++;
      });
      
      // Robust redo using snapshots
      if (operation && operation.afterSnapshot) {
        const datasetStore = useDatasetStore.getState();
        
        // Verify we're redoing the correct dataset
        if (operation.afterSnapshot.datasetId === datasetStore.activeDatasetId) {
          // Use updateDatasetData to properly trigger reactivity
          datasetStore.updateDatasetData(
            operation.afterSnapshot.datasetId,
            [...operation.afterSnapshot.data],
            [...operation.afterSnapshot.columnNames]
          );
        }
      }
      
      return operation;
    },

    canUndo: () => {
      const state = get();
      return state.currentIndex >= 0;
    },

    canRedo: () => {
      const state = get();
      return state.currentIndex < state.operations.length - 1;
    },

    getHistory: () => {
      const state = get();
      return state.operations.slice().reverse().slice(0, 10); // Last 10 operations, most recent first
    },

    jumpToOperation: (index) => set((state) => {
      if (index >= -1 && index < state.operations.length) {
        state.currentIndex = index;
      }
    }),

    clearHistory: (columnName) => set((state) => {
      if (columnName) {
        // Clear history for specific column
        state.operations = state.operations.filter(op => op.columnName !== columnName);
        state.currentIndex = Math.min(state.currentIndex, state.operations.length - 1);
      } else {
        // Clear all history
        state.operations = [];
        state.currentIndex = -1;
      }
    }),

    setProcessing: (isProcessing, message = '') => set((state) => {
      state.isProcessing = isProcessing;
      state.processingMessage = message;
    }),
  }))
);