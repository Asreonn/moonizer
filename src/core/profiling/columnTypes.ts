export type ColumnType = 'numeric' | 'categorical' | 'boolean' | 'datetime' | 'text' | 'id_unique' | 'constant';

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  isTypeLocked: boolean;
  nullCount: number;
  nullPercent: number;
  uniqueCount: number;
  uniquePercent: number;
  totalCount: number;
  sampleValues: any[];
  
  // Type-specific stats
  numericStats?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    std: number;
    q1: number;
    q3: number;
    outlierCount: number;
    outlierPercent: number;
  };
  
  categoricalStats?: {
    classes: number;
    topCategories: Array<{ value: string; count: number; percent: number }>;
    hasRareCategories: boolean;
  };
  
  booleanStats?: {
    trueCount: number;
    falseCount: number;
    truePercent: number;
    falsePercent: number;
  };
  
  datetimeStats?: {
    minDate: Date;
    maxDate: Date;
    parseFormat: string;
    timezone?: string;
    hasInvalid: boolean;
    invalidCount: number;
  };
  
  textStats?: {
    avgLength: number;
    minLength: number;
    maxLength: number;
    whitespaceRatio: number;
    symbolRatio: number;
    hasEmptyStrings: boolean;
  };
  
  idUniqueStats?: {
    isUnique: boolean;
    duplicateCount: number;
    pattern?: string;
  };
  
  
  warnings: string[];
}

