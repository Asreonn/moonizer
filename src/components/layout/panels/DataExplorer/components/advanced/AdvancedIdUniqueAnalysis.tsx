import { ColumnProfile } from '../../../../../../core/profiling/columnTypes';
import styles from './AdvancedIdUniqueAnalysis.module.css';

interface AdvancedIdUniqueAnalysisProps {
  profile: ColumnProfile;
  data: any[];
  t: any;
}

export function AdvancedIdUniqueAnalysis({ data, t }: AdvancedIdUniqueAnalysisProps) {
  const validIds = data.filter(v => v !== null && v !== undefined && String(v).length > 0);
  
  if (validIds.length === 0) {
    return (
      <div className={styles.noDataState}>
        <div className={styles.noDataIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="m22 2-5 10-5-5 10-5z"/>
            <path d="m17 12 5 5-5 5"/>
          </svg>
        </div>
        <p>{t('dataExplorer.advanced.idUnique.noValidData')}</p>
      </div>
    );
  }

  const strings = validIds.map(v => String(v));
  const uniqueness = analyzeUniqueness(strings);
  const patterns = analyzeIdPatterns(strings);
  const structure = analyzeStructure(strings);
  const quality = assessIdQuality(strings);

  return (
    <div className={styles.advancedIdUniqueAnalysis}>
      <div className={styles.analysisGrid}>
        {/* Uniqueness Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.idUnique.uniquenessAnalysis')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.idUnique.uniquenessInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.totalRecords')}</span>
              <span className={styles.statValue}>{uniqueness.totalRecords}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.uniqueRecords')}</span>
              <span className={styles.statValue}>{uniqueness.uniqueRecords}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.duplicates')}</span>
              <span className={styles.statValue}>{uniqueness.duplicates}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.uniquenessRatio')}</span>
              <span className={styles.statValue}>{(uniqueness.uniquenessRatio * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.idQuality')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.idUnique.quality.${uniqueness.quality}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.cardinality')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.idUnique.cardinality.${uniqueness.cardinality}`))}</span>
            </div>
          </div>
        </div>

        {/* Pattern Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.idUnique.patternAnalysis')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.idUnique.patternInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.detectedFormat')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.idUnique.formats.${patterns.format}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.consistency')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.idUnique.consistency.${patterns.consistency}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.hasSequence')}</span>
              <span className={styles.statValue}>{String(patterns.hasSequence ? t('dataExplorer.advanced.idUnique.yes') : t('dataExplorer.advanced.idUnique.no'))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.hasPrefixSuffix')}</span>
              <span className={styles.statValue}>{String(patterns.hasPrefixSuffix ? t('dataExplorer.advanced.idUnique.yes') : t('dataExplorer.advanced.idUnique.no'))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.formatVariations')}</span>
              <span className={styles.statValue}>{patterns.formatVariations}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.standardization')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.idUnique.standardization.${patterns.standardization}`))}</span>
            </div>
          </div>
        </div>

        {/* Structure Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.idUnique.structureAnalysis')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.idUnique.structureInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.avgLength')}</span>
              <span className={styles.statValue}>{structure.avgLength.toFixed(1)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.minLength')}</span>
              <span className={styles.statValue}>{structure.minLength}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.maxLength')}</span>
              <span className={styles.statValue}>{structure.maxLength}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.lengthVariability')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.idUnique.variability.${structure.lengthVariability}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.characterTypes')}</span>
              <span className={styles.statValue}>{String(structure.characterTypes.join(', '))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.complexity')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.idUnique.complexity.${structure.complexity}`))}</span>
            </div>
          </div>
        </div>

        {/* Quality Assessment */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.idUnique.qualityAssessment')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.idUnique.qualityInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.collisionRisk')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.idUnique.risk.${quality.collisionRisk}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.entropy')}</span>
              <span className={styles.statValue}>{quality.entropy.toFixed(3)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.predictability')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.idUnique.predictability.${quality.predictability}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.security')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.idUnique.security.${quality.security}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.scalability')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.idUnique.scalability.${quality.scalability}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.idUnique.recommendation')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.idUnique.recommendations.${quality.recommendation}`))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detected Patterns */}
      <div className={styles.patternsSection}>
        <h4>{t('dataExplorer.advanced.idUnique.detectedPatterns')}</h4>
        <div className={styles.patternsList}>
          {patterns.commonPatterns.map((pattern, index) => (
            <div key={index} className={styles.patternItem}>
              <div className={styles.patternName}>{pattern.name}</div>
              <div className={styles.patternExample}>{pattern.example}</div>
              <div className={styles.patternCount}>{pattern.count}</div>
              <div className={styles.patternPercentage}>
                {((pattern.count / strings.length) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sample IDs */}
      <div className={styles.samplesSection}>
        <h4>{t('dataExplorer.advanced.idUnique.sampleIds')}</h4>
        <div className={styles.samplesList}>
          {strings.slice(0, 10).map((id, index) => (
            <div key={index} className={styles.sampleItem}>
              <div className={styles.sampleRank}>#{index + 1}</div>
              <div className={styles.sampleValue}>{id}</div>
              <div className={styles.sampleLength}>{id.length} chars</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function analyzeUniqueness(strings: string[]) {
  const uniqueSet = new Set(strings);
  const totalRecords = strings.length;
  const uniqueRecords = uniqueSet.size;
  const duplicates = totalRecords - uniqueRecords;
  const uniquenessRatio = totalRecords > 0 ? uniqueRecords / totalRecords : 0;
  
  let quality = 'poor';
  if (uniquenessRatio === 1) quality = 'perfect';
  else if (uniquenessRatio >= 0.99) quality = 'excellent';
  else if (uniquenessRatio >= 0.95) quality = 'good';
  else if (uniquenessRatio >= 0.8) quality = 'fair';
  
  let cardinality = 'low';
  if (uniqueRecords > 1000000) cardinality = 'very_high';
  else if (uniqueRecords > 100000) cardinality = 'high';
  else if (uniqueRecords > 10000) cardinality = 'medium';
  
  return {
    totalRecords,
    uniqueRecords,
    duplicates,
    uniquenessRatio,
    quality,
    cardinality
  };
}

function analyzeIdPatterns(strings: string[]) {
  // Common ID patterns
  const patterns = [
    { name: 'UUID v4', regex: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
    { name: 'UUID (any version)', regex: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, example: '550e8400-e29b-41d4-a716-446655440000' },
    { name: 'MongoDB ObjectId', regex: /^[0-9a-f]{24}$/i, example: '507f1f77bcf86cd799439011' },
    { name: 'Sequential Number', regex: /^\d+$/, example: '12345' },
    { name: 'Prefixed Sequential', regex: /^[A-Za-z]+\d+$/, example: 'USER12345' },
    { name: 'Hash-like', regex: /^[0-9a-f]{32,}$/i, example: 'd41d8cd98f00b204e9800998ecf8427e' },
    { name: 'Base64-like', regex: /^[A-Za-z0-9+/]+=*$/, example: 'SGVsbG8gV29ybGQ=' },
    { name: 'Alphanumeric', regex: /^[A-Za-z0-9]+$/, example: 'abc123DEF' },
    { name: 'Custom Format', regex: /^[A-Z]{2,4}-\d{4,8}$/, example: 'ABC-12345678' }
  ];
  
  let detectedFormat = 'mixed';
  let maxMatches = 0;
  const formatCounts: Record<string, number> = {};
  
  patterns.forEach(pattern => {
    const matches = strings.filter(s => pattern.regex.test(s));
    formatCounts[pattern.name] = matches.length;
    if (matches.length > maxMatches) {
      maxMatches = matches.length;
      if (matches.length / strings.length > 0.8) {
        detectedFormat = pattern.name.toLowerCase().replace(/[^a-z]/g, '_');
      }
    }
  });
  
  const formatVariations = Object.values(formatCounts).filter(count => count > 0).length;
  
  let consistency = 'poor';
  const dominantFormatRatio = maxMatches / strings.length;
  if (dominantFormatRatio >= 0.95) consistency = 'excellent';
  else if (dominantFormatRatio >= 0.8) consistency = 'good';
  else if (dominantFormatRatio >= 0.6) consistency = 'fair';
  
  // Check for sequential patterns
  const numericIds = strings.filter(s => /^\d+$/.test(s)).map(Number).sort((a, b) => a - b);
  let hasSequence = false;
  if (numericIds.length > 2) {
    let sequential = 0;
    for (let i = 1; i < numericIds.length; i++) {
      if (numericIds[i] === numericIds[i-1] + 1) sequential++;
    }
    hasSequence = sequential / (numericIds.length - 1) > 0.8;
  }
  
  // Check for prefix/suffix patterns
  const hasPrefixSuffix = strings.some(s => /^[A-Za-z]+[0-9]+$|^[0-9]+[A-Za-z]+$/.test(s));
  
  let standardization = 'poor';
  if (consistency === 'excellent' && formatVariations === 1) standardization = 'excellent';
  else if (consistency === 'good' && formatVariations <= 2) standardization = 'good';
  else if (formatVariations <= 3) standardization = 'fair';
  
  const commonPatterns = Object.entries(formatCounts)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => {
      const pattern = patterns.find(p => p.name === name)!;
      return { name, count, example: pattern.example };
    })
    .sort((a, b) => b.count - a.count);
  
  return {
    format: detectedFormat,
    consistency,
    hasSequence,
    hasPrefixSuffix,
    formatVariations,
    standardization,
    commonPatterns
  };
}

function analyzeStructure(strings: string[]) {
  const lengths = strings.map(s => s.length);
  const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  const minLength = Math.min(...lengths);
  const maxLength = Math.max(...lengths);
  
  let lengthVariability = 'consistent';
  const lengthRange = maxLength - minLength;
  if (lengthRange > avgLength) lengthVariability = 'highly_variable';
  else if (lengthRange > avgLength * 0.5) lengthVariability = 'moderately_variable';
  else if (lengthRange > 0) lengthVariability = 'slightly_variable';
  
  // Analyze character types
  const hasLowercase = strings.some(s => /[a-z]/.test(s));
  const hasUppercase = strings.some(s => /[A-Z]/.test(s));
  const hasNumbers = strings.some(s => /\d/.test(s));
  const hasSpecialChars = strings.some(s => /[^A-Za-z0-9]/.test(s));
  
  const characterTypes = [];
  if (hasLowercase) characterTypes.push('lowercase');
  if (hasUppercase) characterTypes.push('uppercase');
  if (hasNumbers) characterTypes.push('numbers');
  if (hasSpecialChars) characterTypes.push('special');
  
  let complexity = 'simple';
  if (characterTypes.length >= 3 && avgLength > 15) complexity = 'high';
  else if (characterTypes.length >= 2 && avgLength > 8) complexity = 'medium';
  
  return {
    avgLength,
    minLength,
    maxLength,
    lengthVariability,
    characterTypes,
    complexity
  };
}

function assessIdQuality(strings: string[]) {
  const uniqueChars = new Set(strings.join('')).size;
  const entropy = uniqueChars > 0 ? Math.log2(uniqueChars) : 0;
  
  // Collision risk assessment
  const avgLength = strings.reduce((sum, s) => sum + s.length, 0) / strings.length;
  let collisionRisk = 'high';
  if (avgLength >= 32 && uniqueChars >= 16) collisionRisk = 'very_low';
  else if (avgLength >= 16 && uniqueChars >= 10) collisionRisk = 'low';
  else if (avgLength >= 8 && uniqueChars >= 8) collisionRisk = 'medium';
  
  // Predictability
  const hasSequential = strings.some(s => /^\d+$/.test(s));
  const hasTimestamp = strings.some(s => /\d{10,13}/.test(s));
  let predictability = 'low';
  if (hasSequential || hasTimestamp) predictability = 'high';
  else if (strings.some(s => /^[A-Za-z]+\d+$/.test(s))) predictability = 'medium';
  
  // Security assessment
  let security = 'poor';
  if (entropy > 4 && avgLength >= 16 && !hasSequential) security = 'good';
  else if (entropy > 3 && avgLength >= 8) security = 'fair';
  
  // Scalability
  let scalability = 'poor';
  if (collisionRisk === 'very_low' || collisionRisk === 'low') scalability = 'excellent';
  else if (collisionRisk === 'medium') scalability = 'good';
  
  // Overall recommendation
  let recommendation = 'review_format';
  if (security === 'good' && scalability === 'excellent') recommendation = 'excellent_ids';
  else if (collisionRisk === 'high') recommendation = 'increase_entropy';
  else if (predictability === 'high') recommendation = 'reduce_predictability';
  
  return {
    collisionRisk,
    entropy,
    predictability,
    security,
    scalability,
    recommendation
  };
}