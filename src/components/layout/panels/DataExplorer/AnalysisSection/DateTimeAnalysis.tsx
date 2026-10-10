import { useMemo } from 'react';
import { useLanguage } from '../../../../../core/i18n/LanguageProvider';
import styles from './AnalysisSection.module.css';
import statStyles from './StatisticCard.module.css';

interface DateTimeAnalysisProps {
  data: any[];
  columnName: string;
}

export function DateTimeAnalysis({ data }: DateTimeAnalysisProps) {
  const { t } = useLanguage();
  
  const analysis = useMemo(() => {
    const dates = data.map(d => new Date(d)).filter(date => !isNaN(date.getTime()));
    
    if (dates.length === 0) return null;
    
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
    const minDate = sortedDates[0];
    const maxDate = sortedDates[sortedDates.length - 1];
    const dateRange = maxDate.getTime() - minDate.getTime();
    const rangeDays = Math.floor(dateRange / (1000 * 60 * 60 * 24));
    
    // Time span analysis
    const spanYears = rangeDays / 365.25;
    const spanMonths = rangeDays / 30.44;
    
    // Distribution by time units
    const yearCounts: Record<number, number> = {};
    const monthCounts: Record<number, number> = {};
    const dayOfWeekCounts: Record<number, number> = {};
    const hourCounts: Record<number, number> = {};
    
    dates.forEach(date => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const dayOfWeek = date.getDay();
      const hour = date.getHours();
      
      yearCounts[year] = (yearCounts[year] || 0) + 1;
      monthCounts[month] = (monthCounts[month] || 0) + 1;
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    // Most/least common periods
    const yearEntries = Object.entries(yearCounts).map(([year, count]) => ({ period: year, count }));
    const monthEntries = Object.entries(monthCounts).map(([month, count]) => ({ 
      period: new Date(2000, parseInt(month), 1).toLocaleString('default', { month: 'long' }), 
      count 
    }));
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayEntries = Object.entries(dayOfWeekCounts).map(([day, count]) => ({ 
      period: dayNames[parseInt(day)], 
      count 
    }));
    
    // Sort by count
    yearEntries.sort((a, b) => b.count - a.count);
    monthEntries.sort((a, b) => b.count - a.count);
    dayEntries.sort((a, b) => b.count - a.count);
    
    // Frequency analysis
    const avgDaysPerRecord = rangeDays / dates.length;
    const recordsPerDay = dates.length / rangeDays;
    
    // Gaps and clustering
    const gaps: number[] = [];
    for (let i = 1; i < sortedDates.length; i++) {
      const gapDays = Math.floor((sortedDates[i].getTime() - sortedDates[i-1].getTime()) / (1000 * 60 * 60 * 24));
      gaps.push(gapDays);
    }
    
    const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
    const maxGap = gaps.length > 0 ? Math.max(...gaps) : 0;
    const minGap = gaps.length > 0 ? Math.min(...gaps) : 0;
    
    // Seasonality detection (simple)
    const hasDuplicateDates = new Set(dates.map(d => d.toDateString())).size < dates.length;
    
    return {
      totalDates: dates.length,
      minDate,
      maxDate,
      rangeDays,
      spanYears,
      spanMonths,
      avgDaysPerRecord,
      recordsPerDay,
      avgGap,
      maxGap,
      minGap,
      hasDuplicateDates,
      topYears: yearEntries.slice(0, 5),
      topMonths: monthEntries.slice(0, 5),
      topDays: dayEntries.slice(0, 7),
      yearCount: Object.keys(yearCounts).length,
      monthCount: Object.keys(monthCounts).length
    };
  }, [data]);
  
  if (!analysis) {
    return (
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.datetime.title')}</h3>
        </div>
        <div className={styles.cardContent}>
          <p>{t('dataExplorer.analysis.datetime.noValidData')}</p>
        </div>
      </div>
    );
  }
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const getTimeSpanDescription = () => {
    if (analysis.spanYears >= 1) {
      return `${analysis.spanYears.toFixed(1)} ${t('dataExplorer.analysis.datetime.years')}`;
    } else if (analysis.spanMonths >= 1) {
      return `${analysis.spanMonths.toFixed(1)} ${t('dataExplorer.analysis.datetime.months')}`;
    } else {
      return `${analysis.rangeDays} ${t('dataExplorer.analysis.datetime.days')}`;
    }
  };
  
  return (
    <div className={styles.cardGrid}>
      {/* Time Range */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.datetime.range')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.statGrid}>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.datetime.totalRecords')}</span>
              <span className={statStyles.statValue}>{analysis.totalDates.toLocaleString()}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.datetime.earliest')}</span>
              <span className={statStyles.statValue}>{formatDate(analysis.minDate)}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.datetime.latest')}</span>
              <span className={statStyles.statValue}>{formatDate(analysis.maxDate)}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.datetime.timeSpan')}</span>
              <span className={statStyles.statValue}>{getTimeSpanDescription()}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Frequency Analysis */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.datetime.frequency')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.statGrid}>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.datetime.recordsPerDay')}</span>
              <span className={statStyles.statValue}>{analysis.recordsPerDay.toFixed(2)}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.datetime.avgGap')}</span>
              <span className={statStyles.statValue}>{analysis.avgGap.toFixed(1)} {t('dataExplorer.analysis.datetime.days')}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.datetime.maxGap')}</span>
              <span className={statStyles.statValue}>{analysis.maxGap} {t('dataExplorer.analysis.datetime.days')}</span>
            </div>
            <div className={statStyles.statItem}>
              <span className={statStyles.statLabel}>{t('dataExplorer.analysis.datetime.duplicates')}</span>
              <span className={statStyles.statValue}>
                {analysis.hasDuplicateDates ? t('dataExplorer.analysis.datetime.yes') : t('dataExplorer.analysis.datetime.no')}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Years */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.datetime.topYears')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.categoryList}>
            {analysis.topYears.map((item, index) => (
              <div key={index} className={statStyles.categoryItem}>
                <div className={statStyles.categoryHeader}>
                  <span className={statStyles.categoryValue}>{item.period}</span>
                  <span className={statStyles.categoryCount}>{item.count}</span>
                </div>
                <div className={statStyles.categoryBar}>
                  <div 
                    className={statStyles.categoryBarFill}
                    style={{ 
                      width: `${(item.count / analysis.totalDates) * 100}%`,
                      backgroundColor: `hsl(${(index * 60) % 360}, 60%, 60%)`
                    }}
                  />
                </div>
                <span className={statStyles.categoryPercent}>
                  {((item.count / analysis.totalDates) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Top Days of Week */}
      <div className={styles.analysisCard}>
        <div className={styles.cardHeader}>
          <h3>{t('dataExplorer.analysis.datetime.topDays')}</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={statStyles.categoryList}>
            {analysis.topDays.map((item, index) => (
              <div key={index} className={statStyles.categoryItem}>
                <div className={statStyles.categoryHeader}>
                  <span className={statStyles.categoryValue}>{item.period}</span>
                  <span className={statStyles.categoryCount}>{item.count}</span>
                </div>
                <div className={statStyles.categoryBar}>
                  <div 
                    className={statStyles.categoryBarFill}
                    style={{ 
                      width: `${(item.count / analysis.totalDates) * 100}%`,
                      backgroundColor: `hsl(${(index * 51) % 360}, 60%, 60%)`
                    }}
                  />
                </div>
                <span className={statStyles.categoryPercent}>
                  {((item.count / analysis.totalDates) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}