export function classifyColumnType(values: any[], columnName: string): ColumnType {
  if (!values || values.length === 0) return 'text';
  
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return 'text';
  
  // Debug logging can be enabled for troubleshooting
  // console.log(`📊 Classifying column "${columnName}" with ${nonNullValues.length} non-null values:`, nonNullValues.slice(0, 3));
  
  
  // Check for 1/0 binary values FIRST - before general numeric check
  const uniqueValues = new Set(nonNullValues);
  const is10Binary = uniqueValues.size === 2 && 
    Array.from(uniqueValues).every(v => v === 1 || v === 0 || v === '1' || v === '0');
  
  if (is10Binary) {
    console.log(`✅ Column "${columnName}" classified as: boolean (1/0 binary values detected)`);
    return 'boolean';
  }

  // Check for numeric FIRST - before datetime to prevent simple numbers from being misclassified
  // IMPORTANT: Exclude boolean primitives from numeric detection
  const numericValues = nonNullValues.filter(v => {
    // Skip boolean primitives - they should not be counted as numeric
    if (typeof v === 'boolean') {
      return false;
    }
    const num = Number(v);
    return !isNaN(num) && isFinite(num);
  });
  
  const numericRatio = numericValues.length / nonNullValues.length;
  if (numericRatio > 0.8) {
    // console.log(`✅ Column "${columnName}" classified as: numeric`);
    return 'numeric';
  }

  // uniqueValues already defined above
  
  // Check for datetime AFTER numeric check (dates can be unique)
  // Comprehensive date patterns - most common first for efficiency
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD (ISO format - most common)
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY 
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO 8601 with time
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/, // YYYY-MM-DD HH:MM:SS
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY or MM/DD/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/, // M-D-YYYY or MM-DD-YYYY
    /^\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2}/, // MM/DD/YYYY H:MM or MM/DD/YYYY HH:MM
    /^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}/, // M/D/YYYY H:MM
    /^\d{8}$/, // YYYYMMDD
    /^\d{2}\/\d{2}\/\d{2}$/, // MM/DD/YY
    /^\d{2}-\d{2}-\d{2}$/, // MM-DD-YY
    /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // Flexible M/D/YY or MM/DD/YYYY
    /^\d{1,2}-\d{1,2}-\d{2,4}/, // Flexible M-D-YY or MM-DD-YYYY
    /^\d{2}-\w{3}-\d{4}/, // DD-MMM-YYYY (e.g., 25-Dec-2023)
    /^\w{3} \d{1,2}, \d{4}/, // MMM D, YYYY (e.g., Dec 25, 2023)
    /^\d{1,2} \w{3} \d{4}/, // D MMM YYYY (e.g., 25 Dec 2023)
  ];
  
  const datetimeValues = nonNullValues.filter(v => {
    const dateStr = String(v).trim();
    if (!dateStr) return false;
    
    // Skip simple numbers - they should be classified as numeric, not datetime
    const isSimpleNumber = /^-?\d+\.?\d*$/.test(dateStr);
    if (isSimpleNumber) return false;
    
    // First check patterns for speed
    if (datePatterns.some(pattern => pattern.test(dateStr))) {
      return true;
    }
    
    // Then try native Date.parse for flexibility - but be more strict
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      // Additional validation: check if it's a reasonable date and not just a number
      const date = new Date(parsed);
      const year = date.getFullYear();
      // Also ensure the original string looks like a date, not just a parseable number
      const looksLikeDate = dateStr.includes('-') || dateStr.includes('/') || dateStr.includes(' ') || dateStr.length >= 8;
      return year >= 1900 && year <= 2100 && looksLikeDate;
    }
    
    return false;
  });
  
  // Extra debugging for troubleshooting - test our specific sample
  if (columnName === 'date' && nonNullValues.length > 0) {
    console.log('🔬 Deep debug for date column:');
    const testValue = '2023-01-01';
    const testPattern = /^\d{4}-\d{2}-\d{2}$/;
    console.log(`  - Test pattern /^\\d{4}-\\d{2}-\\d{2}$/ on "${testValue}":`, testPattern.test(testValue));
    console.log(`  - Date.parse("${testValue}"):`, Date.parse(testValue));
    console.log(`  - First sample value: "${nonNullValues[0]}" (type: ${typeof nonNullValues[0]})`);
    console.log(`  - String version: "${String(nonNullValues[0]).trim()}"`);
    console.log(`  - Pattern test on first value:`, datePatterns.some(p => p.test(String(nonNullValues[0]).trim())));
    
    // Test each pattern individually on the first value
    const firstVal = String(nonNullValues[0]).trim();
    datePatterns.forEach((pattern, idx) => {
      console.log(`    Pattern ${idx}: ${pattern} -> ${pattern.test(firstVal)}`);
    });
  }
  
  const datetimeRatio = datetimeValues.length / nonNullValues.length;
  
  // Lower threshold for datetime detection (20% for small datasets, 30% for very small)
  const threshold = nonNullValues.length <= 5 ? 0.2 : 
                   nonNullValues.length < 20 ? 0.3 : 0.5;
  
  // Debug for date columns - enhanced logging
  if (columnName.toLowerCase().includes('date')) {
    console.log('🔍 Date detection debug for column:', columnName);
    console.log('  - Non-null values:', nonNullValues.length);
    console.log('  - Sample values:', nonNullValues.slice(0, 5));
    console.log('  - Valid date count:', datetimeValues.length);
    console.log('  - Ratio:', datetimeRatio);
    console.log('  - Threshold:', threshold);
    console.log('  - Will detect as datetime:', datetimeRatio > threshold);
    
    // Test each value individually
    console.log('  - Individual value tests:');
    nonNullValues.slice(0, 5).forEach((value, idx) => {
      const dateStr = String(value).trim();
      const patternMatch = datePatterns.some(pattern => pattern.test(dateStr));
      const parseResult = Date.parse(dateStr);
      const isValidParse = !isNaN(parseResult);
      console.log(`    [${idx}] "${dateStr}" -> Pattern: ${patternMatch}, Parse: ${isValidParse}`);
    });
  }
  
  // Special case: if column has date-related name and has any valid date values, classify as datetime
  const dateRelatedNames = ['date', 'datetime', 'timestamp', 'created_at', 'updated_at', 'time'];
  const hasDateName = dateRelatedNames.some(name => columnName.toLowerCase().includes(name));
  
  console.log(`🔍 Special case check: hasDateName=${hasDateName}, datetimeValues.length=${datetimeValues.length}`);
  
  if (hasDateName && datetimeValues.length > 0) {
    console.log(`✅ Column "${columnName}" classified as: datetime (special case - date-related column name)`);
    return 'datetime';
  }
  
  console.log(`🔍 Threshold check: datetimeRatio=${datetimeRatio} > threshold=${threshold} = ${datetimeRatio > threshold}`);
  
  if (datetimeRatio > threshold) {
    console.log(`✅ Column "${columnName}" classified as: datetime`);
    return 'datetime';
  }

  // Check if all unique (potential ID) - AFTER datetime check
  if (uniqueValues.size === nonNullValues.length) {
    // Additional checks for ID patterns
    const hasIdPattern = nonNullValues.some(v => 
      String(v).match(/^(id|ID|_id|uuid|key|pk)/i) ||
      columnName.toLowerCase().includes('id') ||
      columnName.toLowerCase().includes('key') ||
      columnName.toLowerCase() === 'pk'
    );
    
    if (hasIdPattern || nonNullValues.length > 10) {
      console.log(`✅ Column "${columnName}" classified as: id_unique`);
      return 'id_unique';
    }
  }
  
  // Check for boolean - FIRST check if values are actual boolean primitives
  const booleanPrimitiveCount = nonNullValues.filter(v => typeof v === 'boolean').length;
  const booleanPrimitiveRatio = booleanPrimitiveCount / nonNullValues.length;
  
  // Debug: Log the actual values and their types for boolean-like columns
  if (columnName.toLowerCase().includes('boolean') || columnName.toLowerCase().includes('rule') || 
      booleanPrimitiveCount > 0 || nonNullValues.some(v => v === true || v === false || v === 'true' || v === 'false')) {
    console.log(`🔍 Boolean detection debug for column "${columnName}":`);
    console.log(`  - Sample values:`, nonNullValues.slice(0, 5));
    console.log(`  - Value types:`, nonNullValues.slice(0, 5).map(v => typeof v));
    console.log(`  - Boolean primitive count: ${booleanPrimitiveCount}/${nonNullValues.length}`);
    console.log(`  - Contains true/false literals:`, nonNullValues.some(v => v === true || v === false));
  }
  
  // If ANY boolean primitives exist (even just one), classify as boolean 
  // This handles rule engine outputs which should always be boolean
  if (booleanPrimitiveCount > 0) {
    console.log(`✅ Column "${columnName}" classified as: boolean (contains ${booleanPrimitiveCount} boolean primitives, ratio: ${booleanPrimitiveRatio})`);
    return 'boolean';
  }
  
  // Check for boolean - includes numeric columns with exactly 2 distinct values
  const booleanValues = new Set(['true', 'false', '1', '0', 'yes', 'no', 'y', 'n']);
  const normalizedValues = nonNullValues.map(v => String(v).toLowerCase());
  const isBooleanCandidate = normalizedValues.every(v => booleanValues.has(v));
  
  // Traditional boolean values
  if (isBooleanCandidate && uniqueValues.size <= 2) {
    // console.log(`✅ Column "${columnName}" classified as: boolean (traditional values)`);
    return 'boolean';
  }
  
  // Numeric columns with exactly 2 distinct values should be classified as boolean
  if (uniqueValues.size === 2 && numericRatio > 0.8) {
    // console.log(`✅ Column "${columnName}" classified as: boolean (numeric with 2 values: ${Array.from(uniqueValues).join(', ')})`);
    return 'boolean';
  }
  
  // Numeric check already done earlier in the function
  
  
  // Check for categorical vs text
  const uniqueRatio = uniqueValues.size / nonNullValues.length;
  const avgLength = nonNullValues.reduce((sum, v) => sum + String(v).length, 0) / nonNullValues.length;
  
  // If low unique ratio and short average length, likely categorical
  if (uniqueRatio < 0.5 && avgLength < 50 && uniqueValues.size < 100) {
    // Special case: if exactly 2 unique values, treat as boolean instead of categorical
    if (uniqueValues.size === 2) {
      console.log(`✅ Column "${columnName}" classified as: boolean (2 categories detected)`);
      return 'boolean';
    }
    
    console.log(`✅ Column "${columnName}" classified as: categorical`);
    return 'categorical';
  }
  
  // Default to text
  return 'text';
}

