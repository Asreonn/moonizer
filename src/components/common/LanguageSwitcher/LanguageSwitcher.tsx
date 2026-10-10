import { useLanguage } from '../../../core/i18n/LanguageProvider';
import styles from './LanguageSwitcher.module.css';

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as 'en' | 'tr';
    setLanguage(newLang);
  };

  return (
    <div className={styles.languageSwitcher}>
      <select value={language} onChange={handleLanguageChange}>
        <option value="en">English</option>
        <option value="tr">Türkçe</option>
      </select>
    </div>
  );
};
