import { useLanguage } from './use-language';
import { translations } from '@/i18n/translations';

type TranslationsType = typeof translations.en;

// This hook provides access to the translations based on the current language
export const useTranslations = () => {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage.code as keyof typeof translations] || translations.en;

  return { t };
}