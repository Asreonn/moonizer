export interface ExportOptions {
  format: 'csv' | 'json';
  filename: string;
  columns: string[] | 'all';
  rows: 'all' | { from: number; to: number };
}

export interface ExportData {
  data: Record<string, any>[];
  columnNames: string[];
}

export function exportDataset(exportData: ExportData, options: ExportOptions): void {
  const { data, columnNames } = exportData;
  const { format, filename, columns, rows } = options;

  // Filter columns
  const selectedColumns = columns === 'all' ? columnNames : columns;
  
  // Filter rows
  let filteredData = data;
  if (rows !== 'all') {
    const startIndex = Math.max(0, rows.from - 1); // Convert to 0-based index
    const endIndex = Math.min(data.length, rows.to);
    filteredData = data.slice(startIndex, endIndex);
  }

  // Filter data by selected columns
  const exportableData = filteredData.map(row => {
    const filteredRow: Record<string, any> = {};
    selectedColumns.forEach(column => {
      filteredRow[column] = row[column];
    });
    return filteredRow;
  });

  let content: string;
  let mimeType: string;
  let fileExtension: string;

  if (format === 'csv') {
    content = convertToCSV(exportableData, selectedColumns);
    mimeType = 'text/csv';
    fileExtension = '.csv';
  } else {
    content = JSON.stringify(exportableData, null, 2);
    mimeType = 'application/json';
    fileExtension = '.json';
  }

  // Ensure filename has correct extension
  const finalFilename = filename.endsWith(fileExtension) 
    ? filename 
    : filename + fileExtension;

  // Create and download file
  downloadFile(content, finalFilename, mimeType);
}

function convertToCSV(data: Record<string, any>[], columns: string[]): string {
  if (data.length === 0) return '';

  // Create header row
  const header = columns.join(',');
  
  // Create data rows
  const rows = data.map(row => {
    return columns.map(column => {
      const value = row[column];
      
      // Handle null/undefined values
      if (value === null || value === undefined) {
        return '';
      }
      
      // Convert to string and escape if needed
      const stringValue = String(value);
      
      // If value contains comma, newline, or quotes, wrap in quotes and escape internal quotes
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  });

  return [header, ...rows].join('\n');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
}