import { ColumnProfile } from '../../../../../../core/profiling/columnTypes';
import { AnalyticsTooltip } from '../../../../../ui/AnalyticsTooltip';
import styles from './TextAnalysis.module.css';

interface TextAnalysisProps {
  profile: ColumnProfile;
  t: any;
}

export function TextAnalysis({ profile, t }: TextAnalysisProps) {
  const stats = profile.textStats;
  
  if (!stats) {
    return (
      <div className={styles.noData}>
        <p>{t('dataExplorer.analysis.text.noValidData')}</p>
      </div>
    );
  }

  // Calculate word statistics from sample values
  const sampleTexts = profile.sampleValues.map(v => String(v)).filter(s => s.length > 0);
  const wordStats = calculateWordStats(sampleTexts);
  const characterStats = calculateCharacterStats(sampleTexts);

  return (
    <div className={styles.textAnalysis}>
      {/* Length Statistics */}
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>
          {t('dataExplorer.analysis.text.length')}
        </h4>
        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="dataPoints">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.text.totalTexts')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{profile.totalCount - profile.nullCount}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="averageLength">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.text.avgLength')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{stats.avgLength.toFixed(1)}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="minimumValue">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.text.minLength')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{stats.minLength}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="maximumValue">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.text.maxLength')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{stats.maxLength}</span>
          </div>
        </div>
      </div>

      {/* Word Analysis */}
      {wordStats && (
        <div className={styles.analysisGroup}>
          <h4 className={styles.groupTitle}>
            {t('dataExplorer.analysis.text.words')}
          </h4>
          <div className={styles.statGrid}>
            <div className={styles.stat}>
              <AnalyticsTooltip metricKey="totalWords">
                <span className={styles.statLabel}>{t('dataExplorer.analysis.text.totalWords')}</span>
              </AnalyticsTooltip>
              <span className={styles.statValue}>{wordStats.totalWords}</span>
            </div>
            <div className={styles.stat}>
              <AnalyticsTooltip metricKey="averageLength">
                <span className={styles.statLabel}>{t('dataExplorer.analysis.text.avgWordsPerText')}</span>
              </AnalyticsTooltip>
              <span className={styles.statValue}>{wordStats.avgWordsPerText.toFixed(1)}</span>
            </div>
            <div className={styles.stat}>
              <AnalyticsTooltip metricKey="uniqueValues">
                <span className={styles.statLabel}>{t('dataExplorer.analysis.text.vocabularySize')}</span>
              </AnalyticsTooltip>
              <span className={styles.statValue}>{wordStats.vocabularySize}</span>
            </div>
            <div className={styles.stat}>
              <AnalyticsTooltip metricKey="vocabularyRichness">
                <span className={styles.statLabel}>{t('dataExplorer.analysis.text.vocabularyRichness')}</span>
              </AnalyticsTooltip>
              <span className={styles.statValue}>{(wordStats.vocabularyRichness * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Character Composition */}
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>
          {t('dataExplorer.analysis.text.characters')}
        </h4>
        <div className={styles.compositionChart}>
          <div className={styles.compositionBar}>
            <div
              className={`${styles.segment} ${styles.letters}`}
              style={{ width: `${characterStats.letterPercent}%` }}
              title={`${t('dataExplorer.analysis.text.letters')}: ${characterStats.letterPercent.toFixed(1)}%`}
            />
            <div
              className={`${styles.segment} ${styles.digits}`}
              style={{ width: `${characterStats.digitPercent}%` }}
              title={`${t('dataExplorer.analysis.text.digits')}: ${characterStats.digitPercent.toFixed(1)}%`}
            />
            <div
              className={`${styles.segment} ${styles.spaces}`}
              style={{ width: `${stats.whitespaceRatio}%` }}
              title={`${t('dataExplorer.analysis.text.spaces')}: ${stats.whitespaceRatio.toFixed(1)}%`}
            />
            <div
              className={`${styles.segment} ${styles.punctuation}`}
              style={{ width: `${stats.symbolRatio}%` }}
              title={`${t('dataExplorer.analysis.text.punctuation')}: ${stats.symbolRatio.toFixed(1)}%`}
            />
          </div>
          
          <div className={styles.compositionLegend}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.letters}`} />
              <span>{t('dataExplorer.analysis.text.letters')}: {characterStats.letterPercent.toFixed(1)}%</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.digits}`} />
              <span>{t('dataExplorer.analysis.text.digits')}: {characterStats.digitPercent.toFixed(1)}%</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.spaces}`} />
              <span>{t('dataExplorer.analysis.text.spaces')}: {stats.whitespaceRatio.toFixed(1)}%</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.punctuation}`} />
              <span>{t('dataExplorer.analysis.text.punctuation')}: {stats.symbolRatio.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Most Common Words */}
      {wordStats?.topWords && (
        <div className={styles.analysisGroup}>
          <h4 className={styles.groupTitle}>
            {t('dataExplorer.analysis.text.topWords')}
          </h4>
          <div className={styles.wordCloud}>
            {wordStats.topWords.slice(0, 10).map((word, index) => (
              <div
                key={index}
                className={styles.wordItem}
                style={{
                  fontSize: `${Math.max(0.8, word.frequency * 2)}rem`,
                  opacity: Math.max(0.5, word.frequency)
                }}
              >
                <span className={styles.wordText}>{word.word}</span>
                <span className={styles.wordCount}>({word.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Length Distribution */}
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>{t('dataExplorer.analysis.text.lengthDistribution')}</h4>
        <div className={styles.lengthDistribution}>
          {renderLengthDistribution(sampleTexts)}
        </div>
      </div>
    </div>
  );
}

function calculateWordStats(texts: string[]) {
  if (texts.length === 0) return null;

  const wordCounts = new Map<string, number>();
  let totalWords = 0;

  texts.forEach(text => {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    totalWords += words.length;
    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
  });

  const vocabularySize = wordCounts.size;
  const avgWordsPerText = totalWords / texts.length;
  const vocabularyRichness = vocabularySize / totalWords;

  const topWords = Array.from(wordCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([word, count]) => ({
      word,
      count,
      frequency: count / totalWords
    }));

  return {
    totalWords,
    avgWordsPerText,
    vocabularySize,
    vocabularyRichness,
    topWords
  };
}

function calculateCharacterStats(texts: string[]) {
  let letters = 0;
  let digits = 0;
  let total = 0;

  texts.forEach(text => {
    for (const char of text) {
      total++;
      if (/[a-zA-Z]/.test(char)) {
        letters++;
      } else if (/\d/.test(char)) {
        digits++;
      }
    }
  });

  return {
    letterPercent: total > 0 ? (letters / total) * 100 : 0,
    digitPercent: total > 0 ? (digits / total) * 100 : 0
  };
}

function renderLengthDistribution(texts: string[]) {
  const lengthBuckets = new Map<string, number>();
  
  texts.forEach(text => {
    const length = text.length;
    let bucket: string;
    
    if (length === 0) bucket = '0';
    else if (length <= 5) bucket = '1-5';
    else if (length <= 10) bucket = '6-10';
    else if (length <= 25) bucket = '11-25';
    else if (length <= 50) bucket = '26-50';
    else if (length <= 100) bucket = '51-100';
    else bucket = '100+';
    
    lengthBuckets.set(bucket, (lengthBuckets.get(bucket) || 0) + 1);
  });

  const maxCount = Math.max(...lengthBuckets.values());
  const bucketOrder = ['0', '1-5', '6-10', '11-25', '26-50', '51-100', '100+'];

  return (
    <div className={styles.distributionBars}>
      {bucketOrder.map(bucket => {
        const count = lengthBuckets.get(bucket) || 0;
        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
        
        return (
          <div key={bucket} className={styles.distributionBar}>
            <div className={styles.bucketLabel}>{bucket}</div>
            <div className={styles.barContainer}>
              <div
                className={styles.bar}
                style={{ height: `${percentage}%` }}
              />
            </div>
            <div className={styles.bucketCount}>{count}</div>
          </div>
        );
      })}
    </div>
  );
}