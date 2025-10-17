import { ColumnProfile } from '../../../../../../core/profiling/columnTypes';
import styles from './AdvancedDateTimeAnalysis.module.css';

interface AdvancedDateTimeAnalysisProps {
  profile: ColumnProfile;
  data: any[];
  t: any;
}

export function AdvancedDateTimeAnalysis({ data, t }: AdvancedDateTimeAnalysisProps) {
  const validDates = data.filter(v => v !== null && v !== undefined && !isNaN(new Date(v).getTime()));
  
  if (validDates.length === 0) {
    return (
      <div className={styles.noDataState}>
        <div className={styles.noDataIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <p>{t('dataExplorer.advanced.datetime.noValidData')}</p>
      </div>
    );
  }

  const dates = validDates.map(v => new Date(v));
  const timeRange = analyzeTimeRange(dates);
  const patterns = analyzeTemporalPatterns(dates);
  const frequency = analyzeFrequencyDistribution(dates);
  const gaps = analyzeTimeGaps(dates);

  return (
    <div className={styles.advancedDateTimeAnalysis}>
      <div className={styles.analysisGrid}>
        {/* Time Range Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.datetime.timeRangeAnalysis')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.datetime.timeRangeInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.earliest')}</span>
              <span className={styles.statValue}>{timeRange.earliest.toLocaleDateString()}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.latest')}</span>
              <span className={styles.statValue}>{timeRange.latest.toLocaleDateString()}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.spanYears')}</span>
              <span className={styles.statValue}>{timeRange.spanYears.toFixed(1)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.spanDays')}</span>
              <span className={styles.statValue}>{timeRange.spanDays}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.timeSpanCategory')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.datetime.timeSpan.${timeRange.category}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.coverage')}</span>
              <span className={styles.statValue}>{(timeRange.coverage * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Temporal Patterns */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.datetime.temporalPatterns')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.datetime.patternsInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.seasonality')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.datetime.seasonality.${patterns.seasonality}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.weekdayPattern')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.datetime.weekdayPattern.${patterns.weekdayPattern}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.monthlyTrend')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.datetime.trend.${patterns.monthlyTrend}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.yearlyTrend')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.datetime.trend.${patterns.yearlyTrend}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.clustering')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.datetime.clustering.${patterns.clustering}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.regularity')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.datetime.regularity.${patterns.regularity}`))}</span>
            </div>
          </div>
        </div>

        {/* Frequency Distribution */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.datetime.frequencyDistribution')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.datetime.frequencyInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.recordsPerDay')}</span>
              <span className={styles.statValue}>{frequency.recordsPerDay.toFixed(2)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.recordsPerWeek')}</span>
              <span className={styles.statValue}>{frequency.recordsPerWeek.toFixed(1)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.recordsPerMonth')}</span>
              <span className={styles.statValue}>{frequency.recordsPerMonth.toFixed(1)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.uniqueDays')}</span>
              <span className={styles.statValue}>{frequency.uniqueDays}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.peakDay')}</span>
              <span className={styles.statValue}>{frequency.peakDay}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.maxDailyRecords')}</span>
              <span className={styles.statValue}>{frequency.maxDailyRecords}</span>
            </div>
          </div>
        </div>

        {/* Gap Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h4>{t('dataExplorer.advanced.datetime.gapAnalysis')}</h4>
            <div className={styles.infoIcon} title={t('dataExplorer.advanced.datetime.gapInfo')}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" stroke="currentColor" fill="none"/>
                <path d="M8 4v4l3 3"/>
              </svg>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.avgGapDays')}</span>
              <span className={styles.statValue}>{gaps.averageGapDays.toFixed(1)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.medianGapDays')}</span>
              <span className={styles.statValue}>{gaps.medianGapDays.toFixed(1)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.maxGapDays')}</span>
              <span className={styles.statValue}>{gaps.maxGapDays}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.significantGaps')}</span>
              <span className={styles.statValue}>{gaps.significantGaps}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.continuity')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.datetime.continuity.${gaps.continuity}`))}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('dataExplorer.advanced.datetime.gapVariability')}</span>
              <span className={styles.statValue}>{String(t(`dataExplorer.advanced.datetime.variability.${gaps.variability}`))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Active Periods */}
      <div className={styles.activePeriodsSection}>
        <h4>{t('dataExplorer.advanced.datetime.mostActivePeriods')}</h4>
        <div className={styles.periodsList}>
          <div className={styles.periodsGrid}>
            <div className={styles.periodCategory}>
              <h5>{t('dataExplorer.advanced.datetime.topYears')}</h5>
              {frequency.topYears.slice(0, 5).map((year, index) => (
                <div key={index} className={styles.periodItem}>
                  <div className={styles.periodName}>{year.year}</div>
                  <div className={styles.periodCount}>{year.count}</div>
                  <div className={styles.periodBar}>
                    <div 
                      className={styles.periodBarFill}
                      style={{ width: `${(year.count / frequency.topYears[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.periodCategory}>
              <h5>{t('dataExplorer.advanced.datetime.topMonths')}</h5>
              {frequency.topMonths.slice(0, 5).map((month, index) => (
                <div key={index} className={styles.periodItem}>
                  <div className={styles.periodName}>{month.month}</div>
                  <div className={styles.periodCount}>{month.count}</div>
                  <div className={styles.periodBar}>
                    <div 
                      className={styles.periodBarFill}
                      style={{ width: `${(month.count / frequency.topMonths[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.periodCategory}>
              <h5>{t('dataExplorer.advanced.datetime.topWeekdays')}</h5>
              {frequency.topWeekdays.slice(0, 7).map((day, index) => (
                <div key={index} className={styles.periodItem}>
                  <div className={styles.periodName}>{day.day}</div>
                  <div className={styles.periodCount}>{day.count}</div>
                  <div className={styles.periodBar}>
                    <div 
                      className={styles.periodBarFill}
                      style={{ width: `${(day.count / frequency.topWeekdays[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function analyzeTimeRange(dates: Date[]) {
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const earliest = sorted[0];
  const latest = sorted[sorted.length - 1];
  
  const spanMs = latest.getTime() - earliest.getTime();
  const spanDays = Math.ceil(spanMs / (1000 * 60 * 60 * 24));
  const spanYears = spanDays / 365.25;
  
  let category = 'days';
  if (spanYears > 10) category = 'decades';
  else if (spanYears > 1) category = 'years';
  else if (spanDays > 30) category = 'months';
  else if (spanDays > 7) category = 'weeks';
  
  // Coverage: ratio of unique days to total days in range
  const uniqueDays = new Set(dates.map(d => d.toDateString())).size;
  const coverage = spanDays > 0 ? uniqueDays / spanDays : 0;
  
  return {
    earliest,
    latest,
    spanDays,
    spanYears,
    category,
    coverage
  };
}

function analyzeTemporalPatterns(dates: Date[]) {
  // Seasonal analysis
  const monthCounts: Record<number, number> = {};
  const weekdayCounts: Record<number, number> = {};
  const yearCounts: Record<number, number> = {};
  
  dates.forEach(date => {
    const month = date.getMonth();
    const weekday = date.getDay();
    const year = date.getFullYear();
    
    monthCounts[month] = (monthCounts[month] || 0) + 1;
    weekdayCounts[weekday] = (weekdayCounts[weekday] || 0) + 1;
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  });
  
  const monthValues = Object.values(monthCounts);
  const weekdayValues = Object.values(weekdayCounts);
  const yearValues = Object.values(yearCounts);
  
  // Calculate coefficients of variation
  const monthCV = calculateCV(monthValues);
  const weekdayCV = calculateCV(weekdayValues);
  calculateCV(yearValues);
  
  // Determine seasonality
  let seasonality = 'none';
  if (monthCV > 0.5) seasonality = 'strong';
  else if (monthCV > 0.3) seasonality = 'moderate';
  else if (monthCV > 0.15) seasonality = 'weak';
  
  // Weekday pattern
  let weekdayPattern = 'uniform';
  if (weekdayCV > 0.3) weekdayPattern = 'strong_weekday_bias';
  else if (weekdayCV > 0.15) weekdayPattern = 'moderate_weekday_bias';
  
  // Trends
  let monthlyTrend = 'stable';
  const monthEntries = Object.entries(monthCounts).sort(([a], [b]) => Number(a) - Number(b));
  if (monthEntries.length >= 6) {
    const firstHalf = monthEntries.slice(0, 6).reduce((sum, [, count]) => sum + count, 0);
    const secondHalf = monthEntries.slice(6).reduce((sum, [, count]) => sum + count, 0);
    const diff = (secondHalf - firstHalf) / firstHalf;
    if (diff > 0.2) monthlyTrend = 'increasing';
    else if (diff < -0.2) monthlyTrend = 'decreasing';
  }
  
  let yearlyTrend = 'stable';
  const yearEntries = Object.entries(yearCounts).sort(([a], [b]) => Number(a) - Number(b));
  if (yearEntries.length >= 3) {
    const slope = calculateTrend(yearEntries.map(([year, count]) => [Number(year), count]));
    if (Math.abs(slope) > 0.1) {
      yearlyTrend = slope > 0 ? 'increasing' : 'decreasing';
    }
  }
  
  // Clustering analysis
  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const gaps = [];
  for (let i = 1; i < sortedDates.length; i++) {
    const gapDays = (sortedDates[i].getTime() - sortedDates[i-1].getTime()) / (1000 * 60 * 60 * 24);
    gaps.push(gapDays);
  }
  
  const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const gapCV = calculateCV(gaps);
  
  let clustering = 'scattered';
  if (gapCV > 2) clustering = 'highly_clustered';
  else if (gapCV > 1) clustering = 'moderately_clustered';
  
  // Regularity
  let regularity = 'irregular';
  if (gapCV < 0.3 && avgGap < 7) regularity = 'very_regular';
  else if (gapCV < 0.6 && avgGap < 30) regularity = 'regular';
  else if (gapCV < 1.2) regularity = 'somewhat_regular';
  
  return {
    seasonality,
    weekdayPattern,
    monthlyTrend,
    yearlyTrend,
    clustering,
    regularity
  };
}

function analyzeFrequencyDistribution(dates: Date[]) {
  const timeRange = analyzeTimeRange(dates);
  const spanDays = timeRange.spanDays || 1;
  
  const recordsPerDay = dates.length / spanDays;
  const recordsPerWeek = recordsPerDay * 7;
  const recordsPerMonth = recordsPerDay * 30.44;
  
  // Daily frequency analysis
  const dailyCounts: Record<string, number> = {};
  dates.forEach(date => {
    const dateStr = date.toDateString();
    dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
  });
  
  const uniqueDays = Object.keys(dailyCounts).length;
  const dailyCountValues = Object.values(dailyCounts);
  const maxDailyRecords = Math.max(...dailyCountValues);
  const peakDayEntry = Object.entries(dailyCounts).find(([, count]) => count === maxDailyRecords);
  const peakDay = peakDayEntry ? new Date(peakDayEntry[0]).toLocaleDateString() : 'N/A';
  
  // Analyze by periods
  const yearCounts: Record<number, number> = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthCounts: Record<string, number> = {};
  const weekdayCounts: Record<string, number> = {};
  
  dates.forEach(date => {
    const year = date.getFullYear();
    const month = monthNames[date.getMonth()];
    const weekday = weekdayNames[date.getDay()];
    
    yearCounts[year] = (yearCounts[year] || 0) + 1;
    monthCounts[month] = (monthCounts[month] || 0) + 1;
    weekdayCounts[weekday] = (weekdayCounts[weekday] || 0) + 1;
  });
  
  const topYears = Object.entries(yearCounts)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => b.count - a.count);
  
  const topMonths = Object.entries(monthCounts)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => b.count - a.count);
  
  const topWeekdays = Object.entries(weekdayCounts)
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => b.count - a.count);
  
  return {
    recordsPerDay,
    recordsPerWeek,
    recordsPerMonth,
    uniqueDays,
    peakDay,
    maxDailyRecords,
    topYears,
    topMonths,
    topWeekdays
  };
}

function analyzeTimeGaps(dates: Date[]) {
  if (dates.length < 2) {
    return {
      averageGapDays: 0,
      medianGapDays: 0,
      maxGapDays: 0,
      significantGaps: 0,
      continuity: 'unknown',
      variability: 'unknown'
    };
  }
  
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const gaps = [];
  
  for (let i = 1; i < sorted.length; i++) {
    const gapMs = sorted[i].getTime() - sorted[i-1].getTime();
    const gapDays = gapMs / (1000 * 60 * 60 * 24);
    gaps.push(gapDays);
  }
  
  const averageGapDays = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const sortedGaps = [...gaps].sort((a, b) => a - b);
  const medianGapDays = sortedGaps.length % 2 === 0
    ? (sortedGaps[sortedGaps.length / 2 - 1] + sortedGaps[sortedGaps.length / 2]) / 2
    : sortedGaps[Math.floor(sortedGaps.length / 2)];
  const maxGapDays = Math.max(...gaps);
  
  // Significant gaps (more than 3x average)
  const significantGaps = gaps.filter(gap => gap > averageGapDays * 3).length;
  
  // Continuity assessment
  let continuity = 'continuous';
  if (maxGapDays > 365) continuity = 'major_breaks';
  else if (maxGapDays > 90) continuity = 'some_breaks';
  else if (maxGapDays > 30) continuity = 'minor_breaks';
  
  // Gap variability
  const gapCV = calculateCV(gaps);
  let variability = 'consistent';
  if (gapCV > 2) variability = 'highly_variable';
  else if (gapCV > 1) variability = 'moderately_variable';
  else if (gapCV > 0.5) variability = 'somewhat_variable';
  
  return {
    averageGapDays,
    medianGapDays,
    maxGapDays,
    significantGaps,
    continuity,
    variability
  };
}

function calculateCV(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return stdDev / mean;
}

function calculateTrend(points: [number, number][]): number {
  if (points.length < 2) return 0;
  const n = points.length;
  const meanX = points.reduce((sum, [x]) => sum + x, 0) / n;
  const meanY = points.reduce((sum, [, y]) => sum + y, 0) / n;
  
  const numerator = points.reduce((sum, [x, y]) => sum + (x - meanX) * (y - meanY), 0);
  const denominator = points.reduce((sum, [x]) => sum + Math.pow(x - meanX, 2), 0);
  
  return denominator !== 0 ? numerator / denominator : 0;
}