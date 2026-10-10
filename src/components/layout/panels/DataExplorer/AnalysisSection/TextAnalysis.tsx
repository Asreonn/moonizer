import { useMemo } from 'react';
import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import styles from './AnalysisSection.module.css';
import statStyles from './StatisticCard.module.css';

interface TextAnalysisProps {
  data: any[];
  columnName: string;
}

export function TextAnalysis({ data }: TextAnalysisProps) {
  const { t } = useLanguage();
  
  const analysis = useMemo(() => {
    const textData = data.map(d => String(d)).filter(text => text.length > 0);
    
    if (textData.length === 0) return null;
    
    // Length statistics
    const lengths = textData.map(text => text.length);
    const totalLength = lengths.reduce((a, b) => a + b, 0);
    const avgLength = totalLength / lengths.length;
    const minLength = Math.min(...lengths);
    const maxLength = Math.max(...lengths);
    const medianLength = lengths.sort((a, b) => a - b)[Math.floor(lengths.length / 2)];
    
    // Word analysis
    const allWords = textData.flatMap(text => 
      text.toLowerCase().match(/\b\w+\b/g) || []
    );
    const wordCount = allWords.length;
    const avgWordsPerText = wordCount / textData.length;
    
    // Unique words
    const uniqueWords = new Set(allWords);
    const vocabularySize = uniqueWords.size;
    const vocabularyRichness = vocabularySize / wordCount;
    
    // Word frequency
    const wordFreq = allWords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topWords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count, percentage: (count / wordCount) * 100 }));
    
    // Character analysis
    const allChars = textData.join('');
    const characterCount = allChars.length;
    const digitCount = (allChars.match(/\d/g) || []).length;
    const letterCount = (allChars.match(/[a-zA-Z]/g) || []).length;
    const spaceCount = (allChars.match(/\s/g) || []).length;
    const punctuationCount = (allChars.match(/[.,;:!?'"()-]/g) || []).length;
    
    // Pattern detection
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const urlPattern = /https?:\/\/[^\s]+/g;
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    
    const emailCount = (allChars.match(emailPattern) || []).length;
    const urlCount = (allChars.match(urlPattern) || []).length;
    const phoneCount = (allChars.match(phonePattern) || []).length;
    
    // Capitalization patterns
    const allCapsCount = textData.filter(text => text === text.toUpperCase() && text !== text.toLowerCase()).length;
    const allLowerCount = textData.filter(text => text === text.toLowerCase() && text !== text.toUpperCase()).length;
    const capitalizedCount = textData.filter(text => /^[A-Z][a-z]/.test(text)).length;
    
    return {
      totalTexts: textData.length,
      totalLength,
      avgLength,
      minLength,
      maxLength,
      medianLength,
      wordCount,
      avgWordsPerText,
      vocabularySize,
      vocabularyRichness,
      topWords,
      characterCount,
      digitCount,
      letterCount,
      spaceCount,
      punctuationCount,
      emailCount,
      urlCount,
      phoneCount,
      allCapsCount,
      allLowerCount,
      capitalizedCount
    };
  }, [data]);
  
  if (!analysis) {
    return (
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.text.title')}</h3>
        </div>
        <div className={styles.cardContent}>
          <p>{t('dataExplorer.analysis.text.noValidData')}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.cardGrid}>
      {/* Length Statistics */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.text.length')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.statGrid}>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.text.totalTexts')}</span>
              <span className={statStyles.statValue}>{analysis.totalTexts.toLocaleString()}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.text.avgLength')}</span>
              <span className={statStyles.statValue}>{analysis.avgLength.toFixed(1)}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.text.minLength')}</span>
              <span className={statStyles.statValue}>{analysis.minLength}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.text.maxLength')}</span>
              <span className={statStyles.statValue}>{analysis.maxLength}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Word Statistics */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.text.words')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.statGrid}>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.text.totalWords')}</span>
              <span className={statStyles.statValue}>{analysis.wordCount.toLocaleString()}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.text.avgWordsPerText')}</span>
              <span className={statStyles.statValue}>{analysis.avgWordsPerText.toFixed(1)}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.text.vocabularySize')}</span>
              <span className={statStyles.statValue}>{analysis.vocabularySize.toLocaleString()}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.text.vocabularyRichness')}</span>
              <span className={statStyles.statValue}>{(analysis.vocabularyRichness * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Character Composition */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.text.characters')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.statGrid}>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.text.letters')}</span>
              <span className={statStyles.statValue}>
                {analysis.letterCount} ({((analysis.letterCount / analysis.characterCount) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.text.digits')}</span>
              <span className={statStyles.statValue}>
                {analysis.digitCount} ({((analysis.digitCount / analysis.characterCount) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.text.spaces')}</span>
              <span className={statStyles.statValue}>
                {analysis.spaceCount} ({((analysis.spaceCount / analysis.characterCount) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.text.punctuation')}</span>
              <span className={statStyles.statValue}>
                {analysis.punctuationCount} ({((analysis.punctuationCount / analysis.characterCount) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Words */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.text.topWords')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.categoryList}>
            {analysis.topWords.slice(0, 8).map((item, index) => (
              <div key={index} className={statStyles.categoryItem}>
                <div className={statStyles.categoryHeader}>
                  <span className={statStyles.categoryValue}>{item.word}</span>
                  <span className={statStyles.categoryCount}>{item.count}</span>
                </div>
                <div className={statStyles.categoryBar}>
                  <div 
                    className={statStyles.categoryBarFill}
                    style={{ 
                      width: `${item.percentage}%`,
                      backgroundColor: `hsl(${(index * 45) % 360}, 60%, 60%)`
                    }}
                  />
                </div>
                <span className={statStyles.categoryPercent}>{item.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}