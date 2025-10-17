// Data Transformation Pipeline
export interface TransformOperation {
  id: string;
  type: string;
  columnName: string;
  parameters: Record<string, any>;
  timestamp: Date;
  description: string;
}

export interface TransformResult {
  success: boolean;
  data?: any[];
  error?: string;
  undoData?: any;
  newColumns?: string[];
  removedColumns?: string[];
}

// Rounding operations
export function roundColumn(data: any[], columnName: string, params: { method: string; decimals: number }): TransformResult {
  try {
    const newData = data.map(row => {
      const value = row[columnName];
      if (value == null || isNaN(value)) {
        return row;
      }
      
      const num = parseFloat(value);
      let rounded;
      
      switch (params.method) {
        case 'nearest':
          rounded = Math.round(num * Math.pow(10, params.decimals)) / Math.pow(10, params.decimals);
          break;
        case 'ceil':
          rounded = Math.ceil(num * Math.pow(10, params.decimals)) / Math.pow(10, params.decimals);
          break;
        case 'floor':
          rounded = Math.floor(num * Math.pow(10, params.decimals)) / Math.pow(10, params.decimals);
          break;
        case 'banker': {
          // Banker's rounding (round half to even)
          const shifted = num * Math.pow(10, params.decimals);
          const fractional = shifted - Math.floor(shifted);
          if (fractional === 0.5) {
            rounded = (Math.floor(shifted) % 2 === 0 ? Math.floor(shifted) : Math.ceil(shifted)) / Math.pow(10, params.decimals);
          } else {
            rounded = Math.round(shifted) / Math.pow(10, params.decimals);
          }
          break;
        }
        default:
          rounded = Math.round(num * Math.pow(10, params.decimals)) / Math.pow(10, params.decimals);
      }
      
      return {
        ...row,
        [columnName]: rounded
      };
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown rounding error' 
    };
  }
}

// Basic arithmetic operations
export function arithmeticColumn(data: any[], columnName: string, params: { operation: string; value: number }): TransformResult {
  try {
    // Check for divide by zero upfront
    if (params.operation === 'divide' && params.value === 0) {
      return { success: false, error: 'Cannot divide by zero' };
    }
    
    const newData = data.map(row => {
      const value = row[columnName];
      if (value == null || isNaN(value)) {
        return row;
      }
      
      const num = parseFloat(value);
      let result;
      
      switch (params.operation) {
        case 'multiply':
          result = num * params.value;
          break;
        case 'divide':
          result = num / params.value;
          break;
        case 'add':
          result = num + params.value;
          break;
        case 'subtract':
          result = num - params.value;
          break;
        default:
          return row;
      }
      
      return {
        ...row,
        [columnName]: result
      };
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown arithmetic error' 
    };
  }
}

// Math transformations
export function mathTransformColumn(data: any[], columnName: string, params: { operation: string; powerValue?: number }): TransformResult {
  try {
    // Pre-validate for operations that might fail
    const values = data.map(row => row[columnName]).filter(val => val != null && !isNaN(val)).map(val => parseFloat(val));
    
    if (params.operation === 'log' || params.operation === 'log10' || params.operation === 'log2') {
      const hasNonPositive = values.some(val => val <= 0);
      if (hasNonPositive) {
        return { success: false, error: 'Cannot take logarithm of zero or negative number' };
      }
    }
    
    if (params.operation === 'sqrt') {
      const hasNegative = values.some(val => val < 0);
      if (hasNegative) {
        return { success: false, error: 'Cannot take square root of negative number' };
      }
    }
    
    const newData = data.map(row => {
      const value = row[columnName];
      if (value == null || isNaN(value)) {
        return row;
      }
      
      const num = parseFloat(value);
      let result;
      
      switch (params.operation) {
        case 'abs':
          result = Math.abs(num);
          break;
        case 'log':
          result = Math.log(num);
          break;
        case 'log10':
          result = Math.log10(num);
          break;
        case 'log2':
          result = Math.log2(num);
          break;
        case 'exp':
          result = Math.exp(num);
          break;
        case 'sqrt':
          result = Math.sqrt(num);
          break;
        case 'square':
          result = num * num;
          break;
        case 'power':
          result = Math.pow(num, params.powerValue || 2);
          break;
        default:
          return row;
      }
      
      return {
        ...row,
        [columnName]: result
      };
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown math transformation error' 
    };
  }
}

// Binning operations
export function binColumn(data: any[], columnName: string, params: { method: string; bins: number }): TransformResult {
  try {
    const values = data.map(row => row[columnName]).filter(val => val != null && !isNaN(val)).map(val => parseFloat(val));
    
    if (values.length === 0) {
      return { success: false, error: 'No valid numeric values found for binning' };
    }

    const sortedValues = values.sort((a, b) => a - b);
    const min = sortedValues[0];
    const max = sortedValues[sortedValues.length - 1];
    
    let bins: { min: number; max: number; label: string }[] = [];
    
    switch (params.method) {
      case 'equal_width': {
        const range = max - min;
        const binWidth = range / params.bins;
        for (let i = 0; i < params.bins; i++) {
          const binMin = min + i * binWidth;
          const binMax = i === params.bins - 1 ? max : min + (i + 1) * binWidth;
          bins.push({
            min: binMin,
            max: binMax,
            label: `[${binMin.toFixed(2)}, ${binMax.toFixed(2)}${i === params.bins - 1 ? ']' : ')'}`
          });
        }
        break;
      }
      case 'equal_freq': {
        const valuesPerBin = Math.ceil(sortedValues.length / params.bins);
        for (let i = 0; i < params.bins; i++) {
          const startIndex = i * valuesPerBin;
          const endIndex = Math.min((i + 1) * valuesPerBin - 1, sortedValues.length - 1);
          const binMin = sortedValues[startIndex];
          const binMax = sortedValues[endIndex];
          bins.push({
            min: binMin,
            max: binMax,
            label: `Bin ${i + 1} [${binMin.toFixed(2)}, ${binMax.toFixed(2)}]`
          });
        }
        break;
      }
      case 'quantile': {
        for (let i = 0; i < params.bins; i++) {
          const quantileStart = i / params.bins;
          const quantileEnd = (i + 1) / params.bins;
          const startIndex = Math.floor(quantileStart * (sortedValues.length - 1));
          const endIndex = Math.floor(quantileEnd * (sortedValues.length - 1));
          const binMin = sortedValues[startIndex];
          const binMax = sortedValues[endIndex];
          bins.push({
            min: binMin,
            max: binMax,
            label: `Q${i + 1} [${binMin.toFixed(2)}, ${binMax.toFixed(2)}]`
          });
        }
        break;
      }
      default:
        return { success: false, error: 'Unknown binning method' };
    }
    
    const newData = data.map(row => {
      const value = row[columnName];
      if (value == null || isNaN(value)) {
        return { ...row, [columnName]: 'N/A' };
      }
      
      const num = parseFloat(value);
      const bin = bins.find(b => num >= b.min && num <= b.max);
      
      return {
        ...row,
        [columnName]: bin ? bin.label : 'N/A'
      };
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown binning error' 
    };
  }
}

// Validation and outlier operations
export function validateColumn(data: any[], columnName: string, params: { action: string; clampMin?: number; clampMax?: number; outlierMethod?: string; outlierThreshold?: number }): TransformResult {
  try {
    const newData = data.map(row => {
      const value = row[columnName];
      if (value == null || isNaN(value)) {
        return row;
      }
      
      const num = parseFloat(value);
      
      switch (params.action) {
        case 'remove_negatives':
          if (num < 0) {
            return { ...row, [columnName]: null };
          }
          break;
        case 'positive_only':
          if (num <= 0) {
            return { ...row, [columnName]: null };
          }
          break;
        case 'remove_zeros':
          if (num === 0) {
            return { ...row, [columnName]: null };
          }
          break;
        case 'integers_only':
          if (num !== Math.floor(num)) {
            return { ...row, [columnName]: Math.floor(num) };
          }
          break;
        case 'clamp': {
          const min = params.clampMin ?? -Infinity;
          const max = params.clampMax ?? Infinity;
          const clamped = Math.max(min, Math.min(max, num));
          return { ...row, [columnName]: clamped };
        }
        case 'outliers':
          // This would need outlier detection logic - placeholder for now
          return row;
        default:
          return row;
      }
      
      return row;
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown validation error' 
    };
  }
}

// Numeric transformations
export function scaleColumn(data: any[], columnName: string, params: { min?: number; max?: number; type: string }): TransformResult {
  try {
    const values = data.map(row => row[columnName]).filter(val => val != null && !isNaN(val));
    
    if (values.length === 0) {
      return { success: false, error: 'No valid numeric values found' };
    }

    const originalMin = Math.min(...values);
    const originalMax = Math.max(...values);
    const range = originalMax - originalMin;
    
    if (range === 0) {
      return { success: false, error: 'Cannot scale constant values' };
    }

    let targetMin = 0;
    let targetMax = 1;
    
    switch (params.type) {
      case 'minmax_01':
        targetMin = 0;
        targetMax = 1;
        break;
      case 'minmax_neg11':
        targetMin = -1;
        targetMax = 1;
        break;
      case 'custom':
        targetMin = params.min ?? 0;
        targetMax = params.max ?? 1;
        break;
      case 'zscore': {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const std = Math.sqrt(variance);
        
        if (std === 0) {
          return { success: false, error: 'Cannot standardize constant values' };
        }
        
        const newData = data.map(row => ({
          ...row,
          [columnName]: row[columnName] != null && !isNaN(row[columnName]) 
            ? (row[columnName] - mean) / std 
            : row[columnName]
        }));
        
        return { 
          success: true, 
          data: newData,
          undoData: { originalData: data }
        };
      }
      case 'robust': {
        const sorted = [...values].sort((a, b) => a - b);
        const q1Index = Math.floor(sorted.length * 0.25);
        const q3Index = Math.floor(sorted.length * 0.75);
        const q1 = sorted[q1Index];
        const q3 = sorted[q3Index];
        const iqr = q3 - q1;
        
        if (iqr === 0) {
          return { success: false, error: 'Cannot robust scale: IQR is zero' };
        }
        
        const median = sorted[Math.floor(sorted.length / 2)];
        
        const robustData = data.map(row => ({
          ...row,
          [columnName]: row[columnName] != null && !isNaN(row[columnName]) 
            ? (row[columnName] - median) / iqr 
            : row[columnName]
        }));
        
        return { 
          success: true, 
          data: robustData,
          undoData: { originalData: data }
        };
      }
    }
    
    const targetRange = targetMax - targetMin;
    const newData = data.map(row => ({
      ...row,
      [columnName]: row[columnName] != null && !isNaN(row[columnName]) 
        ? ((row[columnName] - originalMin) / range) * targetRange + targetMin 
        : row[columnName]
    }));

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown scaling error' 
    };
  }
}

// Text transformations
export function transformTextColumn(data: any[], columnName: string, params: { transformType: string; [key: string]: any }): TransformResult {
  try {
    const newData = data.map(row => {
      const value = row[columnName];
      if (value == null || typeof value !== 'string') {
        return row;
      }

      let transformedValue = value;
      
      switch (params.transformType) {
        case 'trim':
          switch (params.trimType) {
            case 'leading':
              transformedValue = value.replace(/^\s+/, '');
              break;
            case 'trailing':
              transformedValue = value.replace(/\s+$/, '');
              break;
            case 'both':
              transformedValue = value.trim();
              break;
            case 'all':
              transformedValue = value.replace(/\s/g, '');
              break;
            case 'normalize_inner':
              transformedValue = value.replace(/\s+/g, ' ').trim();
              break;
            default:
              transformedValue = value.trim();
          }
          break;
        case 'case':
          switch (params.caseType) {
            case 'upper':
              transformedValue = value.toUpperCase();
              break;
            case 'lower':
              transformedValue = value.toLowerCase();
              break;
            case 'capitalize':
              transformedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
              break;
            case 'title':
              transformedValue = value.replace(/\w\S*/g, (txt) => 
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
              break;
            default:
              transformedValue = value;
          }
          break;
        case 'upper':
          transformedValue = value.toUpperCase();
          break;
        case 'lower':
          transformedValue = value.toLowerCase();
          break;
        case 'title':
          transformedValue = value.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
          break;
        case 'remove_punctuation':
          transformedValue = value.replace(/[^\w\s]/g, '');
          break;
        case 'remove_digits':
          transformedValue = value.replace(/\d/g, '');
          break;
        case 'collapse_whitespace':
          transformedValue = value.replace(/\s+/g, ' ').trim();
          break;
      }
      
      return {
        ...row,
        [columnName]: transformedValue
      };
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown text transformation error' 
    };
  }
}

// Find and replace with regex support
export function findReplaceColumn(data: any[], columnName: string, params: { findText: string; replaceText: string; useRegex: boolean; caseSensitive: boolean }): TransformResult {
  try {
    let regex: RegExp;
    
    if (params.useRegex) {
      const flags = params.caseSensitive ? 'g' : 'gi';
      regex = new RegExp(params.findText, flags);
    } else {
      const flags = params.caseSensitive ? 'g' : 'gi';
      const escapedFind = params.findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      regex = new RegExp(escapedFind, flags);
    }
    
    const newData = data.map(row => {
      const value = row[columnName];
      if (value == null || typeof value !== 'string') {
        return row;
      }
      
      return {
        ...row,
        [columnName]: value.replace(regex, params.replaceText)
      };
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: `Invalid pattern: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// Split column by delimiter
export function splitColumnByDelimiter(data: any[], columnName: string, params: { delimiter: string; createColumns: boolean; maxColumns: number }): TransformResult {
  try {
    if (params.createColumns) {
      // Split into separate columns
      const newData = data.map(row => {
        const value = row[columnName];
        if (value == null || typeof value !== 'string') {
          const newRow = { ...row };
          for (let i = 0; i < params.maxColumns; i++) {
            newRow[`${columnName}_${i + 1}`] = null;
          }
          return newRow;
        }
        
        const parts = value.split(params.delimiter);
        const newRow = { ...row };
        
        for (let i = 0; i < params.maxColumns; i++) {
          newRow[`${columnName}_${i + 1}`] = parts[i] || null;
        }
        
        return newRow;
      });

      const newColumns = Array.from({ length: params.maxColumns }, (_, i) => `${columnName}_${i + 1}`);

      return { 
        success: true, 
        data: newData,
        newColumns,
        undoData: { originalData: data }
      };
    } else {
      // Split into array within the same column
      const newData = data.map(row => {
        const value = row[columnName];
        if (value == null || typeof value !== 'string') {
          return row;
        }
        
        return {
          ...row,
          [columnName]: value.split(params.delimiter)
        };
      });

      return { 
        success: true, 
        data: newData,
        undoData: { originalData: data }
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown split error' 
    };
  }
}

// Concatenate columns
export function concatenateColumns(data: any[], columnName: string, params: { targetColumn: string; delimiter: string; removeOriginals: boolean }): TransformResult {
  try {
    const newColumnName = `${columnName}_${params.targetColumn}_combined`;
    
    const newData = data.map(row => {
      const value1 = row[columnName];
      const value2 = row[params.targetColumn];
      
      const str1 = value1 != null ? String(value1) : '';
      const str2 = value2 != null ? String(value2) : '';
      
      const combined = str1 && str2 ? `${str1}${params.delimiter}${str2}` : str1 || str2;
      
      let newRow = { ...row, [newColumnName]: combined };
      
      if (params.removeOriginals) {
        delete newRow[columnName];
        delete newRow[params.targetColumn];
      }
      
      return newRow;
    });

    const newColumns = [newColumnName];
    const removedColumns = params.removeOriginals ? [columnName, params.targetColumn] : [];

    return { 
      success: true, 
      data: newData,
      newColumns,
      removedColumns,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown concatenate error' 
    };
  }
}

// Regex replacement (legacy)
export function regexReplaceColumn(data: any[], columnName: string, params: { pattern: string; replacement: string }): TransformResult {
  try {
    const regex = new RegExp(params.pattern, 'g');
    
    const newData = data.map(row => {
      const value = row[columnName];
      if (value == null || typeof value !== 'string') {
        return row;
      }
      
      return {
        ...row,
        [columnName]: value.replace(regex, params.replacement)
      };
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: `Invalid regex pattern: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// Fill missing values
export function fillMissingValues(data: any[], columnName: string, params: { strategy: string; value?: any }): TransformResult {
  try {
    let fillValue;
    const nonNullValues = data.map(row => row[columnName]).filter(val => val != null && val !== '');
    
    switch (params.strategy) {
      case 'constant':
        fillValue = params.value;
        break;
      case 'mean': {
        const numericValues = nonNullValues.filter(val => !isNaN(val));
        if (numericValues.length === 0) {
          return { success: false, error: 'No numeric values found for mean calculation' };
        }
        fillValue = numericValues.reduce((sum, val) => sum + parseFloat(val), 0) / numericValues.length;
        break;
      }
      case 'median': {
        const sortedValues = nonNullValues.filter(val => !isNaN(val)).sort((a, b) => parseFloat(a) - parseFloat(b));
        if (sortedValues.length === 0) {
          return { success: false, error: 'No numeric values found for median calculation' };
        }
        fillValue = sortedValues[Math.floor(sortedValues.length / 2)];
        break;
      }
      case 'mode': {
        const frequency: Record<string, number> = {};
        nonNullValues.forEach(val => {
          const key = String(val);
          frequency[key] = (frequency[key] || 0) + 1;
        });
        const mostFrequent = Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
        fillValue = mostFrequent;
        break;
      }
      case 'forward':
        return forwardFillColumn(data, columnName);
      case 'backward':
        return backwardFillColumn(data, columnName);
      default:
        return { success: false, error: 'Unknown fill strategy' };
    }

    const newData = data.map(row => ({
      ...row,
      [columnName]: (row[columnName] == null || row[columnName] === '') ? fillValue : row[columnName]
    }));

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown fill error' 
    };
  }
}

function forwardFillColumn(data: any[], columnName: string): TransformResult {
  const newData = [...data];
  let lastValid = null;
  
  for (let i = 0; i < newData.length; i++) {
    if (newData[i][columnName] != null && newData[i][columnName] !== '') {
      lastValid = newData[i][columnName];
    } else if (lastValid != null) {
      newData[i] = { ...newData[i], [columnName]: lastValid };
    }
  }
  
  return { 
    success: true, 
    data: newData,
    undoData: { originalData: data }
  };
}

// Categorical rules transformation
export function applyCategoricalRules(data: any[], columnName: string, params: { condition: any; trueValue: string; falseValue: string; targetCategory: string }): TransformResult {
  try {
    // Validate input data
    if (!data || data.length === 0) {
      return { success: false, error: 'No data provided' };
    }

    const { condition, trueValue, falseValue, targetCategory } = params;
    
    const newData = data.map(row => {
      const newRow = { ...row };
      
      // Only modify rows that match the target category (or all if no target specified)
      if (!targetCategory || row[columnName] === targetCategory) {
        // Evaluate the condition
        const conditionMet = evaluateCondition(row, condition);
        
        if (conditionMet) {
          newRow[columnName] = trueValue;
        } else if (falseValue) {
          newRow[columnName] = falseValue;
        }
      }
      
      return newRow;
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown categorical rules error' 
    };
  }
}

// Simple condition evaluator
function evaluateCondition(row: any, condition: any): boolean {
  const { column, operator, value } = condition;
  const cellValue = row[column];
  
  if (cellValue == null || cellValue === '') {
    return false;
  }
  
  switch (operator) {
    case '==':
      return String(cellValue) === String(value);
    case '!=':
      return String(cellValue) !== String(value);
    case '>':
      return Number(cellValue) > Number(value);
    case '<':
      return Number(cellValue) < Number(value);
    case '>=':
      return Number(cellValue) >= Number(value);
    case '<=':
      return Number(cellValue) <= Number(value);
    case 'contains':
      return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
    case 'startsWith':
      return String(cellValue).toLowerCase().startsWith(String(value).toLowerCase());
    case 'endsWith':
      return String(cellValue).toLowerCase().endsWith(String(value).toLowerCase());
    default:
      return false;
  }
}

function backwardFillColumn(data: any[], columnName: string): TransformResult {
  const newData = [...data];
  let nextValid = null;
  
  for (let i = newData.length - 1; i >= 0; i--) {
    if (newData[i][columnName] != null && newData[i][columnName] !== '') {
      nextValid = newData[i][columnName];
    } else if (nextValid != null) {
      newData[i] = { ...newData[i], [columnName]: nextValid };
    }
  }
  
  return { 
    success: true, 
    data: newData,
    undoData: { originalData: data }
  };
}

// Column operations
export function duplicateColumn(data: any[], columnName: string, newColumnName?: string): TransformResult {
  try {
    const targetName = newColumnName || `${columnName}_copy`;
    
    // Check if column exists
    if (data.length > 0 && !Object.prototype.hasOwnProperty.call(data[0], columnName)) {
      return {
        success: false,
        error: `Source column "${columnName}" does not exist`
      };
    }
    
    // Check if target column already exists
    if (data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], targetName)) {
      return {
        success: false,
        error: `Target column "${targetName}" already exists`
      };
    }
    
    const newData = data.map(row => ({
      ...row,
      [targetName]: row[columnName]
    }));

    return { 
      success: true, 
      data: newData,
      newColumns: [targetName],
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown duplication error' 
    };
  }
}

export function dropColumn(data: any[], columnName: string): TransformResult {
  try {
    const newData = data.map(row => {
      const { [columnName]: _removed, ...rest } = row;
      void _removed; // Suppress unused variable warning
      return rest;
    });

    return { 
      success: true, 
      data: newData,
      removedColumns: [columnName],
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown drop error' 
    };
  }
}

export function renameColumn(data: any[], oldColumnName: string, newColumnName: string): TransformResult {
  try {
    // Check if new column name already exists
    if (data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], newColumnName)) {
      return {
        success: false,
        error: `Column name "${newColumnName}" already exists`
      };
    }

    const newData = data.map(row => {
      const { [oldColumnName]: value, ...rest } = row;
      return {
        ...rest,
        [newColumnName]: value
      };
    });

    return {
      success: true,
      data: newData,
      undoData: { originalData: data, oldColumnName, newColumnName }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown rename error'
    };
  }
}

// Categorical operations
export function renameCategories(data: any[], columnName: string, params: { mappings: Record<string, string> }): TransformResult {
  try {
    // Validate input data
    if (!data || data.length === 0) {
      return { success: false, error: 'No data provided' };
    }

    // Check if column exists
    const firstRow = data[0];
    if (!firstRow || !(columnName in firstRow)) {
      return { success: false, error: `Column '${columnName}' not found in data` };
    }

    // Validate mappings
    if (!params.mappings || typeof params.mappings !== 'object') {
      return { success: false, error: 'No valid mappings provided' };
    }

    if (Object.keys(params.mappings).length === 0) {
      return { success: false, error: 'No category mappings specified' };
    }

    const newData = data.map(row => {
      const currentValue = row[columnName];
      
      // Only apply mapping if value is not null/empty and exists in mappings
      if (currentValue != null && currentValue !== '' && currentValue !== 'null' && currentValue !== 'undefined') {
        const mappedValue = params.mappings[String(currentValue)];
        if (mappedValue !== undefined) {
          return { ...row, [columnName]: mappedValue };
        }
      }
      
      // Return unchanged if no mapping applies or value is null
      return row;
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown category rename error' 
    };
  }
}

export function mergeCategories(data: any[], columnName: string, params: { sourceCategories: string[]; targetCategory: string; strategy: string }): TransformResult {
  try {
    // Validate input data
    if (!data || data.length === 0) {
      return { success: false, error: 'No data provided' };
    }

    // Check if column exists
    const firstRow = data[0];
    if (!firstRow || !(columnName in firstRow)) {
      return { success: false, error: `Column '${columnName}' not found in data` };
    }

    // Validate parameters
    if (!params.sourceCategories || !Array.isArray(params.sourceCategories) || params.sourceCategories.length === 0) {
      return { success: false, error: 'No source categories specified for merging' };
    }

    if (!params.targetCategory || typeof params.targetCategory !== 'string') {
      return { success: false, error: 'No target category specified for merging' };
    }

    // Remove empty/null values from source categories for accurate matching
    const validSourceCategories = params.sourceCategories.filter(cat => 
      cat != null && cat !== '' && cat !== 'null' && cat !== 'undefined'
    );

    if (validSourceCategories.length === 0) {
      return { success: false, error: 'No valid source categories specified' };
    }

    const newData = data.map(row => {
      const value = row[columnName];
      
      // Only merge if value is not null/empty and is in source categories
      if (value != null && value !== '' && value !== 'null' && value !== 'undefined') {
        if (validSourceCategories.includes(String(value))) {
          return { ...row, [columnName]: params.targetCategory };
        }
      }
      
      return row;
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown category merge error' 
    };
  }
}

export function splitCategories(data: any[], columnName: string, params: { sourceCategory: string; newCategories: string[]; rules: Array<{ pattern: string; category: string }> }): TransformResult {
  try {
    // Validate input data
    if (!data || data.length === 0) {
      return { success: false, error: 'No data provided' };
    }

    // Check if column exists
    const firstRow = data[0];
    if (!firstRow || !(columnName in firstRow)) {
      return { success: false, error: `Column '${columnName}' not found in data` };
    }

    // Validate parameters
    if (!params.sourceCategory || typeof params.sourceCategory !== 'string') {
      return { success: false, error: 'No source category specified for splitting' };
    }

    if (!params.rules || !Array.isArray(params.rules) || params.rules.length === 0) {
      return { success: false, error: 'No split rules specified' };
    }

    // Validate rules
    const validRules = params.rules.filter(rule => 
      rule && typeof rule.pattern === 'string' && rule.pattern.trim() !== '' &&
      typeof rule.category === 'string' && rule.category.trim() !== ''
    );

    if (validRules.length === 0) {
      return { success: false, error: 'No valid split rules specified' };
    }

    const newData = data.map(row => {
      const value = row[columnName];
      
      // Only apply split rules if value matches source category exactly
      if (value != null && value !== '' && value !== 'null' && value !== 'undefined') {
        const stringValue = String(value);
        
        if (stringValue === params.sourceCategory) {
          // Apply rules to determine new category
          for (const rule of validRules) {
            try {
              // Try regex matching first
              const regex = new RegExp(rule.pattern, 'i');
              if (regex.test(stringValue)) {
                return { ...row, [columnName]: rule.category };
              }
            } catch {
              // If regex is invalid, try simple string matching
              if (stringValue.toLowerCase().includes(rule.pattern.toLowerCase())) {
                return { ...row, [columnName]: rule.category };
              }
            }
          }
          // If no rules match, keep the original value
          return row;
        }
      }
      
      return row;
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown category split error' 
    };
  }
}

export function encodeCategorical(data: any[], columnName: string, params: { encodingType: string; dropFirst?: boolean }): TransformResult {
  try {
    // Validate input data
    if (!data || data.length === 0) {
      return { success: false, error: 'No data provided' };
    }

    // Check if column exists
    const firstRow = data[0];
    if (!firstRow || !(columnName in firstRow)) {
      return { success: false, error: `Column '${columnName}' not found in data` };
    }

    // Get all values including nulls for proper handling
    const allValues = data.map(row => row[columnName]);
    const uniqueValues = Array.from(new Set(
      allValues.filter(val => val != null && val !== '' && val !== 'null' && val !== 'undefined')
    )).sort();

    // Handle empty column case
    if (uniqueValues.length === 0) {
      return { success: false, error: `Column '${columnName}' contains only null or empty values` };
    }

    if (params.encodingType === 'label') {
      // Label encoding: map each unique value to a number, preserve nulls
      const labelMap: Record<string, number> = {};
      uniqueValues.forEach((value, index) => {
        labelMap[String(value)] = index;
      });

      const newData = data.map(row => {
        const value = row[columnName];
        let encodedValue: number | null = null;
        
        if (value != null && value !== '' && value !== 'null' && value !== 'undefined') {
          encodedValue = labelMap[String(value)];
          // Fallback for unknown values
          if (encodedValue === undefined) {
            encodedValue = -1; // Use -1 for unknown values
          }
        }
        
        return {
          ...row,
          [columnName]: encodedValue
        };
      });

      return { 
        success: true, 
        data: newData,
        undoData: { originalData: data }
      };
    } else if (params.encodingType === 'onehot') {
      // One-hot encoding: create binary columns for each category
      const columnsToAdd = params.dropFirst ? uniqueValues.slice(1) : uniqueValues;
      
      // Validate column names to avoid conflicts
      const sanitizedColumnNames = columnsToAdd.map(value => {
        const sanitized = String(value).replace(/[^a-zA-Z0-9_]/g, '_');
        return `${columnName}_${sanitized}`;
      });
      
      const newData = data.map(row => {
        const newRow = { ...row };
        const currentValue = row[columnName];
        
        // Create one-hot encoded columns
        columnsToAdd.forEach((value, index) => {
          const columnNameForValue = sanitizedColumnNames[index];
          
          // Handle null values: if current value is null/empty, set all columns to 0
          if (currentValue == null || currentValue === '' || currentValue === 'null' || currentValue === 'undefined') {
            newRow[columnNameForValue] = 0;
          } else {
            newRow[columnNameForValue] = currentValue === value ? 1 : 0;
          }
        });
        
        // Remove original column
        delete newRow[columnName];
        
        // Preserve __rowId if it exists but don't include it in newColumns
        // This ensures stable row identification for undo/redo
        return newRow;
      });

      return { 
        success: true, 
        data: newData,
        newColumns: sanitizedColumnNames,
        removedColumns: [columnName],
        undoData: { originalData: data }
      };
    } else if (params.encodingType === 'binary') {
      // Binary encoding: more compact than one-hot for many categories
      const bitsRequired = Math.max(1, Math.ceil(Math.log2(uniqueValues.length)));
      
      const newData = data.map(row => {
        const newRow = { ...row };
        const currentValue = row[columnName];
        const valueIndex = currentValue != null && currentValue !== '' && currentValue !== 'null' && currentValue !== 'undefined' 
          ? uniqueValues.indexOf(currentValue) : -1;
        
        // Create binary columns
        for (let bit = 0; bit < bitsRequired; bit++) {
          const columnNameForBit = `${columnName}_bit${bit}`;
          
          if (valueIndex >= 0) {
            // Valid value: encode as binary
            newRow[columnNameForBit] = (valueIndex >> bit) & 1;
          } else {
            // Null/unknown value: use all zeros
            newRow[columnNameForBit] = 0;
          }
        }
        
        // Remove original column
        delete newRow[columnName];
        
        // Preserve __rowId if it exists but don't include it in newColumns  
        // This ensures stable row identification for undo/redo
        return newRow;
      });

      const newColumns = Array.from({ length: bitsRequired }, (_, i) => `${columnName}_bit${i}`);

      return { 
        success: true, 
        data: newData,
        newColumns,
        removedColumns: [columnName],
        undoData: { originalData: data }
      };
    } else if (params.encodingType === 'matrix') {
      // Matrix encoding: update original column in-place with encoded matrix representation
      const columnsToEncode = params.dropFirst ? uniqueValues.slice(1) : uniqueValues;
      
      const newData = data.map(row => {
        const currentValue = row[columnName];
        
        // Create matrix encoded array: [1,0,0] [0,1,0] [0,0,1]
        const encodedArray: number[] = [];
        
        // Handle null values: if current value is null/empty, set all to 0
        if (currentValue == null || currentValue === '' || currentValue === 'null' || currentValue === 'undefined') {
          columnsToEncode.forEach(() => encodedArray.push(0));
        } else {
          columnsToEncode.forEach(value => {
            encodedArray.push(currentValue === value ? 1 : 0);
          });
        }
        
        // Update the original column with the matrix encoded array
        return {
          ...row,
          [columnName]: encodedArray
        };
      });
      
      return { 
        success: true, 
        data: newData,
        newColumns: [], // No new columns created
        removedColumns: [], // No columns removed
        undoData: { originalData: data }
      };
    }

    return { success: false, error: 'Unknown encoding type' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown categorical encoding error' 
    };
  }
}

export function groupRareCategories(data: any[], columnName: string, params: { threshold: number; thresholdType: string; otherLabel: string }): TransformResult {
  try {
    // Validate input data
    if (!data || data.length === 0) {
      return { success: false, error: 'No data provided' };
    }

    // Check if column exists
    const firstRow = data[0];
    if (!firstRow || !(columnName in firstRow)) {
      return { success: false, error: `Column '${columnName}' not found in data` };
    }

    // Validate parameters
    if (typeof params.threshold !== 'number' || params.threshold <= 0) {
      return { success: false, error: 'Invalid threshold value' };
    }

    if (!params.otherLabel || typeof params.otherLabel !== 'string') {
      return { success: false, error: 'Invalid other label specified' };
    }

    // Count frequencies (only count non-null values)
    const frequencyMap: Record<string, number> = {};
    let validValueCount = 0;
    
    data.forEach(row => {
      const value = row[columnName];
      if (value != null && value !== '' && value !== 'null' && value !== 'undefined') {
        const stringValue = String(value);
        frequencyMap[stringValue] = (frequencyMap[stringValue] || 0) + 1;
        validValueCount++;
      }
    });

    if (validValueCount === 0) {
      return { success: false, error: 'Column contains only null or empty values' };
    }

    const rareCategoriesSet = new Set<string>();

    // Determine which categories are rare
    Object.entries(frequencyMap).forEach(([category, count]) => {
      if (params.thresholdType === 'percentage') {
        const percentage = (count / validValueCount) * 100;
        if (percentage < params.threshold) {
          rareCategoriesSet.add(category);
        }
      } else {
        // count threshold
        if (count < params.threshold) {
          rareCategoriesSet.add(category);
        }
      }
    });

    // If no categories are rare, return success with unchanged data
    if (rareCategoriesSet.size === 0) {
      return { 
        success: true, 
        data: data,
        undoData: { originalData: data }
      };
    }

    const newData = data.map(row => {
      const value = row[columnName];
      
      // Only process non-null values
      if (value != null && value !== '' && value !== 'null' && value !== 'undefined') {
        const stringValue = String(value);
        if (rareCategoriesSet.has(stringValue)) {
          return { ...row, [columnName]: params.otherLabel };
        }
      }
      
      return row;
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown group rare categories error' 
    };
  }
}

export function assignDefaultValue(data: any[], columnName: string, params: { strategy: string; defaultValue: string }): TransformResult {
  try {
    // Validate input data
    if (!data || data.length === 0) {
      return { success: false, error: 'No data provided' };
    }

    // Check if column exists
    const firstRow = data[0];
    if (!firstRow || !(columnName in firstRow)) {
      return { success: false, error: `Column '${columnName}' not found in data` };
    }

    // Validate parameters
    if (!params.strategy || typeof params.strategy !== 'string') {
      return { success: false, error: 'No strategy specified for default value assignment' };
    }

    let fillValue = params.defaultValue;

    if (params.strategy === 'most_frequent') {
      // Find the most frequent value
      const frequencyMap: Record<string, number> = {};
      data.forEach(row => {
        const value = row[columnName];
        if (value != null && value !== '' && value !== 'null' && value !== 'undefined') {
          const key = String(value);
          frequencyMap[key] = (frequencyMap[key] || 0) + 1;
        }
      });

      if (Object.keys(frequencyMap).length > 0) {
        fillValue = Object.keys(frequencyMap).reduce((a, b) => 
          frequencyMap[a] > frequencyMap[b] ? a : b
        );
      } else {
        return { success: false, error: 'Column contains only null values, cannot determine most frequent value' };
      }
    } else if (params.strategy === 'constant') {
      if (!params.defaultValue || typeof params.defaultValue !== 'string') {
        return { success: false, error: 'No default value specified for constant strategy' };
      }
      fillValue = params.defaultValue;
    } else {
      return { success: false, error: `Unknown strategy: ${params.strategy}` };
    }

    // Count how many values will be changed
    let changedCount = 0;
    const newData = data.map(row => {
      const value = row[columnName];
      if (value == null || value === '' || value === 'null' || value === 'undefined') {
        changedCount++;
        return { ...row, [columnName]: fillValue };
      }
      return row;
    });

    // If no values were changed, return original data
    if (changedCount === 0) {
      return { 
        success: true, 
        data: data,
        undoData: { originalData: data }
      };
    }

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown default value assignment error' 
    };
  }
}

// Boolean operations
export function invertBoolean(data: any[], columnName: string): TransformResult {
  try {
    // Determine the unique values in the column to handle 2-category columns
    const uniqueValues = Array.from(new Set(
      data.map(row => row[columnName])
        .filter(v => v !== null && v !== undefined && v !== '')
    ));
    
    const newData = data.map(row => {
      const value = row[columnName];
      let inverted = value;
      
      // Handle traditional boolean values
      if (typeof value === 'boolean') {
        inverted = !value;
      } else if (value === 'true' || value === 'True' || value === '1' || value === 1) {
        inverted = false;
      } else if (value === 'false' || value === 'False' || value === '0' || value === 0) {
        inverted = true;
      } else if (value === 'yes' || value === 'Yes' || value === 'y' || value === 'Y') {
        inverted = false;
      } else if (value === 'no' || value === 'No' || value === 'n' || value === 'N') {
        inverted = true;
      }
      // Handle 2-category columns (like Male/Female, Active/Inactive)
      else if (uniqueValues.length === 2 && value != null) {
        // Swap the values: first becomes second, second becomes first
        if (String(value) === String(uniqueValues[0])) {
          inverted = uniqueValues[1];
        } else if (String(value) === String(uniqueValues[1])) {
          inverted = uniqueValues[0];
        }
      }
      
      return {
        ...row,
        [columnName]: inverted
      };
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown boolean invert error' 
    };
  }
}

// Boolean transformation operations
export function convertBooleanTo01(data: any[], columnName: string): TransformResult {
  try {
    // Determine the unique values in the column to handle 2-category columns
    const uniqueValues = Array.from(new Set(
      data.map(row => row[columnName])
        .filter(v => v !== null && v !== undefined && v !== '')
    ));
    
    const newData = data.map(row => {
      const value = row[columnName];
      let converted = value;
      
      // Handle traditional boolean values
      if (typeof value === 'boolean') {
        converted = value ? 1 : 0;
      } else if (value === 'true' || value === 'True' || value === '1' || value === 1) {
        converted = 1;
      } else if (value === 'false' || value === 'False' || value === '0' || value === 0) {
        converted = 0;
      } else if (value === 'yes' || value === 'Yes' || value === 'y' || value === 'Y') {
        converted = 1;
      } else if (value === 'no' || value === 'No' || value === 'n' || value === 'N') {
        converted = 0;
      } 
      // Handle 2-category columns (like Male/Female, Active/Inactive)
      else if (uniqueValues.length === 2 && value != null) {
        // Convert first unique value to 1, second to 0
        converted = String(value) === String(uniqueValues[0]) ? 1 : 0;
      }
      // Handle null/empty values
      else if (value === null || value === undefined || value === '') {
        converted = null;
      }
      
      return { ...row, [columnName]: converted };
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown boolean to 1/0 conversion error' 
    };
  }
}

export function fillBooleanMissing(data: any[], columnName: string, params: { fillType: string; defaultValue?: string }): TransformResult {
  try {
    const newData = data.map(row => {
      const value = row[columnName];
      
      // If value is not null/undefined, keep it
      if (value != null && value !== '' && value !== 'null' && value !== 'undefined') {
        return row;
      }
      
      let fillValue;
      
      if (params.fillType === 'fill_majority') {
        // Calculate majority value
        const nonNullValues = data
          .map(r => r[columnName])
          .filter(v => v != null && v !== '' && v !== 'null' && v !== 'undefined');
        
        // Get unique values for 2-category detection
        const uniqueValues = Array.from(new Set(nonNullValues));
        
        if (uniqueValues.length === 2) {
          // For 2-category columns, count occurrences of each value
          const firstCount = nonNullValues.filter(v => String(v) === String(uniqueValues[0])).length;
          const secondCount = nonNullValues.filter(v => String(v) === String(uniqueValues[1])).length;
          fillValue = firstCount >= secondCount ? uniqueValues[0] : uniqueValues[1];
        } else {
          // Traditional boolean counting
          const trueCount = nonNullValues.filter(v => 
            v === true || v === 'true' || v === 'True' || v === '1' || v === 1 || 
            v === 'yes' || v === 'Yes' || v === 'y' || v === 'Y'
          ).length;
          
          const falseCount = nonNullValues.filter(v => 
            v === false || v === 'false' || v === 'False' || v === '0' || v === 0 ||
            v === 'no' || v === 'No' || v === 'n' || v === 'N'
          ).length;
          
          fillValue = trueCount >= falseCount ? true : false;
        }
      } else if (params.fillType === 'fill_default_true') {
        fillValue = true;
      } else if (params.fillType === 'fill_default_false') {
        fillValue = false;
      } else {
        fillValue = params.defaultValue === 'true' ? true : false;
      }
      
      return { ...row, [columnName]: fillValue };
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown boolean fill missing error' 
    };
  }
}

export function convertBooleanToCustomLabels(data: any[], columnName: string, params: { trueLabel: string; falseLabel: string }): TransformResult {
  try {
    // Determine the unique values in the column to handle 2-category columns
    const uniqueValues = Array.from(new Set(
      data.map(row => row[columnName])
        .filter(v => v !== null && v !== undefined && v !== '')
    ));
    
    const newData = data.map(row => {
      const value = row[columnName];
      let converted = value;
      
      // Handle traditional boolean values
      if (typeof value === 'boolean') {
        converted = value ? params.trueLabel : params.falseLabel;
      } else if (value === 'true' || value === 'True' || value === '1' || value === 1) {
        converted = params.trueLabel;
      } else if (value === 'false' || value === 'False' || value === '0' || value === 0) {
        converted = params.falseLabel;
      } else if (value === 'yes' || value === 'Yes' || value === 'y' || value === 'Y') {
        converted = params.trueLabel;
      } else if (value === 'no' || value === 'No' || value === 'n' || value === 'N') {
        converted = params.falseLabel;
      }
      // Handle 2-category columns (like Male/Female, Active/Inactive)
      else if (uniqueValues.length === 2 && value != null) {
        // Map first unique value to trueLabel, second to falseLabel
        converted = String(value) === String(uniqueValues[0]) ? params.trueLabel : params.falseLabel;
      }
      // Handle null/empty values
      else if (value === null || value === undefined || value === '') {
        converted = null;
      }
      
      return { ...row, [columnName]: converted };
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown boolean to custom labels conversion error' 
    };
  }
}

export function applyBooleanRuleMapping(data: any[], columnName: string, params: { condition: string; columnName: string }): TransformResult {
  try {
    const refColumnName = params.columnName;
    const condition = params.condition.trim();
    
    if (!refColumnName) {
      return { success: false, error: 'Reference column name is required for rule mapping' };
    }
    
    const newData = data.map(row => {
      const refValue = row[refColumnName];
      let result = false;
      
      if (refValue != null) {
        // Simple condition parsing (basic support for >5, <10, ==value, etc.)
        try {
          if (condition.startsWith('>')) {
            const threshold = parseFloat(condition.substring(1).trim());
            result = parseFloat(refValue) > threshold;
          } else if (condition.startsWith('<')) {
            const threshold = parseFloat(condition.substring(1).trim());
            result = parseFloat(refValue) < threshold;
          } else if (condition.startsWith('==')) {
            const targetValue = condition.substring(2).trim();
            result = String(refValue).trim() === targetValue;
          } else if (condition.startsWith('!=')) {
            const targetValue = condition.substring(2).trim();
            result = String(refValue).trim() !== targetValue;
          } else if (condition.includes('>=')) {
            const threshold = parseFloat(condition.split('>=')[1].trim());
            result = parseFloat(refValue) >= threshold;
          } else if (condition.includes('<=')) {
            const threshold = parseFloat(condition.split('<=')[1].trim());
            result = parseFloat(refValue) <= threshold;
          } else {
            // Default to checking if value equals condition
            result = String(refValue).trim() === condition;
          }
        } catch {
          result = false;
        }
      }
      
      return { ...row, [columnName]: result };
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown boolean rule mapping error' 
    };
  }
}

// Advanced rule mapping using the new rule engine
export async function applyAdvancedRuleMapping(data: any[], columnName: string, params: { ruleSetData: string }): Promise<TransformResult> {
  try {
    // Import the rule engine functions dynamically to avoid circular dependencies
    const { applyRuleSetToDataset } = await import('./ruleEngine');
    
    const ruleSet = JSON.parse(params.ruleSetData);
    const columnNames = data.length > 0 ? Object.keys(data[0]) : [];
    
    const result = applyRuleSetToDataset(data, columnNames, columnName, ruleSet);
    
    if (!result.success) {
      return { 
        success: false, 
        error: result.error || 'Unknown advanced rule mapping error' 
      };
    }

    return { 
      success: true, 
      data: result.data,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Advanced rule mapping parsing error' 
    };
  }
}

// DateTime transformation functions

// Format conversion functions
export function formatDateTime(data: any[], columnName: string, params: { targetFormat: string; sourceFormat?: string }): TransformResult {
  try {
    const newData = data.map(row => {
      const value = row[columnName];
      if (value == null || value === '') {
        return row;
      }
      
      const dateString = String(value);
      let parsedDate: Date | null = null;
      
      // Try to parse the date
      if (params.sourceFormat) {
        parsedDate = parseCustomFormat(dateString, params.sourceFormat);
      } else {
        // Auto-detect format
        parsedDate = new Date(dateString);
        if (isNaN(parsedDate.getTime())) {
          // Try common formats
          const commonFormats = [
            'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY',
            'YYYY/MM/DD', 'MM-DD-YYYY', 'DD.MM.YYYY'
          ];
          
          for (const format of commonFormats) {
            parsedDate = parseCustomFormat(dateString, format);
            if (parsedDate && !isNaN(parsedDate.getTime())) break;
          }
        }
      }
      
      if (!parsedDate || isNaN(parsedDate.getTime())) {
        return row; // Keep original value if can't parse
      }
      
      const formatted = formatDateToString(parsedDate, params.targetFormat);
      
      return {
        ...row,
        [columnName]: formatted
      };
    });
    
    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown date format error' 
    };
  }
}

// Extract date components (creates new columns while preserving original)
export function extractDateComponent(data: any[], columnName: string, params: { component: string; newColumnName?: string }): TransformResult {
  try {
    const targetColumnName = params.newColumnName || `${columnName}_${params.component}`;
    
    // Check if target column already exists
    if (data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], targetColumnName)) {
      return {
        success: false,
        error: `Target column "${targetColumnName}" already exists`
      };
    }
    
    const newData = data.map(row => {
      const value = row[columnName];
      if (value == null || value === '') {
        return { ...row, [targetColumnName]: null };
      }
      
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return { ...row, [targetColumnName]: null };
      }
      
      let extracted: any = null;
      
      switch (params.component) {
        case 'year':
          extracted = date.getFullYear();
          break;
        case 'month':
          extracted = date.getMonth() + 1; // JavaScript months are 0-indexed
          break;
        case 'day':
          extracted = date.getDate();
          break;
        case 'weekday':
          extracted = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
          break;
        case 'quarter':
          extracted = `Q${Math.ceil((date.getMonth() + 1) / 3)}`;
          break;
        case 'hour':
          extracted = date.getHours();
          break;
        case 'minute':
          extracted = date.getMinutes();
          break;
        case 'second':
          extracted = date.getSeconds();
          break;
        case 'time':
          extracted = date.toTimeString().split(' ')[0]; // HH:MM:SS
          break;
        case 'date':
          extracted = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        default:
          return { ...row, [targetColumnName]: null };
      }
      
      // Preserve original column and add new column
      return {
        ...row,
        [targetColumnName]: extracted
      };
    });

    return { 
      success: true, 
      data: newData,
      newColumns: [targetColumnName],
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown date extraction error' 
    };
  }
}

// Date arithmetic operations
export function addDateTime(data: any[], columnName: string, params: { amount: number; unit: string }): TransformResult {
  try {
    const newData = data.map(row => {
      const value = row[columnName];
      if (value == null || value === '') {
        return row;
      }
      
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return row;
      }
      
      const newDate = new Date(date);
      
      switch (params.unit) {
        case 'years':
          newDate.setFullYear(date.getFullYear() + params.amount);
          break;
        case 'months':
          newDate.setMonth(date.getMonth() + params.amount);
          break;
        case 'days':
          newDate.setDate(date.getDate() + params.amount);
          break;
        case 'hours':
          newDate.setHours(date.getHours() + params.amount);
          break;
        case 'minutes':
          newDate.setMinutes(date.getMinutes() + params.amount);
          break;
        case 'seconds':
          newDate.setSeconds(date.getSeconds() + params.amount);
          break;
        default:
          return row;
      }
      
      return {
        ...row,
        [columnName]: newDate.toISOString()
      };
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown date arithmetic error' 
    };
  }
}

// Date truncation operations
export function truncateDateTime(data: any[], columnName: string, params: { unit: string }): TransformResult {
  try {
    const newData = data.map(row => {
      const value = row[columnName];
      if (value == null || value === '') {
        return row;
      }
      
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return row;
      }
      
      const truncated = new Date(date);
      
      switch (params.unit) {
        case 'year':
          truncated.setMonth(0, 1);
          truncated.setHours(0, 0, 0, 0);
          break;
        case 'month':
          truncated.setDate(1);
          truncated.setHours(0, 0, 0, 0);
          break;
        case 'day':
          truncated.setHours(0, 0, 0, 0);
          break;
        case 'hour':
          truncated.setMinutes(0, 0, 0);
          break;
        case 'minute':
          truncated.setSeconds(0, 0);
          break;
        default:
          return row;
      }
      
      return {
        ...row,
        [columnName]: truncated.toISOString()
      };
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown date truncation error' 
    };
  }
}

// Timezone conversion
export function convertTimezone(data: any[], columnName: string, params: { fromTimezone?: string; toTimezone: string }): TransformResult {
  try {
    const newData = data.map(row => {
      const value = row[columnName];
      if (value == null || value === '') {
        return row;
      }
      
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return row;
      }
      
      // For simplicity, we'll use basic timezone offset conversion
      // In a production app, you'd want to use a library like date-fns-tz or moment-timezone
      
      let convertedDate: Date;
      
      switch (params.toTimezone) {
        case 'UTC':
          convertedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
          break;
        case 'local':
          convertedDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
          break;
        default:
          // For now, just return the original date
          convertedDate = date;
      }
      
      return {
        ...row,
        [columnName]: convertedDate.toISOString()
      };
    });

    return { 
      success: true, 
      data: newData,
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown timezone conversion error' 
    };
  }
}

// Combine date and time columns
export function combineDateTimeColumns(data: any[], params: { dateColumn: string; timeColumn: string; targetColumn: string }): TransformResult {
  try {
    const newData = data.map(row => {
      const dateValue = row[params.dateColumn];
      const timeValue = row[params.timeColumn];
      
      if (dateValue == null || timeValue == null) {
        return { ...row, [params.targetColumn]: null };
      }
      
      const dateStr = String(dateValue);
      const timeStr = String(timeValue);
      
      // Combine date and time
      const combined = `${dateStr}T${timeStr}`;
      const combinedDate = new Date(combined);
      
      if (isNaN(combinedDate.getTime())) {
        return { ...row, [params.targetColumn]: null };
      }
      
      return {
        ...row,
        [params.targetColumn]: combinedDate.toISOString()
      };
    });

    return { 
      success: true, 
      data: newData,
      newColumns: [params.targetColumn],
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown date-time combination error' 
    };
  }
}

// Split datetime into date and time columns
export function splitDateTimeColumn(data: any[], columnName: string, params: { dateColumn?: string; timeColumn?: string }): TransformResult {
  try {
    const dateColumnName = params.dateColumn || `${columnName}_date`;
    const timeColumnName = params.timeColumn || `${columnName}_time`;
    
    const newData = data.map(row => {
      const value = row[columnName];
      if (value == null || value === '') {
        return { 
          ...row, 
          [dateColumnName]: null,
          [timeColumnName]: null
        };
      }
      
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return { 
          ...row, 
          [dateColumnName]: null,
          [timeColumnName]: null
        };
      }
      
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = date.toTimeString().split(' ')[0]; // HH:MM:SS
      
      return {
        ...row,
        [dateColumnName]: dateStr,
        [timeColumnName]: timeStr
      };
    });

    return { 
      success: true, 
      data: newData,
      newColumns: [dateColumnName, timeColumnName],
      undoData: { originalData: data }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown date-time split error' 
    };
  }
}

// Helper functions for date parsing and formatting
function parseCustomFormat(dateString: string, format: string): Date | null {
  try {
    // Simple format parsing - in production, use a library like date-fns
    const parts = dateString.split(/[/\-.]/);
    const formatParts = format.split(/[/\-.]/);
    
    if (parts.length !== formatParts.length) return null;
    
    let year = 0, month = 0, day = 0;
    
    for (let i = 0; i < formatParts.length; i++) {
      const part = parseInt(parts[i], 10);
      if (isNaN(part)) return null;
      
      if (formatParts[i].includes('YYYY')) {
        year = part;
      } else if (formatParts[i].includes('MM')) {
        month = part;
      } else if (formatParts[i].includes('DD')) {
        day = part;
      }
    }
    
    if (year && month && day) {
      return new Date(year, month - 1, day); // month is 0-indexed in JavaScript
    }
    
    return null;
  } catch {
    return null;
  }
}

function formatDateToString(date: Date, format: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`;
    case 'MM-DD-YYYY':
      return `${month}-${day}-${year}`;
    case 'DD.MM.YYYY':
      return `${day}.${month}.${year}`;
    default:
      return date.toISOString().split('T')[0]; // Default to ISO format
  }
}

// Main transform dispatcher
export async function applyTransform(
  data: any[], 
  operation: TransformOperation
): Promise<TransformResult> {
  const { type, columnName, parameters } = operation;
  
  switch (type) {
    // Numeric operations
    case 'numeric_transform':
      switch (parameters.transformType) {
        case 'round':
          return roundColumn(data, columnName, parameters as { method: string; decimals: number });
        case 'scale':
          return arithmeticColumn(data, columnName, parameters as { operation: string; value: number });
        case 'normalize':
          return scaleColumn(data, columnName, { type: parameters.method, ...parameters });
        case 'math':
          return mathTransformColumn(data, columnName, parameters as { operation: string; powerValue?: number });
        case 'binning':
          return binColumn(data, columnName, parameters as { method: string; bins: number });
        default:
          return { success: false, error: `Unknown numeric transform type: ${parameters.transformType}` };
      }
    case 'fill_missing':
      return fillMissingValues(data, columnName, { strategy: parameters.method, value: parameters.constantValue });
    case 'numeric_validation':
      return validateColumn(data, columnName, parameters as { action: string; clampMin?: number; clampMax?: number; outlierMethod?: string; outlierThreshold?: number });
    
    // Legacy numeric operations
    case 'scale':
      return scaleColumn(data, columnName, parameters as { min?: number; max?: number; type: string });
    case 'standardize':
      return scaleColumn(data, columnName, { min: -3, max: 3, type: 'zscore' });
    case 'bin':
      return binColumn(data, columnName, parameters as { method: string; bins: number });
    
    // Text operations
    case 'text_transform':
    case 'trim':
      return transformTextColumn(data, columnName, parameters as { transformType: string; [key: string]: any });
    case 'case':
      return transformTextColumn(data, columnName, { transformType: 'case', ...parameters });
    case 'find_replace':
      return findReplaceColumn(data, columnName, parameters as { findText: string; replaceText: string; useRegex: boolean; caseSensitive: boolean });
    case 'split_delimiter':
      return splitColumnByDelimiter(data, columnName, parameters as { delimiter: string; createColumns: boolean; maxColumns: number });
    case 'concatenate':
      return concatenateColumns(data, columnName, parameters as { targetColumn: string; delimiter: string; removeOriginals: boolean });
    case 'regex_replace':
      return regexReplaceColumn(data, columnName, parameters as { pattern: string; replacement: string });
    case 'length_count':
      return duplicateColumn(data, columnName, parameters.newColumn || `${columnName}_length`);
    
    // General operations
    case 'duplicate':
      return duplicateColumn(data, columnName, parameters.newName);
    case 'drop':
      return dropColumn(data, columnName);
    case 'rename_column':
      return renameColumn(data, columnName, parameters.newName);
    
    // Categorical operations
    case 'rename_categories':
    case 'category_rename':
      return renameCategories(data, columnName, parameters as { mappings: Record<string, string> });
    case 'category_merge':
      return mergeCategories(data, columnName, parameters as { sourceCategories: string[]; targetCategory: string; strategy: string });
    case 'category_split':
      return splitCategories(data, columnName, parameters as { sourceCategory: string; newCategories: string[]; rules: Array<{ pattern: string; category: string }> });
    case 'category_encoding':
      return encodeCategorical(data, columnName, parameters as { encodingType: string; dropFirst?: boolean });
    case 'category_group_rare':
      return groupRareCategories(data, columnName, parameters as { threshold: number; thresholdType: string; otherLabel: string });
    case 'category_default_value':
      return assignDefaultValue(data, columnName, parameters as { strategy: string; defaultValue: string });
    case 'category_rules':
      return applyCategoricalRules(data, columnName, parameters as { condition: any; trueValue: string; falseValue: string; targetCategory: string });
    case 'merge_rare':
      return groupRareCategories(data, columnName, { threshold: 5, thresholdType: 'count', otherLabel: 'Other' }); // Legacy support
    case 'encode':
      return encodeCategorical(data, columnName, { encodingType: 'label' }); // Legacy support
    
    // Boolean operations
    case 'boolean_transform':
      switch (parameters.transformType) {
        case 'convert_to_01':
          return convertBooleanTo01(data, columnName);
        case 'invert_values':
          return invertBoolean(data, columnName);
        default:
          return { success: false, error: `Unknown boolean transform type: ${parameters.transformType}` };
      }
    case 'boolean_fill_missing':
      return fillBooleanMissing(data, columnName, parameters as { fillType: string; defaultValue?: string });
    case 'boolean_custom_labels':
      return convertBooleanToCustomLabels(data, columnName, parameters as { trueLabel: string; falseLabel: string });
    case 'boolean_rule_mapping':
      return applyBooleanRuleMapping(data, columnName, parameters as { condition: string; columnName: string });
    case 'advanced_rule_mapping':
      return await applyAdvancedRuleMapping(data, columnName, parameters as { ruleSetData: string });
    case 'boolean_invert':
    case 'invert':
      return invertBoolean(data, columnName);
    
    // DateTime operations
    case 'datetime_format':
      return formatDateTime(data, columnName, parameters as { targetFormat: string; sourceFormat?: string });
    case 'datetime_extract':
      return extractDateComponent(data, columnName, parameters as { component: string; newColumnName?: string });
    case 'datetime_arithmetic':
      return addDateTime(data, columnName, parameters as { amount: number; unit: string });
    case 'datetime_truncate':
      return truncateDateTime(data, columnName, parameters as { unit: string });
    case 'datetime_timezone':
      return convertTimezone(data, columnName, parameters as { fromTimezone?: string; toTimezone: string });
    case 'datetime_combine':
      return combineDateTimeColumns(data, parameters as { dateColumn: string; timeColumn: string; targetColumn: string });
    case 'datetime_split':
      return splitDateTimeColumn(data, columnName, parameters as { dateColumn?: string; timeColumn?: string });
    
    // Placeholder operations
    case 'parse':
      return { success: true, data }; // Placeholder
    case 'extract':
      return duplicateColumn(data, columnName, parameters.newColumn || `${columnName}_extracted`);
    case 'validate':
      return { success: true, data }; // Placeholder
    case 'mark_key':
      return { success: true, data }; // Placeholder
    case 'resolve_duplicates':
      return { success: true, data }; // Placeholder
    case 'to_flag':
      return { success: true, data }; // Placeholder
      
    default:
      return { 
        success: false, 
        error: `Unknown operation type: ${type}` 
      };
  }
}