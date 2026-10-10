// Advanced Rule Engine for Custom Boolean Mapping
export type RuleOperator = 
  | '>' | '<' | '>=' | '<=' | '==' | '!='
  | 'contains' | 'startsWith' | 'endsWith' | 'matches' | 'in' | 'between';

export type LogicalOperator = 'AND' | 'OR' | 'NOT';

export interface RuleCondition {
  id: string;
  columnName: string;
  operator: RuleOperator;
  value: any;
  secondValue?: any; // For range/between operations
  caseSensitive?: boolean; // For text operations
}

export interface RuleGroup {
  id: string;
  logicalOperator: LogicalOperator;
  conditions: (RuleCondition | RuleGroup)[];
  negate?: boolean; // For NOT operator
}

export interface RuleSet {
  id: string;
  name: string;
  description?: string;
  rule: RuleGroup;
  resultType: 'boolean' | 'custom';
  trueValue?: any;
  falseValue?: any;
  defaultValue?: any; // For null/undefined cases
  created: Date;
  lastModified: Date;
  tags?: string[];
}

export interface RuleEvaluationContext {
  row: Record<string, any>;
  columnNames: string[];
  rowIndex: number;
  allData: any[];
}

export interface RuleEvaluationResult {
  success: boolean;
  result: any;
  error?: string;
  debug?: any;
}

