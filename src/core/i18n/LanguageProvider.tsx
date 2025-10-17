import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

type Language = 'en' | 'tr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simple modular translation loader
class SimpleTranslationLoader {
  private cache: Map<string, any> = new Map();

  async loadLanguage(language: Language): Promise<any> {
    if (this.cache.has(language)) {
      return this.cache.get(language);
    }

    const translations = await this.loadAllModules(language);
    this.cache.set(language, translations);
    return translations;
  }

  private async loadAllModules(language: Language): Promise<any> {
    console.log('🔥 Loading translations for language:', language);
    const translations: any = {};
    
    // Core modules that should always exist
    const coreModules = [
      'app',
      'home',
      'nav', 
      'errors',
      'panels',
      'buttons',
      'settings',
      'dataset',
      'placeholders',
      'dataView',
      'dataExplorer',
      'analytics',
      'table',
      'data',
      'dialog',
      'toast',
      'popover'
    ];

    // Inspector modules
    const inspectorModules = [
      'inspector-core',
      'inspector-actions'
    ];

    // Load core modules
    for (const module of coreModules) {
      try {
        const moduleData = await import(`../../locales/${language}/${module}.json`);
        translations[module] = moduleData.default || moduleData;
      } catch (error) {
        console.warn(`❌ Module ${module} not found for language ${language}:`, error);
        translations[module] = {};
      }
    }

    // Load inspector modules and merge them into inspector namespace
    translations.inspector = {};
    for (const module of inspectorModules) {
      try {
        const moduleData = await import(`../../locales/${language}/${module}.json`);
        // Merge module content directly into inspector namespace
        Object.assign(translations.inspector, moduleData.default || moduleData);
        console.log(`✅ Loaded inspector module: ${module}`);
      } catch (error) {
        console.warn(`❌ Inspector module ${module} not found for language ${language}:`, error);
      }
    }

    return translations;
  }
}

const translationLoader = new SimpleTranslationLoader();

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');
  const [translations, setTranslations] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations on mount and when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        const loadedTranslations = await translationLoader.loadLanguage(language);
        console.log('🌍 Translations loaded:', Object.keys(loadedTranslations));
        console.log('🌍 Inspector keys:', loadedTranslations.inspector ? Object.keys(loadedTranslations.inspector) : 'No inspector');
        setTranslations(loadedTranslations);
      } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error);
        // Fallback to empty object to prevent crashes
        setTranslations({});
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [language]);
  
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, params?: Record<string, any>): any => {
    if (isLoading) {
      return key; // Return key while loading
    }

    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    let result = value || key;
    
    if (params?.returnObjects && typeof result === 'object') {
      return result;
    }

    // Ensure result is always a string
    if (typeof result === 'object') {
      console.warn(`Translation key "${key}" returned an object:`, result);
      return key; // Return the key as fallback
    }
    
    result = String(result);
    
    // Handle template interpolation like {{variable}}
    if (params && typeof result === 'string') {
      result = result.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match;
      });
    }
    
    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}