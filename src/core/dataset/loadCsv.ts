interface CsvParseResult {
  data: Record<string, any>[];
  columns: string[];
  rows: number;
  hasHeaders: boolean;
}

interface CsvDialect {
  delimiter: string;
  quoteChar: string;
  escapeChar?: string;
}

/**
 * Detects CSV dialect by analyzing the first few lines
 */
function detectCsvDialect(sample: string): CsvDialect {
  const lines = sample.split('\n').slice(0, 5); // Analyze first 5 lines
  
  // Common delimiters to test
  const delimiters = [',', ';', '\t', '|'];
  let bestDelimiter = ',';
  let maxConsistency = 0;
  
  for (const delimiter of delimiters) {
    const columnCounts = lines
      .filter(line => line.trim())
      .map(line => line.split(delimiter).length);
    
    if (columnCounts.length === 0) continue;
    
    // Check consistency (all rows should have same column count)
    const firstCount = columnCounts[0];
    const consistency = columnCounts.filter(count => count === firstCount).length / columnCounts.length;
    
    if (consistency > maxConsistency && firstCount > 1) {
      maxConsistency = consistency;
      bestDelimiter = delimiter;
    }
  }
  
  return {
    delimiter: bestDelimiter,
    quoteChar: '"',
    escapeChar: '"'
  };
}

/**
 * Parse a single CSV line respecting quotes and escapes
 */
function parseCsvLine(line: string, dialect: CsvDialect): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (!inQuotes && char === dialect.delimiter) {
      result.push(current.trim());
      current = '';
    } else if (char === dialect.quoteChar) {
      if (inQuotes && nextChar === dialect.quoteChar) {
        // Escaped quote
        current += dialect.quoteChar;
        i++; // Skip next char
      } else {
        inQuotes = !inQuotes;
      }
    } else {
      current += char;
    }
    i++;
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Attempts to convert string values to appropriate types
 */
function inferAndConvertType(value: string): any {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  
  const trimmedValue = value.trim();
  
  // Handle empty after trimming
  if (trimmedValue === '') {
    return null;
  }
  
  // Try boolean
  const lowerValue = trimmedValue.toLowerCase();
  if (lowerValue === 'true' || lowerValue === 'false') {
    return lowerValue === 'true';
  }
  
  // Try number - but be more careful about conversion
  const numValue = Number(trimmedValue);
  if (!isNaN(numValue) && isFinite(numValue)) {
    // Verify that the string actually represents a number
    // This prevents empty strings or weird cases from becoming 0
    const numericRegex = /^-?\d*\.?\d+$/;
    if (numericRegex.test(trimmedValue)) {
      return numValue;
    }
  }
  
  // Try date (basic ISO format detection)
  if (trimmedValue.match(/^\d{4}-\d{2}-\d{2}/) || trimmedValue.match(/^\d{2}\/\d{2}\/\d{4}/)) {
    const date = new Date(trimmedValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Keep as string for display
    }
  }
  
  return trimmedValue; // Return as string
}

/**
 * Loads and parses CSV file content
 */
export async function loadCsv(file: File): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        
        if (!content || content.length === 0) {
          reject(new Error('Empty file'));
          return;
        }
        
        // Detect dialect
        const dialect = detectCsvDialect(content.slice(0, 1024)); // First 1KB for detection
        
        // Split into lines
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error('No data found'));
          return;
        }
        
        // Parse first line to determine if headers exist
        const firstLine = parseCsvLine(lines[0], dialect);
        const secondLine = lines.length > 1 ? parseCsvLine(lines[1], dialect) : null;
        
        // Heuristic: if first line values look like headers (mostly strings, no numbers)
        let hasHeaders = false;
        if (secondLine) {
          const firstLineHasNumbers = firstLine.some(val => !isNaN(Number(val)) && val.trim() !== '');
          const secondLineHasNumbers = secondLine.some(val => !isNaN(Number(val)) && val.trim() !== '');
          
          // If first line has fewer numbers than second line, likely headers
          hasHeaders = !firstLineHasNumbers && secondLineHasNumbers;
        }
        
        // Generate column names
        const columns = hasHeaders 
          ? firstLine.map((header, index) => header || `Column${index + 1}`)
          : firstLine.map((_, index) => `Column${index + 1}`);
        
        // Parse data rows
        const dataStartIndex = hasHeaders ? 1 : 0;
        const dataLines = lines.slice(dataStartIndex);
        
        const data = dataLines.map((line, index) => {
          const values = parseCsvLine(line, dialect);
          const row: Record<string, any> = {};
          
          columns.forEach((column, colIndex) => {
            const rawValue = values[colIndex] || '';
            row[column] = inferAndConvertType(rawValue);
          });
          
          // Add a stable row ID for highlighting persistence
          row.__rowId = `row_${index}`;
          
          return row;
        });
        
        resolve({
          data,
          columns: columns.filter(col => col !== '__rowId'), // Don't expose internal ID
          rows: data.length,
          hasHeaders
        });
        
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Loads sample CSV data from assets
 */
export async function loadSampleCsv(type: 'sales' | 'customers'): Promise<CsvParseResult> {
  const filename = type === 'sales' ? 'sample-sales.csv' : 'sample-customers.csv';
  
  try {
    const response = await fetch(`/src/assets/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}`);
    }
    
    const content = await response.text();
    const blob = new Blob([content], { type: 'text/csv' });
    const file = new File([blob], filename, { type: 'text/csv' });
    
    return loadCsv(file);
  } catch (_error) {
    void _error; // Suppress unused variable warning
    // Fallback to mock data if sample files are not accessible
    const mockData = type === 'sales' 
      ? [
          { date: '2023-01-01', product: 'Product A', category: 'Electronics', sales: 1200, profit: 240, region: 'North', __rowId: 'row_0' },
          { date: '2023-01-02', product: 'Product B', category: 'Clothing', sales: 850, profit: 170, region: 'South', __rowId: 'row_1' },
          { date: '2023-01-03', product: 'Product C', category: 'Electronics', sales: 2100, profit: 420, region: 'East', __rowId: 'row_2' }
        ]
      : [
          { id: 1, name: 'John Doe', email: 'john@email.com', age: 28, city: 'New York', status: 'Active', __rowId: 'row_0' },
          { id: 2, name: 'Jane Smith', email: 'jane@email.com', age: 34, city: 'Los Angeles', status: 'Active', __rowId: 'row_1' },
          { id: 3, name: 'Bob Johnson', email: 'bob@email.com', age: 42, city: 'Chicago', status: 'Inactive', __rowId: 'row_2' }
        ];
    
    return {
      data: mockData,
      columns: Object.keys(mockData[0]).filter(col => col !== '__rowId'),
      rows: mockData.length,
      hasHeaders: true
    };
  }
}