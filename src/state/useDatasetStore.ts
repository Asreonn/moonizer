import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { loadSampleCsv } from '../core/dataset/loadCsv';
import { applyTransform, TransformOperation, TransformResult } from '../core/dataset/transforms';
import type { ColumnType } from '../core/profiling/columnTypes';

export interface Dataset {
  id: string;
  name: string;
  fileName: string;
  rows: number;
  columns: number;
  size: number;
  addedAt: Date;
  isPreloaded: boolean;
  data: any[];
  columnNames: string[];
  hasHeaders: boolean;
  // Column type overrides - key is column name, value is the overridden type
  columnTypeOverrides?: Record<string, ColumnType>;
}

interface DatasetState {
  datasets: Dataset[];
  activeDatasetId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addDataset: (dataset: Omit<Dataset, 'id' | 'addedAt'>) => void;
  removeDataset: (id: string) => void;
  setActiveDataset: (id: string | null) => void;
  renameDataset: (id: string, newName: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadSampleDataset: (type: 'sales' | 'customers') => Promise<void>;
  initializePreloadedDatasets: () => void;
  
  // Transform operations
  applyDatasetTransform: (operation: TransformOperation) => Promise<TransformResult>;
  updateDatasetData: (datasetId: string, newData: any[], newColumns?: string[], removedColumns?: string[]) => void;
  
  // Column type override operations
  setColumnTypeOverride: (columnName: string, newType: ColumnType) => void;
  removeColumnTypeOverride: (columnName: string) => void;
  getColumnTypeOverride: (columnName: string) => ColumnType | null;
  hasColumnTypeOverride: (columnName: string) => boolean;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useDatasetStore = create<DatasetState>()(
  immer((set) => ({
    datasets: [],
    activeDatasetId: null,
    isLoading: false,
    error: null,

    addDataset: (datasetData) => set((state) => {
      const newDataset: Dataset = {
        ...datasetData,
        id: generateId(),
        addedAt: new Date(),
      };
      state.datasets.push(newDataset);
      
      // Auto-select the first dataset if none is active
      if (!state.activeDatasetId) {
        state.activeDatasetId = newDataset.id;
      }
    }),

    removeDataset: (id) => set((state) => {
      const index = state.datasets.findIndex(d => d.id === id);
      if (index !== -1) {
        state.datasets.splice(index, 1);
        
        // If the removed dataset was active, select another one
        if (state.activeDatasetId === id) {
          state.activeDatasetId = state.datasets.length > 0 ? state.datasets[0].id : null;
        }
      }
    }),

    setActiveDataset: (id) => set((state) => {
      // Clear any previous loading states or errors when switching datasets
      state.isLoading = false;
      state.error = null;
      
      // Only set if the dataset actually exists
      const targetDataset = state.datasets.find(d => d.id === id);
      if (targetDataset) {
        state.activeDatasetId = id;
      } else if (id === null) {
        state.activeDatasetId = null;
      }
    }),

    renameDataset: (id, newName) => set((state) => {
      const dataset = state.datasets.find(d => d.id === id);
      if (dataset) {
        dataset.name = newName;
      }
    }),

    setLoading: (loading) => set((state) => {
      state.isLoading = loading;
    }),

    setError: (error) => set((state) => {
      state.error = error;
    }),

    loadSampleDataset: async (type: 'sales' | 'customers') => {
      try {
        const csvResult = await loadSampleCsv(type);
        const sampleId = `${type}-sample`;
        
        // Check if this sample isn't already loaded
        const existingDataset = useDatasetStore.getState().datasets.find(d => d.id === sampleId);
        if (existingDataset) {
          set((state) => {
            state.activeDatasetId = sampleId;
          });
          return;
        }
        
        const newDataset: Dataset = {
          id: sampleId,
          name: `sample-${type}`,
          fileName: `sample-${type}.csv`,
          rows: csvResult.rows,
          columns: csvResult.columns.length,
          size: type === 'sales' ? 1024 : 1280,
          addedAt: new Date(),
          isPreloaded: true,
          data: csvResult.data,
          columnNames: csvResult.columns,
          hasHeaders: csvResult.hasHeaders
        };
        
        set((state) => {
          state.datasets.push(newDataset);
          
          // Auto-select if no active dataset
          if (!state.activeDatasetId) {
            state.activeDatasetId = newDataset.id;
          }
        });
        
      } catch (error) {
        console.error('Failed to load sample dataset:', error);
        set((state) => {
          state.error = `Failed to load sample ${type} data`;
        });
      }
    },

    initializePreloadedDatasets: () => {},

    applyDatasetTransform: async (operation) => {
      const state = useDatasetStore.getState();
      const activeDataset = state.datasets.find(d => d.id === state.activeDatasetId);
      
      if (!activeDataset) {
        return { success: false, error: 'No active dataset' };
      }

      try {
        const result = await applyTransform(activeDataset.data, operation);
        
        if (result.success && result.data) {
          // Update dataset with transformed data
          state.updateDatasetData(
            activeDataset.id, 
            result.data, 
            result.newColumns, 
            result.removedColumns
          );
        }
        
        return result;
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown transformation error' 
        };
      }
    },

    updateDatasetData: (datasetId, newData, newColumns, removedColumns) => set((state) => {
      const dataset = state.datasets.find(d => d.id === datasetId);
      if (dataset) {
        dataset.data = newData;
        dataset.rows = newData.length;
        
        // For undo/redo operations where we pass complete column arrays
        // If we have newColumns but no removedColumns, this is likely an undo/redo operation
        // with a complete column list that should replace the entire column structure
        if (Array.isArray(newColumns) && !removedColumns) {
          // This is likely an undo/redo operation with complete column list
          // Filter out __rowId from column names as it's an internal identifier
          const filteredColumns = newColumns.filter(col => col !== '__rowId');
          dataset.columnNames = filteredColumns;
          dataset.columns = filteredColumns.length;
        }
        // For normal operations - handle column additions/removals incrementally
        else if (newColumns || removedColumns) {
          let updatedColumns = [...dataset.columnNames];
          
          // Remove columns first
          if (removedColumns && Array.isArray(removedColumns)) {
            updatedColumns = updatedColumns.filter(col => !removedColumns.includes(col));
          }
          
          // Add new columns (filter out __rowId)
          if (newColumns && Array.isArray(newColumns)) {
            const filteredNewColumns = newColumns.filter(col => col !== '__rowId');
            updatedColumns = [...updatedColumns, ...filteredNewColumns];
          }
          
          dataset.columnNames = updatedColumns;
          dataset.columns = updatedColumns.length;
        } 
        // Fallback: update column names based on actual data structure
        else if (newData.length > 0) {
          const actualColumns = Object.keys(newData[0]).filter(col => col !== '__rowId');
          dataset.columnNames = actualColumns;
          dataset.columns = actualColumns.length;
        }
      }
    }),

    setColumnTypeOverride: (columnName, newType) => set((state) => {
      const activeDataset = state.datasets.find(d => d.id === state.activeDatasetId);
      if (activeDataset) {
        if (!activeDataset.columnTypeOverrides) {
          activeDataset.columnTypeOverrides = {};
        }
        activeDataset.columnTypeOverrides[columnName] = newType;
      }
    }),

    removeColumnTypeOverride: (columnName) => set((state) => {
      const activeDataset = state.datasets.find(d => d.id === state.activeDatasetId);
      if (activeDataset?.columnTypeOverrides) {
        delete activeDataset.columnTypeOverrides[columnName];
      }
    }),

    getColumnTypeOverride: (columnName: string): ColumnType | null => {
      const state = useDatasetStore.getState();
      const activeDataset = state.datasets.find((d: Dataset) => d.id === state.activeDatasetId);
      return activeDataset?.columnTypeOverrides?.[columnName] || null;
    },

    hasColumnTypeOverride: (columnName: string): boolean => {
      const state = useDatasetStore.getState();
      const activeDataset = state.datasets.find((d: Dataset) => d.id === state.activeDatasetId);
      return Boolean(activeDataset?.columnTypeOverrides?.[columnName]);
    },
  }))
);
