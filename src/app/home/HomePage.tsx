
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatasetStore } from '../../state/useDatasetStore';
import { loadCsv } from '../../core/dataset/loadCsv';
import styles from './HomePage.module.css';

import { useLanguage } from '../../core/i18n/LanguageProvider';
import { featureIcons } from './featureIcons';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher/LanguageSwitcher';

// --- Main Dropzone Component ---

const FileDropzone = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const navigate = useNavigate();
  const { addDataset, loadSampleDataset, setLoading, setError } = useDatasetStore();
  const { t } = useLanguage();

  const handleFileLoad = async (file: File) => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const result = await loadCsv(file);
      addDataset({
        name: file.name,
        fileName: file.name,
        rows: result.rows,
        columns: result.columns.length,
        size: file.size,
        isPreloaded: false,
        data: result.data,
        columnNames: result.columns,
        hasHeaders: result.hasHeaders,
      });
      navigate('/workspace');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load CSV file.';
      setError(message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSampleLoad = async (type: 'sales' | 'customers') => {
    setLoading(true);
    await loadSampleDataset(type);
    setLoading(false);
    navigate('/workspace');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileLoad(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragOver(true);
    } else if (e.type === 'dragleave') {
      setIsDragOver(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileLoad(e.target.files[0]);
    }
  };

  return (
    <div className={styles.dropzoneContainer}>
      <div
        className={`${styles.dropzone} ${isDragOver ? styles.dragOver : ''}`}
        onDrop={handleDrop}
        onDragEnter={handleDragEvents}
        onDragOver={handleDragEvents}
        onDragLeave={handleDragEvents}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <div className={styles.dropzoneIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 14.8999V16.8999C4 18.0045 4.89543 18.8999 6 18.8999H18C19.1046 18.8999 20 18.0045 20 16.8999V14.8999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 3L12 15M12 15L8 11M12 15L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p className={styles.dropzoneText}>
          <strong>{t('home.dropzone.dragAndDrop')}</strong> {t('home.dropzone.clickToSelect')}
        </p>
        <input type="file" id="fileInput" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleFileSelect} />
      </div>
      <div className={styles.sampleDataContainer}>
        <p>{t('home.dropzone.noFile')}</p>
        <div>
          <button onClick={() => handleSampleLoad('sales')}>{t('home.dropzone.sampleSales')}</button>
          <button onClick={() => handleSampleLoad('customers')}>{t('home.dropzone.sampleCustomers')}</button>
        </div>
      </div>
      <div className={styles.authorContainer}>
        <a 
          href="https://github.com/asoron" 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.githubLink}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
            e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.setProperty('--x', '50%');
            e.currentTarget.style.setProperty('--y', '50%');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          <span className={styles.githubLinkText}>{t('home.dropzone.author')}</span>
        </a>
      </div>
    </div>
  );
};

// --- Main Page Component ---

const HomePage = () => {
  const { t } = useLanguage();
  const homeFeatures = t('home.features', { returnObjects: true }) as any;

  return (
    <div className={styles.container}>
      <LanguageSwitcher />
      <div className={styles.gradientGlow}></div>
      <div className={`${styles.gradientGlow} ${styles.glow2}`}></div>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}><span className={styles.shimmer}>MOON</span>IZER</h1>
            <p className={styles.subtitle}>
              {t('home.hero.subtitle')} <span className={styles.highlight}>{t('home.hero.highlight')}</span>
            </p>
            <FileDropzone />
          </div>
        </section>

        <section className={styles.featuresSection}>
          <div className={styles.sectionIntro}>
            {t('home.features.tag') && <span className={styles.sectionTag}>{t('home.features.tag')}</span>}
            <h2 className={styles.sectionTitle}>{t('home.features.title')}</h2>
            <p className={styles.sectionDescription}>{t('home.features.subtitle')}</p>
          </div>

          <div className={styles.featureCluster}>
            {homeFeatures.sections?.map((section: any) => (
              <article key={section.title} className={styles.featureGroup} data-color={section.color}>
                <header className={styles.featureGroupHeader}>
                  <span className={styles.featureGroupBadge}>{section.title}</span>
                </header>
                <div className={styles.featureGrid}>
                  {section.features.map((feature: any) => (
                    <div key={feature.title} className={styles.featureCard}>
                      <div className={styles.featureCardIcon}>
                        {featureIcons[feature.icon]}
                      </div>
                      <h3 className={styles.featureCardTitle}>{feature.title}</h3>
                      <p className={styles.featureCardDescription}>{feature.description}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.privacySection}>
            <div className={styles.privacyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 className={styles.sectionTitle}>{t('home.privacy.title')}</h2>
            <p className={styles.sectionDescription}>
              {t('home.privacy.description')}
            </p>
        </section>

      </main>

      <footer className={styles.footer}>
        <p dangerouslySetInnerHTML={{ __html: t('home.footer.copyright') }}></p>
        <a href="https://github.com/asoron" target="_blank" rel="noopener noreferrer" className={styles.githubLink}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          Asreonn
        </a>
      </footer>
    </div>
  );
};

export default HomePage;