/**
 * Classifies column type with optional override support
 * @param values - Column values
 * @param columnName - Column name
 * @param typeOverride - Manual type override (from user correction)
 * @returns ColumnType
 */
export function classifyColumnTypeWithOverride(
  values: any[], 
  columnName: string, 
  typeOverride?: ColumnType | null
): ColumnType {
  // If there's a type override, use it
  if (typeOverride) {
    return typeOverride;
  }
  
  // Otherwise use automatic classification
  return classifyColumnType(values, columnName);
}

export function generateColumnProfile(values: any[], columnName: string, typeOverride?: ColumnType | null): ColumnProfile {
  const totalCount = values.length;
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  const nullCount = totalCount - nonNullValues.length;
  const nullPercent = totalCount > 0 ? (nullCount / totalCount) * 100 : 0;
  
  const uniqueValues = new Set(nonNullValues);
  const uniqueCount = uniqueValues.size;
  const uniquePercent = nonNullValues.length > 0 ? (uniqueCount / nonNullValues.length) * 100 : 0;
  
  const detectedType = classifyColumnTypeWithOverride(values, columnName, typeOverride);
  const sampleValues = Array.from(uniqueValues).slice(0, 10);
  
  const profile: ColumnProfile = {
    name: columnName,
    type: detectedType,
    isTypeLocked: !!typeOverride,
    nullCount,
    nullPercent,
    uniqueCount,
    uniquePercent,
    totalCount,
    sampleValues,
    warnings: []
  };
  
  // Generate type-specific statistics
  switch (detectedType) {
    case 'numeric':
      profile.numericStats = generateNumericStats(nonNullValues);
      break;
    case 'categorical':
      profile.categoricalStats = generateCategoricalStats(nonNullValues);
      break;
    case 'boolean':
      profile.booleanStats = generateBooleanStats(nonNullValues);
      break;
    case 'datetime':
      profile.datetimeStats = generateDatetimeStats(nonNullValues);
      break;
    case 'text':
      profile.textStats = generateTextStats(nonNullValues);
      break;
    case 'id_unique':
      profile.idUniqueStats = generateIdUniqueStats(nonNullValues);
      break;
  }
  
  // Add warnings based on profile
  if (nullPercent > 30) {
    profile.warnings.push('high_missing_values');
  }
  
  if (detectedType === 'categorical' && uniqueCount > 50) {
    profile.warnings.push('high_cardinality');
  }
  
  if (detectedType === 'id_unique' && uniquePercent < 100) {
    profile.warnings.push('duplicate_ids');
  }
  
  return profile;
}

