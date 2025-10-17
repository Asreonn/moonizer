import { useCallback, useState } from 'react';
import { 
  exportChartAsPng,
  ChartExportConfig,
  ExportAppearanceOptions,
  ChartExportTranslator
} from '../export/chartPngExport';
import { ColumnProfile } from '../profiling/columnTypes';

export function useChartExport() {
  const [isExporting, setIsExporting] = useState(false);


  // New dedicated chart export - rebuilds chart in background
  const exportDedicatedChart = useCallback(async (
    columnName: string,
    columnProfile: ColumnProfile,
    data: any[],
    chartType: 'bar' | 'pie' | 'line' | 'scatter' | 'box' | 'area' | 'heatmap',
    dualOptions?: {
      isDual: boolean;
      leftChart: string;
      rightChart: string;
      syncScales: boolean;
      maxValue?: number;
    },
    appearance?: ExportAppearanceOptions,
    translate?: ChartExportTranslator
  ) => {
    try {
      setIsExporting(true);

      const resolvedAppearance: ExportAppearanceOptions = appearance ?? { mode: 'transparent' };
      const backgroundColor = resolvedAppearance.mode === 'transparent'
        ? 'transparent'
        : resolvedAppearance.mode === 'dark'
          ? '#020617'
          : '#f1f5f9';
      
      const config: ChartExportConfig = {
        columnName,
        columnProfile,
        data,
        chartType,
        width: dualOptions?.isDual ? 1200 : 800, // Wider for dual charts
        height: 600,
        backgroundColor,
        appearance: resolvedAppearance,
        dualOptions,
        translate
      };
      
      await exportChartAsPng(config);
      
    } catch (error) {
      console.error('Dedicated chart export failed:', error);
      throw new Error(`Chart export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    exportDedicatedChart,
    isExporting
  };
}
