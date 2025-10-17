import { ColumnProfile } from '../../../../../../core/profiling/columnTypes';
import styles from './AdvancedTextAnalysis.module.css';

interface AdvancedTextAnalysisProps {
  profile: ColumnProfile;
  data: any[];
  t: any;
}

export function AdvancedTextAnalysis({ data, t }: AdvancedTextAnalysisProps) {
  const validTexts = data.filter(v => v !== null && v !== undefined && String(v).length > 0);
  
  if (validTexts.length === 0) {
    return (
      <div className={styles.noDataState}>
        <div className={styles.noDataIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
        </div>
        <p>{t('dataExplorer.advanced.text.noValidData')}</p>
      </div>
    );
  }

  const texts = validTexts.map(v => String(v));
  const lengthAnalysis = analyzeLengths(texts);
  const wordAnalysis = analyzeWords(texts);
  const characterAnalysis = analyzeCharacters(texts);
  const languageAnalysis = analyzeLanguage(texts);
  const patterns = analyzeTextPatterns(texts);

  return (
    <div className={styles.advancedTextAnalysis}>
      <div className={styles.analysisGrid}>
        {/* Length Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.text.lengthAnalysis')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.text.lengthInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.avgLength')}</span>
              <span className={styles.statValue}>{lengthAnalysis.average.toFixed(1)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.medianLength')}</span>
              <span className={styles.statValue}>{lengthAnalysis.median.toFixed(1)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.minLength')}</span>
              <span className={styles.statValue}>{lengthAnalysis.min}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.maxLength')}</span>
              <span className={styles.statValue}>{lengthAnalysis.max}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.lengthVariability')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.text.variability.${lengthAnalysis.variability}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.lengthStdDev')}</span>
              <span className={styles.statValue}>{lengthAnalysis.stdDev.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Word Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.text.wordAnalysis')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.text.wordInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.totalWords')}</span>
              <span className={styles.statValue}>{wordAnalysis.totalWords}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.vocabularySize')}</span>
              <span className={styles.statValue}>{wordAnalysis.vocabularySize}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.avgWordsPerText')}</span>
              <span className={styles.statValue}>{wordAnalysis.avgWordsPerText.toFixed(1)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.avgWordLength')}</span>
              <span className={styles.statValue}>{wordAnalysis.avgWordLength.toFixed(1)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.vocabularyRichness')}</span>
              <span className={styles.statValue}>{(wordAnalysis.vocabularyRichness * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.lexicalDiversity')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.text.diversity.${wordAnalysis.lexicalDiversity}`))}</span>
            </div>
          </div>
        </div>

        {/* Character Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.text.characterAnalysis')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.text.characterInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.alphabetic')}</span>
              <span className={styles.statValue}>{(characterAnalysis.alphabetic * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.numeric')}</span>
              <span className={styles.statValue}>{(characterAnalysis.numeric * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.whitespace')}</span>
              <span className={styles.statValue}>{(characterAnalysis.whitespace * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.punctuation')}</span>
              <span className={styles.statValue}>{(characterAnalysis.punctuation * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.uppercase')}</span>
              <span className={styles.statValue}>{(characterAnalysis.uppercase * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.special')}</span>
              <span className={styles.statValue}>{(characterAnalysis.special * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Language & Structure Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.text.languageAnalysis')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.text.languageInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.readabilityScore')}</span>
              <span className={styles.statValue}>{languageAnalysis.readabilityScore.toFixed(1)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.avgSentenceLength')}</span>
              <span className={styles.statValue}>{languageAnalysis.avgSentenceLength.toFixed(1)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.avgSyllablesPerWord')}</span>
              <span className={styles.statValue}>{languageAnalysis.avgSyllablesPerWord.toFixed(1)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.formality')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.text.formality.${languageAnalysis.formality}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.complexity')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.text.complexity.${languageAnalysis.complexity}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.text.structure')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.text.structure.${languageAnalysis.structure}`))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Analysis */}
      <div className={styles.patternSection}>
        <h4>{t('dataExplorer.advanced.text.detectedPatterns')}</h4>
        <div className={styles.patternList}>
          {patterns.commonPatterns.map((pattern, index) => (
            <div key={index} className={styles.patternItem}>
              <div className={styles.patternName}>{pattern.name}</div>
              <div className={styles.patternCount}>{pattern.count}</div>
              <div className={styles.patternPercentage}>
                {((pattern.count / texts.length) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Most Common Words */}
      <div className={styles.wordsSection}>
        <h4>{t('dataExplorer.advanced.text.mostCommonWords')}</h4>
        <div className={styles.wordsList}>
          {wordAnalysis.topWords.slice(0, 15).map((word, index) => (
            <div key={index} className={styles.wordItem}>
              <div className={styles.wordRank}>#{index + 1}</div>
              <div className={styles.wordText}>{word.word}</div>
              <div className={styles.wordCount}>{word.count}</div>
              <div className={styles.wordBar}>
                <div 
                  className={styles.wordBarFill}
                  style={{ width: `${(word.count / wordAnalysis.topWords[0].count) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function analyzeLengths(texts: string[]) {
  const lengths = texts.map(text => text.length);
  const sorted = [...lengths].sort((a, b) => a - b);
  
  const average = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  const median = sorted.length % 2 === 0 
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 
    : sorted[Math.floor(sorted.length / 2)];
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - average, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  
  let variability = 'low';
  const cv = average > 0 ? stdDev / average : 0;
  if (cv > 0.5) variability = 'high';
  else if (cv > 0.25) variability = 'medium';
  
  return { average, median, min, max, stdDev, variability };
}

function analyzeWords(texts: string[]) {
  const allWords = texts.flatMap(text => 
    text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 0)
  );
  
  const wordFreq: Record<string, number> = {};
  allWords.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  const totalWords = allWords.length;
  const vocabularySize = Object.keys(wordFreq).length;
  const avgWordsPerText = totalWords / texts.length;
  const avgWordLength = allWords.reduce((sum, word) => sum + word.length, 0) / totalWords;
  const vocabularyRichness = vocabularySize / totalWords;
  
  let lexicalDiversity = 'low';
  if (vocabularyRichness > 0.8) lexicalDiversity = 'veryHigh';
  else if (vocabularyRichness > 0.6) lexicalDiversity = 'high';
  else if (vocabularyRichness > 0.4) lexicalDiversity = 'medium';
  
  const topWords = Object.entries(wordFreq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
  
  return {
    totalWords,
    vocabularySize,
    avgWordsPerText,
    avgWordLength,
    vocabularyRichness,
    lexicalDiversity,
    topWords
  };
}

function analyzeCharacters(texts: string[]) {
  const allText = texts.join('');
  const totalChars = allText.length;
  
  const alphabetic = (allText.match(/[a-zA-Z]/g) || []).length / totalChars;
  const numeric = (allText.match(/[0-9]/g) || []).length / totalChars;
  const whitespace = (allText.match(/\s/g) || []).length / totalChars;
  const punctuation = (allText.match(/[.,;:!?'"()[\]{}]/g) || []).length / totalChars;
  const uppercase = (allText.match(/[A-Z]/g) || []).length / totalChars;
  const special = (allText.match(/[^a-zA-Z0-9\s.,;:!?'"()[\]{}]/g) || []).length / totalChars;
  
  return { alphabetic, numeric, whitespace, punctuation, uppercase, special };
}

function analyzeLanguage(texts: string[]) {
  // Simple readability score (Flesch-like approximation)
  const totalSentences = texts.reduce((sum, text) => 
    sum + (text.match(/[.!?]+/g) || []).length, 0);
  const totalWords = texts.reduce((sum, text) => 
    sum + text.split(/\s+/).filter(w => w.length > 0).length, 0);
  const totalSyllables = texts.reduce((sum, text) => 
    sum + estimateSyllables(text), 0);
  
  const avgSentenceLength = totalSentences > 0 ? totalWords / totalSentences : 0;
  const avgSyllablesPerWord = totalWords > 0 ? totalSyllables / totalWords : 0;
  
  const readabilityScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  
  // Simple formality detection
  const formalWords = texts.reduce((sum, text) => 
    sum + (text.match(/\b(therefore|however|furthermore|moreover|consequently|nevertheless)\b/gi) || []).length, 0);
  const informalWords = texts.reduce((sum, text) => 
    sum + (text.match(/\b(gonna|wanna|ain't|don't|can't|won't)\b/gi) || []).length, 0);
  
  let formality = 'neutral';
  if (formalWords > informalWords * 2) formality = 'formal';
  else if (informalWords > formalWords * 2) formality = 'informal';
  
  let complexity = 'simple';
  if (avgSyllablesPerWord > 2) complexity = 'complex';
  else if (avgSyllablesPerWord > 1.5) complexity = 'moderate';
  
  let structure = 'unstructured';
  const hasNumbers = texts.some(text => /\d/.test(text));
  const hasBullets = texts.some(text => /[•\-*]\s/.test(text));
  const hasCapitalization = texts.some(text => /^[A-Z]/.test(text.trim()));
  
  if (hasNumbers && hasBullets) structure = 'highly_structured';
  else if (hasNumbers || hasBullets || hasCapitalization) structure = 'semi_structured';
  
  return {
    readabilityScore,
    avgSentenceLength,
    avgSyllablesPerWord,
    formality,
    complexity,
    structure
  };
}

function estimateSyllables(text: string): number {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  return words.reduce((sum, word) => {
    let syllables = word.match(/[aeiouy]+/g)?.length || 1;
    if (word.endsWith('e')) syllables--;
    return sum + Math.max(1, syllables);
  }, 0);
}

function analyzeTextPatterns(texts: string[]) {
  const patterns = [
    { name: 'Email addresses', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
    { name: 'Phone numbers', regex: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g },
    { name: 'URLs', regex: /https?:\/\/[^\s]+/g },
    { name: 'Dates', regex: /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g },
    { name: 'Numbers', regex: /\b\d+(?:\.\d+)?\b/g },
    { name: 'Capitalized words', regex: /\b[A-Z][A-Za-z]*\b/g },
    { name: 'All caps words', regex: /\b[A-Z]{2,}\b/g },
    { name: 'Hashtags', regex: /#\w+/g },
    { name: 'Mentions', regex: /@\w+/g }
  ];
  
  const commonPatterns = patterns.map(pattern => ({
    name: pattern.name,
    count: texts.reduce((sum, text) => sum + (text.match(pattern.regex) || []).length, 0)
  })).filter(p => p.count > 0);
  
  return { commonPatterns };
}