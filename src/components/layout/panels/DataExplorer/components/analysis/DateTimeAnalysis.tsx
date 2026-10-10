import { ColumnProfile } from '../../../../../../core/profiling/columnTypes';
import { AnalyticsTooltip } from '../../../../../ui/AnalyticsTooltip';
import styles from './DateTimeAnalysis.module.css';

interface DateTimeAnalysisProps {
  profile: ColumnProfile;
  t: any;
}

export function DateTimeAnalysis({ profile, t }: DateTimeAnalysisProps) {
  const stats = profile.datetimeStats;
  
  if (!stats) {
    return (
      <div className={styles.noData}>
        <p>{t('dataExplorer.analysis.datetime.noValidData')}</p>
      </div>
    );
  }

  const timeSpan = calculateTimeSpan(stats.minDate, stats.maxDate, t);
  const validDates = profile.totalCount - profile.nullCount - stats.invalidCount;
  const timelineData = calculateTimelineData(profile.sampleValues);

  return (
    <div className={styles.datetimeAnalysis}>
      {/* Time Range */}
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>
          {t('dataExplorer.analysis.datetime.range')}
        </h4>
        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="dataPoints">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.datetime.totalRecords')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{profile.totalCount}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="earliestDate">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.datetime.earliest')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{formatDate(stats.minDate)}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="latestDate">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.datetime.latest')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{formatDate(stats.maxDate)}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="dateRange">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.datetime.timeSpan')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{timeSpan}</span>
          </div>
        </div>
      </div>

      {/* Frequency Analysis */}
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>
          {t('dataExplorer.analysis.datetime.frequency')}
        </h4>
        <div className={styles.frequencyStats}>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="recordsPerDay">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.datetime.recordsPerDay')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{calculateRecordsPerDay(validDates, stats.minDate, stats.maxDate)}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="avgTimeGap">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.datetime.avgGap')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{calculateAverageGap(stats.minDate, stats.maxDate, validDates, t)}</span>
          </div>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="duplicateDates">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.datetime.duplicates')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>
              {profile.totalCount - profile.uniqueCount > 0 ? t('dataExplorer.analysis.datetime.yes') : t('dataExplorer.analysis.datetime.no')}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>{t('dataExplorer.analysis.datetime.timeline')}</h4>
        <div className={styles.timeline}>
          {timelineData.map((period, index) => (
            <div key={index} className={styles.timelinePeriod}>
              <div className={styles.periodLabel}>{period.label}</div>
              <div className={styles.periodBar}>
                <div
                  className={styles.periodBarFill}
                  style={{
                    width: `${(period.count / Math.max(...timelineData.map(p => p.count))) * 100}%`
                  }}
                />
              </div>
              <div className={styles.periodCount}>{period.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Most Active Periods */}
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>
          {t('dataExplorer.analysis.datetime.topYears')}
        </h4>
        <div className={styles.activePeriods}>
          {getTopYears(profile.sampleValues, 5).map((year, index) => (
            <div key={index} className={styles.periodItem}>
              <span className={styles.periodRank}>{index + 1}</span>
              <span className={styles.periodName}>{year.year}</span>
              <span className={styles.periodCount}>{year.count} {t('dataExplorer.analysis.datetime.records')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Format Information */}
      <div className={styles.analysisGroup}>
        <h4 className={styles.groupTitle}>{t('dataExplorer.analysis.datetime.formatInfo')}</h4>
        <div className={styles.formatInfo}>
          <div className={styles.stat}>
            <AnalyticsTooltip metricKey="dateFormat">
              <span className={styles.statLabel}>{t('dataExplorer.analysis.datetime.detectedFormat')}</span>
            </AnalyticsTooltip>
            <span className={styles.statValue}>{stats.parseFormat}</span>
          </div>
          {stats.timezone && (
            <div className={styles.stat}>
              <AnalyticsTooltip metricKey="timezone">
                <span className={styles.statLabel}>{t('dataExplorer.analysis.datetime.timezone')}</span>
              </AnalyticsTooltip>
              <span className={styles.statValue}>{stats.timezone}</span>
            </div>
          )}
          {stats.hasInvalid && (
            <div className={styles.stat}>
              <AnalyticsTooltip metricKey="invalidDates">
                <span className={styles.statLabel}>{t('dataExplorer.analysis.datetime.invalidDates')}</span>
              </AnalyticsTooltip>
              <span className={styles.statValue}>{stats.invalidCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function calculateTimeSpan(minDate: Date, maxDate: Date, t: any): string {
  const diffTime = Math.abs(maxDate.getTime() - minDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) {
    return `${diffDays} ${t('dataExplorer.analysis.datetime.days')}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${t('dataExplorer.analysis.datetime.months')}`;
  } else {
    const years = Math.floor(diffDays / 365);
    const remainingDays = diffDays % 365;
    const months = Math.floor(remainingDays / 30);
    return `${years} ${t('dataExplorer.analysis.datetime.years')}${months > 0 ? `, ${months} ${t('dataExplorer.analysis.datetime.months')}` : ''}`;
  }
}

function calculateRecordsPerDay(validDates: number, minDate: Date, maxDate: Date): string {
  const diffTime = Math.abs(maxDate.getTime() - minDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return validDates.toString();
  
  const recordsPerDay = validDates / diffDays;
  return recordsPerDay < 1 ? recordsPerDay.toFixed(2) : Math.round(recordsPerDay).toString();
}

function calculateAverageGap(minDate: Date, maxDate: Date, validDates: number, t: any): string {
  if (validDates <= 1) return '—';
  
  const totalTime = maxDate.getTime() - minDate.getTime();
  const avgGapMs = totalTime / (validDates - 1);
  const avgGapDays = avgGapMs / (1000 * 60 * 60 * 24);
  
  if (avgGapDays < 1) {
    const hours = Math.round(avgGapMs / (1000 * 60 * 60));
    return `${hours}h`;
  } else if (avgGapDays < 30) {
    return `${Math.round(avgGapDays)} ${t('dataExplorer.analysis.datetime.days')}`;
  } else {
    const months = Math.round(avgGapDays / 30);
    return `${months} ${t('dataExplorer.analysis.datetime.months')}`;
  }
}

function calculateTimelineData(sampleValues: any[]) {
  const yearCounts = new Map<number, number>();
  
  sampleValues.forEach(value => {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
    }
  });
  
  return Array.from(yearCounts.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, count]) => ({
      label: year.toString(),
      count
    }));
}

function getTopYears(sampleValues: any[], limit: number) {
  const yearCounts = new Map<number, number>();
  
  sampleValues.forEach(value => {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
    }
  });
  
  return Array.from(yearCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([year, count]) => ({ year: year.toString(), count }));
}