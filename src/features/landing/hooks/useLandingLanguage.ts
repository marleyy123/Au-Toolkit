import { useLanguage } from '../../../context/LanguageContext';

export function useLandingLanguage() {
  const context = useLanguage();
  return { ...context, copy: (id: string, en: string) => context.language === 'id' ? id : en };
}