function generateNumericStats(values: any[]) {
  const numbers = values.map(v => Number(v)).filter(n => !isNaN(n) && isFinite(n));
  if (numbers.length === 0) return undefined;
  
  numbers.sort((a, b) => a - b);
  
  const min = numbers[0];
  const max = numbers[numbers.length - 1];
  const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  
  const q1Index = Math.floor(numbers.length * 0.25);
  const medianIndex = Math.floor(numbers.length * 0.5);
  const q3Index = Math.floor(numbers.length * 0.75);
  
  const q1 = numbers[q1Index];
  const median = numbers[medianIndex];
  const q3 = numbers[q3Index];
  
  const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
  const std = Math.sqrt(variance);
  
  // Calculate outliers using IQR method
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outlierCount = numbers.filter(n => n < lowerBound || n > upperBound).length;
  const outlierPercent = (outlierCount / numbers.length) * 100;
  
  return {
    min,
    max,
    mean,
    median,
    std,
    q1,
    q3,
    outlierCount,
    outlierPercent
  };
}

function generateCategoricalStats(values: any[]) {
  const counts = new Map<string, number>();
  values.forEach(v => {
    const key = String(v);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  
  const classes = counts.size;
  const total = values.length;
  
  const topCategories = Array.from(counts.entries())
    .map(([value, count]) => ({ value, count, percent: (count / total) * 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  const hasRareCategories = topCategories.some(cat => cat.percent < 1);
  
  return {
    classes,
    topCategories,
    hasRareCategories
  };
}

function generateBooleanStats(values: any[]) {
  const trueValues = new Set(['true', '1', 'yes', 'y']);
  const falseValues = new Set(['false', '0', 'no', 'n']);
  
  let trueCount = 0;
  let falseCount = 0;
  
  // For 2-category columns that aren't traditional boolean values,
  // treat the first unique value as "true" and second as "false"
  const uniqueValues = Array.from(new Set(values.filter(v => v !== null && v !== undefined && v !== '')));
  
  values.forEach(v => {
    // First check for boolean primitives
    if (typeof v === 'boolean') {
      if (v === true) {
        trueCount++;
      } else {
        falseCount++;
      }
    } else {
      const normalized = String(v).toLowerCase();
      if (trueValues.has(normalized)) {
        trueCount++;
      } else if (falseValues.has(normalized)) {
        falseCount++;
      } else if (uniqueValues.length === 2) {
        // For 2-category non-traditional boolean columns, assign first value as "true"
        if (String(v) === String(uniqueValues[0])) {
          trueCount++;
        } else if (String(v) === String(uniqueValues[1])) {
          falseCount++;
        }
      }
    }
  });
  
  const total = trueCount + falseCount;
  const truePercent = total > 0 ? (trueCount / total) * 100 : 0;
  const falsePercent = total > 0 ? (falseCount / total) * 100 : 0;
  
  return {
    trueCount,
    falseCount,
    truePercent,
    falsePercent
  };
}

function generateDatetimeStats(values: any[]) {
  const dates: Date[] = [];
  let invalidCount = 0;
  
  values.forEach(v => {
    const dateStr = String(v);
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      dates.push(parsed);
    } else {
      invalidCount++;
    }
  });
  
  if (dates.length === 0) return undefined;
  
  dates.sort((a, b) => a.getTime() - b.getTime());
  
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];
  const hasInvalid = invalidCount > 0;
  
  // Try to detect common format patterns
  let parseFormat = 'auto';
  const firstValue = String(values[0]);
  if (/^\d{4}-\d{2}-\d{2}$/.test(firstValue)) {
    parseFormat = 'YYYY-MM-DD';
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(firstValue)) {
    parseFormat = 'MM/DD/YYYY';
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(firstValue)) {
    parseFormat = 'ISO 8601';
  }
  
  return {
    minDate,
    maxDate,
    parseFormat,
    hasInvalid,
    invalidCount
  };
}

function generateTextStats(values: any[]) {
  const strings = values.map(v => String(v));
  
  const lengths = strings.map(s => s.length);
  const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  const minLength = Math.min(...lengths);
  const maxLength = Math.max(...lengths);
  
  let whitespaceChars = 0;
  let symbolChars = 0;
  let totalChars = 0;
  
  strings.forEach(s => {
    totalChars += s.length;
    for (const char of s) {
      if (/\s/.test(char)) {
        whitespaceChars++;
      } else if (!/[a-zA-Z0-9]/.test(char)) {
        symbolChars++;
      }
    }
  });
  
  const whitespaceRatio = totalChars > 0 ? (whitespaceChars / totalChars) * 100 : 0;
  const symbolRatio = totalChars > 0 ? (symbolChars / totalChars) * 100 : 0;
  const hasEmptyStrings = strings.some(s => s.length === 0);
  
  return {
    avgLength,
    minLength,
    maxLength,
    whitespaceRatio,
    symbolRatio,
    hasEmptyStrings
  };
}

function generateIdUniqueStats(values: any[]) {
  const uniqueValues = new Set(values);
  const isUnique = uniqueValues.size === values.length;
  const duplicateCount = values.length - uniqueValues.size;
  
  // Try to detect common ID patterns
  let pattern: string | undefined;
  const firstValue = String(values[0]);
  if (/^\d+$/.test(firstValue)) {
    pattern = 'numeric';
  } else if (/^[a-f0-9-]{36}$/.test(firstValue)) {
    pattern = 'uuid';
  } else if (/^[A-Z]{2,}\d+$/.test(firstValue)) {
    pattern = 'alphanumeric';
  }
  
  return {
    isUnique,
    duplicateCount,
    pattern
  };
}