// Utility function to get numeric value
function getNumericValue(value: any): number | null {
  if (value == null) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

// Utility function to get string value
function getStringValue(value: any, caseSensitive: boolean = true): string {
  if (value == null) return '';
  const str = String(value);
  return caseSensitive ? str : str.toLowerCase();
}

// Date parsing utility
function parseDate(value: any): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Main condition evaluator
export function evaluateCondition(
  condition: RuleCondition, 
  context: RuleEvaluationContext
): RuleEvaluationResult {
  try {
    const { row, columnNames } = context;
    
    // Check if column exists
    if (!columnNames.includes(condition.columnName)) {
      return {
        success: false,
        result: false,
        error: `Column "${condition.columnName}" does not exist`
      };
    }
    
    const columnValue = row[condition.columnName];
    const targetValue = condition.value;
    const secondValue = condition.secondValue;
    const caseSensitive = condition.caseSensitive ?? true;
    
    let result = false;
    
    switch (condition.operator) {
      case '>': {
        const colNum = getNumericValue(columnValue);
        const targetNum = getNumericValue(targetValue);
        if (colNum !== null && targetNum !== null) {
          result = colNum > targetNum;
        }
        break;
      }
      
      case '<': {
        const colNum = getNumericValue(columnValue);
        const targetNum = getNumericValue(targetValue);
        if (colNum !== null && targetNum !== null) {
          result = colNum < targetNum;
        }
        break;
      }
      
      case '>=': {
        const colNum = getNumericValue(columnValue);
        const targetNum = getNumericValue(targetValue);
        if (colNum !== null && targetNum !== null) {
          result = colNum >= targetNum;
        }
        break;
      }
      
      case '<=': {
        const colNum = getNumericValue(columnValue);
        const targetNum = getNumericValue(targetValue);
        if (colNum !== null && targetNum !== null) {
          result = colNum <= targetNum;
        }
        break;
      }
      
      case '==': {
        // Try numeric comparison first, then string comparison
        const colNum = getNumericValue(columnValue);
        const targetNum = getNumericValue(targetValue);
        
        if (colNum !== null && targetNum !== null) {
          result = colNum === targetNum;
        } else {
          const colStr = getStringValue(columnValue, caseSensitive);
          const targetStr = getStringValue(targetValue, caseSensitive);
          result = colStr === targetStr;
        }
        break;
      }
      
      case '!=': {
        // Try numeric comparison first, then string comparison
        const colNum = getNumericValue(columnValue);
        const targetNum = getNumericValue(targetValue);
        
        if (colNum !== null && targetNum !== null) {
          result = colNum !== targetNum;
        } else {
          const colStr = getStringValue(columnValue, caseSensitive);
          const targetStr = getStringValue(targetValue, caseSensitive);
          result = colStr !== targetStr;
        }
        break;
      }
      
      case 'contains': {
        const colStr = getStringValue(columnValue, caseSensitive);
        const targetStr = getStringValue(targetValue, caseSensitive);
        result = colStr.includes(targetStr);
        break;
      }
      
      case 'startsWith': {
        const colStr = getStringValue(columnValue, caseSensitive);
        const targetStr = getStringValue(targetValue, caseSensitive);
        result = colStr.startsWith(targetStr);
        break;
      }
      
      case 'endsWith': {
        const colStr = getStringValue(columnValue, caseSensitive);
        const targetStr = getStringValue(targetValue, caseSensitive);
        result = colStr.endsWith(targetStr);
        break;
      }
      
      case 'matches': {
        const colStr = getStringValue(columnValue, true); // Regex is always case-sensitive by design
        try {
          const flags = caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(String(targetValue), flags);
          result = regex.test(colStr);
        } catch (error) {
          return {
            success: false,
            result: false,
            error: `Invalid regex pattern: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
        break;
      }
      
      case 'in': {
        // targetValue should be an array
        if (!Array.isArray(targetValue)) {
          return {
            success: false,
            result: false,
            error: `'in' operator requires an array of values`
          };
        }
        
        // Try to match with type conversion
        result = targetValue.some(val => {
          const colNum = getNumericValue(columnValue);
          const valNum = getNumericValue(val);
          
          if (colNum !== null && valNum !== null) {
            return colNum === valNum;
          } else {
            const colStr = getStringValue(columnValue, caseSensitive);
            const valStr = getStringValue(val, caseSensitive);
            return colStr === valStr;
          }
        });
        break;
      }
      
      case 'between': {
        if (secondValue === undefined) {
          return {
            success: false,
            result: false,
            error: `'between' operator requires two values`
          };
        }
        
        const colNum = getNumericValue(columnValue);
        const minNum = getNumericValue(targetValue);
        const maxNum = getNumericValue(secondValue);
        
        if (colNum !== null && minNum !== null && maxNum !== null) {
          result = colNum >= minNum && colNum <= maxNum;
        } else {
          // Try date comparison
          const colDate = parseDate(columnValue);
          const minDate = parseDate(targetValue);
          const maxDate = parseDate(secondValue);
          
          if (colDate && minDate && maxDate) {
            result = colDate >= minDate && colDate <= maxDate;
          }
        }
        break;
      }
      
      default:
        return {
          success: false,
          result: false,
          error: `Unknown operator: ${condition.operator}`
        };
    }
    
    return {
      success: true,
      result,
      debug: {
        columnValue,
        targetValue,
        secondValue,
        operator: condition.operator,
        evaluatedResult: result
      }
    };
    
  } catch (error) {
    return {
      success: false,
      result: false,
      error: error instanceof Error ? error.message : 'Unknown evaluation error'
    };
  }
}

// Rule group evaluator with logical operators
export function evaluateRuleGroup(
  group: RuleGroup,
  context: RuleEvaluationContext
): RuleEvaluationResult {
  try {
    if (!group.conditions || group.conditions.length === 0) {
      return {
        success: false,
        result: false,
        error: 'Rule group has no conditions'
      };
    }
    
    const results: boolean[] = [];
    
    // Evaluate all conditions and nested groups
    for (const condition of group.conditions) {
      let conditionResult: RuleEvaluationResult;
      
      if ('logicalOperator' in condition) {
        // It's a nested group
        conditionResult = evaluateRuleGroup(condition as RuleGroup, context);
      } else {
        // It's a condition
        conditionResult = evaluateCondition(condition as RuleCondition, context);
      }
      
      if (!conditionResult.success) {
        return conditionResult; // Propagate error
      }
      
      results.push(conditionResult.result);
    }
    
    // Apply logical operator
    let finalResult: boolean;
    
    switch (group.logicalOperator) {
      case 'AND':
        finalResult = results.every(r => r === true);
        break;
      case 'OR':
        finalResult = results.some(r => r === true);
        break;
      case 'NOT':
        // NOT operator should only have one condition/group
        if (results.length !== 1) {
          return {
            success: false,
            result: false,
            error: 'NOT operator can only be applied to a single condition or group'
          };
        }
        finalResult = !results[0];
        break;
      default:
        return {
          success: false,
          result: false,
          error: `Unknown logical operator: ${group.logicalOperator}`
        };
    }
    
    // Apply negation if specified
    if (group.negate) {
      finalResult = !finalResult;
    }
    
    return {
      success: true,
      result: finalResult,
      debug: {
        individualResults: results,
        logicalOperator: group.logicalOperator,
        finalResult
      }
    };
    
  } catch (error) {
    return {
      success: false,
      result: false,
      error: error instanceof Error ? error.message : 'Unknown group evaluation error'
    };
  }
}

// Main rule set evaluator
export function evaluateRuleSet(
  ruleSet: RuleSet,
  context: RuleEvaluationContext
): RuleEvaluationResult {
  try {
    const groupResult = evaluateRuleGroup(ruleSet.rule, context);
    
    if (!groupResult.success) {
      return groupResult;
    }
    
    let finalValue: any;
    
    if (ruleSet.resultType === 'boolean') {
      finalValue = groupResult.result;
    } else {
      // Custom result type
      if (groupResult.result) {
        finalValue = ruleSet.trueValue ?? true;
      } else {
        finalValue = ruleSet.falseValue ?? false;
      }
    }
    
    return {
      success: true,
      result: finalValue,
      debug: {
        ruleEvaluation: groupResult,
        ruleSetName: ruleSet.name,
        resultType: ruleSet.resultType,
        finalValue
      }
    };
    
  } catch (error) {
    return {
      success: false,
      result: ruleSet.defaultValue ?? false,
      error: error instanceof Error ? error.message : 'Unknown rule set evaluation error'
    };
  }
}

// Apply rule set to entire dataset
export function applyRuleSetToDataset(
  data: any[],
  columnNames: string[],
  targetColumnName: string,
  ruleSet: RuleSet
): { success: boolean; data?: any[]; error?: string } {
  try {
    const newData = data.map((row, rowIndex) => {
      const context: RuleEvaluationContext = {
        row,
        columnNames,
        rowIndex,
        allData: data
      };
      
      const result = evaluateRuleSet(ruleSet, context);
      
      return {
        ...row,
        [targetColumnName]: result.success ? result.result : (ruleSet.defaultValue ?? false)
      };
    });
    
    return {
      success: true,
      data: newData
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown dataset application error'
    };
  }
}

// Utility functions for building rules
export function createCondition(
  columnName: string,
  operator: RuleOperator,
  value: any,
  secondValue?: any,
  caseSensitive = true
): RuleCondition {
  return {
    id: `condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    columnName,
    operator,
    value,
    secondValue,
    caseSensitive
  };
}

export function createRuleGroup(
  logicalOperator: LogicalOperator,
  conditions: (RuleCondition | RuleGroup)[] = [],
  negate = false
): RuleGroup {
  return {
    id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    logicalOperator,
    conditions,
    negate
  };
}

export function createRuleSet(
  name: string,
  rule: RuleGroup,
  options: {
    description?: string;
    resultType?: 'boolean' | 'custom';
    trueValue?: any;
    falseValue?: any;
    defaultValue?: any;
    tags?: string[];
  } = {}
): RuleSet {
  return {
    id: `ruleset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: options.description,
    rule,
    resultType: options.resultType ?? 'boolean',
    trueValue: options.trueValue,
    falseValue: options.falseValue,
    defaultValue: options.defaultValue,
    created: new Date(),
    lastModified: new Date(),
    tags: options.tags
  };
}

// Validation functions
export function validateRuleSet(ruleSet: RuleSet, availableColumns: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  function validateGroup(group: RuleGroup): void {
    if (!group.conditions || group.conditions.length === 0) {
      errors.push('Rule group must have at least one condition');
      return;
    }
    
    if (group.logicalOperator === 'NOT' && group.conditions.length > 1) {
      errors.push('NOT operator can only be applied to a single condition or group');
    }
    
    for (const condition of group.conditions) {
      if ('logicalOperator' in condition) {
        validateGroup(condition as RuleGroup);
      } else {
        const cond = condition as RuleCondition;
        
        if (!availableColumns.includes(cond.columnName)) {
          errors.push(`Column "${cond.columnName}" is not available`);
        }
        
        if (cond.operator === 'between' && cond.secondValue === undefined) {
          errors.push(`'between' operator requires two values`);
        }
        
        if (cond.operator === 'in' && !Array.isArray(cond.value)) {
          errors.push(`'in' operator requires an array of values`);
        }
      }
    }
  }
  
  validateGroup(ruleSet.rule);
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Example rule sets for common scenarios
export const EXAMPLE_RULE_SETS = {
  simpleThreshold: (columnName: string, threshold: number) =>
    createRuleSet(
      `${columnName} > ${threshold}`,
      createRuleGroup('AND', [
        createCondition(columnName, '>', threshold)
      ])
    ),
  
  rangeCheck: (columnName: string, min: number, max: number) =>
    createRuleSet(
      `${columnName} between ${min} and ${max}`,
      createRuleGroup('AND', [
        createCondition(columnName, 'between', min, max)
      ])
    ),
  
  complexCondition: (col1: string, val1: any, col2: string, val2: any) =>
    createRuleSet(
      `${col1} = ${val1} AND ${col2} > ${val2}`,
      createRuleGroup('AND', [
        createCondition(col1, '==', val1),
        createCondition(col2, '>', val2)
      ])
    ),
  
  textPattern: (columnName: string, pattern: string) =>
    createRuleSet(
      `${columnName} matches pattern`,
      createRuleGroup('AND', [
        createCondition(columnName, 'matches', pattern)
      ])
    ),
  
  categoryCheck: (columnName: string, validCategories: string[]) =>
    createRuleSet(
      `${columnName} in valid categories`,
      createRuleGroup('AND', [
        createCondition(columnName, 'in', validCategories)
      ])
    )
};